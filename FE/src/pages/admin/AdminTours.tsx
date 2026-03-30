import React, { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Eye, MapPin, User } from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, Tour } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatVND } from '../../utils/format';

const AdminTours: React.FC = () => {
  const [pendingTours, setPendingTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const resp = await api.get<ApiResponse<Tour[]>>(ENDPOINTS.TOUR.BASE + '/pending');
      setPendingTours(resp.data.result);
    } catch (err) {
      console.error('Failed to fetch pending tours:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleProcessTour = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
    setProcessing(id);
    try {
      await api.patch(ENDPOINTS.TOUR.BASE + `/${id}/status?status=${status}`);
      alert(`Da ${status === 'ACTIVE' ? 'phe duyet' : 'tu choi'} tour thanh cong.`);
      fetchTours();
    } catch {
      alert('Loi khi xu ly tour.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-stack" style={{ padding: '32px 0' }}>
        <section className="section-heading">
          <span className="eyebrow">Content review</span>
          <h1 className="page-title">Phe duyet tour moi</h1>
          <p className="page-subtitle">Kiem tra cac bai dang tu huong dan vien truoc khi cho phep hien thi cong khai.</p>
        </section>

        {loading ? (
          <div className="glass-panel empty-state">
            <p className="page-subtitle">Dang tai danh sach tour cho duyet...</p>
          </div>
        ) : pendingTours.length === 0 ? (
          <div className="glass-panel empty-state">
            <AlertCircle size={42} style={{ opacity: 0.25, margin: '0 auto 12px' }} />
            <p className="page-subtitle">Khong co tour nao dang cho phe duyet.</p>
          </div>
        ) : (
          <div className="booking-list">
            {pendingTours.map((tour) => (
              <article key={tour.id} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '18px', alignItems: 'start' }}>
                  <img
                    src={tour.imageUrl || '/placeholder-tour.jpg'}
                    alt={tour.title}
                    style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '20px' }}
                  />

                  <div className="page-stack" style={{ gap: '12px' }}>
                    <h2 className="section-title">{tour.title}</h2>
                    <div className="split-fields">
                      <div className="info-pair">
                        <User size={16} />
                        {tour.guideName}
                      </div>
                      <div className="info-pair">
                        <MapPin size={16} />
                        {tour.locationName}
                      </div>
                      <div className="info-pair">
                        <Calendar size={16} />
                        {tour.startDate} - {tour.endDate}
                      </div>
                      <div className="price-value" style={{ fontSize: '1.05rem' }}>{formatVND(tour.price)}</div>
                    </div>
                    <div className="booking-box">
                      <p className="muted-text" style={{ lineHeight: 1.7 }}>{tour.description}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '10px', minWidth: '190px' }}>
                    <button type="button" className="btn-success" onClick={() => handleProcessTour(tour.id, 'ACTIVE')} disabled={!!processing}>
                      Phe duyet
                    </button>
                    <button type="button" className="btn-danger-outline" onClick={() => handleProcessTour(tour.id, 'REJECTED')} disabled={!!processing}>
                      Yeu cau sua
                    </button>
                    <a href={`/tours/${tour.id}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: 'none' }}>
                      <Eye size={16} />
                      Xem bai dang
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminTours;
