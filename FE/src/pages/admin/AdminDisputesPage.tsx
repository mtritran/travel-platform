import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Calendar, 
  User as UserIcon, 
  Eye,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';
import type { ApiResponse, Booking, TourRequest } from '../../types';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useNotification } from '../../context/NotificationContext';
import DisputeDetailModal from './DisputeDetailModal';
import { formatVND } from '../../utils/format';

export type DisputeType = 'MARKETPLACE' | 'CUSTOM';

export interface UnifiedDispute {
  id: string;
  type: DisputeType;
  code: string;
  title: string;
  userName: string;
  guideName?: string;
  disputedAt?: string;
  date?: string;
  totalPrice: number;
  originalObject: Booking | TourRequest;
}

const AdminDisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<UnifiedDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<UnifiedDispute | null>(null);
  const { showToast } = useNotification();

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const [bookingRes, requestRes] = await Promise.all([
        api.get<ApiResponse<Booking[]>>(ENDPOINTS.BOOKING.ADMIN_DISPUTES),
        api.get<ApiResponse<TourRequest[]>>(ENDPOINTS.TOUR_REQUEST.ADMIN_DISPUTES)
      ]);

      const unified: UnifiedDispute[] = [];

      if (bookingRes.data.code === 1000) {
        bookingRes.data.result.forEach(b => {
          unified.push({
            id: b.id,
            type: 'MARKETPLACE',
            code: b.bookingCode,
            title: b.tourTitle,
            userName: b.userName,
            guideName: b.guideName,
            disputedAt: b.disputedAt,
            date: b.tourStartDate,
            totalPrice: b.totalPrice,
            originalObject: b
          });
        });
      }

      if (requestRes.data.code === 1000) {
        requestRes.data.result.forEach(r => {
          unified.push({
            id: r.id,
            type: 'CUSTOM',
            code: r.requestCode,
            title: r.title,
            userName: r.userName,
            guideName: r.guideName,
            disputedAt: r.disputedAt,
            date: r.plannedDate,
            totalPrice: r.paidAmount || r.budget || 0,
            originalObject: r
          });
        });
      }

      // Sort by latest disputedAt
      unified.sort((a, b) => {
        const dateA = a.disputedAt ? new Date(a.disputedAt).getTime() : 0;
        const dateB = b.disputedAt ? new Date(b.disputedAt).getTime() : 0;
        return dateB - dateA;
      });

      setDisputes(unified);
    } catch (err) {
      console.error("Lỗi khi tải danh sách khiếu nại:", err);
      showToast("Không thể tải danh sách khiếu nại", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const filteredDisputes = disputes.filter(d => 
    d.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div style={{ padding: '30px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <button 
                onClick={() => window.history.back()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <ArrowLeft size={24} />
              </button>
              <h2 style={{ fontSize: '1.875rem', fontWeight: '800', margin: 0 }}>Quản lý Khiếu nại</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Xem xét và giải quyết các tranh chấp giữa khách hàng và hướng dẫn viên trên toàn hệ thống.</p>
          </div>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm mã, tiêu đề, tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', padding: '12px 12px 12px 48px', borderRadius: '14px', 
                border: '1px solid var(--line)', background: 'white', fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách khiếu nại...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="glass-panel" style={{ padding: '100px 0', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={40} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>Tuyệt vời! Không có khiếu nại nào</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Tất cả các tranh chấp đã được giải quyết hoặc chưa có khiếu nại mới.</p>
          </div>
        ) : (
          <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Loại</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Tham chiếu</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Khách hàng</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Thời điểm</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Giá trị</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisputes.map((dispute) => (
                  <tr key={`${dispute.type}-${dispute.id}`} style={{ borderBottom: '1px solid var(--line)', transition: 'background 0.2s' }} className="hover-row">
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700',
                        background: dispute.type === 'MARKETPLACE' ? '#e0f2fe' : '#fef3c7',
                        color: dispute.type === 'MARKETPLACE' ? '#0369a1' : '#b45309'
                      }}>
                        {dispute.type === 'MARKETPLACE' ? 'Sàn' : 'Custom'}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <p style={{ fontWeight: '700', margin: '0 0 4px 0', color: 'var(--primary)' }}>{dispute.code}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{dispute.title}</p>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserIcon size={16} />
                        </div>
                        <span style={{ fontWeight: '600' }}>{dispute.userName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {dispute.disputedAt ? new Date(dispute.disputedAt).toLocaleString('vi-VN') : '---'}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', fontWeight: '700' }}>
                      {formatVND(dispute.totalPrice)}
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                      <button 
                        onClick={() => setSelectedDispute(dispute)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Eye size={16} /> Xem xét
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDispute && (
        <DisputeDetailModal 
          dispute={selectedDispute} 
          onClose={() => setSelectedDispute(null)} 
          onSuccess={() => {
            setSelectedDispute(null);
            fetchDisputes();
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminDisputesPage;
