import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ShieldCheck
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
}

const AdminGuideApplications: React.FC = () => {
  const [applications, setApplications] = useState<GuideApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get<ApiResponse<GuideApplication[]>>(ENDPOINTS.GUIDE_APPLICATION.GET_ALL);
      setApplications(response.data.result);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessing(id);
    const reason = status === 'REJECTED' ? prompt("Nhập lý do từ chối:") : "";
    if (status === 'REJECTED' && reason === null) {
      setProcessing(null);
      return;
    }

    try {
      await api.post(ENDPOINTS.GUIDE_APPLICATION.PROCESS(id), null, {
        params: { status, reason }
      });
      fetchApplications();
    } catch (err) {
      console.error("Failed to process application:", err);
      alert("Lỗi khi xử lý đơn ứng tuyển.");
    } finally {
      setProcessing(null);
    }
  };

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
                 <div key={app.id} className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', gap: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                       <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(45deg, var(--primary), var(--accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <ShieldCheck size={24} />
                       </div>
                       <div>
                          <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{app.userFullName}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Đăng ký vào {new Date(app.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                       <DocumentLink label="CCCD" path={app.idCardUrl} />
                       <DocumentLink label="Thẻ HDV" path={app.guideCardUrl} />
                       <DocumentLink label="Bằng cấp" path={app.certificateUrl} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                       <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                          {app.status}
                       </span>
                       
                       {app.status === 'PENDING' && (
                         <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleProcess(app.id, 'REJECTED')}
                              disabled={!!processing}
                              style={{ padding: '8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                            >
                              <XCircle size={18} /> Từ chối
                            </button>
                            <button 
                              onClick={() => handleProcess(app.id, 'APPROVED')}
                              disabled={!!processing}
                              style={{ padding: '8px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                            >
                              <CheckCircle2 size={18} /> Phê duyệt
                            </button>
                         </div>
                       )}
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
  const fullUrl = `http://localhost:8080/guide-applications/documents?path=${encodeURIComponent(path)}`;
  return (
    <a href={fullUrl} target="_blank" rel="noopener noreferrer" style={{ 
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
      fontWeight: '600'
    }}>
      <Eye size={16} color="var(--primary)" /> {label}
    </a>
  );
};

export default AdminGuideApplications;
