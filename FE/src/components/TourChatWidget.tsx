import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  ChevronDown,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import api from '../services/api';
import type { ApiResponse, Tour, TourChatResponse } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import { formatVND } from '../utils/format';
import { useLocation as useUserLocation } from '../context/LocationContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  tours?: Tour[];
  ts: string; // ISO string for JSON serialization
}

const SUGGESTIONS = [
  'Có tour nào đang mở không?',
  'Tour nào phù hợp cho gia đình?',
  'Tour giá rẻ nhất là bao nhiêu?',
  'Có tour ở Đà Nẵng không?',
];

const SUPPORT_SUGGESTIONS = [
  'Chính sách hủy tour như thế nào?',
  'Mình đã đặt những tour nào?',
  'Làm sao để được hoàn tiền?',
  'Quy định về đặt cọc tour?',
];

// ─── Mini Tour Card ────────────────────────────────────────────────────
const MiniTourCard: React.FC<{ tour: Tour; onClick: () => void }> = ({ tour, onClick }) => (
  <button className="chat-tour-card" onClick={onClick} type="button">
    <div className="chat-tour-card-img-wrap">
      <img
        src={
          tour.imageUrl ||
          'https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&q=80&w=400'
        }
        alt={tour.title}
        className="chat-tour-card-img"
      />
      <span className="chat-tour-card-rating">
        <Star size={11} fill={tour.reviewCount > 0 ? 'currentColor' : 'transparent'} />
        {tour.reviewCount > 0 ? (tour.rating || 0).toFixed(1) : 'Chưa có'}
      </span>
    </div>
    <div className="chat-tour-card-body">
      <p className="chat-tour-card-location">
        <MapPin size={11} />
        {tour.locationName}
      </p>
      <p className="chat-tour-card-title">{tour.title}</p>
      <p className="chat-tour-card-price">{formatVND(tour.price)}<span>/người</span></p>
    </div>
  </button>
);

// ─── Main Widget ───────────────────────────────────────────────────────
interface TourChatWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'MARKETPLACE' | 'SUPPORT';
}

