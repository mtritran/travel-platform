import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Image as ImageIcon, 
  MapPin, CheckCircle2, Navigation, Calendar, Clock, Clock3
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
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
      depositPercentage: '30',
      bookingCutoffMinutes: '60'
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
            const cutoff = Number(formData.bookingCutoffMinutes) || 60;
            const cutoffTime = new Date(selectedDateTime.getTime() - (cutoff * 60000));
            
            if (cutoffTime < now) {
                error = `Thời gian quá gần (cần chừa ít nhất ${cutoff} phút để khách chuẩn bị/đặt)`;
            }
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

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.latitude) {
      newErrors.location = 'Vui lòng chọn địa điểm tham quan trên bản đồ';
      isValid = false;
    }
    if (!formData.meetingLatitude) {
      newErrors.meetingLocation = 'Vui lòng chọn điểm tập trung trên bản đồ';
      isValid = false;
    }
    if (!formData.locationName.trim()) {
      newErrors.locationName = 'Vui lòng nhập tên địa danh';
      isValid = false;
    }
    if (!formData.meetingLocationName.trim()) {
      newErrors.meetingLocationName = 'Vui lòng nhập tên điểm hẹn';
      isValid = false;
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
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
        depositPercentage: 30,
        bookingCutoffMinutes: Number(formData.bookingCutoffMinutes)
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
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', background: 'var(--surface)', padding: '8px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
           <div style={{ flex: 1, padding: '16px', background: step === 1 ? 'var(--primary)' : 'transparent', borderRadius: '16px', color: step === 1 ? 'white' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center', transition: 'all 0.3s ease' }}>
             1. Thông tin cơ bản
           </div>
           <div style={{ flex: 1, padding: '16px', background: step === 2 ? 'var(--primary)' : 'transparent', borderRadius: '16px', color: step === 2 ? 'white' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center', transition: 'all 0.3s ease' }}>
             2. Vị trí trên bản đồ
           </div>
           <div style={{ flex: 1, padding: '16px', background: step === 3 ? 'var(--success)' : 'transparent', borderRadius: '16px', color: step === 3 ? 'white' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center', transition: 'all 0.3s ease' }}>
             3. Hoàn tất
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '48px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' }}>
           {step === 1 && (
             <form style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div className="input-group">
                    <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Tiêu đề Tour</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <FileText size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.7 }} />
                      <input 
                        type="text" 
                        className={errors.title ? 'error' : ''}
                        placeholder="Ví dụ: Khám phá Phố cổ Hội An về đêm" 
                        style={{ padding: '16px 16px 16px 48px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }} 
                        value={formData.title}
                        onChange={e => {
                           setFormData({...formData, title: e.target.value});
                           validateField('title', e.target.value);
                        }}
                      />
                    </div>
                    {errors.title && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px', fontWeight: 600 }}>{errors.title}</p>}
                  </div>
                  <div className="input-group">
                    <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Giá tour (VND)</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--primary)' }}>₫</span>
                      <input 
                        type="number" 
                        className={errors.price ? 'error' : ''}
                        placeholder="500,000" 
                        style={{ padding: '16px 16px 16px 40px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1.1rem', fontWeight: 700 }} 
                        value={formData.price}
                        onChange={e => {
                           setFormData({...formData, price: e.target.value});
                           validateField('price', e.target.value);
                        }}
                      />
                    </div>
                    {errors.price && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px', fontWeight: 600 }}>{errors.price}</p>}
                  </div>
                </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div className="input-group">
                    <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Ngày diễn ra Tour</label>
                    <div className="input-shell tour-request-picker-shell">
                      <Calendar size={18} />
                      <DatePicker
                        selected={formData.startDate ? parse(formData.startDate, 'yyyy-MM-dd', new Date()) : null}
                        onChange={(date: Date | null) => {
                          const val = date ? format(date, 'yyyy-MM-dd') : '';
                          setFormData({ ...formData, startDate: val });
                          validateField('startDate', val);
                        }}
                        dateFormat="dd-MM-yyyy"
                        minDate={new Date()}
                        placeholderText="Chọn ngày"
                        className={`tour-request-picker-input ${errors.startDate ? 'error' : ''}`}
                      />
                    </div>
                    {errors.startDate && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px' }}>{errors.startDate}</p>}
                  </div>
                  <div className="input-group">
                    <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Số khách tối đa</label>
                    <input 
                      type="number" 
                      min="1"
                      className={errors.maxGuests ? 'error' : ''}
                      placeholder="8" 
                      style={{ padding: '16px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }} 
                      value={formData.maxGuests}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({...formData, maxGuests: val});
                        validateField('maxGuests', val);
                      }}
                    />
                  </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div className="input-group">
                    <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Giờ bắt đầu</label>
                    <div className="input-shell tour-request-picker-shell">
                      <Clock3 size={18} />
                      <DatePicker
                        selected={formData.startTime ? parse(formData.startTime, 'HH:mm', new Date()) : null}
                        onChange={(date: Date | null) => {
                          const val = date ? format(date, 'HH:mm') : '';
                          setFormData({ ...formData, startTime: val });
                          validateField('startTime', val);
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Giờ"
                        dateFormat="HH:mm"
                        className={`tour-request-picker-input ${errors.startTime ? 'error' : ''}`}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Giờ kết thúc</label>
                    <div className="input-shell tour-request-picker-shell">
                      <Clock size={18} />
                      <DatePicker
                        selected={formData.endTime ? parse(formData.endTime, 'HH:mm', new Date()) : null}
                        onChange={(date: Date | null) => {
                          const val = date ? format(date, 'HH:mm') : '';
                          setFormData({ ...formData, endTime: val });
                          validateField('endTime', val);
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Giờ"
                        dateFormat="HH:mm"
                        className={`tour-request-picker-input ${errors.endTime ? 'error' : ''}`}
                      />
                    </div>
                  </div>
                 </div>
 
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div className="input-group">
                    <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Thời gian chuẩn bị tối thiểu (phút)</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="60" 
                      style={{ padding: '16px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }} 
                      value={formData.bookingCutoffMinutes}
                      onChange={e => {
                        setFormData({...formData, bookingCutoffMinutes: e.target.value});
                      }}
                    />
                    <p style={{ color: 'var(--text-soft)', fontSize: '0.8rem', marginTop: '6px' }}>Hệ thống sẽ đóng đặt chỗ trước giờ khởi hành X phút.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                    <div style={{ padding: '16px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '16px', border: '1px dashed var(--primary)', width: '100%' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                        Khuyên dùng: 60 - 120 phút để đảm bảo bạn có đủ thời gian di chuyển.
                      </p>
                    </div>
                  </div>
                 </div>

                 <div className="input-group">
                    <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Mô tả chuyến đi</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <FileText size={20} style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--primary)', opacity: 0.7 }} />
                      <textarea 
                        rows={6} 
                        className={errors.description ? 'error' : ''}
                        placeholder="Bạn sẽ dẫn khách đi những đâu? Những điểm thú vị của tour này là gì?" 
                        style={{ padding: '16px 16px 16px 48px', width: '100%', resize: 'none', borderRadius: '20px', border: '2px solid var(--glass-border)', fontSize: '1rem', lineHeight: 1.6 }} 
                        value={formData.description}
                        onChange={e => {
                           setFormData({...formData, description: e.target.value});
                           validateField('description', e.target.value);
                        }}
                      />
                    </div>
                </div>

                <div className="input-group">
                    <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Hình ảnh minh họa (URL)</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <ImageIcon size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.7 }} />
                      <input 
                        type="text" 
                        placeholder="Dán link ảnh tại đây..." 
                        style={{ padding: '16px 16px 16px 48px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }} 
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                      />
                    </div>
                    {formData.imageUrl && (
                        <div style={{ marginTop: '20px', width: '100%', height: '240px', borderRadius: '20px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                            <img src={formData.imageUrl} alt="Tour Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    )}
                </div>

                 <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                   <button 
                    className="btn-primary" 
                    type="button"
                    style={{ padding: '18px 60px', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}
                    onClick={() => {
                      if (validateStep1()) setStep(2);
                      else alert("Vui lòng hoàn thiện các trường còn thiếu.");
                    }}
                   >
                     Tiếp tục: Chọn bản đồ ➜
                   </button>
                </div>
             </form>
           )}

           {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                 <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', border: '2px solid var(--primary-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={22} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>1. Địa điểm tham quan chính</h3>
                    </div>
                    <LocationPicker 
                        onLocationSelect={(lat, lng, addr) => {
                            setFormData({...formData, latitude: lat, longitude: lng, address: addr, locationName: addr});
                            setErrors(prev => ({ ...prev, location: '' }));
                        }}
                    />
                    <div style={{ marginTop: '20px' }}>
                      <p style={{ fontWeight: '700', marginBottom: '8px' }}>Tên địa danh hiển thị:</p>
                      <input 
                          type="text" 
                          placeholder="Ví dụ: Phố cổ Hội An..." 
                          value={formData.locationName}
                          onChange={e => setFormData({...formData, locationName: e.target.value})}
                          style={{ padding: '16px', borderRadius: '16px', border: '2px solid var(--glass-border)', width: '100%', fontSize: '1rem' }}
                      />
                    </div>
                 </div>

                 <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', border: '2px solid var(--success-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Navigation size={22} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>2. Điểm tập trung gặp khách</h3>
                    </div>
                    <LocationPicker 
                        onLocationSelect={(lat, lng, addr) => {
                            setFormData({...formData, meetingLatitude: lat, meetingLongitude: lng, meetingAddress: addr, meetingLocationName: addr});
                            setErrors(prev => ({ ...prev, meetingLocation: '' }));
                        }}
                    />
                    <div style={{ marginTop: '20px' }}>
                      <p style={{ fontWeight: '700', marginBottom: '8px' }}>Tên điểm hẹn (ví dụ: Sảnh khách sạn ABC):</p>
                      <input 
                          type="text" 
                          placeholder="Ví dụ: Cổng chính SVĐ Mỹ Đình..." 
                          value={formData.meetingLocationName}
                          onChange={e => setFormData({...formData, meetingLocationName: e.target.value})}
                          style={{ padding: '16px', borderRadius: '16px', border: '2px solid var(--glass-border)', width: '100%', fontSize: '1rem' }}
                      />
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
                    <button className="btn-secondary" onClick={() => setStep(1)} style={{ padding: '16px 40px', borderRadius: '16px', fontWeight: 700 }}>← Quay lại</button>
                     <button 
                        className="btn-primary" 
                        style={{ padding: '18px 60px', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }} 
                        onClick={(e) => {
                          if (validateStep2()) handleSubmit(e as any);
                          else alert("Vui lòng hoàn thiện các thông tin địa điểm.");
                        }}
                        disabled={submitting}
                    >
                        {submitting ? 'Đang khởi tạo Tour...' : 'Hoàn tất & Đăng Tour'}
                    </button>
                 </div>
              </div>
           )}

           {step === 3 && (
               <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.2)' }}>
                     <CheckCircle2 size={60} />
                  </div>
                  <h3 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', background: 'linear-gradient(to right, #059669, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tuyệt vời!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}>Tour của bạn đã được đăng thành công. Chúng tôi sẽ phê duyệt trong giây lát để hiển thị công khai trên ứng dụng.</p>
                  <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                     <button 
                         onClick={() => navigate('/')}
                         style={{ padding: '20px 40px', fontSize: '1.1rem', fontWeight: '800', background: 'white', color: 'var(--text-primary)', border: '2px solid var(--glass-border)', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
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
                                depositPercentage: '30',
                                bookingCutoffMinutes: '60'
                            }); 
                            setErrors({});
                          }}
                          style={{ padding: '20px 48px', fontSize: '1.1rem', fontWeight: '800', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}
                      >
                         Đăng tour khác
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
