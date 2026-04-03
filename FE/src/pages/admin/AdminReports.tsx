import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatVND } from '../../utils/format';

interface FinancialSummary {
  totalRevenue: number;
  totalCommission: number;
  totalPayouts: number;
  totalGuides: number;
  totalBookings: number;
}

const AdminReports: React.FC = () => {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp = await api.get<ApiResponse<FinancialSummary>>(ENDPOINTS.REPORT.FINANCIAL);
        setData(resp.data.result);
      } catch (err) {
        console.error("Failed to fetch financial report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Đang tổng hợp báo cáo doanh thu...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={{ padding: '40px 0' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Báo cáo Tài chính
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}> Theo dõi doanh thu, hoa hồng và dòng tiền của hệ thống.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
          <StatCard
            title="Tổng Doanh thu"
            value={formatVND(data?.totalRevenue || 0)}
            icon={<DollarSign size={24} />}
            color="#4f46e5"
          />
          <StatCard
            title="Hoa hồng (20%)"
            value={formatVND(data?.totalCommission || 0)}
            icon={<TrendingUp size={24} />}
            color="#10b981"
            trend="+12%"
          />
          <StatCard
            title="Tiền đã giải ngân"
            value={formatVND(data?.totalPayouts || 0)}
            icon={<Wallet size={24} />}
            color="#f59e0b"
          />
          <StatCard
            title="Lợi nhuận ròng"
            value={formatVND((data?.totalCommission || 0))}
            icon={<PieChart size={24} />}
            color="#ec4899"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Biểu đồ tăng trưởng</h3>
              <BarChart3 size={20} color="var(--text-secondary)" />
            </div>
            <div style={{ height: '300px', background: 'var(--surface)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>[Biểu đồ doanh thu thực tế sẽ hiển thị ở đây]</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>Chỉ số vận hành</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Tổng số Guides</span>
                  <span style={{ fontWeight: '800' }}>{data?.totalGuides}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Chuyến đi thành công</span>
                  <span style={{ fontWeight: '800' }}>{data?.totalBookings}</span>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
              <h4 style={{ fontWeight: '800', marginBottom: '8px', opacity: 0.8 }}>Dòng tiền khả dụng</h4>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '12px' }}>{formatVND((data?.totalCommission || 0))}</h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Tiền thuộc về nền tảng sau khi trừ chi phí giải ngân cho Guide.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ title, value, icon, color, trend }: any) => (
  <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      {trend && (
        <div style={{ color: trend.startsWith('+') ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
          {trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
        </div>
      )}
    </div>
    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>{title}</p>
    <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>{value}</h4>
  </div>
);

export default AdminReports;
