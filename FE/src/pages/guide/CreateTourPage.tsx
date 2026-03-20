import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Users, FileText, Image as ImageIcon, 
  MapPin, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, 
  Trash2, Plus, Navigation 
} from 'lucide-react';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import LocationPicker from '../../components/common/LocationPicker';

const CreateTourPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    const startHour = now.getHours() + 2;
    const endHour = startHour + 4;
    
    // Format to HH:mm
    const formatTime = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;
    
    return {
      title: '',
    description: '',
    price: '',
    imageUrl: '',
    locationName: '',
    address: '',
    latitude: 0,
    longitude: 0,
    meetingLocationName: '',
    meetingAddress: '',
    meetingLatitude: 0,
    meetingLongitude: 0,
    startDate: now.toISOString().split('T')[0],
      endDate: '',
      startTime: formatTime(startHour),
      endTime: formatTime(endHour),
      maxGuests: '4',
      depositPercentage: '30'
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any) => {
    let error = '';
    const now = new Date();

    switch (name) {
      case 'title':
        if (!value.trim()) error = 'Tiêu đề không được để trống';
        break;
      case 'price':
        if (!value || Number(value) <= 0) error = 'Giá tour phải lớn hơn 0';
        break;
      case 'startDate':
        if (!value) {
            error = 'Vui lòng chọn ngày diễn ra tour';
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(value);
            selectedDate.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) error = 'Ngày diễn ra không được ở trong quá khứ';
        }
        break;
      case 'startTime':
        if (!value) {
            error = 'Vui lòng chọn giờ bắt đầu';
        } else if (formData.startDate) {
            const selectedDateTime = new Date(formData.startDate + 'T' + value);
            if (selectedDateTime < now) error = 'Giờ bắt đầu phải sau thời gian hiện tại';
        }
        break;
      case 'endTime':
        if (!value) {
            error = 'Vui lòng chọn giờ kết thúc';
        } else if (formData.startTime && value <= formData.startTime) {
            error = 'Giờ kết thúc phải sau giờ bắt đầu';
        }
        break;
      case 'maxGuests':
        if (!value || value < 1) error = 'Số khách tối đa ít nhất là 1';
        break;
      case 'description':
        if (!value.trim()) error = 'Vui lòng nhập mô tả chuyến đi';
        break;
      case 'imageUrl':
        if (!value.trim()) error = 'Vui lòng nhập URL hình ảnh';
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ['title', 'price', 'startDate', 'startTime', 'endTime', 'maxGuests', 'description', 'imageUrl'];
    
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
    if (!formData.latitude || !formData.meetingLatitude) {
      alert("Vui lòng chọn cả điểm tham quan và điểm tập trung trên bản đồ.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create the destination location
      const locResponse = await api.post(ENDPOINTS.LOCATION.CREATE, {
        name: formData.locationName || formData.title,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        imageUrl: formData.imageUrl
      });
      const locationId = locResponse.data.result.id;

      // 2. Create the meeting location
      const meetLocResponse = await api.post(ENDPOINTS.LOCATION.CREATE, {
        name: formData.meetingLocationName || "Điểm tập trung",
        address: formData.meetingAddress,
        latitude: formData.meetingLatitude,
        longitude: formData.meetingLongitude,
        imageUrl: formData.imageUrl
      });
      const meetingLocationId = meetLocResponse.data.result.id;

      // 3. Create the tour
      await api.post(ENDPOINTS.TOUR.CREATE, {
        locationId,
        meetingLocationId,
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        imageUrl: formData.imageUrl,
        startDate: formData.startDate,
        endDate: formData.startDate, // Single day tour
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxGuests: Number(formData.maxGuests),
        depositPercentage: Number(formData.depositPercentage)
      });

      setStep(3); // Success step
    } catch (err: any) {
      console.error("Failed to create tour:", err);
      alert(err.response?.data?.message || "Lỗi khi đăng tour.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '40px auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Đăng ký Tour mới
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Chia sẻ những trải nghiệm thú vị của bạn với du khách.</p>
        </div>

        {/* Form Steps */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '40px' }}>
           <div style={{ flex: 1, padding: '12px', background: step === 1 ? 'var(--primary-light)' : 'var(--surface)', borderRadius: '12px', border: `2px solid ${step === 1 ? 'var(--primary)' : 'var(--glass-border)'}`, color: step === 1 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center' }}>
             1. Thông tin cơ bản
           </div>
           <div style={{ flex: 1, padding: '12px', background: step === 2 ? 'var(--primary-light)' : 'var(--surface)', borderRadius: '12px', border: `2px solid ${step === 2 ? 'var(--primary)' : 'var(--glass-border)'}`, color: step === 2 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center' }}>
             2. Chọn vị trí trên Map
           </div>
           <div style={{ flex: 1, padding: '12px', background: step === 3 ? 'var(--success-light)' : 'var(--surface)', borderRadius: '12px', border: `2px solid ${step === 3 ? 'var(--success)' : 'var(--glass-border)'}`, color: step === 3 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center' }}>
             3. Hoàn tất
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '40px' }}>
           {step === 1 && (
             <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="input-group">
                    <label>Tiêu đề Tour</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <FileText size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input 
                        type="text" 
                        className={errors.title ? 'error' : ''}
                        placeholder="Ví dụ: Khám phá Phố cổ Hội An về đêm" 
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
                  <div className="input-group">
                    <label>Giá tour (VND)</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--primary)' }}>₫</span>
                      <input 
                        type="number" 
                        className={errors.price ? 'error' : ''}
                        placeholder="500,000" 
                        style={{ paddingLeft: '32px', width: '100%', borderColor: errors.price ? 'var(--error)' : '' }} 
                        value={formData.price}
                        onChange={e => {
                           setFormData({...formData, price: e.target.value});
                           validateField('price', e.target.value);
                        }}
                      />
                    </div>
                    {errors.price && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.price}</p>}
                  </div>
                </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="input-group">
                    <label>Ngày diễn ra Tour</label>
                    <input 
                      type="date" 
                      className={errors.startDate ? 'error' : ''}
                      style={{ padding: '12px 16px', width: '100%', borderColor: errors.startDate ? 'var(--error)' : '' }} 
                      value={formData.startDate}
                      onChange={e => {
                        setFormData({...formData, startDate: e.target.value});
                        validateField('startDate', e.target.value);
                      }}
                    />
                    {errors.startDate && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.startDate}</p>}
                  </div>
                  <div className="input-group">
                    <label>Số khách tối đa nhận</label>
                    <input 
                      type="number" 
                      min="1"
                      className={errors.maxGuests ? 'error' : ''}
                      placeholder="Ví dụ: 8" 
                      style={{ padding: '12px 16px', width: '100%', borderColor: errors.maxGuests ? 'var(--error)' : '' }} 
                      value={formData.maxGuests}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({...formData, maxGuests: val});
                        validateField('maxGuests', val);
                      }}
                    />
                    {errors.maxGuests && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.maxGuests}</p>}
                  </div>
                  <div className="input-group">
                    <label>% Tiền cọc trước</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-secondary)' }}>%</span>
                        <input 
                            type="number" 
                            min="0"
                            max="100"
                            placeholder="Ví dụ: 30" 
                            style={{ padding: '12px 32px 12px 16px', width: '100%' }} 
                            value={formData.depositPercentage}
                            onChange={e => setFormData({...formData, depositPercentage: e.target.value})}
                        />
                    </div>
                  </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="input-group">
                    <label>Giờ bắt đầu</label>
                    <input 
                      type="time" 
                      className={errors.startTime ? 'error' : ''}
                      style={{ padding: '12px 16px', width: '100%', borderColor: errors.startTime ? 'var(--error)' : '' }} 
                      value={formData.startTime}
                      onChange={e => {
                       setFormData({...formData, startTime: e.target.value});
                       validateField('startTime', e.target.value);
                      }}
                    />
                    {errors.startTime && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.startTime}</p>}
                  </div>
                  <div className="input-group">
                    <label>Giờ kết thúc</label>
                    <input 
                      type="time" 
                      className={errors.endTime ? 'error' : ''}
                      style={{ padding: '12px 16px', width: '100%', borderColor: errors.endTime ? 'var(--error)' : '' }} 
                      value={formData.endTime}
                      onChange={e => {
                        setFormData({...formData, endTime: e.target.value});
                        validateField('endTime', e.target.value);
                      }}
                    />
                    {errors.endTime && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.endTime}</p>}
                  </div>
                 </div>

                 <div className="input-group">
                    <label>Mô tả chuyến đi</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <FileText size={18} style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-secondary)' }} />
                      <textarea 
                        rows={5} 
                        className={errors.description ? 'error' : ''}
                        placeholder="Bạn sẽ dẫn khách đi những đâu? Những điểm thú vị của tour này là gì?" 
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

                <div className="input-group">
                    <label>URL Hình ảnh Tour</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <ImageIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                      <input 
                        type="text" 
                        className={errors.imageUrl ? 'error' : ''}
                        placeholder="https://images.unsplash.com/..." 
                        style={{ paddingLeft: '40px', width: '100%', borderColor: errors.imageUrl ? 'var(--error)' : '' }} 
                        value={formData.imageUrl}
                        onChange={e => {
                           setFormData({...formData, imageUrl: e.target.value});
                           validateField('imageUrl', e.target.value);
                        }}
                      />
                    </div>
                    {errors.imageUrl && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.imageUrl}</p>}
                    {formData.imageUrl && (
                        <div style={{ marginTop: '12px', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            <img src={formData.imageUrl} alt="Tour Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    )}
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
                    disabled={Object.values(errors).some(e => e !== '')}
                   >
                     Tiếp theo: Chọn vị trí
                   </button>
                </div>
             </form>
           )}

           {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                 {/* Section 1: Tour Destination */}
                 <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={18} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>1. Địa điểm tham quan chính</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Chọn vị trí du khách sẽ đến tham quan trong tour này.</p>
                    <LocationPicker 
                        onLocationSelect={(lat, lng, addr) => {
                            setFormData({...formData, latitude: lat, longitude: lng, address: addr, locationName: addr});
                        }}
                    />
                    <p style={{ fontWeight: '600', marginTop: '16px', fontSize: '0.875rem' }}>Tên địa danh (rút gọn nếu cần):</p>
                    <input 
                        type="text" 
                        placeholder="Ví dụ: Phố cổ Hội An..." 
                        value={formData.locationName}
                        onChange={e => setFormData({...formData, locationName: e.target.value})}
                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', marginTop: '4px' }}
                    />
                 </div>

                 {/* Section 2: Meeting Point */}
                 <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Navigation size={18} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>2. Điểm tập trung</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Chọn vị trí bạn sẽ gặp du khách để bắt đầu hành trình.</p>
                    <LocationPicker 
                        onLocationSelect={(lat, lng, addr) => {
                            setFormData({...formData, meetingLatitude: lat, meetingLongitude: lng, meetingAddress: addr, meetingLocationName: addr});
                        }}
                    />
                    <p style={{ fontWeight: '600', marginTop: '16px', fontSize: '0.875rem' }}>Tên điểm tập trung (ví dụ: Sảnh khách sạn, Cổng chính...):</p>
                    <input 
                        type="text" 
                        placeholder="Ví dụ: Cổng chính SVĐ Mỹ Đình..." 
                        value={formData.meetingLocationName}
                        onChange={e => setFormData({...formData, meetingLocationName: e.target.value})}
                        style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', marginTop: '4px' }}
                    />
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                    <button className="btn-secondary" onClick={() => setStep(1)} style={{ padding: '12px 32px' }}>Quay lại</button>
                    <button 
                        className="btn-primary" 
                        style={{ padding: '12px 48px' }} 
                        onClick={handleSubmit}
                        disabled={submitting || !formData.latitude || !formData.meetingLatitude}
                    >
                        {submitting ? 'Đang đăng tour...' : 'Hoàn tất và Đăng Tour'}
                    </button>
                 </div>
              </div>
           )}

           {step === 3 && (
               <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                     <CheckCircle2 size={48} />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '16px' }}>Đăng Tour thành công!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Tour của bạn hiện đã được hiển thị trên TravelX và du khách có thể đặt tour ngay từ bây giờ.</p>
                  <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                     <button 
                         onClick={() => navigate('/')}
                         style={{ padding: '16px 32px', fontSize: '1.125rem', fontWeight: '700', background: '#ecfdf5', color: '#059669', border: '2px solid #a7f3d0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                     >
                         Về trang chủ
                     </button>
                      <button 
                          onClick={() => { 
                            setStep(1); 
                            const now = new Date();
                            setFormData({ 
                                title: '', description: '', price: '', imageUrl: '', 
                                locationName: '', address: '', latitude: 0, longitude: 0, 
                                meetingLocationName: '', meetingAddress: '', meetingLatitude: 0, meetingLongitude: 0,
                                startDate: now.toISOString().split('T')[0], 
                                endDate: '', 
                                startTime: '08:00', endTime: '14:00', 
                                maxGuests: '4',
                                depositPercentage: '30'
                            }); 
                            setErrors({});
                          }}
                          style={{ padding: '16px 32px', fontSize: '1.125rem', fontWeight: '700', background: '#059669', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)' }}
                      >
                         Đăng tiếp tour khác
                     </button>
                  </div>
               </div>
           )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateTourPage;
