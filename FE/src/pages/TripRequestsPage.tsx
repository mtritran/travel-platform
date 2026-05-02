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
import { formatVND, getFileUrl } from '../utils/format';
import { ENDPOINTS } from '../constants/endpoints';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import type { ApiResponse, Role, TourRequest } from '../types';
import ReviewModal from '../components/ReviewModal';
import IdentityUpgradeBanner from '../components/common/IdentityUpgradeBanner';

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
  const [activeTab, setActiveTab] = useState<'OPEN' | 'MY' | 'ACCEPTED' | 'HISTORY'>('OPEN');
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

  const [showCancelModal, setShowCancelModal] = useState<TourRequest | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Dispute states
  const [disputingRequest, setDisputingRequest] = useState<TourRequest | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);
  const [isDisputing, setIsDisputing] = useState(false);

  const { showToast } = useNotification();

  const isGuide = user?.roles?.some((role: Role) => role.name === 'GUIDE');
  const isCustomer = user?.roles?.some((role: Role) => role.name === 'CUSTOMER');

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = ENDPOINTS.TOUR_REQUEST.GET_ALL;
      if (activeTab === 'MY' || activeTab === 'HISTORY') url = ENDPOINTS.TOUR_REQUEST.GET_MY;
      if (activeTab === 'ACCEPTED') url = ENDPOINTS.TOUR_REQUEST.GET_ACCEPTED;

      const response = await api.get<ApiResponse<TourRequest[]>>(url);
      let data = response.data.result;
      
      if (activeTab === 'MY') {
        data = data.filter(r => !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status));
      } else if (activeTab === 'HISTORY') {
        data = data.filter(r => ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status));
      }
      
      setRequests(data);
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

  const executeCancelRequest = async (requestId: string) => {
    setCancellingId(requestId);
    try {
      await api.post(ENDPOINTS.TOUR_REQUEST.CANCEL_MATCH(requestId));
      setShowCancelModal(null);
      fetchRequests();
      showToast('Đã hủy yêu cầu thành công.', 'success');
    } catch (err) {
      showToast(withApiError(err, 'Không thể hủy yêu cầu lúc này.'), 'error');
    } finally {
      setCancellingId(null);
    }
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

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingRequest || !disputeReason) return;

    setIsDisputing(true);
    const formData = new FormData();
    formData.append('reason', disputeReason);
    disputeFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      await api.post(ENDPOINTS.TOUR_REQUEST.DISPUTE(disputingRequest.id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Đã gửi khiếu nại thành công. Admin sẽ sớm liên hệ với bạn.', 'success');
      setDisputingRequest(null);
      setDisputeReason('');
      setDisputeFiles([]);
      fetchRequests(true);
    } catch (err) {
      showToast(withApiError(err, 'Lỗi khi gửi khiếu nại.'), 'error');
    } finally {
      setIsDisputing(false);
    }
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
      <div className="page-stack trip-requests-page">
        <div className="section-heading" style={{ marginBottom: '40px' }}>
          <span className="eyebrow">Trip matching</span>
          <h1 className="page-title">Yêu cầu chuyến đi</h1>
          <p className="page-subtitle">
            {isGuide
              ? 'Tìm kiếm khách hàng tiềm năng hoặc quản lý các yêu cầu bạn đã nhận.'
              : 'Đăng nhu cầu mới, theo dõi danh sách guide quan tâm và xử lý thanh toán theo từng giai đoạn.'}
          </p>
        </div>

        {(!user?.phone || !user?.hasPaymentPin) ? (
          <div style={{ width: '100%', margin: '0 0 60px 0' }}>
            <IdentityUpgradeBanner 
              title="Định danh để gửi yêu cầu"
              message="Để đảm bảo an toàn và bảo mật thanh toán, vui lòng hoàn thiện Số điện thoại và Mã PIN trước khi đăng yêu cầu chuyến đi mới."
            />
          </div>
        ) : (
          <>
            <section className="trip-requests-head" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="trip-requests-head-left">
              </div>

              {isCustomer ? (
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

            <div className="tab-strip trip-requests-tabs" style={{ marginTop: '24px' }}>
              {isGuide ? (
                <button type="button" className={`tab-button${activeTab === 'OPEN' ? ' active' : ''}`} onClick={() => setActiveTab('OPEN')}>
                  Yêu cầu đang mở
                </button>
              ) : null}
              <button type="button" className={`tab-button${activeTab === 'MY' ? ' active' : ''}`} onClick={() => setActiveTab('MY')}>
                {isGuide ? 'Yêu cầu của tôi' : 'Đang xử lý'}
              </button>
              <button type="button" className={`tab-button${activeTab === 'HISTORY' ? ' active' : ''}`} onClick={() => setActiveTab('HISTORY')}>
                Lịch sử yêu cầu
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
              <div className="request-grid trip-request-grid-premium">
                {requests.map((req) => {
                  const status = getStatusBadge(req.status);
                  const myInterestSent = req.interestedGuides.some((item) => item.guideId === user?.id);

                  return (
                    <article key={req.id} className="glass-card request-card trip-request-card-premium">
                      <div className="trip-request-card-head" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                        <div className="trip-request-owner" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className="avatar-pill">
                            {req.customerAvatarUrl ? (
                              <img src={getFileUrl(req.customerAvatarUrl)} alt={req.userName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <User size={18} />
                            )}
                          </span>
                          <div className="trip-request-owner-copy">
                            <div className="trip-request-owner-name" style={{ fontWeight: 800 }}>{req.userName}</div>
                            <div className="muted-text trip-request-owner-meta" style={{ fontSize: '0.82rem' }}>
                              {req.status === 'MATCHED' ? 'Đã tìm được HDV' : 'Yêu cầu du lịch'}
                            </div>
                          </div>
                        </div>

                        <div className="trip-request-status-col" style={{ display: 'grid', gap: '6px', justifyItems: 'end' }}>
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

                      <div className="trip-request-body-head" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                        <div className="section-heading trip-request-copy" style={{ gap: '8px' }}>
                          <h2 className="section-title trip-request-title">{req.title}</h2>
                          <p className="muted-text trip-request-description" style={{ fontStyle: 'italic', lineHeight: 1.7 }}>
                            "{req.description}"
                          </p>
                        </div>

                        {activeTab === 'MY' && ['OPEN', 'EXPIRED'].includes(req.status) ? (
                          <div className="trip-request-inline-actions" style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="icon-button" onClick={() => handleEditRequest(req)} title="Sửa yêu cầu">
                              <Edit size={16} />
                            </button>
                            <button type="button" className="icon-button" onClick={() => handleDeleteRequest(req.id)} title="Xóa yêu cầu">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className="booking-box trip-request-facts">
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

                      <div className="trip-request-budget-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="price-value trip-request-budget" style={{ fontSize: '1.1rem' }}>
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
                        <section className="booking-box trip-request-interest-panel">
                          <div className="section-heading" style={{ gap: '6px' }}>
                            <h3 className="section-title" style={{ fontSize: '1.05rem' }}>
                              Danh sách HDV quan tâm ({req.interestedGuides.length})
                            </h3>
                          </div>

                          <div className="trip-request-interest-list" style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                            {req.interestedGuides.length > 0 ? (
                              req.interestedGuides.map((interest) => (
                                <div key={interest.id} className="info-strip trip-request-interest-item" style={{ justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="avatar-pill" style={{ width: '32px', height: '32px' }}>
                                      {interest.guideAvatarUrl ? (
                                        <img src={getFileUrl(interest.guideAvatarUrl)} alt={interest.guideName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                      ) : (
                                        <User size={16} />
                                      )}
                                    </span>
                                    <Link 
                                      to={`/profile/${interest.guideId}`} 
                                      style={{ fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}
                                      target="_blank"
                                    >
                                      {interest.guideName}
                                    </Link>
                                  </div>
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
                          className="glass-panel trip-request-state-panel" 
                          style={{ 
                            background: isGuide ? 'rgba(15, 118, 110, 0.04)' : 'rgba(217, 119, 6, 0.04)', 
                            border: isGuide ? '2px dashed var(--primary-soft)' : '2px dashed var(--secondary-soft)', 
                            marginTop: '16px',
                            padding: '24px',
                            borderRadius: '24px'
                          }}
                        >
                          {isGuide ? (
                            <div className="page-stack trip-request-state-stack" style={{ gap: '16px', textAlign: 'center' }}>
                              <div className="trip-request-state-copy" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div className="trip-request-state-icon" style={{ 
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
                              <div className="trip-request-state-actions" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
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
                            <div className="page-stack trip-request-state-stack" style={{ gap: '16px', textAlign: 'center' }}>
                              <div className="trip-request-state-copy" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
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
                        <section className="booking-box trip-request-contact-panel">
                          <div className="section-heading" style={{ gap: '6px' }}>
                            <h3 className="section-title" style={{ fontSize: '1.05rem' }}>
                              <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                                <ShieldCheck size={16} />
                                Thông tin chuyến đi và liên hệ
                              </span>
                            </h3>
                          </div>

                          <div className="split-fields trip-request-contact-grid" style={{ marginTop: '12px' }}>
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

                          <div className="trip-request-payment-panel" style={{ marginTop: '14px' }}>
                            <div className="trip-request-payment-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span className="muted-text">Tiến độ thanh toán</span>
                              <span style={{ fontWeight: 700 }}>
                                {req.paymentStatus === 'PAID_FULL' || req.paymentStatus === 'PAID_DEPOSIT'
                                  ? 'Đã thanh toán 100%'
                                  : 'Chưa thanh toán'}
                              </span>
                            </div>
                            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  background: 'linear-gradient(135deg, var(--primary), #0891b2)',
                                  width:
                                    req.paymentStatus === 'PAID_FULL' || req.paymentStatus === 'PAID_DEPOSIT'
                                      ? '100%'
                                      : '0%',
                                }}
                              />
                            </div>
                          </div>

                            <div className="trip-request-contact-actions" style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
                            {activeTab === 'MY' && req.status === 'WAITING_PAYMENT' ? (
                              <>
                                <button type="button" className="btn-primary" onClick={() => handlePayDeposit(req)}>
                                  Thanh toán ngay
                                </button>
                                <button type="button" className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setShowCancelModal(req)}>
                                  Hủy yêu cầu
                                </button>
                              </>
                            ) : null}

                            {/* Redundant partial payment block removed */}

                            {activeTab === 'MY' && req.status === 'CONFIRMED' && req.paymentStatus === 'PAID_FULL' ? (
                               <button type="button" className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setShowCancelModal(req)}>
                                  Hủy yêu cầu
                               </button>
                            ) : null}

                            {isGuide && (req.status === 'CONFIRMED' || req.status === 'WAITING_PAYMENT') ? (
                               <button type="button" className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setShowCancelModal(req)}>
                                  Hủy nhận tour (Hoàn 100% cho khách)
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

                            {req.status === 'COMPLETED' && activeTab === 'MY' && !req.isDisputed && (!req.payoutAt || new Date().getTime() < new Date(req.payoutAt).getTime()) && (
                              <button 
                                type="button" 
                                className="btn-outline" 
                                style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.2)', fontWeight: 700 }}
                                onClick={() => setDisputingRequest(req)}
                              >
                                Khiếu nại
                              </button>
                            )}

                            {req.isDisputed && (
                              <div className="info-strip" style={{ background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                                <AlertCircle size={16} />
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Đã gửi khiếu nại</span>
                              </div>
                            )}

                            {req.status === 'COMPLETED' && activeTab === 'MY' ? (
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
              <div className="glass-panel collection-empty-state">
                <div className="collection-empty-icon">
                  <AlertCircle size={40} />
                </div>
                <h2 className="collection-empty-title">
                  {activeTab === 'OPEN'
                    ? 'Hiện chưa có yêu cầu nào phù hợp'
                    : activeTab === 'MY'
                      ? 'Bạn chưa có yêu cầu chuyến đi nào'
                      : 'Bạn chưa nhận yêu cầu nào'}
                </h2>
                <p className="collection-empty-copy">
                  {activeTab === 'OPEN'
                    ? 'Hiện tại không có yêu cầu tour nào đang mở.'
                    : activeTab === 'MY'
                      ? 'Bạn chưa đăng yêu cầu tour nào.'
                      : 'Bạn chưa nhận yêu cầu tour nào.'}
                </p>
                {isCustomer && activeTab === 'MY' ? (
                  <button type="button" className="btn-primary" onClick={() => navigate('/customer/create-request')}>
                    Đăng yêu cầu mới
                  </button>
                ) : null}
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
                          ? 'Xác nhận khoản đặt cọc'
                          : 'Thanh toán phần còn lại'}
                      </h2>
                      <p className="muted-text" style={{ margin: 0, fontSize: '0.96rem', lineHeight: 1.7 }}>
                        Hoàn tất thanh toán cho yêu cầu <strong>{payingRequest.title}</strong> để tiếp tục quy trình đặt tour.
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
                      <div className="muted-text" style={{ fontSize: '0.8rem' }}>Số tiền cần thanh toán</div>
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
                        Bảo mật SSL
                      </div>
                    </div>
                  </div>

                  <div className="booking-box" style={{ marginTop: '18px', padding: '20px', borderRadius: '22px' }}>
                    <div className="booking-row">
                      <span className="muted-text">Loại thanh toán</span>
                      <strong>{payingRequest.type === 'DEPOSIT' ? 'Đặt cọc giữ chỗ' : 'Thanh toán hoàn tất'}</strong>
                    </div>
                    <div className="booking-row">
                      <span className="muted-text">Phương thức</span>
                      <strong>VNPay</strong>
                    </div>
                    <div className="booking-row">
                      <span className="muted-text">Cập nhật trạng thái</span>
                      <strong>Tự động sau khi giao dịch thành công</strong>
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
                      {isProcessingPayment ? 'Đang chuyển...' : 'Tiếp tục thanh toán'}
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ height: '52px', borderRadius: '16px' }}
                      onClick={() => setPayingRequest(null)}
                    >
                      Đóng lại
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

            {showCancelModal ? (
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
                <div className="glass-panel" style={{ width: 'min(100%, 480px)', padding: '32px', borderRadius: '28px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '20px',
                      background: 'var(--danger-soft)',
                      color: 'var(--danger)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <AlertCircle size={32} />
                    </div>
                    <h2 className="section-title" style={{ fontSize: '1.4rem' }}>Xác nhận hủy yêu cầu</h2>
                    <p className="page-subtitle" style={{ marginTop: '8px' }}>
                      Bạn có chắc chắn muốn hủy yêu cầu <strong>{showCancelModal.title}</strong>?
                    </p>
                  </div>

                  {(showCancelModal.paidAmount || 0) > 0 && activeTab === 'MY' && (() => {
                    const now = new Date();
                    const startDateTime = new Date(`${showCancelModal.plannedDate}T${showCancelModal.startTime}`);
                    const diffHours = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                    let refundInfo = '';
                    let refundNote = '';

                    if (diffHours > 48) {
                      refundInfo = `Hoàn 100%: ${formatVND(showCancelModal.paidAmount || 0)}`;
                      refundNote = 'Chính sách: Hủy trước 48h được hoàn cọc đầy đủ.';
                    } else if (diffHours > 24) {
                      refundInfo = `Hoàn 50%: ${formatVND((showCancelModal.paidAmount || 0) * 0.5)}`;
                      refundNote = 'Chính sách: Hủy trước 24h được hoàn 50% cọc.';
                    } else {
                      refundInfo = 'Không được hoàn cọc';
                      refundNote = 'Chính sách: Hủy dưới 24h không hỗ trợ hoàn cọc.';
                    }

                    return (
                      <div style={{
                        padding: '20px',
                        borderRadius: '18px',
                        background: '#fff1f1',
                        border: '1px solid #fecaca',
                        marginBottom: '24px'
                      }}>
                        <div style={{ color: '#991b1b', fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>
                          {refundInfo}
                        </div>
                        <div style={{ color: '#dc2626', fontSize: '0.82rem', lineHeight: 1.5 }}>
                          {refundNote}
                        </div>
                      </div>
                    );
                  })()}

                  {isGuide && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: '#fff7ed',
                      border: '1px solid #ffedd5',
                      color: '#9a3412',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      marginBottom: '24px',
                      textAlign: 'left'
                    }}>
                      <div style={{ fontWeight: 800, marginBottom: '4px' }}>Lưu ý dành cho Guide:</div>
                      Hệ thống sẽ thực hiện <strong>hoàn tiền 100%</strong> cho khách hàng. Ngoài ra, việc chủ động hủy tour sau khi đã xác nhận sẽ bị ghi nhận điểm phạt tương ứng.
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowCancelModal(null)}
                      style={{ minHeight: '48px' }}
                    >
                      Giữ lại
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: 'var(--danger)', boxShadow: '0 10px 20px rgba(220, 38, 38, 0.2)', minHeight: '48px' }}
                      onClick={() => executeCancelRequest(showCancelModal.id)}
                      disabled={!!cancellingId}
                    >
                      {cancellingId === showCancelModal.id ? 'Đang xử lý...' : 'Xác nhận hủy'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

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
          </>
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
            {disputingRequest && (
              <div 
                className="modal-overlay" 
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9999,
                  background: 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                <div 
                  className="glass-panel modal-content" 
                  style={{
                    maxWidth: '600px',
                    width: '100%',
                    padding: '40px',
                    position: 'relative',
                    pointerEvents: 'auto',
                    animation: 'slideUp 0.4s cubic-bezier(0, 0, 0.2, 1)'
                  }}
                >
                  <button 
                    onClick={() => setDisputingRequest(null)}
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <X size={24} />
                  </button>

                  <div className="section-heading" style={{ marginBottom: '32px' }}>
                    <span className="eyebrow" style={{ color: 'var(--danger)' }}>Support Center</span>
                    <h2 className="section-title">Gửi khiếu nại hành trình</h2>
                    <p className="section-subtitle">Vui lòng cung cấp lý do và minh chứng (hình ảnh) để Admin có thể xem xét và bảo vệ quyền lợi của bạn.</p>
                  </div>

                  <form onSubmit={handleDisputeSubmit} style={{ display: 'grid', gap: '24px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>Lý do khiếu nại</label>
                      <textarea
                        required
                        className="form-control"
                        rows={4}
                        placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        style={{ 
                          width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid var(--line)', background: 'var(--surface-muted)',
                          resize: 'none', fontSize: '1rem', transition: 'all 0.2s', outline: 'none'
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', fontWeight: 800, marginBottom: '10px', color: 'var(--text-primary)' }}>Hình ảnh minh chứng ({disputeFiles.length})</label>
                      <div 
                        style={{ 
                          border: '2px dashed var(--line)', borderRadius: '20px', padding: '32px', textAlign: 'center', cursor: 'pointer',
                          transition: 'all 0.2s', borderColor: disputeFiles.length > 0 ? 'var(--primary)' : 'var(--line)',
                          background: disputeFiles.length > 0 ? 'var(--primary-soft)' : 'transparent'
                        }}
                        onClick={() => document.getElementById('dispute-files-input')?.click()}
                      >
                        <Plus size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nhấn để tải lên minh chứng</p>
                        <input
                          id="dispute-files-input"
                          type="file"
                          multiple
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setDisputeFiles(prev => [...prev, ...files]);
                          }}
                        />
                      </div>

                      {disputeFiles.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
                          {disputeFiles.map((file, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt="preview" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--line)' }} 
                              />
                              <button 
                                type="button"
                                onClick={() => setDisputeFiles(prev => prev.filter((_, i) => i !== idx))}
                                style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => setDisputingRequest(null)}
                        style={{ flex: 1, minHeight: '52px', borderRadius: '16px' }}
                      >
                        Hủy
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={isDisputing || !disputeReason}
                        style={{ flex: 2, minHeight: '52px', borderRadius: '16px', background: '#dc2626', borderColor: '#dc2626', boxShadow: '0 8px 16px -4px rgba(220, 38, 38, 0.3)' }}
                      >
                        {isDisputing ? 'Đang gửi...' : 'Xác nhận khiếu nại'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
    </DashboardLayout>
  );
};

export default TripRequestsPage;
