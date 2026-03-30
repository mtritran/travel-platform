import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, FileText, MapPin, Users, Navigation } from 'lucide-react';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import LocationPicker from '../../components/common/LocationPicker';
import type { TourRequest } from '../../types';

type EditableTourRequest = TourRequest & {
  latitude?: number;
  longitude?: number;
};

type RequestFormData = {
  title: string;
  description: string;
  budget: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  plannedDate: string;
  numberOfGuests: string;
  expiryHours: string;
  meetingLocationName: string;
  meetingLatitude: number;
  meetingLongitude: number;
  startTime: string;
  endTime: string;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getInitialFormData = (editMode?: boolean, existingReq?: EditableTourRequest): RequestFormData => {
  if (editMode && existingReq) {
    return {
      title: existingReq.title,
      description: existingReq.description,
      budget: existingReq.budget.toString(),
      locationName: existingReq.locationName || existingReq.customLocationName || '',
      address: existingReq.locationName || existingReq.customLocationName || '',
      latitude: existingReq.latitude || 0,
      longitude: existingReq.longitude || 0,
      plannedDate: new Date(existingReq.plannedDate).toISOString().split('T')[0],
      numberOfGuests: existingReq.numberOfGuests.toString(),
      expiryHours: '24',
      meetingLocationName: existingReq.meetingLocationName || '',
      meetingLatitude: existingReq.meetingLatitude || 0,
      meetingLongitude: existingReq.meetingLongitude || 0,
      startTime: existingReq.startTime || '08:00',
      endTime: existingReq.endTime || '17:00'
    };
  }

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
    numberOfGuests: '1',
    expiryHours: '24',
    meetingLocationName: '',
    meetingLatitude: 0,
    meetingLongitude: 0,
    startTime: '08:00',
    endTime: '17:00'
  };
};

const CreateTourRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { editMode?: boolean; request?: EditableTourRequest } | null;
  const editMode = locationState?.editMode;
  const existingReq = locationState?.request;

  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RequestFormData>(() => getInitialFormData(editMode, existingReq));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: keyof RequestFormData, value: string | number) => {
    let error = '';

    switch (name) {
      case 'title':
        if (!String(value).trim()) error = 'Tiêu đề yêu cầu không được để trống';
        break;
      case 'budget':
        if (!value || Number(value) <= 0) error = 'Ngân sách phải lớn hơn 0';
        break;
      case 'plannedDate': {
        if (!value) {
          error = 'Vui lòng chọn ngày dự kiến';
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const selectedDate = new Date(String(value));
          selectedDate.setHours(0, 0, 0, 0);
          if (selectedDate < today) error = 'Ngày dự kiến không được ở trong quá khứ';
        }
        break;
      }
      case 'numberOfGuests':
        if (!value || Number(value) < 1) error = 'Số lượng khách ít nhất là 1';
        break;
      case 'startTime':
        if (!value) {
          error = 'Vui lòng chọn giờ bắt đầu';
        } else if (formData.plannedDate) {
          const selectedDateTime = new Date(formData.plannedDate + 'T' + value);
          if (selectedDateTime < new Date()) error = 'Giờ bắt đầu phải sau hiện tại';
        }
        break;
      case 'endTime':
        if (!value) {
          error = 'Vui lòng chọn giờ kết thúc';
        } else if (formData.startTime && value <= formData.startTime) {
          error = 'Giờ kết thúc phải sau giờ bắt đầu';
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
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

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const validateStep1 = () => {
    const fields: (keyof RequestFormData)[] = [
      'title',
      'budget',
      'plannedDate',
      'startTime',
      'endTime',
      'numberOfGuests',
      'description'
    ];

    const nextErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        nextErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(nextErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      alert('Vui lòng hoàn thiện các thông tin địa điểm.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        budget: Number(formData.budget),
        plannedDate: formData.plannedDate,
        numberOfGuests: Number(formData.numberOfGuests),
        expiryHours: Number(formData.expiryHours),
        customLocationName: formData.locationName,
        latitude: formData.latitude,
        longitude: formData.longitude,
        meetingLocationName: formData.meetingLocationName,
        meetingLatitude: formData.meetingLatitude,
        meetingLongitude: formData.meetingLongitude,
        startTime: formData.startTime,
        endTime: formData.endTime,
        depositPercentage: 30,
      };

      if (editMode && existingReq) {
        await api.put(ENDPOINTS.TOUR_REQUEST.UPDATE(existingReq.id), payload);
      } else {
        await api.post(ENDPOINTS.TOUR_REQUEST.CREATE, payload);
      }

      setStep(3);
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.response?.data?.message || 'Lỗi khi lưu yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '40px auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {editMode ? 'Chỉnh sửa yêu cầu chuyến đi' : 'Đăng yêu cầu tìm hướng dẫn viên'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            {editMode
              ? 'Cập nhật lại thông tin để tìm được guide phù hợp hơn.'
              : 'Mô tả chuyến đi bạn mong muốn để các hướng dẫn viên địa phương chủ động đề xuất.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', background: 'var(--surface)', padding: '8px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <div style={{ flex: 1, padding: '16px', background: step === 1 ? 'var(--primary)' : 'transparent', borderRadius: '16px', color: step === 1 ? 'white' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center', transition: 'all 0.3s ease' }}>
            1. Nhu cầu chuyến đi
          </div>
          <div style={{ flex: 1, padding: '16px', background: step === 2 ? 'var(--primary)' : 'transparent', borderRadius: '16px', color: step === 2 ? 'white' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center', transition: 'all 0.3s ease' }}>
            2. Địa điểm mong muốn
          </div>
          <div style={{ flex: 1, padding: '16px', background: step === 3 ? 'var(--success)' : 'transparent', borderRadius: '16px', color: step === 3 ? 'white' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center', transition: 'all 0.3s ease' }}>
            3. Hoàn tất
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '48px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' }}>
          {step === 1 && (
            <form style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="input-group">
                <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Tóm tắt yêu cầu</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <FileText size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.7 }} />
                  <input
                    type="text"
                    className={errors.title ? 'error' : ''}
                    placeholder="Ví dụ: Cần tìm guide am hiểu ẩm thực Hội An cho gia đình"
                    style={{ padding: '16px 16px 16px 48px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }}
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      validateField('title', e.target.value);
                    }}
                  />
                </div>
                {errors.title && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px', fontWeight: 600 }}>{errors.title}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="input-group">
                  <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Ngân sách dự kiến (VND)</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--primary)' }}>₫</span>
                    <input
                      type="number"
                      className={errors.budget ? 'error' : ''}
                      placeholder="500000"
                      style={{ padding: '16px 16px 16px 40px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1.1rem', fontWeight: 700 }}
                      value={formData.budget}
                      onChange={(e) => {
                        setFormData({ ...formData, budget: e.target.value });
                        validateField('budget', e.target.value);
                      }}
                    />
                  </div>
                  {errors.budget && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px', fontWeight: 600 }}>{errors.budget}</p>}
                </div>

                <div className="input-group">
                  <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Số người tham gia</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Users size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.7 }} />
                    <input
                      type="number"
                      min="1"
                      className={errors.numberOfGuests ? 'error' : ''}
                      style={{ padding: '16px 16px 16px 48px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }}
                      value={formData.numberOfGuests}
                      onChange={(e) => {
                        setFormData({ ...formData, numberOfGuests: e.target.value });
                        validateField('numberOfGuests', e.target.value);
                      }}
                    />
                  </div>
                  {errors.numberOfGuests && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px', fontWeight: 600 }}>{errors.numberOfGuests}</p>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <div className="input-group">
                  <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Ngày dự kiến</label>
                  <input
                    type="date"
                    className={errors.plannedDate ? 'error' : ''}
                    style={{ padding: '16px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem' }}
                    value={formData.plannedDate}
                    onChange={(e) => {
                      setFormData({ ...formData, plannedDate: e.target.value });
                      validateField('plannedDate', e.target.value);
                    }}
                  />
                  {errors.plannedDate && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px' }}>{errors.plannedDate}</p>}
                </div>

                <div className="input-group">
                  <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Giờ bắt đầu</label>
                  <input
                    type="time"
                    className={errors.startTime ? 'error' : ''}
                    style={{ padding: '16px', width: '100%', borderRadius: '16px', border: `2px solid ${errors.startTime ? 'var(--error)' : 'var(--glass-border)'}`, fontSize: '1rem' }}
                    value={formData.startTime}
                    onChange={(e) => {
                      setFormData({ ...formData, startTime: e.target.value });
                      validateField('startTime', e.target.value);
                    }}
                  />
                  {errors.startTime && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px' }}>{errors.startTime}</p>}
                </div>

                <div className="input-group">
                  <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Giờ kết thúc</label>
                  <input
                    type="time"
                    className={errors.endTime ? 'error' : ''}
                    style={{ padding: '16px', width: '100%', borderRadius: '16px', border: `2px solid ${errors.endTime ? 'var(--error)' : 'var(--glass-border)'}`, fontSize: '1rem' }}
                    value={formData.endTime}
                    onChange={(e) => {
                      setFormData({ ...formData, endTime: e.target.value });
                      validateField('endTime', e.target.value);
                    }}
                  />
                  {errors.endTime && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px' }}>{errors.endTime}</p>}
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Thời hạn bài đăng</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Clock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.7 }} />
                  <select
                    style={{ padding: '16px 16px 16px 48px', width: '100%', borderRadius: '16px', border: '2px solid var(--glass-border)', fontSize: '1rem', appearance: 'none', background: 'white' }}
                    value={formData.expiryHours}
                    onChange={(e) => setFormData({ ...formData, expiryHours: e.target.value })}
                  >
                    <option value="1">1 giờ</option>
                    <option value="3">3 giờ</option>
                    <option value="6">6 giờ</option>
                    <option value="12">12 giờ</option>
                    <option value="24">24 giờ</option>
                    <option value="48">48 giờ</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontWeight: 700, marginBottom: '10px', display: 'block' }}>Mô tả chi tiết nhu cầu</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <FileText size={20} style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--primary)', opacity: 0.7 }} />
                  <textarea
                    rows={6}
                    className={errors.description ? 'error' : ''}
                    placeholder="Bạn muốn đi những đâu, gu du lịch ra sao, có người lớn tuổi hay trẻ em đi cùng không..."
                    style={{ padding: '16px 16px 16px 48px', width: '100%', resize: 'none', borderRadius: '20px', border: '2px solid var(--glass-border)', fontSize: '1rem', lineHeight: 1.6 }}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      validateField('description', e.target.value);
                    }}
                  />
                </div>
                {errors.description && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px', fontWeight: 600 }}>{errors.description}</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '18px 60px', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                    else alert('Vui lòng kiểm tra lại các trường đang báo lỗi.');
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
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>1. Khu vực bạn muốn khám phá</h3>
                </div>
                <LocationPicker
                  onLocationSelect={(lat, lng, addr) => {
                    setFormData({ ...formData, latitude: lat, longitude: lng, address: addr, locationName: addr });
                    setErrors(prev => ({ ...prev, location: '' }));
                  }}
                />
                {errors.location && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '12px', fontWeight: 600 }}>{errors.location}</p>}
                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontWeight: '700', marginBottom: '8px' }}>Tên địa danh / khu vực:</p>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phố cổ Hội An..."
                    value={formData.locationName}
                    onChange={(e) => {
                      setFormData({ ...formData, locationName: e.target.value });
                      setErrors(prev => ({ ...prev, locationName: '' }));
                    }}
                    style={{ padding: '16px', borderRadius: '16px', border: `2px solid ${errors.locationName ? 'var(--error)' : 'var(--glass-border)'}`, width: '100%', fontSize: '1rem' }}
                  />
                  {errors.locationName && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px', fontWeight: 600 }}>{errors.locationName}</p>}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', border: '2px solid var(--success-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Navigation size={22} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>2. Điểm tập trung</h3>
                </div>
                <LocationPicker
                  onLocationSelect={(lat, lng, addr) => {
                    setFormData({
                      ...formData,
                      meetingLatitude: lat,
                      meetingLongitude: lng,
                      meetingLocationName: addr,
                    });
                    setErrors(prev => ({ ...prev, meetingLocation: '' }));
                  }}
                />
                {errors.meetingLocation && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '12px', fontWeight: 600 }}>{errors.meetingLocation}</p>}
                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontWeight: '700', marginBottom: '8px' }}>Tên điểm gặp mặt:</p>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cổng chính SVĐ Mỹ Đình..."
                    value={formData.meetingLocationName}
                    onChange={(e) => {
                      setFormData({ ...formData, meetingLocationName: e.target.value });
                      setErrors(prev => ({ ...prev, meetingLocationName: '' }));
                    }}
                    style={{ padding: '16px', borderRadius: '16px', border: `2px solid ${errors.meetingLocationName ? 'var(--error)' : 'var(--glass-border)'}`, width: '100%', fontSize: '1rem' }}
                  />
                  {errors.meetingLocationName && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '6px', fontWeight: 600 }}>{errors.meetingLocationName}</p>}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)} style={{ padding: '16px 40px', borderRadius: '16px', fontWeight: 700 }}>← Quay lại</button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '18px 60px', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}
                  onClick={handleSubmit}
                  disabled={submitting || !formData.latitude}
                >
                  {submitting ? 'Đang gửi yêu cầu...' : 'Hoàn tất & Đăng yêu cầu'}
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}>
                {editMode
                  ? 'Thông tin yêu cầu của bạn đã được cập nhật thành công.'
                  : 'Yêu cầu đã được gửi đến cộng đồng hướng dẫn viên. Bạn có thể theo dõi phản hồi trong trang quản lý yêu cầu.'}
              </p>
              <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/requests')}
                  style={{ padding: '20px 40px', fontSize: '1.1rem', fontWeight: '800', background: 'white', color: 'var(--text-primary)', border: '2px solid var(--glass-border)', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                >
                  Xem danh sách yêu cầu
                </button>
                <button
                  onClick={() => navigate('/')}
                  style={{ padding: '20px 48px', fontSize: '1.1rem', fontWeight: '800', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(var(--primary-rgb), 0.3)' }}
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
