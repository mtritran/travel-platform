import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, ChevronRight, Clock, AlertCircle, Wallet, XCircle, AlertTriangle, Camera, Trash2, Phone, User } from 'lucide-react';
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
  const { showToast } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [disputingBooking, setDisputingBooking] = useState<Booking | null>(null);
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
  const [showCancelModal, setShowCancelModal] = useState<Booking | null>(null);
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

  const executeCancel = async (booking: Booking) => {
    setCancellingId(booking.id);
    try {
      await api.post(ENDPOINTS.BOOKING.CANCEL(booking.id));
      setShowCancelModal(null);
      fetchBookings();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.response?.data?.message || 'Không thể hủy tour lúc này.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelClick = (booking: Booking) => {
    setShowCancelModal(booking);
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingBooking || !disputeReason) return;

    setIsDisputing(true);
    const formData = new FormData();
    formData.append('reason', disputeReason);
    disputeFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await api.post(ENDPOINTS.BOOKING.DISPUTE(disputingBooking.id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.code === 1000) {
        showToast('Gửi khiếu nại thành công! Admin sẽ sớm phản hồi.', 'success');
        setDisputingBooking(null);
        setDisputeReason('');
        setDisputeFiles([]);
        fetchBookings();
      } else {
        showToast(response.data.message || 'Lỗi khi gửi khiếu nại.', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi máy chủ khi gửi khiếu nại.', 'error');
    } finally {
      setIsDisputing(false);
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
      <div className="page-stack bookings-page">
        <section className="section-heading bookings-head">
          <span className="eyebrow">Booking center</span>
          <h1 className="page-title">Lịch sử đặt tour</h1>
          <p className="page-subtitle">Theo dõi toàn bộ booking, khoản thanh toán và trạng thái chuyến đi của bạn trong một bảng nhìn dễ quét hơn.</p>
        </section>

        {loading ? (
          <div className="glass-panel collection-empty-state">
            <p className="page-subtitle">Đang tải danh sách đặt tour...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="booking-list bookings-list">
            {bookings.map((booking) => {
              const status = getStatusBadge(booking.status);
              return (
                <article key={booking.id} className="glass-card booking-history-card booking-history-card-premium">
                  <div className="booking-date-box">
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {new Date(booking.bookingDate).toLocaleString('en-US', { month: 'short' })}
                    </span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{new Date(booking.bookingDate).getDate()}</span>
                  </div>

                  <div className="booking-history-main">
                    <h3 className="tour-title" style={{ fontSize: '1.15rem' }}>{booking.tourTitle}</h3>
                    <div className="info-pair" style={{ marginTop: '8px' }}>
                      <User size={14} />
                      Hướng dẫn viên: <Link to={`/profile/${booking.guideId}`} style={{ fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}>{booking.guideName}</Link>
                    </div>
                    {['CONFIRMED', 'PAID_FULL', 'COMPLETED'].includes(booking.status) && booking.guidePhone && (
                      <div className="info-pair" style={{ marginTop: '6px', color: 'var(--primary)', fontWeight: 700 }}>
                        <Phone size={14} />
                        Liên hệ HDV: <a href={`tel:${booking.guidePhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{booking.guidePhone}</a>
                      </div>
                    )}
                    <div className="info-pair" style={{ marginTop: '6px' }}>
                      <Calendar size={14} />
                      {new Date(booking.tourStartDate).toLocaleDateString('vi-VN')} - {booking.numberOfGuests} khách
                    </div>
                  </div>

                  <div className="booking-history-status">
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

                  <div className="booking-history-finance">
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

                  <div className="booking-history-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {booking.status === 'AWAITING_DEPOSIT' ? (
                      <>
                        <button type="button" className="btn-secondary" onClick={() => setPayingBooking(booking)} style={{ color: '#b45309' }}>
                          Thanh toán cọc
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => handleCancelClick(booking)}>
                          Hủy tour
                        </button>
                      </>
                    ) : booking.status === 'CONFIRMED' ? (
                      <>
                        <button type="button" className="btn-primary" onClick={() => setPayingBooking(booking)}>
                          Thanh toán phần còn lại
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => handleCancelClick(booking)} style={{ color: 'var(--danger)' }}>
                          Hủy tour
                        </button>
                      </>
                    ) : (booking.status === 'COMPLETED' || (booking.status === 'PAID_FULL' && new Date().getTime() > new Date(booking.tourStartDate + 'T' + (booking.tourStartTime || '00:00:00')).getTime())) ? (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {!booking.isDisputed && (!booking.payoutAt || new Date().getTime() < new Date(booking.payoutAt).getTime()) && (
                          <button 
                            type="button" 
                            className="btn-primary" 
                            style={{ 
                              background: 'rgba(220, 38, 38, 0.06)', 
                              color: '#dc2626', 
                              border: '1px solid rgba(220, 38, 38, 0.15)',
                              boxShadow: '0 8px 20px rgba(220, 38, 38, 0.08)',
                              padding: '0 24px'
                            }}
                            onClick={() => setDisputingBooking(booking)}
                          >
                            Khiếu nại
                          </button>
                        )}
                        {booking.isDisputed ? (
                          <span className="badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            Đang khiếu nại
                          </span>
                        ) : (booking.status === 'COMPLETED' && !booking.reviewed) ? (
                          <button type="button" className="btn-primary" onClick={() => setReviewingBooking(booking)}>
                            Viết đánh giá
                          </button>
                        ) : booking.reviewed ? (
                          <span className="badge badge-success">Đã đánh giá</span>
                        ) : null}
                      </div>
                    ) : (booking.status !== 'CANCELLED' && booking.status !== 'PAID_FULL') ? (
                      <button
                        type="button"
                        className="btn-danger-outline"
                        onClick={() => handleCancelClick(booking)}
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
          <div className="glass-panel collection-empty-state">
            <div className="collection-empty-icon">
              <Calendar size={40} />
            </div>
            <h2 className="collection-empty-title">Bạn chưa có đơn đặt tour nào</h2>
            <p className="collection-empty-copy">
              Hãy bắt đầu khảo sát và chọn một hành trình phù hợp để lưu lại toàn bộ lịch sử đặt tour của bạn tại đây.
            </p>
            <button type="button" className="btn-primary" style={{ marginTop: '18px' }} onClick={() => (window.location.href = '/') }>
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
            <div className="glass-panel" style={{ width: 'min(100%, 540px)', padding: '32px', borderRadius: '28px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  padding: '18px',
                  borderRadius: '22px',
                  background: 'linear-gradient(135deg, rgba(255,247,237,0.96), rgba(255,255,255,0.92))',
                  border: '1px solid #fed7aa',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 14px',
                      borderRadius: '999px',
                      background: '#ffffff',
                      color: '#c2410c',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      border: '1px solid #fdba74',
                    }}
                  >
                    <Wallet size={14} />
                    Xác nhận thanh toán
                  </span>
                  <h2 className="section-title" style={{ marginTop: '14px', marginBottom: '8px', fontSize: '1.55rem' }}>
                    {payingBooking.status === 'AWAITING_DEPOSIT'
                      ? 'Hoàn tất khoản đặt cọc'
                      : 'Thanh toán phần còn lại'}
                  </h2>
                  <p className="page-subtitle" style={{ margin: 0, lineHeight: 1.7 }}>
                    Thanh toán cho tour <strong>{payingBooking.tourTitle}</strong> qua VNPay để giữ chỗ nhanh chóng và an toàn.
                  </p>
                </div>

                <div
                  style={{
                    minWidth: '110px',
                    padding: '12px 14px',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.88)',
                    border: '1px solid #ffedd5',
                    textAlign: 'center',
                  }}
                >
                  <div className="muted-text" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Cần thanh toán</div>
                  <strong style={{ color: '#b45309', fontSize: '1.15rem', lineHeight: 1.3 }}>
                    {formatVND(
                      payingBooking.status === 'AWAITING_DEPOSIT'
                        ? payingBooking.depositAmount
                        : payingBooking.totalPrice - payingBooking.paidAmount,
                    )}
                  </strong>
                </div>
              </div>

              <div className="booking-box" style={{ marginTop: '18px', padding: '20px', borderRadius: '22px' }}>
                <div className="booking-row">
                  <span className="muted-text">Hạng mục</span>
                  <strong>{payingBooking.status === 'AWAITING_DEPOSIT' ? 'Khoản đặt cọc' : 'Khoản thanh toán còn lại'}</strong>
                </div>
                <div className="booking-row">
                  <span className="muted-text">Cổng thanh toán</span>
                  <strong>VNPay</strong>
                </div>
                <div className="booking-row">
                  <span className="muted-text">Bảo mật</span>
                  <strong>Kết nối SSL an toàn</strong>
                </div>
                <div
                  style={{
                    marginTop: '16px',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: '#fff7ed',
                    border: '1px solid #ffedd5',
                    color: '#9a3412',
                    fontSize: '0.92rem',
                    lineHeight: 1.7,
                  }}
                >
                  Sau khi hoàn tất, hệ thống sẽ tự động cập nhật trạng thái đơn đặt tour của bạn.
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ minHeight: '52px', borderRadius: '16px', fontWeight: 800 }}
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? 'Đang chuyển hướng...' : 'Tiếp tục với VNPay'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ minHeight: '48px', borderRadius: '16px' }}
                  onClick={() => setPayingBooking(null)}
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showCancelModal ? (
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
            <div className="glass-panel" style={{ width: 'min(100%, 480px)', padding: '32px', borderRadius: '28px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'var(--danger-soft)',
                  color: 'var(--danger)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <AlertCircle size={32} />
                </div>
                <h2 className="section-title" style={{ fontSize: '1.4rem' }}>Xác nhận hủy tour</h2>
                <p className="page-subtitle" style={{ marginTop: '8px' }}>
                  Bạn có chắc chắn muốn hủy tour <strong>{showCancelModal.tourTitle}</strong>?
                </p>
              </div>

              {showCancelModal.paidAmount > 0 && (() => {
                const now = new Date();
                const startDateTime = new Date(`${showCancelModal.tourStartDate}T${showCancelModal.tourStartTime}`);
                const diffHours = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                let refundInfo = '';
                let refundNote = '';

                if (diffHours > 48) {
                  refundInfo = `Hoàn 100%: ${formatVND(showCancelModal.paidAmount)}`;
                  refundNote = 'Chính sách: Hủy trước 48h được hoàn cọc đầy đủ.';
                } else if (diffHours > 24) {
                  refundInfo = `Hoàn 50%: ${formatVND(showCancelModal.paidAmount * 0.5)}`;
                  refundNote = 'Chính sách: Hủy trước 24h được hoàn 50% cọc.';
                } else {
                  refundInfo = 'Không được hoàn cọc';
                  refundNote = 'Chính sách: Hủy dưới 24h không hỗ trợ hoàn cọc.';
                }

                return (
                  <div style={{
                    padding: '20px',
                    borderRadius: '18px',
                    background: '#fff1f1',
                    border: '1px solid #fecaca',
                    marginBottom: '24px'
                  }}>
                    <div style={{ color: '#991b1b', fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>
                      {refundInfo}
                    </div>
                    <div style={{ color: '#dc2626', fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {refundNote}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCancelModal(null)}
                  style={{ minHeight: '48px' }}
                >
                  Giữ lại
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: 'var(--danger)', boxShadow: '0 10px 20px rgba(220, 38, 38, 0.2)', minHeight: '48px' }}
                  onClick={() => executeCancel(showCancelModal)}
                  disabled={cancellingId === showCancelModal.id}
                >
                  {cancellingId === showCancelModal.id ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {disputingBooking && (
          <div className="review-modal-overlay">
            <div className="glass-panel review-modal-card" style={{ width: 'min(100%, 540px)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <AlertTriangle size={32} />
                </div>
                <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Gửi khiếu nại tour</h2>
                <p className="page-subtitle" style={{ margin: 0 }}>Vui lòng cung cấp lý do chi tiết và bằng chứng hình ảnh (nếu có) để Admin hỗ trợ phân xử.</p>
              </div>

              <form onSubmit={handleDisputeSubmit} style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label className="field-label">Lý do khiếu nại <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea
                    required
                    className="input-field"
                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    style={{ minHeight: '120px', padding: '16px', borderRadius: '16px', resize: 'none' }}
                  />
                </div>

                <div>
                  <label className="field-label">Bằng chứng hình ảnh (Tải lên nhiều ảnh)</label>
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                    background: 'white', border: '2px dashed #e2e8f0', borderRadius: '16px', cursor: 'pointer',
                    transition: 'all 0.2s', borderColor: disputeFiles.length > 0 ? 'var(--primary)' : '#e2e8f0'
                  }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setDisputeFiles(prev => [...prev, ...files]);
                        e.target.value = ''; // Reset to allow same-file selection if needed
                      }}
                    />
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Camera size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Chọn ảnh bằng chứng</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Nhấn để chọn một hoặc nhiều ảnh (JPG, PNG)</p>
                    </div>
                  </label>

                  {disputeFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                      {disputeFiles.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} style={{ 
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', 
                          background: 'var(--surface-muted)', borderRadius: '12px', border: '1px solid var(--line)'
                        }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setDisputeFiles(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: '2px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn-ghost" onClick={() => setDisputingBooking(null)} disabled={isDisputing} style={{ height: '52px', borderRadius: '16px' }}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn-primary" disabled={isDisputing || !disputeReason} style={{ height: '52px', borderRadius: '16px', background: '#dc2626', borderColor: '#dc2626' }}>
                    {isDisputing ? 'Đang gửi...' : 'Gửi khiếu nại'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {reviewingBooking && (
          <ReviewModal
            booking={reviewingBooking}
            onClose={() => setReviewingBooking(null)}
            onSuccess={() => {
              setReviewingBooking(null);
              fetchBookings();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyBookingsPage;
