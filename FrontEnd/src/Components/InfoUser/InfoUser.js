import React, { useState } from 'react';
import './InfoUser.css';
import { FaHome, FaUser, FaLock, FaBell, FaCogs, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const themes = [
    'rgba(36, 36, 77, 0.9)',
    'rgba(79, 11, 26, 0.2)',
    'rgba(8, 65, 103, 0.2)',
    'rgba(12, 12, 84, 0.9)',
    'rgba(23, 82, 82, 0.2)',
    'rgba(64, 43, 106, 0.2)',
    'rgba(87, 49, 12, 0.2)',
    'rgba(16, 25, 92, 0.2)',
    'rgba(19, 79, 39, 0.2)',
    'rgba(96, 17, 17, 0.2)',
    'rgba(24, 15, 43, 0.2)',

];

const InfoUser = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [theme, setTheme] = useState(themes[0]);
    const navigate = useNavigate();

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <div>
                        <header className="content-header">
                            <h1>Home</h1>
                            <p>Laptop: ThinkBook 14-ILL</p>
                            <p>Connected to Wi-Fi</p>
                        </header>
                        <section className="content-section">
                            <h2>Recommended Settings</h2>
                            <div className="settings-grid">
                                <div className="settings-item">Installed Apps</div>
                                <div className="settings-item">Printers & Scanners</div>
                                <div className="settings-item">Camera</div>
                            </div>
                        </section>
                    </div>
                );
            case 'profile':
                return (
                    <div>
                        <header className="content-header">
                            <h1>Profile</h1>
                            <p>Manage your personal information and settings.</p>
                        </header>
                        <section className="content-section">
                            <h2>Personal Information</h2>
                            <div className="profile-grid">
                                <div className="profile-item">Name: Elen Mosk</div>
                                <div className="profile-item">Email: ElenMosk@gmail.com</div>
                                <div className="profile-item">Phone: +123 456 7890</div>
                            </div>
                        </section>
                    </div>
                );
            case 'notifications':
                return (
                    <div>
                        <header className="content-header">
                            <h1>Notifications</h1>
                            <p>View and manage your notifications.</p>
                        </header>
                        <section className="content-section">
                            <h2>Recent Notifications</h2>
                            <ul className="notifications-list">
                                <li className="notification-item">Update available for your system.</li>
                                <li className="notification-item">New login from a recognized device.</li>
                                <li className="notification-item">Your subscription is about to expire.</li>
                            </ul>
                        </section>
                    </div>
                );
            case 'security':
                return (
                    <div>
                        <header className="content-header">
                            <h1>Security</h1>
                            <p>Manage your security settings and activity logs.</p>
                        </header>
                        <section className="content-section">
                            <h2>Security Options</h2>
                            <div className="security-grid">
                                <button className="security-button">Change Password</button>
                                <button className="security-button">Enable Two-Factor Authentication</button>
                                <button className="security-button">View Login History</button>
                            </div>
                        </section>
                    </div>
                );
            case 'settings':
                return (
                    <div>
                        <header className="content-header">
                            <h1>Settings</h1>
                            <p>Customize your preferences and configurations.</p>
                        </header>
                        <section className="content-section">
                            <h2>App Settings</h2>
                            <div className="settings-grid">
                                <div className="theme-selector">
                                    {themes.map((color, index) => (
                                        <div
                                            key={index}
                                            className="theme-option"
                                            style={{ backgroundColor: color }}
                                            onClick={() => setTheme(color)}
                                        ></div>
                                    ))}
                                </div>

                                <div className="settings-item">Notifications: Enabled</div>
                                <div className="settings-item">Language: English</div>
                            </div>
                        </section>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="info-user-wrapper" style={{ backgroundColor: theme }}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="user-profile">
                    <div style={{ display: 'flex', marginLeft: '-20%', gap: '20px' }}>
                        {/* Back to Home Icon */}
                        <div className="back-to-home" onClick={() => navigate('/main')}>
                            <FaArrowLeft className="icon" />
                        </div>
                        <div>
                            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-VLNNe21fRCrEEMk1TF0i8BzrjxqDR5s6zL89sa28-ouSiB8aBVH2VuPqG_4sNNf_NUQ&usqp=CAU" alt="Avatar" className="avatar"
                                style={{ objectFit: 'cover' }} />
                            <h2 className="user-name">Elen Mosk</h2>
                            <p className="user-email">ElenMosk@gmail.com</p>
                        </div>
                    </div>


                </div>
                <ul className="menu">
                    <li className={`menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                        <FaHome className="icon" /> Home
                    </li>
                    <li className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <FaUser className="icon" /> Profile
                    </li>
                    <li className={`menu-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                        <FaBell className="icon" /> Notifications
                    </li>
                    <li className={`menu-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <FaLock className="icon" /> Security
                    </li>
                    <li className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <FaCogs className="icon" /> Settings
                    </li>
                </ul>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default InfoUser;
