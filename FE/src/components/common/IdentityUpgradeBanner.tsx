import React, { useState } from 'react';
import { ShieldCheck, Phone, X } from 'lucide-react';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/endpoints';
import { useAuth } from '../../context/AuthContext';

interface IdentityUpgradeBannerProps {
  type?: 'inline' | 'modal';
  onClose?: () => void;
  message?: string;
  title?: string;
}

const IdentityUpgradeBanner: React.FC<IdentityUpgradeBannerProps> = ({ 
  type = 'inline', 
  onClose,
  message = "Bạn cần cập nhật Số điện thoại và Mã PIN thanh toán để có thể thực hiện các giao dịch quan trọng.",
  title = "Yêu cầu nâng cấp định danh"
}) => {
  const { user, refreshUser } = useAuth();
  const [showForm, setShowForm] = useState(type === 'modal');
  const [upgradeData, setUpgradeData] = useState({
    phone: user?.phone || '',
    paymentPin: '',
    confirmPin: ''
  });
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
 
  React.useEffect(() => {
    if (!upgradeData.phone) {
      setPhoneError('');
      return;
    }
    const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
    if (!phoneRegex.test(upgradeData.phone)) {
      setPhoneError('Số điện thoại không hợp lệ');
    } else {
      setPhoneError('');
    }
  }, [upgradeData.phone]);

  if (!user || (user.phone && user.hasPaymentPin)) return null;

  const handleUpgrade = async () => {
    setError('');
    const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
    
    if (!phoneRegex.test(upgradeData.phone)) {
      setError('Số điện thoại không hợp lệ (ví dụ: 0912345678)');
      return;
    }
    if (upgradeData.paymentPin.length !== 6) {
      setError('Mã PIN phải có đúng 6 chữ số');
      return;
    }
    if (upgradeData.paymentPin !== upgradeData.confirmPin) {
      setError('Mã PIN xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(ENDPOINTS.USER.MY_INFO, {
        phone: upgradeData.phone,
        paymentPin: upgradeData.paymentPin
      });
      if (response.data.code === 1000) {
        await refreshUser();
        if (onClose) onClose();
      } else {
        setError(response.data.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const renderBanner = () => (
    <div className="identity-upgrade-banner" style={{
      padding: '20px',
      background: 'rgba(99, 102, 241, 0.1)',
      borderRadius: '24px',
      border: '1px solid var(--primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          background: 'var(--primary)',
          color: 'white',
          padding: '12px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={28} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>{title}</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {message}
          </p>
        </div>
      </div>

      {!showForm && (
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary"
          style={{
            padding: '10px 24px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: '700',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Cập nhật ngay
        </button>
      )}
    </div>
  );

  const renderFormCard = () => (
    <div className="glass-panel" style={{ 
      padding: '24px', 
      borderRadius: '24px', 
      border: '1px solid var(--primary)',
      background: 'white',
      width: '100%',
      animation: 'fadeInUp 0.3s ease-out',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Cập nhật thông tin định danh</h3>
        <button 
          onClick={() => setShowForm(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          Hủy bỏ
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', textAlign: 'left' }}>
        <div>
          <label className="field-label" style={{ fontSize: '0.8rem' }}>Số điện thoại</label>
          <div className="input-shell">
            <Phone size={18} style={{ opacity: 0.5 }} />
            <input
              className={`input-field ${phoneError ? 'error-border' : ''}`}
              type="text"
              value={upgradeData.phone}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                setUpgradeData({...upgradeData, phone: val});
              }}
              placeholder="Nhập số điện thoại"
            />
          </div>
          {phoneError && (
            <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px' }}>{phoneError}</p>
          )}
        </div>
        <div>
          <label className="field-label" style={{ fontSize: '0.8rem' }}>Mã PIN thanh toán (6 số)</label>
          <div className="input-shell">
            <ShieldCheck size={18} style={{ opacity: 0.5 }} />
            <input
              className="input-field"
              type="password"
              value={upgradeData.paymentPin}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setUpgradeData({...upgradeData, paymentPin: val});
              }}
              placeholder="Thiết lập mã PIN mới"
              maxLength={6}
            />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'left', marginBottom: '24px' }}>
        <label className="field-label" style={{ fontSize: '0.8rem' }}>Xác nhận mã PIN</label>
        <div className="input-shell">
          <ShieldCheck size={18} style={{ opacity: 0.5 }} />
          <input
            className={`input-field ${upgradeData.confirmPin && upgradeData.paymentPin !== upgradeData.confirmPin ? 'error-border' : ''}`}
            type="password"
            value={upgradeData.confirmPin}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setUpgradeData({...upgradeData, confirmPin: val});
            }}
            placeholder="Nhập lại mã PIN xác nhận"
            maxLength={6}
          />
        </div>
        {upgradeData.confirmPin && upgradeData.paymentPin !== upgradeData.confirmPin && (
          <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px' }}>Mã PIN nhập lại không khớp</p>
        )}
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '16px', fontWeight: '600' }}>{error}</p>}

      <button 
        onClick={handleUpgrade}
        className="btn-primary"
        style={{ width: '100%', padding: '14px', borderRadius: '14px' }}
        disabled={loading || !!phoneError || (upgradeData.confirmPin !== '' && upgradeData.paymentPin !== upgradeData.confirmPin)}
      >
        {loading ? 'Đang lưu...' : 'Lưu thông tin định danh'}
      </button>
    </div>
  );

  const modalContent = (
    <div className="identity-upgrade-container" style={{
      padding: '32px',
      background: 'var(--surface)',
      borderRadius: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '24px',
      width: '100%',
      position: 'relative'
    }}>
      {onClose && (
        <button 
          onClick={onClose}
          style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
        >
          <X size={24} />
        </button>
      )}

      <div style={{
        background: 'var(--primary)',
        color: 'white',
        padding: '16px',
        borderRadius: '20px'
      }}>
        <ShieldCheck size={32} />
      </div>

      <div style={{ width: '100%' }}>
        <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '12px' }}>{title}</h4>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          {message}
        </p>

        <div className="upgrade-inline-form" style={{ 
          display: 'grid', 
          gap: '16px', 
          width: '100%',
          textAlign: 'left'
        }}>
          <div>
            <label className="field-label">Số điện thoại</label>
            <div className="input-shell">
              <Phone size={18} style={{ opacity: 0.5 }} />
              <input 
                type="text" 
                className={`input-field ${phoneError ? 'error-border' : ''}`}
                placeholder="0912345678"
                value={upgradeData.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setUpgradeData({...upgradeData, phone: val});
                }}
              />
            </div>
            {phoneError && (
              <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px' }}>{phoneError}</p>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="field-label">Mã PIN mới</label>
              <div className="input-shell">
                <ShieldCheck size={18} style={{ opacity: 0.5 }} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="6 số"
                  value={upgradeData.paymentPin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setUpgradeData({...upgradeData, paymentPin: val});
                  }}
                  maxLength={6}
                />
              </div>
            </div>
            <div>
              <label className="field-label">Xác nhận PIN</label>
              <div className="input-shell">
                <ShieldCheck size={18} style={{ opacity: 0.5 }} />
                <input 
                  type="password" 
                  className={`input-field ${upgradeData.confirmPin && upgradeData.paymentPin !== upgradeData.confirmPin ? 'error-border' : ''}`}
                  placeholder="Nhập lại"
                  value={upgradeData.confirmPin}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setUpgradeData({...upgradeData, confirmPin: val});
                  }}
                  maxLength={6}
                />
              </div>
              {upgradeData.confirmPin && upgradeData.paymentPin !== upgradeData.confirmPin && (
                <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px' }}>Không khớp</p>
              )}
            </div>
          </div>

          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '4px' }}>{error}</p>}

          <button 
            type="button" 
            className="btn-primary" 
            style={{ width: '100%', padding: '16px', borderRadius: '16px', marginTop: '8px' }}
            onClick={handleUpgrade}
            disabled={loading || !!phoneError || (upgradeData.confirmPin !== '' && upgradeData.paymentPin !== upgradeData.confirmPin)}
          >
            {loading ? 'Đang lưu...' : 'Hoàn tất cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );

  if (type === 'modal') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(8px)',
        padding: '20px'
      }}>
        <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: 0, overflow: 'hidden' }}>
          {modalContent}
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack" style={{ width: '100%' }}>
      {renderBanner()}
      {showForm && renderFormCard()}
    </div>
  );
};

export default IdentityUpgradeBanner;
