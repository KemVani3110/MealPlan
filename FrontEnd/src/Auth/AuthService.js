import { jwtDecode } from 'jwt-decode';// Cài đặt bằng lệnh: npm install jwt-decode
import axios from "axios";

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const { exp } = jwtDecode(token); // Giải mã token
    const currentTime = Date.now() / 1000; // Thời gian hiện tại (giây)
    return exp > currentTime; // Kiểm tra token còn hạn hay không
  } catch (error) {
    return false; // Nếu token không hợp lệ
  }
};

// Hàm gia hạn token
export const renewToken = async () => {
  try {
    const response = await axios.post("http://localhost:3060/renew-token", {
      token: localStorage.getItem("token"),
    });

    if (response.data.newToken) {
      localStorage.setItem("token", response.data.newToken); // Lưu token mới
      return true; // Gia hạn thành công
    }
  } catch (error) {
    console.error("Gia hạn token thất bại:", error);
    return false; // Gia hạn thất bại
  }
};

export const logout = () => {
  localStorage.removeItem("token");
};
