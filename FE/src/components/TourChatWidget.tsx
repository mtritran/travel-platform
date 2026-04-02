import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  ChevronDown,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import api from '../services/api';
import type { ApiResponse, Tour, TourChatResponse } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import { formatVND } from '../utils/format';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  tours?: Tour[];
  ts: Date;
}

const SUGGESTIONS = [
  'Có tour nào đang mở không?',
  'Tour nào phù hợp cho gia đình?',
  'Tour giá rẻ nhất là bao nhiêu?',
  'Có tour ở Đà Lạt không?',
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
        <Star size={11} fill="currentColor" />
        {tour.rating > 0 ? tour.rating.toFixed(1) : '5.0'}
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
}

const TourChatWidget: React.FC<TourChatWidgetProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  
  const setOpen = (val: boolean) => {
    if (isControlled) {
      if (!val && onClose) onClose();
    } else {
      setInternalOpen(val);
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Xin chào! Mình là trợ lý AI của Travel Platform 👋\nBạn muốn biết về tour nào? Hỏi mình nhé — mình sẽ gợi ý và bạn có thể nhấn vào tour để xem chi tiết!',
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: q, ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post<ApiResponse<TourChatResponse>>(ENDPOINTS.TOUR.CHAT, q, {
        headers: { 'Content-Type': 'text/plain' },
      });
      const data = res.data.result;
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: data.answer ?? 'Xin lỗi, mình chưa có câu trả lời lúc này.',
          tours: data.recommendedTours?.length ? data.recommendedTours : undefined,
          ts: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Ôi, có lỗi xảy ra rồi. Bạn thử lại sau nhé!',
          ts: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      {/* FAB - Only show if not controlled externally */}
      {!isControlled && (
        <button
          id="tour-chat-trigger"
          className="tour-chat-fab"
          onClick={() => setOpen(!open)}
          aria-label="Hỏi trợ lý AI"
          title="Hỏi trợ lý AI về tour"
        >
          {open ? <ChevronDown size={22} /> : <Sparkles size={22} />}
          {!open && <span className="tour-chat-fab-label">Hỏi AI</span>}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="tour-chat-panel" role="dialog" aria-label="Trợ lý AI tour">
          {/* Header */}
          <div className="tour-chat-header">
            <div className="tour-chat-header-left">
              <div className="tour-chat-avatar">
                <Bot size={18} />
              </div>
              <div>
                <p className="tour-chat-name">Trợ lý AI</p>
                <span className="tour-chat-status">
                  <span className="tour-chat-dot" />
                  Đang hoạt động
                </span>
              </div>
            </div>
            <button className="tour-chat-close" onClick={() => setOpen(false)} aria-label="Đóng">
              <X size={18} />
            </button>
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

                  {/* Recommended tour cards */}
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

          {/* Suggestion chips (only on first load) */}
          {messages.length <= 1 && (
            <div className="tour-chat-suggestions">
              {SUGGESTIONS.map((s) => (
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
