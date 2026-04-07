import React, { useEffect, useState } from 'react';
import {
  Eye,
  Slash,
  CheckCircle,
  Search,
  AlertCircle,
  X,
  MapPin,
  User,
  Calendar,
  Clock,
  DollarSign,
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, Tour } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import { formatVND, getFileUrl } from '../../utils/format';

const AdminToursPage: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'COMPLETED'>(
    'ALL'
  );
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showHideModal, setShowHideModal] = useState(false);
  const [hideReason, setHideReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const toIsoDateString = (val: any) => {
    if (Array.isArray(val)) {
      const [y, m, d] = val;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return typeof val === 'string' ? val.split('T')[0] : '';
  };

  const getTourDateTime = (tour: Tour) => {
    const tourDate = tour.startDate ? new Date(toIsoDateString(tour.startDate)) : null;
    if (tourDate && tour.startTime) {
      const [h, m] = tour.startTime.split(':').map(Number);
      tourDate.setHours(h, m, 0, 0);
    }
    return tourDate;
  };

  const getTourState = (tour: Tour) => {
    const tourDate = getTourDateTime(tour);
    const isExpired = tourDate ? tourDate < new Date() : false;
    const isActive = tour.status === 'ACTIVE';

    if (!isActive) {
      return {
        label: 'Đã bị ẩn',
        detailLabel: 'Đang ẩn',
        toneClass: 'is-hidden',
      };
    }

    if (isExpired) {
      return {
        label: 'Đã kết thúc',
        detailLabel: 'Đã kết thúc',
        toneClass: 'is-completed',
      };
    }

    return {
      label: 'Đang hiển thị',
      detailLabel: 'Đang mở',
      toneClass: 'is-active',
    };
  };

  const fetchTours = async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<any>>(ENDPOINTS.TOUR.GET_ALL_ADMIN + '?size=100');
      if (res.data.result.content) {
        setTours(res.data.result.content);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách tour:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleUpdateStatus = async (tourId: string, status: string, reason?: string) => {
    try {
      setProcessing(true);
      await api.patch(
        `${ENDPOINTS.TOUR.UPDATE_STATUS(tourId)}?status=${status}${reason ? `&reason=${encodeURIComponent(reason)}` : ''
        }`
      );
      await fetchTours();
      setShowHideModal(false);
      setHideReason('');
      setSelectedTour(null);
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      alert('Đã có lỗi xảy ra khi cập nhật trạng thái tour.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredTours = tours.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.guideName.toLowerCase().includes(searchTerm.toLowerCase());

    const tourDate = getTourDateTime(t);
    const isExpired = tourDate ? tourDate < new Date() : false;

    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'ACTIVE') return matchesSearch && t.status === 'ACTIVE' && !isExpired;
    if (filterStatus === 'COMPLETED') return matchesSearch && t.status === 'ACTIVE' && isExpired;
    if (filterStatus === 'INACTIVE') return matchesSearch && t.status === 'INACTIVE';
    return matchesSearch && t.status === filterStatus;
  });

  return (
    <DashboardLayout>
      <div className="admin-tours-page">
        <div className="section-heading admin-tours-head">
          <h1 className="page-title">Quản lý Tour hệ thống</h1>
          <p className="page-subtitle">
            Kiểm soát chất lượng nội dung, theo dõi trạng thái hiển thị và hỗ trợ Guide điều
            chỉnh các tour cần rà soát.
          </p>
        </div>

        <div className="glass-panel admin-tours-toolbar">
          <label className="input-shell admin-tours-search">
            <Search size={18} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm kiếm theo tên tour hoặc hướng dẫn viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>

          <div className="admin-tours-filter-group">
            <span className="admin-tours-filter-label">Trạng thái</span>
            <div className="segmented-control">
              {[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'ACTIVE', label: 'Đang mở' },
                { value: 'COMPLETED', label: 'Kết thúc' },
                { value: 'INACTIVE', label: 'Đã ẩn' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`segmented-button ${filterStatus === option.value ? 'active' : ''
                    }`}
                  onClick={() => setFilterStatus(option.value as typeof filterStatus)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel admin-tours-empty">
            <p>Đang tải danh sách tour...</p>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="glass-panel admin-tours-empty">
            <AlertCircle size={48} />
            <h3 className="section-title">Không tìm thấy tour phù hợp</h3>
            <p className="collection-empty-copy">
              Hãy thử đổi từ khóa hoặc chuyển bộ lọc trạng thái để xem thêm các tour khác trong hệ
              thống.
            </p>
          </div>
        ) : (
          <div className="admin-tours-list">
            {filteredTours.map((tour) => {
              const state = getTourState(tour);

              return (
                <article key={tour.id} className="glass-card admin-tour-card">
                  <div className="admin-tour-card-media">
                    <img src={getFileUrl(tour.imageUrl)} alt={tour.title} className="admin-tour-card-image" />
                    <div className="admin-tour-card-overlay" />
                    <div className={`admin-tour-card-status ${state.toneClass}`}>{state.label}</div>
                  </div>

                  <div className="admin-tour-card-body">
                    <div className="admin-tour-card-main">
                      <div className="admin-tour-card-copy">
                        <h3 className="admin-tour-card-title">{tour.title}</h3>
                        <div className="admin-tour-card-meta">
                          <span>
                            <User size={14} /> {tour.guideName}
                          </span>
                          <span>
                            <MapPin size={14} /> {tour.locationName}
                          </span>
                        </div>
                        {tour.status === 'INACTIVE' && tour.hiddenReason ? (
                          <p className="admin-tour-card-note">Lý do ẩn: {tour.hiddenReason}</p>
                        ) : (
                          <p className="admin-tour-card-note admin-tour-card-note-muted">
                            Tour đang được hệ thống theo dõi về nội dung, thời gian và trạng thái
                            hiển thị.
                          </p>
                        )}
                      </div>

                      <div className="admin-tour-card-side">
                        <div className="admin-tour-price">{formatVND(tour.price)}</div>
                        <span className="admin-tour-price-caption">mỗi khách</span>
                      </div>
                    </div>

                    <div className="admin-tour-card-footer">
                      <div className="admin-tour-facts">
                        <span className="admin-tour-fact">
                          <Calendar size={15} />
                          {tour.startDate
                            ? new Date(toIsoDateString(tour.startDate)).toLocaleDateString('vi-VN')
                            : 'Chưa có ngày'}
                        </span>
                        <span className="admin-tour-fact">
                          <Clock size={15} />
                          {tour.startTime || 'Chưa có giờ'}
                        </span>
                      </div>

                      <div className="admin-tour-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTour(tour);
                            setShowHideModal(false);
                          }}
                          className="icon-button"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>

                        {tour.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTour(tour);
                              setShowHideModal(true);
                            }}
                            className="icon-button admin-tour-action-danger"
                            title="Ẩn tour"
                          >
                            <Slash size={18} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(tour.id, 'ACTIVE')}
                            className="icon-button admin-tour-action-success"
                            title="Kích hoạt lại"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {showHideModal && selectedTour ? (
          <div className="admin-tour-modal-overlay">
            <div className="glass-panel admin-tour-hide-modal">
              <div className="admin-tour-modal-head">
                <div>
                  <h3 className="section-title">Ẩn Tour vi phạm</h3>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => {
                    setShowHideModal(false);
                    setSelectedTour(null);
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <p className="muted-text admin-tour-hide-copy">
                Tour <strong>{selectedTour.title}</strong> sẽ bị ẩn khỏi marketplace. Hãy nhập lý
                do rõ ràng để Guide có thể hiểu và điều chỉnh nội dung nếu cần.
              </p>

              <textarea
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                placeholder="Ví dụ: Mô tả chưa rõ ràng, hình ảnh không đúng thực tế hoặc có thông tin gây hiểu nhầm..."
                className="textarea-field admin-tour-hide-textarea"
              />

              <div className="admin-tour-hide-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowHideModal(false);
                    setSelectedTour(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!hideReason.trim() || processing}
                  onClick={() => handleUpdateStatus(selectedTour.id, 'INACTIVE', hideReason)}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                    boxShadow: '0 16px 30px rgba(220, 38, 38, 0.2)',
                  }}
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận Ẩn'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {selectedTour && !showHideModal ? (
          <div className="admin-tour-modal-overlay">
            <div className="glass-panel admin-tour-detail-modal">
              <div className="admin-tour-detail-head">
                <div>
                  <span className="eyebrow">Tour Details</span>
                  <h3 className="section-title">Chi tiết Tour</h3>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setSelectedTour(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="admin-tour-detail-grid">
                <div className="admin-tour-detail-media">
                  <img src={getFileUrl(selectedTour.imageUrl)} alt={selectedTour.title} />
                </div>

                <div className="admin-tour-detail-summary">
                  <div className="admin-tour-detail-status-row">
                    <div
                      className={`admin-tour-card-status ${getTourState(selectedTour).toneClass}`}
                    >
                      {getTourState(selectedTour).detailLabel}
                    </div>
                    <span className="admin-tour-detail-id">
                      Mã: {selectedTour.id.substring(0, 8)}
                    </span>
                  </div>

                  <h2 className="admin-tour-detail-title">{selectedTour.title}</h2>
                  <div className="admin-tour-detail-price">
                    {formatVND(selectedTour.price)}
                    <span>/người</span>
                  </div>

                  <div className="admin-tour-detail-facts">
                    <div className="admin-tour-detail-fact">
                      <User size={18} />
                      <div>
                        <span>Hướng dẫn viên</span>
                        <strong>{selectedTour.guideName}</strong>
                      </div>
                    </div>
                    <div className="admin-tour-detail-fact">
                      <Calendar size={18} />
                      <div>
                        <span>Ngày khởi hành</span>
                        <strong>
                          {selectedTour.startDate
                            ? new Date(toIsoDateString(selectedTour.startDate)).toLocaleDateString(
                              'vi-VN'
                            )
                            : 'N/A'}
                        </strong>
                      </div>
                    </div>
                    <div className="admin-tour-detail-fact">
                      <Clock size={18} />
                      <div>
                        <span>Giờ khởi hành</span>
                        <strong>{selectedTour.startTime || 'N/A'}</strong>
                      </div>
                    </div>
                    <div className="admin-tour-detail-fact">
                      <DollarSign size={18} />
                      <div>
                        <span>Tiền cọc</span>
                        <strong>{selectedTour.depositPercentage}%</strong>
                      </div>
                    </div>
                  </div>

                  {selectedTour.status === 'INACTIVE' && selectedTour.hiddenReason ? (
                    <div className="admin-tour-detail-warning">
                      <strong>Lý do ẩn:</strong> {selectedTour.hiddenReason}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="admin-tour-detail-description">
                <h4 className="admin-tour-detail-section-title">Mô tả chi tiết</h4>
                <p>{selectedTour.description}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default AdminToursPage;
