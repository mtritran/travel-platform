import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createStompClient } from '../services/websocket';
import { Bell, CheckCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Notification {
  id: string;
  type: string;
  message: string;
  bookingId?: string;
  requestId?: string;
  createdAt: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const onMessage = (payload: any) => {
       const newNotif: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          ...payload,
          createdAt: Date.now()
       };
       setNotifications(prev => [newNotif, ...prev]);
       setToasts(prev => [...prev, newNotif]);
       
       // Auto hide toast after 5s
       setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newNotif.id));
       }, 5000);
    };

    const stompClient = createStompClient(() => {}, onMessage, user.id);
    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user?.id]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount: notifications.length, clearNotifications }}>
      {children}
      
      {/* Toast Overlay */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              style={{ 
                 background: 'white', 
                 borderRadius: '16px', 
                 padding: '16px', 
                 boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                 border: '1px solid var(--glass-border)',
                 minWidth: '320px',
                 maxWidth: '400px',
                 display: 'flex',
                 gap: '12px',
                 alignItems: 'flex-start',
                 pointerEvents: 'auto'
              }}
            >
              <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  background: toast.type.includes('BOOKING') ? 'var(--primary-light)' : 'var(--success-light)',
                  color: toast.type.includes('BOOKING') ? 'var(--primary)' : 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
              }}>
                {toast.type.includes('BOOKING') ? <Bell size={20} /> : <CheckCircle size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Thông báo mới</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{toast.message}</p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
