import React, { useMemo, useState } from 'react';
import { FaBell, FaCalendarAlt, FaLock, FaSignOutAlt, FaUser, FaUtensils } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './InfoUser.css';
import TaskBar from '../TaskBar/TaskBar';

const tabs = [
  { id: 'overview', label: 'Tổng quan', icon: FaUser },
  { id: 'preferences', label: 'Thiết lập', icon: FaUtensils },
  { id: 'notifications', label: 'Nhắc việc', icon: FaBell },
  { id: 'security', label: 'Bảo mật', icon: FaLock },
];

const InfoUser = () => {
  const [activeTab, setActiveTab] = useState('overview');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const renderContent = () => {
    if (activeTab === 'preferences') {
      return (
        <section className="profile-panel">
          <h2>Thiết lập lập kế hoạch</h2>
          <div className="profile-grid">
            <div><span>Mục tiêu người lớn</span><strong>2.000 calo/ngày</strong></div>
            <div><span>Mục tiêu trẻ em</span><strong>1.300 calo/ngày</strong></div>
            <div><span>Tiền tệ</span><strong>VNĐ</strong></div>
            <div><span>Đơn vị định lượng</span><strong>gram</strong></div>
          </div>
        </section>
      );
    }

    if (activeTab === 'notifications') {
      return (
        <section className="profile-panel">
          <h2>Nhắc việc sử dụng app</h2>
          <ul className="profile-list">
            <li>Kiểm tra định lượng nguyên liệu trước khi lưu món mới.</li>
            <li>Gửi combo từ Gợi ý món sang Lập kế hoạch để không phải chọn lại.</li>
            <li>Xem danh sách nguyên liệu cần mua sau khi hoàn tất lịch tuần.</li>
          </ul>
        </section>
      );
    }

    if (activeTab === 'security') {
      return (
        <section className="profile-panel">
          <h2>Bảo mật tài khoản</h2>
          <div className="security-actions">
            <div><span>Trạng thái</span><strong>Đang đăng nhập</strong></div>
            <div><span>Phiên đăng nhập</span><strong>JWT nội bộ</strong></div>
            <button type="button" onClick={handleLogout}><FaSignOutAlt /> Đăng xuất</button>
          </div>
        </section>
      );
    }

    return (
      <section className="profile-panel">
        <h2>Tổng quan tài khoản</h2>
        <div className="profile-grid">
          <div><span>Tên tài khoản</span><strong>{username}</strong></div>
          <div><span>Vai trò</span><strong>Người dùng hệ thống</strong></div>
          <div><span>Luồng chính</span><strong>Kho món → Gợi ý → Kế hoạch</strong></div>
          <div><span>Trạng thái</span><strong>Sẵn sàng lập kế hoạch</strong></div>
        </div>
      </section>
    );
  };

  return (
    <div className="profile-page">
      <TaskBar />

      <main className="profile-shell">
        <section className="profile-hero">
          <div className="profile-avatar"><FaUser /></div>
          <div>
            <span className="profile-eyebrow">Hồ sơ người dùng</span>
            <h1>{username}</h1>
            <p>Quản lý thông tin sử dụng app, mục tiêu calo và các nhắc việc liên quan đến kế hoạch bữa ăn.</p>
          </div>
          <button type="button" onClick={() => navigate('/planmeal')}>
            <FaCalendarAlt /> Mở kế hoạch
          </button>
        </section>

        <section className="profile-layout">
          <nav className="profile-tabs" aria-label="Mục tài khoản">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={activeTab === id ? 'active' : ''}
                type="button"
                onClick={() => setActiveTab(id)}
              >
                <Icon /> {label}
              </button>
            ))}
          </nav>

          {renderContent()}
        </section>
      </main>
    </div>
  );
};

export default InfoUser;
