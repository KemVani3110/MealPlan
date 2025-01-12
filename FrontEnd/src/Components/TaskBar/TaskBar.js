/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './TaskBar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import chillMusic from '../Assets/Music/rick.MP3';

const TaskBar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio(chillMusic));
  const [currentTime, setCurrentTime] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(audioRef.current.currentTime);
    };

    audioRef.current.addEventListener('timeupdate', updateTime);

    return () => {
      audioRef.current.removeEventListener('timeupdate', updateTime);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleHome = () => {
    navigate('/main');
  };

  const handleMealPlan = () => {
    navigate('/planmeal');
  };

  const handleMakeMeal = () => {
    navigate('/makemeal');
  };

  const handleIngredient = () => {
    navigate('/ingredient');
  };
  const handleInfoUser = () => {
    navigate('/infouser');
  };
  const handleCommunity = () => {
    navigate('/community');
  };
  return (
    <div className='taskbar-container-custom'>
      <div className='taskbar-left-custom'>
        <div className='taskbar-icon-custom'>
          <i className="fa fa-home" onClick={handleHome}></i>
        </div>
        <div className='music-icon-custom' onClick={toggleMusic}>
          <i className="fa fa-music"></i>
          <span className='music-text-custom'>{isPlaying ? 'Dừng nhạc' : 'Phát nhạc'}</span>
        </div>
      </div>
      <div className='taskbar-right-custom'>
        <div className='taskbar-item-container-custom'>
          <div className='taskbar-item-custom' onClick={handleMealPlan}>Lập Kế Hoạch</div>
          <div className='taskbar-item-custom' onClick={handleIngredient}>Nguồn Nguyên Liệu</div>
          <div className='taskbar-item-custom' onClick={handleMakeMeal}>Gợi ý chọn món</div>
          <div className='taskbar-item-custom' onClick={handleCommunity}>Cộng Đồng Chia Sẽ</div>
        </div>
        <div className='user-profile-custom' onClick={toggleDropdown} ref={dropdownRef}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-VLNNe21fRCrEEMk1TF0i8BzrjxqDR5s6zL89sa28-ouSiB8aBVH2VuPqG_4sNNf_NUQ&usqp=CAU"
            alt='User Avatar'
            className='user-avatar-custom'
            style={{ objectFit: 'cover' }}
          />

          <div className='dropdown-icon'>
            <i className="fa fa-caret-down"></i>
          </div>
          {dropdownOpen && (
            <div className='dropdown-menu-custom'>
              <a onClick={handleInfoUser}>
                <FontAwesomeIcon icon={faCog} /> Cài đặt
              </a>
              <a href='#' onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Đăng xuất
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskBar;
