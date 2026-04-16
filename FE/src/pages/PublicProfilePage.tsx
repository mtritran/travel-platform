import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Phone, User, Globe, Award, Briefcase, Star } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import api from '../services/api';
import { ENDPOINTS } from '../constants/endpoints';
import { getFileUrl } from '../utils/format';
import type { User as UserType, ApiResponse, Review } from '../types';

const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
            api.get<ApiResponse<UserType>>(`/users/profile/${id}`),
            api.get<ApiResponse<Review[]>>(ENDPOINTS.REVIEW.GET_BY_GUIDE(id!))
        ]);
        
        setProfile(profileRes.data.result);
        setReviews(reviewsRes.data.result);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <DashboardLayout><div className="glass-panel empty-state">Đang tải hồ sơ...</div></DashboardLayout>;
  if (!profile) return <DashboardLayout><div className="glass-panel empty-state">Không tìm thấy hồ sơ hướng dẫn viên.</div></DashboardLayout>;

  const isGuide = profile.roles?.some(r => r.name === 'GUIDE');
  
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <DashboardLayout>
      <div className="page-stack">
        <section className="section-heading">
          <span className="eyebrow">Guide Directory</span>
          <h1 className="page-title">Hồ sơ hướng dẫn viên</h1>
          <p className="page-subtitle">Xem thông tin chi tiết và năng lực chuyên môn của đối tác trước khi xác nhận chuyến đi.</p>
        </section>

        <div className="profile-grid">
            <aside className="glass-panel profile-sidebar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
               <span className="avatar-large">
                 {profile.avatarUrl ? (
                   <img src={getFileUrl(profile.avatarUrl)} alt={profile.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 ) : (
                   <User size={54} />
                 )}
               </span>
               <div style={{ width: '100%' }}>
                 <h2 className="section-title" style={{ margin: '0 0 8px 0' }}>{profile.fullName}</h2>
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {profile.roles?.map(role => (
                    <span key={role.name} className="badge badge-primary">
                      {role.name === 'GUIDE' ? 'Hướng dẫn viên' : 'Thành viên'}
                    </span>
                  ))}
                  {isGuide && (
                    <span className="badge badge-secondary">
                        <Star size={14} fill={averageRating ? 'currentColor' : 'transparent'} />
                        {averageRating ? `${averageRating} (${reviews.length})` : 'Chưa có'}
                    </span>
                  )}
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

                    <section className="glass-panel" style={{ padding: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
                        <div>
                          <h2 className="section-title">Đánh giá từ khách hàng</h2>
                          <p className="muted-text" style={{ marginTop: '6px' }}>Cảm nhận từ những người đã từng đồng hành.</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{averageRating}</div>
                            <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={12} fill={s <= Math.round(Number(averageRating)) ? 'var(--secondary)' : 'transparent'} color="var(--secondary)" />
                                ))}
                            </div>
                        </div>
                      </div>

                      {reviews.length === 0 ? (
                        <div className="empty-state" style={{ paddingBottom: 0 }}>
                          <p className="muted-text">Chưa có đánh giá nào cho hướng dẫn viên này.</p>
                        </div>
                      ) : (
                        <div className="review-list" style={{ marginTop: '24px' }}>
                          {reviews.map((review) => (
                            <article key={review.id} className="review-card">
                              <div className="review-head">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span className="avatar-review">{review.userName.charAt(0)}</span>
                                  <div>
                                    <div style={{ fontWeight: 800 }}>{review.userName}</div>
                                    <div className="muted-text" style={{ fontSize: '0.8rem' }}>
                                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={14}
                                      fill={star <= review.rating ? '#d97706' : 'transparent'}
                                      color={star <= review.rating ? '#d97706' : '#d6d3d1'}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p style={{ lineHeight: 1.7, fontStyle: 'italic' }}>"{review.comment}"</p>
                              {review.tourTitle && (
                                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                                    Tour: {review.tourTitle}
                                </div>
                              )}
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
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
