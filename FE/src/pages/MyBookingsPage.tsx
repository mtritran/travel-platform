import React, { useEffect, useState } from 'react';
import { 
  Calendar, CheckCircle2, Clock, MapPin, XCircle, AlertCircle, 
  ChevronRight, Star, Wallet 
} from 'lucide-react';
import api from '../services/api';
import type { Booking, ApiResponse } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import { formatVND } from '../utils/format';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNotification } from '../context/NotificationContext';
import ReviewModal from '../components/ReviewModal';

const MyBookingsPage: React.FC = () => {
  const { notifications } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get<ApiResponse<Booking[]>>(ENDPOINTS.BOOKING.MY_BOOKINGS);
      setBookings(response.data.result);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Real-time update logic
  useEffect(() => {
    const latestNotif = notifications[0];
    if (latestNotif?.type === 'BOOKING_STATUS_UPDATE' || 
        latestNotif?.type === 'TOUR_REQUEST_MATCHED' ||
        latestNotif?.type === 'TOUR_COMPLETED') {
       fetchBookings(true); // Silent refresh
    }
  }, [notifications]);

  const handlePayment = async () => {
    if (!payingBooking) return;
    setIsProcessingPayment(true);
    try {
      if (payingBooking.status === 'AWAITING_DEPOSIT') {
        await api.post(ENDPOINTS.BOOKING.PAY_DEPOSIT(payingBooking.id));
        alert("Thanh toán cọc thành công! Tour của bạn đã được xác nhận.");
      } else {
        await api.post(ENDPOINTS.BOOKING.PAY_REMAINING(payingBooking.id));
        alert("Thanh toán phần còn lại thành công! Bạn đã hoàn tất nghĩa vụ tài chính cho tour này.");
      }
      setPayingBooking(null);
      fetchBookings();
    } catch (err: any) {
      console.error("Lỗi khi thanh toán:", err);
      alert(err.response?.data?.message || "Không thể thực hiện thanh toán lúc này.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    let message = "Bạn có chắc chắn muốn hủy tour này?";
    
    // Simple logic preview for UI
    const now = new Date();
    const startDateTime = new Date(`${booking.tourStartDate}T${booking.tourStartTime}`);
    const diffHours = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (booking.paidAmount > 0) {
        if (diffHours > 48) message += `\n\nQuy định hoàn tiền: Được hoàn tiền 100% (${formatVND(booking.paidAmount)}) vì hủy trước 48h.`;
        else if (diffHours > 24) message += `\n\nQuy định hoàn tiền: Được hoàn tiền 50% (${formatVND(booking.paidAmount * 0.5)}) vì hủy trước 24h-48h.`;
        else message += `\n\nQuy định hoàn tiền: Bạn sẽ KHÔNG ĐƯỢC hoàn tiền cọc (hủy < 24h).`;
    }

    if (!window.confirm(message)) return;

    setCancellingId(booking.id);
    try {
      await api.post(ENDPOINTS.BOOKING.CANCEL(booking.id));
      alert("Hủy tour thành công!");
      fetchBookings();
    } catch (err: any) {
      console.error("Lỗi khi hủy tour:", err);
      alert(err.response?.data?.message || "Không thể hủy tour lúc này.");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', icon: <CheckCircle2 size={16} /> };
      case 'PAID_FULL':
        return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', icon: <Wallet size={16} /> };
      case 'CANCELLED':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', icon: <XCircle size={16} /> };
      case 'AWAITING_DEPOSIT':
        return { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5', icon: <Clock size={16} /> };
      case 'PENDING':
        return { bg: '#fffbeb', text: '#92400e', border: '#fde68a', icon: <AlertCircle size={16} /> };
      case 'COMPLETED':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', icon: <CheckCircle2 size={16} /> };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', icon: <Clock size={16} /> };
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '32px', marginTop: '24px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>Lịch sử đặt tour</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Quản lý các đơn đặt tour và trạng thái chuyến đi của bạn</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách đặt tour...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {bookings.length > 0 ? bookings.map((booking) => {
            const statusStyle = getStatusStyle(booking.status);
            return (
              <div 
                key={booking.id} 
                className="glass-card" 
                style={{ 
                  padding: '24px', 
                  display: 'grid', 
                  gridTemplateColumns: 'auto 1.5fr 1fr 1fr auto',
                  alignItems: 'center',
                  gap: '32px'
                }}
              >
                {/* Date Icon */}
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  background: 'var(--surface-hover)', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid var(--glass-border)'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {new Date(booking.bookingDate).toLocaleString('en-US', { month: 'short' })}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {new Date(booking.bookingDate).getDate()}
                  </span>
                </div>

                {/* Tour Info */}
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    {booking.tourTitle}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <MapPin size={14} /> Hướng dẫn viên: {booking.guideName}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.8125rem', 
                    fontWeight: '700',
                    background: statusStyle.bg,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`
                  }}>
                    {statusStyle.icon} {
                      booking.status === 'CONFIRMED' ? 'ĐÃ ĐẶT CỌC' :
                      booking.status === 'PAID_FULL' ? 'ĐÃ THANH TOÁN ĐỦ' :
                      booking.status === 'CANCELLED' ? 'ĐÃ HỦY' :
                      booking.status === 'PENDING' ? 'CHỜ XÁC NHẬN' :
                      booking.status === 'AWAITING_DEPOSIT' ? 'CHỜ ĐẶT CỌC' :
                      booking.status === 'COMPLETED' ? 'HOÀN THÀNH' : booking.status
                    }
                  </span>
                </div>

                {/* Price */}
                <div>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Tổng thanh toán</p>
                   <p style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {formatVND(booking.totalPrice)}
                   </p>
                   {booking.status === 'AWAITING_DEPOSIT' && (
                       <p style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: '700', marginTop: '4px' }}>
                          Cần cọc: {formatVND(booking.depositAmount)}
                       </p>
                   )}
                </div>

                {/* Action */}
                <div>
                    {booking.status === 'AWAITING_DEPOSIT' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button 
                                onClick={() => setPayingBooking(booking)}
                                style={{ 
                                    padding: '10px 20px', 
                                    background: '#ea580c', 
                                    color: 'white', 
                                    borderRadius: '10px', 
                                    fontSize: '0.875rem', 
                                    fontWeight: '700', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Thanh toán cọc ({booking.depositPercentage || 30}%)
                            </button>
                            <button 
                                onClick={() => handleCancel(booking)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Hủy tour
                            </button>
                        </div>
                    ) : booking.status === 'CONFIRMED' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button 
                                onClick={() => setPayingBooking(booking)}
                                style={{ 
                                    padding: '10px 20px', 
                                    background: 'var(--primary)', 
                                    color: 'white', 
                                    borderRadius: '10px', 
                                    fontSize: '0.875rem', 
                                    fontWeight: '700', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Thanh toán nốt
                            </button>
                            <button 
                                onClick={() => handleCancel(booking)}
                                style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Hủy tour
                            </button>
                        </div>
                    ) : (booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && booking.status !== 'PAID_FULL') ? (
                        <button 
                            className="btn-secondary"
                            onClick={() => handleCancel(booking)}
                            disabled={cancellingId === booking.id}
                            style={{ 
                                padding: '8px 16px', 
                                color: 'var(--error)', 
                                borderColor: 'var(--error)',
                                fontSize: '0.8125rem',
                                fontWeight: '700'
                            }}
                        >
                            {cancellingId === booking.id ? 'Đang hủy...' : 'Hủy tour'}
                        </button>
                    ) : booking.status === 'COMPLETED' ? (
                        booking.reviewed ? (
                            <span style={{ 
                                padding: '8px 16px', 
                                background: '#ecfdf5',
                                color: '#059669',
                                borderRadius: '12px',
                                fontSize: '0.8125rem',
                                fontWeight: '700',
                                border: '1px solid #a7f3d0'
                            }}>
                                Đã đánh giá
                            </span>
                        ) : (
                            <button 
                                className="btn-primary"
                                onClick={() => setReviewingBooking(booking)}
                                style={{ 
                                    padding: '8px 16px', 
                                    background: '#4f46e5',
                                    fontSize: '0.8125rem',
                                    fontWeight: '700',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Viết đánh giá
                            </button>
                        )
                    ) : (
                        <button style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--surface-hover)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)'
                        }}>
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>
              </div>
            );
          }) : (
            <div className="glass-panel" style={{ padding: '80px 0', textAlign: 'center' }}>
               <Calendar size={48} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '16px' }} />
               <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Bạn chưa có đơn đặt tour nào.</p>
               <button 
                onClick={() => window.location.href = '/'} 
                style={{ marginTop: '24px', padding: '12px 24px', background: 'var(--primary)', color: 'white', fontWeight: '700' }}
               >
                 Khám phá Tour
               </button>
            </div>
          )}
        </div>
      )}
      {/* Payment Modal Simulation */}
      {payingBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ 
            maxWidth: '500px', 
            width: '100%', 
            padding: '40px', 
            textAlign: 'center',
            background: 'var(--surface-primary)',
            border: '2px solid #ea580c'
          }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Clock size={40} color="#ea580c" />
            </div>
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>
                {payingBooking.status === 'AWAITING_DEPOSIT' ? 'Thanh toán đặt cọc' : 'Thanh toán còn lại'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Vui lòng chuyển khoản số tiền {payingBooking.status === 'AWAITING_DEPOSIT' ? 'cọc' : 'còn lại'} để xác nhận tour <strong>{payingBooking.tourTitle}</strong>.
            </p>

            <div style={{ background: 'var(--surface-hover)', padding: '24px', borderRadius: '16px', marginBottom: '32px', textAlign: 'left', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Số tiền thanh toán:</span>
                <span style={{ fontWeight: '800', color: '#ea580c', fontSize: '1.25rem' }}>
                    {formatVND(payingBooking.status === 'AWAITING_DEPOSIT' ? payingBooking.depositAmount : (payingBooking.totalPrice - payingBooking.paidAmount))}
                </span>
              </div>
              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '16px 0' }}></div>
              <p style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Thông tin chuyển khoản (Demo):</p>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <p>Ngân hàng: <strong>MB BANK</strong></p>
                <p>Số tài khoản: <strong>99999999999</strong></p>
                <p>Chủ tài khoản: <strong>TRẦN MINH TRÍ</strong></p>
                <p>Nội dung: <strong>TP {payingBooking.id.substring(0,8)}</strong></p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '16px', background: '#ea580c' }}
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? 'Đang xác nhận...' : 'Tôi đã chuyển khoản'}
                </button>
                <button 
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}
                  onClick={() => setPayingBooking(null)}
                >
                  Hủy bỏ
                </button>
            </div>
          </div>
        </div>
      )}

      {reviewingBooking && (
        <ReviewModal 
          booking={reviewingBooking} 
          onClose={() => setReviewingBooking(null)}
          onSuccess={() => {
            alert("Cảm ơn bạn đã đánh giá!");
            fetchBookings(true);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default MyBookingsPage;
