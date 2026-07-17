const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) {
    console.error('Failed to connect to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');

  db.query("SHOW COLUMNS FROM MealPlan LIKE 'plan_name'", (columnErr, columns) => {
    if (columnErr) {
      console.error('Error checking MealPlan plan_name column:', columnErr);
      return;
    }

    if (columns.length === 0) {
      db.query("ALTER TABLE MealPlan ADD COLUMN plan_name VARCHAR(100) NULL AFTER id", (alterErr) => {
        if (alterErr) console.error('Error adding MealPlan plan_name column:', alterErr);
      });
    }
  });
});

// Login API
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM user WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.userID, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ message: 'Login successful', token });
    });
  });
});

// Register API
app.post('/register', (req, res) => {
  const { userID, username, password } = req.body;
  const queryCheck = 'SELECT * FROM user WHERE userID = ? OR username = ?';
  db.query(queryCheck, [userID, username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length > 0) return res.status(409).json({ error: 'UserID or username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const queryInsert = 'INSERT INTO user (userID, username, password) VALUES (?, ?, ?)';
    db.query(queryInsert, [userID, username, hashedPassword], (err) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ success: true, message: 'Registration successful' });
    });
  });
});

// Renew Token API
app.post('/renew-token', (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    // Verify the old token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Create a new token with the same user data
    const newToken = jwt.sign({ id: decoded.id, username: decoded.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ newToken });
  } catch (error) {
    res.status(401).json({ error: 'Token has expired or is invalid' });
  }
});

// Get Detailed Food Items with Ingredients
app.get('/food-items', (req, res) => {
  const query = `
    SELECT fi.Fid, fi.name AS foodName, fi.image, fi.description, fi.price AS foodPrice, fi.calories AS foodCalories, 
           i.id AS ingredientId, i.name AS ingredientName, i.calories AS ingredientCalories, i.price AS ingredientPrice, 
           fi_ing.gram, fi_ing.totalCalo 
    FROM FoodItems AS fi
    JOIN FoodItems_Ingredient AS fi_ing ON fi.Fid = fi_ing.mid
    JOIN ingredients AS i ON fi_ing.Iid = i.id`;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    const foodItemsMap = {};
    results.forEach(row => {
      const { Fid, foodName, image, description, foodPrice, foodCalories, ingredientId, ingredientName, ingredientCalories, ingredientPrice, gram, totalCalo } = row;

      if (!foodItemsMap[Fid]) {
        foodItemsMap[Fid] = {
          Fid,
          foodName,
          image,
          description,
          foodPrice,
          foodCalories,
          ingredients: []
        };
      }
      foodItemsMap[Fid].ingredients.push({
        ingredientId,
        ingredientName,
        ingredientCalories,
        ingredientPrice,
        gram,
        totalCalo
      });
    });

    const foodItems = Object.values(foodItemsMap);
    res.json(foodItems);
  });
});

const mealTimes = ['Bữa sáng', 'Bữa trưa', 'Bữa chiều'];
const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

const isValidDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime());
};

const toPositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const validateMealPlanPayload = (body) => {
  const mealPlanId = body.mealPlanId ? toPositiveInt(body.mealPlanId) : null;
  const planName = String(body.planName || '').trim().slice(0, 100);
  const peopleCount = toPositiveInt(body.peopleCount);
  const childrenCount = Number(body.childrenCount);
  const totalCost = Number(body.totalCost);

  if (!isValidDate(body.dateRangeStart) || !isValidDate(body.dateRangeEnd)) {
    return { error: 'Start date and end date are required' };
  }

  if (new Date(body.dateRangeStart) > new Date(body.dateRangeEnd)) {
    return { error: 'Start date must be before or equal to end date' };
  }

  if (!peopleCount) {
    return { error: 'People count must be greater than 0' };
  }

  if (!Number.isInteger(childrenCount) || childrenCount < 0) {
    return { error: 'Children count must be a non-negative integer' };
  }

  if (!Number.isFinite(totalCost) || totalCost < 0) {
    return { error: 'Total cost must be a valid non-negative number' };
  }

  if (!Array.isArray(body.meals) || body.meals.length === 0) {
    return { error: 'At least one meal is required' };
  }

  const meals = [];
  for (const meal of body.meals) {
    const foodId = toPositiveInt(meal.foodId);
    const quantity = toPositiveInt(meal.quantity);

    if (!mealTimes.includes(meal.mealTime) || !daysOfWeek.includes(meal.dayOfWeek)) {
      return { error: 'Meal time or day of week is invalid' };
    }

    if (!foodId || !quantity) {
      return { error: 'Food ID and quantity must be positive integers' };
    }

    meals.push({
      mealTime: meal.mealTime,
      dayOfWeek: meal.dayOfWeek,
      foodId,
      quantity,
    });
  }

  return {
    value: {
      mealPlanId,
      planName,
      dateRangeStart: body.dateRangeStart,
      dateRangeEnd: body.dateRangeEnd,
      peopleCount,
      childrenCount,
      totalCost,
      meals,
    },
  };
};

