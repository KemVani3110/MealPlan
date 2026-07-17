# Meal Planner

Ứng dụng hỗ trợ quản lý món ăn, nguyên liệu, gợi ý bữa ăn và lập kế hoạch ăn uống theo tuần. Project gồm frontend React và backend Express/MySQL.

## Luồng chính

1. **Kho món và nguyên liệu**: quản lý món ăn, ảnh, mô tả, định lượng nguyên liệu, calo và chi phí mỗi khẩu phần.
2. **Gợi ý món**: tạo combo bữa ăn theo số người lớn, trẻ em, ngân sách và mục tiêu calo.
3. **Lập kế hoạch tuần**: đưa món hoặc combo gợi ý vào từng ngày, từng bữa; lưu kế hoạch và tổng hợp chi phí/calo.

Các trang `Ingredient`, `Make Meal` và `Plan Meal` đã được liên kết bằng draft tạm trong `localStorage` để người dùng có thể chuyển dữ liệu giữa các bước.

## Chức năng

- Đăng ký, đăng nhập bằng JWT.
- Trang tổng quan hiển thị thống kê từ dữ liệu thật trong database.
- Quản lý món ăn và nguyên liệu liên kết.
- Gợi ý bữa ăn theo nhu cầu thực tế.
- Lập, sửa, xoá meal plan theo tuần.
- Trang cộng đồng để xem món, xếp hạng nội bộ và đánh giá tạm trên frontend.
- Trang hồ sơ người dùng, giới thiệu dự án, 404 và layout header/footer thống nhất.

## Công nghệ

- Frontend: React 18, React Router, Axios, React Icons.
- Backend: Node.js, Express, MySQL2, bcrypt, jsonwebtoken, dotenv.
- Database: MySQL, có schema và dữ liệu mẫu trong `BackEnd/dacna_sql.sql`.

## Cấu trúc

```text
BackEnd/
  server.js              API Express
  dacna_sql.sql          Schema và dữ liệu mẫu
  .env.example           Mẫu cấu hình môi trường

FrontEnd/
  src/Components/        Các trang và component giao diện
  src/Auth/              Kiểm tra token và protected route
  src/utils/format.js    Format số tiền, calo, gram
  src/utils/mealWorkflow.js
                         Draft liên kết Ingredient -> Make Meal -> Plan Meal
```

## Cài đặt

1. Import database:

```sql
SOURCE BackEnd/dacna_sql.sql;
```

2. Tạo file `BackEnd/.env` theo mẫu:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dacna
JWT_SECRET=your_jwt_secret
PORT=3060
```

3. Cài dependencies:

```powershell
cd BackEnd
npm install

cd ..\FrontEnd
npm install
```

## Chạy local

Backend:

```powershell
cd BackEnd
npm start
```

Frontend:

```powershell
cd FrontEnd
npm start
```

Mặc định frontend chạy ở `http://localhost:3000`, backend chạy ở `http://localhost:3060`.

## Kiểm tra

```powershell
cd BackEnd
npm run check

cd ..\FrontEnd
npm run build
```

## API chính

- `POST /register`: tạo tài khoản.
- `POST /login`: đăng nhập và nhận JWT.
- `POST /renew-token`: gia hạn JWT.
- `GET /food-items`: lấy danh sách món kèm nguyên liệu.
- `GET /food-items/:id`: lấy chi tiết một món.
- `GET /dishes`, `POST /dishes`, `PUT /dishes/:id`, `DELETE /dishes/:id`: CRUD món ăn.
- `GET /ingredients`: lấy danh sách nguyên liệu.
- `POST /foodItems_ingredient`, `DELETE /foodItems_ingredient/:foodId`: cập nhật nguyên liệu của món.
- `GET /meal-plan`, `POST /save-meal-plan`, `DELETE /delete-meal-plan/:id`: quản lý meal plan.

## Lưu ý vận hành

- Frontend hiện gọi API trực tiếp về `http://localhost:3060`.
- Không commit `node_modules`, `build` hoặc `.env`.
- Backend đã validate các payload chính và không cho xoá món đang được dùng trong meal plan.
- Các route legacy của meal plan đã được loại bỏ để tránh dùng nhầm luồng thiếu validation.
