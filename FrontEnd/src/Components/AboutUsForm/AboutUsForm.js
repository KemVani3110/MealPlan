import React from 'react';
import './AboutUsForm.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import Khoi from '../Assets/Photo/Khoi.png';
import Phat from '../Assets/Photo/Phat.png';
import Loc from '../Assets/Photo/loc.png';
import Tam from '../Assets/Photo/tam.png';

const Members = [
  {
    name: "Huỳnh Chu Minh Khôi",
    role: "Leader 1 & Member",
    img: Khoi,
    id: 22108509,
    description: "LoginForm, Router, PlanMealForm, Authentication và Backend API.",
    lecture: "QL211 - Công nghệ thông tin",
  },
  {
    name: "Võ Thành Phát",
    role: "Leader 2 & Member",
    img: Phat,
    id: 22122848,
    description: "PlanMealForm, Authentication và Backend API.",
    lecture: "QL211 - Công nghệ thông tin",
  },
  {
    name: "Dương Xuân Lộc",
    role: "Member",
    img: Loc,
    id: 22108466,
    description: "IngredientsForm, FrontEnd Design và Backend API.",
    lecture: "QL211 - Công nghệ thông tin",
  },
  {
    name: "Nguyễn Hữu Tâm",
    role: "Member",
    img: Tam,
    id: 22118834,
    description: "Database Design, FrontEnd Design.",
    lecture: "QL211 - Công nghệ thông tin",
  },
];

const AboutUsForm = () => {
  const navigate = useNavigate();

  const handleNavigateHome = () => {
    navigate('/main');
  };

  return (
    <div className="main-container">
      {/* Header Section */}
      <section className="header-section">
        <div className="home-icon" onClick={handleNavigateHome} title="Go to Home">
          <FontAwesomeIcon icon={faHome} size="2x" />
        </div>
        <h1>Welcome to Our Website</h1>
        <p>Discover who we are and what we do!</p>
      </section>

      {/* About Us Section */}
      <section className="about-section">
        <h2>About Us</h2>
        <p>We are a team of dedicated individuals passionate about technology and innovation.</p>
      </section>

      {/* Our Team Section */}
      <section className="team-section">
        <h2>Meet Our Team</h2>
        <div className="members-list">
          {Members.map((member, index) => (
            <div key={index} className="member-card-horizontal">
              <img 
                src={member.img || 'https://via.placeholder.com/150'} 
                alt={member.name} 
                className="member-img-horizontal" 
              />
              <div className="member-details">
                <h3>{member.name}</h3>
                <p><strong>Role:</strong> {member.role}</p>
                <p><strong>ID:</strong> {member.id}</p>
                <p><strong>Lecture:</strong> {member.lecture}</p>
                <p><strong>Description:</strong> {member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <section className="footer-section">
        <p>&copy; 2024 Our Team. All rights reserved.</p>
      </section>
    </div>
  );
};

export default AboutUsForm;
