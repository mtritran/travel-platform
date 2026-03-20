import React, { useEffect, useState } from 'react';
import { 
  Trash2, 
  Plus,
  Image as ImageIcon,
  Edit3
} from 'lucide-react';
import api from '../../services/api';
import type { ApiResponse, Location } from '../../types';
import { ENDPOINTS } from '../../constants/endpoints';
import DashboardLayout from '../../layouts/DashboardLayout';
import LocationPicker from '../../components/common/LocationPicker';

const AdminLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 21.0285,
    longitude: 105.8542,
    imageUrl: ''
  });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const resp = await api.get<ApiResponse<Location[]>>(ENDPOINTS.LOCATION.GET_ALL);
      setLocations(resp.data.result);
    } catch (err) {
      console.error("Error fetching locations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa địa điểm này khỏi danh sách gợi ý?")) return;
    try {
      await api.delete(ENDPOINTS.LOCATION.DELETE(id));
      fetchLocations();
    } catch (err) {
      alert("Lỗi khi xóa địa điểm.");
    }
  };

  const handeEdit = (loc: Location) => {
    setEditingLoc(loc);
    setFormData({
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      imageUrl: loc.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLoc) {
        await api.put(ENDPOINTS.LOCATION.UPDATE(editingLoc.id), formData);
      } else {
        await api.post(ENDPOINTS.LOCATION.CREATE, formData);
      }
      setIsModalOpen(false);
      fetchLocations();
    } catch (err) {
      alert("Lỗi khi lưu địa điểm.");
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Quản lý Địa điểm
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Danh sách các điểm đến phổ biến được gợi ý trên hệ thống</p>
          </div>
          <button 
            onClick={() => { setEditingLoc(null); setFormData({ name: '', address: '', latitude: 21.0285, longitude: 105.8542, imageUrl: '' }); setIsModalOpen(true); }}
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
            <Plus size={20} /> Thêm địa điểm
          </button>
        </div>

        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-hover)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem' }}>ĐỊA DANH</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem' }}>TỌA ĐỘ</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.875rem', textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</td></tr>
              ) : locations.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center' }}>Chưa có địa điểm nào</td></tr>
              ) : locations.map(loc => (
                <tr key={loc.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                   <td style={{ padding: '16px 24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '64px', height: '40px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                           {loc.imageUrl ? (
                               <img src={loc.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : (
                               <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                  <ImageIcon size={20} />
                               </div>
                           )}
                        </div>
                        <div>
                          <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{loc.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{loc.address}</p>
                        </div>
                     </div>
                   </td>
                   <td style={{ padding: '16px 24px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                   </td>
                   <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button onClick={() => handeEdit(loc)} style={{ padding: '8px', color: 'var(--primary)', background: 'none' }} title="Sửa">
                           <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleDelete(loc.id)} style={{ padding: '8px', color: 'var(--error)', background: 'none' }} title="Xóa">
                           <Trash2 size={18} />
                        </button>
                      </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
             <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>
               {editingLoc ? "Sửa địa điểm" : "Thêm địa điểm mới"}
             </h3>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                       <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Tên địa danh</label>
                       <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Ví dụ: Vịnh Hạ Long"
                       />
                    </div>
                    <div>
                       <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Địa chỉ hiển thị</label>
                       <textarea 
                        rows={2}
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="Địa chỉ chi tiết..."
                       />
                    </div>
                    <div>
                       <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>URL Ảnh đại diện</label>
                       <input 
                        type="text" 
                        value={formData.imageUrl}
                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                        placeholder="https://..."
                       />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                       <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Hủy</button>
                       <button type="submit" className="btn-primary" style={{ flex: 2 }}>{editingLoc ? "Cập nhật" : "Lưu địa điểm"}</button>
                    </div>
                </form>

                <div>
                   <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px' }}>Ghim trên bản đồ</label>
                   <LocationPicker 
                    initialLat={formData.latitude}
                    initialLng={formData.longitude}
                    onLocationSelect={(lat, lng, addr) => {
                      setFormData(prev => ({...prev, latitude: lat, longitude: lng, address: addr}));
                    }}
                   />
                </div>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminLocationsPage;
