import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  Minus,
  Navigation,
  Plus,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import api from '../services/api';
import type { ApiResponse, Review, Tour } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import { formatVND } from '../utils/format';
import DashboardLayout from '../layouts/DashboardLayout';
import LocationPicker from '../components/common/LocationPicker';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const TourDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [bookingDate, setBookingDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [meetingOption, setMeetingOption] = useState<'default' | 'custom'>('default');
  const [customPickup, setCustomPickup] = useState<{ lat: number; lng: number; address: string } | null>(
    null,
  );

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (tour?.startDate) {
      setBookingDate(tour.startDate);
    }
  }, [tour]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [tourResp, reviewsResp] = await Promise.all([
          api.get<ApiResponse<Tour>>(ENDPOINTS.TOUR.GET_BY_ID(id)),
          api.get<ApiResponse<Review[]>>(ENDPOINTS.REVIEW.GET_BY_TOUR(id)),
        ]);

        setTour(tourResp.data.result);
        setReviews(reviewsResp.data.result);
      } catch (err) {
        console.error('Failed to fetch tour data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleBook = async () => {
    if (!id || !tour) return;

    if (numberOfGuests < 1) {
      setMessage({ type: 'error', text: 'Số lượng khách phải ít nhất là 1.' });
      return;
    }

    if (tour.maxGuests && numberOfGuests > tour.maxGuests) {
      setMessage({ type: 'error', text: `Số lượng khách không được vượt quá ${tour.maxGuests} người.` });
      return;
    }

    setBookingLoading(true);
    setMessage({ type: '', text: '' });

    try {
      let pickupLocationId = undefined;

      if (meetingOption === 'custom') {
        if (!customPickup) {
          setMessage({ type: 'error', text: 'Vui lòng chọn điểm đón trên bản đồ.' });
          setBookingLoading(false);
          return;
        }

        const locResponse = await api.post(ENDPOINTS.LOCATION.CREATE, {
          name: 'Điểm đón yêu cầu',
          address: customPickup.address,
          latitude: customPickup.lat,
          longitude: customPickup.lng,
          imageUrl: tour.imageUrl,
        });
        pickupLocationId = locResponse.data.result.id;
      }

      await api.post(ENDPOINTS.BOOKING.CREATE, {
        tourId: id,
        bookingDate,
        numberOfGuests: Number(numberOfGuests),
        pickupLocationId,
      });

      setMessage({
        type: 'success',
        text: 'Chúng tôi đã tạm giữ chỗ cho bạn trong 10 phút. Vui lòng thanh toán cọc ngay để hoàn tất đặt tour.',
      });
      setTimeout(() => navigate('/bookings'), 2500);
    } catch (err) {
      const apiError = err as ApiError;
      setMessage({
        type: 'error',
        text: apiError.response?.data?.message || 'Đặt tour thất bại. Vui lòng thử lại.',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="glass-panel empty-state">
          <p className="page-subtitle">Đang tải chi tiết tour...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!tour) {
    return (
      <DashboardLayout>
        <div className="glass-panel empty-state">
          <h2 className="section-title">Không tìm thấy tour</h2>
          <button type="button" className="btn-primary" style={{ marginTop: '18px' }} onClick={() => navigate('/')}>
            Quay lại trang chủ
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const remainingSlots = (tour.maxGuests || 0) - (tour.occupiedGuests || 0);

  // Calculate cutoff time (StartTime - CutoffMinutes)
  const cutoffDateTime = (() => {
    if (!tour?.startDate || !tour?.startTime) return null;
    try {
      const [year, month, day] = tour.startDate.split('-').map(Number);
      const [hours, minutes] = tour.startTime.split(':').map(Number);
      if (isNaN(year) || isNaN(hours)) return null;
      const date = new Date(year, month - 1, day, hours, minutes);
      date.setMinutes(date.getMinutes() - (tour.bookingCutoffMinutes || 60));
      return date;
    } catch (e) {
      return null;
    }
  })();

  const isExpired = cutoffDateTime ? cutoffDateTime < currentTime : false;

  const timeLeftLabel = (() => {
    if (!cutoffDateTime || isExpired) return null;
    const diff = cutoffDateTime.getTime() - currentTime.getTime();
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours >= 72) return null; // Show up to 3 days
    if (hours >= 24) return `Hạn đặt tour còn lại: ${Math.floor(hours / 24)} ngày ${hours % 24} tiếng`;
    if (hours > 0) return `Hạn đặt tour còn lại: ${hours} tiếng ${minutes} phút`;
    return `Chỉ còn ${minutes} phút để đặt tour này!`;
  })();

  const durationLabel =
    tour.startTime && tour.endTime
      ? (() => {
        const [h1, m1] = tour.startTime.split(':').map(Number);
        const [h2, m2] = tour.endTime.split(':').map(Number);
        let diff = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0));
        if (diff < 0) diff += 24 * 60;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
      })()
      : 'Linh hoạt';

  const scheduleLabel =
    tour.startDate && tour.endDate
      ? tour.startDate === tour.endDate
        ? new Date(tour.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
        : `${new Date(tour.startDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-')} - ${new Date(tour.endDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-')}`
      : 'Hàng ngày';

  return (
    <DashboardLayout>
      <div className="page-stack">
        <button type="button" className="back-link" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
          Quay lại kết quả
        </button>

        <div className="detail-grid">
          <div className="detail-column">
            <div className="hero-image">
              <img
                src={
                  tour.imageUrl ||
                  'https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&q=80&w=1200'
                }
                alt={tour.title}
              />
            </div>

            <section className="glass-panel" style={{ padding: '28px' }}>
              <span className="eyebrow">
                <MapPin size={14} />
                {tour.locationName}
              </span>
              <div className="section-heading" style={{ marginTop: '16px' }}>
                <h1 className="page-title">{tour.title}</h1>
                <div className="meta-row">
                  <span className="badge badge-secondary">
                    <Star size={14} fill="currentColor" />
                    {averageRating} ({reviews.length} đánh giá)
                  </span>
                  <span className="badge badge-success">
                    <ShieldCheck size={14} />
                    Hướng dẫn viên đã xác minh
                  </span>
                  {isExpired && (
                    <span className="badge badge-danger">
                      <Clock size={14} />
                      Đã hết hạn
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '28px' }}>
                <h2 className="section-title">Mô tả tour</h2>
                <p className="page-subtitle" style={{ marginTop: '12px', whiteSpace: 'pre-line' }}>
                  {tour.description}
                </p>
              </div>

              <div className="feature-grid" style={{ marginTop: '28px' }}>
                <div className="feature-card">
                  <Clock size={20} />
                  <div className="feature-label">Thời lượng</div>
                  <div className="feature-value">{durationLabel}</div>
                </div>
                <div className="feature-card">
                  <Users size={20} />
                  <div className="feature-label">Quy mô</div>
                  <div className="feature-value">
                    Tối đa {tour.maxGuests || 1} khách
                    {remainingSlots <= 5 && remainingSlots > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '4px', fontWeight: 600 }}>
                        Chỉ còn {remainingSlots} chỗ!
                      </div>
                    )}
                    {remainingSlots <= 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '4px', fontWeight: 800 }}>
                        ĐÃ HẾT CHỖ
                      </div>
                    )}
                  </div>
                </div>
                <div className="feature-card">
                  <Calendar size={20} />
                  <div className="feature-label">Lịch trình</div>
                  <div className="feature-value">{scheduleLabel}</div>
                </div>
              </div>
            </section>

            <section className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
                <div>
                  <h2 className="section-title">Đánh giá từ du khách</h2>
                  <p className="muted-text" style={{ marginTop: '6px' }}>
                    Những cảm nhận thực tế sau chuyến đi.
                  </p>
                </div>
                <span className="badge badge-secondary">
                  <Star size={14} fill="currentColor" />
                  {averageRating} / 5.0
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="empty-state" style={{ paddingBottom: 0 }}>
                  <p className="muted-text">Chưa có đánh giá nào cho tour này.</p>
                </div>
              ) : (
                <div className="review-list" style={{ marginTop: '20px' }}>
                  {reviews.map((review) => (
                    <article key={review.id} className="review-card">
                      <div className="review-head">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className="avatar-review">{review.userName.charAt(0)}</span>
                          <div>
                            <div style={{ fontWeight: 800 }}>{review.userName}</div>
                            <div className="muted-text" style={{ fontSize: '0.8rem' }}>
                              {new Date(review.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              fill={star <= review.rating ? '#d97706' : 'transparent'}
                              color={star <= review.rating ? '#d97706' : '#d6d3d1'}
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ lineHeight: 1.7 }}>"{review.comment}"</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="booking-column">
            <div className="glass-panel booking-card">
              <div className="booking-top">
                <div>
                  <div className="price-value" style={{ fontSize: '2rem' }}>
                    {formatVND(tour.price)}
                  </div>
                  <div className="muted-text">/ người</div>
                </div>
                <span className="badge badge-success">
                  <CheckCircle2 size={14} />
                  Giá tốt
                </span>
              </div>

              <div className="booking-box">
                <div className="booking-row">
                  <div>
                    <div className="booking-label">Ngày diễn ra</div>
                    <div className="booking-value">
                      {tour.startDate
                        ? new Date(tour.startDate).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                        : 'Linh hoạt'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="booking-label">Khung giờ</div>
                    <div className="booking-value">
                      {tour.startTime || '08:00'} - {tour.endTime || '--:--'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="booking-box">
                <div className="booking-label" style={{ marginBottom: '12px' }}>
                  Chọn số khách
                </div>
                <div className="booking-row" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <Users size={18} />
                    <span>Số người</span>
                  </div>
                  <div className="counter-control">
                    <button
                      type="button"
                      className="counter-action"
                      disabled={numberOfGuests <= 1}
                      onClick={() => setNumberOfGuests((prev) => Math.max(1, prev - 1))}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      className="counter-input"
                      type="number"
                      value={numberOfGuests}
                      disabled={remainingSlots <= 0}
                      min="1"
                      max={remainingSlots}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!Number.isNaN(value)) setNumberOfGuests(value);
                        else if (e.target.value === '') setNumberOfGuests(0);
                      }}
                      onBlur={() => {
                        if (numberOfGuests < 1) setNumberOfGuests(1);
                        if (numberOfGuests > remainingSlots) setNumberOfGuests(remainingSlots);
                      }}
                    />
                    <button
                      type="button"
                      className="counter-action"
                      disabled={numberOfGuests >= remainingSlots}
                      onClick={() =>
                        setNumberOfGuests((prev) => Math.min(remainingSlots, prev + 1))
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="booking-box">
                <div className="booking-label" style={{ marginBottom: '12px' }}>
                  Điểm tập trung / đón khách
                </div>

                <div className="meeting-toggle">
                  <button
                    type="button"
                    className={`meeting-option${meetingOption === 'default' ? ' active' : ''}`}
                    onClick={() => setMeetingOption('default')}
                  >
                    Mặc định
                  </button>
                  <button
                    type="button"
                    className={`meeting-option${meetingOption === 'custom' ? ' active' : ''}`}
                    onClick={() => setMeetingOption('custom')}
                  >
                    Tự chọn nơi đón
                  </button>
                </div>

                {meetingOption === 'default' ? (
                  <div className="info-strip" style={{ marginTop: '14px' }}>
                    <Navigation size={18} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 800 }}>{tour.meetingLocationName || 'Điểm tập trung'}</div>
                      <div className="muted-text" style={{ fontSize: '0.88rem', marginTop: '4px' }}>
                        {tour.meetingLocationAddress || 'Theo hướng dẫn của guide'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
                    <div className="map-frame">
                      <LocationPicker
                        onLocationSelect={(lat, lng, address) => setCustomPickup({ lat, lng, address })}
                        initialLat={tour.meetingLatitude}
                        initialLng={tour.meetingLongitude}
                      />
                    </div>
                    {customPickup ? (
                      <div className="status-message success">
                        <strong>Vị trí đón yêu cầu:</strong> {customPickup.address}
                      </div>
                    ) : null}
                    <p className="muted-text" style={{ fontSize: '0.82rem' }}>
                      Ghé đón tận nơi có thể phát sinh thêm phí hoặc bị từ chối nếu quá xa.
                    </p>
                  </div>
                )}
              </div>

              {message.text ? <div className={`status-message ${message.type}`}>{message.text}</div> : null}

              {timeLeftLabel && !isExpired && (
                <div style={{ 
                  background: 'rgba(245, 158, 11, 0.1)', 
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  color: '#b45309',
                  padding: '12px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '700'
                }}>
                  <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  {timeLeftLabel}
                </div>
              )}

              <button
                type="button"
                className="btn-primary"
                disabled={bookingLoading || remainingSlots <= 0 || isExpired}
                onClick={handleBook}
                style={(remainingSlots <= 0 || isExpired) ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}
              >
                {isExpired 
                  ? 'Tour đã kết thúc/hết hạn' 
                  : remainingSlots <= 0 
                    ? 'Hiện đã hết chỗ' 
                    : bookingLoading 
                      ? 'Đang xử lý...' 
                      : 'Đặt ngay tour này'}
              </button>

              <p className="muted-text" style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                Hủy miễn phí trước 24 giờ kể từ lúc bắt đầu.
              </p>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '18px' }}>
                <div className="booking-label" style={{ marginBottom: '12px' }}>
                  Về hướng dẫn viên
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="avatar-pill" style={{ width: 48, height: 48 }}>
                    <Users size={22} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 800 }}>{tour.guideName}</div>
                    <div className="muted-text" style={{ fontSize: '0.86rem' }}>
                      Hướng dẫn viên địa phương
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TourDetailPage;
