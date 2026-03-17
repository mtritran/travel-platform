import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  User, 
  LogOut, 
  Search,
  Bell
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const userName = "Explorer"; // Hardcoded for now, will get from context later

  const handleLogout = () => {
    localStorage.removeItem('token');
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
            <Link to="/" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={18} /> Marketplace
            </Link>
            <Link to="/requests" style={{ color: 'var(--text-secondary)', fontWeight: '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={18} /> Trip Requests
            </Link>
            <Link to="/bookings" style={{ color: 'var(--text-secondary)', fontWeight: '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={18} /> My Bookings
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ background: 'none', color: 'var(--text-secondary)', padding: '8px' }}>
            <Bell size={20} />
          </button>
          
          <div style={{ padding: '4px 12px', background: 'var(--surface-hover)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{userName}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Member</p>
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
