import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, MapPin, 
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import LocationPicker from '../../components/common/LocationPicker';

const CreateTourRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      title: '',
      description: '',
      budget: '',
      locationName: '',
      address: '',
      latitude: 0,
      longitude: 0,
      plannedDate: tomorrow.toISOString().split('T')[0],
      numberOfGuests: '1'
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any) => {
    let error = '';

    switch (name) {
      case 'title':
        if (!value.trim()) error = 'Tiêu đề yêu cầu không được để trống';
        break;
      case 'budget':
        if (!value || Number(value) <= 0) error = 'Ngân sách phải lớn hơn 0';
        break;
      case 'plannedDate':
        if (!value) {
            error = 'Vui lòng chọn ngày dự kiến';
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(value);
            selectedDate.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) error = 'Ngày dự kiến không được ở trong quá khứ';
        }
        break;
      case 'numberOfGuests':
        if (!value || value < 1) error = 'Số lượng khách ít nhất là 1';
        break;
      case 'description':
        if (!value.trim()) error = 'Vui lòng nhập mô tả yêu cầu chi tiết';
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ['title', 'budget', 'plannedDate', 'numberOfGuests', 'description'];
    
    let isValid = true;
    fieldsToValidate.forEach(field => {
        const error = validateField(field, (formData as any)[field]);
        if (error) {
            newErrors[field] = error;
            isValid = false;
        }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude) {
      alert("Vui lòng chọn địa điểm bạn muốn đến trên bản đồ.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(ENDPOINTS.TOUR_REQUEST.CREATE, {
        title: formData.title,
        description: formData.description,
        budget: Number(formData.budget),
        plannedDate: formData.plannedDate,
        numberOfGuests: Number(formData.numberOfGuests),
        customLocationName: formData.locationName,
        latitude: formData.latitude,
        longitude: formData.longitude
      });

      setStep(3); // Success step
    } catch (err: any) {
      console.error("Failed to create tour request:", err);
      alert(err.response?.data?.message || "Lỗi khi đăng yêu cầu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '40px auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Đăng yêu cầu Tìm Hướng dẫn viên
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Mô tả chuyến đi mong muốn của bạn để các HDV vào nhận tour.</p>
        </div>

        {/* Form Steps */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '40px' }}>
           <div style={{ flex: 1, padding: '12px', background: step === 1 ? 'var(--primary-light)' : 'var(--surface)', borderRadius: '12px', border: `2px solid ${step === 1 ? 'var(--primary)' : 'var(--glass-border)'}`, color: step === 1 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center' }}>
             1. Nhu cầu chuyến đi
           </div>
           <div style={{ flex: 1, padding: '12px', background: step === 2 ? 'var(--primary-light)' : 'var(--surface)', borderRadius: '12px', border: `2px solid ${step === 2 ? 'var(--primary)' : 'var(--glass-border)'}`, color: step === 2 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center' }}>
             2. Địa điểm mong muốn
           </div>
           <div style={{ flex: 1, padding: '12px', background: step === 3 ? 'var(--success-light)' : 'var(--surface)', borderRadius: '12px', border: `2px solid ${step === 3 ? 'var(--success)' : 'var(--glass-border)'}`, color: step === 3 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center' }}>
             3. Hoàn tất
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '40px' }}>
           {step === 1 && (
             <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="input-group">
                  <label>Tóm tắt yêu cầu (Tiêu đề)</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <FileText size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      className={errors.title ? 'error' : ''}
                      placeholder="Ví dụ: Cần tìm HDV am hiểu ẩm thực tại Hội An cho gia đình" 
                      style={{ paddingLeft: '40px', width: '100%', borderColor: errors.title ? 'var(--error)' : '' }} 
                      value={formData.title}
                      onChange={e => {
                         setFormData({...formData, title: e.target.value});
                         validateField('title', e.target.value);
                      }}
                    />
                  </div>
                  {errors.title && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.title}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="input-group">
                    <label>Ngân sách dự kiến (VND)</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--primary)' }}>₫</span>
                      <input 
                        type="number" 
                        className={errors.budget ? 'error' : ''}
                        placeholder="500,000" 
                        style={{ paddingLeft: '32px', width: '100%', borderColor: errors.budget ? 'var(--error)' : '' }} 
                        value={formData.budget}
                        onChange={e => {
                           setFormData({...formData, budget: e.target.value});
                           validateField('budget', e.target.value);
                        }}
                      />
                    </div>
                    {errors.budget && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.budget}</p>}
                  </div>
                  <div className="input-group">
                    <label>Ngày bắt đầu dự kiến</label>
                    <input 
                      type="date" 
                      className={errors.plannedDate ? 'error' : ''}
                      style={{ padding: '12px 16px', width: '100%', borderColor: errors.plannedDate ? 'var(--error)' : '' }} 
                      value={formData.plannedDate}
                      onChange={e => {
                        setFormData({...formData, plannedDate: e.target.value});
                        validateField('plannedDate', e.target.value);
                      }}
                    />
                    {errors.plannedDate && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.plannedDate}</p>}
                  </div>
                </div>

                 <div className="input-group">
                    <label>Số lượng người tham gia</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <Users size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input 
                        type="number" 
                        min="1"
                        className={errors.numberOfGuests ? 'error' : ''}
                        placeholder="Ví dụ: 2" 
                        style={{ paddingLeft: '40px', width: '100%', borderColor: errors.numberOfGuests ? 'var(--error)' : '' }} 
                        value={formData.numberOfGuests}
                        onChange={e => {
                           setFormData({...formData, numberOfGuests: e.target.value});
                           validateField('numberOfGuests', e.target.value);
                        }}
                      />
                    </div>
                    {errors.numberOfGuests && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.numberOfGuests}</p>}
                  </div>

                 <div className="input-group">
                    <label>Mô tả chi tiết nhu cầu</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <FileText size={18} style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-secondary)' }} />
                      <textarea 
                        rows={6} 
                        className={errors.description ? 'error' : ''}
                        placeholder="Hãy mô tả rõ bạn muốn đi những đâu, gu du lịch của gia đình bạn như thế nào..." 
                        style={{ paddingLeft: '40px', width: '100%', resize: 'none', borderColor: errors.description ? 'var(--error)' : '' }} 
                        value={formData.description}
                        onChange={e => {
                           setFormData({...formData, description: e.target.value});
                           validateField('description', e.target.value);
                        }}
                      />
                    </div>
                    {errors.description && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.description}</p>}
                </div>

                 <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                   <button 
                    className="btn-primary" 
                    type="button"
                    style={{ padding: '16px 48px' }}
                    onClick={() => {
                      if (validateStep1()) {
                        setStep(2);
                      } else {
                        alert("Vui lòng kiểm tra lại các thông tin lỗi.");
                      }
                    }}
                   >
                     Tiếp theo: Chọn địa điểm
                   </button>
                </div>
             </form>
           )}

           {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                 <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={18} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Vùng bạn muốn khám phá</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Chọn vị trí trung tâm của khu vực bạn muốn thuê hướng dẫn viên.</p>
                    <LocationPicker 
                        onLocationSelect={(lat, lng, addr) => {
                            setFormData({...formData, latitude: lat, longitude: lng, address: addr, locationName: addr});
                        }}
                    />
                    <p style={{ fontWeight: '600', marginTop: '16px', fontSize: '0.875rem' }}>Tên địa danh/Khu vực:</p>
                    <input 
                        type="text" 
                        placeholder="Ví dụ: Trung tâm Thành phố Đà Nẵng..." 
                        value={formData.locationName}
                        onChange={e => setFormData({...formData, locationName: e.target.value})}
                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', marginTop: '4px' }}
                    />
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                    <button className="btn-secondary" onClick={() => setStep(1)} style={{ padding: '12px 32px' }}>Quay lại</button>
                    <button 
                        className="btn-primary" 
                        style={{ padding: '12px 48px' }} 
                        onClick={handleSubmit}
                        disabled={submitting || !formData.latitude}
                    >
                        {submitting ? 'Đang đăng yêu cầu...' : 'Hoàn tất và Đăng yêu cầu'}
                    </button>
                 </div>
              </div>
           )}

           {step === 3 && (
               <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                     <CheckCircle2 size={48} />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '16px' }}>Đăng yêu cầu thành công!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Yêu cầu của bạn đã được gửi đến cộng đồng hướng dẫn viên. Hãy chờ đợi phản hồi từ những người phù hợp nhất.</p>
                  <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                     <button 
                         onClick={() => navigate('/requests')}
                         style={{ padding: '16px 32px', fontSize: '1.125rem', fontWeight: '700', background: '#ecfdf5', color: '#059669', border: '2px solid #a7f3d0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                     >
                         Xem danh sách yêu cầu
                     </button>
                      <button 
                          onClick={() => navigate('/')}
                          style={{ padding: '16px 32px', fontSize: '1.125rem', fontWeight: '700', background: '#059669', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)' }}
                      >
                         Trở về trang chủ
                     </button>
                  </div>
               </div>
           )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateTourRequestPage;
