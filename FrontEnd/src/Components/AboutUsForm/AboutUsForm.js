import React from 'react';
import './AboutUsForm.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import Khoi from '../Assets/Photo/Khoi.png';
import Phat from '../Assets/Photo/Phat.png';
import Loc from '../Assets/Photo/loc.png';
import Tam from '../Assets/Photo/tam.png';

const members = [
  {
    name: 'Huỳnh Chu Minh Khôi',
    role: 'Backend, xác thực và meal plan',
    img: Khoi,
    id: 22108509,
    description: 'Xây dựng đăng nhập, route bảo vệ, API lưu kế hoạch và nghiệp vụ meal plan.',
  },
  {
    name: 'Võ Thành Phát',
    role: 'Meal plan và tích hợp API',
    img: Phat,
    id: 22122848,
    description: 'Thiết kế luồng chọn món, lưu bữa ăn và đồng bộ dữ liệu với backend.',
  },
  {
    name: 'Dương Xuân Lộc',
    role: 'Quản lý món ăn và nguyên liệu',
    img: Loc,
    id: 22108466,
    description: 'Xây dựng màn quản lý món, định lượng nguyên liệu, chi phí và calo.',
  },
  {
    name: 'Nguyễn Hữu Tâm',
    role: 'Database và giao diện',
    img: Tam,
    id: 22118834,
    description: 'Thiết kế dữ liệu món ăn, nguyên liệu và hỗ trợ trải nghiệm người dùng.',
  },
];

const AboutUsForm = () => {
  const navigate = useNavigate();

  return (
    <div className="main-container">
      <section className="header-section">
        <button className="home-icon" type="button" onClick={() => navigate('/main')} title="Về trang chính">
          <FontAwesomeIcon icon={faHome} size="2x" />
        </button>
        <h1>Meal Plan App</h1>
        <p>Ứng dụng hỗ trợ chọn món, tính calo, tính chi phí và lập kế hoạch ăn uống theo tuần.</p>
      </section>

      <section className="about-section">
        <h2>Mục tiêu sản phẩm</h2>
        <p>
          Dự án tập trung vào một luồng thực tế: quản lý món ăn và nguyên liệu, chọn món cho từng bữa,
          kiểm tra khẩu phần, sau đó lưu thành kế hoạch tuần để người dùng dễ theo dõi.
        </p>
      </section>

      <section className="team-section">
        <h2>Nhóm phát triển</h2>
        <div className="members-list">
          {members.map((member) => (
            <div key={member.id} className="member-card-horizontal">
              <img
                src={member.img}
                alt={member.name}
                className="member-img-horizontal"
              />
              <div className="member-details">
                <h3>{member.name}</h3>
                <p><strong>Vai trò:</strong> {member.role}</p>
                <p><strong>MSSV:</strong> {member.id}</p>
                <p><strong>Mô tả:</strong> {member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="footer-section">
        <p>© 2026 Meal Plan App.</p>
      </section>
    </div>
  );
};

export default AboutUsForm;
