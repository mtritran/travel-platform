import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  Calendar,
  Compass,
  LogOut,
  MapPin,
  ShieldCheck,
  User,
  Wallet,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import { getFileUrl } from '../utils/format';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.roles?.some((role) => role.name === 'ADMIN');
  const isGuide = user?.roles?.some((role) => role.name === 'GUIDE');

  const roleLabel =
    user?.roles
      ?.map((role) => {
        if (role.name === 'ADMIN') return 'Quản trị viên';
        if (role.name === 'GUIDE') return 'Hướng dẫn viên';
        if (role.name === 'CUSTOMER') return 'Khách hàng';
        return role.name;
      })
      .join(', ') || 'Thành viên';

  const adminLinks: NavItem[] = [];

  const customerLinks: NavItem[] = [
    { to: '/requests', label: 'Yêu cầu chuyến đi', icon: <MapPin size={16} /> },
    { to: '/bookings', label: 'Lịch sử đặt tour', icon: <Calendar size={16} /> },
  ];

  const guideLinks: NavItem[] = isGuide
    ? [
        { to: '/guide/bookings', label: 'Đơn khách đặt', icon: <Calendar size={16} /> },
        { to: '/guide/tours', label: 'Quản lý tour', icon: <Briefcase size={16} /> },
      ]
    : [{ to: '/become-guide', label: 'Trở thành HDV', icon: <ShieldCheck size={16} /> }];

  const navLinks = isAdmin ? adminLinks : [...customerLinks, ...guideLinks];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="page-shell">
        <div className="app-header-wrap">
          <header className="glass-panel app-header">
            <div className="header-main">
              <Link to="/" className="brand-link">
                <span className="brand-mark">
                  <Compass size={24} />
                </span>
                <span className="brand-text">
                  <span className="brand-title">TravelX</span>
                  <span className="brand-subtitle">Local journeys, crafted better</span>
                </span>
              </Link>

              <nav className="header-nav">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="header-actions">
              <button type="button" className="icon-button" aria-label="Thông báo">
                <Bell size={18} />
              </button>

              <div style={{ position: 'relative' }} ref={menuRef}>
                <button 
                  type="button" 
                  className="profile-chip"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  style={{ cursor: 'pointer', border: 'none', background: 'var(--surface-hover)' }}
                >
                  <div className="profile-chip-meta">
                    <span className="profile-chip-name">{user?.fullName || 'Người khám phá'}</span>
                    <span className="profile-chip-role">{roleLabel}</span>
                  </div>
                  <span className="avatar-pill" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {user?.avatarUrl ? (
                      <img 
                        src={getFileUrl(user.avatarUrl)} 
                        alt="Avatar" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <User size={18} />
                    )}
                  </span>
                  <ChevronDown size={14} style={{ color: 'var(--text-secondary)', marginLeft: '4px', transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {isMenuOpen && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    width: '220px',
                    padding: '8px',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {!isAdmin && (
                      <>
                        <Link to="/profile" className="nav-link" onClick={() => setIsMenuOpen(false)} style={{ margin: 0, padding: '10px 12px' }}>
                          <User size={16} /> <span>Thông tin cá nhân</span>
                        </Link>
                        <Link to="/wallet" className="nav-link" onClick={() => setIsMenuOpen(false)} style={{ margin: 0, padding: '10px 12px' }}>
                          <Wallet size={16} /> <span>Ví của tôi</span>
                        </Link>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '4px 0' }} />
                      </>
                    )}
                    <button 
                      onClick={handleLogout} 
                      className="nav-link" 
                      style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', color: 'var(--error)', margin: 0, padding: '10px 12px' }}
                    >
                      <LogOut size={16} /> <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        </div>

        <main style={{ padding: '53px 0 40px', flex: 1 }}>{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
