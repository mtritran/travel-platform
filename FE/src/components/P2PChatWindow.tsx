import React, { useEffect, useRef, useState } from 'react';
import { Send, X, Loader2, User as UserIcon, Wifi } from 'lucide-react';
import { p2pChatService } from '../services/P2PChatService';
import api from '../services/api';
import type { ApiResponse } from '../types';
import { useAuth } from '../context/AuthContext';

interface P2PChatWindowProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
  onMessageSent?: () => void;
}

const P2PChatWindow: React.FC<P2PChatWindowProps> = ({ recipientId, recipientName, onClose, onMessageSent }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [wsReady, setWsReady] = useState(false); // Trạng thái kết nối WebSocket
  const bottomRef = useRef<HTMLDivElement>(null);
  const ownedConnection = useRef(false);
  const userEmail = user?.email;

  useEffect(() => {
    if (!userEmail) return;

    // 1. Load lịch sử chat
    api.get<ApiResponse<any[]>>(`/chat/history/${recipientId}`)
      .then(res => {
        setMessages(res.data.result || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 2. Kết nối WebSocket
    // Nếu đã connected rồi (từ MessagesPage) thì dùng luôn
    if (p2pChatService.isConnected) {
      setWsReady(true);
      ownedConnection.current = false;
    } else {
      ownedConnection.current = true;
    }

    p2pChatService.connect(
      userEmail,
      // onMessage callback
      (newMsg: any) => {
        if (!newMsg?.user) return;
        const isFromTarget = newMsg.user?.email !== userEmail;
        const isFromMe = newMsg.user?.email === userEmail;

        if (isFromTarget || isFromMe) {
          setMessages(prev => {
            if (isFromMe) {
              const isDuplicate = prev.some(m =>
                m.content === newMsg.content &&
                Math.abs(new Date(m.createdAt || 0).getTime() - new Date(newMsg.createdAt || 0).getTime()) < 3000
              );
              if (isDuplicate) return prev;
            }
            return [...prev, newMsg];
          });
        }
      },
      // onConnected callback — đánh dấu sẵn sàng gửi
      () => setWsReady(true)
    );

    return () => {
      if (ownedConnection.current) {
        p2pChatService.disconnect();
        setWsReady(false);
      }
    };
  }, [recipientId, userEmail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !userEmail || !user || !wsReady) return;

    const content = input.trim();
    p2pChatService.sendMessage(userEmail, recipientId, content);

    // Optimistic UI
    setMessages(prev => [...prev, {
      id: 'temp-' + Date.now(),
      content,
      user: { email: userEmail, fullName: user.fullName },
      createdAt: new Date().toISOString()
    }]);
    setInput('');
    if (onMessageSent) onMessageSent();
  };

  if (!userEmail) return null;

  return (
    <div className="p2p-chat-window">
      <div className="p2p-chat-header">
        <div className="p2p-chat-user-info">
          <div className="p2p-chat-avatar">
            <UserIcon size={16} />
          </div>
          <div>
            <span className="p2p-chat-name">{recipientName}</span>
            {!wsReady && (
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                Đang kết nối...
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {wsReady && <Wifi size={14} style={{ color: '#22c55e' }} />}
          <button onClick={onClose} className="p2p-chat-close">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p2p-chat-messages">
        {loading ? (
          <div className="p2p-chat-loading">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          (messages || []).map((msg, i) => {
            const isMe = msg.user?.email === userEmail;
            return (
              <div key={msg.id || i} className={`p2p-chat-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                <div className={`p2p-chat-bubble ${isMe ? 'me' : 'them'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p2p-chat-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={wsReady ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
          className="p2p-chat-input"
          disabled={!wsReady}
        />
        <button onClick={send} className="p2p-chat-send" disabled={!input.trim() || !wsReady}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default P2PChatWindow;
