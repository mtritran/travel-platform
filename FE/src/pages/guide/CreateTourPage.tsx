import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Image as ImageIcon,
  MapPin, CheckCircle2, Navigation, Calendar, Clock, Clock3, Users,
  Car, Coffee, Home, Package, Upload, X
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
      minGuests: '1',
      transportType: 'WALKING',
      transportInfo: '',
      transportImagesUrl: '',
      depositPercentage: '100',
      bookingCutoffMinutes: '60'
    };
  });

  const [transportFiles, setTransportFiles] = useState<File[]>([]);
  const [transportPreviews, setTransportPreviews] = useState<string[]>([]);
  const [itineraries, setItineraries] = useState<any[]>([
    { timeSlot: '08:00', activity: 'Tập trung', description: '', file: null, preview: null }
  ]);
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
    return !!error;
  };

  const validateStep1 = () => {
    const s1Fields = [
      'title', 'description', 'price', 'imageUrl',
      'startDate', 'startTime', 'endTime', 'maxGuests'
    ];
    let isValid = true;
    s1Fields.forEach(f => {
      if (validateField(f, (formData as any)[f])) isValid = false;
    });
    return isValid;
  };

  const validateItinerary = () => {
    if (itineraries.length === 0) {
      alert("Vui lòng thêm ít nhất một mốc lịch trình.");
      return false;
    }
    const invalid = itineraries.find(it => !it.timeSlot || !it.activity);
    if (invalid) {
      alert("Vui lòng điền đầy đủ Thời gian và Hoạt động cho các mốc lịch trình.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.latitude || !formData.meetingLatitude) return false;
    return true;
  };

  const handleTransportFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setTransportFiles(prev => [...prev, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setTransportPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeTransportFile = (index: number) => {
    setTransportFiles(prev => prev.filter((_, i) => i !== index));
    setTransportPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addItinerary = () => {
    setItineraries([...itineraries, { timeSlot: '', activity: '', description: '', file: null, preview: null }]);
  };

  const removeItinerary = (index: number) => {
    const newItineraries = itineraries.filter((_, i) => i !== index);
    if (itineraries[index].preview) URL.revokeObjectURL(itineraries[index].preview);
    setItineraries(newItineraries);
  };

  const handleItineraryChange = (index: number, field: string, value: string) => {
    const newItineraries = [...itineraries];
    newItineraries[index][field] = value;
    setItineraries(newItineraries);
  };

  const handleItineraryFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newItineraries = [...itineraries];
      if (newItineraries[index].preview) URL.revokeObjectURL(newItineraries[index].preview);
      newItineraries[index].file = file;
      newItineraries[index].preview = URL.createObjectURL(file);
      setItineraries(newItineraries);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.latitude || !formData.meetingLatitude) {
      alert("Vui lòng chọn cả điểm tham quan và điểm tập trung trên bản đồ.");
      return;
    }
    setSubmitting(true);
    try {
      // Upload transport images if any
      let transportImagesUrl = '';
      if (transportFiles.length > 0) {
        const uploadPromises = transportFiles.map(file => {
          const uploadData = new FormData();
          uploadData.append('file', file);
          return api.post('/files/upload', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        });
        const uploadResponses = await Promise.all(uploadPromises);
        transportImagesUrl = uploadResponses.map(r => r.data.result).join(';');
      }

      // Upload itinerary images one by one and build the final itinerary object
      const finalItineraries = [];
      for (let i = 0; i < itineraries.length; i++) {
        const item = itineraries[i];
        let imageUrl = '';
        if (item.file) {
          const uploadData = new FormData();
          uploadData.append('file', item.file);
          const uploadRes = await api.post('/files/upload', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          imageUrl = uploadRes.data.result;
        }
        finalItineraries.push({
          timeSlot: item.timeSlot,
          activity: item.activity,
          description: item.description,
          imageUrl: imageUrl,
          stepOrder: i
        });
      }

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
        minGuests: Number(formData.minGuests),
        transportType: formData.transportType,
        transportInfo: formData.transportInfo,
        transportImagesUrl: transportImagesUrl,
        itineraries: finalItineraries,
        depositPercentage: 100,
        bookingCutoffMinutes: Number(formData.bookingCutoffMinutes)
      });

      setStep(4);
    } catch (err: any) {
      console.error("Failed to create tour:", err);
      alert(err.response?.data?.message || "Lỗi khi đăng tour.");
    } finally {
      setSubmitting(false);
    }
  };

  const tourSteps = [
    { id: 1, title: 'Thông tin cơ bản', meta: 'Tiêu đề, giá và mô tả tour' },
    { id: 2, title: 'Lịch trình chi tiết', meta: 'Lịch trình từng mốc thời gian' },
    { id: 3, title: 'Vị trí & Điểm hẹn', meta: 'Chọn địa điểm trên bản đồ' },
    { id: 4, title: 'Hoàn tất', meta: 'Đăng tour thành công' },
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
                const isClickable = item.id < 4 && (item.id < step || (item.id === step + 1));

                return (
                  <div
                    key={item.id}
                    className={`tour-request-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${isClickable ? 'clickable' : ''}`}
                    onClick={() => {
                      if (!isClickable) return;
                      if (item.id === 2 && step === 1) {
                        if (validateStep1()) setStep(2);
                      } else if (item.id === 3 && step === 2) {
                        setStep(3);
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

                    <div className="tour-request-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                      <div className="tour-request-field">
                        <label className="field-label">Số khách tối thiểu</label>
                        <div className="input-shell">
                          <Users size={18} />
                          <input
                            type="number"
                            name="minGuests"
                            min="1"
                            className="input-field"
                            value={formData.minGuests}
                            onChange={handleChange}
                          />
                        </div>
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
                    </div>
                  </section>

                  <section className="tour-request-section">
                    <div className="tour-request-section-head">
                      <div>
                        <p className="tour-request-kicker">Tiện ích</p>
                        <h2 className="section-title">Phương tiện & Dịch vụ</h2>
                      </div>
                      <span className="tour-request-chip">Logistics</span>
                    </div>

                    <div className="tour-request-grid tour-request-grid-two">
                      <div className="tour-request-field">
                        <label className="field-label">Loại phương tiện</label>
                        <div className="input-shell">
                          <Car size={18} />
                          <select
                            name="transportType"
                            className="input-field"
                            value={formData.transportType}
                            onChange={(e) => setFormData({ ...formData, transportType: e.target.value })}
                            style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%' }}
                          >
                            <option value="WALKING">Đi bộ (Walking)</option>
                            <option value="BICYCLE">Xe đạp (Bicycle)</option>
                            <option value="MOTORBIKE">Xe máy (Motorbike)</option>
                            <option value="CAR">Ô tô 4-7 chỗ (Car)</option>
                            <option value="VAN">Xe Van 16 chỗ (Van)</option>
                            <option value="BUS">Xe Bus (Bus)</option>
                            <option value="BOAT">Thuyền (Boat)</option>
                            <option value="OTHER">Khác (Other)</option>
                          </select>
                        </div>
                      </div>

                      <div className="tour-request-field">
                        <label className="field-label">Chi tiết phương tiện (nếu có)</label>
                        <div className="input-shell">
                          <Package size={18} />
                          <input
                            type="text"
                            name="transportInfo"
                            className="input-field"
                            placeholder="Ví dụ: Xe Ford Transit đời 2023..."
                            value={formData.transportInfo}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="tour-request-field">
                      <label className="field-label">Hình ảnh phương tiện (Chọn nhiều ảnh)</label>
                      <div className="input-shell" style={{ cursor: 'pointer' }}>
                        <Upload size={18} />
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-soft)' }}>
                          {transportFiles.length > 0 ? `Đã chọn ${transportFiles.length} ảnh` : 'Nhấn để chọn ảnh xe...'}
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleTransportFilesChange}
                          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                        />
                      </div>

                      {transportPreviews.length > 0 && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                          {transportPreviews.map((preview, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '2px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                              <img src={preview} alt={`Transport ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                type="button"
                                onClick={() => removeTransportFile(idx)}
                                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
                      Tiếp tục: Xây dựng lịch trình
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <div className="tour-request-form">
                  <section className="tour-request-section">
                    <div className="tour-request-section-head">
                      <div>
                        <p className="tour-request-kicker">Hành trình</p>
                        <h2 className="section-title">Lịch trình dự kiến</h2>
                      </div>
                      <span className="tour-request-chip">Step-by-Step</span>
                    </div>

                    <div className="itinerary-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {itineraries.map((item, idx) => (
                        <div key={idx} className="itinerary-item glass-panel" style={{ padding: '20px', border: '1px solid rgba(102, 84, 60, 0.1)', borderRadius: '20px', position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => removeItinerary(idx)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-soft)', cursor: 'pointer' }}
                          >
                            <X size={20} />
                          </button>

                          <div className="tour-request-grid" style={{ gridTemplateColumns: '120px 1fr', gap: '20px' }}>
                            <div className="tour-request-field">
                              <label className="field-label">Thời gian</label>
                              <input
                                type="text"
                                className="input-field"
                                placeholder="8h"
                                value={item.timeSlot}
                                onChange={(e) => handleItineraryChange(idx, 'timeSlot', e.target.value)}
                              />
                            </div>
                            <div className="tour-request-field">
                              <label className="field-label">Hoạt động / Điểm dừng</label>
                              <input
                                type="text"
                                className="input-field"
                                placeholder="Ví dụ: Ăn sáng tại quán cô Năm..."
                                value={item.activity}
                                onChange={(e) => handleItineraryChange(idx, 'activity', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="tour-request-field" style={{ marginTop: '16px' }}>
                            <label className="field-label">Mô tả (không bắt buộc)</label>
                            <textarea
                              className="input-field"
                              rows={2}
                              placeholder="Chi tiết về hoạt động này..."
                              value={item.description}
                              onChange={(e) => handleItineraryChange(idx, 'description', e.target.value)}
                            />
                          </div>

                          <div className="tour-request-field" style={{ marginTop: '16px' }}>
                            <label className="field-label">Ảnh minh họa (không bắt buộc)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div className="input-shell" style={{ cursor: 'pointer', flex: 1 }}>
                                <Upload size={18} />
                                <div className="input-field" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-soft)' }}>
                                  {item.file ? item.file.name : 'Chọn ảnh cho mốc này...'}
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleItineraryFileChange(idx, e)}
                                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                />
                              </div>
                              {item.preview && (
                                <div style={{ width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '2px solid white' }}>
                                  <img src={item.preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={addItinerary}
                        style={{ alignSelf: 'center', borderRadius: '30px', padding: '12px 24px' }}
                      >
                        + Thêm mốc thời gian
                      </button>
                    </div>
                  </section>

                  <div className="tour-request-actions between">
                    <button className="btn-secondary" onClick={() => setStep(1)}>
                      Quay lại
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        if (validateItinerary()) setStep(3);
                      }}
                    >
                      Tiếp theo: Chọn vị trí
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="tour-request-form">
                  <section className="tour-request-section">
                    <div className="tour-request-section-head">
                      <div>
                        <p className="tour-request-kicker">Vị trí</p>
                        <h2 className="section-title">Bản đồ tour</h2>
                      </div>
                      <span className="tour-request-chip">Geodata</span>
                    </div>

                    <div className="tour-request-map-head">
                      <div className="tour-request-map-icon">
                        <MapPin size={22} />
                      </div>
                      <div>
                        <p className="tour-request-kicker">Điểm tham quan</p>
                        <h3 className="tour-request-map-title">Chọn địa điểm chính của Tour</h3>
                      </div>
                    </div>
                    <LocationPicker
                      onLocationSelect={(lat, lng, addr) => {
                        setFormData({ ...formData, latitude: lat, longitude: lng, address: addr, locationName: addr });
                        setErrors((prev) => ({ ...prev, location: '' }));
                      }}
                    />
                    <div className="tour-request-field" style={{ marginTop: '20px' }}>
                      <label className="field-label">Tên địa danh (ví dụ: Phố cổ Hội An)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Ví dụ: Phố cổ Hội An..."
                        value={formData.locationName}
                        onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                      />
                    </div>

                    <div className="tour-request-map-head" style={{ marginTop: '40px' }}>
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
                    <button className="btn-secondary" onClick={() => setStep(2)}>
                      Quay lại
                    </button>
                    <button
                      className="btn-primary"
                      onClick={(e) => {
                        if (validateStep3()) handleSubmit(e as any);
                        else alert("Vui lòng hoàn thiện các thông tin địa điểm.");
                      }}
                      disabled={submitting}
                    >
                      {submitting ? 'Đang khởi tạo Tour...' : 'Hoàn tất & Đăng Tour'}
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
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
                          minGuests: '1',
                          transportType: 'WALKING',
                          transportInfo: '',
                          transportImagesUrl: '',
                          depositPercentage: '100',
                          bookingCutoffMinutes: '60'
                        });
                        setItineraries([{ timeSlot: '08:00', activity: 'Tập trung', description: '', file: null, preview: null }]);
                        setTransportFiles([]);
                        setTransportPreviews([]);
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
