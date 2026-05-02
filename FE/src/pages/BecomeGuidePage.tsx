import React, { useEffect, useState } from 'react';
import {
  FileText,
  Upload,
  ShieldCheck,
  AlertCircle,
  X,
  Eye
} from 'lucide-react';
import api from '../services/api';
import type { ApiResponse } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import IdentityUpgradeBanner from '../components/common/IdentityUpgradeBanner';

interface GuideApplication {
  id: string;
  profilePhotoUrl: string;
  idCardUrl: string;
  idCardExpiry: string;
  guideCardUrl: string;
  guideCardExpiry: string;
  certificateUrl: string;
  certificateExpiry: string;
  criminalRecordUrl: string;
  criminalRecordIssuedAt: string;
  healthRecordUrl: string;
  healthRecordDate: string;
  drugTestResultUrl: string;
  drugTestDate: string;
  languages: string;
  specializations: string;
  operatingAreas: string;
  yearsOfExperience: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

const BecomeGuidePage: React.FC = () => {
  const { user } = useAuth();
  const [application, setApplication] = useState<GuideApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<{
    profilePhoto: File | null;
    idCard: File | null;
    guideCard: File | null;
    certificate: File | null;
    criminalRecord: File | null;
    healthRecord: File | null;
    drugTest: File | null;
  }>({
    profilePhoto: null,
    idCard: null,
    guideCard: null,
    certificate: null,
    criminalRecord: null,
    healthRecord: null,
    drugTest: null,
  });

  const [formData, setFormData] = useState({
    languages: '',
    yearsOfExperience: '',
    specializations: '',
    operatingAreas: '',
    idCardExpiry: '',
    guideCardExpiry: '',
    certificateExpiry: '',
    criminalRecordIssuedAt: '',
    healthRecordDate: '',
    drugTestDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isAlreadyGuide = user?.roles?.some(r => r.name === 'GUIDE');

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      const response = await api.get<ApiResponse<GuideApplication>>(ENDPOINTS.GUIDE_APPLICATION.MY_APPLICATION);
      const app = response.data.result;
      setApplication(app);
      setFormData({
        languages: app.languages || '',
        yearsOfExperience: app.yearsOfExperience?.toString() || '',
        specializations: app.specializations || '',
        operatingAreas: app.operatingAreas || '',
        idCardExpiry: app.idCardExpiry || '',
        guideCardExpiry: app.guideCardExpiry || '',
        certificateExpiry: app.certificateExpiry || '',
        criminalRecordIssuedAt: app.criminalRecordIssuedAt || '',
        healthRecordDate: app.healthRecordDate || '',
        drugTestDate: app.drugTestDate || '',
      });
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

  const handleViewFile = async (path: string | undefined) => {
    if (!path) return;
    try {
      const response = await api.get(ENDPOINTS.GUIDE_APPLICATION.GET_DOCUMENT(path), {
        responseType: 'blob'
      });
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error("Lỗi khi xem tập tin:", err);
      alert("Không thể mở tập tin này.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verification logic
    const newErrors: Record<string, string> = {};
    
    if (!formData.languages) newErrors.languages = 'Vui lòng nhập ngôn ngữ thông thạo';
    if (!formData.yearsOfExperience) newErrors.yearsOfExperience = 'Vui lòng nhập số năm kinh nghiệm';

    if (!application) {
      if (!files.profilePhoto) newErrors.profilePhoto = 'Vui lòng tải lên ảnh chân dung';
      if (!files.idCard) newErrors.idCard = 'Vui lòng tải lên CMND/CCCD';
      if (!files.guideCard) newErrors.guideCard = 'Vui lòng tải lên thẻ HDV';
      if (!files.certificate) newErrors.certificate = 'Vui lòng tải lên bằng cấp/chứng chỉ';
    }

    // Date validations
    if (!formData.idCardExpiry) newErrors.idCardExpiry = 'Vui lòng nhập ngày hết hạn';
    if (!formData.guideCardExpiry) newErrors.guideCardExpiry = 'Vui lòng nhập ngày hết hạn';
    if (!formData.certificateExpiry) newErrors.certificateExpiry = 'Vui lòng nhập ngày hết hạn';
    if (!formData.criminalRecordIssuedAt) newErrors.criminalRecordIssuedAt = 'Vui lòng nhập ngày cấp';
    if (!formData.healthRecordDate) newErrors.healthRecordDate = 'Vui lòng nhập ngày khám';
    if (!formData.drugTestDate) newErrors.drugTestDate = 'Vui lòng nhập ngày xét nghiệm';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first error
      const firstErrorKey = Object.keys(newErrors)[0];
      const errorElement = document.getElementsByName(firstErrorKey)[0] || document.getElementById(firstErrorKey);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setErrors({});

    setSubmitting(true);
    const data = new FormData();

    // Files
    if (files.profilePhoto) data.append('profilePhotoFile', files.profilePhoto);
    if (files.idCard) data.append('idCardFile', files.idCard);
    if (files.guideCard) data.append('guideCardFile', files.guideCard);
    if (files.certificate) data.append('certificateFile', files.certificate);
    if (files.criminalRecord) data.append('criminalRecordFile', files.criminalRecord);
    if (files.healthRecord) data.append('healthRecordFile', files.healthRecord);
    if (files.drugTest) data.append('drugTestFile', files.drugTest);

    // Text data
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    try {
      if (application) {
        await api.put(ENDPOINTS.GUIDE_APPLICATION.MY_APPLICATION, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(ENDPOINTS.GUIDE_APPLICATION.APPLY, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowSuccessModal(true);
      setFiles({
        profilePhoto: null,
        idCard: null,
        guideCard: null,
        certificate: null,
        criminalRecord: null,
        healthRecord: null,
        drugTest: null,
      });
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

  const SuccessModal = () => (
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
        maxWidth: '420px',
        background: '#e8e8e6',
        borderRadius: '32px',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'modalFadeUp 0.4s ease-out'
      }}>
        {/* Icon Box */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: '#10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.3)'
        }}>
          <ShieldCheck size={36} color="white" />
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '900',
          marginBottom: '16px',
          color: '#1e293b',
          letterSpacing: '-0.02em'
        }}>
          {application ? 'Đã cập nhật hồ sơ!' : 'Gửi đơn thành công!'}
        </h3>

        {/* Description */}
        <p style={{
          color: '#64748b',
          lineHeight: '1.6',
          marginBottom: '32px',
          fontSize: '0.95rem',
          maxWidth: '85%',
          margin: '0 auto 32px'
        }}>
          {application
            ? 'Thông tin ứng tuyển của bạn đã được cập nhật thành công hệ thống.'
            : 'Đơn ứng tuyển của bạn đã được gửi đi. Vui lòng chờ quản trị viên phê duyệt trong thời gian sớm nhất.'}
        </p>

        {/* Action Button */}
        <button
          onClick={() => setShowSuccessModal(false)}
          style={{
            width: '100%',
            padding: '16px',
            background: '#0f766e',
            color: 'white',
            borderRadius: '16px',
            fontWeight: '700',
            fontSize: '1rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Tôi đã hiểu
        </button>
      </div>
      <style>{`
        @keyframes modalFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '800px', margin: 'auto' }}>
        {showSuccessModal && <SuccessModal />}
        <div className="section-heading" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <span className="eyebrow" style={{ margin: '0 auto' }}>Guide Center</span>
          <h1 className="page-title">Trở thành Hướng dẫn viên</h1>
          <p className="page-subtitle" style={{ margin: '0 auto' }}>
            Chia sẻ kiến thức, dẫn dắt những hành trình và kiếm thêm thu nhập cùng TravelX.
          </p>
        </div>

        {(!user?.phone || !user?.hasPaymentPin) ? (
          <div style={{ width: '100%', margin: '0 0 60px 0' }}>
            <IdentityUpgradeBanner
              title="Cần định danh để đăng ký HDV"
              message="Để đảm bảo an toàn cho cộng đồng TravelX, vui lòng thiết lập Số điện thoại và Mã PIN thanh toán trước khi bắt đầu quy trình trở thành Hướng dẫn viên."
            />
          </div>
        ) : isAlreadyGuide ? (
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
              style={{
                marginTop: '32px',
                padding: '12px 32px',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Quay lại trang chủ
            </button>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px' }}>
            {application?.status === 'PENDING' && (
              <div style={{ padding: '20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <AlertCircle size={24} color="#d97706" />
                <div>
                  <p style={{ fontWeight: '700', color: '#92400e' }}>Đơn ứng tuyển đang chờ duyệt</p>
                  <p style={{ fontSize: '0.875rem', color: '#b45309' }}>Chúng tôi đang kiểm tra hồ sơ của bạn. Bạn vẫn có thể cập nhật lại các tài liệu nếu cần thiết bên dưới.</p>
                </div>
              </div>
            )}

            {application?.status === 'REJECTED' && (
              <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', marginBottom: '32px', display: 'flex', gap: '12px' }}>
                <X color="#991b1b" />
                <div>
                  <p style={{ fontWeight: '700', color: '#991b1b' }}>Hồ sơ bị từ chối</p>
                  <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>Lý do: {application.rejectionReason || 'Thông tin tài liệu không rõ ràng.'}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {/* --- Section 1: Competency --- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' }}>
                  1. Năng lực & Kinh nghiệm
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label className="field-label">Ngôn ngữ thông thạo</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tiếng Anh, Tiếng Pháp..."
                      value={formData.languages}
                      onChange={(e) => {
                        setFormData({ ...formData, languages: e.target.value });
                        if (errors.languages) setErrors({ ...errors, languages: '' });
                      }}
                      className="input-field"
                      style={{ 
                        padding: '12px 16px', 
                        width: '100%', 
                        borderRadius: '14px', 
                        border: errors.languages ? '1px solid #ef4444' : '1px solid #e2e8f0',
                        outline: 'none'
                      }}
                    />
                    {errors.languages && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', fontWeight: '600' }}>{errors.languages}</p>}
                  </div>
                  <div>
                    <label className="field-label">Số năm kinh nghiệm</label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 3"
                      value={formData.yearsOfExperience}
                      onChange={(e) => {
                        setFormData({ ...formData, yearsOfExperience: e.target.value });
                        if (errors.yearsOfExperience) setErrors({ ...errors, yearsOfExperience: '' });
                      }}
                      className="input-field"
                      style={{ 
                        padding: '12px 16px', 
                        width: '100%', 
                        borderRadius: '14px', 
                        border: errors.yearsOfExperience ? '1px solid #ef4444' : '1px solid #e2e8f0',
                        outline: 'none'
                      }}
                    />
                    {errors.yearsOfExperience && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '6px', fontWeight: '600' }}>{errors.yearsOfExperience}</p>}
                  </div>
                </div>
                <div>
                  <label className="field-label">Chuyên môn đặc thù</label>
                  <textarea
                    placeholder="Ví dụ: Leo núi, Lặn biển, Lịch sử văn hóa..."
                    value={formData.specializations}
                    onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                    className="input-field"
                    style={{ padding: '12px 16px', width: '100%', borderRadius: '14px', border: '1px solid #e2e8f0', minHeight: '80px', resize: 'none' }}
                  />
                </div>
                <div>
                  <label className="field-label">Khu vực hoạt động chính</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Quy Nhơn, Phố cổ Hội An, Tây Bắc..."
                    value={formData.operatingAreas}
                    onChange={(e) => setFormData({ ...formData, operatingAreas: e.target.value })}
                    className="input-field"
                    style={{ padding: '12px 16px', width: '100%', borderRadius: '14px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              </div>

              {/* --- Section 2: Identification --- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' }}>
                  2. Hồ sơ định danh & Đối chiếu
                </h4>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <FileUploader
                    label="Ảnh chân dung đối chiếu"
                    description="Ảnh chân dung chụp rõ mặt, không đeo kính râm/mũ"
                    file={files.profilePhoto}
                    currentUrl={application?.profilePhotoUrl}
                    onView={() => handleViewFile(application?.profilePhotoUrl)}
                    onChange={(e) => {
                      handleFileChange(e, 'profilePhoto');
                      if (errors.profilePhoto) setErrors({ ...errors, profilePhoto: '' });
                    }}
                    error={errors.profilePhoto}
                  />
                  <FileUploader
                    label="Chứng minh nhân dân / CCCD"
                    description="Mặt trước của giấy tờ định danh"
                    file={files.idCard}
                    currentUrl={application?.idCardUrl}
                    onView={() => handleViewFile(application?.idCardUrl)}
                    onChange={(e) => {
                      handleFileChange(e, 'idCard');
                      if (errors.idCard) setErrors({ ...errors, idCard: '' });
                    }}
                    dateValue={formData.idCardExpiry}
                    onDateChange={(val) => {
                      setFormData({ ...formData, idCardExpiry: val });
                      if (errors.idCardExpiry) setErrors({ ...errors, idCardExpiry: '' });
                    }}
                    dateLabel="Ngày hết hạn"
                    error={errors.idCard}
                    dateError={errors.idCardExpiry}
                  />
                  <FileUploader
                    label="Thẻ hướng dẫn viên"
                    description="Thẻ HDV do cơ quan có thẩm quyền cấp"
                    file={files.guideCard}
                    currentUrl={application?.guideCardUrl}
                    onView={() => handleViewFile(application?.guideCardUrl)}
                    onChange={(e) => {
                      handleFileChange(e, 'guideCard');
                      if (errors.guideCard) setErrors({ ...errors, guideCard: '' });
                    }}
                    dateValue={formData.guideCardExpiry}
                    onDateChange={(val) => {
                      setFormData({ ...formData, guideCardExpiry: val });
                      if (errors.guideCardExpiry) setErrors({ ...errors, guideCardExpiry: '' });
                    }}
                    dateLabel="Ngày hết hạn"
                    error={errors.guideCard}
                    dateError={errors.guideCardExpiry}
                  />
                  <FileUploader
                    label="Chứng chỉ ngoại ngữ / Chuyên môn"
                    description="Các bằng cấp, chứng chỉ liên quan"
                    file={files.certificate}
                    currentUrl={application?.certificateUrl}
                    onView={() => handleViewFile(application?.certificateUrl)}
                    onChange={(e) => {
                      handleFileChange(e, 'certificate');
                      if (errors.certificate) setErrors({ ...errors, certificate: '' });
                    }}
                    dateValue={formData.certificateExpiry}
                    onDateChange={(val) => {
                      setFormData({ ...formData, certificateExpiry: val });
                      if (errors.certificateExpiry) setErrors({ ...errors, certificateExpiry: '' });
                    }}
                    dateLabel="Ngày hết hạn"
                    error={errors.certificate}
                    dateError={errors.certificateExpiry}
                  />
                </div>
              </div>

              {/* --- Section 3: Health & Legal --- */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' }}>
                  3. Hồ sơ Pháp lý & Sức khỏe
                </h4>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <FileUploader
                    label="Lý lịch tư pháp"
                    description="Bản gốc hoặc bản sao có công chứng"
                    file={files.criminalRecord}
                    currentUrl={application?.criminalRecordUrl}
                    onView={() => handleViewFile(application?.criminalRecordUrl)}
                    onChange={(e) => {
                      handleFileChange(e, 'criminalRecord');
                      if (errors.criminalRecord) setErrors({ ...errors, criminalRecord: '' });
                    }}
                    dateValue={formData.criminalRecordIssuedAt}
                    onDateChange={(val) => {
                      setFormData({ ...formData, criminalRecordIssuedAt: val });
                      if (errors.criminalRecordIssuedAt) setErrors({ ...errors, criminalRecordIssuedAt: '' });
                    }}
                    dateLabel="Ngày cấp"
                    dateError={errors.criminalRecordIssuedAt}
                  />
                  <FileUploader
                    label="Giấy khám sức khỏe"
                    description="Bản chính còn hạn trong vòng 6 tháng"
                    file={files.healthRecord}
                    currentUrl={application?.healthRecordUrl}
                    onView={() => handleViewFile(application?.healthRecordUrl)}
                    onChange={(e) => {
                      handleFileChange(e, 'healthRecord');
                      if (errors.healthRecord) setErrors({ ...errors, healthRecord: '' });
                    }}
                    dateValue={formData.healthRecordDate}
                    onDateChange={(val) => {
                      setFormData({ ...formData, healthRecordDate: val });
                      if (errors.healthRecordDate) setErrors({ ...errors, healthRecordDate: '' });
                    }}
                    dateLabel="Ngày khám"
                    dateError={errors.healthRecordDate}
                  />
                  <FileUploader
                    label="Xét nghiệm ma túy"
                    description="Kết quả âm tính trong vòng 3 tháng"
                    file={files.drugTest}
                    currentUrl={application?.drugTestResultUrl}
                    onView={() => handleViewFile(application?.drugTestResultUrl)}
                    onChange={(e) => {
                      handleFileChange(e, 'drugTest');
                      if (errors.drugTest) setErrors({ ...errors, drugTest: '' });
                    }}
                    dateValue={formData.drugTestDate}
                    onDateChange={(val) => {
                      setFormData({ ...formData, drugTestDate: val });
                      if (errors.drugTestDate) setErrors({ ...errors, drugTestDate: '' });
                    }}
                    dateLabel="Ngày xét nghiệm"
                    dateError={errors.drugTestDate}
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Bằng việc nhấn "Gửi hồ sơ", bạn cam kết các thông tin và tài liệu cung cấp là chính xác và trung thực.
                  TravelX có quyền thu hồi tư cách hướng dẫn viên nếu phát hiện gian lận hoặc hồ sơ không đạt yêu cầu.
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
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(15, 118, 110, 0.3)',
                  opacity: submitting ? 0.7 : 1,
                  transition: 'all 0.2s',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Đang xử lý...' : application ? 'Cập nhật hồ sơ ứng tuyển' : 'Gửi hồ sơ đăng ký'}
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
  currentUrl?: string;
  onView?: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dateLabel?: string;
  dateValue?: string;
  onDateChange?: (val: string) => void;
  error?: string;
  dateError?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  label, description, file, currentUrl, onView, onChange, dateLabel, dateValue, onDateChange, error, dateError
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    background: 'white',
    border: (error || dateError) ? '2px dashed #ef4444' : '2px dashed #e2e8f0',
    borderRadius: '20px',
    transition: 'border-color 0.2s'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '14px', 
          background: error ? '#fef2f2' : 'var(--surface-hover)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: error ? '#ef4444' : 'var(--primary)' 
        }}>
          <FileText size={24} />
        </div>
        <div>
          <p style={{ fontWeight: '700', color: error ? '#ef4444' : 'var(--text-primary)' }}>{label}</p>
          <p style={{ fontSize: '0.75rem', color: error ? '#ef4444' : 'var(--text-secondary)' }}>
            {file ? <span style={{ color: '#059669', fontWeight: '600' }}>Tệp mới: {file.name}</span> : (error || description)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {currentUrl && !file && (
          <button
            onClick={(e) => { e.preventDefault(); onView?.(); }}
            style={{ padding: '10px 16px', background: '#f8fafc', color: 'var(--primary)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Eye size={16} /> Xem cũ
          </button>
        )}

        <label style={{
          cursor: 'pointer',
          padding: '10px 20px',
          background: file ? '#ecfdf5' : (error ? '#ef4444' : 'var(--primary)'),
          color: file ? '#059669' : 'white',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: '600',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <input type="file" style={{ display: 'none' }} onChange={onChange} accept="image/*,.pdf" />
          {file ? 'Đổi tệp' : <><Upload size={16} /> {currentUrl ? 'Cập nhật' : 'Chọn tệp'}</>}
        </label>
      </div>
    </div>

    {onDateChange && (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingTop: '12px',
        borderTop: '1px solid #f1f5f9',
        marginTop: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: dateError ? '#ef4444' : '#64748b', minWidth: '100px' }}>{dateLabel}:</label>
          <input
            type="date"
            value={dateValue || ''}
            onChange={(e) => onDateChange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: dateError ? '1px solid #ef4444' : '1px solid #e2e8f0',
              fontSize: '0.875rem',
              outline: 'none',
              color: '#1e293b'
            }}
          />
        </div>
        {dateError && <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600', marginLeft: '112px' }}>{dateError}</p>}
      </div>
    )}
  </div>
);

export default BecomeGuidePage;
