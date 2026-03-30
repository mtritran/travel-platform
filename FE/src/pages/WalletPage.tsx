import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CreditCard, 
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import type { ApiResponse, Transaction } from '../types';
import { ENDPOINTS } from '../constants/endpoints';
import DashboardLayout from '../layouts/DashboardLayout';
import { formatVND } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const PayoutModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(formData.amount) < 50000) {
        alert("Số tiền tối thiểu là 50,000 VND");
        return;
    }
    setLoading(true);
    try {
      await api.post(ENDPOINTS.PAYOUT.CREATE, {
        ...formData,
        amount: Number(formData.amount)
      });
      alert("Đã gửi yêu cầu rút tiền thành công! Admin sẽ xử lý trong vòng 24h.");
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
      <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '32px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>Rút tiền về tài khoản</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Số tiền rút (Tối thiểu 50,000đ)</label>
            <input 
                type="number" 
                required 
                className="input-field"
                placeholder="Ví dụ: 500000" 
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tên ngân hàng</label>
            <input 
                type="text" 
                required 
                className="input-field"
                placeholder="Ví dụ: Vietcombank" 
                value={formData.bankName}
                onChange={e => setFormData({...formData, bankName: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Số tài khoản</label>
            <input 
                type="text" 
                required 
                className="input-field"
                placeholder="0123456789" 
                value={formData.bankAccountNumber}
                onChange={e => setFormData({...formData, bankAccountNumber: e.target.value})}
            />
          </div>
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tên chủ tài khoản (Viết không dấu)</label>
            <input 
                type="text" 
                required 
                className="input-field"
                placeholder="NGUYEN VAN A" 
                value={formData.bankAccountName}
                onChange={e => setFormData({...formData, bankAccountName: e.target.value.toUpperCase()})}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WalletPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get<ApiResponse<Transaction[]>>(ENDPOINTS.TRANSACTION.GET_MY);
        setTransactions(response.data.result);
      } catch (err) {
        console.error("Lỗi khi tải lịch sử giao dịch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'INCOME': return <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px', borderRadius: '12px' }}><ArrowDownLeft size={20} /></div>;
      case 'WITHDRAW': return <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '12px' }}><ArrowUpRight size={20} /></div>;
      case 'REVENUE': return <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '10px', borderRadius: '12px' }}><TrendingUp size={20} /></div>;
      case 'REFUND': return <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}><History size={20} /></div>;
      default: return <div style={{ background: 'var(--surface-hover)', padding: '10px', borderRadius: '12px' }}><CreditCard size={20} /></div>;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'INCOME': return 'Tiền về ví';
      case 'WITHDRAW': return 'Rút tiền';
      case 'REVENUE': return 'Doanh thu';
      case 'COMMISSION': return 'Phí hệ thống';
      case 'REFUND': return 'Hoàn tiền';
      default: return type;
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '40px 0' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Ví của tôi
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Quản lý thu nhập và lịch sử giao dịch của bạn.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
          {/* Left Side: Balance & History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Balance Card */}
            <div className="glass-panel" style={{ 
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: 'white',
              padding: '40px',
              borderRadius: '32px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)'
            }}>
              <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
                <Wallet size={200} />
              </div>
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', opacity: 0.9, marginBottom: '8px', display: 'block' }}>Số dư hiện tại</span>
                <h3 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '32px' }}>
                  {formatVND(user?.balance || 0)}
                </h3>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                   <button 
                    className="btn-primary" 
                    onClick={() => setShowPayoutModal(true)}
                    style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '12px 28px', borderRadius: '16px', fontWeight: 'bold' }}
                   >
                     Yêu cầu rút tiền
                   </button>
                   <button className="btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', background: 'rgba(255,255,255,0.1)', padding: '12px 28px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                     Lịch sử rút
                   </button>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <History size={24} className="text-primary" />
                  Lịch sử giao dịch gần đây
                </h4>
                <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <Download size={18} /> Xuất file
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải...</div>
              ) : transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)' }}>
                   <AlertCircle size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                   <p>Bạn chưa có giao dịch nào.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {transactions.map(t => (
                    <div key={t.id} style={{ 
                      padding: '16px', 
                      borderRadius: '20px', 
                      background: 'var(--surface)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px',
                      border: '1px solid var(--glass-border)',
                      transition: 'transform 0.2s hover'
                    }}>
                      {getTransactionIcon(t.type)}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{t.note}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {new Date(t.createdAt).toLocaleString('vi-VN')} • Mã: {t.id.substring(0, 8).toUpperCase()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '800', 
                          color: t.type === 'INCOME' || t.type === 'REFUND' ? '#10b981' : (t.type === 'WITHDRAW' ? '#ef4444' : 'var(--text-primary)') 
                        }}>
                          {t.type === 'WITHDRAW' ? '-' : '+'}{formatVND(t.amount)}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
                          {getTransactionLabel(t.type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Wallet Stats/Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
             <div className="glass-panel" style={{ padding: '32px' }}>
                <h4 style={{ fontWeight: '800', marginBottom: '24px' }}>Thông tin ví</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Loại ví</span>
                      <span style={{ fontWeight: '700' }}>Ví đối tác (Partner)</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Trạng thái</span>
                      <span style={{ color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                         ĐANG HOẠT ĐỘNG
                      </span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Phí giao dịch</span>
                      <span style={{ fontWeight: '700' }}>Miễn phí</span>
                   </div>
                </div>
                
                <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--glass-border)' }} />
                
                <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px' }}>
                   <AlertCircle size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                   <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                      Yêu cầu rút tiền được xử lý trong vòng <strong>24h làm việc</strong>. Hạn mức rút tối thiểu là <strong>50.000đ</strong>.
                   </p>
                </div>
             </div>

             <div className="glass-panel" style={{ padding: '32px', background: 'var(--surface)' }}>
                <h4 style={{ fontWeight: '800', marginBottom: '20px' }}>Quy trình nhận tiền</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                      <p style={{ fontSize: '0.875rem' }}>Khách hàng thanh toán tour qua cổng VNPay.</p>
                   </div>
                   <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                      <p style={{ fontSize: '0.875rem' }}>TravelX giữ tiền tạm thời để đảm bảo quyền lợi đôi bên.</p>
                   </div>
                   <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                      <p style={{ fontSize: '0.875rem' }}>Sau khi tour hoàn thành, tiền sẽ được cộng vào ví của bạn (sau khi trừ 20% phí sàn).</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      {showPayoutModal && (
        <PayoutModal 
          onClose={() => setShowPayoutModal(false)}
          onSuccess={() => {
            setShowPayoutModal(false);
            refreshUser();
            // Trigger transaction refresh
            window.location.reload(); 
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default WalletPage;
