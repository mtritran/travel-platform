import React, { useEffect, useState } from 'react';
import { CheckCircle2, Landmark, User, Wallet } from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatVND } from '../../utils/format';

interface PendingPayout {
  id: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  user?: {
    fullName?: string;
  };
}

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const AdminPayouts: React.FC = () => {
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const resp = await api.get<ApiResponse<PendingPayout[]>>(ENDPOINTS.PAYOUT.GET_PENDING);
      setPendingPayouts(resp.data.result);
    } catch (err) {
      console.error('Failed to fetch pending payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleProcessPayout = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessing(id);
    const note = prompt('Nhap ghi chu cho nguoi dung (neu co):');
    if (status === 'REJECTED' && note === null) {
      setProcessing(null);
      return;
    }

    try {
      await api.post(
        ENDPOINTS.PAYOUT.PROCESS(id) + `?status=${status}&adminNote=${encodeURIComponent(note || '')}`,
      );
      alert(`Da ${status === 'APPROVED' ? 'thanh toan' : 'tu choi'} yeu cau rut tien thanh cong.`);
      fetchPayouts();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.response?.data?.message || 'Loi khi xu ly rut tien.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-stack" style={{ padding: '32px 0' }}>
        <section className="section-heading">
          <span className="eyebrow">Finance ops</span>
          <h1 className="page-title">Phe duyet rut tien</h1>
          <p className="page-subtitle">Xu ly cac yeu cau thanh toan cho huong dan vien mot cach ro rang va nhat quan hon.</p>
        </section>

        {loading ? (
          <div className="glass-panel empty-state">
            <p className="page-subtitle">Dang tai danh sach yeu cau rut tien...</p>
          </div>
        ) : pendingPayouts.length === 0 ? (
          <div className="glass-panel empty-state">
            <Wallet size={42} style={{ opacity: 0.25, margin: '0 auto 12px' }} />
            <p className="page-subtitle">Khong con yeu cau rut tien nao dang cho xu ly.</p>
          </div>
        ) : (
          <div className="booking-list">
            {pendingPayouts.map((payout) => (
              <article key={payout.id} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="booking-box" style={{ minWidth: '180px', textAlign: 'center' }}>
                      <div className="price-value">{formatVND(payout.amount)}</div>
                      <div className="price-label" style={{ marginTop: '6px' }}>Yeu cau rut tien</div>
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <div className="info-pair">
                        <User size={16} />
                        {payout.user?.fullName || 'Huong dan vien'}
                      </div>
                      <div className="info-pair">
                        <Landmark size={16} />
                        {payout.bankName} - {payout.bankAccountNumber}
                      </div>
                      <div className="info-pair">
                        <Wallet size={16} />
                        Chu tai khoan: {payout.bankAccountName}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-danger-outline"
                      onClick={() => handleProcessPayout(payout.id, 'REJECTED')}
                      disabled={!!processing}
                    >
                      Tu choi
                    </button>
                    <button
                      type="button"
                      className="btn-success"
                      onClick={() => handleProcessPayout(payout.id, 'APPROVED')}
                      disabled={!!processing}
                    >
                      <CheckCircle2 size={18} />
                      Da chuyen khoan
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPayouts;
