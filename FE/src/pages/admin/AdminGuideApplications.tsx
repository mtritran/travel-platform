import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  ShieldX,
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

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    case 'REJECTED':
      return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
    default:
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
  }
};

const DocumentLink = ({ label, path }: { label: string; path: string }) => {
  const [loading, setLoading] = useState(false);

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const response = await api.get(ENDPOINTS.GUIDE_APPLICATION.GET_DOCUMENT(path), {
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to load document:', err);
      alert('Không thể tải tài liệu. Vui lòng thử lại sau.');
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
        border: '1px solid var(--line)',
        textDecoration: 'none',
        color: 'var(--text-primary)',
        fontSize: '0.8125rem',
        fontWeight: '600',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
    >
      <Eye size={16} color="var(--primary)" />
      {loading ? 'Đang tải...' : label}
    </button>
  );
};

const AdminGuideApplications: React.FC = () => {
  const [applications, setApplications] = useState<GuideApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editData, setEditData] = useState<
    Record<string, { languages: string; yearsOfExperience: number }>
  >({});
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get<ApiResponse<GuideApplication[]>>(
        ENDPOINTS.GUIDE_APPLICATION.GET_ALL
      );
      setApplications(response.data.result);

      const initialEdits: Record<string, { languages: string; yearsOfExperience: number }> = {};
      response.data.result.forEach((app) => {
        initialEdits[app.id] = {
          languages: app.languages || '',
          yearsOfExperience: app.yearsOfExperience || 0,
        };
      });
      setEditData(initialEdits);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reason = ''
  ) => {
    if (status === 'REJECTED' && !reason) {
      setRejectingAppId(id);
      setRejectReason('');
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
          yearsOfExperience:
            status === 'APPROVED' ? verification.yearsOfExperience : undefined,
        },
      });
      setRejectingAppId(null);
      setRejectReason('');
      fetchApplications();
    } catch (err) {
      console.error('Failed to process application:', err);
      alert('Lỗi khi xử lý đơn ứng tuyển.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 0' }}>
        {rejectingAppId ? (
          <div
            className="admin-guide-modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              padding: '20px',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(24, 24, 27, 0.52)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              className="glass-panel admin-guide-modal"
              style={{
                width: 'min(100%, 520px)',
                padding: '32px',
                borderRadius: '30px',
                background:
                  'linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(250, 246, 238, 0.96))',
                boxShadow:
                  '0 30px 70px rgba(34, 28, 20, 0.18), 0 8px 24px rgba(220, 38, 38, 0.08)',
              }}
            >
              <div
                className="admin-guide-modal-header"
                style={{ textAlign: 'center', marginBottom: '22px' }}
              >
                <div
                  className="admin-guide-modal-icon"
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '22px',
                    background: 'linear-gradient(135deg, #ef4444, #f87171)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 16px 28px rgba(239, 68, 68, 0.22)',
                    marginBottom: '18px',
                  }}
                >
                  <ShieldX size={32} />
                </div>

                <h3
                  className="admin-guide-modal-title"
                  style={{
                    fontSize: '1.55rem',
                    fontWeight: '900',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Từ chối đơn ứng tuyển
                </h3>
                <p
                  className="admin-guide-modal-copy"
                  style={{
                    marginTop: '10px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.65',
                    maxWidth: '38ch',
                    marginInline: 'auto',
                  }}
                >
                  Nhập lý do từ chối để TravelX gửi thông báo rõ ràng và chuyên nghiệp
                  tới ứng viên.
                </p>
              </div>

              <div
                className="admin-guide-modal-field"
                style={{
                  padding: '16px',
                  borderRadius: '22px',
                  background: 'rgba(255, 255, 255, 0.58)',
                  border: '1px solid rgba(102, 84, 60, 0.1)',
                }}
              >
                <label className="field-label" htmlFor="reject-reason">
                  Lý do từ chối
                </label>
                <textarea
                  id="reject-reason"
                  autoFocus
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Tài liệu không rõ nét, thiếu chứng chỉ ngoại ngữ..."
                  className="textarea-field admin-guide-modal-textarea"
                  style={{
                    minHeight: '132px',
                    resize: 'none',
                    background: 'rgba(255, 255, 255, 0.92)',
                  }}
                />
              </div>

              <div
                className="admin-guide-modal-actions"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginTop: '22px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setRejectingAppId(null);
                    setRejectReason('');
                  }}
                  className="btn-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleProcess(rejectingAppId, 'REJECTED', rejectReason)}
                  disabled={!rejectReason.trim() || !!processing}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                    boxShadow: '0 16px 30px rgba(220, 38, 38, 0.2)',
                  }}
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <h2
          style={{
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          Phê duyệt Hướng dẫn viên
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Xem xét và phê duyệt hồ sơ đăng ký trở thành Hướng dẫn viên.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách...</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {applications.map((app) => {
              const statusStyle = getStatusStyle(app.status);
              return (
                <div
                  key={app.id}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '260px 1fr auto',
                      alignItems: 'start',
                      gap: '32px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          background:
                            app.status === 'APPROVED'
                              ? 'linear-gradient(45deg, #059669, #10b981)'
                              : app.status === 'REJECTED'
                                ? 'linear-gradient(45deg, #dc2626, #ef4444)'
                                : 'linear-gradient(45deg, #d97706, #f59e0b)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          ...(app.status === 'PENDING'
                            ? { animation: 'pulse 2s ease-in-out infinite' }
                            : {}),
                        }}
                      >
                        {app.status === 'REJECTED' ? (
                          <ShieldX size={24} />
                        ) : (
                          <ShieldCheck size={24} />
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                          {app.userFullName}
                        </p>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Đăng ký vào {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <DocumentLink label="CCCD" path={app.idCardUrl} />
                        <DocumentLink label="Thẻ HDV" path={app.guideCardUrl} />
                        <DocumentLink label="Bằng cấp" path={app.certificateUrl} />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                        }}
                      >
                        <div style={{ width: '220px' }}>
                          <label
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: '800',
                              color: 'var(--text-secondary)',
                              textTransform: 'uppercase',
                              marginBottom: '6px',
                              display: 'block',
                            }}
                          >
                            Ngôn ngữ xác minh
                          </label>
                          <input
                            type="text"
                            disabled={app.status !== 'PENDING'}
                            value={editData[app.id]?.languages || ''}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                [app.id]: {
                                  ...editData[app.id],
                                  languages: e.target.value,
                                },
                              })
                            }
                            placeholder="Tiếng Anh, Pháp..."
                            style={{
                              padding: '8px 12px',
                              width: '100%',
                              fontSize: '0.875rem',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              background: app.status !== 'PENDING' ? 'var(--surface-muted)' : 'white',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <div style={{ width: '160px' }}>
                          <label
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: '800',
                              color: 'var(--text-secondary)',
                              textTransform: 'uppercase',
                              marginBottom: '6px',
                              display: 'block',
                            }}
                          >
                            Số năm kinh nghiệm
                          </label>
                          <input
                            type="number"
                            disabled={app.status !== 'PENDING'}
                            value={editData[app.id]?.yearsOfExperience || 0}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                [app.id]: {
                                  ...editData[app.id],
                                  yearsOfExperience: parseInt(e.target.value, 10) || 0,
                                },
                              })
                            }
                            style={{
                              padding: '8px 12px',
                              width: '100%',
                              fontSize: '0.875rem',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              background: app.status !== 'PENDING' ? 'var(--surface-muted)' : 'white',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '12px',
                      }}
                    >
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                          marginBottom: '4px',
                        }}
                      >
                        {app.status}
                      </span>
                      {app.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handleProcess(app.id, 'REJECTED')}
                            disabled={!!processing}
                            style={{
                              padding: '8px 16px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <XCircle size={18} /> Từ chối
                          </button>
                          <button
                            onClick={() => handleProcess(app.id, 'APPROVED')}
                            disabled={!!processing}
                            style={{
                              padding: '8px 16px',
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #a7f3d0',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <CheckCircle2 size={18} /> Phê duyệt
                          </button>
                        </div>
                      )}
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

export default AdminGuideApplications;