const TourChatWidget: React.FC<TourChatWidgetProps> = ({ isOpen, onClose, mode = 'MARKETPLACE' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { location: userLocation } = useUserLocation();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;

  const storageKey = 'travelx_chat_history_global';

  const getWelcomeMessage = (): Message => {
    if (mode === 'SUPPORT') {
      return {
        id: 'welcome-support',
        role: 'assistant',
        text: 'Chào bạn! Mình là trợ lý hỗ trợ TravelX 👋\nBạn cần giải đáp về chính sách hủy tour, hoàn tiền hay muốn xem lại lịch sử đặt chỗ của mình?',
        ts: new Date().toISOString(),
      };
    }
    return {
      id: 'welcome-marketplace',
      role: 'assistant',
      text: 'Xin chào! Mình là trợ lý AI của TravelX 👋\nBạn muốn biết về tour nào? Hỏi mình nhé — mình sẽ gợi ý và bạn có thể nhấn vào tour để xem chi tiết!',
      ts: new Date().toISOString(),
    };
  };

  const setOpen = (val: boolean) => {
    if (isControlled) {
      if (!val && onClose) onClose();
    } else {
      setInternalOpen(val);
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!localStorage.getItem('token');

  // Load history on mount
  useEffect(() => {
    const loadInitialHistory = async () => {
      if (isLoggedIn) {
        try {
          const res = await api.get<ApiResponse<any[]>>('/tours/chat-history');
          const dbHistory = res.data.result;
          if (dbHistory && dbHistory.length > 0) {
            const mapped = dbHistory.map(m => ({
              id: m.id,
              role: m.role.toLowerCase() === 'user' ? 'user' : 'assistant',
              text: m.content,
              ts: m.createdAt
            } as Message));
            setMessages(mapped);
            return;
          }
        } catch (err) {
          console.error('[ChatHistory] Failed to load from DB', err);
        }
      }

      // Fallback or LocalStorage for guests
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Message[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
      setMessages([getWelcomeMessage()]);
    };

    loadInitialHistory();
  }, [isLoggedIn, storageKey]);

  useEffect(() => {
    // Only save to localStorage for guests
    if (!isLoggedIn) {
      const toSave = messages.slice(-50);
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    }
  }, [messages, storageKey, isLoggedIn]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: q,
      ts: new Date().toISOString(),
    };

    // Prepare history for AI (take last 6 messages to keep it efficient)
    const historyForAi = messages
      .filter(m => m.id !== 'welcome-marketplace' && m.id !== 'welcome-support') // Skip welcome messages
      .slice(-6)
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        text: m.text
      }));

    // Extract context
    const currentPath = location.pathname;
    const tourIdMatch = currentPath.match(/\/tours\/([^/]+)/);
    const contextTourId = tourIdMatch ? tourIdMatch[1] : undefined;

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (mode === 'SUPPORT') {
        const res = await api.post<ApiResponse<string>>('/support/chat', {
          question: q,
          history: historyForAi
        });
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: res.data.result,
            ts: new Date().toISOString(),
          },
        ]);
      } else {
        const res = await api.post<ApiResponse<TourChatResponse>>(ENDPOINTS.TOUR.CHAT, {
          question: q,
          latitude: userLocation?.latitude ?? null,
          longitude: userLocation?.longitude ?? null,
          address: userLocation?.address ?? null,
          history: historyForAi,
          contextTourId,
          currentPath
        });
        const data = res.data.result;
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: data.answer ?? 'Xin lỗi, mình chưa có câu trả lời lúc này.',
            tours: data.recommendedTours?.length ? data.recommendedTours : undefined,
            ts: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Ôi, có lỗi xảy ra rồi. Bạn thử lại sau nhé!',
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (isLoggedIn) {
      try {
        await api.delete('/tours/chat-history');
      } catch (err) {
        console.error('[ChatHistory] Failed to clear DB history', err);
      }
    } else {
      localStorage.removeItem(storageKey);
    }
    
    const welcome = getWelcomeMessage();
    setMessages([{ ...welcome, ts: new Date().toISOString() }]);
    setShowClearConfirm(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isNewSession = messages.length <= 1;
  const currentSuggestions = mode === 'SUPPORT' ? SUPPORT_SUGGESTIONS : SUGGESTIONS;

  return (
    <>
      {/* FAB */}
      {!isControlled && (
        <button
          id={`tour-chat-trigger-${mode.toLowerCase()}`}
          className="tour-chat-fab"
          onClick={() => setOpen(!open)}
          aria-label="Hỏi trợ lý AI"
          title={mode === 'SUPPORT' ? "Hỏi về chính sách & hỗ trợ" : "Hỏi trợ lý AI về tour"}
        >
          {open ? <ChevronDown size={22} /> : <Bot size={22} />}
          {!open && <span className="tour-chat-fab-label">Hỏi trợ lý AI</span>}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="tour-chat-panel" role="dialog" aria-label={mode === 'SUPPORT' ? 'Trợ lý hỗ trợ' : 'Trợ lý AI tour'}>
          {/* Header */}
          <div className="tour-chat-header">
            <div className="tour-chat-header-left">
              <div className="tour-chat-avatar">
                <Bot size={18} />
              </div>
              <div>
                <p className="tour-chat-name">{mode === 'SUPPORT' ? 'Hỗ trợ TravelX' : 'Trợ lý AI'}</p>
                <span className="tour-chat-status">
                  <span className="tour-chat-dot" />
                  Đang hoạt động
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {messages.length > 1 && (
                <div style={{ position: 'relative' }}>
                  {showClearConfirm ? (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '8px',
                      background: 'white',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      padding: '16px',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Xóa lịch sử chat?
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={handleClearHistory}
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--danger)',
                            color: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Xóa
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="tour-chat-close"
                      onClick={() => setShowClearConfirm(true)}
                      aria-label="Xóa lịch sử"
                      title="Xóa lịch sử chat"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}

              <button
                className="tour-chat-close"
                onClick={() => { setOpen(false); setShowClearConfirm(false); }}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="tour-chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`tour-chat-bubble-wrap ${msg.role === 'user' ? 'user' : 'assistant'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="tour-chat-bubble-avatar">
                    <Bot size={14} />
                  </div>
                )}
                <div className="tour-chat-msg-col">
                  <div className={`tour-chat-bubble ${msg.role}`}>
                    {msg.text.split('\n').map((line, i, arr) => (
                      <span key={i}>
                        {line}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted, #9ca3af)',
                    marginTop: '2px',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    paddingInline: '4px'
                  }}>
                    {formatTime(msg.ts)}
                  </span>

                  {msg.role === 'assistant' && msg.tours && msg.tours.length > 0 && (
                    <div className="chat-tour-cards">
                      {msg.tours.map((tour) => (
                        <MiniTourCard
                          key={tour.id}
                          tour={tour}
                          onClick={() => {
                            setOpen(false);
                            navigate(`/tours/${tour.id}`);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="tour-chat-bubble-wrap assistant">
                <div className="tour-chat-bubble-avatar">
                  <Bot size={14} />
                </div>
                <div className="tour-chat-bubble assistant tour-chat-typing">
                  <Loader2 size={15} className="tour-chat-spin" />
                  <span>Đang suy nghĩ...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          {isNewSession && (
            <div className="tour-chat-suggestions">
              {currentSuggestions.map((s) => (
                <button
                  key={s}
                  className="tour-chat-chip"
                  onClick={() => send(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="tour-chat-input-row">
            <input
              ref={inputRef}
              className="tour-chat-input"
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              maxLength={500}
            />
            <button
              className="tour-chat-send"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              aria-label="Gửi"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TourChatWidget;
