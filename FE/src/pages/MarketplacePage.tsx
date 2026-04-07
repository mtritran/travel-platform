import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  Bot,
  Star,
  User,
} from 'lucide-react';
import api from '../services/api';
import type { ApiResponse, Tour } from '../types';
import DashboardLayout from '../layouts/DashboardLayout';
import { ENDPOINTS } from '../constants/endpoints';
import { formatVND, getFileUrl } from '../utils/format';
import TourChatWidget from '../components/TourChatWidget';
import IdentityUpgradeBanner from '../components/common/IdentityUpgradeBanner';
import { useAuth } from '../context/AuthContext';

const MarketplacePage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const response = await api.get<ApiResponse<Tour[]>>(ENDPOINTS.TOUR.GET_ALL);
        setTours(response.data.result);
      } catch (err) {
        console.error('Failed to fetch tours:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  const filteredTours = tours.filter((tour) => {
    const matchesSearch =
      (tour.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (tour.locationName?.toLowerCase() || '').includes(search.toLowerCase());

    return matchesSearch;
  });

  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="page-stack">
        <section className="glass-panel hero-banner">
          <div className="hero-copy">
            <div className="section-heading">
              <h1 className="hero-title">Khám phá hành trình tiếp theo thật đồng điệu.</h1>
              <p className="page-subtitle">
                Tìm tour theo địa điểm, chọn trải nghiệm phù hợp và đi từ cảm hứng đến đặt chỗ
                chỉ trong một luồng giao diện gọn gàng.
              </p>
            </div>
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '24px' }}>
          <div className="toolbar">
            <div className="input-shell">
              <Search size={18} />
              <input
                className="input-field"
                type="text"
                placeholder="Tìm theo tên tour hoặc địa điểm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-ai-trigger"
              onClick={() => setIsChatOpen(true)}
            >
              <Bot size={18} />
              <span>Hỏi trợ lý AI</span>
            </button>
          </div>
        </section>

        {loading ? (
          <div className="glass-panel empty-state">
            <p className="page-subtitle">Đang tải danh sách tour...</p>
          </div>
        ) : filteredTours.length > 0 ? (
          <section className="tour-grid">
            {filteredTours.map((tour) => (
              <article
                key={tour.id}
                className="glass-card tour-card"
                onClick={() => navigate(`/tours/${tour.id}`)}
              >
                <div className="tour-card-media">
                  <img
                    src={
                      tour.imageUrl ||
                      'https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&q=80&w=800'
                    }
                    alt={tour.title}
                  />
                  <div className="media-overlay" />
                  <span className="badge badge-secondary tour-rating">
                    <Star size={14} fill="currentColor" />
                    {tour.rating !== 0 ? tour.rating.toFixed(1) : '5.0'}
                  </span>
                </div>

                <div className="tour-card-content">
                  <div className="tour-card-top">
                    <span className="tour-location">
                      <MapPin size={18} />
                      {tour.locationName}
                    </span>
                    <h3 className="tour-title">{tour.title}</h3>
                    <p className="tour-description">
                      {tour.description.length > 120
                        ? `${tour.description.substring(0, 120)}...`
                        : tour.description}
                    </p>
                  </div>

                  <div className="tour-card-guide" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', marginBottom: '8px' }}>
                    <span className="avatar-pill" style={{ width: '28px', height: '28px' }}>
                      {tour.guideAvatarUrl ? (
                        <img src={getFileUrl(tour.guideAvatarUrl)} alt={tour.guideName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <User size={14} />
                      )}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{tour.guideName}</span>
                  </div>

                  <div className="tour-card-footer">
                    <div>
                      <span className="price-label">Giá mỗi người</span>
                      <span className="price-value">{formatVND(tour.price)}</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user?.phone || !user?.hasPaymentPin) {
                          setShowUpgradeModal(true);
                        } else {
                          navigate(`/tours/${tour.id}`);
                        }
                      }}
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="glass-panel empty-state">
            <h2 className="section-title">Chưa có tour phù hợp với tìm kiếm này</h2>
            <p className="page-subtitle" style={{ margin: '10px auto 0' }}>
              Hãy thử một từ khóa ngắn hơn hoặc quay lại danh sách gợi ý mặc định để xem thêm điểm
              đến thú vị.
            </p>
          </div>
        )}
      </div>

      {/* AI Chat Widget - fixed bottom-right */}
      <TourChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Identity Upgrade Modal */}
      {showUpgradeModal && (
        <IdentityUpgradeBanner 
          type="modal" 
          onClose={() => setShowUpgradeModal(false)}
          message="Bạn cần cập nhật Số điện thoại và Mã PIN thanh toán để có thể đặt tour. Việc này chỉ mất 1 phút!"
        />
      )}
    </DashboardLayout>
  );
};

export default MarketplacePage;
