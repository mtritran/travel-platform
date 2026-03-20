import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Grid, List as ListIcon, Star, Filter } from 'lucide-react';
import api from '../services/api';
import type { Tour, ApiResponse } from '../types';
import DashboardLayout from '../layouts/DashboardLayout';
import { ENDPOINTS } from '../constants/endpoints';
import { formatVND } from '../utils/format';

const MarketplacePage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const response = await api.get<ApiResponse<Tour[]>>(ENDPOINTS.TOUR.GET_ALL);
        setTours(response.data.result);
      } catch (err) {
        console.error("Failed to fetch tours:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  const filteredTours = tours.filter(tour => {
    // 1. Text Search Filter
    const matchesSearch = tour.title.toLowerCase().includes(search.toLowerCase()) || 
                         tour.locationName.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Expiry Filter (Safety net for FE)
    const now = new Date();
    // tour.startDate is YYYY-MM-DD, tour.startTime is HH:mm
    const tourStartTime = new Date(`${tour.startDate}T${tour.startTime}`);
    
    return tourStartTime > now;
  });

  return (
    <DashboardLayout>
      {/* Hero / Filter Section */}
      <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '24px' }}>
          Khám phá hành trình tiếp theo của bạn
        </h2>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên tour hoặc địa điểm..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '48px', height: '52px' }}
            />
          </div>
          <button style={{ height: '52px', padding: '0 24px', background: 'var(--surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
            <Filter size={18} /> Bộ lọc
          </button>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--glass-border)', padding: '4px', borderRadius: '12px' }}>
            <button style={{ padding: '8px', background: 'var(--primary)', color: 'white' }}><Grid size={18} /></button>
            <button style={{ padding: '8px', background: 'none', color: 'var(--text-secondary)' }}><ListIcon size={18} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách tour...</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '24px' 
        }}>
          {filteredTours.length > 0 ? filteredTours.map((tour) => (
            <div 
              key={tour.id} 
              className="glass-card" 
              onClick={() => navigate(`/tours/${tour.id}`)}
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
            >
              {/* Image */}
              <div style={{ height: '220px', position: 'relative' }}>
                <img 
                  src={tour.imageUrl || 'https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&q=80&w=800'} 
                  alt={tour.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)' }}>
                   <Star size={14} fill="currentColor" /> {tour.rating !== 0 ? tour.rating.toFixed(1) : '5.0'}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>
                   <MapPin size={14} style={{ marginTop: '3px', flexShrink: 0 }} /> 
                   <span style={{ lineHeight: '1.4' }}>{tour.locationName}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>{tour.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>
                  {tour.description.length > 120 ? tour.description.substring(0, 120) + '...' : tour.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Giá mỗi người</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
                      {formatVND(tour.price)}
                    </p>
                  </div>
                  <button style={{ 
                    padding: '10px 20px', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                  }}>
                    Đặt ngay
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0' }}>
               <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Không tìm thấy tour nào phù hợp với tìm kiếm của bạn.</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MarketplacePage;
