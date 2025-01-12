// MainForm.js
import React, { useState, useEffect } from 'react';
import './MainForm.css';
import TaskBar from '../TaskBar/TaskBar';
import { FaBell, FaCog, FaHeart, FaSearch } from 'react-icons/fa';
import Footer from '../Footer/Footer';

const MainForm = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ meals: 100, users: 50, reviews: 200 });
  const [notifications] = useState([
    { title: "Món ăn mới", message: "Món ăn mới đã được thêm vào danh sách!" },
    { title: "Đánh giá mới", message: "Xem các đánh giá gần đây từ cộng đồng." },
    { title: "Cập nhật thành công", message: "Kế hoạch bữa ăn của bạn đã được cập nhật." },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideImages = [
    'https://cellphones.com.vn/sforum/wp-content/uploads/2023/09/mon-ngon-dai-khach-15.jpg',
    'https://tuongtaccongdong.com/images/du-lich-khach-san/kinh-nghiem/bai-75/21-mon-an-ngon-nhat-viet-nam-1.jpg',
    'https://www.startravel.vn/upload/2019-11-05/camnhi-192028042035-cua-sot-ot.jpg'
  ];

  const [trendingFoods, setTrendingFoods] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 5000);

    return () => clearInterval(slideInterval);
  }, [slideImages.length]);

  useEffect(() => {
    // Fetch trending foods from API
    fetch('http://localhost:3060/food-items') // Replace with actual API
      .then((response) => response.json())
      .then((data) => setTrendingFoods(data))
      .catch((error) => console.error('Error fetching trending foods:', error));
  }, []);

  const Snowfall = () => {
    useEffect(() => {
      const container = document.querySelector('.snowfall-container');

      if (!container) {
        console.error("Container '.snowfall-container' không tồn tại trong DOM!");
        return;
      }

      const createSnowflake = () => {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');

        // Cài đặt thuộc tính ngẫu nhiên cho bông tuyết
        snowflake.style.backgroundImage = "url('/snowflake.png')";
        snowflake.style.width = `${Math.random() * 20 + 10}px`;
        snowflake.style.height = snowflake.style.width;
        snowflake.style.left = `${Math.random() * 100}vw`;
        snowflake.style.animationDuration = `${Math.random() * 5 + 5}s`; // Tốc độ rơi
        snowflake.style.opacity = Math.random();
        snowflake.style.animationName = Math.random() > 0.5 ? 'fall' : 'fall-spin'; // Hiệu ứng ngẫu nhiên

        container.appendChild(snowflake);

        // Xóa bông tuyết khi rơi xong
        snowflake.addEventListener('animationend', () => {
          snowflake.remove();
        });
      };

      const interval = setInterval(createSnowflake, 150); // Tạo bông tuyết đều đặn

      return () => clearInterval(interval);
    }, []);

    return <div className="snowfall-container"></div>;
  };

  const ChristmasLights = () => {
    useEffect(() => {
      const lights = document.querySelectorAll('.christmas-light');

      const changeColor = () => {
        lights.forEach((light) => {
          const colors = ['red', 'green', 'blue', 'yellow', 'white'];
          light.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        });
      };

      const interval = setInterval(changeColor, 500); // Đổi màu đèn mỗi 500ms

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="christmas-lights">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="christmas-light"></div>
        ))}
      </div>
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingFoods.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingFoods.length) % trendingFoods.length);
  };


  return (
    <div className="main-container">
      <TaskBar />
      <Snowfall />
      {/* Notifications Icon */}
      <div className="notification-container">
        <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
          <FaBell />
        </div>
        {showNotifications && (
          <div className="notifications-panel">
            <h4>Thông báo</h4>
            {notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                <h5>{notification.title}</h5>
                <p>{notification.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Snowfall />
      {/* Welcome Section */}
      <header className="welcome-section">
        <div className="carousel">
          {slideImages.map((image, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            ></div>
          ))}
          <div className="carousel-dots">
            {slideImages.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              ></span>
            ))}
          </div>
        </div>
      </header>
      <Snowfall />

      <section className="international-cuisine">
        <h2 className="cuisine-title">Khám phá Ẩm thực Quốc tế</h2>
        <div className="cuisine-grid">
          {[
            { country: "Nhật Bản", dish: "Sushi", description: "Món ăn truyền thống với cá sống và cơm cuộn.", image: "https://file.hstatic.net/200000391061/article/sushi-mon-an-quoc-dan-cua-nguoi-nhat-2_c940b210a8094194b29216c31a3620d0_1024x1024.jpg" },
            { country: "Ý", dish: "Pizza", description: "Bánh pizza nổi tiếng với phô mai và cà chua.", image: "https://img.dominos.vn/phan-biet-pizza-kieu-my-va-kieu-y-2.jpg" },
            { country: "Thái Lan", dish: "Tom Yum", description: "Súp chua cay đặc trưng của Thái.", image: "https://vcdn1-dulich.vnecdn.net/2022/01/06/thai-tom-yum-milky-soup-1-jpeg-2425-6503-1641457305.jpg?w=460&h=0&q=100&dpr=2&fit=crop&s=NgnUGVnNn09QbhS3libX3Q" },
            { country: "Pháp", dish: "Croissant", description: "Bánh sừng bò với lớp bột mềm mịn.", image: "https://cdn.tgdd.vn/Files/2021/08/06/1373418/cach-lam-banh-sung-bo-banh-croissant-ngan-lop-thom-ngon-noi-tieng-cua-phap-202108061216171587.jpg" },
            { country: "Ấn Độ", dish: "Curry", description: "Cà ri thơm ngon với gia vị phong phú.", image: "https://goldensmiletravel.com/uploads/images/2023/09/06/image9-1676535943-928-width1500height1000-1693975156.jpg" },
          ].map((item, index) => (
            <div key={index} className="cuisine-card">
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
        <h2 className="cuisine-title2"> Ẩm thực Người Việt</h2>
        <div className="recipes-grid">
          {[
            { name: "Phở Bò", description: "Truyền thống Việt Nam.", image: "https://mycogroup.com.vn/wp-content/uploads/2023/05/pho-viet-nam-1.jpg", favorite: true },
            { name: "Bánh Xèo", description: "Bánh xèo giòn tan.", image: "https://cdn.tgdd.vn/Files/2020/05/20/1256908/troi-mua-thu-lam-banh-xeo-kieu-mien-bac-gion-ngon-it-dau-mo-202005201034115966.jpg", favorite: true },
            { name: "Chả Cá", description: "Món ăn đậm đà hương vị.", image: "https://ttol.vietnamnetjsc.vn//2016/02/03/09/54/cha-ca-viet-vao-top-mon-an-duong-pho-ngon-nhat-the-gioi_2.jpg", favorite: true },
            { name: "Gỏi cuốn", description: "Món khai vị phổ biến.", image: "https://cdn.tgdd.vn/Files/2017/03/22/963738/cach-lam-goi-cuon-tom-thit-thom-ngon-cho-bua-com-gian-don-202203021427281747.jpg", favorite: true },
            { name: "Bún bò Huế", description: "Hương vị miền Trung.", image: "https://i2.ex-cdn.com/crystalbay.com/files/content/2024/08/15/bun-bo-hue-2-0933.jpg", favorite: true },
            { name: "Cà ri gà", description: "Món cay nồng đậm đà.", image: "https://i.ytimg.com/vi/xySE3CCA1Kk/maxresdefault.jpg", favorite: true },
          ].map((item, index) => (
            <div key={index} className="recipe-card">
              <img src={item.image} alt={item.name} />
              <div className="recipe-info">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                {item.favorite && <FaHeart className="favorite-icon" />}
              </div>
              <button className="view-recipe-btn">Xem chi tiết</button>
            </div>
          ))}
        </div>
      </section>



      {/* Trending Foods Section */}
      <section className="trending-food-wrapper">
        <button className="trending-food-btn prev-btn" onClick={handlePrev} style={{ borderRadius: '3px' }}>
          &#10094;
        </button>
        <div className="trending-food-carousel">
          {trendingFoods.map((item, index) => {
            let position = "hidden";

            if (index === currentIndex) position = "active";
            else if (index === (currentIndex - 1 + trendingFoods.length) % trendingFoods.length)
              position = "prev-1";
            else if (index === (currentIndex - 2 + trendingFoods.length) % trendingFoods.length)
              position = "prev-2";
            else if (index === (currentIndex + 1) % trendingFoods.length)
              position = "next-1";
            else if (index === (currentIndex + 2) % trendingFoods.length)
              position = "next-2";

            return (
              <div key={item.id} className={`trending-food-card ${position}`}>
                <img src={item.image} alt={item.name} />
              </div>
            );
          })}
        </div>
        <button className="trending-food-btn next-btn" onClick={handleNext} style={{ borderRadius: '3px' }}>
          &#10095;
        </button>
      </section>
      <Snowfall />
      {/* Statistics Section */}
      <section className="stats-section">
        <div className="stat-card">
          <h3>{stats.meals}</h3>
          <p>Bữa ăn</p>
        </div>
        <div className="stat-card">
          <h3>{stats.users}</h3>
          <p>Người dùng</p>
        </div>
        <div className="stat-card">
          <h3>{stats.reviews}</h3>
          <p>Đánh giá</p>
        </div>
      </section>
      {/* Features Section */}
      <section className="features-section">
        <div className="feature-card">
          <h4>Thêm bữa ăn</h4>
          <p>Thêm món ăn yêu thích của bạn vào danh sách.</p>
          <button className="feature-btn">Thêm ngay</button>
        </div>
        <div className="feature-card">
          <h4>Quản lý bữa ăn</h4>
          <p>Xem và quản lý các bữa ăn của bạn.</p>
          <button className="feature-btn">Xem chi tiết</button>
        </div>
        <div className="feature-card">
          <h4>Xem đánh giá</h4>
          <p>Đọc đánh giá từ cộng đồng người dùng.</p>
          <button className="feature-btn">Khám phá</button>
        </div>
        <div className="feature-card">
          <h4>Cài đặt cá nhân</h4>
          <p>Quản lý thông tin tài khoản và tùy chọn của bạn.</p>
          <button className="feature-btn"><FaCog /> Cài đặt</button>
        </div>
      </section>
      <div className='Footer'>
        <Footer />
      </div>
    </div>

  );
};

export default MainForm;
