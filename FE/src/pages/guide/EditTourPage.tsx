import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle2
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
        locationId: '',
        locationName: '',
        address: '',
        latitude: 0,
        longitude: 0,
        meetingLocationId: '',
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
                    locationId: '', // We use IDs from the response if needed, but for simplify we allow re-picking or keeping old
                    locationName: tour.locationName,
                    address: tour.locationAddress || '',
                    latitude: tour.latitude || 0,
                    longitude: tour.longitude || 0,
                    meetingLocationId: '',
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
            case 'locationName':
                if (!value.trim()) error = 'Vui lòng nhập tên địa điểm';
                break;
            case 'address':
                if (!value.trim()) error = 'Vui lòng nhập địa chỉ';
                break;
            case 'meetingAddress':
                if (!value.trim()) error = 'Vui lòng nhập điểm tập trung';
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
        const hasDestination = formData.latitude !== 0 && formData.longitude !== 0;
        const hasMeetingPoint = formData.meetingLatitude !== 0 && formData.meetingLongitude !== 0;

        if (!formData.locationName.trim()) newErrors.locationName = 'Vui lòng nhập tên địa điểm';
        if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
        if (!formData.meetingAddress.trim()) newErrors.meetingAddress = 'Vui lòng nhập điểm tập trung';
        
        if (!hasDestination) {
            alert('Vui lòng chọn vị trí tham quan trên bản đồ (Click vào bản đồ)');
            return false;
        }
        if (!hasMeetingPoint) {
            alert('Vui lòng chọn vị trí tập trung trên bản đồ (Click vào bản đồ)');
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        // Final validation
        if (!validateStep1() || !validateStep2()) {
            setStep(!validateStep1() ? 1 : 2);
            return;
        }

        setSubmitting(true);
        try {
            // Re-create or update locations if needed. For simplicity in this demo,
            // we create new locations or reuse.
            // In a real app we'd update specific location IDs.
            
            // 1. Create/Update destination
            const locRes = await api.post(ENDPOINTS.LOCATION.CREATE, {
                name: formData.locationName,
                address: formData.address,
                latitude: formData.latitude,
                longitude: formData.longitude,
                imageUrl: formData.imageUrl
            });
            const locationId = locRes.data.result.id;

            // 2. Create/Update meeting point
            const meetRes = await api.post(ENDPOINTS.LOCATION.CREATE, {
                name: formData.meetingLocationName || "Điểm tập trung",
                address: formData.meetingAddress,
                latitude: formData.meetingLatitude,
                longitude: formData.meetingLongitude,
                imageUrl: formData.imageUrl
            });
            const meetingLocationId = meetRes.data.result.id;

            // 3. Update the tour
            await api.put(ENDPOINTS.TOUR.UPDATE(id), {
                locationId,
                meetingLocationId,
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                imageUrl: formData.imageUrl,
                startDate: formData.startDate,
                endDate: formData.startDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                maxGuests: Number(formData.maxGuests),
                depositPercentage: Number(formData.depositPercentage)
            });

            setStep(3);
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

                <div style={{ display: 'flex', gap: '32px', marginBottom: '40px' }}>
                    <div style={{ flex: 1, padding: '12px', background: step === 1 ? 'var(--primary-light)' : 'var(--surface)', borderRadius: '12px', border: `2px solid ${step === 1 ? 'var(--primary)' : 'var(--glass-border)'}`, color: step === 1 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center' }}>
                        1. Thông tin cơ bản
                    </div>
                    <div style={{ flex: 1, padding: '12px', background: step === 2 ? 'var(--primary-light)' : 'var(--surface)', borderRadius: '12px', border: `2px solid ${step === 2 ? 'var(--primary)' : 'var(--glass-border)'}`, color: step === 2 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: '700', textAlign: 'center' }}>
                        2. Vị trí & Điểm gặp
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
                                            value={formData.title}
                                            onChange={e => {
                                                setFormData({...formData, title: e.target.value});
                                                validateField('title', e.target.value);
                                            }}
                                            style={{ paddingLeft: '40px', width: '100%', borderColor: errors.title ? 'var(--error)' : '' }} 
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
                                            value={formData.price}
                                            onChange={e => {
                                                setFormData({...formData, price: e.target.value});
                                                validateField('price', e.target.value);
                                            }}
                                            style={{ paddingLeft: '32px', width: '100%', borderColor: errors.price ? 'var(--error)' : '' }} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                                <div className="input-group">
                                    <label>Ngày diễn ra</label>
                                    <input 
                                        type="date" 
                                        className={errors.startDate ? 'error' : ''}
                                        value={formData.startDate}
                                        onChange={e => {
                                            setFormData({...formData, startDate: e.target.value});
                                            validateField('startDate', e.target.value);
                                        }}
                                        style={{ padding: '12px 16px', width: '100%', borderColor: errors.startDate ? 'var(--error)' : '' }} 
                                    />
                                    {errors.startDate && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.startDate}</p>}
                                </div>
                                <div className="input-group">
                                    <label>Số khách tối đa</label>
                                    <input 
                                        type="number" 
                                        className={errors.maxGuests ? 'error' : ''}
                                        value={formData.maxGuests}
                                        onChange={e => {
                                            setFormData({...formData, maxGuests: e.target.value});
                                            validateField('maxGuests', e.target.value);
                                        }}
                                        style={{ padding: '12px 16px', width: '100%', borderColor: errors.maxGuests ? 'var(--error)' : '' }} 
                                    />
                                    {errors.maxGuests && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.maxGuests}</p>}
                                </div>
                                <div className="input-group">
                                    <label>% Tiền cọc</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-secondary)' }}>%</span>
                                        <input 
                                            type="number" 
                                            value={formData.depositPercentage}
                                            onChange={e => setFormData({...formData, depositPercentage: e.target.value})}
                                            style={{ padding: '12px 32px 12px 16px', width: '100%' }} 
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
                                        value={formData.startTime} 
                                        onChange={e => {
                                            setFormData({...formData, startTime: e.target.value});
                                            validateField('startTime', e.target.value);
                                        }} 
                                        style={{ padding: '12px 16px', width: '100%', borderColor: errors.startTime ? 'var(--error)' : '' }} 
                                    />
                                    {errors.startTime && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.startTime}</p>}
                                </div>
                                <div className="input-group">
                                    <label>Giờ kết thúc</label>
                                    <input 
                                        type="time" 
                                        className={errors.endTime ? 'error' : ''}
                                        value={formData.endTime} 
                                        onChange={e => {
                                            setFormData({...formData, endTime: e.target.value});
                                            validateField('endTime', e.target.value);
                                        }} 
                                        style={{ padding: '12px 16px', width: '100%', borderColor: errors.endTime ? 'var(--error)' : '' }} 
                                    />
                                    {errors.endTime && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.endTime}</p>}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Mô tả chuyến đi</label>
                                <textarea 
                                    rows={5} 
                                    className={errors.description ? 'error' : ''}
                                    value={formData.description}
                                    onChange={e => {
                                        setFormData({...formData, description: e.target.value});
                                        validateField('description', e.target.value);
                                    }}
                                    style={{ padding: '12px 16px', width: '100%', resize: 'none', borderColor: errors.description ? 'var(--error)' : '' }} 
                                />
                                {errors.description && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.description}</p>}
                            </div>

                            <div className="input-group">
                                <label>URL Hình ảnh</label>
                                <input 
                                    type="text" 
                                    className={errors.imageUrl ? 'error' : ''}
                                    value={formData.imageUrl}
                                    onChange={e => {
                                        setFormData({...formData, imageUrl: e.target.value});
                                        validateField('imageUrl', e.target.value);
                                    }}
                                    style={{ padding: '12px 16px', width: '100%', borderColor: errors.imageUrl ? 'var(--error)' : '' }} 
                                />
                                {errors.imageUrl && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{errors.imageUrl}</p>}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                                    Tiếp theo: Vị trí
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                             <div className="glass-panel" style={{ padding: '20px' }}>
                                <h3 style={{ marginBottom: '16px' }}>Vị trí tham quan: {formData.locationName}</h3>
                                <LocationPicker 
                                    onLocationSelect={(lat, lng, addr) => setFormData({...formData, latitude: lat, longitude: lng, address: addr, locationName: addr})}
                                />
                             </div>
                             <div className="glass-panel" style={{ padding: '20px' }}>
                                <h3 style={{ marginBottom: '16px' }}>Điểm tập trung: {formData.meetingLocationName}</h3>
                                <LocationPicker 
                                    onLocationSelect={(lat, lng, addr) => setFormData({...formData, meetingLatitude: lat, meetingLongitude: lng, meetingAddress: addr, meetingLocationName: addr})}
                                />
                             </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button className="btn-secondary" onClick={() => setStep(1)} style={{ padding: '12px 32px' }}>Quay lại</button>
                                <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ padding: '12px 48px' }}>
                                    {submitting ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                                </button>
                             </div>
                         </div>
                    )}

                    {step === 3 && (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <CheckCircle2 size={64} color="var(--success)" style={{ marginBottom: '24px' }} />
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '16px' }}>Cập nhật thành công!</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Thông tin tour đã được lưu và hiển thị lại trên TravelX (nếu còn hạn).</p>
                            <button className="btn-primary" onClick={() => navigate('/guide/tours')} style={{ padding: '16px 48px' }}>Xong</button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditTourPage;
