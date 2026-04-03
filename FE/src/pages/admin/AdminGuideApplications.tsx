import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  ShieldX
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';

interface GuideApplication {
  id: string;
  userId: string;
  userFullName: string;
  idCardUrl: string;
  guideCardUrl: string;
  certificateUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  rejectionReason?: string;
  languages: string;
  yearsOfExperience: number;
}

const AdminGuideApplications: React.FC = () => {
  const [applications, setApplications] = useState<GuideApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, { languages: string, yearsOfExperience: number }>>({});
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get<ApiResponse<GuideApplication[]>>(ENDPOINTS.GUIDE_APPLICATION.GET_ALL);
      setApplications(response.data.result);
      
      // Initialize edit data
      const initialEdits: Record<string, { languages: string, yearsOfExperience: number }> = {};
      response.data.result.forEach(app => {
        initialEdits[app.id] = { languages: app.languages || '', yearsOfExperience: app.yearsOfExperience || 0 };
      });
      setEditData(initialEdits);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string, status: 'APPROVED' | 'REJECTED', reason = "") => {
    if (status === 'REJECTED' && !reason) {
      setRejectingAppId(id);
      setRejectReason("");
      return;
    }

    setProcessing(id);
    const verification = editData[id];

    try {
      await api.post(ENDPOINTS.GUIDE_APPLICATION.PROCESS(id), null, {
        params: { 
          status, 
          reason,
          languages: status === 'APPROVED' ? verification.languages : undefined,
          yearsOfExperience: status === 'APPROVED' ? verification.yearsOfExperience : undefined
        }
      });
      setRejectingAppId(null);
      fetchApplications();
    } catch (err) {
      console.error("Failed to process application:", err);
      alert("Lỗi khi xử lý đơn ứng tuyển.");
    } finally {
      setProcessing(null);
    }
  };

  const RejectionModal = () => (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#e8e8e6',
        borderRadius: '32px',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'modalFadeUp 0.3s ease-out'
      }}>
        {/* Icon Box */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 16px -4px rgba(239, 68, 68, 0.3)'
        }}>
          <ShieldX size={32} color="white" />
        </div>

        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '900', 
          marginBottom: '8px', 
          color: '#1e293b',
          textAlign: 'center'
        }}>
          Từ chối đơn ứng tuyển
        </h3>
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#64748b', 
          marginBottom: '24px',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          Vui lòng nhập lý do từ chối để gửi thông báo cho khách hàng.
        </p>

        <textarea
          autoFocus
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ví dụ: Tài liệu không rõ nét, thiếu chứng chỉ ngoại ngữ..."
          style={{
            width: '100%',
            height: '120px',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #d1d5db',
            background: 'white',
            fontSize: '0.925rem',
            marginBottom: '24px',
            resize: 'none',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#0f766e'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={() => setRejectingAppId(null)}
            style={{
              padding: '14px',
              background: '#d1d5db',
              color: '#475569',
              borderRadius: '16px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => handleProcess(rejectingAppId!, 'REJECTED', rejectReason)}
            disabled={!rejectReason.trim()}
            style={{
              padding: '14px',
              background: '#0f766e',
              color: 'white',
              borderRadius: '16px',
              fontWeight: '700',
              border: 'none',
              cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
              opacity: rejectReason.trim() ? 1 : 0.6,
              transition: 'transform 0.2s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED': return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'REJECTED': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default: return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 0' }}>
        {rejectingAppId && <RejectionModal />}
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Phê duyệt Hướng dẫn viên
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Xem xét và phê duyệt hồ sơ đăng ký trở thành Hướng dẫn viên.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách...</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {applications.map(app => {
              const statusStyle = getStatusStyle(app.status);
              return (
                <div key={app.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Row 1: User info + Docs + Status/Actions */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', gap: '32px' }}>
                    {/* User info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: app.status === 'APPROVED'
                          ? 'linear-gradient(45deg, #059669, #10b981)'
                          : app.status === 'REJECTED'
                            ? 'linear-gradient(45deg, #dc2626, #ef4444)'
                            : 'linear-gradient(45deg, #d97706, #f59e0b)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        ...(app.status === 'PENDING' ? { animation: 'pulse 2s ease-in-out infinite' } : {})
                      }}>
                        {app.status === 'REJECTED' ? <ShieldX size={24} /> : <ShieldCheck size={24} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{app.userFullName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Đăng ký vào {new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Documents */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <DocumentLink label="CCCD" path={app.idCardUrl} />
                      <DocumentLink label="Thẻ HDV" path={app.guideCardUrl} />
                      <DocumentLink label="Bằng cấp" path={app.certificateUrl} />
                    </div>

                    {/* Status + Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                        {app.status}
                      </span>
                      {app.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handleProcess(app.id, 'REJECTED')}
                            disabled={!!processing}
                            style={{ padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <XCircle size={18} /> Từ chối
                          </button>
                          <button
                            onClick={() => handleProcess(app.id, 'APPROVED')}
                            disabled={!!processing}
                            style={{ padding: '8px 16px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            <CheckCircle2 size={18} /> Phê duyệt
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Verification inputs (only shown for PENDING or to display verified info) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Ngôn ngữ xác minh</label>
                      <input
                        type="text"
                        disabled={app.status !== 'PENDING'}
                        value={editData[app.id]?.languages || ''}
                        onChange={(e) => setEditData({ ...editData, [app.id]: { ...editData[app.id], languages: e.target.value } })}
                        placeholder="Ví dụ: Tiếng Anh, Tiếng Pháp..."
                        style={{ padding: '8px 12px', width: '100%', fontSize: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: app.status !== 'PENDING' ? 'var(--surface-muted)' : 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Số năm kinh nghiệm</label>
                      <input
                        type="number"
                        disabled={app.status !== 'PENDING'}
                        value={editData[app.id]?.yearsOfExperience || 0}
                        onChange={(e) => setEditData({ ...editData, [app.id]: { ...editData[app.id], yearsOfExperience: parseInt(e.target.value) || 0 } })}
                        style={{ padding: '8px 12px', width: '100%', fontSize: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: app.status !== 'PENDING' ? 'var(--surface-muted)' : 'white', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const DocumentLink = ({ label, path }: { label: string, path: string }) => {
  const [loading, setLoading] = useState(false);

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const response = await api.get(ENDPOINTS.GUIDE_APPLICATION.GET_DOCUMENT(path), {
        responseType: 'blob'
      });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Failed to load document:", err);
      alert("Không thể tải tài liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        textDecoration: 'none',
        color: 'var(--text-primary)',
        fontSize: '0.8125rem',
        fontWeight: '600',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}
    >
      <Eye size={16} color="var(--primary)" />
      {loading ? 'Đang tải...' : label}
    </button>
  );
};

export default AdminGuideApplications;
