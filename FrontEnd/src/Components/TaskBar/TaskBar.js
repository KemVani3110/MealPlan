import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaBookOpen,
  FaCalendarAlt,
  FaChevronDown,
  FaHome,
  FaInfoCircle,
  FaLightbulb,
  FaSignOutAlt,
  FaUserCircle,
  FaUsers,
  FaUtensils,
} from 'react-icons/fa';
import './TaskBar.css';

const navItems = [
  { label: 'Tổng quan', path: '/main', icon: FaHome },
  { label: 'Lập kế hoạch', path: '/planmeal', icon: FaCalendarAlt },
  { label: 'Kho món', path: '/ingredient', icon: FaBookOpen },
  { label: 'Gợi ý món', path: '/makemeal', icon: FaLightbulb },
  { label: 'Cộng đồng', path: '/community', icon: FaUsers },
  { label: 'Giới thiệu', path: '/aboutus', icon: FaInfoCircle },
];

const getUsername = () => {
  const token = localStorage.getItem('token');
  if (!token) return 'Tài khoản';

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || 'Tài khoản';
  } catch {
    return 'Tài khoản';
  }
};

const TaskBar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const username = useMemo(getUsername, []);

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleNavigate = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <header className="app-header">
      <button className="app-brand" type="button" onClick={() => handleNavigate('/main')}>
        <span className="brand-mark"><FaUtensils /></span>
        <span>
          <strong>Meal Planner</strong>
          <small>Food, budget, weekly plan</small>
        </span>
      </button>

      <nav className="app-nav" aria-label="Điều hướng chính">
        {navItems.map(({ label, path, icon: Icon }) => (
          <button
            key={path}
            className={`app-nav-item ${location.pathname === path ? 'active' : ''}`}
            type="button"
            onClick={() => handleNavigate(path)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="app-user-menu" ref={dropdownRef}>
        <button className="user-menu-trigger" type="button" onClick={() => setDropdownOpen((open) => !open)}>
          <FaUserCircle />
          <span>{username}</span>
          <FaChevronDown className={dropdownOpen ? 'chevron open' : 'chevron'} />
        </button>

        {dropdownOpen && (
          <div className="user-dropdown">
            <button type="button" onClick={() => handleNavigate('/infouser')}>
              <FaUserCircle /> Hồ sơ
            </button>
            <button type="button" onClick={handleLogout}>
              <FaSignOutAlt /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TaskBar;
