import React, { useEffect, useState } from 'react';
import { 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  Search,
  UserPlus
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, User, Page } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    gender: 'MALE',
    dob: '',
    roles: [] as string[]
  });

  const fetchUsers = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Page<User>>>(ENDPOINTS.USER.GET_ALL, {
        params: { page: pageNumber, size: 8 }
      });
      const data = response.data.result;
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(data.number);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    try {
      await api.delete(ENDPOINTS.USER.DELETE(id));
      fetchUsers(page);
    } catch (err) {
      alert("Lỗi khi xóa người dùng.");
    }
  };

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        password: '', // Password stays empty if not changing
        gender: (user as any).gender || 'MALE',
        dob: (user as any).dob || '',
        roles: user.roles.map(r => r.name)
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        fullName: '',
        phone: '',
        password: '',
        gender: 'MALE',
        dob: '',
        roles: ['CUSTOMER']
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Prepare update data (remove password if empty)
        const updateData = { ...formData };
        if (!updateData.password) delete (updateData as any).password;
        
        await api.put(ENDPOINTS.USER.UPDATE(editingUser.id), updateData);
      } else {
        await api.post(ENDPOINTS.USER.REGISTER, formData);
      }
      setIsModalOpen(false);
      fetchUsers(page);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi lưu người dùng.");
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Quản lý Người dùng
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Tổng số {totalElements} tài khoản trên hệ thống</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 24px', 
              background: 'var(--primary)', 
              color: 'white',
              fontWeight: '600'
            }}
          >
            <UserPlus size={20} /> Thêm người dùng
          </button>
        </div>

        {/* Search & Filter - Placeholder for now */}
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
           <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tên hoặc email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
           </div>
        </div>

        {/* Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-hover)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem' }}>NGƯỜI DÙNG</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem' }}>SỐ ĐIỆN THOẠI</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem' }}>VAI TRÒ</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem', textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Không tìm thấy người dùng</td></tr>
              ) : users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px' }}>
                    <div>
                      <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{user.fullName}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{user.email}</p>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>{user.phone}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {user.roles.map(role => (
                        <span key={role.name} style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.7rem', 
                          fontWeight: '700', 
                          background: role.name === 'ADMIN' ? '#e0e7ff' : role.name === 'GUIDE' ? '#dcfce7' : '#f1f5f9',
                          color: role.name === 'ADMIN' ? '#4338ca' : role.name === 'GUIDE' ? '#15803d' : '#475569'
                        }}>
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button onClick={() => handleOpenModal(user)} style={{ padding: '8px', color: 'var(--primary)', background: 'none' }} title="Sửa">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} style={{ padding: '8px', color: 'var(--error)', background: 'none' }} title="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)', borderTop: '1px solid var(--glass-border)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Trang {page + 1} / {totalPages}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0 || loading}
                className="btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1 || loading}
                className="btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>
              {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                 <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '6px' }}>Họ và tên</label>
                 <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={e => setFormData({...formData, fullName: e.target.value})} 
                  required 
                 />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '6px' }}>Email</label>
                   <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    disabled={!!editingUser}
                    required 
                   />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '6px' }}>Số điện thoại</label>
                   <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    required 
                   />
                </div>
              </div>

              <div>
                 <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '6px' }}>
                   Mật khẩu {editingUser && <span style={{ fontWeight: '400', fontSize: '0.75rem' }}>(Để trống nếu không đổi)</span>}
                 </label>
                 <input 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  required={!editingUser}
                 />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '6px' }}>Giới tính</label>
                   <select 
                    value={formData.gender} 
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                   >
                     <option value="MALE">Nam</option>
                     <option value="FEMALE">Nữ</option>
                     <option value="OTHER">Khác</option>
                   </select>
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '6px' }}>Ngày sinh</label>
                   <input 
                    type="date" 
                    value={formData.dob} 
                    onChange={e => setFormData({...formData, dob: e.target.value})} 
                   />
                </div>
              </div>

              {editingUser && (
                <div>
                   <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '6px' }}>Vai trò cấp phép</label>
                   <div style={{ display: 'flex', gap: '16px', background: 'var(--surface-hover)', padding: '12px', borderRadius: '12px' }}>
                     {['CUSTOMER', 'GUIDE', 'ADMIN'].map(role => (
                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                           <input 
                             type="checkbox" 
                             checked={formData.roles.includes(role)}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setFormData({...formData, roles: [...formData.roles, role]});
                               } else {
                                 setFormData({...formData, roles: formData.roles.filter(r => r !== role)});
                               }
                             }}
                             style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                           />
                           {role}
                        </label>
                     ))}
                   </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '14px', fontSize: '1rem', fontWeight: '700' }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '14px', fontSize: '1rem', fontWeight: '700' }}>{editingUser ? "Cập nhật" : "Tạo tài khoản"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsersPage;
