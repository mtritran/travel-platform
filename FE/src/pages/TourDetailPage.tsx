import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Star, 
  ChevronLeft, 
  ShieldCheck, 
  Clock, 
  Users,
  CheckCircle2,
  Minus,
  Plus,
  Navigation
} from 'lucide-react';
import api from '../services/api';
import type { Tour, ApiResponse } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import { formatVND } from '../utils/format';
import DashboardLayout from '../layouts/DashboardLayout';
import LocationPicker from '../components/common/LocationPicker';

const TourDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [bookingDate, setBookingDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [meetingOption, setMeetingOption] = useState<'default' | 'custom'>('default');
  const [customPickup, setCustomPickup] = useState<{lat: number, lng: number, address: string} | null>(null);

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
          api.get<ApiResponse<any[]>>(ENDPOINTS.REVIEW.GET_BY_TOUR(id))
        ]);
        setTour(tourResp.data.result);
        setReviews(reviewsResp.data.result);
      } catch (err) {
        console.error("Failed to fetch tour data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBook = async () => {
    if (!id || !tour) return;
    
    // Validate number of guests
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
      
      // If custom pickup is selected, create the location first
      if (meetingOption === 'custom') {
        if (!customPickup) {
            setMessage({ type: 'error', text: 'Vui lòng chọn điểm đón trên bản đồ.' });
            setBookingLoading(false);
            return;
        }
        const locResponse = await api.post(ENDPOINTS.LOCATION.CREATE, {
            name: "Điểm đón yêu cầu",
            address: customPickup.address,
            latitude: customPickup.lat,
            longitude: customPickup.lng,
            imageUrl: tour.imageUrl
        });
        pickupLocationId = locResponse.data.result.id;
      }

      await api.post(ENDPOINTS.BOOKING.CREATE, { 
        tourId: id,
        bookingDate,
        numberOfGuests: Number(numberOfGuests),
        pickupLocationId
      });
      setMessage({ type: 'success', text: 'Đặt tour thành công! Bạn có thể kiểm tra trong phần Lịch sử đặt tour.' });
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Đặt tour thất bại. Vui lòng thử lại.' 
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Đang tải chi tiết tour...</p>
      </div>
    </DashboardLayout>
  );

  if (!tour) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Không tìm thấy tour.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--primary)', color: 'white' }}>
          Quay lại Cửa hàng
        </button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <button 
        onClick={() => navigate(-1)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'none', 
          color: 'var(--text-secondary)', 
          marginBottom: '24px',
          fontWeight: '600',
          padding: '8px 0'
        }}
      >
        <ChevronLeft size={20} /> Quay lại kết quả
      </button>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.5fr 1fr', 
        gap: '40px' 
      }}>
        {/* Left Side: Photo and Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ width: '100%', height: '450px', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            <img 
              src={tour.imageUrl || 'https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&q=80&w=1200'} 
              alt={tour.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
               <MapPin size={16} /> {tour.locationName}
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.1' }}>
              {tour.title}
            </h1>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Star size={18} fill="#fbbf24" color="#fbbf24" /> 
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                   {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0'}
                </span> ({reviews.length} đánh giá)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <ShieldCheck size={18} color="var(--success)" /> Hướng dẫn viên đã xác minh
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '32px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>Mô tả Tour</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.065rem', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                {tour.description}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '40px', marginBottom: '40px' }}>
              {[
                { 
                  icon: <Clock size={20} />, 
                  label: 'Thời lượng', 
                  val: tour.startTime && tour.endTime ? (() => {
                    const [h1, m1] = tour.startTime.split(':').map(Number);
                    const [h2, m2] = tour.endTime.split(':').map(Number);
                    let diff = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
                    if (diff < 0) diff += 24 * 60;
                    const hours = Math.floor(diff / 60);
                    const minutes = diff % 60;
                    return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
                  })() : 'Linh hoạt'
                },
                { 
                  icon: <Users size={20} />, 
                  label: 'Số lượng khách', 
                  val: `Tối đa ${tour.maxGuests || 1} người` 
                },
                { 
                  icon: <Calendar size={20} />, 
                  label: 'Lịch trình', 
                  val: tour.startDate && tour.endDate ? 
                    (tour.startDate === tour.endDate ? 
                      new Date(tour.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 
                      `${new Date(tour.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${new Date(tour.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
                    ) : 'Hàng ngày'
                }
              ].map((item, i) => (
                <div key={i} style={{ padding: '20px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{item.label}</p>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{item.val}</p>
                </div>
              ))}
            </div>

            {/* Reviews Section */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Đánh giá từ du khách</h3>
                    <div style={{ padding: '6px 12px', background: '#fef3c7', color: '#d97706', borderRadius: '10px', fontWeight: '700', fontSize: '0.8125rem' }}>
                        ★ {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '5.0'} / 5.0
                    </div>
                </div>

                {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', background: 'var(--surface-hover)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Chưa có đánh giá nào cho tour này.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {reviews.map((rev) => (
                            <div key={rev.id} style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '800', fontSize: '0.75rem' }}>
                                            {rev.userName.charAt(0)}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '700', fontSize: '0.875rem', margin: 0 }}>{rev.userName}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1px' }}>
                                        {[1,2,3,4,5].map(s => (
                                            <Star key={s} size={12} fill={s <= rev.rating ? '#fbbf24' : 'transparent'} color={s <= rev.rating ? '#fbbf24' : '#e2e8f0'} />
                                        ))}
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: '1.6', margin: 0 }}>
                                    "{rev.comment}"
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Right Side: Booking Card */}
        <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{formatVND(tour.price)}</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>/ người</span>
              </div>
              <div style={{ color: 'var(--success)', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> Giá tốt nhất
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Ngày diễn ra</p>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '700' }}>
                     <Calendar size={18} />
                     {tour.startDate ? new Date(tour.startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Linh hoạt'}
                   </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Giờ tập trung</p>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '700', justifyContent: 'flex-end' }}>
                     <Clock size={18} />
                     {tour.startTime || '08:00'}
                   </div>
                </div>
              </div>

              {/* Guests Selection */}
              <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Chọn số khách</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} />
                    <span>Số người</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={() => setNumberOfGuests(prev => Math.max(1, prev - 1))}
                      style={{ 
                        width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #cbd5e1', 
                        background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseOut={e => e.currentTarget.style.background = 'white'}
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number"
                      value={numberOfGuests}
                      min="1"
                      max={tour.maxGuests || undefined}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) setNumberOfGuests(val);
                        else if (e.target.value === '') setNumberOfGuests(0);
                      }}
                      onBlur={() => {
                        if (numberOfGuests < 1) setNumberOfGuests(1);
                        if (tour.maxGuests && numberOfGuests > tour.maxGuests) setNumberOfGuests(tour.maxGuests);
                      }}
                      style={{ 
                        border: 'none', background: 'none', padding: 0, fontSize: '1.125rem', 
                        fontWeight: '700', color: 'var(--text-primary)', outline: 'none', 
                        width: '40px', textAlign: 'center', MozAppearance: 'textfield'
                      }}
                    />
                    <button 
                      onClick={() => setNumberOfGuests(prev => tour.maxGuests ? Math.min(tour.maxGuests, prev + 1) : prev + 1)}
                      style={{ 
                        width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #cbd5e1', 
                        background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseOut={e => e.currentTarget.style.background = 'white'}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Meeting Point Selection */}
              <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Điểm tập trung / Đón khách</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <button 
                        onClick={() => setMeetingOption('default')}
                        style={{ 
                            padding: '10px 4px', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid',
                            borderColor: meetingOption === 'default' ? 'var(--primary)' : '#e2e8f0',
                            background: meetingOption === 'default' ? '#eff6ff' : 'white',
                            color: meetingOption === 'default' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Mặc định (Guide)
                    </button>
                    <button 
                        onClick={() => setMeetingOption('custom')}
                        style={{ 
                            padding: '10px 4px', fontSize: '0.8125rem', borderRadius: '8px', border: '1px solid',
                            borderColor: meetingOption === 'custom' ? 'var(--primary)' : '#e2e8f0',
                            background: meetingOption === 'custom' ? '#eff6ff' : 'white',
                            color: meetingOption === 'custom' ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        Tự chọn nơi đón
                    </button>
                </div>

                {meetingOption === 'default' ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '12px', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <Navigation size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>{tour.meetingLocationName || 'Điểm tập trung'}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: '1.4' }}>{tour.meetingLocationAddress || 'Theo hướng dẫn của Guide'}</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <LocationPicker 
                                onLocationSelect={(lat, lng, address) => setCustomPickup({lat, lng, address})}
                                initialLat={tour.meetingLatitude}
                                initialLng={tour.meetingLongitude}
                            />
                        </div>
                        {customPickup && (
                           <div style={{ fontSize: '0.8125rem', color: '#059669', background: '#ecfdf5', padding: '12px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                              <p style={{ fontWeight: '800', margin: 0 }}>Vị trí đón yêu cầu:</p>
                              <p style={{ margin: '4px 0 0', lineHeight: '1.4' }}>{customPickup.address}</p>
                           </div>
                        )}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                           * Ghé đón tận nơi có thể phát sinh thêm phí hoặc bị từ chối nếu quá xa.
                        </p>
                    </div>
                )}
              </div>
            </div>

            {message.text && (
              <div style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '16px', 
                textAlign: 'center',
                fontSize: '0.875rem',
                background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: message.type === 'success' ? '#065f46' : '#991b1b',
                border: message.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca'
              }}>
                {message.text}
              </div>
            )}

            <button 
              onClick={handleBook}
              disabled={bookingLoading}
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: 'var(--primary)', 
                color: 'white', 
                fontSize: '1.125rem', 
                fontWeight: '700',
                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
                opacity: bookingLoading ? 0.7 : 1
              }}
            >
              {bookingLoading ? 'Đang xử lý...' : 'Đặt ngay Tour này'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '16px' }}>
              Hủy miễn phí trước 24 giờ kể từ lúc bắt đầu
            </p>

            <div style={{ marginTop: '32px', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '12px' }}>Về hướng dẫn viên</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Users size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{tour.guideName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hướng dẫn viên địa phương</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TourDetailPage;
