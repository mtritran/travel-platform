import React from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  User, 
  LogOut, 
  Bell,
  ShieldCheck,
  PlusCircle,
  Briefcase
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="glass-panel" style={{
        margin: '16px',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '16px',
        zIndex: 100,
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={32} color="var(--primary)" />
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.025em' }}>TravelX</span>
          </Link>

          <nav style={{ display: 'flex', gap: '24px' }}>
            {user?.roles?.some(r => r.name === 'ADMIN') ? (
              null
            ) : (
              <>
                <NavLink to="/requests" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-primary)', fontWeight: isActive ? '700' : '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' })}>
                  <MapPin size={18} /> Yêu cầu chuyến đi
                </NavLink>
                <NavLink to="/bookings" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-primary)', fontWeight: isActive ? '700' : '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' })}>
                  <Calendar size={18} /> Lịch sử đặt tour
                </NavLink>
                {user?.roles?.some(r => r.name === 'GUIDE') && (
                  <>
                    <NavLink to="/guide/bookings" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-primary)', fontWeight: isActive ? '700' : '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' })}>
                      <Calendar size={18} /> Đơn khách đặt
                    </NavLink>
                    <NavLink to="/guide/tours" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-primary)', fontWeight: isActive ? '700' : '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' })}>
                      <Briefcase size={18} /> Quản lý Tour
                    </NavLink>
                    <NavLink to="/guide/create-tour" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-primary)', fontWeight: isActive ? '700' : '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' })}>
                      <PlusCircle size={18} /> Đăng Tour mới
                    </NavLink>
                  </>
                )}
                {!user?.roles?.some(r => r.name === 'GUIDE') && (
                  <NavLink to="/become-guide" style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text-primary)', fontWeight: isActive ? '700' : '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' })}>
                    <ShieldCheck size={18} /> Trở thành HDV
                  </NavLink>
                )}
              </>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ background: 'none', color: 'var(--text-secondary)', padding: '8px' }}>
            <Bell size={20} />
          </button>
          
          <div style={{ padding: '4px 12px', background: 'var(--surface-hover)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.fullName || 'Người khám phá'}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {user?.roles?.map(r => {
                  if (r.name === 'ADMIN') return 'Quản trị viên';
                  if (r.name === 'GUIDE') return 'Hướng dẫn viên';
                  if (r.name === 'CUSTOMER') return 'Khách hàng';
                  return r.name;
                }).join(', ') || 'Thành viên'}
              </p>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(to bottom right, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
               <User size={20} style={{ margin: 'auto' }} />
            </div>
            <button onClick={handleLogout} style={{ background: 'none', color: 'var(--error)', padding: '4px' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '0 16px 32px 16px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
