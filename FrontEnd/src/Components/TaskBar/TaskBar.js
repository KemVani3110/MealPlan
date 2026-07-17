import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    setDropdownOpen((open) => !open);
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
    const audio = audioRef.current;
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('timeupdate', updateTime);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
    };
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

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
  const handleAbout = () => {
    navigate('/aboutus');
  };

  return (
    <div className='taskbar-container-custom'>
      <div className='taskbar-left-custom'>
        <button className='taskbar-icon-custom' type="button" onClick={handleHome} aria-label="Trang chủ">
          <i className="fa fa-home"></i>
        </button>
        <button className='music-icon-custom' type="button" onClick={toggleMusic}>
          <i className="fa fa-music"></i>
          <span className='music-text-custom'>{isPlaying ? 'Dừng nhạc' : 'Phát nhạc'}</span>
        </button>
      </div>
      <div className='taskbar-right-custom'>
        <div className='taskbar-item-container-custom'>
          <button className='taskbar-item-custom' type="button" onClick={handleMealPlan}>Lập kế hoạch</button>
          <button className='taskbar-item-custom' type="button" onClick={handleIngredient}>Món & nguyên liệu</button>
          <button className='taskbar-item-custom' type="button" onClick={handleMakeMeal}>Gợi ý món</button>
          <button className='taskbar-item-custom' type="button" onClick={handleCommunity}>Cộng đồng</button>
          <button className='taskbar-item-custom' type="button" onClick={handleAbout}>Giới thiệu</button>
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
              <button type="button" onClick={handleInfoUser}>
                <FontAwesomeIcon icon={faCog} /> Cài đặt
              </button>
              <button type="button" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskBar;
