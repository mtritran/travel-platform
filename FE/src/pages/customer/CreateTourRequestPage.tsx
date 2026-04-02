import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Banknote, CalendarDays, CheckCircle2, Clock, Clock3, FileText, MapPin, Navigation, Users } from 'lucide-react';
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
      endTime: existingReq.endTime || '17:00',
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
    endTime: '17:00',
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
      'description',
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

  const requestSteps = [
    { id: 1, title: 'Nhu cầu chuyến đi', meta: 'Mô tả tour bạn cần' },
    { id: 2, title: 'Địa điểm mong muốn', meta: 'Chọn khu vực và điểm hẹn' },
    { id: 3, title: 'Hoàn tất', meta: 'Đăng yêu cầu thành công' },
  ];

  return (
    <DashboardLayout>
      <div className="tour-request-page">
        <section className="tour-request-hero">
          <div className="tour-request-hero-copy">
            <span className="eyebrow">Custom trip request</span>
            <h1 className="page-title">
              {editMode ? 'Chỉnh sửa yêu cầu chuyến đi' : 'Đăng yêu cầu tìm hướng dẫn viên'}
            </h1>
            <p className="page-subtitle">
              {editMode
                ? 'Cập nhật lại thông tin để tìm được guide phù hợp hơn.'
                : 'Mô tả chuyến đi bạn mong muốn để các hướng dẫn viên địa phương chủ động đề xuất.'}
            </p>
          </div>

          <div className="tour-request-hero-card glass-panel">
            <p className="tour-request-hero-label">Lưu ý nhanh</p>
            <ul className="tour-request-hero-list">
              <li>Viết rõ nhu cầu để nhận đề xuất sát hơn.</li>
              <li>Chọn đúng khu vực tham quan và điểm hẹn.</li>
              <li>Tận hưởng trải nghiệm du lịch tuyệt vời.</li>
            </ul>
          </div>
        </section>

        <div className="tour-request-stepper glass-panel">
          {requestSteps.map((item) => {
            const isActive = step === item.id;
            const isDone = step > item.id;

            return (
              <div
                key={item.id}
                className={`tour-request-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              >
                <span className="tour-request-step-index">{item.id}</span>
                <div>
                  <p className="tour-request-step-title">{item.title}</p>
                  <p className="tour-request-step-meta">{item.meta}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-panel tour-request-shell">
          {step === 1 && (
            <form className="tour-request-form">
              <section className="tour-request-section">
                <div className="tour-request-section-head">
                  <div>
                    <p className="tour-request-kicker">Bước 1</p>
                    <h2 className="section-title">Thông tin chuyến đi</h2>
                  </div>
                  <span className="tour-request-chip">Thông tin cơ bản</span>
                </div>

                <div className="tour-request-field">
                  <label className="field-label">Tóm tắt yêu cầu</label>
                  <div className="input-shell">
                    <FileText size={18} />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ví dụ: Cần tìm guide am hiểu ẩm thực Hội An cho gia đình"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        validateField('title', e.target.value);
                      }}
                    />
                  </div>
                  {errors.title ? <p className="tour-request-error">{errors.title}</p> : null}
                </div>

                <div className="tour-request-grid tour-request-grid-two">
                  <div className="tour-request-field">
                    <label className="field-label">Ngân sách dự kiến (VND)</label>
                    <div className="input-shell tour-request-money-shell">
                      <Banknote size={18} />
                      <input
                        type="number"
                        className="input-field"
                        placeholder="500000"
                        value={formData.budget}
                        onChange={(e) => {
                          setFormData({ ...formData, budget: e.target.value });
                          validateField('budget', e.target.value);
                        }}
                      />
                    </div>
                    {errors.budget ? <p className="tour-request-error">{errors.budget}</p> : null}
                  </div>

                  <div className="tour-request-field">
                    <label className="field-label">Số người tham gia</label>
                    <div className="input-shell">
                      <Users size={18} />
                      <input
                        type="number"
                        min="1"
                        className="input-field"
                        value={formData.numberOfGuests}
                        onChange={(e) => {
                          setFormData({ ...formData, numberOfGuests: e.target.value });
                          validateField('numberOfGuests', e.target.value);
                        }}
                      />
                    </div>
                    {errors.numberOfGuests ? <p className="tour-request-error">{errors.numberOfGuests}</p> : null}
                  </div>
                </div>
              </section>

              <section className="tour-request-section">
                <div className="tour-request-section-head">
                  <div>
                    <p className="tour-request-kicker">Lịch trình</p>
                    <h2 className="section-title">Thời gian dự kiến</h2>
                  </div>
                  <span className="tour-request-chip">Ngày và giờ</span>
                </div>

                <div className="tour-request-grid tour-request-grid-three">
                  <div className="tour-request-field">
                    <label className="field-label">Ngày dự kiến</label>
                    <div className="input-shell tour-request-picker-shell">
                      <CalendarDays size={18} />
                      <input
                        type="date"
                        className="input-field tour-request-picker-input"
                        value={formData.plannedDate}
                        onChange={(e) => {
                          setFormData({ ...formData, plannedDate: e.target.value });
                          validateField('plannedDate', e.target.value);
                        }}
                      />
                    </div>
                    {errors.plannedDate ? <p className="tour-request-error">{errors.plannedDate}</p> : null}
                  </div>

                  <div className="tour-request-field">
                    <label className="field-label">Giờ bắt đầu</label>
                    <div className="input-shell tour-request-picker-shell">
                      <Clock3 size={18} />
                      <input
                        type="time"
                        className="input-field tour-request-picker-input"
                        value={formData.startTime}
                        onChange={(e) => {
                          setFormData({ ...formData, startTime: e.target.value });
                          validateField('startTime', e.target.value);
                        }}
                      />
                    </div>
                    {errors.startTime ? <p className="tour-request-error">{errors.startTime}</p> : null}
                  </div>

                  <div className="tour-request-field">
                    <label className="field-label">Giờ kết thúc</label>
                    <div className="input-shell tour-request-picker-shell">
                      <Clock size={18} />
                      <input
                        type="time"
                        className="input-field tour-request-picker-input"
                        value={formData.endTime}
                        onChange={(e) => {
                          setFormData({ ...formData, endTime: e.target.value });
                          validateField('endTime', e.target.value);
                        }}
                      />
                    </div>
                    {errors.endTime ? <p className="tour-request-error">{errors.endTime}</p> : null}
                  </div>
                </div>

                <div className="tour-request-field">
                  <label className="field-label">Thời hạn bài đăng</label>
                  <div className="input-shell">
                    <Clock size={18} />
                    <select
                      className="select-field tour-request-select"
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
              </section>

              <section className="tour-request-section">
                <div className="tour-request-section-head">
                  <div>
                    <p className="tour-request-kicker">Chi tiết</p>
                    <h2 className="section-title">Mô tả mong muốn</h2>
                  </div>
                </div>

                <div className="tour-request-field">
                  <label className="field-label">Mô tả chi tiết nhu cầu</label>
                  <div className="tour-request-textarea-wrap">
                    <FileText size={18} className="tour-request-textarea-icon" />
                    <textarea
                      rows={6}
                      className="textarea-field tour-request-textarea"
                      placeholder="Bạn muốn đi những đâu, gu du lịch ra sao, có người lớn tuổi hay trẻ em đi cùng không..."
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        validateField('description', e.target.value);
                      }}
                    />
                  </div>
                  {errors.description ? <p className="tour-request-error">{errors.description}</p> : null}
                </div>
              </section>

              <div className="tour-request-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                    else alert('Vui lòng kiểm tra lại các trường đang báo lỗi.');
                  }}
                >
                  Tiếp tục: Chọn bản đồ
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="tour-request-step-two">
              <section className="tour-request-map-card tour-request-map-primary glass-panel">
                <div className="tour-request-map-head">
                  <div className="tour-request-map-icon">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="tour-request-kicker">Địa điểm tham quan</p>
                    <h3 className="tour-request-map-title">Khu vực bạn muốn khám phá</h3>
                  </div>
                </div>

                <LocationPicker
                  onLocationSelect={(lat, lng, addr) => {
                    setFormData({ ...formData, latitude: lat, longitude: lng, address: addr, locationName: addr });
                    setErrors((prev) => ({ ...prev, location: '' }));
                  }}
                />

                {errors.location ? <p className="tour-request-error tour-request-map-error">{errors.location}</p> : null}

                <div className="tour-request-field">
                  <label className="field-label">Tên địa danh / khu vực</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ví dụ: Phố cổ Hội An..."
                    value={formData.locationName}
                    onChange={(e) => {
                      setFormData({ ...formData, locationName: e.target.value });
                      setErrors((prev) => ({ ...prev, locationName: '' }));
                    }}
                  />
                  {errors.locationName ? <p className="tour-request-error">{errors.locationName}</p> : null}
                </div>
              </section>

              <section className="tour-request-map-card tour-request-map-success glass-panel">
                <div className="tour-request-map-head">
                  <div className="tour-request-map-icon success">
                    <Navigation size={20} />
                  </div>
                  <div>
                    <p className="tour-request-kicker">Điểm tập trung</p>
                    <h3 className="tour-request-map-title">Nơi gặp mặt ban đầu</h3>
                  </div>
                </div>

                <LocationPicker
                  onLocationSelect={(lat, lng, addr) => {
                    setFormData({
                      ...formData,
                      meetingLatitude: lat,
                      meetingLongitude: lng,
                      meetingLocationName: addr,
                    });
                    setErrors((prev) => ({ ...prev, meetingLocation: '' }));
                  }}
                />

                {errors.meetingLocation ? (
                  <p className="tour-request-error tour-request-map-error">{errors.meetingLocation}</p>
                ) : null}

                <div className="tour-request-field">
                  <label className="field-label">Tên điểm gặp mặt</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ví dụ: Cổng chính SVĐ Mỹ Đình..."
                    value={formData.meetingLocationName}
                    onChange={(e) => {
                      setFormData({ ...formData, meetingLocationName: e.target.value });
                      setErrors((prev) => ({ ...prev, meetingLocationName: '' }));
                    }}
                  />
                  {errors.meetingLocationName ? <p className="tour-request-error">{errors.meetingLocationName}</p> : null}
                </div>
              </section>

              <div className="tour-request-actions between">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  Quay lại
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting || !formData.latitude}
                >
                  {submitting ? 'Đang gửi yêu cầu...' : 'Hoàn tất và đăng yêu cầu'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <section className="tour-request-success">
              <div className="tour-request-success-icon">
                <CheckCircle2 size={60} />
              </div>
              <h3 className="tour-request-success-title">Tuyệt vời!</h3>
              <p className="tour-request-success-copy">
                {editMode
                  ? 'Thông tin yêu cầu của bạn đã được cập nhật thành công.'
                  : 'Yêu cầu đã được gửi đến cộng đồng hướng dẫn viên. Bạn có thể theo dõi phản hồi trong trang quản lý yêu cầu.'}
              </p>
              <div className="tour-request-actions center">
                <button type="button" className="btn-secondary" onClick={() => navigate('/requests')}>
                  Xem danh sách yêu cầu
                </button>
                <button type="button" className="btn-primary" onClick={() => navigate('/')}>
                  Trở về trang chủ
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateTourRequestPage;
