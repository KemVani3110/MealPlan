import React, { useMemo, useState } from 'react';
import './InfoUser.css';
import { FaArrowLeft, FaBell, FaCogs, FaHome, FaLock, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const themes = [
  'rgba(15, 118, 110, 0.9)',
  'rgba(30, 64, 175, 0.86)',
  'rgba(88, 28, 135, 0.82)',
  'rgba(22, 101, 52, 0.82)',
];

const InfoUser = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState(themes[0]);
  const navigate = useNavigate();

  const username = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return 'Người dùng';

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username || 'Người dùng';
    } catch {
      return 'Người dùng';
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <header className="content-header">
              <h1>Tổng quan tài khoản</h1>
              <p>Theo dõi các thông tin chính phục vụ lập kế hoạch ăn uống.</p>
            </header>
            <section className="content-section">
              <h2>Thiết lập khuyến nghị</h2>
              <div className="settings-grid">
                <div className="settings-item">Mục tiêu người lớn: 2.000 calo/ngày</div>
                <div className="settings-item">Mục tiêu trẻ em: 1.300 calo/ngày</div>
                <div className="settings-item">Tiền tệ: VNĐ</div>
              </div>
            </section>
          </div>
        );
      case 'profile':
        return (
          <div>
            <header className="content-header">
              <h1>Hồ sơ</h1>
              <p>Thông tin đăng nhập hiện tại của bạn.</p>
            </header>
            <section className="content-section">
              <h2>Thông tin cá nhân</h2>
              <div className="profile-grid">
                <div className="profile-item">Tên tài khoản: {username}</div>
                <div className="profile-item">Vai trò: Người dùng hệ thống</div>
                <div className="profile-item">Trạng thái: Đang đăng nhập</div>
              </div>
            </section>
          </div>
        );
      case 'notifications':
        return (
          <div>
            <header className="content-header">
              <h1>Thông báo</h1>
              <p>Các nhắc nhở nên có trong quá trình sử dụng app.</p>
            </header>
            <section className="content-section">
              <h2>Nhắc nhở gần đây</h2>
              <ul className="notifications-list">
                <li className="notification-item">Kiểm tra định lượng nguyên liệu trước khi lưu món mới.</li>
                <li className="notification-item">Đặt ngày bắt đầu và kết thúc trước khi lưu kế hoạch tuần.</li>
                <li className="notification-item">Xem lại chi phí tuần nếu thêm nhiều khẩu phần.</li>
              </ul>
            </section>
          </div>
        );
      case 'security':
        return (
          <div>
            <header className="content-header">
              <h1>Bảo mật</h1>
              <p>Các hành động bảo mật cơ bản cho tài khoản.</p>
            </header>
            <section className="content-section">
              <h2>Trạng thái</h2>
              <div className="security-grid">
                <button className="security-button" type="button">Token đăng nhập đang hoạt động</button>
                <button className="security-button" type="button">Đăng xuất ở thanh điều hướng</button>
                <button className="security-button" type="button">Không chia sẻ tài khoản</button>
              </div>
            </section>
          </div>
        );
      case 'settings':
        return (
          <div>
            <header className="content-header">
              <h1>Cài đặt giao diện</h1>
              <p>Đổi màu nền khu vực tài khoản.</p>
            </header>
            <section className="content-section">
              <h2>Chủ đề</h2>
              <div className="settings-grid">
                <div className="theme-selector">
                  {themes.map((color) => (
                    <button
                      key={color}
                      className="theme-option"
                      type="button"
                      style={{ backgroundColor: color }}
                      onClick={() => setTheme(color)}
                      aria-label="Đổi màu giao diện"
                    />
                  ))}
                </div>
                <div className="settings-item">Ngôn ngữ: Tiếng Việt</div>
                <div className="settings-item">Đơn vị calo: calo</div>
              </div>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="info-user-wrapper" style={{ backgroundColor: theme }}>
      <aside className="sidebar">
        <div className="user-profile">
          <div style={{ display: 'flex', marginLeft: '-20%', gap: '20px' }}>
            <button className="back-to-home" type="button" onClick={() => navigate('/main')}>
              <FaArrowLeft className="icon" />
            </button>
            <div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-VLNNe21fRCrEEMk1TF0i8BzrjxqDR5s6zL89sa28-ouSiB8aBVH2VuPqG_4sNNf_NUQ&usqp=CAU"
                alt="User Avatar"
                className="avatar"
                style={{ objectFit: 'cover' }}
              />
              <h2 className="user-name">{username}</h2>
              <p className="user-email">Meal planner account</p>
            </div>
          </div>
        </div>
        <ul className="menu">
          <li className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <FaHome className="icon" /> Tổng quan
          </li>
          <li className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <FaUser className="icon" /> Hồ sơ
          </li>
          <li className={`menu-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <FaBell className="icon" /> Thông báo
          </li>
          <li className={`menu-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <FaLock className="icon" /> Bảo mật
          </li>
          <li className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <FaCogs className="icon" /> Cài đặt
          </li>
        </ul>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default InfoUser;
