import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBookOpen, FaCalendarAlt, FaInfoCircle, FaLightbulb, FaUtensils } from 'react-icons/fa';
import './Footer.css';

const footerLinks = [
  { label: 'Tổng quan', path: '/main' },
  { label: 'Lập kế hoạch', path: '/planmeal' },
  { label: 'Kho món', path: '/ingredient' },
  { label: 'Gợi ý món', path: '/makemeal' },
  { label: 'Giới thiệu', path: '/aboutus' },
];

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <section className="footer-brand-block">
          <div className="footer-brand">
            <span><FaUtensils /></span>
            <strong>Meal Planner</strong>
          </div>
          <p>Quản lý món ăn, gợi ý bữa phù hợp và chuyển thẳng thành kế hoạch ăn uống trong tuần.</p>
        </section>

        <section className="footer-link-block">
          <h3>Điều hướng</h3>
          <div className="footer-links">
            {footerLinks.map((link) => (
              <button key={link.path} type="button" onClick={() => navigate(link.path)}>
                {link.label}
              </button>
            ))}
          </div>
        </section>

        <section className="footer-link-block">
          <h3>Luồng sử dụng</h3>
          <ul className="footer-flow">
            <li><FaBookOpen /> Tạo món và định lượng nguyên liệu</li>
            <li><FaLightbulb /> Gợi ý combo theo calo và ngân sách</li>
            <li><FaCalendarAlt /> Đưa combo vào lịch tuần</li>
            <li><FaInfoCircle /> Theo dõi chi phí và nguyên liệu cần mua</li>
          </ul>
        </section>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Meal Planner</span>
        <span>Đồ án quản lý kế hoạch bữa ăn</span>
      </div>
    </footer>
  );
};

export default Footer;
