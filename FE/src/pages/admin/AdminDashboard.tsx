import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  ExternalLink,
  AlertTriangle,
  Briefcase,
  Star
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';

interface Stats {
  totalUsers: number;
  totalTours: number;
  pendingApplications: number;
  totalBookings: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ 
    totalUsers: 0, 
    totalTours: 0, 
    pendingApplications: 0, 
    totalBookings: 0 
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [usersRes, toursRes, appsRes] = await Promise.all([
        api.get<ApiResponse<any>>(ENDPOINTS.USER.GET_ALL),
        api.get<ApiResponse<any>>(ENDPOINTS.TOUR.GET_ALL_ADMIN),
        api.get<ApiResponse<any[]>>(ENDPOINTS.GUIDE_APPLICATION.GET_ALL + "?status=PENDING")
      ]);

      setStats({
        totalUsers: usersRes.data.result.totalElements || 0,
        totalTours: toursRes.data.result.totalElements || 0,
        pendingApplications: appsRes.data.result.length || 0,
        totalBookings: 0 
      });
    } catch (err) {
      console.error("Lỗi khi tải thống kê:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const adminModules = [
    { 
      label: 'Quản lý Người dùng', 
      desc: `${stats.totalUsers} người dùng hệ thống`,
      icon: <Users size={32} />, 
      color: '#6366f1', 
      link: '/admin/users' 
    },
    { 
      label: 'Phê duyệt Hồ sơ', 
      desc: `${stats.pendingApplications} đơn đang chờ duyệt`,
      icon: <ShieldCheck size={32} />, 
      color: '#f59e0b', 
      link: '/admin/applications' 
    },
    { 
      label: 'Báo cáo doanh thu', 
      desc: 'Theo dõi dòng tiền & hoa hồng',
      icon: <TrendingUp size={32} />, 
      color: '#ec4899', 
      link: '/admin/reports' 
    },
    { 
      label: 'Quản lý tour', 
      desc: `${stats.totalTours} tour trên hệ thống`,
      icon: <Briefcase size={32} />, 
      color: '#10b981', 
      link: '/admin/tours' 
    },
    { 
      label: 'Quản lý Khiếu nại', 
      desc: 'Giải quyết tranh chấp tour & hoàn tiền',
      icon: <AlertTriangle size={32} />, 
      color: '#dc2626', 
      link: '/admin/disputes' 
    },
    { 
      label: 'Quản lý Đánh giá', 
      desc: 'Kiểm soát nội dung & phản hồi khách hàng',
      icon: <Star size={32} />, 
      color: '#f59e0b', 
      link: '/admin/reviews' 
    },
  ];

  if (loading) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
         <p style={{ color: 'var(--text-secondary)' }}>Đang tải dữ liệu quản trị...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={{ padding: '40px 0' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Bảng điều khiển Admin
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Chào mừng trở lại! Hệ thống của bạn vẫn đang hoạt động ổn định.</p>
        </div>

        {/* Modules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {adminModules.map((module, i) => (
            <a 
              key={i} 
              href={module.link} 
              className="glass-panel" 
              style={{ 
                padding: '40px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '24px', 
                textDecoration: 'none', 
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                border: '1px solid var(--glass-border)'
              }}
            >
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '20px', 
                background: `${module.color}15`, 
                color: module.color, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                {module.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {module.label}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {module.desc}
                </p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: module.color, fontWeight: '700', fontSize: '0.875rem' }}>
                Truy cập ngay <ExternalLink size={16} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
