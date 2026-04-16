import React, { useEffect, useState } from 'react';
import { BadgeCheck, Camera, KeyRound, Loader2, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS } from '../constants/endpoints';
import api from '../services/api';
import IdentityUpgradeBanner from '../components/common/IdentityUpgradeBanner';
import { getFileUrl } from '../utils/format';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    biography: '',
    languages: '',
    yearsOfExperience: '',
    specialties: '',
    paymentPin: '',
    oldPassword: '',
  });

  const isGuide = user?.roles?.some((r) => r.name === 'GUIDE');

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        phone: user.phone || '',
        biography: user.biography || '',
        languages: user.languages || '',
        yearsOfExperience: user.yearsOfExperience?.toString() || '',
        specialties: user.specialties || '',
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(ENDPOINTS.USER.MY_INFO, {
        fullName: formData.fullName,
        phone: formData.phone || undefined,
        password: formData.password || undefined,
        biography: formData.biography,
        languages: formData.languages,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
        specialties: formData.specialties,
        paymentPin: formData.paymentPin || undefined,
        oldPassword: formData.oldPassword || undefined,
      });

      const data = response.data;
      if (data.code === 1000) {
        setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công.' });
        await refreshUser();
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '', oldPassword: '' }));
      } else {
        setMessage({ type: 'error', text: data.message || 'Cập nhật thất bại.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi kết nối máy chủ.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(ENDPOINTS.USER.AVATAR, formData);

      if (response.data.code === 1000) {
        await refreshUser();
        setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công.' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Lỗi khi tải ảnh.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi máy chủ khi tải ảnh.' });
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-stack">
        <section className="section-heading">
          <span className="eyebrow">Account center</span>
          <h1 className="page-title">Hồ sơ của bạn</h1>
          <p className="page-subtitle">
            Quản lý thông tin tài khoản và cập nhật các chi tiết quan trọng trong một không gian trực quan, dễ
            theo dõi hơn.
          </p>
          <IdentityUpgradeBanner
            title="Nâng cấp định danh tài khoản"
            message="Bạn cần cập nhật Số điện thoại và Mã PIN thanh toán để bảo mật."
          />
        </section>

        <div className="profile-grid">
          <aside className="glass-panel profile-sidebar">
            <div className="profile-sidebar-hero">
              <div
                className="avatar-large profile-avatar"
                onClick={handleAvatarClick}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--surface-hover)',
                  border: '2px solid var(--primary-muted)'
                }}
              >
                {avatarLoading ? (
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                ) : user?.avatarUrl ? (
                  <img
                    src={getFileUrl(user.avatarUrl)}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <User size={54} />
                )}
                <div className="avatar-overlay" style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'white'
                }}>
                  <Camera size={24} />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="profile-sidebar-kicker">Hồ sơ cá nhân</p>
                <h2 className="section-title">{user?.fullName || 'Thành viên TravelX'}</h2>
                <p className="page-subtitle profile-sidebar-email">{user?.email}</p>
              </div>
            </div>

            <div className="role-list">
              {user?.roles?.map((role) => (
                <span key={role.name} className="badge badge-primary">
                  {role.name === 'ADMIN' ? 'Quản trị' : role.name === 'GUIDE' ? 'Hướng dẫn viên' : 'Khách hàng'}
                </span>
              ))}
            </div>

            <div className="profile-sidebar-card">
              <div className="profile-meta-item">
                <span className="profile-meta-icon">
                  <BadgeCheck size={16} />
                </span>
                <div>
                  <p className="profile-meta-label">Trạng thái tài khoản</p>
                  <strong>Đã xác thực email</strong>
                </div>
              </div>

              <div className="profile-meta-item">
                <span className="profile-meta-icon">
                  <ShieldCheck size={16} />
                </span>
                <div>
                  <p className="profile-meta-label">Bảo mật</p>
                  <strong>Cập nhật thông tin thường xuyên</strong>
                </div>
              </div>
            </div>

            <div className="profile-sidebar-note">
              <p className="profile-note-title">Mẹo nhỏ</p>
              <p className="muted-text">
                Giữ số điện thoại và mật khẩu luôn mới để việc đặt tour, thanh toán và hỗ trợ diễn ra mượt hơn.
              </p>
            </div>
          </aside>

          <section className="glass-panel profile-form">
            <form className="profile-form-layout" onSubmit={handleSubmit}>
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <div>
                    <p className="profile-card-kicker">Thông tin cơ bản</p>
                    <h2 className="section-title">Chi tiết tài khoản</h2>
                  </div>
                  <span className="profile-card-chip">Luôn hiển thị</span>
                </div>

                <div className="profile-fields-grid">
                  <div>
                    <label className="field-label" htmlFor="fullName">
                      Họ và tên
                    </label>
                    <div className="input-shell">
                      <User size={18} />
                      <input
                        id="fullName"
                        className="input-field"
                        type="text"
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
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Ví dụ: 0912345678"
                      />
                    </div>
                  </div>


                  <div className="profile-field-full">
                    <label className="field-label" htmlFor="email-view">
                      Email
                    </label>
                    <div className="input-shell">
                      <Mail size={18} />
                      <input
                        id="email-view"
                        className="input-field"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        style={{ color: 'var(--text-secondary)', background: 'var(--surface-muted)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isGuide && (
                <div className="profile-section-card">
                  <div className="profile-section-header">
                    <div>
                      <p className="profile-card-kicker">Dành cho guide</p>
                      <h2 className="section-title">Thông tin hướng dẫn viên</h2>
                    </div>
                    <span className="profile-card-chip">Chuyên môn</span>
                  </div>

                  <div className="page-stack" style={{ gap: '18px' }}>
                    <div>
                      <label className="field-label">Giới thiệu bản thân</label>
                      <textarea
                        className="textarea-field"
                        name="biography"
                        value={formData.biography}
                        onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                        placeholder="Mô tả về kinh nghiệm, phong cách dẫn tour của bạn..."
                      />
                    </div>

                    <div className="split-fields">
                      <div>
                        <label className="field-label">Ngôn ngữ (Xác minh bởi Admin)</label>
                        <input
                          className="input-field"
                          type="text"
                          name="languages"
                          value={formData.languages}
                          readOnly
                          style={{ background: 'var(--surface-muted)', cursor: 'not-allowed' }}
                          placeholder="Chưa xác minh"
                        />
                      </div>
                      <div>
                        <label className="field-label">Số năm kinh nghiệm (Xác minh bởi Admin)</label>
                        <input
                          className="input-field"
                          type="number"
                          name="yearsOfExperience"
                          value={formData.yearsOfExperience}
                          readOnly
                          style={{ background: 'var(--surface-muted)', cursor: 'not-allowed' }}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="field-label">Sở trường / Chuyên môn</label>
                      <input
                        className="input-field"
                        type="text"
                        name="specialties"
                        value={formData.specialties}
                        onChange={handleChange}
                        placeholder="Ví dụ: Lịch sử, Văn hóa, Ẩm thực..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="profile-section-card profile-password-card">
                <div className="profile-section-header profile-password-header">
                  <div>
                    <p className="profile-card-kicker">Bảo mật</p>
                    <h2 className="section-title">Đổi mật khẩu</h2>
                    <p className="muted-text">Để trống nếu bạn chưa muốn cập nhật trong lần này.</p>
                  </div>
                  <span className="profile-password-badge">
                    <ShieldCheck size={16} />
                    Khu vực bảo mật
                  </span>
                </div>

                <div className="profile-password-grid">
                  <div className="profile-password-intro">
                    <div className="profile-password-icon">
                      <KeyRound size={24} />
                    </div>
                    <div className="page-stack" style={{ gap: '10px' }}>
                      <p className="profile-note-title">Tăng độ an toàn cho tài khoản</p>
                      <p className="muted-text">
                        Nên dùng mật khẩu dài, có chữ hoa, chữ thường và ký tự đặc biệt để bảo vệ tài khoản của bạn.
                      </p>
                    </div>
                  </div>

                  <div className="page-stack" style={{ gap: '18px' }}>
                    <div>
                      <label className="field-label" htmlFor="oldPassword">
                        Mật khẩu cũ
                      </label>
                      <div className="input-shell">
                        <KeyRound size={18} />
                        <input
                          id="oldPassword"
                          className="input-field"
                          type="password"
                          name="oldPassword"
                          value={formData.oldPassword}
                          onChange={handleChange}
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="field-label" htmlFor="password">
                        Mật khẩu mới
                      </label>
                      <div className="input-shell">
                        <KeyRound size={18} />
                        <input
                          id="password"
                          className="input-field"
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Tối thiểu 8 ký tự"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="field-label" htmlFor="confirmPassword">
                        Xác nhận mật khẩu mới
                      </label>
                      <div className="input-shell">
                        <KeyRound size={18} />
                        <input
                          id="confirmPassword"
                          className="input-field"
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Nhập lại để xác nhận"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {message.text ? <div className={`status-message ${message.type}`}>{message.text}</div> : null}

              <button type="submit" className="btn-primary profile-submit" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
