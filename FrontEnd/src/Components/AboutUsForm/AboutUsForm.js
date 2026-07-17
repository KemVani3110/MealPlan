import React from 'react';
import './AboutUsForm.css';
import TaskBar from '../TaskBar/TaskBar';
import Footer from '../Footer/Footer';
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
    description: 'Xây dựng đăng nhập, API lưu kế hoạch, kiểm tra dữ liệu và nghiệp vụ meal plan.',
  },
  {
    name: 'Võ Thành Phát',
    role: 'Meal plan và tích hợp API',
    img: Phat,
    id: 22122848,
    description: 'Thiết kế luồng chọn món, lưu bữa ăn và đồng bộ dữ liệu giữa frontend với backend.',
  },
  {
    name: 'Dương Xuân Lộc',
    role: 'Quản lý món ăn và nguyên liệu',
    img: Loc,
    id: 22108466,
    description: 'Xây dựng màn kho món, định lượng nguyên liệu, chi phí và calo theo khẩu phần.',
  },
  {
    name: 'Nguyễn Hữu Tâm',
    role: 'Database và giao diện',
    img: Tam,
    id: 22118834,
    description: 'Thiết kế dữ liệu món ăn, nguyên liệu và hỗ trợ trải nghiệm người dùng.',
  },
];

const values = [
  'Dữ liệu món ăn phải có định lượng để tính calo và chi phí.',
  'Gợi ý món cần giải thích được vì sao phù hợp.',
  'Kế hoạch tuần phải tổng hợp được nguyên liệu cần mua.',
];

const AboutUsForm = () => {
  return (
    <div className="about-page">
      <TaskBar />

      <main className="about-shell">
        <section className="about-hero">
          <span className="about-eyebrow">Về dự án</span>
          <h1>Meal Planner giúp nối kho món, gợi ý bữa và lịch ăn tuần thành một quy trình</h1>
          <p>
            Dự án tập trung vào bài toán thực tế: biết món gồm nguyên liệu gì, một bữa nên ăn gì,
            chi phí bao nhiêu và tuần này cần chuẩn bị những nguyên liệu nào.
          </p>
        </section>

        <section className="about-grid">
          <div className="about-panel">
            <h2>Mục tiêu sản phẩm</h2>
            <p>
              Người dùng có thể quản lý món ăn, tạo combo bữa ăn theo ngân sách và chuyển combo đó vào kế hoạch tuần.
              Các trang không hoạt động rời rạc mà chia sẻ dữ liệu theo một luồng thống nhất.
            </p>
          </div>
          <div className="about-panel">
            <h2>Nguyên tắc thiết kế</h2>
            <ul>
              {values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="team-section">
          <div className="section-heading-about">
            <span className="about-eyebrow">Nhóm phát triển</span>
            <h2>Thành viên và vai trò</h2>
          </div>
          <div className="members-list">
            {members.map((member) => (
              <article key={member.id} className="member-card-horizontal">
                <img src={member.img} alt={member.name} className="member-img-horizontal" />
                <div className="member-details">
                  <h3>{member.name}</h3>
                  <span>{member.role}</span>
                  <p>MSSV: {member.id}</p>
                  <p>{member.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUsForm;
