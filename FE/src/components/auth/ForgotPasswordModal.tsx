import React, { useState } from 'react';
import { X, Mail, ShieldCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  React.useEffect(() => {
    if (!email) {
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

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError) return;
    setLoading(true);
    setError('');
    try {
      await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        email,
        code: otp,
        newPassword,
        confirmPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác thực thất bại. Vui lòng kiểm tra lại mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content auth-modal">
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {step === 1 && (
          <div className="auth-step">
            <div className="modal-head">
              <h3>Quên mật khẩu?</h3>
              <p>Nhập email của bạn để nhận mã xác thực OTP.</p>
            </div>

            <form onSubmit={handleRequestOtp} className="auth-form mt-6">
              <div className="field-group">
                <label className="field-label">Email đăng ký</label>
                <div className="input-shell">
                  <Mail size={18} />
                  <input
                    type="email"
                    className={`input-field ${emailError ? 'error-border' : ''}`}
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

              {error && <div className="status-message error mt-4">{error}</div>}

              <button type="submit" className="btn-primary w-full mt-6" disabled={loading || !!emailError}>
                {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="auth-step">
            <div className="modal-head">
              <h3>Xác thực OTP</h3>
              <p>Mã OTP đã được gửi đến <strong>{email}</strong>.</p>
            </div>

            <form onSubmit={handleResetPassword} className="auth-form mt-6">
              <div className="field-group">
                <label className="field-label">Mã OTP (6 số)</label>
                <div className="input-shell">
                  <ShieldCheck size={18} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="field-group mt-4">
                <label className="field-label">Mật khẩu mới</label>
                <div className="input-shell">
                  <Lock size={18} />
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-group mt-4">
                <label className="field-label">Xác nhận mật khẩu</label>
                <div className="input-shell">
                  <Lock size={18} />
                  <input
                    type="password"
                    className={`input-field ${confirmPassword && newPassword !== confirmPassword ? 'error-border' : ''}`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <div className="field-error-msg" style={{ color: '#ff4d4f', fontSize: '0.8rem', marginTop: '4px' }}>
                    Mật khẩu nhập lại không khớp.
                  </div>
                )}
              </div>

              {error && <div className="status-message error mt-4">{error}</div>}

              <button type="submit" className="btn-primary w-full mt-6" disabled={loading || (confirmPassword !== '' && newPassword !== confirmPassword)}>
                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="auth-step text-center py-8">
            <h3>Thành công!</h3>
            <p className="mt-2 text-muted">Mật khẩu của bạn đã được cập nhật.</p>
            <button className="btn-primary w-full mt-8" onClick={onClose}>
              Quay lại đăng nhập
            </button>
          </div>
        )}
      </div>

      <style>{`
        .auth-modal {
          max-width: 420px;
          padding: 2.5rem;
        }
        .modal-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: transparent !important;
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border: none;
        }
        .modal-close:hover {
          background: rgba(0, 0, 0, 0.05) !important;
          color: var(--text-primary);
        }
        .modal-head {
          text-align: center;
        }
        .icon-badge {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .icon-badge.primary {
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
        }
        .icon-badge.success {
          background: rgba(var(--success-rgb), 0.1);
          color: var(--success);
        }
        .modal-head h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .modal-head p {
          color: var(--muted);
          font-size: 0.95rem;
        }
        .mt-6 { margin-top: 1.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mt-8 { margin-top: 2rem; }
        .w-full { width: 100%; }
        .mb-4 { margin-bottom: 1rem; }
      `}</style>
    </div>
  );
};

export default ForgotPasswordModal;
