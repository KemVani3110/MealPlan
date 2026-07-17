import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCog, FaHeart } from 'react-icons/fa';
import './MainForm.css';
import TaskBar from '../TaskBar/TaskBar';
import Snowfall from '../Snowfall/SnowFall';
import Footer from '../Footer/Footer';
import { formatCalories, formatCurrency } from '../../utils/format';

const API_URL = 'http://localhost:3060';

const slideImages = [
  'https://cellphones.com.vn/sforum/wp-content/uploads/2023/09/mon-ngon-dai-khach-15.jpg',
  'https://tuongtaccongdong.com/images/du-lich-khach-san/kinh-nghiem/bai-75/21-mon-an-ngon-nhat-viet-nam-1.jpg',
  'https://www.startravel.vn/upload/2019-11-05/camnhi-192028042035-cua-sot-ot.jpg',
];

const internationalFoods = [
  {
    country: 'Nhật Bản',
    dish: 'Sushi',
    description: 'Cơm cuộn, hải sản và rong biển, phù hợp để tham khảo khẩu phần nhẹ.',
    image: 'https://file.hstatic.net/200000391061/article/sushi-mon-an-quoc-dan-cua-nguoi-nhat-2_c940b210a8094194b29216c31a3620d0_1024x1024.jpg',
  },
  {
    country: 'Ý',
    dish: 'Pizza',
    description: 'Món giàu năng lượng, nên dùng như bữa chính và cân đối rau xanh.',
    image: 'https://img.dominos.vn/phan-biet-pizza-kieu-my-va-kieu-y-2.jpg',
  },
  {
    country: 'Thái Lan',
    dish: 'Tom Yum',
    description: 'Canh chua cay đậm vị, gợi ý tốt cho bữa có hải sản.',
    image: 'https://vcdn1-dulich.vnecdn.net/2022/01/06/thai-tom-yum-milky-soup-1-jpeg-2425-6503-1641457305.jpg?w=460&h=0&q=100&dpr=2&fit=crop&s=NgnUGVnNn09QbhS3libX3Q',
  },
];

const fallbackVietnameseFoods = [
  { name: 'Phở bò', description: 'Bữa sáng nhiều năng lượng.', image: 'https://mycogroup.com.vn/wp-content/uploads/2023/05/pho-viet-nam-1.jpg' },
  { name: 'Bánh xèo', description: 'Nên ăn kèm rau sống để cân bằng.', image: 'https://cdn.tgdd.vn/Files/2020/05/20/1256908/troi-mua-thu-lam-banh-xeo-kieu-mien-bac-gion-ngon-it-dau-mo-202005201034115966.jpg' },
  { name: 'Gỏi cuốn', description: 'Món nhẹ, dễ thêm vào bữa phụ.', image: 'https://cdn.tgdd.vn/Files/2017/03/22/963738/cach-lam-goi-cuon-tom-thit-thom-ngon-cho-bua-com-gian-don-202203021427281747.jpg' },
];

