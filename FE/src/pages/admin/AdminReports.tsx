import React, { useEffect, useState } from 'react';
import { TrendingUp, History } from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatVND } from '../../utils/format';

interface FinancialSummary {
  totalRevenue: number;
  totalPayouts: number;
  totalGuidePayouts: number;
  totalGuides: number;
  totalBookings: number;
}

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  date: string;
  reference: string;
}

const AdminReports: React.FC = () => {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summResp, histResp] = await Promise.all([
          api.get<ApiResponse<FinancialSummary>>(ENDPOINTS.REPORT.FINANCIAL),
          api.get<ApiResponse<Transaction[]>>(ENDPOINTS.REPORT.HISTORY),
        ]);
        setData(summResp.data.result);
        setHistory(histResp.data.result);
      } catch (err) {
        console.error('Failed to fetch financial data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: '100px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Đang tổng hợp báo cáo tài chính...</p>
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="admin-reports-page" style={{ padding: '40px 0' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Báo cáo Tài chính
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Theo dõi dòng tiền nạp từ khách hàng và các khoản thanh toán cho đối tác.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          <StatCard
            title="Tổng dòng tiền thực tế"
            value={formatVND(data?.totalRevenue || 0)}
            icon={<div style={{ fontWeight: 900, fontSize: '1rem' }}>₫</div>}
            color="#0d9488"
          />
          <StatCard
            title="Lợi nhuận thực tế (20%)"
            value={formatVND((data?.totalRevenue || 0) * 0.2)}
            icon={<TrendingUp size={20} />}
            color="#f59e0b"
          />
          <StatCard
            title="Tiền chờ giải ngân (80%)"
            value={formatVND(((data?.totalRevenue || 0) * 0.8) - (data?.totalGuidePayouts || 0))}
            icon={<TrendingUp size={20} />}
            color="#10b981"
          />
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={20} /> Lịch sử biến động số dư
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 12px', background: 'var(--surface-hover)', borderRadius: '20px' }}>Dòng tiền thực tế</span>
          </div>

              {history.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 0',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Chưa có lịch sử giao dịch.
                </div>
              ) : (
                <div className="admin-reports-history-list">
                  {history.map((tx) => (
                    <article key={tx.id} className="admin-reports-history-item">
                      <div className="admin-reports-history-item-date">
                        <div className="admin-reports-history-date">
                          {new Date(tx.date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="admin-reports-history-time">
                          {new Date(tx.date).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <div className="admin-reports-history-item-copy">
                        <div className="admin-reports-history-item-title">{tx.description}</div>
                        <div className="admin-reports-history-item-ref">{tx.reference}</div>
                      </div>

                      <div
                        className={`admin-reports-history-amount ${
                          tx.type === 'INCOME' ? 'is-income' : 'is-expense'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatVND(tx.amount)}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
    </DashboardLayout>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: `${color}15`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
    </div>
    <p
      style={{
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        marginBottom: '4px',
      }}
    >
      {title}
    </p>
    <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>
      {value}
    </h4>
  </div>
);

export default AdminReports;
