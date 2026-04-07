import React, { useEffect, useState } from 'react';
import {
  Star,
  Trash2,
  Eye,
  EyeOff,
  Search,
  MessageCircle,
  Calendar,
  MapPin,
} from 'lucide-react';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';
import type { ApiResponse } from '../../types';
import { getFileUrl } from '../../utils/format';
import DashboardLayout from '../../layouts/DashboardLayout';

interface Review {
  id: string;
  userName: string;
  userAvatarUrl: string;
  userPhone: string;
  tourTitle: string;
  rating: number;
  comment: string;
  imagesUrl: string;
  active: boolean;
  createdAt: string;
}

const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'ALL'>('ALL');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<Review[]>>(ENDPOINTS.REVIEW.ADMIN_GET_ALL);
      setReviews(res.data.result);
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: string, active: boolean) => {
    try {
      setProcessing(id);
      await api.patch(`${ENDPOINTS.REVIEW.UPDATE_STATUS(id)}?active=${active}`);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)));
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái đánh giá:', err);
      alert('Không thể cập nhật trạng thái đánh giá.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này không? Hành động này không thể hoàn tác.'
      )
    ) {
      return;
    }

    try {
      setProcessing(id);
      await api.delete(ENDPOINTS.REVIEW.DELETE(id));
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Lỗi khi xóa đánh giá:', err);
      alert('Không thể xóa đánh giá này.');
    } finally {
      setProcessing(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      (r.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.comment?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.tourTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'ALL' || r.rating === filterRating;
    return matchesSearch && matchesRating;
  });

  return (
    <DashboardLayout>
      <div className="admin-reviews-page">
        <div className="section-heading">
          <span className="eyebrow">Review Center</span>
          <h1 className="page-title">Quản lý Đánh giá</h1>
          <p className="page-subtitle">
            Theo dõi phản hồi từ khách hàng, kiểm soát trạng thái hiển thị và xử lý các đánh giá
            cần can thiệp.
          </p>
        </div>

        <div className="glass-panel admin-reviews-toolbar">
          <label className="input-shell admin-reviews-search">
            <Search size={18} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm theo tên người dùng, nội dung hoặc tên tour..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>

          <div className="admin-reviews-filter">
            <span className="admin-reviews-filter-label">Mức sao</span>
            <div className="segmented-control">
              {[
                { value: 'ALL', label: 'Tất cả' },
                { value: 5, label: '5 sao' },
                { value: 4, label: '4 sao' },
                { value: 3, label: '3 sao' },
                { value: 2, label: '2 sao' },
                { value: 1, label: '1 sao' },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  className={`segmented-button ${
                    filterRating === option.value ? 'active' : ''
                  }`}
                  onClick={() => setFilterRating(option.value as typeof filterRating)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel admin-reviews-empty">
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p>Đang tải đánh giá...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="glass-panel admin-reviews-empty">
            <MessageCircle size={48} />
            <h3 className="section-title">Không tìm thấy đánh giá nào</h3>
            <p className="collection-empty-copy">
              Hãy thử đổi từ khóa hoặc chọn lại bộ lọc số sao để xem thêm kết quả.
            </p>
          </div>
        ) : (
          <div className="admin-reviews-list">
            {filteredReviews.map((review) => {
              const imageList = review.imagesUrl?.split(';').filter(Boolean) || [];

              return (
                <article
                  key={review.id}
                  className="glass-panel admin-review-row"
                  style={{ opacity: processing === review.id ? 0.6 : 1 }}
                >
                  <div className="admin-review-main">
                    <div className="admin-review-user">
                      <img
                        src={
                          getFileUrl(review.userAvatarUrl) ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            review.userName || 'U'
                          )}&background=random`
                        }
                        alt={review.userName}
                        className="admin-review-avatar"
                      />
                      <div className="admin-review-user-copy">
                        <strong>{review.userName}</strong>
                        <span>{review.userPhone}</span>
                      </div>
                    </div>

                    <div className="admin-review-body">
                      <div className="admin-review-headline">
                        <div className="admin-review-tour">
                          <MapPin size={14} />
                          <span>{review.tourTitle || 'Yêu cầu tùy chỉnh'}</span>
                        </div>
                        <div className="admin-review-rating">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < review.rating ? '#f59e0b' : 'none'}
                              color={i < review.rating ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                          <strong>{review.rating}.0</strong>
                        </div>
                      </div>

                      <p className="admin-review-comment">{review.comment}</p>

                      {imageList.length > 0 ? (
                        <div className="admin-review-images">
                          {imageList.slice(0, 4).map((url, idx) => (
                            <img
                              key={idx}
                              src={getFileUrl(url)}
                              alt="Attachment"
                              onClick={() => window.open(getFileUrl(url), '_blank')}
                            />
                          ))}
                          {imageList.length > 4 ? (
                            <span className="admin-review-more-images">
                              +{imageList.length - 4}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="admin-review-side">
                    <div className="admin-review-meta">
                      <span className={`admin-review-status ${review.active ? 'is-live' : 'is-hidden'}`}>
                        {review.active ? 'Đang hiển thị' : 'Đã ẩn'}
                      </span>
                      <span className="admin-review-date">
                        <Calendar size={13} />
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div className="admin-review-actions">
                      {review.active ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(review.id, false)}
                          className="icon-button admin-review-action-danger"
                          title="Ẩn đánh giá"
                          disabled={!!processing}
                        >
                          <EyeOff size={17} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(review.id, true)}
                          className="icon-button admin-review-action-success"
                          title="Hiện đánh giá"
                          disabled={!!processing}
                        >
                          <Eye size={17} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        className="icon-button admin-review-action-muted"
                        title="Xóa vĩnh viễn"
                        disabled={!!processing}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReviewsPage;
