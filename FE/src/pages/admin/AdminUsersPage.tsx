import React, { useEffect, useState } from 'react';
import {
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Search,
  UserPlus,
  Users,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, User, Page } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';

const roleToneMap: Record<string, string> = {
  ADMIN: 'admin',
  GUIDE: 'guide',
  CUSTOMER: 'customer',
};

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    gender: 'MALE',
    dob: '',
    roles: [] as string[],
  });

  const fetchUsers = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Page<User>>>(ENDPOINTS.USER.GET_ALL, {
        params: { page: pageNumber, size: 8 },
      });
      const data = response.data.result;
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(data.number);
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await api.delete(ENDPOINTS.USER.DELETE(id));
      fetchUsers(page);
    } catch (err) {
      alert('Lỗi khi xóa người dùng.');
    }
  };

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        password: '',
        gender: (user as any).gender || 'MALE',
        dob: (user as any).dob || '',
        roles: user.roles.map((r) => r.name),
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
        roles: ['CUSTOMER'],
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete (updateData as any).password;
        await api.put(ENDPOINTS.USER.UPDATE(editingUser.id), updateData);
      } else {
        await api.post(ENDPOINTS.USER.REGISTER, formData);
      }
      setIsModalOpen(false);
      fetchUsers(page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu người dùng.');
    }
  };

  return (
    <DashboardLayout>
      <div className="admin-users-page">
        <div className="admin-users-head">
          <div className="section-heading">
            <h1 className="page-title">Quản lý người dùng</h1>
            <p className="page-subtitle">
              Theo dõi, cập nhật và điều phối các tài khoản đang hoạt động trên hệ thống.
            </p>
          </div>

          <button onClick={() => handleOpenModal()} className="btn-primary admin-users-create">
            <UserPlus size={18} />
            <span>Thêm người dùng</span>
          </button>
        </div>

        <div className="admin-users-summary-grid">
          <div className="admin-users-summary-card glass-panel">
            <span className="admin-users-summary-icon">
              <Users size={20} />
            </span>
            <div>
              <p className="admin-users-summary-label">Tổng tài khoản</p>
              <p className="admin-users-summary-value">{totalElements}</p>
            </div>
          </div>

          <div className="admin-users-summary-card glass-panel">
            <span className="admin-users-summary-icon">
              <ShieldCheck size={20} />
            </span>
            <div>
              <p className="admin-users-summary-label">Trang hiện tại</p>
              <p className="admin-users-summary-value">
                {totalPages === 0 ? 0 : page + 1}/{Math.max(totalPages, 1)}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-users-toolbar glass-panel">
          <div className="input-shell admin-users-search">
            <Search size={18} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="admin-users-toolbar-note">
          </div>
        </div>

        <div className="admin-users-table-shell glass-panel">
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Liên hệ</th>
                  <th>Vai trò</th>
                  <th className="admin-users-actions-head">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="admin-users-empty-cell">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-users-empty-cell">
                      Không tìm thấy người dùng
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="admin-users-row">
                      <td>
                        <div className="admin-users-person">
                          <div className="admin-users-avatar">
                            {user.fullName?.trim()?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="admin-users-person-copy">
                            <p className="admin-users-person-name">{user.fullName}</p>
                            <p className="admin-users-person-meta">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-users-contact-list">
                          <div className="admin-users-contact-item">
                            <Mail size={14} />
                            <span>{user.email}</span>
                          </div>
                          <div className="admin-users-contact-item">
                            <Phone size={14} />
                            <span>{user.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-users-role-list">
                          {user.roles.map((role) => (
                            <span
                              key={role.name}
                              className={`admin-users-role-badge admin-users-role-${roleToneMap[role.name] || 'customer'}`}
                            >
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="admin-users-actions">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="admin-users-icon-btn"
                            title="Sửa"
                          >
                            <Edit3 size={17} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="admin-users-icon-btn danger"
                            title="Xóa"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-users-pagination">
            <div>
              <p className="admin-users-pagination-label">Hiển thị theo trang</p>
              <p className="admin-users-pagination-value">
                Trang {totalPages === 0 ? 0 : page + 1} trên {Math.max(totalPages, 1)}
              </p>
            </div>

            <div className="admin-users-pagination-actions">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="btn-secondary"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="btn-secondary"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="admin-users-modal-backdrop">
          <div className="admin-users-modal glass-panel">
            <div className="admin-users-modal-head">
              <div>
                <p className="admin-users-modal-kicker">
                  {editingUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}
                </p>
                <h3>{editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="admin-users-form">
              <div className="admin-users-form-section">
                <label className="field-label">Họ và tên</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="split-fields">
                <div>
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingUser}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-users-form-section">
                <label className="field-label">
                  Mật khẩu{' '}
                  {editingUser ? (
                    <span className="admin-users-inline-note">(Để trống nếu không đổi)</span>
                  ) : null}
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div className="split-fields">
                <div>
                  <label className="field-label">Giới tính</label>
                  <select
                    className="select-field"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Ngay sinh</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
              </div>

              {editingUser && (
                <div className="admin-users-form-section">
                  <label className="field-label">Vai trò cấp phép</label>
                  <div className="admin-users-role-editor">
                    {['CUSTOMER', 'GUIDE', 'ADMIN'].map((role) => (
                      <label key={role} className="admin-users-role-option">
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, roles: [...formData.roles, role] });
                            } else {
                              setFormData({
                                ...formData,
                                roles: formData.roles.filter((r) => r !== role),
                              });
                            }
                          }}
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="admin-users-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Cập nhật' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsersPage;
