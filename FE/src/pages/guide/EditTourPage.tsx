import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, Image as ImageIcon, 
  MapPin, CheckCircle2, Navigation 
} from 'lucide-react';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import LocationPicker from '../../components/common/LocationPicker';
import type { Tour, ApiResponse } from '../../types';

const EditTourPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
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
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '12:00',
    maxGuests: '4',
    depositPercentage: '30'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTour = async () => {
      if (!id) return;
      try {
        const response = await api.get<ApiResponse<Tour>>(ENDPOINTS.TOUR.GET_BY_ID(id));
        const tour = response.data.result;
        setFormData({
          title: tour.title,
          description: tour.description,
          price: String(tour.price),
          imageUrl: tour.imageUrl,
          locationName: tour.locationName,
          address: tour.locationAddress || '',
          latitude: tour.latitude || 0,
          longitude: tour.longitude || 0,
          meetingLocationName: tour.meetingLocationName || '',
          meetingAddress: tour.meetingLocationAddress || '',
          meetingLatitude: tour.meetingLatitude || 0,
          meetingLongitude: tour.meetingLongitude || 0,
          startDate: tour.startDate || '',
          endDate: tour.endDate || '',
          startTime: tour.startTime || '08:00',
          endTime: tour.endTime || '12:00',
          maxGuests: String(tour.maxGuests || 1),
          depositPercentage: String(tour.depositPercentage || 30)
        });
      } catch (err) {
        console.error("Lỗi khi tải thông tin tour:", err);
        alert("Không thể tải thông tin tour.");
        navigate('/guide/tours');
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [id, navigate]);

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
    if (!id) return;
    if (!formData.latitude || !formData.meetingLatitude) {
      alert("Vui lòng chọn cả điểm tham quan và điểm tập trung trên bản đồ.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create/Update locations (We create new ones for simplicity as shown in current repo logic)
      const locResponse = await api.post(ENDPOINTS.LOCATION.CREATE, {
        name: formData.locationName,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        imageUrl: formData.imageUrl
      });
      const locationId = locResponse.data.result.id;

      const meetLocResponse = await api.post(ENDPOINTS.LOCATION.CREATE, {
        name: formData.meetingLocationName || "Điểm tập trung",
        address: formData.meetingAddress,
        latitude: formData.meetingLatitude,
        longitude: formData.meetingLongitude,
        imageUrl: formData.imageUrl
      });
      const meetingLocationId = meetLocResponse.data.result.id;

      // 2. Update the tour
      await api.put(ENDPOINTS.TOUR.UPDATE(id), {
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
        depositPercentage: 30
      });

      setStep(3); // Success step
    } catch (err: any) {
      console.error("Failed to update tour:", err);
      alert(err.response?.data?.message || "Lỗi khi cập nhật tour.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: '100px 0' }}>Đang tải thông tin...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '40px auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Chỉnh sửa Tour
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Cập nhật thông tin hoặc gia hạn thời gian cho tour của bạn.</p>
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
                  <input 
                    type="date" 
                    className={errors.startDate ? 'error' : ''}
                    style={{ padding: '16px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }} 
                    value={formData.startDate}
                    onChange={e => {
                      setFormData({...formData, startDate: e.target.value});
                      validateField('startDate', e.target.value);
                    }}
                  />
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
                  <input 
                    type="time" 
                    className={errors.startTime ? 'error' : ''}
                    style={{ padding: '16px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }} 
                    value={formData.startTime}
                    onChange={e => {
                     setFormData({...formData, startTime: e.target.value});
                     validateField('startTime', e.target.value);
                    }}
                  />
                </div>
                <div className="input-group">
                  <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Giờ kết thúc</label>
                  <input 
                    type="time" 
                    className={errors.endTime ? 'error' : ''}
                    style={{ padding: '16px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }} 
                    value={formData.endTime}
                    onChange={e => {
                      setFormData({...formData, endTime: e.target.value});
                      validateField('endTime', e.target.value);
                    }}
                  />
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
                  initialLocation={formData.latitude ? { lat: formData.latitude, lng: formData.longitude } : undefined}
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
                  initialLocation={formData.meetingLatitude ? { lat: formData.meetingLatitude, lng: formData.meetingLongitude } : undefined}
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
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Đang cập nhật...' : 'Lưu & Cập nhật Tour'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle2 size={60} />
              </div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '16px', background: 'linear-gradient(to right, #059669, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Thành công!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}>Thông tin tour của bạn đã được cập nhật thành công và đang hiển thị trên TravelX.</p>
              <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                <button 
                  onClick={() => navigate('/guide/tours')}
                  style={{ padding: '20px 48px', fontSize: '1.1rem', fontWeight: '800', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}
                >
                  Quản lý tour của tôi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditTourPage;
