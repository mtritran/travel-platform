import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Info,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  Users,
  Phone,
  Wallet,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import api from '../services/api';
import { formatVND } from '../utils/format';
import { ENDPOINTS } from '../constants/endpoints';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import type { ApiResponse, Role, TourRequest } from '../types';
import ReviewModal from '../components/ReviewModal';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const TripRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications } = useNotification();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'MY' | 'ACCEPTED'>('OPEN');
  const [interestLoading, setInterestLoading] = useState<string | null>(null);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<TourRequest | null>(null);
  
  // Payment states
  const [payingRequest, setPayingRequest] = useState<{ id: string, type: 'DEPOSIT' | 'REMAINING', title: string, amount: number } | null>(null);
  const [vnpayBankCode, setVnpayBankCode] = useState<'' | 'VNPAYQR'>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // AI Recommendation states
  const [aiRecommendation, setAiRecommendation] = useState<{ id: string, text: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'success' | 'error' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const { showToast } = useNotification();

  const isGuide = user?.roles?.some((role: Role) => role.name === 'GUIDE');

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = ENDPOINTS.TOUR_REQUEST.GET_ALL;
      if (activeTab === 'MY') url = ENDPOINTS.TOUR_REQUEST.GET_MY;
      if (activeTab === 'ACCEPTED') url = ENDPOINTS.TOUR_REQUEST.GET_ACCEPTED;

      const response = await api.get<ApiResponse<TourRequest[]>>(url);
      setRequests(response.data.result);
    } catch (err) {
      console.error('Failed to fetch tour requests:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(isGuide ? 'OPEN' : 'MY');
  }, [isGuide]);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  useEffect(() => {
    const latestNotif = notifications[0];
    if (
      latestNotif?.type === 'NEW_TOUR_REQUEST' ||
      latestNotif?.type === 'TOUR_REQUEST_MATCHED' ||
      latestNotif?.type === 'NEW_GUIDE_INTEREST' ||
      latestNotif?.type === 'TOUR_REQUEST_SELECTED' ||
      latestNotif?.type === 'TOUR_REQUEST_DECLINED'
    ) {
      fetchRequests(true);
    }
  }, [notifications]);

  const withApiError = (err: unknown, fallback: string) => {
    const apiError = err as ApiError;
    return apiError.response?.data?.message || fallback;
  };

  const handleInterested = (requestId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Xác nhận đi tour',
      message: 'Bạn xác nhận có thể đi tour này? Khách hàng sẽ thấy thông tin của bạn để lựa chọn.',
      onConfirm: async () => {
        setModal(null);
        setInterestLoading(requestId);
        try {
          await api.post(
            ENDPOINTS.TOUR_REQUEST.INTEREST(requestId) + `?message=`,
          );
          showToast('Đã gửi sự quan tâm thành công!', 'success');
          fetchRequests(true);
        } catch (err) {
          showToast(withApiError(err, 'Lỗi khi gửi yêu cầu.'), 'error');
        } finally {
          setInterestLoading(null);
        }
      }
    });
  };

  const handleSelectGuide = (requestId: string, guideId: string, guideName: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Xác nhận Chọn Hướng Dẫn Viên',
      message: `Bạn có chắc chắn muốn chọn HDV ${guideName} cho chuyến đi này không?`,
      onConfirm: async () => {
        setModal(null);
        try {
          await api.post(ENDPOINTS.TOUR_REQUEST.SELECT_GUIDE(requestId, guideId));
          showToast('Đã gửi yêu cầu tới hướng dẫn viên.', 'success');
          fetchRequests();
        } catch (err) {
          showToast(withApiError(err, 'Lỗi khi chọn HDV.'), 'error');
        }
      }
    });
  };

  const handleConfirmMatch = async (requestId: string) => {
    try {
      await api.post(ENDPOINTS.TOUR_REQUEST.CONFIRM_MATCH(requestId));
      showToast('Bạn đã xác nhận nhận tour này.', 'success');
      fetchRequests();
    } catch (err) {
      showToast(withApiError(err, 'Lỗi khi xác nhận.'), 'error');
    }
  };

  const handleDeclineMatch = (requestId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Từ Chối Yêu Cầu',
      message: 'Bạn có chắc chắn muốn từ chối yêu cầu này không?',
      onConfirm: async () => {
        setModal(null);
        try {
          await api.post(ENDPOINTS.TOUR_REQUEST.DECLINE_MATCH(requestId));
          showToast('Đã từ chối yêu cầu.', 'success');
          fetchRequests();
        } catch (err) {
          showToast(withApiError(err, 'Lỗi khi từ chối.'), 'error');
        }
      }
    });
  };

  const handleCancelMatch = (requestId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Hủy Lựa Chọn',
      message: 'Bạn có chắc muốn hủy lựa chọn này và cho phép các HDV khác ứng tuyển lại không?',
      onConfirm: async () => {
        setModal(null);
        try {
          await api.post(ENDPOINTS.TOUR_REQUEST.CANCEL_MATCH(requestId));
          fetchRequests();
          showToast('Đã hủy lựa chọn HDV.', 'info');
        } catch (err) {
          showToast(withApiError(err, 'Lỗi khi hủy lựa chọn.'), 'error');
        }
      }
    });
  };

  const handleDeleteRequest = (requestId: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Xóa Yêu Cầu',
      message: 'Bạn có chắc chắn muốn xóa yêu cầu này không?',
      onConfirm: async () => {
        setModal(null);
        try {
          await api.delete(ENDPOINTS.TOUR_REQUEST.DELETE(requestId));
          showToast('Xóa yêu cầu thành công.', 'success');
          fetchRequests();
        } catch (err) {
          showToast(withApiError(err, 'Lỗi khi xóa yêu cầu.'), 'error');
        }
      }
    });
  };

  const handleEditRequest = (req: TourRequest) => {
    navigate('/customer/create-request', { state: { editMode: true, request: req } });
  };

  const handlePayment = async () => {
    if (!payingRequest) return;
    setIsProcessingPayment(true);
    try {
      const response = await api.get<ApiResponse<string>>(
        ENDPOINTS.PAYMENT.CREATE_VNPAY_REQUEST(payingRequest.id, payingRequest.type, vnpayBankCode || undefined),
      );
      if (response.data.result) {
        window.location.href = response.data.result;
      }
    } catch (err) {
      showToast(withApiError(err, 'Không thể tạo liên kết thanh toán lúc này.'), 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayDeposit = (req: TourRequest) => {
    setPayingRequest({
      id: req.id,
      type: 'DEPOSIT',
      title: req.title,
      amount: req.depositAmount || 0
    });
    setVnpayBankCode('');
  };

  const handlePayRemaining = (req: TourRequest) => {
    setPayingRequest({
      id: req.id,
      type: 'REMAINING',
      title: req.title,
      amount: (req.budget || 0) - (req.paidAmount || 0)
    });
    setVnpayBankCode('');
  };

  const handleCompleteTour = (id: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Xác Nhận Hoàn Tất',
      message: 'Bạn xác nhận hành trình này đã kết thúc tốt đẹp?',
      onConfirm: async () => {
        setModal(null);
        try {
          await api.post(ENDPOINTS.TOUR_REQUEST.COMPLETE(id));
          showToast('Chuyến đi đã được hoàn tất.', 'success');
          fetchRequests();
        } catch (err) {
          showToast(withApiError(err, 'Không thể hoàn tất tour.'), 'error');
        }
      }
    });
  };

  const handleFetchAiRecommendation = async (requestId: string) => {
    setIsAiLoading(requestId);
    try {
      const response = await api.get<ApiResponse<string>>(ENDPOINTS.TOUR_REQUEST.AI_RECOMMENDATIONS(requestId));
      setAiRecommendation({ id: requestId, text: response.data.result });
    } catch (err) {
      showToast(withApiError(err, 'Không thể lấy gợi ý AI lúc này.'), 'error');
    } finally {
      setIsAiLoading(null);
    }
  };

  const handleIndexGuides = async () => {
    if (!window.confirm('Bạn muốn bắt đầu đồng bộ hóa dữ liệu HDV vào AI? (Chỉ dành cho Admin)')) return;
    try {
      await api.post(ENDPOINTS.TOUR_REQUEST.AI_INDEX_GUIDES);
      showToast('Đã bắt đầu đồng bộ hóa dữ liệu AI.', 'info');
    } catch (err) {
      showToast('Lỗi khi đồng bộ dữ liệu AI.', 'error');
    }
  };

  const getTimeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return 'Đã hết hạn';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `Còn ${hours} giờ ${mins} phút` : `Còn ${mins} phút`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { className: 'badge badge-success', label: 'Đang mở' };
      case 'PENDING_CONFIRMATION':
        return { className: 'badge badge-secondary', label: 'Chờ HDV xác nhận' };
      case 'MATCHED':
        return { className: 'badge badge-primary', label: 'Đã khớp' };
      case 'EXPIRED':
        return { className: 'badge', label: 'Hết hạn', style: { background: 'var(--danger-soft)', color: 'var(--danger)' } };
      case 'CONFIRMED':
        return { className: 'badge badge-success', label: 'Đã xác nhận' };
      case 'WAITING_PAYMENT':
        return { className: 'badge badge-secondary', label: 'Chờ thanh toán' };
      case 'COMPLETED':
        return { className: 'badge badge-success', label: 'Hoàn tất' };
      default:
        return { className: 'badge', label: status, style: { background: 'var(--surface-muted)', color: 'var(--text-secondary)' } };
    }
  };

  return (
    <DashboardLayout>
      <div className="page-stack">
        <section style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="section-heading">
            <span className="eyebrow">Trip matching</span>
            <h1 className="page-title">Yêu cầu chuyến đi</h1>
            <p className="page-subtitle">
              {isGuide
                ? 'Tìm kiếm khách hàng tiềm năng hoặc quản lý các yêu cầu bạn đã nhận.'
                : 'Đăng nhu cầu mới, theo dõi danh sách guide quan tâm và xử lý thanh toán theo từng giai đoạn.'}
            </p>
          </div>

          {!isGuide ? (
            <button type="button" className="btn-primary" onClick={() => navigate('/customer/create-request')}>
              <Plus size={18} />
              Đăng yêu cầu mới
            </button>
          ) : null}
          {user?.roles?.some((r: Role) => r.name === 'ADMIN') ? (
            <button type="button" className="btn-secondary" onClick={handleIndexGuides} style={{ fontSize: '0.8rem' }}>
              Sync AI
            </button>
          ) : null}
        </section>

        <div className="tab-strip">
          {isGuide ? (
            <button type="button" className={`tab-button${activeTab === 'OPEN' ? ' active' : ''}`} onClick={() => setActiveTab('OPEN')}>
              Yêu cầu đang mở
            </button>
          ) : null}
          <button type="button" className={`tab-button${activeTab === 'MY' ? ' active' : ''}`} onClick={() => setActiveTab('MY')}>
            {isGuide ? 'Yêu cầu của tôi' : 'Yêu cầu của tôi'}
          </button>
          {isGuide ? (
            <button
              type="button"
              className={`tab-button${activeTab === 'ACCEPTED' ? ' active' : ''}`}
              onClick={() => setActiveTab('ACCEPTED')}
            >
              Yêu cầu đã nhận
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="glass-panel empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '16px', opacity: 0.5 }} />
            <p className="page-subtitle">Đang tải danh sách yêu cầu...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="request-grid">
            {requests.map((req) => {
              const status = getStatusBadge(req.status);
              const myInterestSent = req.interestedGuides.some((item) => item.guideId === user?.id);

              return (
                <article key={req.id} className="glass-card request-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="avatar-pill">
                        <User size={18} />
                      </span>
                      <div>
                        <div style={{ fontWeight: 800 }}>{req.userName}</div>
                        <div className="muted-text" style={{ fontSize: '0.82rem' }}>
                          {req.status === 'MATCHED' ? 'Đã tìm được HDV' : 'Yêu cầu du lịch'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '6px', justifyItems: 'end' }}>
                      <span className={status.className} style={status.style}>
                        {status.label}
                      </span>
                      {req.status === 'OPEN' ? (
                        <span className="muted-text" style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>
                          {getTimeLeft(req.expiresAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                    <div className="section-heading" style={{ gap: '8px' }}>
                      <h2 className="section-title">{req.title}</h2>
                      <p className="muted-text" style={{ fontStyle: 'italic', lineHeight: 1.7 }}>
                        "{req.description}"
                      </p>
                    </div>

                    {activeTab === 'MY' && ['OPEN', 'EXPIRED'].includes(req.status) ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="icon-button" onClick={() => handleEditRequest(req)} title="Sửa yêu cầu">
                          <Edit size={16} />
                        </button>
                        <button type="button" className="icon-button" onClick={() => handleDeleteRequest(req.id)} title="Xóa yêu cầu">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="booking-box">
                    <div className="info-pair">
                      <MapPin size={14} />
                      {req.locationName || req.customLocationName || 'Địa điểm chưa xác định'}
                    </div>
                    <div className="info-pair" style={{ marginTop: '8px' }}>
                      <Calendar size={14} />
                      {new Date(req.plannedDate).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="info-pair" style={{ marginTop: '8px' }}>
                      <Clock size={14} />
                      {req.startTime} - {req.endTime}
                    </div>
                    <div className="info-pair" style={{ marginTop: '8px' }}>
                      <Users size={14} />
                      {req.numberOfGuests} người
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="price-value" style={{ fontSize: '1.1rem' }}>
                      {req.budget ? formatVND(req.budget) : 'Thỏa thuận'}
                    </span>

                    {activeTab === 'MY' && req.status === 'OPEN' ? (
                      <button 
                        type="button" 
                        className="btn-outline" 
                        style={{ 
                          borderColor: 'var(--primary)', 
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          borderRadius: '12px'
                        }}
                        onClick={() => handleFetchAiRecommendation(req.id)}
                        disabled={isAiLoading === req.id}
                      >
                        {isAiLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        Gợi ý từ AI
                      </button>
                    ) : null}
                  </div>

                  {activeTab === 'MY' && req.status === 'OPEN' ? (
                    <section className="booking-box">
                      <div className="section-heading" style={{ gap: '6px' }}>
                        <h3 className="section-title" style={{ fontSize: '1.05rem' }}>
                          Danh sách HDV quan tâm ({req.interestedGuides.length})
                        </h3>
                      </div>

                      <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                        {req.interestedGuides.length > 0 ? (
                          req.interestedGuides.map((interest, index) => (
                            <div key={interest.id} className="info-strip" style={{ justifyContent: 'space-between' }}>
                                <Link 
                                  to={`/profile/${interest.guideId}`} 
                                  style={{ fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}
                                  target="_blank"
                                >
                                  #{index + 1} {interest.guideName}
                                </Link>
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ minHeight: '40px' }}
                                onClick={() => handleSelectGuide(req.id, interest.guideId, interest.guideName)}
                              >
                                Chọn
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="muted-text">Chưa có HDV nào gửi quan tâm.</p>
                        )}
                      </div>
                    </section>
                  ) : null}

                  {req.status === 'PENDING_CONFIRMATION' ? (
                    <section 
                      className="glass-panel" 
                      style={{ 
                        background: isGuide ? 'rgba(15, 118, 110, 0.04)' : 'rgba(217, 119, 6, 0.04)', 
                        border: isGuide ? '2px dashed var(--primary-soft)' : '2px dashed var(--secondary-soft)', 
                        marginTop: '16px',
                        padding: '24px',
                        borderRadius: '24px'
                      }}
                    >
                      {isGuide ? (
                        <div className="page-stack" style={{ gap: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <div style={{ 
                              background: 'var(--primary-soft)', 
                              padding: '12px', 
                              borderRadius: '16px',
                              color: 'var(--primary)',
                              boxShadow: '0 8px 16px -4px rgba(15, 118, 110, 0.2)'
                            }}>
                              <ShieldCheck size={28} />
                            </div>
                            <div>
                              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>Bạn đã được chọn!</h3>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Giai đoạn này rất quan trọng. Vui lòng xác nhận sớm để bắt đầu chuẩn bị.</p>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                            <button 
                              className="btn-primary" 
                              style={{ 
                                height: '52px', 
                                borderRadius: '16px', 
                                fontWeight: 800,
                                boxShadow: '0 8px 16px -4px rgba(15, 118, 110, 0.3)'
                              }} 
                              onClick={() => handleConfirmMatch(req.id)}
                            >
                              Xác nhận ngay
                            </button>
                            <button 
                              className="btn-outline" 
                              style={{ 
                                height: '52px', 
                                borderRadius: '16px', 
                                fontWeight: 700, 
                                color: 'var(--danger)', 
                                borderColor: 'var(--danger-soft)' 
                              }} 
                              onClick={() => handleDeclineMatch(req.id)}
                            >
                              Từ chối
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="page-stack" style={{ gap: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <p style={{ fontWeight: 800, color: 'var(--secondary)', fontSize: '1.05rem' }}>Đang chờ HDV xác nhận lần cuối</p>
                            <p className="muted-text" style={{ fontSize: '0.875rem' }}>Hệ thống đã gửi thông báo tới <strong>{req.guideName}</strong>.</p>
                          </div>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            style={{ height: '48px', borderRadius: '14px', background: 'var(--surface-muted)', color: 'var(--text-primary)' }}
                            onClick={() => handleCancelMatch(req.id)}
                          >
                            Hủy và chọn người khác
                          </button>
                        </div>
                      )}
                    </section>
                  ) : null}

                  {['WAITING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'MATCHED'].includes(req.status) ? (
                    <section className="booking-box">
                      <div className="section-heading" style={{ gap: '6px' }}>
                        <h3 className="section-title" style={{ fontSize: '1.05rem' }}>
                          <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            <ShieldCheck size={16} />
                            Thông tin chuyến đi và liên hệ
                          </span>
                        </h3>
                      </div>

                      <div className="split-fields" style={{ marginTop: '12px' }}>
                        <div>
                          <div className="price-label">{activeTab === 'MY' ? 'Hướng dẫn viên' : 'Khách hàng'}</div>
                          <div className="booking-value">{activeTab === 'MY' ? req.guideName : req.customerName}</div>
                        </div>
                        <div>
                          <div className="price-label">Số điện thoại</div>
                          <a
                            href={`tel:${activeTab === 'MY' ? req.guidePhone : req.customerPhone}`}
                            className="subtle-link"
                            style={{ display: 'inline-block', marginTop: '6px' }}
                          >
                            {activeTab === 'MY' ? req.guidePhone : req.customerPhone}
                          </a>
                        </div>
                      </div>

                      {req.meetingLocationName ? (
                        <div className="info-strip" style={{ marginTop: '12px' }}>
                          <MapPin size={16} color="var(--primary)" />
                          <div>
                            <div style={{ fontWeight: 800 }}>{req.meetingLocationName}</div>
                            <div className="muted-text">
                              {req.startTime} - {req.endTime}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span className="muted-text">Tiến độ thanh toán</span>
                          <span style={{ fontWeight: 700 }}>
                            {req.paymentStatus === 'PAID_FULL'
                              ? 'Đã thanh toán 100%'
                              : req.paymentStatus === 'PAID_DEPOSIT'
                                ? 'Đã cọc 30%'
                                : 'Chưa thanh toán'}
                          </span>
                        </div>
                        <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              background: 'linear-gradient(135deg, var(--primary), #0891b2)',
                              width:
                                req.paymentStatus === 'PAID_FULL'
                                  ? '100%'
                                  : req.paymentStatus === 'PAID_DEPOSIT'
                                    ? '30%'
                                    : '0%',
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
                        {!isGuide && req.status === 'WAITING_PAYMENT' ? (
                          <button type="button" className="btn-primary" onClick={() => handlePayDeposit(req)}>
                            Thanh toán tiền cọc
                          </button>
                        ) : null}

                        {!isGuide && req.status === 'CONFIRMED' && req.paymentStatus === 'PAID_DEPOSIT' ? (
                          <button type="button" className="btn-primary" onClick={() => handlePayRemaining(req)}>
                            Thanh toán phần còn lại
                          </button>
                        ) : null}

                        {isGuide && req.status === 'CONFIRMED' && req.paymentStatus === 'PAID_FULL' ? (
                          <button 
                            type="button" 
                            className="btn-success" 
                            style={{ 
                              height: '52px', 
                              borderRadius: '16px', 
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '12px',
                              background: 'linear-gradient(135deg, #16a34a, #15803d)',
                              boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.3)',
                              border: 'none',
                              color: 'white',
                              width: '100%'
                            }}
                            onClick={() => handleCompleteTour(req.id)}
                          >
                            <ShieldCheck size={20} />
                            Hoàn tất chuyến đi
                          </button>
                        ) : null}

                        {req.status === 'COMPLETED' && !isGuide ? (
                          <button type="button" className="btn-success" onClick={() => setSelectedRequestForReview(req)}>
                            Đánh giá dịch vụ HDV
                          </button>
                        ) : null}

                        <a 
                          href={`tel:${activeTab === 'MY' ? req.guidePhone : req.customerPhone}`} 
                          className="btn-primary" 
                          style={{ 
                            height: '52px', 
                            borderRadius: '16px', 
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            textDecoration: 'none',
                            background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                            boxShadow: '0 8px 16px -4px rgba(15, 118, 110, 0.3)'
                          }}
                        >
                          <Phone size={20} />
                          Gọi {activeTab === 'MY' ? 'cho Hướng dẫn viên' : 'cho Khách hàng'}
                        </a>
                      </div>
                    </section>
                  ) : null}

                  {isGuide && req.status === 'OPEN' && activeTab === 'OPEN' ? (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{
                        width: '100%',
                        borderRadius: '20px',
                        height: '56px',
                        fontSize: '1rem',
                        fontWeight: 800,
                        marginTop: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)',
                        boxShadow: '0 12px 24px -8px rgba(15, 118, 110, 0.4)',
                        border: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onClick={() => handleInterested(req.id)}
                      disabled={interestLoading === req.id || myInterestSent}
                    >
                      <Clock size={20} strokeWidth={2.5} />
                      {myInterestSent ? 'Bạn đã gửi yêu cầu rồi' : interestLoading === req.id ? 'Đang gửi...' : 'Tôi có thể đi'}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
            <p className="page-subtitle" style={{ margin: '0 auto' }}>
              {activeTab === 'OPEN'
                ? 'Hiện tại không có yêu cầu tour nào đang mở.'
                : activeTab === 'MY'
                  ? 'Bạn chưa đăng yêu cầu tour nào.'
                  : 'Bạn chưa nhận yêu cầu tour nào.'}
            </p>
          </div>
        )}

        {selectedRequestForReview ? (
          <ReviewModal
            tourRequest={selectedRequestForReview}
            onClose={() => setSelectedRequestForReview(null)}
            onSuccess={() => {
              showToast('Cảm ơn bạn đã đánh giá.', 'success');
              fetchRequests();
            }}
          />
        ) : null}

        {payingRequest ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(24, 24, 27, 0.65)',
              backdropFilter: 'blur(8px)',
              display: 'grid',
              placeItems: 'center',
              padding: '20px',
              zIndex: 1000,
            }}
          >
            <div className="glass-panel" style={{ width: 'min(100%, 540px)', padding: '32px', borderRadius: '28px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr',
                  gap: '16px',
                  alignItems: 'stretch',
                }}
              >
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '22px',
                    background: 'linear-gradient(135deg, rgba(239,246,255,0.98), rgba(255,255,255,0.92))',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 14px',
                      borderRadius: '999px',
                      background: '#ffffff',
                      color: '#1d4ed8',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <Wallet size={14} />
                    VNPay secure checkout
                  </span>
                  <h2 className="section-title" style={{ marginTop: '14px', marginBottom: '8px', fontSize: '1.55rem' }}>
                    {payingRequest.type === 'DEPOSIT'
                      ? 'X\u00E1c nh\u1EADn kho\u1EA3n \u0111\u1EB7t c\u1ECDc'
                      : 'Thanh to\u00E1n ph\u1EA7n c\u00F2n l\u1EA1i'}
                  </h2>
                  <p className="muted-text" style={{ margin: 0, fontSize: '0.96rem', lineHeight: 1.7 }}>
                    {'Ho\u00E0n t\u1EA5t thanh to\u00E1n cho y\u00EAu c\u1EA7u '}
                    <strong>{payingRequest.title}</strong>
                    {' \u0111\u1EC3 ti\u1EBFp t\u1EE5c quy tr\u00ECnh \u0111\u1EB7t tour.'}
                  </p>
                </div>

                <div
                  style={{
                    padding: '20px',
                    borderRadius: '22px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(239,246,255,0.84))',
                    border: '1px solid #dbeafe',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div className="muted-text" style={{ fontSize: '0.8rem' }}>{'S\u1ED1 ti\u1EC1n c\u1EA7n thanh to\u00E1n'}</div>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.45rem', fontWeight: 900, lineHeight: 1.35 }}>
                    {formatVND(payingRequest.amount)}
                  </strong>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '14px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    <ShieldCheck size={16} />
                    {'B\u1EA3o m\u1EADt SSL'}
                  </div>
                </div>
              </div>

              <div className="booking-box" style={{ marginTop: '18px', padding: '20px', borderRadius: '22px' }}>
                <div className="booking-row">
                  <span className="muted-text">{'Lo\u1EA1i thanh to\u00E1n'}</span>
                  <strong>{payingRequest.type === 'DEPOSIT' ? '\u0110\u1EB7t c\u1ECDc gi\u1EEF ch\u1ED7' : 'Thanh to\u00E1n ho\u00E0n t\u1EA5t'}</strong>
                </div>
                <div className="booking-row">
                  <span className="muted-text">{'Ph\u01B0\u01A1ng th\u1EE9c'}</span>
                  <strong>VNPay</strong>
                </div>
                <div className="booking-row">
                  <span className="muted-text">{'C\u1EADp nh\u1EADt tr\u1EA1ng th\u00E1i'}</span>
                  <strong>{'T\u1EF1 \u0111\u1ED9ng sau khi giao d\u1ECBch th\u00E0nh c\u00F4ng'}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '22px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ height: '52px', borderRadius: '16px', fontWeight: 800 }}
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? '\u0110ang chuy\u1EC3n...' : 'Ti\u1EBFp t\u1EE5c thanh to\u00E1n'}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ height: '52px', borderRadius: '16px' }}
                  onClick={() => setPayingRequest(null)}
                >
                  {'\u0110\u00F3ng l\u1EA1i'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {aiRecommendation ? (() => {
          const currentRequestForAi = requests.find(r => r.id === aiRecommendation.id);
          const aiRecommendedGuides = currentRequestForAi?.interestedGuides.filter(g => 
            aiRecommendation.text.toLowerCase().includes(g.guideName.toLowerCase())
          ) || [];

          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(24, 24, 27, 0.65)',
                backdropFilter: 'blur(12px)',
                display: 'grid',
                placeItems: 'center',
                padding: '20px',
                zIndex: 1100,
              }}
            >
              <div 
                className="glass-panel" 
                style={{ 
                  width: 'min(100%, 640px)', 
                  padding: '32px', 
                  borderRadius: '28px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      background: 'linear-gradient(135deg, var(--primary), #a21caf)', 
                      padding: '10px', 
                      borderRadius: '14px',
                      color: 'white'
                    }}>
                      <Sparkles size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>Trình tư vấn AI</h2>
                  </div>
                  <button type="button" className="icon-button" onClick={() => setAiRecommendation(null)}>
                    <X size={20} />
                  </button>
                </div>

                <div 
                  className="booking-box" 
                  style={{ 
                    maxHeight: '40vh', 
                    overflowY: 'auto', 
                    padding: '24px', 
                    lineHeight: 1.8, 
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(255, 255, 255, 0.03)',
                    fontSize: '1.05rem',
                    marginBottom: '20px'
                  }}
                >
                  {aiRecommendation.text}
                </div>

                {aiRecommendedGuides.length > 0 && (
                  <div className="booking-box" style={{ padding: '20px', background: 'rgba(15, 118, 110, 0.05)', border: '1px solid rgba(15, 118, 110, 0.2)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>
                      Hướng dẫn viên được AI đề xuất cho bạn:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {aiRecommendedGuides.map((guide, index) => (
                        <div key={guide.id} className="info-strip" style={{ justifyContent: 'space-between', background: 'var(--surface)' }}>
                          <Link 
                            to={`/profile/${guide.guideId}`} 
                            style={{ fontWeight: 800, color: 'var(--text-primary)', textDecoration: 'none' }}
                            target="_blank"
                          >
                            <span style={{ color: 'var(--primary)' }}>#{index + 1}</span> {guide.guideName}
                          </Link>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ minHeight: '40px', padding: '0 24px' }}
                            onClick={() => {
                              setAiRecommendation(null);
                              handleSelectGuide(aiRecommendation.id, guide.guideId, guide.guideName);
                            }}
                          >
                            Chọn
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <p className="muted-text" style={{ fontSize: '0.82rem' }}>
                    Gợi ý này được tạo bởi AI (Gemini 1.5 Flash) dựa trên hồ sơ và đánh giá thực tế của Hướng dẫn viên.
                  </p>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ marginTop: '20px', width: '100%', height: '52px', borderRadius: '16px' }}
                    onClick={() => setAiRecommendation(null)}
                  >
                    Đã hiểu, cảm ơn!
                  </button>
                </div>
              </div>
            </div>
          );
        })() : null}

        {/* Modern Premium Modal */}
        {modal?.isOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div className="glass-panel" style={{
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              animation: 'slideUp 0.3s ease-out'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: modal.type === 'success' ? 'var(--success-soft)' : 
                           modal.type === 'error' ? 'var(--error-soft)' :
                           modal.type === 'confirm' ? 'rgba(79, 70, 229, 0.1)' : 'var(--surface-hover)',
                color: modal.type === 'success' ? 'var(--success)' :
                       modal.type === 'error' ? 'var(--error)' :
                       modal.type === 'confirm' ? '#4f46e5' : 'var(--text-secondary)'
              }}>
                {modal.type === 'success' ? <CheckCircle2 size={32} /> :
                 modal.type === 'error' ? <AlertCircle size={32} /> :
                 modal.type === 'confirm' ? <Info size={32} /> : <Info size={32} />}
              </div>
              
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
                {modal.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px', fontSize: '1.1rem' }}>
                {modal.message}
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {modal.type === 'confirm' ? (
                  <>
                    <button 
                      className="btn-secondary" 
                      onClick={() => setModal(null)}
                      style={{ padding: '12px 24px', minWidth: '120px' }}
                    >
                      Bỏ qua
                    </button>
                    <button 
                      className="btn-primary" 
                      onClick={modal.onConfirm}
                      style={{ 
                        padding: '12px 24px', 
                        minWidth: '120px',
                        background: modal.title.includes('Hủy') ? 'var(--error)' : 'var(--primary)'
                      }}
                    >
                      Xác nhận
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn-primary" 
                    onClick={() => setModal(null)}
                    style={{ padding: '12px 32px', minWidth: '150px' }}
                  >
                    Đóng
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </DashboardLayout>
  );
};

export default TripRequestsPage;