const rollbackWithResponse = (res, message, error, status = 500) => {
  db.rollback(() => {
    if (error) console.error(message, error);
    res.status(status).json({ error: message });
  });
};


// Save Meal Plan API
app.post('/save-meal-plan', (req, res) => {
  const validation = validateMealPlanPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { mealPlanId, planName, dateRangeStart, dateRangeEnd, peopleCount, childrenCount, totalCost, meals } = validation.value;
  const foodIds = [...new Set(meals.map((meal) => meal.foodId))];

  db.beginTransaction((transactionErr) => {
    if (transactionErr) {
      console.error('Error starting transaction:', transactionErr);
      return res.status(500).json({ error: 'Server error while starting meal plan save' });
    }

    db.query('SELECT Fid FROM FoodItems WHERE Fid IN (?)', [foodIds], (foodErr, foodRows) => {
      if (foodErr) {
        return rollbackWithResponse(res, 'Server error while validating food items', foodErr);
      }

      if (foodRows.length !== foodIds.length) {
        return rollbackWithResponse(res, 'One or more selected food items do not exist', null, 400);
      }

      const saveDetails = (targetMealPlanId, successMessage) => {
        const mealPlanDetails = meals.map((meal) => [
          targetMealPlanId,
          meal.mealTime,
          meal.dayOfWeek,
          meal.foodId,
          meal.quantity,
        ]);

        const insertMealPlanDetailsQuery = `
          INSERT INTO MealPlanDetail (meal_plan_id, meal_time, day_of_week, food_id, quantity)
          VALUES ?
        `;

        db.query(insertMealPlanDetailsQuery, [mealPlanDetails], (detailErr) => {
          if (detailErr) {
            return rollbackWithResponse(res, 'Server error while saving meal details', detailErr);
          }

          db.commit((commitErr) => {
            if (commitErr) {
              return rollbackWithResponse(res, 'Server error while committing meal plan', commitErr);
            }

            res.json({
              success: true,
              message: successMessage,
              newMealPlanId: targetMealPlanId,
            });
          });
        });
      };

      if (mealPlanId) {
        const updateMealPlanQuery = `
          UPDATE MealPlan
          SET plan_name = ?, date_range_start = ?, date_range_end = ?, people_count = ?, children_count = ?, total_cost = ?
          WHERE id = ?
        `;

        db.query(updateMealPlanQuery, [planName, dateRangeStart, dateRangeEnd, peopleCount, childrenCount, totalCost, mealPlanId], (updateErr, updateResult) => {
          if (updateErr) {
            return rollbackWithResponse(res, 'Server error while updating meal plan', updateErr);
          }

          if (updateResult.affectedRows === 0) {
            return rollbackWithResponse(res, 'Meal plan not found', null, 404);
          }

          db.query('DELETE FROM MealPlanDetail WHERE meal_plan_id = ?', [mealPlanId], (deleteErr) => {
            if (deleteErr) {
              return rollbackWithResponse(res, 'Server error while updating meal details', deleteErr);
            }

            saveDetails(mealPlanId, 'Meal plan updated successfully');
          });
        });
      } else {
        const insertMealPlanQuery = `
          INSERT INTO MealPlan (plan_name, date_range_start, date_range_end, people_count, children_count, total_cost)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(insertMealPlanQuery, [planName, dateRangeStart, dateRangeEnd, peopleCount, childrenCount, totalCost], (insertErr, insertResult) => {
          if (insertErr) {
            return rollbackWithResponse(res, 'Server error while creating new meal plan', insertErr);
          }

          saveDetails(insertResult.insertId, 'Meal plan created successfully');
        });
      }
    });
  });
});

app.post('/save-meal-plan-legacy', (req, res) => {
  const { mealPlanId, dateRangeStart, dateRangeEnd, peopleCount, childrenCount, totalCost, meals } = req.body;

  if (mealPlanId) {
    // Update existing MealPlan
    const updateMealPlanQuery = `
      UPDATE MealPlan
      SET date_range_start = ?, date_range_end = ?, people_count = ?, children_count = ?, total_cost = ?
      WHERE id = ?
    `;
    db.query(updateMealPlanQuery, [dateRangeStart, dateRangeEnd, peopleCount, childrenCount, totalCost, mealPlanId], (err) => {
      if (err) {
        console.error('Error updating meal plan:', err);
        return res.status(500).json({ error: 'Server error while updating meal plan' });
      }

      // Delete existing details for the meal plan
      const deleteDetailsQuery = `DELETE FROM MealPlanDetail WHERE meal_plan_id = ?`;
      db.query(deleteDetailsQuery, [mealPlanId], (err) => {
        if (err) {
          console.error('Error deleting old meal plan details:', err);
          return res.status(500).json({ error: 'Server error while updating meal details' });
        }

        // Insert updated details
        const mealPlanDetails = meals.map((meal) => [
          mealPlanId,
          meal.mealTime,
          meal.dayOfWeek,
          meal.foodId,
          meal.quantity,
        ]);

        const insertMealPlanDetailsQuery = `
          INSERT INTO MealPlanDetail (meal_plan_id, meal_time, day_of_week, food_id, quantity)
          VALUES ?
        `;
        db.query(insertMealPlanDetailsQuery, [mealPlanDetails], (err) => {
          if (err) {
            console.error('Error inserting updated meal plan details:', err);
            return res.status(500).json({ error: 'Server error while saving meal details' });
          }
          res.json({ success: true, message: 'Meal plan updated successfully' });
        });
      });
    });
  } else {
    const getDeletedIdsQuery = `
      SELECT id FROM MealPlan
      WHERE id NOT IN (SELECT DISTINCT meal_plan_id FROM MealPlanDetail)
      ORDER BY id ASC
    `;

    db.query(getDeletedIdsQuery, (err, results) => {
      if (err) {
        console.error('Error fetching deleted IDs:', err);
        return res.status(500).json({ error: 'Server error while fetching deleted IDs' });
      }

      // Kiểm tra nếu có ID đã xóa
      let newMealPlanId = null;
      if (results.length > 0) {
        newMealPlanId = results[0].id; // Lấy ID nhỏ nhất
      }

      const insertMealPlanQuery = newMealPlanId
        ? `INSERT INTO MealPlan (id, date_range_start, date_range_end, people_count, children_count, total_cost) VALUES (?, ?, ?, ?, ?, ?)`
        : `INSERT INTO MealPlan (date_range_start, date_range_end, people_count, children_count, total_cost) VALUES (?, ?, ?, ?, ?)`;

      const insertValues = newMealPlanId
        ? [newMealPlanId, dateRangeStart, dateRangeEnd, peopleCount, childrenCount, totalCost]
        : [dateRangeStart, dateRangeEnd, peopleCount, childrenCount, totalCost];

      db.query(insertMealPlanQuery, insertValues, (err, results) => {
        if (err) {
          console.error('Error creating new meal plan:', err);
          return res.status(500).json({ error: 'Server error while creating new meal plan' });
        }

        if (!newMealPlanId) {
          newMealPlanId = results.insertId; // Nếu không có ID tái sử dụng, lấy ID mới từ AUTO_INCREMENT
        }

        // Thêm chi tiết kế hoạch
        const mealPlanDetails = meals.map((meal) => [
          newMealPlanId,
          meal.mealTime,
          meal.dayOfWeek,
          meal.foodId,
          meal.quantity,
        ]);

        const insertMealPlanDetailsQuery = `
          INSERT INTO MealPlanDetail (meal_plan_id, meal_time, day_of_week, food_id, quantity)
          VALUES ?
        `;
        db.query(insertMealPlanDetailsQuery, [mealPlanDetails], (err) => {
          if (err) {
            console.error('Error adding meal plan details:', err);
            return res.status(500).json({ error: 'Server error while saving meal details' });
          }
          res.json({ success: true, message: 'Meal plan created successfully', newMealPlanId });
        });
      });
    });
  }
});

app.delete('/delete-meal-plan/:id', (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Meal plan ID is invalid' });
  }

  db.beginTransaction((transactionErr) => {
    if (transactionErr) {
      console.error('Error starting delete transaction:', transactionErr);
      return res.status(500).json({ error: 'Server error while starting meal plan delete' });
    }

    db.query('DELETE FROM MealPlanDetail WHERE meal_plan_id = ?', [id], (detailErr) => {
      if (detailErr) {
        return rollbackWithResponse(res, 'Server error while deleting meal plan details', detailErr);
      }

      db.query('DELETE FROM MealPlan WHERE id = ?', [id], (planErr, planResult) => {
        if (planErr) {
          return rollbackWithResponse(res, 'Server error while deleting meal plan', planErr);
        }

        if (planResult.affectedRows === 0) {
          return rollbackWithResponse(res, 'Meal plan not found', null, 404);
        }

        db.commit((commitErr) => {
          if (commitErr) {
            return rollbackWithResponse(res, 'Server error while committing meal plan delete', commitErr);
          }

          res.json({ success: true, message: 'Meal plan deleted successfully' });
        });
      });
    });
  });
});

app.delete('/delete-meal-plan-legacy/:id', (req, res) => {
  const { id } = req.params;

  const deleteDetailsQuery = `DELETE FROM MealPlanDetail WHERE meal_plan_id = ?`;
  db.query(deleteDetailsQuery, [id], (err) => {
    if (err) {
      console.error('Error deleting meal plan details:', err);
      return res.status(500).json({ error: 'Server error while deleting meal plan details' });
    }

    const deleteMealPlanQuery = `DELETE FROM MealPlan WHERE id = ?`;
    db.query(deleteMealPlanQuery, [id], (err) => {
      if (err) {
        console.error('Error deleting meal plan:', err);
        return res.status(500).json({ error: 'Server error while deleting meal plan' });
      }
      res.json({ success: true, message: 'Meal plan deleted successfully' });
    });
  });
});

// Get Meal Plan API with All Details
app.get('/meal-plan', (req, res) => {
  // Query to fetch all meal plans
  const queryMealPlans = `
    SELECT * FROM MealPlan
    ORDER BY id DESC
  `;

  db.query(queryMealPlans, (err, mealPlans) => {
    if (err) return res.status(500).json({ error: 'Server error while fetching meal plans' });

    if (mealPlans.length === 0) return res.json({ mealPlans: [] });

    const mealPlanIds = mealPlans.map(plan => plan.id);

    // Query to fetch details for all meal plans
    const queryMealPlanDetails = `
      SELECT mpd.meal_plan_id, mpd.meal_time, mpd.day_of_week, mpd.food_id, mpd.quantity,
             fi.name AS foodName, fi.image, fi.description, fi.price AS foodPrice, fi.calories AS foodCalories
      FROM MealPlanDetail mpd
      JOIN FoodItems fi ON mpd.food_id = fi.Fid
      WHERE mpd.meal_plan_id IN (?)
      ORDER BY mpd.meal_plan_id DESC, mpd.id ASC
    `;

    db.query(queryMealPlanDetails, [mealPlanIds], (err, details) => {
      if (err) return res.status(500).json({ error: 'Server error while fetching meal plan details' });

      // Organize meal plans with their respective details
      const mealPlanMap = {};
      mealPlans.forEach(plan => {
        mealPlanMap[plan.id] = {
          ...plan,
          details: []
        };
      });

      details.forEach(detail => {
        if (mealPlanMap[detail.meal_plan_id]) {
          mealPlanMap[detail.meal_plan_id].details.push({
            mealTime: detail.meal_time,
            dayOfWeek: detail.day_of_week,
            foodId: detail.food_id,
            quantity: detail.quantity,
            foodName: detail.foodName,
            image: detail.image,
            description: detail.description,
            foodPrice: detail.foodPrice,
            foodCalories: detail.foodCalories
          });
        }
      });

      const organizedMealPlans = Object.values(mealPlanMap);
      res.json({ mealPlans: organizedMealPlans });
    });
  });
});

// Lấy danh sách món ăn
app.get('/dishes', (req, res) => {
  const query = 'SELECT * FROM FoodItems';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

// Thêm món ăn mới
app.post('/dishes', (req, res) => {
  const { name, image, description, price, calories } = req.body;
  const query = 'INSERT INTO FoodItems (name, image, description, price, calories) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, image, description, price, calories], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ success: true, message: 'Dish added successfully', dishId: results.insertId });
  });
});

// Cập nhật món ăn
app.put('/dishes/:id', (req, res) => {
  const { id } = req.params;
  const { name, image, description, price, calories } = req.body;
  const query = 'UPDATE FoodItems SET name = ?, image = ?, description = ?, price = ?, calories = ? WHERE Fid = ?';
  db.query(query, [name, image, description, price, calories, id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Dish not found' });
    res.json({ success: true, message: 'Dish updated successfully' });
  });
});

app.delete('/dishes/:id', (req, res) => {
  const { id } = req.params;

  // Xóa dữ liệu liên quan trước
  const deleteIngredientsQuery = 'DELETE FROM fooditems_ingredient WHERE mid = ?';
  db.query(deleteIngredientsQuery, [id], (err) => {
    if (err) {
      console.error('Error deleting related ingredients:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    // Xóa món ăn
    const deleteDishQuery = 'DELETE FROM FoodItems WHERE Fid = ?';
    db.query(deleteDishQuery, [id], (err, results) => {
      if (err) {
        console.error('Error deleting dish:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Dish not found' });
      }
      res.json({ success: true, message: 'Dish deleted successfully' });
    });
  });
});

// Lấy danh sách nguyên liệu
app.get('/ingredients', (req, res) => {
  const query = 'SELECT * FROM ingredients';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

// Lấy chi tiết món ăn theo ID
app.get('/food-items/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT fi.Fid, fi.name AS foodName, fi.image, fi.description, fi.price AS foodPrice, fi.calories AS foodCalories, 
           i.id AS ingredientId, i.name AS ingredientName, i.calories AS ingredientCalories, i.price AS ingredientPrice, 
           fi_ing.gram, fi_ing.totalCalo 
    FROM FoodItems AS fi
    JOIN FoodItems_Ingredient AS fi_ing ON fi.Fid = fi_ing.mid
    JOIN ingredients AS i ON fi_ing.Iid = i.id
    WHERE fi.Fid = ?`;

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });

    if (results.length === 0) return res.status(404).json({ error: 'Món ăn không tìm thấy' });

    const foodItem = {
      Fid: results[0].Fid,
      foodName: results[0].foodName,
      image: results[0].image,
      description: results[0].description,
      foodPrice: results[0].foodPrice,
      foodCalories: results[0].foodCalories,
      ingredients: [],
      totalCalories: 0,
      totalPrice: 0
    };

    results.forEach(row => {
      foodItem.ingredients.push({
        ingredientId: row.ingredientId,
        ingredientName: row.ingredientName,
        ingredientCalories: row.ingredientCalories,
        ingredientPrice: row.ingredientPrice,
        gram: row.gram,
        totalCalo: row.totalCalo
      });
      foodItem.totalCalories += row.totalCalo;
      foodItem.totalPrice += (row.ingredientPrice * (row.gram / 1000)); // Giả sử giá là theo kg
    });

    res.json(foodItem);
  });
});

// Add chi tiết món ăn
app.post('/foodItems_ingredient', (req, res) => {  
  const { mid, Iid, gram, totalCalo } = req.body;
  const query = 'INSERT INTO FoodItems_Ingredient (mid, Iid, gram, totalCalo) VALUES (?, ?, ?, ?)';
  db.query(query, [mid, Iid, gram, totalCalo], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ success: true, message: 'Food item ingredient added' });
  });
});

app.delete('/foodItems_ingredient/:foodId', (req, res) => {
  const { foodId } = req.params;
  const query = 'DELETE FROM FoodItems_Ingredient WHERE mid = ?';

  db.query(query, [foodId], (err) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ success: true, message: 'Food item ingredients cleared' });
  });
});

const PORT = process.env.PORT || 3060;
app.listen(PORT, () => { 
  console.log(`Server running on port ${PORT}`);
});
