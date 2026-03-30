import React, { useEffect, useState } from 'react';
import { Key, Mail, Phone, Save, User } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { ENDPOINTS } from '../constants/endpoints';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
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
      const token = localStorage.getItem('token');
      const response = await fetch(ENDPOINTS.USER.MY_INFO, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          password: formData.password || undefined,
          biography: formData.biography,
          languages: formData.languages,
          yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
          specialties: formData.specialties,
        }),
      });

      const data = await response.json();
      if (data.code === 1000) {
        setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công.' });
        await refreshUser();
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        setMessage({ type: 'error', text: data.message || 'Cập nhật thất bại.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-stack">
        <section className="section-heading">
          <span className="eyebrow">Account center</span>
          <h1 className="page-title">Hồ sơ của bạn</h1>
          <p className="page-subtitle">
            Quản lý thông tin tài khoản và cập nhật các chi tiết quan trọng trong cùng một không
            gian nhất quán hơn.
          </p>
        </section>

        <div className="profile-grid">
          <aside className="glass-panel profile-sidebar">
            <span className="avatar-large">
              <User size={54} />
            </span>
            <div>
              <h2 className="section-title">{user?.fullName || 'Thành viên TravelX'}</h2>
              <p className="page-subtitle" style={{ marginTop: '8px' }}>
                {user?.email}
              </p>
            </div>

            <div className="role-list">
              {user?.roles?.map((role) => (
                <span key={role.name} className="badge badge-primary">
                  {role.name === 'ADMIN'
                    ? 'Quản trị'
                    : role.name === 'GUIDE'
                      ? 'Hướng dẫn viên'
                      : 'Khách hàng'}
                </span>
              ))}
            </div>
          </aside>

          <section className="glass-panel profile-form">
            <form className="page-stack" onSubmit={handleSubmit} style={{ gap: '22px' }}>
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
                  />
                </div>
              </div>

              <div>
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

              {isGuide && (
                <>
                  <hr className="divider" />
                  <div className="section-heading" style={{ gap: '6px' }}>
                    <h2 className="section-title">Thông tin hướng dẫn viên</h2>
                    <p className="muted-text">Những thông tin này giúp khách hàng (và AI trợ lý) hiểu rõ hơn về năng lực của bạn.</p>
                  </div>

                  <div>
                    <label className="field-label">Giới thiệu bản thân (Biography)</label>
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
                      <label className="field-label">Ngôn ngữ</label>
                      <input
                        className="input-field"
                        type="text"
                        name="languages"
                        value={formData.languages}
                        onChange={handleChange}
                        placeholder="Ví dụ: Tiếng Việt, Tiếng Anh"
                      />
                    </div>
                    <div>
                      <label className="field-label">Số năm kinh nghiệm</label>
                      <input
                        className="input-field"
                        type="number"
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleChange}
                        placeholder="Ví dụ: 3"
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
                </>
              )}

              <hr className="divider" />

              <div className="section-heading" style={{ gap: '6px' }}>
                <h2 className="section-title">Đổi mật khẩu</h2>
                <p className="muted-text">Để trống nếu bạn chưa muốn cập nhật trong lần này.</p>
              </div>

              {message.text ? <div className={`status-message ${message.type}`}>{message.text}</div> : null}

              <div>
                <label className="field-label" htmlFor="password">
                  Mật khẩu mới
                </label>
                <div className="input-shell">
                  <Key size={18} />
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
                  <Key size={18} />
                  <input
                    id="confirmPassword"
                    className="input-field"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                <Save size={18} />
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
