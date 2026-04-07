import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  Trash2,
  Clock,
  Eye,
  AlertCircle,
  Pencil,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, Tour } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';

type BadgeTone = 'expired' | 'pending' | 'rejected' | 'inactive' | 'active';

type StatusBadge = {
  label: string;
  tone: BadgeTone;
  icon: React.ReactNode;
  value?: string;
};

const GuideToursPage: React.FC = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  const toIsoDateString = (val: any) => {
    if (Array.isArray(val)) {
      const [y, m, d] = val;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return typeof val === 'string' ? val.split('T')[0] : '';
  };

  const fetchTours = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Tour[]>>(ENDPOINTS.TOUR.GET_MY_TOURS);
      setTours(response.data.result);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tour:', err);
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa tour này? Tất cả dữ liệu liên quan có thể bị mất.')) {
      return;
    }

    try {
      await api.delete(ENDPOINTS.TOUR.DELETE(id));
      fetchTours();
    } catch (err: any) {
      if (err.response?.data?.code === 1022) {
        alert(
          'Không thể xóa tour vì đã có khách đặt. Vui lòng chuyển tour sang ẩn thay vì xóa cứng để bảo toàn thông tin đơn hàng.'
        );
      } else {
        alert(err.response?.data?.message || 'Lỗi khi xóa tour.');
      }
    }
  };

  const getStatusBadge = (tour: Tour): StatusBadge => {
    const tourDate = tour.startDate ? new Date(toIsoDateString(tour.startDate)) : null;
    if (tourDate && tour.startTime) {
      const [h, m] = tour.startTime.split(':').map(Number);
      tourDate.setHours(h, m, 0, 0);
    }
    const isExpired = tourDate ? tourDate < new Date() : false;

    if (isExpired && tour.status === 'ACTIVE') {
      return {
        label: 'Đã kết thúc',
        tone: 'expired',
        icon: <Clock size={16} />,
      };
    }

    const startDateTime = tourDate || new Date(`${toIsoDateString(tour.startDate)}T${tour.startTime}`);
    const cutoffTime = new Date(startDateTime.getTime() - (tour.bookingCutoffMinutes || 0) * 60000);
    const isPastCutoff = new Date() > cutoffTime;

    if (isPastCutoff && tour.status === 'ACTIVE') {
      return {
        label: 'Hết hạn đặt',
        tone: 'expired',
        icon: <Clock size={16} />,
      };
    }

    if (tour.status === 'PENDING_APPROVAL') {
      return {
        label: 'Đang chờ duyệt',
        tone: 'pending',
        icon: <Clock size={16} />,
      };
    }

    if (tour.status === 'REJECTED') {
      return {
        label: 'Bị từ chối',
        tone: 'rejected',
        icon: <AlertCircle size={16} />,
      };
    }

    if (tour.status === 'INACTIVE') {
      return {
        label: 'Đang ẩn',
        tone: 'inactive',
        icon: <AlertCircle size={16} />,
      };
    }

    if (tour.status === 'ACTIVE') {
      return {
        label: 'Đang mở',
        tone: 'active',
        icon: <ArrowUpRight size={16} />,
      };
    }

    return {
      label: 'Đang mở',
      tone: 'active',
      icon: <ArrowUpRight size={16} />,
    };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách tour của bạn...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '40px',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div className="section-heading">
            <span className="eyebrow">Inventory</span>
            <h1 className="page-title">Quản lý tour</h1>
            <p className="page-subtitle">
              Thiết kế, cập nhật và quản lý danh sách các hành trình du lịch của bạn.
            </p>
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
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--surface-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                color: 'var(--text-secondary)',
              }}
            >
              <MapPin size={40} />
            </div>
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              Bạn chưa có tour nào
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Hãy bắt đầu bằng cách tạo tour đầu tiên của bạn để chia sẻ trải nghiệm với du khách.
            </p>
            <button className="btn-primary" onClick={() => navigate('/guide/create-tour')}>
              Đăng Tour ngay
            </button>
          </div>
        ) : (
          <div className="guide-tour-grid">
            {tours.map((tour) => {
              const statusBadge = getStatusBadge(tour);

              return (
                <Link to={`/tours/${tour.id}`} key={tour.id} className="guide-tour-card-link">
                  <article className="guide-tour-card glass-card">
                    <div className="guide-tour-card-media">
                      <img
                        src={
                          tour.imageUrl ||
                          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80'
                        }
                        alt={tour.title}
                        className="guide-tour-card-image"
                      />
                      <div className="guide-tour-card-overlay" />

                      <div className="guide-tour-card-media-copy">
                        <p className="guide-tour-card-kicker">Tour của bạn</p>
                        <h3 className="guide-tour-card-title">{tour.title}</h3>
                      </div>
                    </div>

                    <div className="guide-tour-card-content">
                      <div className="guide-tour-card-location">
                        <MapPin size={16} />
                        <span>{tour.locationName}</span>
                      </div>

                      <div className="guide-tour-meta-row">
                        <div className="guide-tour-meta-card">
                          <span className="guide-tour-meta-label">Ngày tạo</span>
                          <div className="guide-tour-meta-value">
                            <CalendarDays size={15} />
                            <span>{new Date(tour.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>

                        <div className="guide-tour-meta-card">
                          <span className="guide-tour-meta-label">Trạng thái</span>
                          <div className="guide-tour-meta-value">
                            {statusBadge.icon}
                            <span>{statusBadge.label}</span>
                          </div>
                        </div>
                      </div>
                      
                      {tour.status === 'INACTIVE' && tour.hiddenReason && (
                        <div style={{ 
                          marginTop: '16px', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          background: '#ef444408', 
                          border: '1px solid #ef444420',
                          display: 'flex',
                          gap: '10px'
                        }}>
                          <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#ef4444', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lưu ý từ Admin</span>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{tour.hiddenReason}</p>
                          </div>
                        </div>
                      )}

                      <div className="guide-tour-card-footer">
                        <div className="guide-tour-quick-note">
                          <Clock size={15} />
                          <span>Xem, chỉnh sửa hoặc gỡ tour nhanh</span>
                        </div>

                        <div className="guide-tour-actions">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/guide/edit-tour/${tour.id}`);
                            }}
                            className="guide-tour-action"
                            title="Chỉnh sửa tour"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/tours/${tour.id}`);
                            }}
                            className="guide-tour-action"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(tour.id, e);
                            }}
                            className="guide-tour-action guide-tour-action-danger"
                            title="Xóa tour"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GuideToursPage;
