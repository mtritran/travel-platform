import React, { useState } from 'react';
import { Calendar, Lock, Mail, User, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../services/api';
import { ENDPOINTS } from '../constants/endpoints';
 
type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};
 
const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    otpCode: '',
    dob: '',
    gender: 'MALE',
  });
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailValidating, setIsEmailValidating] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const validateEmail = async () => {
      const email = formData.email;
      if (!email) {
        setEmailError('');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Định dạng email không hợp lệ.');
        return;
      }

      setIsEmailValidating(true);
      try {
        const response = await api.get(`${ENDPOINTS.USER.CHECK_EMAIL}?email=${encodeURIComponent(email)}`);
        if (response.data.result) {
          setEmailError('Email này đã được sử dụng trong hệ thống.');
        } else {
          setEmailError('');
        }
      } catch (err) {
        console.error('Email check failed', err);
      } finally {
        setIsEmailValidating(false);
      }
    };

    const timer = setTimeout(() => {
      validateEmail();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email]);
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'otpCode') {
      // Chỉ cho phép nhập số và giới hạn 6 ký tự
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setFormData({ ...formData, [name]: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
 
  const handleSendOtp = async () => {
    if (!formData.email) {
      setError('Vui lòng nhập email trước khi gửi mã.');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      await api.post(`${ENDPOINTS.OTP.SEND}?email=${encodeURIComponent(formData.email)}`);
      setIsOtpSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Gửi OTP thất bại.');
    } finally {
      setOtpLoading(false);
    }
  };
 
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpSent) {
      setError('Vui lòng xác thực Email trước khi đăng ký.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setLoading(true);
    setError('');
 
    try {
      await api.post(ENDPOINTS.USER.REGISTER, formData);
      navigate('/login');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="auth-shell">
      <div className="glass-panel auth-card">
        <section className="auth-showcase">
          <div className="auth-brand">
            <span className="auth-brand-mark">
              <UserPlus size={26} />
            </span>
            <span>TravelX</span>
          </div>
 
          <h1>Tạo tài khoản để bắt đầu hành trình đầu tiên.</h1>
          <p>
            Một tài khoản là đủ để đặt tour, gửi yêu cầu riêng và theo dõi toàn bộ trải nghiệm
            du lịch trong cùng một giao diện thống nhất.
          </p>
 
          <div className="auth-feature-list">
            <div className="auth-feature">
              <User size={18} />
              <span>Quản lý hồ sơ, lịch sử booking và trạng thái chuyến đi tại một nơi.</span>
            </div>
            <div className="auth-feature">
              <Calendar size={18} />
              <span>Gửi yêu cầu mới nhanh hơn với flow rõ ràng và dễ thao tác.</span>
            </div>
          </div>
        </section>
 
        <section className="auth-form-wrap">
          <div className="auth-form-head">
            <h2>Đăng ký tài khoản</h2>
            <p>Điền thông tin cơ bản để tham gia TravelX.</p>
          </div>
 
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-form-section">
              
                <label className="field-label" htmlFor="fullName">
                  Họ và tên
                </label>
                <div className="input-shell">
                  <User size={18} />
                  <input
                    id="fullName"
                    className="input-field"
                    name="fullName"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              
            </div>
 
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <div className="input-shell with-action">
                <Mail size={18} />
                <input
                  id="email"
                  className={`input-field ${emailError ? 'error-border' : ''}`}
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={handleSendOtp}
                  disabled={otpLoading || countdown > 0 || !!emailError || isEmailValidating || !formData.email}
                >
                  {otpLoading || isEmailValidating ? '...' : countdown > 0 ? `${countdown}s` : 'Gửi mã'}
                </button>
              </div>
              {emailError && (
                <div className="field-error-msg" style={{ color: '#ff4d4f', fontSize: '0.8rem', marginTop: '4px' }}>
                  {emailError}
                </div>
              )}
            </div>
 
            <div className={`otp-field-wrap ${isOtpSent ? 'active' : ''}`}>
              <label className="field-label" htmlFor="otpCode">
                Mã xác thực OTP (Kiểm tra Email)
              </label>
              <div className="input-shell">
                <User size={18} />
                <input
                  id="otpCode"
                  className="input-field"
                  name="otpCode"
                  placeholder="Nhập 6 chữ số"
                  value={formData.otpCode}
                  onChange={handleChange}
                  maxLength={6}
                  required={isOtpSent}
                />
              </div>
            </div>
 
            <div>
              <label className="field-label" htmlFor="password">
                Mật khẩu
              </label>
              <div className="input-shell">
                <Lock size={18} />
                <input
                  id="password"
                  className="input-field"
                  name="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="confirmPassword">
                Nhập lại mật khẩu
              </label>
              <div className="input-shell">
                <Lock size={18} />
                <input
                  id="confirmPassword"
                  className={`input-field ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'error-border' : ''}`}
                  name="confirmPassword"
                  type="password"
                  placeholder="Xác nhận lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div className="field-error-msg" style={{ color: '#ff4d4f', fontSize: '0.8rem', marginTop: '4px' }}>
                  Mật khẩu nhập lại không khớp.
                </div>
              )}
            </div>
 
            <div className="split-fields">
              <div>
                <label className="field-label" htmlFor="dob">
                  Ngày sinh
                </label>
                <div className="input-shell tour-request-picker-shell">
                  <Calendar size={18} />
                  <DatePicker
                    id="dob"
                    selected={formData.dob ? new Date(formData.dob) : null}
                    onChange={(date: Date | null) => {
                      const val = date ? date.toISOString().split('T')[0] : '';
                      setFormData({ ...formData, dob: val });
                    }}
                    dateFormat="dd-MM-yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    placeholderText="Chọn ngày sinh"
                    className="input-field"
                    required
                  />
                </div>
              </div>
 
              <div>
                <label className="field-label" htmlFor="gender">
                  Giới tính
                </label>
                <select
                  id="gender"
                  className="select-field"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>
 
            {error ? <div className="status-message error">{error}</div> : null}
 
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
              {!loading ? <UserPlus size={18} /> : null}
            </button>
          </form>
 
          <p className="auth-footer">
            Đã có tài khoản?{' '}
            <Link to="/login" className="subtle-link">
              Đăng nhập
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};
 
export default RegisterPage;
