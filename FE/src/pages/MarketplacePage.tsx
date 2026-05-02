import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Bot, Star, User, X } from 'lucide-react';
import api from '../services/api';
import type { ApiResponse, Tour } from '../types';
import DashboardLayout from '../layouts/DashboardLayout';
import { ENDPOINTS } from '../constants/endpoints';
import { formatVND, getFileUrl } from '../utils/format';
import IdentityUpgradeBanner from '../components/common/IdentityUpgradeBanner';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import LocationPrompt from '../components/location/LocationPrompt';

const MarketplacePage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user } = useAuth();
  const { location, detectLocation, clearLocation, isInitialized } = useLocation();
  const navigate = useNavigate();

  // Redirect admin to dashboard
  useEffect(() => {
    if (user?.roles?.some(r => r.name === 'ADMIN')) {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!isInitialized) return;

    const fetchTours = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (location?.latitude && location?.longitude) {
          params.lat = location.latitude;
          params.lng = location.longitude;
        }

        const response = await api.get<ApiResponse<Tour[]>>(
          maxDistance && location?.latitude ? `${ENDPOINTS.TOUR.GET_ALL}/nearby` : ENDPOINTS.TOUR.GET_ALL,
          { params: { ...params, radius: maxDistance } }
        );
        setTours(response.data.result);
      } catch (err) {
        console.error('Failed to fetch tours:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [isInitialized, location?.latitude, location?.longitude, maxDistance]);

  const filteredTours = tours.filter((tour) => {
    const matchesSearch =
      (tour.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (tour.locationName?.toLowerCase() || '').includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="page-stack">
        <section className="glass-panel hero-banner">
          <div className="hero-copy">
            <div className="section-heading">
              {user && (
                <div
                  className="location-context"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    padding: '6px 14px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '100px',
                    width: 'fit-content',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontSize: '0.9rem',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                  onClick={() => detectLocation()}
                >
                  <MapPin size={16} />
                  <span>{location?.address || 'Chưa xác định vị trí'}</span>
                  {location?.address && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        clearLocation();
                      }}
                      style={{
                        marginLeft: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <X size={12} />
                    </div>
                  )}
                </div>
              )}
              <h1 className="hero-title">Khám phá hành trình tiếp theo thật đồng điệu.</h1>
              <p className="page-subtitle">
                Tìm tour theo địa điểm, chọn trải nghiệm phù hợp và đi từ cảm hứng đến đặt chỗ chỉ
                trong một luồng giao diện gọn gàng.
              </p>
            </div>
          </div>
        </section>

        <section className="glass-panel marketplace-filter-panel">
          <div className="toolbar marketplace-toolbar">
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

            <div className="marketplace-distance-filter">
              <div className="input-shell marketplace-distance-shell">
                <MapPin size={18} />
                <select
                  className="input-field select-field marketplace-distance-select"
                  value={maxDistance || ''}
                  onChange={(e) => setMaxDistance(e.target.value ? Number(e.target.value) : null)}
                  disabled={!location?.latitude}
                >
                  <option value="">Tất cả khoảng cách</option>
                  <option value="10">Dưới 10 km</option>
                  <option value="20">Dưới 20 km</option>
                  <option value="50">Dưới 50 km</option>
                  <option value="100">Dưới 100 km</option>
                </select>
              </div>
            </div>

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

                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      alignItems: 'flex-end',
                    }}
                  >
                    <span className="badge badge-secondary tour-rating">
                      <Star size={14} fill={tour.reviewCount > 0 ? 'currentColor' : 'transparent'} />
                      {tour.reviewCount > 0 ? (tour.rating || 0).toFixed(1) : 'Chưa có'}
                    </span>
                    {tour.distance !== undefined && tour.distance !== null && (
                      <>
                        {tour.distance < 5 && (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: 'var(--success)',
                              color: 'white',
                              fontWeight: '800',
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'
                            }}
                          >
                            Gần bạn
                          </span>
                        )}
                        <span
                          className="badge"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            color: 'var(--primary)',
                            fontWeight: '700',
                            backdropFilter: 'blur(4px)',
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(15, 118, 110, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <MapPin size={12} />
                          {tour.distance < 1 ? '< 1 km' : `${tour.distance.toFixed(1)} km`}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="tour-card-content">
                  <div className="tour-card-top">
                    <span className="tour-location">
                      <MapPin size={18} />
                      {tour.locationName}
                    </span>
                    <h3 className="tour-title">{tour.title}</h3>
                    <p className="tour-description">
                      {(tour.description || '').length > 120
                        ? `${(tour.description || '').substring(0, 120)}...`
                        : tour.description || ''}
                    </p>
                  </div>

                  <div
                    className="tour-card-guide"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '16px',
                      marginBottom: '8px',
                    }}
                  >
                    <span className="avatar-pill" style={{ width: '28px', height: '28px' }}>
                      {tour.guideAvatarUrl ? (
                        <img
                          src={getFileUrl(tour.guideAvatarUrl)}
                          alt={tour.guideName}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <User size={14} />
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {tour.guideName}
                    </span>
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


      {showUpgradeModal && (
        <IdentityUpgradeBanner
          type="modal"
          onClose={() => setShowUpgradeModal(false)}
          message="Bạn cần cập nhật Số điện thoại và Mã PIN thanh toán để có thể đặt tour. Việc này chỉ mất 1 phút."
        />
      )}
      {user && <LocationPrompt />}
    </DashboardLayout>
  );
};

export default MarketplacePage;
