import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Image as ImageIcon, 
  Calendar, 
  DollarSign, 
  User as UserIcon,
  CheckCircle2,
  XCircle,
  FileText,
  Tag
} from 'lucide-react';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';
import type { Booking, TourRequest, ApiResponse } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { formatVND } from '../../utils/format';
import { type UnifiedDispute } from './AdminDisputesPage';

interface DisputeDetailModalProps {
  dispute: UnifiedDispute;
  onClose: () => void;
  onSuccess: () => void;
}

const DisputeDetailModal: React.FC<DisputeDetailModalProps> = ({ dispute, onClose, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [adminNote, setAdminNote] = useState('');
  const { showToast } = useNotification();

  const evidenceUrl = dispute.type === 'MARKETPLACE' 
    ? (dispute.originalObject as Booking).disputeEvidenceUrl 
    : (dispute.originalObject as TourRequest).disputeEvidenceUrl;

  const evidenceImages = evidenceUrl 
    ? evidenceUrl.split(';').filter((url: string) => url.trim() !== '')
    : [];

  const disputeReason = dispute.type === 'MARKETPLACE'
    ? (dispute.originalObject as Booking).disputeReason
    : (dispute.originalObject as TourRequest).disputeReason;

  const refundAmount = Math.round(dispute.totalPrice * refundPercentage / 100);

  const handleResolve = async (action: 'REFUND' | 'RELEASE') => {
    if (action === 'REFUND' && !showRefundForm) {
      setShowRefundForm(true);
      return;
    }

    try {
      setProcessing(true);
      const url = dispute.type === 'MARKETPLACE'
        ? ENDPOINTS.BOOKING.RESOLVE_DISPUTE(dispute.id, action, action === 'REFUND' ? refundPercentage : undefined, adminNote || undefined)
        : ENDPOINTS.TOUR_REQUEST.RESOLVE_DISPUTE(dispute.id, action, action === 'REFUND' ? refundPercentage : undefined, adminNote || undefined);

      const response = await api.post<ApiResponse<any>>(url);
      
      if (response.data.code === 1000) {
        showToast(
          action === 'REFUND' 
            ? `Đã hoàn ${refundPercentage}% (${formatVND(refundAmount)}) cho khách hàng.` 
            : "Đã bác bỏ khiếu nại và cho phép giải ngân tiền cho HDV.", 
          "success"
        );
        onSuccess();
      } else {
        showToast(response.data.message || "Lỗi khi xử lý khiếu nại", "error");
      }
    } catch (err) {
      console.error("Lỗi khi xử lý khiếu nại:", err);
      showToast("Không thể thực hiện hành động này", "error");
    } finally {
      setProcessing(false);
    }
  };

  const percentagePresets = [25, 50, 75, 100];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%', maxWidth: '720px', maxHeight: '90vh',
        background: 'white', borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                Xem xét Khiếu nại
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700',
                  background: dispute.type === 'MARKETPLACE' ? '#e0f2fe' : '#fef3c7',
                  color: dispute.type === 'MARKETPLACE' ? '#0369a1' : '#b45309'
                }}>
                  {dispute.type === 'MARKETPLACE' ? 'Sàn' : 'Custom'}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{dispute.code}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: '#f8fafc', border: 'none', cursor: 'pointer',
            color: '#94a3b8', padding: '8px', borderRadius: '10px',
            transition: 'all 0.2s'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', padding: '32px', flex: 1 }}>
          {/* Order Summary Strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px',
            marginBottom: '28px'
          }}>
            <div style={{
              padding: '16px', borderRadius: '16px',
              background: '#f8fafc', border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <UserIcon size={15} color="#94a3b8" />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Khách hàng</span>
              </div>
              <p style={{ fontWeight: '700', margin: 0, fontSize: '0.9rem', color: '#0f172a' }}>{dispute.userName}</p>
            </div>
            <div style={{
              padding: '16px', borderRadius: '16px',
              background: '#f8fafc', border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={15} color="#94a3b8" />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ngày</span>
              </div>
              <p style={{ fontWeight: '700', margin: 0, fontSize: '0.9rem', color: '#0f172a' }}>{dispute.date || '---'}</p>
            </div>
            <div style={{
              padding: '16px', borderRadius: '16px',
              background: '#f0fdf4', border: '1px solid #dcfce7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={15} color="#16a34a" />
                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá trị</span>
              </div>
              <p style={{ fontWeight: '800', margin: 0, fontSize: '0.95rem', color: '#16a34a' }}>{formatVND(dispute.totalPrice)}</p>
            </div>
          </div>

          {/* Dispute Reason */}
          <section style={{ marginBottom: '28px' }}>
            <h4 style={{
              fontSize: '0.85rem', fontWeight: '700', marginBottom: '12px',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              <FileText size={16} color="#0f766e" /> Lý do khiếu nại
            </h4>
            <div style={{
              background: '#fefce8', padding: '20px', borderRadius: '14px',
              border: '1px solid #fef08a', lineHeight: '1.7', fontSize: '0.95rem',
              color: '#713f12'
            }}>
              {disputeReason || 'Không có lý do.'}
            </div>
          </section>

          {/* Evidence Images */}
          <section style={{ marginBottom: '28px' }}>
            <h4 style={{
              fontSize: '0.85rem', fontWeight: '700', marginBottom: '12px',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              <ImageIcon size={16} color="#0f766e" /> Bằng chứng hình ảnh ({evidenceImages.length})
            </h4>
            
            {evidenceImages.length === 0 ? (
              <div style={{
                padding: '32px', textAlign: 'center',
                background: '#f8fafc', borderRadius: '14px',
                border: '2px dashed #e2e8f0'
              }}>
                <ImageIcon size={28} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Không có hình ảnh đính kèm</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {evidenceImages.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" style={{
                    display: 'block', borderRadius: '14px', overflow: 'hidden',
                    border: '1px solid #e2e8f0', transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }}>
                    <img 
                      src={url} 
                      alt={`Evidence ${i+1}`} 
                      style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                    />
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Refund Form - shown when admin clicks "Chấp thuận" */}
          {showRefundForm && (
            <section style={{
              marginBottom: '28px', padding: '24px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
              border: '1px solid #bbf7d0'
            }}>
              <h4 style={{
                fontSize: '0.9rem', fontWeight: '800', marginBottom: '20px',
                color: '#166534', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <DollarSign size={18} /> Thiết lập hoàn tiền
              </h4>

              {/* Percentage Presets */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '10px', color: '#374151' }}>
                  Tỷ lệ hoàn tiền
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {percentagePresets.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRefundPercentage(p)}
                      style={{
                        padding: '8px 18px', borderRadius: '10px', cursor: 'pointer',
                        fontWeight: '700', fontSize: '0.9rem', transition: 'all 0.2s',
                        border: refundPercentage === p ? '2px solid #16a34a' : '2px solid #e5e7eb',
                        background: refundPercentage === p ? '#dcfce7' : 'white',
                        color: refundPercentage === p ? '#166534' : '#6b7280'
                      }}
                    >
                      {p}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={refundPercentage}
                    onChange={(e) => {
                      const v = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                      setRefundPercentage(v);
                    }}
                    style={{
                      width: '72px', padding: '8px 12px', borderRadius: '10px',
                      border: '2px solid #e5e7eb', fontWeight: '700', fontSize: '0.9rem',
                      textAlign: 'center', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Refund Preview */}
              <div style={{
                padding: '16px 20px', borderRadius: '14px',
                background: 'white', border: '1px solid #d1fae5',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Số tiền hoàn cho khách</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#16a34a' }}>
                    {formatVND(refundAmount)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Giữ lại cho HDV</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#475569' }}>
                    {formatVND(dispute.totalPrice - refundAmount)}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '10px', color: '#374151' }}>
                  <Tag size={14} /> Ghi chú lý do (sẽ gửi kèm thông báo)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="VD: Dịch vụ không đúng cam kết, hướng dẫn viên đến trễ 2 tiếng..."
                  rows={3}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '12px',
                    border: '1px solid #d1d5db', resize: 'none', fontSize: '0.9rem',
                    outline: 'none', transition: 'border 0.2s', lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid #f1f5f9',
          background: '#fafbfc'
        }}>
          {!showRefundForm ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => handleResolve('REFUND')}
                disabled={processing}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '14px', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #0f766e, #0d9488)', color: 'white', 
                  border: 'none', fontWeight: '700', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 4px 12px -2px rgba(15, 118, 110, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                <CheckCircle2 size={18} /> Chấp thuận (Hoàn tiền cho khách)
              </button>
              <button 
                onClick={() => handleResolve('RELEASE')}
                disabled={processing}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '14px', cursor: 'pointer',
                  background: 'white', color: '#dc2626', 
                  border: '2px solid #fecaca', fontWeight: '700', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'all 0.2s'
                }}
              >
                <XCircle size={18} /> Bác bỏ (Giải ngân cho HDV)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowRefundForm(false)}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '14px', cursor: 'pointer',
                  background: '#f1f5f9', color: '#475569', 
                  border: 'none', fontWeight: '700', fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
              >
                ← Quay lại
              </button>
              <button 
                onClick={() => handleResolve('REFUND')}
                disabled={processing}
                style={{ 
                  flex: 2, padding: '14px', borderRadius: '14px', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', 
                  border: 'none', fontWeight: '700', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 4px 12px -2px rgba(22, 163, 74, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                <CheckCircle2 size={18} />
                {processing ? 'Đang xử lý...' : `Xác nhận hoàn ${refundPercentage}% — ${formatVND(refundAmount)}`}
              </button>
            </div>
          )}
          <p style={{
            fontSize: '0.72rem', textAlign: 'center',
            color: '#94a3b8', marginTop: '12px', marginBottom: 0
          }}>
            Hành động này không thể hoàn tác. Các bên liên quan sẽ nhận được thông báo ngay lập tức.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetailModal;
