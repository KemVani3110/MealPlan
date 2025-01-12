/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";
import {  useNavigate } from "react-router-dom";
import axios from "axios";
import "./LoginForm.css";

const LoginForm = () => {
  // Quản lý trạng thái hiển thị form đăng nhập/đăng ký
  const [active, setActive] = useState(false);
  const [username, setUsername] = useState(""); // Giá trị nhập vào cho tên đăng nhập
  const [password, setPassword] = useState(""); // Giá trị nhập vào cho mật khẩu
  const [registerUserID, setRegisterUserID] = useState(""); // Giá trị nhập vào cho userID đăng ký
  const [registerUsername, setRegisterUsername] = useState(""); // Giá trị nhập vào cho tên đăng ký
  const [registerPassword, setRegisterPassword] = useState(""); // Giá trị nhập vào cho mật khẩu đăng ký
  const [error, setError] = useState(""); // Quản lý thông báo lỗi
  const [registerSuccess, setRegisterSuccess] = useState(""); // Quản lý thông báo thành công khi đăng ký
  const navigate = useNavigate(); // Điều hướng sau khi đăng nhập thành công

  // Chuyển sang form đăng ký
  const handleRegisterClick = () => {
    setActive(true);
    setError("");
    setRegisterSuccess("");
  };

  // Chuyển sang form đăng nhập
  const handleLoginClick = () => {
    setActive(false);
    setError("");
  };

  // Xử lý đăng nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      // Gửi yêu cầu đăng nhập đến server
      const response = await axios.post("http://localhost:3060/login", {
        username,
        password,
      });
      if (response.data.token) {
        // Lưu token vào localStorage và điều hướng người dùng đến trang chính
        localStorage.setItem("token", response.data.token);
        navigate("/main");
      }
    } catch (error) {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
    }
  };

  // Xử lý đăng ký
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3060/register", {
        userID: registerUserID,
        username: registerUsername,
        password: registerPassword,
      });
      if (response.data.success) {
        setRegisterSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
        setRegisterUserID("");
        setRegisterUsername("");
        setRegisterPassword("");
        //setActive(false);
      } else {
        setError(response.data.error || "Đăng ký thất bại.");
      }
    } catch (error) {
      setError("Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="warpper">
      <div className={`container ${active ? "active" : ""}`} id="container">
        {/* Form đăng ký */}
        <div className="form-container sign-up">
          <form onSubmit={handleRegisterSubmit}>
            <h1>Tạo tài khoản</h1>
            <div className="social-icons">
              <a href="#" className="icon">
                <i className="fa-brands fa-google-plus-g"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-github"></i>
              </a>
            </div>
            <span>Sử dụng UserID và Username để đăng ký</span>
            <input
              type="text"
              placeholder="User ID"
              value={registerUserID}
              onChange={(e) => setRegisterUserID(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              required
            />
            <input 
              type="password"
              placeholder="Password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
            />
            <button className="btn" type="submit">
              Sign Up
            </button>
            <div className="mess">
              {registerSuccess && <p className="success">{registerSuccess}</p>}
              {error && <p className="error">{error}</p>}
            </div>
          </form>
        </div>

        {/* Form đăng nhập */}
        <div className="form-container sign-in">
          <form onSubmit={handleLoginSubmit}>
            <h1>Đăng nhập</h1>
            <div className="social-icons">
              <a href="#" className="icon">
                <i className="fa-brands fa-google-plus-g"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-github"></i>
              </a>
            </div>
            <span>Hoặc sử dụng Username và Password</span>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="forgot-section">
              <span>
                <input type="checkbox" id="checked" />
                Remember Me
              </span>
              <span>
                <a href="#">Forgot Password?</a>
              </span>
            </div>
            <button className="btn" type="submit">
              Login
            </button>
            <div className="mess">{error && <p className="error">{error}</p>}</div>
          </form>
        </div>

        {/* Khung chuyển đổi giữa đăng ký và đăng nhập */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Xin chào!!</h1>
              <p>Hãy đăng nhập để sử dụng các tính năng có trên trang</p>
              <button className="hidden" id="login" onClick={handleLoginClick}>
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Xin Chào!!</h1>
              <p>Hãy tạo tài khoản để sử dụng các tính năng ở trên trang</p>
              <button
                className="hidden"
                id="register"
                onClick={handleRegisterClick}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
