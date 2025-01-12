-- Create Database and Use it
CREATE DATABASE dacna;
USE dacna;
drop database dacna;

-- User Table
CREATE TABLE IF NOT EXISTS user (
  userID VARCHAR(10) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);
select * from user;

CREATE TABLE FoodItems (
  Fid INT PRIMARY KEY auto_increment NOT NULL,
  name VARCHAR(255) NULL,
  image VARCHAR(255) NULL,
  description VARCHAR(255) NULL,
  price DECIMAL(10, 2) NULL,
  calories FLOAT NULL
);
select * from FoodItems;


CREATE TABLE ingredients (
  id INT PRIMARY KEY auto_increment,
  name VARCHAR(255) NULL,
  calories FLOAT NULL, 
  price DECIMAL(10, 2) NULL
);
select * from ingredients;

-- FoodItem_Ingredient Junction Table
CREATE TABLE FoodItems_Ingredient (
    mid INT,
    Iid INT,
    PRIMARY KEY (mid, Iid),
    FOREIGN KEY (mid) REFERENCES FoodItems(Fid),
    FOREIGN KEY (Iid) REFERENCES ingredients(id),
    gram INT NULL,
    totalCalo FLOAT NULL
);
SELECT * FROM FoodItems_Ingredient;

-- Thêm dữ liệu mẫu vào bảng FoodItems
INSERT INTO FoodItems (name, image, description, price, calories) VALUES
('Phở', 'pho.jpg', 'Món phở truyền thống Việt Nam với thịt bò và nước dùng đậm đà.', 60000.00, 450.00),
('Cơm Tấm', 'comtam.jpg', 'Cơm tấm sườn nướng cùng với dưa chua và nước mắm.', 50000.00, 550.00),
('Bún Chả', 'buncha.jpg', 'Bún chả Hà Nội với thịt nướng và rau sống.', 55000.00, 400.00),
('Gỏi cuốn', 'goicuon.jpg', 'Món gỏi cuốn tôm thịt với rau sống và bún.', 30000.00, 150.00),
('Mì Quảng', 'miquang.jpg', 'Mì Quảng đặc sản miền Trung, ăn kèm với thịt và rau sống.', 55000.00, 500.00),
('Lẩu Thái', 'lauthai.jpg', 'Lẩu Thái với nước dùng cay chua và hải sản.', 200000.00, 800.00),
('Bánh mì', 'banhmi.jpg', 'Bánh mì Việt Nam với nhân pate và rau thơm.', 20000.00, 250.00),
('Chả giò', 'chagio.jpg', 'Chả giò chiên giòn với nhân thịt và rau củ.', 40000.00, 180.00),
('Cà ri gà', 'cariga.jpg', 'Cà ri gà nước cốt dừa và khoai tây.', 70000.00, 600.00);

-- Thêm dữ liệu mẫu vào bảng ingredients
INSERT INTO ingredients (name, calories, price) VALUES
('Bánh phở', 130.00, 15000),
('Thịt bò', 250.00, 60000),
('Hành lá', 32.00, 3500),
('Cơm', 130.00, 18000),
('Sườn heo', 250.00, 40000),
('Dưa chua', 20.00, 1000),
('Bún', 110.00, 22000),
('Thịt lợn nướng', 280.00, 50000),
('Rau sống', 15.00, 1000),
('Tôm', 70.00, 30000),
('Thịt heo', 290.00, 40000),
('Bún tươi', 110.00, 22000),
('Nước cốt dừa', 150.00, 15000),
('Thịt gà', 240.00, 35000),
('Khoai tây', 90.00, 10000),
('Hành tím', 40.00, 2000),
('Tỏi', 60.00, 1500),
('Ớt', 30.00, 500),
('Nước dùng lẩu', 50.00, 5000);

