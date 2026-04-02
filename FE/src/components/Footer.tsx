import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';

const exploreLinks = [
  { to: '/', label: 'Khám phá chuyến đi' },
  { to: '/requests', label: 'Đăng yêu cầu chuyến đi' },
  { to: '/bookings', label: 'Quản lý lịch sử đặt tour' },
];

const guideLinks = [
  { to: '/become-guide', label: 'Trở thành hướng dẫn viên' },
  { to: '/wallet', label: 'Ví và thanh toán' },
  { to: '/profile', label: 'Cập nhật thông tin cá nhân' },
];

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-shell glass-panel">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link to="/" className="brand-link site-footer-brand-link">
              <span className="brand-mark">
                <Compass size={22} />
              </span>
              <span className="brand-text">
                <span className="brand-title">TravelX</span>
                <span className="brand-subtitle">Local journeys, crafted better</span>
              </span>
            </Link>

            <p className="site-footer-copy">
              Kết nối du khách với hướng dẫn viên địa phương đáng tin cậy để mọi hành
              trình trở nên rõ ràng, an tâm và dễ nhớ hơn.
            </p>

            <div className="site-footer-socials" aria-label="Kênh liên hệ TravelX">
              <a href="mailto:support@travelx.vn" className="site-footer-social">
                <Mail size={16} />
                <span>Email</span>
              </a>
              <a href="#" className="site-footer-social" aria-label="Facebook">
                <Facebook size={16} />
              </a>
              <a href="#" className="site-footer-social" aria-label="Instagram">
                <Instagram size={16} />
              </a>
            </div>
          </div>

          <div className="site-footer-section">
            <p className="site-footer-heading">Dành cho du khách</p>
            <div className="site-footer-links">
              {exploreLinks.map((link) => (
                <Link key={link.to} to={link.to} className="site-footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="site-footer-section">
            <p className="site-footer-heading">Tài khoản và dịch vụ</p>
            <div className="site-footer-links">
              {guideLinks.map((link) => (
                <Link key={link.to} to={link.to} className="site-footer-link">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="site-footer-section">
            <p className="site-footer-heading">Liên hệ</p>
            <div className="site-footer-contact-list">
              <a href="tel:19001234" className="site-footer-contact-item">
                <span className="site-footer-contact-icon">
                  <Phone size={16} />
                </span>
                <span>1900 1234</span>
              </a>
              <a href="mailto:support@travelx.vn" className="site-footer-contact-item">
                <span className="site-footer-contact-icon">
                  <Mail size={16} />
                </span>
                <span>support@travelx.vn</span>
              </a>
              <div className="site-footer-contact-item site-footer-contact-static">
                <span className="site-footer-contact-icon">
                  <MapPin size={16} />
                </span>
                <span>Đà Nẵng, Việt Nam</span>
              </div>
            </div>

            <div className="site-footer-trust">
              <ShieldCheck size={18} />
              <div>
                <strong>Thanh toán minh bạch</strong>
                <span>Thông tin đặt chỗ và liên hệ được bảo vệ trong hệ thống.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p>Copyright {year} TravelX. Nền tảng kết nối chuyến đi địa phương.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
