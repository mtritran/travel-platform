import React, { useEffect, useState } from 'react';
import {
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertCircle,
  Info,
  Phone,
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, Booking } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatVND, getFileUrl } from '../../utils/format';
import { useNotification } from '../../context/NotificationContext';

const GuideBookingsPage: React.FC = () => {
  const { notifications } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'success' | 'error' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const resp = await api.get<ApiResponse<Booking[]>>(ENDPOINTS.BOOKING.GET_GUIDE_BOOKINGS);
      setBookings(resp.data.result);
    } catch (err) {
      console.error("Lỗi khi tải đơn đặt tour:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };



  useEffect(() => {
    fetchBookings();
  }, []);

  // Real-time refresh logic
  useEffect(() => {
    const latestNotif = notifications[0];
    if (latestNotif?.type === 'NEW_BOOKING' ||
      latestNotif?.type === 'PAYMENT_CONFIRMED' ||
      latestNotif?.type === 'PAYMENT_COMPLETED') {
      fetchBookings(true); // Silent refresh
    }
  }, [notifications]);

  const handleUpdateStatus = async (id: string, status: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Xác nhận thay đổi',
      message: `Bạn có chắc chắn muốn chuyển trạng thái đơn sang ${status === 'CANCELLED' ? 'Từ chối' : 'Phê duyệt'}?`,
      onConfirm: async () => {
        setModal(null);
        setProcessingId(id);
        try {
          await api.post(ENDPOINTS.BOOKING.UPDATE_STATUS(id, status));
          fetchBookings();
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Thành công',
            message: 'Đã cập nhật trạng thái đơn tour thành công!'
          });
        } catch (err) {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Lỗi',
            message: 'Lỗi khi cập nhật trạng thái đơn đặt tour.'
          });
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleCancelByGuide = async (booking: Booking) => {
    let message = "Bạn có chắc chắn muốn hủy đơn đặt tour này? Vì bạn là người hướng dẫn, hệ thống sẽ thực hiện HOÀN LẠI 100% TIỀN CỌC cho khách hàng để đảm bảo quyền lợi.";
    if (booking.paidAmount > 0) {
      message += ` Số tiền khách đã trả và sẽ được hoàn lại: ${formatVND(booking.paidAmount)}`;
    }

    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Hủy đơn & Hoàn tiền',
      message: message,
      onConfirm: async () => {
        setModal(null);
        setProcessingId(booking.id);
        try {
          await api.post(ENDPOINTS.BOOKING.CANCEL(booking.id));
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Đã hủy đơn',
            message: 'Đã hủy đơn thành công và thực hiện lệnh hoàn tiền cho khách.'
          });
          fetchBookings();
        } catch (err: any) {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Lỗi',
            message: err.response?.data?.message || "Lỗi khi hủy đơn đặt tour."
          });
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const getStatusBadge = (booking: Booking) => {
    const status = booking.status;
    switch (status) {
      case 'PENDING':
        return <span style={{ padding: '6px 16px', background: '#fef3c7', color: '#d97706', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> ĐANG CHỜ</span>;
      case 'AWAITING_DEPOSIT':
        return <span style={{ padding: '6px 16px', background: '#fff7ed', color: '#ea580c', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> CHỜ ĐẶT CỌC</span>;
      case 'CONFIRMED':
        return <span style={{ padding: '6px 16px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> ĐÃ ĐẶT CỌC</span>;
      case 'PAID_FULL':
        return <span style={{ padding: '6px 16px', background: '#ecfdf5', color: '#065f46', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> ĐƠN THANH TOÁN ĐỦ</span>;
      case 'COMPLETED':
        return <span style={{ padding: '6px 16px', background: '#dcfce7', color: '#16a34a', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> HOÀN THÀNH</span>;
      case 'CANCELLED':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ padding: '6px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16} /> ĐÃ HỦY</span>
            {(booking as any).refundAmount > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700' }}>Đã hoàn: {formatVND((booking as any).refundAmount)}</span>
            )}
          </div>
        );
      default:
        return <span style={{ padding: '6px 16px', background: '#f1f5f9', color: '#64748b', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #e2e8f0' }}>{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="section-heading" style={{ marginBottom: '40px' }}>
          <span className="eyebrow">Service tracking</span>
          <h1 className="page-title">Đơn khách đặt</h1>
          <p className="page-subtitle">
            Theo dõi, phê duyệt và quản lý các lịch trình du khách đã đặt cọc hoặc thanh toán.
          </p>
        </div>



        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Đang tải dữ liệu đơn đặt tour...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--text-secondary)' }}>
              <Calendar size={40} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Bạn chưa có đơn đặt tour nào</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Khi có du khách đặt tour của bạn, thông tin sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {bookings.map(booking => (
              <div key={booking.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>{booking.tourTitle}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="avatar-pill" style={{ width: '24px', height: '24px' }}>
                          {booking.userAvatarUrl ? (
                            <img src={getFileUrl(booking.userAvatarUrl)} alt={booking.userName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <User size={12} />
                          )}
                        </span>
                        <span><strong>Khách:</strong> {booking.userName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> <strong>Ngày đi:</strong> {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> <strong>Ngày đặt:</strong> {new Date(booking.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', color: 'var(--text-primary)' }}>
                        <MapPin size={16} style={{ color: 'var(--primary)' }} />
                        <strong>Điểm đón:</strong> {booking.pickupLocationName || 'Điểm mặc định'}
                        {booking.pickupLocationAddress && <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({booking.pickupLocationAddress})</span>}
                      </div>

                      {['CONFIRMED', 'PAID_FULL', 'COMPLETED'].includes(booking.status) && booking.userPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
                          <Phone size={16} />
                          <span>Liên hệ khách: <a href={`tel:${booking.userPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{booking.userPhone}</a></span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginBottom: '12px' }}>
                      {formatVND(booking.totalPrice)}
                    </div>
                    {getStatusBadge(booking)}
                  </div>
                </div>

                {/* Các thao tác dành cho Hướng dẫn viên */}
                {booking.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px', marginTop: '12px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                      disabled={processingId === booking.id}
                      style={{
                        borderColor: 'var(--error)',
                        color: 'var(--error)',
                        padding: '14px 32px',
                        fontSize: '1rem',
                        fontWeight: '700',
                        minWidth: '180px'
                      }}
                    >
                      Từ chối đơn
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => handleUpdateStatus(booking.id, 'AWAITING_DEPOSIT')}
                      disabled={processingId === booking.id}
                      style={{
                        background: '#4f46e5',
                        padding: '14px 32px',
                        fontSize: '1rem',
                        fontWeight: '700',
                        minWidth: '220px',
                        boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                      }}
                    >
                      Phê duyệt & Chờ cọc
                    </button>
                  </div>
                )}

                {booking.status === 'PAID_FULL' && (
                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '8px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setModal({
                          isOpen: true,
                          type: 'confirm',
                          title: 'Xác nhận hoàn thành',
                          message: 'Bạn xác nhận Tour đã hoàn thành? Tiền tour (trừ 20% phí sàn) sẽ được chuyển vào ví của bạn.',
                          onConfirm: async () => {
                            setModal(null);
                            setProcessingId(booking.id);
                            try {
                              await api.post(ENDPOINTS.BOOKING.COMPLETE(booking.id));
                              setModal({
                                isOpen: true,
                                type: 'success',
                                title: 'Tuyệt vời!',
                                message: 'Xác nhận hoàn thành Tour thành công! Tiền đã được cộng vào ví của bạn.'
                              });
                              fetchBookings();
                            } catch (err: any) {
                              const msg = err?.response?.data?.message || 'Không thể hoàn thành tour. Vui lòng thử lại.';
                              setModal({
                                isOpen: true,
                                type: 'error',
                                title: 'Không thể hoàn thành',
                                message: msg
                              });
                            } finally {
                              setProcessingId(null);
                            }
                          }
                        });
                      }}
                      disabled={processingId === booking.id}
                      style={{
                        background: '#16a34a',
                        padding: '12px 24px',
                        fontSize: '0.95rem',
                        minWidth: '200px'
                      }}
                    >
                      Đánh dấu Hoàn thành Tour & Nhận tiền
                    </button>
                  </div>
                )}

                {(booking.status === 'CONFIRMED' || booking.status === 'AWAITING_DEPOSIT') && (
                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '8px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleCancelByGuide(booking)}
                      disabled={processingId === booking.id}
                      style={{
                        borderColor: 'var(--error)',
                        color: 'var(--error)',
                        padding: '12px 24px',
                        fontSize: '0.95rem',
                        minWidth: '150px'
                      }}
                    >
                      Hủy đơn & Hoàn tiền
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Premium Modal */}
      {modal?.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: modal.type === 'success' ? 'var(--success-soft)' :
                modal.type === 'error' ? 'var(--error-soft)' :
                  modal.type === 'confirm' ? 'rgba(79, 70, 229, 0.1)' : 'var(--surface-hover)',
              color: modal.type === 'success' ? 'var(--success)' :
                modal.type === 'error' ? 'var(--error)' :
                  modal.type === 'confirm' ? '#4f46e5' : 'var(--text-secondary)'
            }}>
              {modal.type === 'success' ? <CheckCircle2 size={32} /> :
                modal.type === 'error' ? <AlertCircle size={32} /> :
                  modal.type === 'confirm' ? <Info size={32} /> : <Info size={32} />}
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
              {modal.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px', fontSize: '1.1rem' }}>
              {modal.message}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {modal.type === 'confirm' ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => setModal(null)}
                    style={{ padding: '12px 24px', minWidth: '120px' }}
                  >
                    Bỏ qua
                  </button>
                  <button
                    className="btn-primary"
                    onClick={modal.onConfirm}
                    style={{
                      padding: '12px 24px',
                      minWidth: '120px',
                      background: modal.title.includes('Hủy') ? 'var(--error)' : 'var(--primary)'
                    }}
                  >
                    Xác nhận
                  </button>
                </>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => setModal(null)}
                  style={{ padding: '12px 32px', minWidth: '150px' }}
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </DashboardLayout>
  );
};

export default GuideBookingsPage;
