import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaBookOpen, FaCalendarAlt, FaChevronRight, FaLightbulb, FaUtensils } from 'react-icons/fa';
import './MainForm.css';
import TaskBar from '../TaskBar/TaskBar';
import Footer from '../Footer/Footer';
import { formatCalories, formatCurrency } from '../../utils/format';

const API_URL = 'http://localhost:3060';

const workflowCards = [
  {
    title: '1. Chuẩn hóa món',
    description: 'Cập nhật ảnh, mô tả, định lượng nguyên liệu, calo và chi phí mỗi khẩu phần.',
    path: '/ingredient',
    icon: FaBookOpen,
  },
  {
    title: '2. Gợi ý bữa',
    description: 'Tạo combo theo số người, trẻ em, ngân sách và mục tiêu calo.',
    path: '/makemeal',
    icon: FaLightbulb,
  },
  {
    title: '3. Lập kế hoạch tuần',
    description: 'Đưa combo vào từng ngày, từng bữa và tổng hợp nguyên liệu cần mua.',
    path: '/planmeal',
    icon: FaCalendarAlt,
  },
];

const MainForm = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/food-items`)
      .then((response) => response.json())
      .then((data) => setFoods(Array.isArray(data) ? data : []))
      .catch((error) => console.error('Error fetching foods:', error));
  }, []);

  const stats = useMemo(() => {
    const totalCalories = foods.reduce((total, food) => total + Number(food.foodCalories || 0), 0);
    const totalCost = foods.reduce((total, food) => total + Number(food.foodPrice || 0), 0);
    const ingredientCount = new Set(foods.flatMap((food) => (food.ingredients || []).map((ingredient) => ingredient.ingredientId))).size;

    return {
      foodCount: foods.length,
      ingredientCount,
      averageCalories: foods.length ? totalCalories / foods.length : 0,
      averageCost: foods.length ? totalCost / foods.length : 0,
    };
  }, [foods]);

  const topFoods = useMemo(() => {
    return [...foods]
      .sort((a, b) => Number(b.foodCalories || 0) - Number(a.foodCalories || 0))
      .slice(0, 4);
  }, [foods]);

  const lowCostFoods = useMemo(() => {
    return [...foods]
      .sort((a, b) => Number(a.foodPrice || 0) - Number(b.foodPrice || 0))
      .slice(0, 4);
  }, [foods]);

  const notifications = [
    `Kho hiện có ${stats.foodCount} món và ${stats.ingredientCount} nguyên liệu đã liên kết.`,
    'Bạn có thể gửi món từ Kho món sang Gợi ý món hoặc Lập kế hoạch.',
    'Gợi ý món có thể tạo combo theo ngân sách rồi chuyển thẳng vào lịch tuần.',
  ];

  return (
    <div className="main-page">
      <TaskBar />

      <main className="main-shell">
        <section className="dashboard-hero">
          <div className="hero-copy-block">
            <span className="main-eyebrow">Meal Planner Dashboard</span>
            <h1>Quản lý món ăn, gợi ý bữa và lập kế hoạch trong một luồng</h1>
            <p>
              Bắt đầu từ kho món đã định lượng, tạo combo phù hợp ngân sách rồi đưa vào lịch tuần để theo dõi calo,
              chi phí và danh sách nguyên liệu cần mua.
            </p>
            <div className="hero-actions-main">
              <button type="button" onClick={() => navigate('/planmeal')}>Mở kế hoạch tuần</button>
              <button type="button" onClick={() => navigate('/makemeal')}>Tạo bữa đề xuất</button>
            </div>
          </div>

          <div className="hero-status-panel">
            <button className="notification-icon" type="button" onClick={() => setShowNotifications((open) => !open)}>
              <FaBell />
              <span>Nhắc việc</span>
            </button>
            {showNotifications && (
              <div className="notifications-panel">
                <h4>Thông báo vận hành</h4>
                {notifications.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            )}
            <div className="hero-metric">
              <span>Món trong hệ thống</span>
              <strong>{stats.foodCount}</strong>
            </div>
            <div className="hero-metric">
              <span>Calo trung bình</span>
              <strong>{formatCalories(stats.averageCalories)}</strong>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stat-card">
            <span><FaUtensils /></span>
            <strong>{stats.foodCount}</strong>
            <p>Món ăn</p>
          </div>
          <div className="stat-card">
            <span><FaBookOpen /></span>
            <strong>{stats.ingredientCount}</strong>
            <p>Nguyên liệu liên kết</p>
          </div>
          <div className="stat-card">
            <span><FaLightbulb /></span>
            <strong>{formatCalories(stats.averageCalories)}</strong>
            <p>Calo trung bình</p>
          </div>
          <div className="stat-card">
            <span><FaCalendarAlt /></span>
            <strong>{formatCurrency(stats.averageCost)}</strong>
            <p>Chi phí trung bình</p>
          </div>
        </section>

        <section className="workflow-section">
          <div className="section-heading">
            <span className="main-eyebrow">Luồng chính</span>
            <h2>Ba bước làm việc liền mạch</h2>
          </div>
          <div className="workflow-grid">
            {workflowCards.map(({ title, description, path, icon: Icon }) => (
              <button key={path} className="workflow-card" type="button" onClick={() => navigate(path)}>
                <Icon />
                <strong>{title}</strong>
                <p>{description}</p>
                <span>Mở trang <FaChevronRight /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="main-data-grid">
          <div className="main-data-panel">
            <div className="section-heading compact">
              <h2>Món nhiều năng lượng</h2>
              <button type="button" onClick={() => navigate('/makemeal')}>Gợi ý bữa</button>
            </div>
            <div className="food-list">
              {topFoods.map((food) => (
                <article key={food.Fid} className="food-row">
                  <img src={food.image} alt={food.foodName} />
                  <div>
                    <strong>{food.foodName}</strong>
                    <span>{formatCalories(food.foodCalories)} - {formatCurrency(food.foodPrice)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="main-data-panel">
            <div className="section-heading compact">
              <h2>Món tiết kiệm</h2>
              <button type="button" onClick={() => navigate('/ingredient')}>Xem kho món</button>
            </div>
            <div className="food-list">
              {lowCostFoods.map((food) => (
                <article key={food.Fid} className="food-row">
                  <img src={food.image} alt={food.foodName} />
                  <div>
                    <strong>{food.foodName}</strong>
                    <span>{formatCurrency(food.foodPrice)} - {formatCalories(food.foodCalories)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MainForm;
