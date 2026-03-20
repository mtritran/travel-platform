import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  X
} from 'lucide-react';
import api from '../services/api';
import type { ApiResponse } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';

interface GuideApplication {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

const BecomeGuidePage: React.FC = () => {
  const { user } = useAuth();
  const [application, setApplication] = useState<GuideApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<{
    idCard: File | null;
    guideCard: File | null;
    certificate: File | null;
  }>({ idCard: null, guideCard: null, certificate: null });

  const isAlreadyGuide = user?.roles?.some(r => r.name === 'GUIDE');

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const response = await api.get<ApiResponse<GuideApplication>>(ENDPOINTS.GUIDE_APPLICATION.MY_APPLICATION);
      setApplication(response.data.result);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error("Lỗi khi tải thông tin ứng tuyển:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [type]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.idCard || !files.guideCard || !files.certificate) {
      alert("Vui lòng tải lên đầy đủ các tài liệu yêu cầu.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('idCardFile', files.idCard);
    formData.append('guideCardFile', files.guideCard);
    formData.append('certificateFile', files.certificate);

    try {
      await api.post(ENDPOINTS.GUIDE_APPLICATION.APPLY, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Đã gửi đơn ứng tuyển! Vui lòng chờ quản trị viên phê duyệt.");
      fetchApplicationStatus();
    } catch (err: any) {
       console.error("Submission error:", err);
       alert(err.response?.data?.message || "Lỗi khi gửi đơn ứng tuyển.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
         <p style={{ color: 'var(--text-secondary)' }}>Đang tải thông tin hồ sơ...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '800px', margin: '40px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Trở thành Hướng dẫn viên
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Chia sẻ kiến thức, dẫn dắt những hành trình và kiếm thêm thu nhập cùng TravelX.
          </p>
        </div>

        {isAlreadyGuide ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <ShieldCheck size={48} color="#059669" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Bạn đã là Hướng dẫn viên!
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Chúc mừng! Bạn hiện đã có quyền tạo tour và quản lý các yêu cầu từ khách hàng. 
              Hãy bắt đầu đăng tour đầu tiên của bạn ngay nhé.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              style={{ marginTop: '32px', padding: '12px 32px', background: 'var(--primary)', color: 'white' }}
            >
              Quay lại cửa hàng
            </button>
          </div>
        ) : application?.status === 'PENDING' ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <AlertCircle size={48} color="#d97706" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Đơn ứng tuyển đang chờ duyệt
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Chúng tôi đã nhận được hồ sơ của bạn. Đội ngũ quản trị viên đang kiểm tra các tài liệu đính kèm. 
              Bạn sẽ nhận được thông báo ngay khi hồ sơ được phê duyệt.
            </p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px' }}>
             {application?.status === 'REJECTED' && (
                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '32px', display: 'flex', gap: '12px' }}>
                   <X color="#991b1b" />
                   <div>
                      <p style={{ fontWeight: '700', color: '#991b1b' }}>Hồ sơ bị từ chối</p>
                      <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>Lý do: {application.rejectionReason || 'Thông tin tài liệu không rõ ràng.'}</p>
                   </div>
                </div>
             )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '-16px' }}>Vui lòng tải lên các giấy tờ sau:</p>
              
              <div style={{ display: 'grid', gap: '24px' }}>
                <FileUploader 
                  label="Chứng minh nhân dân / CCCD" 
                  description="Ảnh rõ nét mặt trước"
                  file={files.idCard}
                  onChange={(e) => handleFileChange(e, 'idCard')}
                />
                <FileUploader 
                  label="Thẻ hướng dẫn viên" 
                  description="Chứng chỉ hành nghề còn hạn"
                  file={files.guideCard}
                  onChange={(e) => handleFileChange(e, 'guideCard')}
                />
                <FileUploader 
                  label="Chứng chỉ chuyên môn khác" 
                  description="Bằng ngoại ngữ hoặc đào tạo nghiệp vụ"
                  file={files.certificate}
                  onChange={(e) => handleFileChange(e, 'certificate')}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                 <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                   Bằng việc nhấn "Gửi hồ sơ", bạn cam kết các thông tin và tài liệu cung cấp là chính xác và trung thực. 
                   TravelX có quyền thu hồi tư cách hướng dẫn viên nếu phát hiện gian lận.
                 </p>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                style={{ 
                  padding: '16px', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  fontSize: '1.125rem', 
                  fontWeight: '700',
                  boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ ứng tuyển'}
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

interface FileUploaderProps {
  label: string;
  description: string;
  file: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ label, description, file, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'white', border: '2px dashed #e2e8f0', borderRadius: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
        <FileText size={24} />
      </div>
      <div>
        <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{label}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{file ? file.name : description}</p>
      </div>
    </div>
    <label style={{ cursor: 'pointer', padding: '10px 20px', background: file ? '#ecfdf5' : 'var(--surface-hover)', color: file ? '#059669' : 'var(--text-primary)', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', transition: 'all 0.2s' }}>
      <input type="file" style={{ display: 'none' }} onChange={onChange} accept="image/*,.pdf" />
      {file ? 'Đã chọn' : <><Upload size={16} /> Chọn tệp</>}
    </label>
  </div>
);

export default BecomeGuidePage;
