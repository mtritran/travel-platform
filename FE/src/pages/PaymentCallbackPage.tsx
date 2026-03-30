import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

import api from '../services/api';
import { ENDPOINTS } from '../constants/endpoints';
import type { ApiResponse } from '../types';

type CallbackUiStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'SYNC_FAILED';

const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackUiStatus>('PENDING');
  const [backendDetail, setBackendDetail] = useState<string | null>(null);

  useEffect(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');

    if (responseCode !== '00') {
      setStatus('FAILED');
      return;
    }

    const confirmWithBackend = async () => {
      try {
        const queryString = window.location.search;
        const { data } = await api.get<ApiResponse<string>>(
          `${ENDPOINTS.PAYMENT.VNPAY_CALLBACK}${queryString}`,
        );
        if (data.result === 'SUCCESS') {
          setStatus('SUCCESS');
        } else {
          setStatus('SYNC_FAILED');
          setBackendDetail(data.result ?? data.message ?? 'Không xác định');
        }
      } catch (error) {
        console.error('Lỗi khi xác nhận thanh toán với Backend:', error);
        setStatus('SYNC_FAILED');
        setBackendDetail('Không kết nối được máy chủ hoặc phiên đã hết hạn.');
      }
    };

    void confirmWithBackend();
  }, [searchParams]);

  return (
    <DashboardLayout>
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px' }}>
          {status === 'PENDING' ? (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                Đang xác nhận giao dịch với hệ thống…
              </p>
            </>
          ) : status === 'SUCCESS' ? (
            <>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <CheckCircle2 size={48} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Thanh toán thành công!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '40px' }}>
                Đơn đặt tour của bạn đã được cập nhật. Bạn có thể xem trạng thái tại mục đặt chỗ.
              </p>
            </>
          ) : status === 'SYNC_FAILED' ? (
            <>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <AlertTriangle size={48} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Giao dịch có thể đã thành công nhưng chưa đồng bộ đơn
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '12px', lineHeight: 1.6 }}>
                VNPAY đã báo thành công, nhưng hệ thống chưa ghi nhận cập nhật đơn. Hãy tải lại trang &quot;Đơn của tôi&quot;
                sau vài phút, hoặc liên hệ hỗ trợ nếu vẫn hiển thị chưa thanh toán.
              </p>
              {backendDetail ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '28px' }}>{backendDetail}</p>
              ) : null}
            </>
          ) : (
            <>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <XCircle size={48} />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Thanh toán thất bại
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '40px' }}>
                Giao dịch của bạn không thành công hoặc đã bị hủy. Vui lòng thử lại sau.
              </p>
            </>
          )}

          {status !== 'PENDING' ? (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/bookings" className="btn-primary" style={{ padding: '12px 28px', textDecoration: 'none' }}>
                Đơn của tôi <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </Link>
              <Link to="/" className="btn-secondary" style={{ padding: '12px 28px', textDecoration: 'none' }}>
                Trang chủ
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentCallbackPage;
