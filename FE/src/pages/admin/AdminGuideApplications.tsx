import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  ShieldCheck,
  ShieldX,
  X,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';

interface GuideApplication {
  id: string;
  userId: string;
  userFullName: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  languages: string;
  yearsOfExperience: number;

  // Core docs (always available in backend shape)
  idCardUrl: string;
  guideCardUrl: string;
  certificateUrl: string;

  // Optional extended profile fields
  specializations?: string | null;
  operatingAreas?: string | null;

  profilePhotoUrl?: string | null;
  idCardExpiry?: string | null;
  guideCardExpiry?: string | null;
  certificateExpiry?: string | null;
  criminalRecordUrl?: string | null;
  criminalRecordIssuedAt?: string | null;
  healthRecordUrl?: string | null;
  healthRecordDate?: string | null;
  drugTestResultUrl?: string | null;
  drugTestDate?: string | null;

  hiddenReason?: string | null;
}

interface Page<T> {
  content: T[];
  totalPages: number;
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

const AdminGuideApplications: React.FC = () => {
  const [applications, setApplications] = useState<GuideApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editData, setEditData] = useState<
    Record<string, { languages: string; yearsOfExperience: number }>
  >({});

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedApp, setSelectedApp] = useState<GuideApplication | null>(null);
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchApplications = async (pageNumber = 0) => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<Page<GuideApplication>>>(
        ENDPOINTS.GUIDE_APPLICATION.GET_ALL,
        { params: { page: pageNumber, size: 10 } }
      );

      const pageData = response.data.result;
      const list = pageData?.content || [];

      setApplications(list);
      setTotalPages(pageData?.totalPages || 0);

      const initialEdits: Record<string, { languages: string; yearsOfExperience: number }> = {};
      list.forEach((app) => {
        initialEdits[app.id] = {
          languages: app.languages || '',
          yearsOfExperience: app.yearsOfExperience || 0,
        };
      });
      setEditData(initialEdits);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setApplications([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(page);
  }, [page]);

  const handleViewFile = async (path: string | undefined | null) => {
    if (!path) return;
    try {
      const response = await api.get(ENDPOINTS.GUIDE_APPLICATION.GET_DOCUMENT(path), {
        responseType: 'blob',
      });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to open document:', err);
      alert('Không thể mở tài liệu. Vui lòng thử lại sau.');
    }
  };

  const handleProcess = async (id: string, status: 'APPROVED' | 'REJECTED', reason = '') => {
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
          languages: status === 'APPROVED' ? verification?.languages : undefined,
          yearsOfExperience: status === 'APPROVED' ? verification?.yearsOfExperience : undefined,
        },
      });

      setRejectingAppId(null);
      setRejectReason('');
      setSelectedApp(null);
      fetchApplications(page);
    } catch (err) {
      console.error('Failed to process application:', err);
      alert('Lỗi khi xử lý đơn ứng tuyển.');
    } finally {
      setProcessing(null);
    }
  };

  const detailDocs = useMemo(() => {
    if (!selectedApp) return [];
    return [
      { label: 'Ảnh chân dung', path: selectedApp.profilePhotoUrl, expiry: null as string | null, expiryLabel: undefined as string | undefined },
      { label: 'CMND / CCCD', path: selectedApp.idCardUrl, expiry: selectedApp.idCardExpiry || null, expiryLabel: 'Hết hạn' },
      { label: 'Thẻ HDV', path: selectedApp.guideCardUrl, expiry: selectedApp.guideCardExpiry || null, expiryLabel: 'Hết hạn' },
      { label: 'Bằng cấp / Chứng chỉ', path: selectedApp.certificateUrl, expiry: selectedApp.certificateExpiry || null, expiryLabel: 'Hết hạn' },
      { label: 'Lý lịch tư pháp', path: selectedApp.criminalRecordUrl, expiry: selectedApp.criminalRecordIssuedAt || null, expiryLabel: 'Ngày cấp' },
      { label: 'Giấy khám sức khỏe', path: selectedApp.healthRecordUrl, expiry: selectedApp.healthRecordDate || null, expiryLabel: 'Ngày khám' },
      { label: 'Xét nghiệm ma túy', path: selectedApp.drugTestResultUrl, expiry: selectedApp.drugTestDate || null, expiryLabel: 'Ngày xét nghiệm' },
    ];
  }, [selectedApp]);

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 0' }}>
        <div className="section-heading" style={{ marginBottom: '28px' }}>
          <span className="eyebrow">Guide Verification</span>
          <h1 className="page-title">Phê duyệt Hướng dẫn viên</h1>
          <p className="page-subtitle">Xem xét và phê duyệt hồ sơ đăng ký trở thành Hướng dẫn viên.</p>
        </div>

        {loading ? (
          <div className="glass-panel admin-tours-empty">
            <p>Đang tải danh sách...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {applications.map((app) => {
              const statusStyle = getStatusStyle(app.status);
              const isPending = app.status === 'PENDING';

              return (
                <div
                  key={app.id}
                  className="glass-panel"
                  onClick={() => setSelectedApp(app)}
                  style={{
                    padding: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
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
                        flexShrink: 0,
                      }}
                    >
                      {app.status === 'REJECTED' ? <ShieldX size={22} /> : <ShieldCheck size={22} />}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{app.userFullName}</p>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            border: `1px solid ${statusStyle.border}`,
                          }}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6 }}>
                        Gửi đơn: {new Date(app.createdAt).toLocaleDateString('vi-VN')} • ID: {app.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                    <ChevronRight size={20} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && !loading ? (
          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="btn-secondary"
              style={{ padding: '10px' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
              Trang {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="btn-secondary"
              style={{ padding: '10px' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : null}
      </div>

      {selectedApp && (
        <div className="admin-guide-modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="glass-panel admin-guide-modal" onClick={(e) => e.stopPropagation()} style={{ padding: 0 }}>
            <header className="admin-guide-detail-header">
              <div className="admin-guide-detail-header-left">
                <span className="admin-guide-detail-icon">
                  <Award size={22} />
                </span>
                <div>
                  <h3 className="admin-guide-detail-title">Chi tiết hồ sơ đăng ký</h3>
                  <p className="admin-guide-detail-subtitle">ID: {selectedApp.id}</p>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setSelectedApp(null)} title="Đóng">
                <X size={18} />
              </button>
            </header>

            <div className="admin-guide-detail-body">
              <div className="admin-guide-detail-grid">
                <section className="admin-guide-detail-section">
                  <div className="admin-guide-detail-section-head">
                    <h4>
                      <Briefcase size={16} /> Năng lực chuyên môn
                    </h4>
                  </div>

                  <div className="admin-guide-detail-cards">
                    <div className="glass-panel admin-guide-detail-card">
                      <span className="admin-guide-detail-field-label">Ngôn ngữ thông thạo</span>
                      {selectedApp.status === 'PENDING' ? (
                        <input
                          type="text"
                          className="input-field"
                          value={editData[selectedApp.id]?.languages || ''}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              [selectedApp.id]: { ...editData[selectedApp.id], languages: e.target.value },
                            })
                          }
                        />
                      ) : (
                        <p className="admin-guide-detail-field-value">{selectedApp.languages}</p>
                      )}
                    </div>

                    <div className="glass-panel admin-guide-detail-card">
                      <span className="admin-guide-detail-field-label">Số năm kinh nghiệm</span>
                      {selectedApp.status === 'PENDING' ? (
                        <input
                          type="number"
                          className="input-field"
                          value={editData[selectedApp.id]?.yearsOfExperience || 0}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              [selectedApp.id]: {
                                ...editData[selectedApp.id],
                                yearsOfExperience: parseInt(e.target.value || '0', 10) || 0,
                              },
                            })
                          }
                        />
                      ) : (
                        <p className="admin-guide-detail-field-value">{selectedApp.yearsOfExperience} năm</p>
                      )}
                    </div>

                    <div className="glass-panel admin-guide-detail-card">
                      <span className="admin-guide-detail-field-label">Chuyên môn đặc thù</span>
                      <p className="admin-guide-detail-field-copy">
                        {selectedApp.specializations || 'Không có thông tin'}
                      </p>
                    </div>

                    <div className="glass-panel admin-guide-detail-card">
                      <span className="admin-guide-detail-field-label">Khu vực hoạt động</span>
                      <p className="admin-guide-detail-field-copy admin-guide-detail-field-accent">
                        <MapPin size={16} /> {selectedApp.operatingAreas || 'Không có thông tin'}
                      </p>
                    </div>
                  </div>

                  <div className="admin-guide-detail-section-head" style={{ marginTop: 24 }}>
                    <h4>
                      <Calendar size={16} /> Thông tin đối chiếu
                    </h4>
                  </div>

                  <div className="glass-panel admin-guide-detail-card admin-guide-detail-kv">
                    <div className="admin-guide-detail-kv-row">
                      <span>Họ và tên</span>
                      <strong>{selectedApp.userFullName}</strong>
                    </div>
                    <div className="admin-guide-detail-kv-row">
                      <span>Ngày gửi đơn</span>
                      <strong>{new Date(selectedApp.createdAt).toLocaleDateString('vi-VN')}</strong>
                    </div>
                    {selectedApp.status === 'REJECTED' && selectedApp.rejectionReason ? (
                      <div className="admin-guide-detail-warning">
                        <strong>Lý do từ chối:</strong> {selectedApp.rejectionReason}
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="admin-guide-detail-section">
                  <div className="admin-guide-detail-section-head">
                    <h4>
                      <FileText size={16} /> Hồ sơ và chứng chỉ
                    </h4>
                  </div>

                  <div className="admin-guide-doc-list">
                    {detailDocs.map((doc) => (
                      <div key={doc.label} className="glass-panel admin-guide-doc-row">
                        <div className="admin-guide-doc-copy">
                          <p>{doc.label}</p>
                          {doc.expiry ? (
                            <span>
                              {doc.expiryLabel || 'Hết hạn'}: {new Date(doc.expiry).toLocaleDateString('vi-VN')}
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="admin-guide-doc-action"
                          onClick={() => handleViewFile(doc.path)}
                          disabled={!doc.path}
                        >
                          <ExternalLink size={14} /> Xem tệp
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <footer className="admin-guide-detail-footer">
              <button type="button" onClick={() => setSelectedApp(null)} className="btn-secondary">
                Đóng
              </button>
              {selectedApp.status === 'PENDING' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleProcess(selectedApp.id, 'REJECTED')}
                    disabled={!!processing}
                    className="btn-danger-outline"
                  >
                    Từ chối hồ sơ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProcess(selectedApp.id, 'APPROVED')}
                    disabled={!!processing}
                    className="btn-primary"
                  >
                    Phê duyệt HDV
                  </button>
                </>
              ) : null}
            </footer>
          </div>
        </div>
      )}

      {rejectingAppId ? (
        <div className="admin-guide-modal-overlay" style={{ zIndex: 1300 }}>
          <div className="glass-panel admin-guide-modal" style={{ width: 'min(100%, 520px)' }}>
            <div className="admin-guide-modal-header" style={{ textAlign: 'center', marginBottom: 18 }}>
              <div className="admin-guide-modal-icon" style={{ marginBottom: 14 }}>
                <ShieldX size={32} />
              </div>
              <h3 className="admin-guide-modal-title">Từ chối đơn ứng tuyển</h3>
              <p className="admin-guide-modal-copy">
                Nhập lý do từ chối để TravelX gửi thông báo rõ ràng và chuyên nghiệp tới ứng viên.
              </p>
            </div>

            <div className="admin-guide-modal-field">
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
                style={{ minHeight: 132, resize: 'none' }}
              />
            </div>

            <div className="admin-guide-modal-actions">
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

      <style>{`
        .admin-guide-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          padding: 40px 20px;
          animation: modalFadeIn 0.3s ease-out;
        }

        .admin-guide-modal {
          position: relative;
          width: 960px;
          max-width: 100%;
          max-height: 90vh;
          margin: auto;
          display: flex;
          flex-direction: column;
          animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          overflow: hidden;
          padding: 0;
        }

        .admin-guide-detail-header {
          padding: 24px 32px;
          background: var(--surface-muted);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .admin-guide-detail-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .admin-guide-detail-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-guide-detail-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .admin-guide-detail-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .admin-guide-detail-body {
          padding: 32px;
          flex: 1;
          overflow-y: auto;
        }

        .admin-guide-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .admin-guide-detail-section h4 {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-guide-detail-cards {
          display: grid;
          gap: 16px;
        }

        .admin-guide-detail-card {
          padding: 16px;
          border: 1px solid var(--glass-border);
        }

        .admin-guide-detail-field-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .admin-guide-detail-field-value {
          font-weight: 700;
          color: var(--text-primary);
        }

        .admin-guide-detail-field-copy {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .admin-guide-detail-field-accent {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary);
          font-weight: 700;
        }

        .admin-guide-detail-kv-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--glass-border);
        }

        .admin-guide-detail-kv-row:last-child {
          border-bottom: none;
        }

        .admin-guide-detail-footer {
          padding: 20px 32px;
          background: var(--surface-muted);
          border-top: 1px solid var(--glass-border);
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          flex-shrink: 0;
        }

        .admin-guide-doc-list {
          display: grid;
          gap: 12px;
        }

        .admin-guide-doc-row {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid var(--glass-border);
        }

        .admin-guide-doc-copy p {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .admin-guide-doc-copy span {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .admin-guide-doc-action {
          padding: 8px 14px;
          background: var(--surface-hover);
          border-radius: 10px;
          color: var(--primary);
          border: 1px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          transition: all 0.2s;
        }

        .admin-guide-doc-action:hover:not(:disabled) {
          border-color: var(--primary);
          background: white;
          transform: translateY(-1px);
        }

        .admin-guide-doc-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .btn-danger-outline {
          padding: 10px 20px;
          border-radius: 12px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #dc2626;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger-outline:hover {
          background: #fee2e2;
          border-color: #ef4444;
        }

        .admin-tour-action-success { color: #059669 !important; }
        .admin-tour-action-success:hover { background: #ecfdf5 !important; }
        .admin-tour-action-danger { color: #dc2626 !important; }
        .admin-tour-action-danger:hover { background: #fef2f2 !important; }
      `}</style>
    </DashboardLayout>
  );
};

export default AdminGuideApplications;
