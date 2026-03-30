import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Phone, User, Globe, Award, Briefcase } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';
import type { User as UserType } from '../types';

const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/profile/${id}`);
        setProfile(response.data.result);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) return <DashboardLayout><div className="glass-panel empty-state">Đang tải hồ sơ...</div></DashboardLayout>;
  if (!profile) return <DashboardLayout><div className="glass-panel empty-state">Không tìm thấy hồ sơ hướng dẫn viên.</div></DashboardLayout>;

  const isGuide = profile.roles?.some(r => r.name === 'GUIDE');

  return (
    <DashboardLayout>
      <div className="page-stack">
        <section className="section-heading">
          <span className="eyebrow">Guide Directory</span>
          <h1 className="page-title">Hồ sơ hướng dẫn viên</h1>
          <p className="page-subtitle">Xem thông tin chi tiết và năng lực chuyên môn của đối tác trước khi xác nhận chuyến đi.</p>
        </section>

        <div className="profile-grid">
           <aside className="glass-panel profile-sidebar">
              <span className="avatar-large">
                <User size={54} />
              </span>
              <div>
                <h2 className="section-title">{profile.fullName}</h2>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {profile.roles?.map(role => (
                    <span key={role.name} className="badge badge-primary">
                      {role.name === 'GUIDE' ? 'Hướng dẫn viên' : 'Thành viên'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="booking-box" style={{ width: '100%', textAlign: 'left', display: 'grid', gap: '14px' }}>
                 <div className="info-pair">
                    <Mail size={16} color="var(--primary)" />
                    <span style={{ fontSize: '0.9rem' }}>{profile.email}</span>
                 </div>
                 <div className="info-pair">
                    <Phone size={16} color="var(--primary)" />
                    <span style={{ fontSize: '0.9rem' }}>{profile.phone}</span>
                 </div>
              </div>
           </aside>

           <main className="page-stack" style={{ gap: '24px' }}>
              {isGuide ? (
                 <>
                    <section className="glass-panel" style={{ padding: '32px' }}>
                       <div className="section-heading" style={{ gap: '16px' }}>
                          <h3 className="section-title" style={{ fontSize: '1.4rem', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                             <Award size={24} color="var(--primary)" />
                             Giới thiệu chuyên môn
                          </h3>
                          <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                             {profile.biography || 'Hướng dẫn viên này chưa cập nhật phần giới thiệu bản thân.'}
                          </p>
                       </div>
                    </section>

                    <div className="feature-grid">
                       <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                             <div style={{ background: 'var(--primary-soft)', padding: '12px', borderRadius: '12px' }}>
                                <Globe size={24} color="var(--primary)" />
                             </div>
                          </div>
                          <span className="price-label">Ngôn ngữ</span>
                          <p style={{ fontWeight: 800, marginTop: '8px', fontSize: '1.1rem' }}>{profile.languages || 'Tiếng Việt'}</p>
                       </div>

                       <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                             <div style={{ background: 'var(--primary-soft)', padding: '12px', borderRadius: '12px' }}>
                                <Briefcase size={24} color="var(--primary)" />
                             </div>
                          </div>
                          <span className="price-label">Kinh nghiệm</span>
                          <p style={{ fontWeight: 800, marginTop: '8px', fontSize: '1.1rem' }}>{profile.yearsOfExperience || 0} năm</p>
                       </div>

                       <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                             <div style={{ background: 'var(--primary-soft)', padding: '12px', borderRadius: '12px' }}>
                                <Award size={24} color="var(--primary)" />
                             </div>
                          </div>
                          <span className="price-label">Sở trường</span>
                          <p style={{ fontWeight: 800, marginTop: '8px', fontSize: '1.1rem' }}>{profile.specialties || 'Lịch sử, Văn hóa'}</p>
                       </div>
                    </div>
                 </>
              ) : (
                <section className="glass-panel" style={{ padding: '32px' }}>
                  <p className="muted-text">Đây là hồ sơ của thành viên TravelX.</p>
                </section>
              )}
           </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PublicProfilePage;
