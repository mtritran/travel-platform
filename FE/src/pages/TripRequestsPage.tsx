import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  User, 
  Plus,
  AlertCircle,
  Users,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import api from '../services/api';
import { formatVND } from '../utils/format';
import type { ApiResponse } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface TourRequest {
  id: string;
  userName: string;
  locationName: string;
  title: string;
  description: string;
  plannedDate: string;
  budget?: number;
  numberOfGuests: number;
  status: 'OPEN' | 'MATCHED' | 'CANCELLED';
  guideName?: string;
}

const TripRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications } = useNotification();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'MY' | 'ACCEPTED'>('OPEN');

  const isGuide = user?.roles?.some(r => r.name === 'GUIDE');

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = ENDPOINTS.TOUR_REQUEST.GET_ALL;
      if (activeTab === 'MY') url = ENDPOINTS.TOUR_REQUEST.GET_MY;
      if (activeTab === 'ACCEPTED') url = ENDPOINTS.TOUR_REQUEST.GET_ACCEPTED;

      const response = await api.get<ApiResponse<TourRequest[]>>(url);
      setRequests(response.data.result);
    } catch (err) {
      console.error("Failed to fetch tour requests:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Default tab based on role
    if (!isGuide) {
      setActiveTab('MY');
    }
  }, [isGuide]);

  useEffect(() => {
    fetchRequests();
  }, [activeTab, isGuide]);

  // Real-time update logic
  useEffect(() => {
    const latestNotif = notifications[0];
    if (latestNotif?.type === 'NEW_TOUR_REQUEST' || latestNotif?.type === 'TOUR_REQUEST_MATCHED') {
       fetchRequests(true); // Silent refresh
    }
  }, [notifications]);

  const handleAcceptRequest = async (id: string) => {
    try {
      await api.post(ENDPOINTS.TOUR_REQUEST.ACCEPT(id));
      fetchRequests();
      alert("Bạn đã nhận thành công yêu cầu này!");
    } catch (err) {
      console.error("Failed to accept request:", err);
      alert("Lỗi khi nhận yêu cầu.");
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', marginTop: '24px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>Yêu cầu chuyến đi</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isGuide ? 'Tìm kiếm khách hàng tiềm năng hoặc quản lý yêu cầu đã nhận' : 'Khám phá các yêu cầu từ cộng đồng hoặc quản lý yêu cầu của bạn'}
          </p>
        </div>
        {!isGuide && (
          <button 
            onClick={() => navigate('/customer/create-request')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 24px', 
              background: 'var(--primary)', 
              color: 'white',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Plus size={20} /> Đăng yêu cầu mới
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2px' }}>
         {isGuide && (
           <button 
             onClick={() => setActiveTab('OPEN')}
             style={{ 
               padding: '12px 24px', 
               background: activeTab === 'OPEN' ? 'var(--primary-light)' : 'transparent',
               color: activeTab === 'OPEN' ? 'var(--primary)' : 'var(--text-secondary)',
               border: 'none',
               borderBottom: activeTab === 'OPEN' ? '3px solid var(--primary)' : '3px solid transparent',
               fontWeight: '700',
               cursor: 'pointer'
             }}
           >
             Yêu cầu Đang mở
           </button>
         )}
         <button 
           onClick={() => setActiveTab('MY')}
           style={{ 
             padding: '12px 24px', 
             background: activeTab === 'MY' ? 'var(--primary-light)' : 'transparent',
             color: activeTab === 'MY' ? 'var(--primary)' : 'var(--text-secondary)',
             border: 'none',
             borderBottom: activeTab === 'MY' ? '3px solid var(--primary)' : '3px solid transparent',
             fontWeight: '700',
             cursor: 'pointer'
           }}
         >
           {isGuide ? 'Yêu cầu của tôi (đăng với tư cách khách)' : 'Yêu cầu của tôi'}
         </button>
         {isGuide && (
           <button 
             onClick={() => setActiveTab('ACCEPTED')}
             style={{ 
               padding: '12px 24px', 
               background: activeTab === 'ACCEPTED' ? 'var(--primary-light)' : 'transparent',
               color: activeTab === 'ACCEPTED' ? 'var(--primary)' : 'var(--text-secondary)',
               border: 'none',
               borderBottom: activeTab === 'ACCEPTED' ? '3px solid var(--primary)' : '3px solid transparent',
               fontWeight: '700',
               cursor: 'pointer'
             }}
           >
             Yêu cầu đã nhận
           </button>
         )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {requests.length > 0 ? requests.map((req) => (
            <div key={req.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{req.userName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                       {activeTab === 'ACCEPTED' ? 'Đã khớp (Matched)' : 'Yêu cầu du lịch'}
                    </p>
                  </div>
                </div>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  fontWeight: '700',
                  background: req.status === 'OPEN' ? '#ecfdf5' : req.status === 'MATCHED' ? '#eff6ff' : '#f1f5f9',
                  color: req.status === 'OPEN' ? '#065f46' : req.status === 'MATCHED' ? '#1e40af' : '#475569',
                  border: `1px solid ${req.status === 'OPEN' ? '#a7f3d0' : req.status === 'MATCHED' ? '#bfdbfe' : '#e2e8f0'}`
                }}>
                  {req.status === 'OPEN' ? 'ĐANG MỞ' : req.status === 'MATCHED' ? 'ĐÃ KHỚP' : 'ĐÃ HỦY'}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>{req.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6', flex: 1, fontStyle: 'italic' }}>
                  "{req.description}"
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '12px', background: 'var(--surface)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="var(--primary)" /> {req.locationName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} color="var(--primary)" /> {new Date(req.plannedDate).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>
                  Ngân sách: {req.budget ? formatVND(req.budget) : 'Thỏa thuận'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <Users size={14} /> {req.numberOfGuests} người
                </span>
              </div>

              {/* Status Specific UI */}
              {req.status === 'MATCHED' && (
                 <div style={{ marginTop: '8px', padding: '12px', background: 'var(--primary-light)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '4px' }}>
                       <CheckCircle2 size={16} />
                       <span style={{ fontWeight: '700', fontSize: '0.875rem' }}>Đã liên kết với HDV</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                       <strong>HDV:</strong> {req.guideName || 'Sẵn sàng'}
                    </p>
                    {activeTab === 'ACCEPTED' && (
                        <button 
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                background: 'var(--primary)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '8px',
                                fontWeight: '700',
                                marginTop: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                            onClick={() => alert("Tính năng Tạo Proposal đang hoàn thiện. Chatbot sẽ hỗ trợ bạn thương lượng!")}
                        >
                            <Briefcase size={16} /> Tạo Proposal & Booking
                        </button>
                    )}
                 </div>
              )}

              {isGuide && req.status === 'OPEN' && activeTab === 'OPEN' && (
                <button 
                  onClick={() => handleAcceptRequest(req.id)}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    background: 'var(--success)', 
                    color: 'white', 
                    fontWeight: '700',
                    marginTop: '8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Clock size={18} /> Nhận yêu cầu này
                </button>
              )}
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0' }} className="glass-panel">
               <AlertCircle size={48} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '16px' }} />
               <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                  {activeTab === 'OPEN' ? 'Hiện tại không có yêu cầu tour nào đang mở.' : 
                   activeTab === 'MY' ? 'Bạn chưa đăng yêu cầu tour nào.' : 
                   'Bạn chưa nhận yêu cầu tour nào.'}
               </p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default TripRequestsPage;