const MainForm = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 5000);

    return () => clearInterval(slideInterval);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/food-items`)
      .then((response) => response.json())
      .then((data) => setFoods(Array.isArray(data) ? data : []))
      .catch((error) => console.error('Error fetching foods:', error));
  }, []);

  const featuredFoods = useMemo(() => foods.slice(0, 6), [foods]);
  const trendingFoods = useMemo(() => (foods.length > 0 ? foods : fallbackVietnameseFoods), [foods]);
  const totalCalories = foods.reduce((total, food) => total + Number(food.foodCalories || food.calories || 0), 0);
  const averageCalories = foods.length > 0 ? totalCalories / foods.length : 0;

  const notifications = [
    { title: 'Dữ liệu món ăn', message: `Đang có ${foods.length} món trong hệ thống.` },
    { title: 'Lên kế hoạch', message: 'Bạn có thể tạo lịch ăn tuần và lưu lại theo tên riêng.' },
    { title: 'Nguyên liệu', message: 'Mỗi món nên có định lượng nguyên liệu để tính chi phí chính xác.' },
  ];

  const handleNext = () => {
    if (trendingFoods.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % trendingFoods.length);
  };

  const handlePrev = () => {
    if (trendingFoods.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + trendingFoods.length) % trendingFoods.length);
  };

  return (
    <div className="main-container">
      <TaskBar />
      <Snowfall />

      <div className="notification-container">
        <button className="notification-icon" type="button" onClick={() => setShowNotifications(!showNotifications)}>
          <FaBell />
        </button>
        {showNotifications && (
          <div className="notifications-panel">
            <h4>Thông báo</h4>
            {notifications.map((notification) => (
              <div key={notification.title} className="notification-item">
                <h5>{notification.title}</h5>
                <p>{notification.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <header className="welcome-section">
        <div className="carousel">
          {slideImages.map((image, index) => (
            <div
              key={image}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          <div className="carousel-dots">
            {slideImages.map((image, index) => (
              <button
                key={image}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                type="button"
                aria-label={`Chuyển ảnh ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </header>

      <section className="stats-section">
        <div className="stat-card">
          <h3>{foods.length}</h3>
          <p>Món ăn</p>
        </div>
        <div className="stat-card">
          <h3>{formatCalories(averageCalories)}</h3>
          <p>Calo trung bình</p>
        </div>
        <div className="stat-card">
          <h3>{featuredFoods.length}</h3>
          <p>Món nổi bật</p>
        </div>
      </section>

      <section className="features-section">
        <div className="feature-card">
          <h4>Lập kế hoạch tuần</h4>
          <p>Chọn món theo từng bữa, tính chi phí và nguyên liệu cần mua.</p>
          <button className="feature-btn" type="button" onClick={() => navigate('/planmeal')}>Lập kế hoạch</button>
        </div>
        <div className="feature-card">
          <h4>Quản lý món ăn</h4>
          <p>Thêm món, sửa định lượng nguyên liệu và cập nhật calo thực tế.</p>
          <button className="feature-btn" type="button" onClick={() => navigate('/ingredient')}>Quản lý món</button>
        </div>
        <div className="feature-card">
          <h4>Gợi ý bữa ăn</h4>
          <p>Chọn nhiều món cho một bữa và so sánh với nhu cầu calo.</p>
          <button className="feature-btn" type="button" onClick={() => navigate('/makemeal')}>Gợi ý món</button>
        </div>
        <div className="feature-card">
          <h4>Thiết lập cá nhân</h4>
          <p>Cập nhật thông tin tài khoản và tùy chọn sử dụng app.</p>
          <button className="feature-btn" type="button" onClick={() => navigate('/infouser')}><FaCog /> Cài đặt</button>
        </div>
      </section>

      <section className="international-cuisine">
        <h2 className="cuisine-title">Khám phá ẩm thực quốc tế</h2>
        <div className="cuisine-grid">
          {internationalFoods.map((item) => (
            <div key={item.dish} className="cuisine-card">
              <img src={item.image} alt={item.dish} className="cuisine-image" />
              <div className="cuisine-info">
                <h3 className="cuisine-dish">{item.dish}</h3>
                <p className="cuisine-country">{item.country}</p>
                <p className="cuisine-description">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="recipes-section">
        <h2 className="cuisine-title2">Món Việt trong hệ thống</h2>
        <div className="recipes-grid">
          {(featuredFoods.length > 0 ? featuredFoods : fallbackVietnameseFoods).map((item) => (
            <div key={item.Fid || item.name} className="recipe-card">
              <img src={item.image} alt={item.foodName || item.name} />
              <div className="recipe-info">
                <h3>{item.foodName || item.name}</h3>
                <p>{item.description}</p>
                <p>{item.foodCalories ? formatCalories(item.foodCalories) : 'Món gợi ý'}</p>
                <FaHeart className="favorite-icon" />
              </div>
              <button className="view-recipe-btn" type="button" onClick={() => navigate('/makemeal')}>Chọn món</button>
            </div>
          ))}
        </div>
      </section>

      <section className="trending-food-wrapper">
        <button className="trending-food-btn prev-btn" type="button" onClick={handlePrev}>
          &#10094;
        </button>
        <div className="trending-food-carousel">
          {trendingFoods.map((item, index) => {
            let position = 'hidden';
            if (index === currentIndex) position = 'active';
            else if (index === (currentIndex - 1 + trendingFoods.length) % trendingFoods.length) position = 'prev-1';
            else if (index === (currentIndex - 2 + trendingFoods.length) % trendingFoods.length) position = 'prev-2';
            else if (index === (currentIndex + 1) % trendingFoods.length) position = 'next-1';
            else if (index === (currentIndex + 2) % trendingFoods.length) position = 'next-2';

            return (
              <div key={item.Fid || item.name} className={`trending-food-card ${position}`}>
                <img src={item.image} alt={item.foodName || item.name} />
                <span>{item.foodName || item.name}</span>
                {item.foodPrice && <small>{formatCurrency(item.foodPrice)}</small>}
              </div>
            );
          })}
        </div>
        <button className="trending-food-btn next-btn" type="button" onClick={handleNext}>
          &#10095;
        </button>
      </section>

      <div className="Footer">
        <Footer />
      </div>
    </div>
  );
};

export default MainForm;
