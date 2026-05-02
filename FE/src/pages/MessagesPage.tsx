import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { p2pChatService } from '../services/P2PChatService';
import { MessageSquare, Send, User as UserIcon, Loader2, Search, Trash2, AlertTriangle } from 'lucide-react';
import type { ApiResponse } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedPartnerRef = useRef<any>(null);
  useEffect(() => {
    selectedPartnerRef.current = selectedPartner;
  }, [selectedPartner]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    api.get<ApiResponse<any[]>>('/chat/conversations')
      .then(res => {
        setConversations(res.data.result || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load conversations', err);
        setLoading(false);
      });
  }, [user]);

  // WebSocket - stable connection
  useEffect(() => {
    if (!user) return;
    p2pChatService.connect(user.email, (newMsg: any) => {
      if (!newMsg?.user || !newMsg?.recipient) return;
      const currentPartner = selectedPartnerRef.current;

      setConversations(prev => {
        const partnerId = newMsg.user.email === user.email ? newMsg.recipient?.id : newMsg.user?.id;
        const index = prev.findIndex(c => {
          const cPartnerId = c.user?.email === user.email ? c.recipient?.id : c.user?.id;
          return cPartnerId === partnerId;
        });
        if (index > -1) {
          const updated = [...prev];
          updated.splice(index, 1);
          return [newMsg, ...updated];
        }
        return [newMsg, ...prev];
      });

      if (currentPartner) {
        const senderId = newMsg.user?.email === user.email ? newMsg.recipient?.id : newMsg.user?.id;
        if (senderId === currentPartner.id) {
          setMessages(prev => {
            const isFromMe = newMsg.user?.email === user.email;
            if (isFromMe) {
              const tempIndex = prev.findIndex(m =>
                m.id?.startsWith('temp-') && m.content === newMsg.content
              );
              if (tempIndex !== -1) {
                const updated = [...prev];
                updated[tempIndex] = newMsg;
                return updated;
              }
            }
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      }
    });
    return () => p2pChatService.disconnect();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = (partner: any) => {
    setSelectedPartner(partner);
    setChatLoading(true);
    api.get<ApiResponse<any[]>>(`/chat/history/${partner.id}`)
      .then(res => {
        setMessages(res.data.result || []);
        setChatLoading(false);
      })
      .catch(err => {
        console.error('Failed to load history', err);
        setChatLoading(false);
      });
  };

  const send = () => {
    if (!input.trim() || !user || !selectedPartner) return;
    const content = input.trim();
    p2pChatService.sendMessage(user.email, selectedPartner.id, content);
    setMessages(prev => [...prev, {
      id: 'temp-' + Date.now(),
      content,
      user: { email: user.email, fullName: user.fullName },
      createdAt: new Date().toISOString()
    }]);
    setInput('');
  };

  const confirmDelete = (partner: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(partner);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/chat/conversations/${deleteTarget.id}`);
      setConversations(prev => prev.filter(c => {
        const partner = c.user?.email === user?.email ? c.recipient : c.user;
        return partner?.id !== deleteTarget.id;
      }));
      if (selectedPartner?.id === deleteTarget.id) {
        setSelectedPartner(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)' }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', height: '100%' }}>
        <div className="messages-container">
          {/* Sidebar */}
          <div className="messages-sidebar">
            <div className="sidebar-header">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare size={20} /> Trò chuyện
              </h1>
              <div className="search-box">
                <Search size={16} className="text-gray-400" />
                <input placeholder="Tìm người dùng..." />
              </div>
            </div>
            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Chưa có hội thoại nào
                </div>
              ) : (
                conversations.map((conv, i) => {
                  const partner = conv.user?.email === user?.email ? conv.recipient : conv.user;
                  const isActive = selectedPartner?.id === partner?.id;
                  return (
                    <div
                      key={conv.id || i}
                      className={`conversation-item ${isActive ? 'active' : ''}`}
                      onClick={() => openChat(partner)}
                    >
                      <div className="partner-avatar">
                        {partner?.avatarUrl
                          ? <img src={partner.avatarUrl} alt="" />
                          : <UserIcon size={20} />}
                      </div>
                      <div className="conv-info">
                        <div className="conv-top">
                          <span className="partner-name">{partner?.fullName}</span>
                          <span className="conv-time">
                            {conv.createdAt
                              ? formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true, locale: vi })
                              : ''}
                          </span>
                        </div>
                        <div className="conv-preview">{conv.content}</div>
                      </div>
                      <button
                        className="conv-delete-btn"
                        onClick={(e) => confirmDelete(partner, e)}
                        title="Xóa cuộc trò chuyện"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="messages-content">
            {selectedPartner ? (
              <>
                <div className="chat-header">
                  <div className="partner-info">
                    <div className="partner-avatar small"><UserIcon size={16} /></div>
                    <span className="font-bold">{selectedPartner.fullName}</span>
                  </div>
                  <button
                    className="chat-header-delete-btn"
                    onClick={(e) => confirmDelete(selectedPartner, e)}
                    title="Xóa cuộc trò chuyện"
                  >
                    <Trash2 size={15} />
                    <span>Xóa hội thoại</span>
                  </button>
                </div>
                <div className="chat-messages-area">
                  {chatLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                      <Loader2 className="animate-spin" style={{ color: 'var(--primary)' }} />
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.user?.email === user?.email;
                      return (
                        <div key={msg.id || i} className={`msg-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                          <div className={`msg-bubble ${isMe ? 'me' : 'them'}`}>{msg.content}</div>
                          <span className="msg-time">
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-area">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Nhập nội dung tin nhắn..."
                  />
                  <button onClick={send} disabled={!input.trim()}>
                    <Send size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="chat-placeholder">
                <MessageSquare size={64} style={{ color: '#e2e8f0', marginBottom: '16px' }} />
                <p>Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <div className="delete-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3>Xóa cuộc trò chuyện?</h3>
            <p>
              Toàn bộ tin nhắn với <strong>{deleteTarget.fullName}</strong> sẽ bị xóa
              vĩnh viễn và không thể khôi phục.
            </p>
            <div className="delete-modal-actions">
              <button
                className="delete-modal-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                className="delete-modal-confirm"
                onClick={executeDelete}
                disabled={deleting}
              >
                {deleting
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Trash2 size={15} />}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MessagesPage;
