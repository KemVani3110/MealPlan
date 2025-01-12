/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import './Footer.css';
import { useNavigate } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa'; // Import social media icons

const Footer = () => {
  const navigate = useNavigate();

  const HandleAboutUs = () => {
    navigate('/aboutus');
  };

  return (
    <div className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Thông tin liên hệ</h3>
          <p>Email: info@example.com</p>
          <p>About Us: <a onClick={HandleAboutUs}>Here</a></p>
          <p>Phone: +123 456 789</p>
        </div>

        <div className="footer-section">
          <h3>Liên kết nhanh</h3>
          <ul>
            <li><a href="#">Trang chủ</a></li>
            <li><a href="#">Các món ăn phổ biến</a></li>
            <li><a href="#">Lên kế hoạch bữa ăn</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Chính sách</h3>
          <ul>
            <li><a href="#">Chính sách bảo mật</a></li>
            <li><a href="#">Điều khoản sử dụng</a></li>
          </ul>
        </div>

        <div className="footer-section footer-social">
          <h3>Follow Us</h3>
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
          </div>
        </div>
      </div>

      <div className="footer-copyright">
        <p>© 2024 Menu App. All Rights Reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
