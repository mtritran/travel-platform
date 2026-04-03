import React, { useState } from 'react';
import { Star, X, MessageSquare, Send } from 'lucide-react';
import api from '../services/api';
import { ENDPOINTS } from '../constants/endpoints';
import type { Booking, TourRequest } from '../types';

interface ReviewModalProps {
  booking?: Booking;
  tourRequest?: TourRequest;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ booking, tourRequest, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const title = booking ? booking.tourTitle : (tourRequest ? tourRequest.title : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(ENDPOINTS.REVIEW.CREATE, {
        bookingId: booking?.id,
        tourRequestId: tourRequest?.id,
        rating,
        comment
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi gửi đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div className="glass-card" style={{ 
        maxWidth: '500px', 
        width: '100%', 
        padding: '32px',
        position: 'relative',
        animation: 'modalSlideUp 0.3s ease-out'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Star size={32} color="var(--primary)" fill="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>Đánh giá chuyến đi</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Hãy chia sẻ trải nghiệm của bạn về tour <strong>{title}</strong></p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Star Rating */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Bạn chấm bao nhiêu sao?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.2s' }}
                >
                  <Star 
                    size={40} 
                    color={(hover || rating) >= star ? '#fbbf24' : 'var(--text-secondary)'} 
                    fill={(hover || rating) >= star ? '#fbbf24' : 'transparent'} 
                    style={{ transform: (hover || rating) === star ? 'scale(1.2)' : 'scale(1)' }}
                  />
                </button>
              ))}
            </div>
            <p style={{ marginTop: '8px', fontWeight: '800', color: '#fbbf24' }}>
                {rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Kém' : 'Rất tệ'}
            </p>
          </div>

          {/* Comment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} /> Nhận xét chi tiết
            </label>
            <textarea
              required
              placeholder="Chia sẻ cảm nhận của bạn về hướng dẫn viên, hành trình, đồ ăn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%',
                height: '120px',
                padding: '16px',
                borderRadius: '20px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                resize: 'none',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              style={{ flex: 1, padding: '14px' }}
            >
              Để sau
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ flex: 2, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? 'Đang gửi...' : <><Send size={18} /> Gửi đánh giá</>}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ReviewModal;
