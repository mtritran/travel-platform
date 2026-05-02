import React, { useState } from 'react';
import { ArrowRight, Compass, Lock, Mail, MapPinned, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ENDPOINTS } from '../constants/endpoints';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [emailError, setEmailError] = useState('');

  React.useEffect(() => {
    if (!email) {
      setEmailError('');
      return;
    }
    if (email === 'admin@admin') {
      setEmailError('');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Định dạng email không hợp lệ.');
    } else {
      setEmailError('');
    }
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
      const { token, refreshToken } = response.data.result;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      const userRes = await api.get(ENDPOINTS.USER.GET_MY_INFO);
      const user = userRes.data.result;
      const isAdmin = user.roles?.some((r: { name: string }) => r.name === 'ADMIN');

      await refreshUser();
      navigate(isAdmin ? '/admin' : '/');
    } catch (err) {
      const apiError = err as ApiError;
      setError(
        apiError.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
      );
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
              <Compass size={26} />
            </span>
            <span>TravelX</span>
          </div>

          <h1>Khởi hành với một giao diện du lịch dễ dùng hơn.</h1>
          <p>
            Đăng nhập để quản lý booking, theo dõi tour đang mở và kết nối với những trải nghiệm
            địa phương được tuyển chọn tốt hơn.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <MapPinned size={18} />
              <span>Khám phá tour địa phương với bố cục gọn, rõ và tập trung hơn.</span>
            </div>
            <div className="auth-feature">
              <ShieldCheck size={18} />
              <span>Theo dõi trạng thái booking và tài khoản trong một không gian thống nhất.</span>
            </div>
          </div>
        </section>

        <section className="auth-form-wrap">
          <div className="auth-form-head">
            <h2>Chào mừng quay lại</h2>
            <p>Đăng nhập để tiếp tục hành trình của bạn.</p>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <div>
              <label className="field-label" htmlFor="email">
                Địa chỉ email
              </label>
              <div className="input-shell">
                <Mail size={18} />
                <input
                  id="email"
                  className={`input-field ${emailError ? 'error-border' : ''}`}
                  type="email"
                  placeholder="mail@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {emailError && (
                <div className="field-error-msg" style={{ color: '#ff4d4f', fontSize: '0.8rem', marginTop: '4px' }}>
                  {emailError}
                </div>
              )}
            </div>

            <div>
              <div className="flex-between">
                <label className="field-label" htmlFor="password">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  className="subtle-link text-xs"
                  onClick={() => setIsForgotModalOpen(true)}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="input-shell">
                <Lock size={18} />
                <input
                  id="password"
                  className="input-field"
                  type="password"
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error ? <div className="status-message error">{error}</div> : null}

            <button type="submit" className="btn-primary" disabled={loading || !!emailError}>
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              {!loading ? <ArrowRight size={18} /> : null}
            </button>
          </form>

          <p className="auth-footer">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="subtle-link">
              Đăng ký tại đây
            </Link>
          </p>
        </section>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};

export default LoginPage;
