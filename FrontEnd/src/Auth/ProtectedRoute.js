import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, renewToken, logout } from "./AuthService";
import "../Components/PopUp/popup.css";

const ProtectedRoute = ({ children }) => {
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAuthenticated()) {
        setIsTokenExpired(true); // Token hết hạn
      }
    }, 1000); // Kiểm tra token mỗi giây

    return () => clearInterval(interval); // Dọn dẹp
  }, []);

  const handleRenewToken = async () => {
    const success = await renewToken();
    if (success) {
      setIsTokenExpired(false); // Token đã được gia hạn
    } else {
      handleLogout(); // Gia hạn thất bại, đăng xuất
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/"; // Chuyển hướng về trang login
  };

  if (isTokenExpired) {
    return (
      <div className="popup-overlay">
        <div className="popup">
          <h2>Phiên làm việc đã hết hạn</h2>
          <p>Bạn muốn gia hạn phiên làm việc hay đăng xuất?</p>
          <div className="popup-buttons">
            <button className="btn renew" onClick={handleRenewToken}>
              Tiếp tục
            </button>
            <button className="btn logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated() ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
