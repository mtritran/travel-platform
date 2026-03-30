import React, { useEffect, useState } from 'react';
import { 
  Trash2, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Eye,
  EyeOff,
  User as UserIcon
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, Tour, Page } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import { formatVND } from '../../utils/format';
import DashboardLayout from '../../layouts/DashboardLayout';

const AdminToursPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTours = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Page<Tour>>>(ENDPOINTS.TOUR.GET_ALL_ADMIN, {
        params: { page: pageNumber, size: 8 }
      });
      const data = response.data.result;
      setTours(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(data.number);
    } catch (err) {
      console.error("Failed to fetch tours:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours(page);
  }, [page]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const msg = currentStatus ? "Tạm mưng hoạt động tour này?" : "Kích hoạt lại tour này?";
    if (!window.confirm(msg)) return;
    
    try {
      await api.patch(ENDPOINTS.TOUR.TOGGLE_STATUS(id));
      fetchTours(page);
    } catch (err) {
      alert("Lỗi khi thay đổi trạng thái tour.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tour này?")) return;
    try {
      await api.delete(ENDPOINTS.TOUR.DELETE(id));
      fetchTours(page);
    } catch (err: any) {
      if (err.response?.data?.code === 1022) {
        alert("Không thể xóa Tour vì đã có khách đặt (kể cả chưa nhận hay đã hoàn thành). Vui lòng Tạm ngưng (Ẩn) Tour thay vì xóa cứng để bảo toàn thông tin đơn hàng.");
      } else {
        alert(err.response?.data?.message || "Lỗi khi xóa tour.");
      }
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Quản lý Tour
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Tổng số {totalElements} tour trên toàn hệ thống</p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
           <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tiêu đề hoặc địa danh..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
           </div>
        </div>

        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-hover)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem' }}>THÔNG TIN TOUR</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem' }}>HDV / ĐỊA ĐIỂM</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem' }}>GIÁ</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem' }}>TRẠNG THÁI</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem', textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</td></tr>
              ) : tours.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có tour nào</td></tr>
              ) : tours.map(tour => (
                <tr key={tour.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <img 
                        src={tour.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'} 
                        alt="" 
                        style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} 
                       />
                       <div>
                         <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{tour.title}</p>
                         <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {tour.id.substring(0,8)}...</p>
                       </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                          <UserIcon size={14} /> {tour.guideName}
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={14} /> {tour.locationName}
                       </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--primary)' }}>
                    {formatVND(tour.price)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: '700', 
                      background: tour.active ? '#ecfdf5' : '#fef2f2',
                      color: tour.active ? '#059669' : '#dc2626',
                      border: `1px solid ${tour.active ? '#a7f3d0' : '#fecaca'}`
                    }}>
                      {tour.active ? 'Đang hoạt động' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button onClick={() => handleToggleStatus(tour.id, !!tour.active)} style={{ padding: '8px', color: tour.active ? '#dc2626' : '#059669', background: 'none' }} title={tour.active ? "Tạm ngưng" : "Kích hoạt"}>
                        {tour.active ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button onClick={() => handleDelete(tour.id)} style={{ padding: '8px', color: 'var(--error)', background: 'none' }} title="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)', borderTop: '1px solid var(--glass-border)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Trang {page + 1} / {totalPages}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0 || loading}
                className="btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1 || loading}
                className="btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminToursPage;
