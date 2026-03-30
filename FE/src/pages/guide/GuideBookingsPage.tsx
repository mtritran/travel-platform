import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  User,
  CheckCircle2, 
  XCircle,
  Clock,
  MapPin
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, Booking } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatVND } from '../../utils/format';
import { useNotification } from '../../context/NotificationContext';

const GuideBookingsPage: React.FC = () => {
  const { notifications } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển trạng thái đơn sang ${status}?`)) return;
    
    setProcessingId(id);
    try {
      await api.post(ENDPOINTS.BOOKING.UPDATE_STATUS(id, status));
      fetchBookings();
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái đơn đặt tour.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelByGuide = async (booking: Booking) => {
    let message = "Bạn có chắc chắn muốn hủy đơn đặt tour này? Vì bạn là người hướng dẫn, hệ thống sẽ thực hiện HOÀN LẠI 100% TIỀN CỌC cho khách hàng để đảm bảo quyền lợi.";
    if (booking.paidAmount > 0) {
        message += `\n\nSố tiền khách đã trả và sẽ được hoàn lại: ${formatVND(booking.paidAmount)}`;
    }

    if (!window.confirm(message)) return;

    setProcessingId(booking.id);
    try {
      await api.post(ENDPOINTS.BOOKING.CANCEL(booking.id));
      alert("Đã hủy đơn thành công và thực hiện lệnh hoàn tiền cho khách.");
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi hủy đơn đặt tour.");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (booking: Booking) => {
    const status = booking.status;
    switch (status) {
      case 'PENDING':
        return <span style={{ padding: '6px 16px', background: '#fef3c7', color: '#d97706', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16}/> ĐANG CHỜ</span>;
      case 'AWAITING_DEPOSIT':
        return <span style={{ padding: '6px 16px', background: '#fff7ed', color: '#ea580c', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16}/> CHỜ ĐẶT CỌC</span>;
      case 'CONFIRMED':
        return <span style={{ padding: '6px 16px', background: '#e0e7ff', color: '#4f46e5', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16}/> ĐÃ ĐẶT CỌC</span>;
      case 'PAID_FULL':
        return <span style={{ padding: '6px 16px', background: '#ecfdf5', color: '#065f46', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16}/> ĐƠN THANH TOÁN ĐỦ</span>;
      case 'COMPLETED':
        return <span style={{ padding: '6px 16px', background: '#dcfce7', color: '#16a34a', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16}/> HOÀN THÀNH</span>;
      case 'CANCELLED':
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ padding: '6px 16px', background: '#fee2e2', color: '#dc2626', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '700', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16}/> ĐÃ HỦY</span>
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
      <div style={{ padding: '40px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Quản lý Đơn đặt Tour
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                Xem và phản hồi các đơn đặt chỗ từ du khách cho các tour của bạn.
            </p>
          </div>
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
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={16} /> <strong>Khách:</strong> {booking.userName}</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> <strong>Ngày đi:</strong> {new Date(booking.bookingDate).toLocaleDateString('vi-VN')}</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> <strong>Ngày đặt:</strong> {new Date(booking.createdAt).toLocaleDateString('vi-VN')}</div>
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', color: 'var(--text-primary)' }}>
                            <MapPin size={16} style={{ color: 'var(--primary)' }} /> 
                            <strong>Điểm đón:</strong> {booking.pickupLocationName || 'Điểm mặc định'}
                            {booking.pickupLocationAddress && <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({booking.pickupLocationAddress})</span>}
                         </div>
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
                       onClick={async () => {
                           if (!window.confirm("Bạn xác nhận Tour đã hoàn thành? Tiền tour (trừ 10% phí sàn) sẽ được chuyển vào ví của bạn.")) return;
                           setProcessingId(booking.id);
                           try {
                               await api.post(ENDPOINTS.BOOKING.COMPLETE(booking.id));
                               alert("Xác nhận hoàn thành Tour thành công!");
                               fetchBookings();
                           } catch (err) {
                               alert("Lỗi khi hoàn tất Tour.");
                           } finally {
                               setProcessingId(null);
                           }
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
    </DashboardLayout>
  );
};

export default GuideBookingsPage;
