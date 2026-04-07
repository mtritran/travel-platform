import React, { useState } from 'react';
import { Star, X, MessageSquare, Send, Camera, Trash2 } from 'lucide-react';
import api from '../services/api';
import { ENDPOINTS } from '../constants/endpoints';
import type { Booking, TourRequest } from '../types';

interface ReviewModalProps {
  booking?: Booking;
  tourRequest?: TourRequest;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  booking,
  tourRequest,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const title = booking ? booking.tourTitle : tourRequest ? tourRequest.title : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    const requestData = {
      bookingId: booking?.id,
      tourRequestId: tourRequest?.id,
      rating,
      comment,
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(requestData)], {
        type: 'application/json',
      })
    );

    if (files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    try {
      await api.post(ENDPOINTS.REVIEW.CREATE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi gửi đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabel =
    rating === 5
      ? 'Tuyệt vời!'
      : rating === 4
        ? 'Rất tốt'
        : rating === 3
          ? 'Ổn áp'
          : rating === 2
            ? 'Chưa tốt'
            : 'Cần cải thiện';

  return (
    <div className="review-modal-overlay">
      <div className="glass-panel review-modal-card">
        <button type="button" onClick={onClose} className="icon-button review-modal-close">
          <X size={20} />
        </button>

        <div className="review-modal-header">
          <div className="review-modal-badge">
            <Star size={28} fill="currentColor" />
          </div>
          <h2 className="review-modal-title">Đánh giá chuyến đi</h2>
          <p className="review-modal-copy">
            Hãy chia sẻ trải nghiệm của bạn về tour <strong>{title}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="review-modal-form">
          <section className="review-rating-panel">
            <span className="review-section-kicker">Cảm nhận tổng quan</span>
            <p className="review-rating-question">Bạn chấm bao nhiêu sao?</p>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`review-star-button ${(hover || rating) >= star ? 'is-active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`Chấm ${star} sao`}
                >
                  <Star
                    size={34}
                    fill={(hover || rating) >= star ? 'currentColor' : 'transparent'}
                  />
                </button>
              ))}
            </div>
            <p className="review-rating-label">{ratingLabel}</p>
          </section>

          <section className="review-field-block">
            <label className="review-field-label" htmlFor="review-comment">
              <MessageSquare size={16} /> Nhận xét chi tiết
            </label>
            <textarea
              id="review-comment"
              required
              placeholder="Chia sẻ cảm nhận của bạn về hướng dẫn viên, hành trình, điểm dừng chân hoặc điều bạn thích nhất..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="textarea-field review-textarea"
            />
          </section>

          <section className="review-field-block">
            <label className="review-field-label" htmlFor="review-files">
              <Camera size={16} /> Hình ảnh chuyến đi (Tùy chọn)
            </label>

            <label htmlFor="review-files" className="review-upload-card">
              <input
                id="review-files"
                type="file"
                accept="image/*"
                multiple
                className="review-file-input"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  setFiles((prev) => [...prev, ...newFiles]);
                  e.target.value = '';
                }}
              />
              <div className="review-upload-icon">
                <Camera size={20} />
              </div>
              <div className="review-upload-copy">
                <p>Thêm ảnh chuyến đi</p>
                <span>Nhấn để chọn 5-10 ảnh đẹp nhất từ hành trình của bạn</span>
              </div>
            </label>

            {files.length > 0 && (
              <div className="review-file-list">
                {files.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="review-file-chip">
                    <span title={file.name}>{file.name}</span>
                    <button
                      type="button"
                      className="review-file-remove"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Xóa ${file.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="review-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Để sau
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang gửi...' : (
                <>
                  <Send size={18} /> Gửi đánh giá
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