-- Thêm dữ liệu mẫu vào bảng FoodItems_Ingredient
INSERT INTO FoodItems_Ingredient (mid, Iid, gram, totalCalo) VALUES
    (1, 1, 200, 260.00),   -- Phở - Bánh phở (200g, 260 cal)
    (1, 2, 100, 250.00),   -- Phở - Thịt bò (100g, 250 cal)
    (1, 3, 10, 3.20),      -- Phở - Hành lá (10g, 3.2 cal)
    (2, 4, 300, 390.00),   -- Cơm Tấm - Cơm (300g, 390 cal)
    (2, 5, 150, 375.00),   -- Cơm Tấm - Sườn heo (150g, 375 cal)
    (2, 6, 50, 10.00),     -- Cơm Tấm - Dưa chua (50g, 10 cal)
    (3, 7, 200, 220.00),   -- Bún Chả - Bún (200g, 220 cal)
    (3, 8, 100, 280.00),   -- Bún Chả - Thịt lợn nướng (100g, 280 cal)
    (3, 9, 50, 7.50),      -- Bún Chả - Rau sống (50g, 7.5 cal)
    (4, 10, 50, 35.00),    -- Gỏi cuốn - Tôm (50g, 35 cal)
    (4, 9, 30, 8.25),      -- Gỏi cuốn - Bún tươi (30g, 8.25 cal)
    (4, 11, 20, 6.00),     -- Gỏi cuốn - Thịt heo (20g, 6 cal)
    (5, 9, 200, 220.00),   -- Mì Quảng - Bún tươi (200g, 220 cal)
    (5, 11, 50, 145.00),   -- Mì Quảng - Thịt heo (50g, 145 cal)
    (5, 13, 10, 4.00),     -- Mì Quảng - Hành tím (10g, 4 cal)
    (5, 14, 5, 3.00),      -- Mì Quảng - Tỏi (5g, 3 cal)
    (6, 17, 500, 25.00),   -- Lẩu Thái - Nước dùng lẩu (500g, 25 cal)
    (6, 15, 100, 60.00),   -- Lẩu Thái - Ớt (100g, 60 cal)
    (6, 11, 100, 290.00),  -- Lẩu Thái - Thịt heo (100g, 290 cal)
    (7, 16, 30, 18.00),    -- Bánh mì - Pate (30g, 18 cal)
    (7, 11, 50, 145.00),   -- Bánh mì - Thịt heo (50g, 145 cal)
    (8, 18, 50, 45.00),    -- Chả giò - Khoai tây (50g, 45 cal)
    (8, 13, 5, 2.00),      -- Chả giò - Hành tím (5g, 2 cal)
    (9, 19, 100, 160.00),  -- Cà ri gà - Nước cốt dừa (100g, 160 cal)
    (9, 14, 200, 180.00),  -- Cà ri gà - Thịt gà (200g, 180 cal)
    (9, 12, 200, 180.00);  -- Cà ri gà - Khoai tây (200g, 180 cal)
-- ----------------------------------------------------------------------------------------------------------------------------------------------------
-- MealPlan Table
CREATE TABLE MealPlan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    people_count INT NOT NULL,
    children_count INT NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL
);
select * from MealPlan;
drop table MealPlan;
CREATE TABLE MealPlanDetail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_plan_id INT NOT NULL,
    meal_time VARCHAR(50) NOT NULL, -- Ví dụ: "Bữa sáng", "Bữa trưa"
    day_of_week VARCHAR(50) NOT NULL, -- Ví dụ: "Thứ Hai", "Thứ Ba"
    food_id INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (meal_plan_id) REFERENCES MealPlan(id),
    FOREIGN KEY (food_id) REFERENCES FoodItems(Fid)
);
select * from MealPlanDetail;
drop table MealPlanDetail;

-- FoodPlanDetail Table with Foreign Key to MealPlanDetail
CREATE TABLE FoodPlanDetail (
    seqID INT PRIMARY KEY,
    portion DOUBLE,
    FoodID CHAR(10),
    IDPlan CHAR(10),
    DateOfWeek VARCHAR(50),
    SesionOfDate VARCHAR(50),
    FOREIGN KEY (FoodID) REFERENCES FoodItem(Foodid),
    FOREIGN KEY (IDPlan, DateOfWeek, SesionOfDate) REFERENCES MealPlanDetail(IDPlan, DateOfWeek, SesionOfDate)
);



