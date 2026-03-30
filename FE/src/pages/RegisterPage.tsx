import React, { useState } from 'react';
import { Calendar, Lock, Mail, Phone, User, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
    fullName: '',
    phone: '',
    dob: '',
    gender: 'MALE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
              <span>Gửi yêu cầu mới nhanh hơn với flow rõ ràng và dễ thao tác trên mobile.</span>
            </div>
          </div>
        </section>

        <section className="auth-form-wrap">
          <div className="auth-form-head">
            <h2>Đăng ký tài khoản</h2>
            <p>Điền thông tin cơ bản để tham gia TravelX.</p>
          </div>

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="split-fields">
              <div>
                <label className="field-label" htmlFor="fullName">
                  Họ và tên
                </label>
                <div className="input-shell">
                  <User size={18} />
                  <input
                    id="fullName"
                    className="input-field"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="phone">
                  Số điện thoại
                </label>
                <div className="input-shell">
                  <Phone size={18} />
                  <input
                    id="phone"
                    className="input-field"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <div className="input-shell">
                <Mail size={18} />
                <input
                  id="email"
                  className="input-field"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="split-fields">
              <div>
                <label className="field-label" htmlFor="dob">
                  Ngày sinh
                </label>
                <div className="input-shell">
                  <Calendar size={18} />
                  <input
                    id="dob"
                    className="input-field"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
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
