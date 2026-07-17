# Meal Plan App

Ứng dụng hỗ trợ quản lý món ăn, nguyên liệu, gợi ý bữa ăn và lập kế hoạch ăn uống theo ngày. Project gồm backend Express/MySQL và frontend React.

## Chức năng chính

- Đăng ký, đăng nhập bằng tài khoản nội bộ và JWT.
- Trang chính hiển thị thống kê món ăn từ dữ liệu thật trong database.
- Lập kế hoạch bữa ăn theo ngày, bữa và số lượng khẩu phần.
- Quản lý món ăn và nguyên liệu, tính lại calo/chi phí theo nguyên liệu đã chọn.
- Gợi ý món ăn theo số người lớn, trẻ em, ngân sách và mục tiêu calo.
- Cộng đồng cho phép xem món nổi bật, đánh giá và phản hồi nội bộ.
- Trang tài khoản, giới thiệu nhóm và trang lỗi 404.

## Công nghệ

- Frontend: React 18, React Router, Axios, React Icons, FontAwesome.
- Backend: Node.js, Express, MySQL2, bcrypt, jsonwebtoken, dotenv.
- Database: MySQL, có file mẫu `BackEnd/dacna_sql.sql`.

## Cấu trúc thư mục

```text
BackEnd/
  server.js          API Express
  dacna_sql.sql      Database schema/data mẫu
  .env               Cấu hình database và JWT

FrontEnd/
  src/Components/    Các trang và component giao diện
  src/utils/format.js Helper format tiền, calo, gram
```

## Cài đặt

1. Import database từ `BackEnd/dacna_sql.sql` vào MySQL.
2. Tạo file `BackEnd/.env` theo mẫu:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
```

3. Cài dependencies:

```powershell
cd BackEnd
npm install

cd ..\FrontEnd
npm install
```

## Chạy project

Chạy backend:

```powershell
cd BackEnd
node server.js
```

Backend mặc định chạy tại `http://localhost:3060`.

Chạy frontend:

```powershell
cd FrontEnd
npm start
```

Frontend mặc định chạy tại `http://localhost:3000`.

## Kiểm tra build

```powershell
cd FrontEnd
npm run build
```

Kiểm tra nhanh backend:

```powershell
cd BackEnd
node --check server.js
```

## Ghi chú vận hành

- Frontend đang gọi API trực tiếp về `http://localhost:3060`.
- Khi sửa món ăn ở trang nguyên liệu, app sẽ cập nhật lại thông tin món và thay mới danh sách nguyên liệu liên kết.
- Chi phí và calo được format tập trung trong `FrontEnd/src/utils/format.js` để tránh số thập phân dài trên giao diện.
