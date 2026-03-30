import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  PlusCircle, 
  MapPin, 
  Trash2,
  Clock,
  Eye,
  AlertCircle,
  Edit2
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, Tour } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatVND } from '../../utils/format';

const GuideToursPage: React.FC = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Tour[]>>(ENDPOINTS.TOUR.GET_MY_TOURS);
      setTours(response.data.result);
    } catch (err) {
      console.error("Lỗi khi tải danh sách tour:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa tour này? Tất cả dữ liệu liên quan có thể bị mất.")) return;
    
    try {
      await api.delete(ENDPOINTS.TOUR.DELETE(id));
      fetchTours();
    } catch (err: any) {
      if (err.response?.data?.code === 1022) {
        alert("Không thể xóa Tour vì đã có khách đặt (kể cả chưa nhận hay đã hoàn thành). Vui lòng chuyển trạng thái Tour sang Ẩn thay vì xóa cứng để bảo toàn thông tin đơn hàng.");
      } else {
        alert(err.response?.data?.message || "Lỗi khi xóa tour.");
      }
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
         <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách Tour của bạn...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={{ padding: '40px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Tour của tôi
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Quản lý các tour du lịch mà bạn đang cung cấp trên TravelX.</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => navigate('/guide/create-tour')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: 'bold' }}
          >
            <PlusCircle size={20} />
            Đăng Tour mới
          </button>
        </div>

        {tours.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
             <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--text-secondary)' }}>
                <MapPin size={40} />
             </div>
             <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Bạn chưa có tour nào</h3>
             <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Hãy bắt đầu bằng cách tạo tour đầu tiên của bạn để chia sẻ trải nghiệm với du khách!</p>
             <button className="btn-primary" onClick={() => navigate('/guide/create-tour')}>Đăng Tour ngay</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
            {tours.map(tour => (
              <Link to={`/tour/${tour.id}`} key={tour.id} style={{ textDecoration: 'none' }}>
                <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.3s', border: '1px solid var(--glass-border)' }}>
                  <div style={{ position: 'relative', height: '200px' }}>
                    <img 
                      src={tour.imageUrl || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80'} 
                      alt={tour.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {(() => {
                        const isExpired = new Date(`${tour.startDate}T${tour.startTime}`) < new Date();
                        if (isExpired) {
                            return (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                                    <div style={{ background: '#f59e0b', color: 'white', padding: '8px 20px', borderRadius: '24px', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)' }}>
                                        <Clock size={18} /> ĐÃ QUÁ HẠN
                                    </div>
                                </div>
                            );
                        }
                        if (tour.status === 'PENDING_APPROVAL') {
                            return (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                                    <div style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '24px', fontWeight: '800', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={18} /> ĐANG CHỜ DUYỆT
                                    </div>
                                </div>
                            );
                        }
                        if (tour.status === 'REJECTED') {
                            return (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                                    <div style={{ background: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '24px', fontWeight: '800', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={18} /> BỊ TỪ CHỐI
                                    </div>
                                </div>
                            );
                        }
                        if (tour.status === 'INACTIVE') {
                            return (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                                    <div style={{ background: '#6b7280', color: 'white', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertCircle size={16} /> ĐÃ BỊ ẨN
                                    </div>
                                </div>
                            );
                        }
                        return (
                          <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.9)', padding: '6px 14px', borderRadius: '24px', fontSize: '1rem', fontWeight: '900', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(10px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <span style={{ fontSize: '1.1rem' }}>₫</span> {formatVND(tour.price).replace('₫', '').trim()}
                          </div>
                        );
                    })()}
                  </div>

                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{tour.title}</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.875rem' }}>
                      <MapPin size={16} /><span>{tour.locationName}</span>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                          <Clock size={16} /> {new Date(tour.createdAt).toLocaleDateString('vi-VN')}
                       </div>
                       
                       <div style={{ display: 'flex', gap: '10px' }}>
                           <button 
                             onClick={(e) => { e.preventDefault(); navigate(`/guide/edit-tour/${tour.id}`); }}
                             style={{ width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '2px solid var(--primary)', color: 'var(--primary)', background: 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
                             title="Chỉnh sửa tour"
                           >
                              <Edit2 size={20} />
                           </button>
                          <button 
                            onClick={(e) => { e.preventDefault(); navigate(`/tour/${tour.id}`); }}
                            style={{ width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '2px solid var(--primary)', color: 'var(--primary)', background: 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
                            title="Xem chi tiết"
                          >
                             <Eye size={20} />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(tour.id, e)}
                            style={{ width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '2px solid var(--primary)', color: 'var(--primary)', background: 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
                            title="Xóa tour"
                          >
                             <Trash2 size={20} />
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GuideToursPage;
