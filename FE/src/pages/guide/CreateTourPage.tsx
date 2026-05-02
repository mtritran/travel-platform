import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Image as ImageIcon, 
  MapPin, CheckCircle2, Navigation, Calendar, Clock, Clock3, Users
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { format, parse } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import LocationPicker from '../../components/common/LocationPicker';
import IdentityUpgradeBanner from '../../components/common/IdentityUpgradeBanner';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

const CreateTourPage: React.FC = () => {
  const { user } = useAuth();
  const { location: currentUserLocation } = useLocation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    const startHour = now.getHours() + 2;
    const endHour = startHour + 4;
    
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
      depositPercentage: '100',
      bookingCutoffMinutes: '60'
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill meeting point if guide location is available
  React.useEffect(() => {
    if (!formData.meetingLatitude && currentUserLocation?.latitude && currentUserLocation?.longitude) {
      setFormData(prev => ({
        ...prev,
        meetingLatitude: currentUserLocation.latitude,
        meetingLongitude: currentUserLocation.longitude,
        meetingAddress: currentUserLocation.address || '',
        meetingLocationName: currentUserLocation.address || 'Vị trí hiện tại của tôi'
      }));
    }
  }, [currentUserLocation, formData.meetingLatitude]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      const numericValue = value.replace(/\D/g, '');
      const formattedValue = numericValue ? new Intl.NumberFormat('en-US').format(parseInt(numericValue)) : '';
      setFormData(prev => ({ ...prev, price: formattedValue }));
      validateField('price', numericValue);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      validateField(name, value);
    }
  };

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
                error = `Thời gian quá gần (cần chừa ít nhất ${cutoff} phút để chuẩn bị/đặt)`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.meetingLatitude) {
      alert("Vui lòng chọn cả điểm tham quan và điểm tập trung trên bản đồ.");
      return;
    }
    setSubmitting(true);
    try {
      const locResponse = await api.post(ENDPOINTS.LOCATION.CREATE, {
        name: formData.locationName || formData.title,
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

      await api.post(ENDPOINTS.TOUR.CREATE, {
        locationId,
        meetingLocationId,
        title: formData.title,
        description: formData.description,
        price: Number(formData.price.replace(/,/g, '')),
        imageUrl: formData.imageUrl,
        startDate: formData.startDate,
        endDate: formData.startDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxGuests: Number(formData.maxGuests),
        depositPercentage: 100,
        bookingCutoffMinutes: Number(formData.bookingCutoffMinutes)
      });

      setStep(3);
    } catch (err: any) {
      console.error("Failed to create tour:", err);
      alert(err.response?.data?.message || "Lỗi khi đăng tour.");
    } finally {
      setSubmitting(false);
    }
  };

  const tourSteps = [
    { id: 1, title: 'Thông tin cơ bản', meta: 'Tiêu đề, giá và mô tả tour' },
    { id: 2, title: 'Vị trí & Điểm hẹn', meta: 'Chọn địa điểm trên bản đồ' },
    { id: 3, title: 'Hoàn tất', meta: 'Đăng tour thành công' },
  ];

  return (
    <DashboardLayout>
      <div className="tour-request-page">
        <section className="tour-request-hero">
          <div className="tour-request-hero-copy">
            <span className="eyebrow">Professional Guide Service</span>
            <h1 className="page-title">Đăng ký Tour mới</h1>
            <p className="page-subtitle">
              Chia sẻ những trải nghiệm thú vị và kiến thức địa phương của bạn với cộng đồng du khách TravelX.
            </p>
          </div>

          <div className="tour-request-hero-card glass-panel">
            <p className="tour-request-hero-label">Lưu ý cho Guide</p>
            <ul className="tour-request-hero-list">
              <li>Mô tả chi tiết giúp khách dễ hình dung.</li>
              <li>Chọn ảnh minh họa chất lượng cao.</li>
              <li>Đặt giá tour cạnh tranh và minh bạch.</li>
            </ul>
          </div>
        </section>

        {(!user?.phone || !user?.hasPaymentPin) ? (
          <div style={{ marginTop: '40px' }}>
            <IdentityUpgradeBanner 
              title="Định danh Hướng dẫn viên"
              message="Để đảm bảo tính minh bạch và an toàn khi đăng tour, vui lòng cập nhật Số điện thoại và Mã PIN thanh toán."
            />
          </div>
        ) : (
          <>
            <div className="tour-request-stepper glass-panel">
              {tourSteps.map((item) => {
                const isActive = step === item.id;
                const isDone = step > item.id;
                const isClickable = item.id < 3 && (item.id < step || (item.id === 2 && step === 1));

                return (
                  <div
                    key={item.id}
                    className={`tour-request-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isClickable ? 'clickable' : ''}`}
                    onClick={() => {
                      if (!isClickable) return;
                      if (item.id === 2 && step === 1) {
                        if (validateStep1()) setStep(2);
                      } else {
                        setStep(item.id);
                      }
                    }}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
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
                        <h2 className="section-title">Thông tin tổng quan</h2>
                      </div>
                      <span className="tour-request-chip">Cơ bản</span>
                    </div>

                    <div className="tour-request-field">
                      <label className="field-label">Tiêu đề Tour</label>
                      <div className="input-shell">
                        <FileText size={18} />
                        <input
                          type="text"
                          name="title"
                          className="input-field"
                          placeholder="Ví dụ: Khám phá Phố cổ Hội An về đêm"
                          value={formData.title}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.title && <p className="tour-request-error">{errors.title}</p>}
                    </div>

                    <div className="tour-request-grid tour-request-grid-two">
                      <div className="tour-request-field">
                        <label className="field-label">Giá tour (VND)</label>
                        <div className="input-shell tour-request-money-shell">
                           <span className="money-symbol">₫</span>
                           <input
                            type="text"
                            name="price"
                            className="input-field"
                            placeholder="500,000"
                            value={formData.price}
                            onChange={handleChange}
                          />
                        </div>
                        {errors.price && <p className="tour-request-error">{errors.price}</p>}
                      </div>

                      <div className="tour-request-field">
                        <label className="field-label">Số khách tối đa</label>
                        <div className="input-shell">
                          <Users size={18} />
                          <input
                            type="number"
                            name="maxGuests"
                            min="1"
                            className="input-field"
                            value={formData.maxGuests}
                            onChange={handleChange}
                          />
                        </div>
                        {errors.maxGuests && <p className="tour-request-error">{errors.maxGuests}</p>}
                      </div>
                    </div>
                  </section>

                  <section className="tour-request-section">
                    <div className="tour-request-section-head">
                      <div>
                        <p className="tour-request-kicker">Lịch trình</p>
                        <h2 className="section-title">Thời gian tổ chức</h2>
                      </div>
                      <span className="tour-request-chip">Ngày & Giờ</span>
                    </div>

                    <div className="tour-request-grid tour-request-grid-three">
                      <div className="tour-request-field">
                        <label className="field-label">Ngày diễn ra</label>
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
                            className="input-field tour-request-picker-input"
                          />
                        </div>
                        {errors.startDate && <p className="tour-request-error">{errors.startDate}</p>}
                      </div>

                      <div className="tour-request-field">
                        <label className="field-label">Giờ bắt đầu</label>
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
                            className="input-field tour-request-picker-input"
                          />
                        </div>
                      </div>

                      <div className="tour-request-field">
                        <label className="field-label">Giờ kết thúc</label>
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
                            className="input-field tour-request-picker-input"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="tour-request-grid tour-request-grid-two" style={{ alignItems: 'flex-start' }}>
                      <div className="tour-request-field">
                        <label className="field-label">Chuẩn bị trước (phút)</label>
                        <div className="input-shell">
                          <Clock3 size={18} />
                          <input
                            type="number"
                            name="bookingCutoffMinutes"
                            min="0"
                            className="input-field"
                            placeholder="60"
                            value={formData.bookingCutoffMinutes}
                            onChange={handleChange}
                          />
                        </div>
                        <p style={{ color: 'var(--text-soft)', fontSize: '0.8rem', marginTop: '6px' }}>Đóng đặt chỗ trước giờ đi X phút.</p>
                      </div>
                      <div className="tour-request-field">
                        <label className="field-label" style={{ visibility: 'hidden' }}>Gợi ý</label>
                        <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', border: '1px dashed var(--primary)', minHeight: '54px', display: 'flex', alignItems: 'center' }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                            Gợi ý: 60-120 phút để bạn chuẩn bị tốt nhất.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="tour-request-section">
                    <div className="tour-request-section-head">
                      <div>
                        <p className="tour-request-kicker">Nội dung</p>
                        <h2 className="section-title">Hình ảnh & Mô tả</h2>
                      </div>
                    </div>

                    <div className="tour-request-field">
                      <label className="field-label">Ảnh minh họa (URL)</label>
                      <div className="input-shell">
                        <ImageIcon size={18} />
                        <input
                          type="text"
                          name="imageUrl"
                          className="input-field"
                          placeholder="Dán link ảnh tại đây..."
                          value={formData.imageUrl}
                          onChange={handleChange}
                        />
                      </div>
                      {formData.imageUrl && (
                        <div style={{ marginTop: '16px', width: '100%', height: '240px', borderRadius: '24px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                          <img src={formData.imageUrl} alt="Tour Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>

                    <div className="tour-request-field">
                      <label className="field-label">Mô tả chuyến đi</label>
                      <div className="tour-request-textarea-wrap">
                        <FileText size={18} className="tour-request-textarea-icon" />
                        <textarea
                          rows={6}
                          name="description"
                          className="textarea-field tour-request-textarea"
                          placeholder="Bạn sẽ dẫn khách đi những đâu? Những điểm thú vị của tour này là gì?"
                          value={formData.description}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.description && <p className="tour-request-error">{errors.description}</p>}
                    </div>
                  </section>

                  <div className="tour-request-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        if (validateStep1()) setStep(2);
                        else alert("Vui lòng hoàn thiện các trường còn thiếu.");
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
                        <MapPin size={22} />
                      </div>
                      <div>
                        <p className="tour-request-kicker">Địa điểm tham quan chính</p>
                        <h3 className="tour-request-map-title">Khu vực tổ chức Tour</h3>
                      </div>
                    </div>
                    <LocationPicker
                      onLocationSelect={(lat, lng, addr) => {
                        setFormData({ ...formData, latitude: lat, longitude: lng, address: addr, locationName: addr });
                        setErrors((prev) => ({ ...prev, location: '' }));
                      }}
                    />
                    <div className="tour-request-field" style={{ marginTop: '20px' }}>
                      <label className="field-label">Tên địa danh hiển thị</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Ví dụ: Phố cổ Hội An..."
                        value={formData.locationName}
                        onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                      />
                    </div>
                  </section>

                  <section className="tour-request-map-card tour-request-map-success glass-panel">
                    <div className="tour-request-map-head">
                      <div className="tour-request-map-icon success">
                        <Navigation size={22} />
                      </div>
                      <div>
                        <p className="tour-request-kicker">Điểm tập trung</p>
                        <h3 className="tour-request-map-title">Nơi gặp mặt du khách</h3>
                      </div>
                    </div>
                    <LocationPicker
                      onLocationSelect={(lat, lng, addr) => {
                        setFormData({ ...formData, meetingLatitude: lat, meetingLongitude: lng, meetingAddress: addr, meetingLocationName: addr });
                        setErrors((prev) => ({ ...prev, meetingLocation: '' }));
                      }}
                    />
                    <div className="tour-request-field" style={{ marginTop: '20px' }}>
                      <label className="field-label">Tên điểm hẹn (ví dụ: Sảnh khách sạn)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Ví dụ: Cổng chính SVĐ Mỹ Đình..."
                        value={formData.meetingLocationName}
                        onChange={(e) => setFormData({ ...formData, meetingLocationName: e.target.value })}
                      />
                    </div>
                  </section>

                  <div className="tour-request-actions between">
                    <button className="btn-secondary" onClick={() => setStep(1)}>
                      Quay lại
                    </button>
                    <button
                      className="btn-primary"
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
                <section className="tour-request-success">
                  <div className="tour-request-success-icon">
                    <CheckCircle2 size={60} />
                  </div>
                  <h3 className="tour-request-success-title">Tuyệt vời!</h3>
                  <p className="tour-request-success-copy">
                    Tour của bạn đã được đăng thành công. Chúng tôi sẽ phê duyệt trong giây lát để hiển thị công khai trên ứng dụng.
                  </p>
                  <div className="tour-request-actions center">
                    <button className="btn-secondary" onClick={() => navigate('/')}>
                      Về trang chủ
                    </button>
                    <button
                      className="btn-primary"
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
                    >
                      Đăng tour khác
                    </button>
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateTourPage;
