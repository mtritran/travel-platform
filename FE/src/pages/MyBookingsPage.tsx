import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, Clock, AlertCircle, MapPin, Wallet, XCircle } from 'lucide-react';
import api from '../services/api';
import type { ApiResponse, Booking } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import { formatVND } from '../utils/format';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNotification } from '../context/NotificationContext';
import ReviewModal from '../components/ReviewModal';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const ReservationTimer: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const createdDate = new Date(createdAt);
      const expiryDate = new Date(createdDate.getTime() + 10 * 60 * 1000);
      const now = new Date();
      const diff = Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  if (timeLeft <= 0) return <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Hết hạn giữ chỗ</span>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <span style={{ 
      color: '#b45309', 
      fontWeight: 800, 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '6px',
      padding: '4px 10px',
      background: '#fff7ed',
      borderRadius: '8px',
      fontSize: '0.88rem',
      border: '1px solid #ffedd5'
    }}>
      <Clock size={14} />
      Cần thanh toán trong: {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
};

const MyBookingsPage: React.FC = () => {
  const { notifications } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  /** '' = chọn phương thức trên cổng VNPAY; 'VNPAYQR' = quét mã QR */
  const [vnpayBankCode, setVnpayBankCode] = useState<'' | 'VNPAYQR'>('');

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get<ApiResponse<Booking[]>>(ENDPOINTS.BOOKING.MY_BOOKINGS);
      setBookings(response.data.result);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (payingBooking) setVnpayBankCode('');
  }, [payingBooking]);

  useEffect(() => {
    const latestNotif = notifications[0];
    if (
      latestNotif?.type === 'BOOKING_STATUS_UPDATE' ||
      latestNotif?.type === 'TOUR_REQUEST_MATCHED' ||
      latestNotif?.type === 'TOUR_COMPLETED'
    ) {
      fetchBookings(true);
    }
  }, [notifications]);

  const handlePayment = async () => {
    if (!payingBooking) return;
    setIsProcessingPayment(true);
    try {
      const type = payingBooking.status === 'AWAITING_DEPOSIT' ? 'DEPOSIT' : 'REMAINING';
      const response = await api.get<ApiResponse<string>>(
        ENDPOINTS.PAYMENT.CREATE_VNPAY(payingBooking.id, type, vnpayBankCode || undefined),
      );
      
      if (response.data.result) {
        window.location.href = response.data.result;
      }
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.response?.data?.message || 'Không thể tạo liên kết thanh toán lúc này.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    let message = 'Bạn có chắc chắn muốn hủy tour này?';
    const now = new Date();
    const startDateTime = new Date(`${booking.tourStartDate}T${booking.tourStartTime}`);
    const diffHours = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (booking.paidAmount > 0) {
      if (diffHours > 48) message += `\n\nĐược hoàn 100% (${formatVND(booking.paidAmount)}).`;
      else if (diffHours > 24) message += `\n\nĐược hoàn 50% (${formatVND(booking.paidAmount * 0.5)}).`;
      else message += '\n\nHủy dưới 24h sẽ không được hoàn cọc.';
    }

    if (!window.confirm(message)) return;

    setCancellingId(booking.id);
    try {
      await api.post(ENDPOINTS.BOOKING.CANCEL(booking.id));
      alert('Hủy tour thành công.');
      fetchBookings();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.response?.data?.message || 'Không thể hủy tour lúc này.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { className: 'badge badge-secondary', label: 'Đã cọc - Chờ thanh toán phần còn lại', icon: <Clock size={14} /> };
      case 'PAID_FULL':
        return { className: 'badge badge-success', label: 'Đã thanh toán 100%', icon: <Wallet size={14} /> };
      case 'CANCELLED':
        return { className: 'badge', label: 'Đã hủy', icon: <XCircle size={14} />, style: { background: 'var(--danger-soft)', color: 'var(--danger)' } };
      case 'AWAITING_DEPOSIT':
        return { className: 'badge badge-secondary', label: 'Chờ đặt cọc', icon: <Clock size={14} /> };
      case 'PENDING':
        return { className: 'badge', label: 'Chờ xác nhận', icon: <AlertCircle size={14} />, style: { background: '#fff7ed', color: '#b45309' } };
      case 'COMPLETED':
        return { className: 'badge badge-success', label: 'Hoàn thành', icon: <CheckCircle2 size={14} /> };
      default:
        return { className: 'badge', label: status, icon: <Clock size={14} />, style: { background: 'var(--surface-muted)', color: 'var(--text-secondary)' } };
    }
  };

  return (
    <DashboardLayout>
      <div className="page-stack">
        <section className="section-heading">
          <span className="eyebrow">Booking center</span>
          <h1 className="page-title">Lịch sử đặt tour</h1>
          <p className="page-subtitle">Theo dõi toàn bộ booking, khoản thanh toán và trạng thái chuyến đi của bạn trong một bảng nhìn dễ quét hơn.</p>
        </section>

        {loading ? (
          <div className="glass-panel empty-state">
            <p className="page-subtitle">Đang tải danh sách đặt tour...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="booking-list">
            {bookings.map((booking) => {
              const status = getStatusBadge(booking.status);
              return (
                <article key={booking.id} className="glass-card booking-history-card">
                  <div className="booking-date-box">
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {new Date(booking.bookingDate).toLocaleString('en-US', { month: 'short' })}
                    </span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{new Date(booking.bookingDate).getDate()}</span>
                  </div>

                  <div>
                    <h3 className="tour-title" style={{ fontSize: '1.15rem' }}>{booking.tourTitle}</h3>
                    <div className="info-pair" style={{ marginTop: '8px' }}>
                      <MapPin size={14} />
                      Hướng dẫn viên: {booking.guideName}
                    </div>
                    <div className="info-pair" style={{ marginTop: '6px' }}>
                      <Calendar size={14} />
                      {new Date(booking.tourStartDate).toLocaleDateString('vi-VN')} - {booking.numberOfGuests} khách
                    </div>
                  </div>

                  <div>
                    <span className={status.className} style={status.style}>
                      {status.icon}
                      {status.label}
                    </span>
                    {booking.status === 'AWAITING_DEPOSIT' && (
                      <div style={{ marginTop: '8px' }}>
                        <ReservationTimer createdAt={booking.createdAt} />
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                        <span className="muted-text">Giá tour:</span>
                        <span style={{ fontWeight: 700 }}>{formatVND(booking.totalPrice)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                        <span className="muted-text">Đã trả:</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{formatVND(booking.paidAmount)}</span>
                      </div>
                      {booking.totalPrice - booking.paidAmount > 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span className="muted-text">Còn lại:</span>
                          <span style={{ fontWeight: 700, color: '#b45309' }}>{formatVND(booking.totalPrice - booking.paidAmount)}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', marginTop: '10px' }}>
                      <div
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--primary), #06b6d4)',
                          width: `${Math.min(100, (booking.paidAmount / booking.totalPrice) * 100)}%`,
                          transition: 'width 0.3s ease-out'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {booking.status === 'AWAITING_DEPOSIT' ? (
                      <>
                        <button type="button" className="btn-secondary" onClick={() => setPayingBooking(booking)} style={{ color: '#b45309' }}>
                          Thanh toán cọc
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => handleCancel(booking)}>
                          Hủy tour
                        </button>
                      </>
                    ) : booking.status === 'CONFIRMED' ? (
                      <>
                        <button type="button" className="btn-primary" onClick={() => setPayingBooking(booking)}>
                          Thanh toán phần còn lại
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => handleCancel(booking)} style={{ color: 'var(--danger)' }}>
                          Hủy tour
                        </button>
                      </>
                    ) : booking.status === 'COMPLETED' ? (
                      booking.reviewed ? (
                        <span className="badge badge-success">Đã đánh giá</span>
                      ) : (
                        <button type="button" className="btn-primary" onClick={() => setReviewingBooking(booking)}>
                          Viết đánh giá
                        </button>
                      )
                    ) : booking.status !== 'CANCELLED' && booking.status !== 'PAID_FULL' ? (
                      <button
                        type="button"
                        className="btn-danger-outline"
                        onClick={() => handleCancel(booking)}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? 'Đang hủy...' : 'Hủy tour'}
                      </button>
                    ) : (
                      <button type="button" className="icon-button" aria-label="Xem chi tiết">
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel empty-state">
            <Calendar size={42} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <h2 className="section-title">Bạn chưa có đơn đặt tour nào</h2>
            <button type="button" className="btn-primary" style={{ marginTop: '18px' }} onClick={() => (window.location.href = '/')}>
              Khám phá tour
            </button>
          </div>
        )}

        {payingBooking ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(24, 24, 27, 0.65)',
              backdropFilter: 'blur(8px)',
              display: 'grid',
              placeItems: 'center',
              padding: '20px',
              zIndex: 1000,
            }}
          >
            <div className="glass-panel" style={{ width: 'min(100%, 520px)', padding: '30px' }}>
              <div className="section-heading">
                <span className="badge badge-secondary">
                  <Clock size={14} />
                  Thanh toán thủ công
                </span>
                <h2 className="section-title" style={{ marginTop: '12px' }}>
                  {payingBooking.status === 'AWAITING_DEPOSIT' ? 'Thanh toán đặt cọc' : 'Thanh toán phần còn lại'}
                </h2>
                <p className="page-subtitle">
                  Sử dụng cổng thanh toán VNPay để hoàn tất đặt tour <strong>{payingBooking.tourTitle}</strong> một cách nhanh chóng và an toàn.
                </p>
              </div>

              <div className="booking-box" style={{ marginTop: '18px' }}>
                <div className="booking-row">
                  <span className="muted-text">Số tiền thanh toán</span>
                  <strong style={{ color: '#b45309', fontSize: '1.2rem' }}>
                    {formatVND(
                      payingBooking.status === 'AWAITING_DEPOSIT'
                        ? payingBooking.depositAmount
                        : payingBooking.totalPrice - payingBooking.paidAmount,
                    )}
                  </strong>
                </div>
                <div className="muted-text" style={{ marginTop: '14px', lineHeight: 1.8 }}>
                  Cổng: <strong>VNPay (sandbox / production tùy cấu hình server)</strong><br />
                  Trạng thái: <strong>Kết nối an toàn (SSL)</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px', marginTop: '18px' }}>
                <button type="button" className="btn-primary" onClick={handlePayment} disabled={isProcessingPayment}>
                  {isProcessingPayment ? 'Đang chuyển hướng...' : 'Thanh toán qua VNPay'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setPayingBooking(null)}>
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {reviewingBooking ? (
          <ReviewModal
            booking={reviewingBooking}
            onClose={() => setReviewingBooking(null)}
            onSuccess={() => {
              alert('Cảm ơn bạn đã đánh giá.');
              fetchBookings(true);
            }}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default MyBookingsPage;
