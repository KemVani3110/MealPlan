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
  const validation = validateLoginPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { username, password } = validation.value;
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
  const validation = validateRegisterPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { userID, username, password } = validation.value;
  const queryCheck = 'SELECT * FROM user WHERE userID = ? OR username = ?';
  db.query(queryCheck, [userID, username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.length > 0) return res.status(409).json({ error: 'UserID or username already exists' });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const queryInsert = 'INSERT INTO user (userID, username, password) VALUES (?, ?, ?)';
      db.query(queryInsert, [userID, username, hashedPassword], (err) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        res.json({ success: true, message: 'Registration successful' });
      });
    } catch (hashErr) {
      console.error('Error hashing password:', hashErr);
      res.status(500).json({ error: 'Server error' });
    }
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
    LEFT JOIN FoodItems_Ingredient AS fi_ing ON fi.Fid = fi_ing.mid
    LEFT JOIN ingredients AS i ON fi_ing.Iid = i.id`;

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
      if (ingredientId) {
        foodItemsMap[Fid].ingredients.push({
          ingredientId,
          ingredientName,
          ingredientCalories,
          ingredientPrice,
          gram,
          totalCalo
        });
      }
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

const toNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const normalizeText = (value, maxLength = 255) => String(value || '').trim().slice(0, maxLength);

const validateRegisterPayload = (body) => {
  const rawUserID = normalizeText(body.userID, 255);
  const userID = rawUserID.slice(0, 10);
  const username = normalizeText(body.username, 50);
  const password = String(body.password || '');

  if (!rawUserID || rawUserID.length > 10 || /\s/.test(rawUserID)) {
    return { error: 'User ID must be 1-10 characters and cannot contain spaces' };
  }

  if (username.length < 3) {
    return { error: 'Username must be at least 3 characters' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  return { value: { userID, username, password } };
};

const validateLoginPayload = (body) => {
  const username = normalizeText(body.username, 50);
  const password = String(body.password || '');

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  return { value: { username, password } };
};

const validateDishPayload = (body) => {
  const name = normalizeText(body.name, 255);
  const image = normalizeText(body.image, 255);
  const description = normalizeText(body.description, 255);
  const price = toNonNegativeNumber(body.price);
  const calories = toNonNegativeNumber(body.calories);

  if (!name) {
    return { error: 'Dish name is required' };
  }

  if (price === null || calories === null) {
    return { error: 'Dish price and calories must be valid non-negative numbers' };
  }

  return { value: { name, image, description, price, calories } };
};

const validateFoodIngredientPayload = (body) => {
  const mid = toPositiveInt(body.mid);
  const Iid = toPositiveInt(body.Iid);
  const gram = toPositiveInt(body.gram);
  const totalCalo = toNonNegativeNumber(body.totalCalo);

  if (!mid || !Iid || !gram || totalCalo === null) {
    return { error: 'Food item, ingredient, gram and calories are required' };
  }

  return { value: { mid, Iid, gram, totalCalo } };
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
  const validation = validateDishPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { name, image, description, price, calories } = validation.value;
  const query = 'INSERT INTO FoodItems (name, image, description, price, calories) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, image, description, price, calories], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json({ success: true, message: 'Dish added successfully', dishId: results.insertId });
  });
});

// Cập nhật món ăn
app.put('/dishes/:id', (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Dish ID is invalid' });
  }

  const validation = validateDishPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { name, image, description, price, calories } = validation.value;
  const query = 'UPDATE FoodItems SET name = ?, image = ?, description = ?, price = ?, calories = ? WHERE Fid = ?';
  db.query(query, [name, image, description, price, calories, id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Dish not found' });
    res.json({ success: true, message: 'Dish updated successfully' });
  });
});

app.delete('/dishes/:id', (req, res) => {
  const id = toPositiveInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Dish ID is invalid' });
  }

  db.query('SELECT COUNT(*) AS planUsage FROM MealPlanDetail WHERE food_id = ?', [id], (usageErr, usageRows) => {
    if (usageErr) {
      console.error('Error checking dish usage:', usageErr);
      return res.status(500).json({ error: 'Server error' });
    }

    if (Number(usageRows[0]?.planUsage || 0) > 0) {
      return res.status(409).json({ error: 'Dish is used in a meal plan and cannot be deleted' });
    }

    const deleteIngredientsQuery = 'DELETE FROM FoodItems_Ingredient WHERE mid = ?';
    db.query(deleteIngredientsQuery, [id], (err) => {
      if (err) {
        console.error('Error deleting related ingredients:', err);
        return res.status(500).json({ error: 'Server error' });
      }

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
  const id = toPositiveInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Food item ID is invalid' });
  }

  const query = `
    SELECT fi.Fid, fi.name AS foodName, fi.image, fi.description, fi.price AS foodPrice, fi.calories AS foodCalories, 
           i.id AS ingredientId, i.name AS ingredientName, i.calories AS ingredientCalories, i.price AS ingredientPrice, 
           fi_ing.gram, fi_ing.totalCalo 
    FROM FoodItems AS fi
    LEFT JOIN FoodItems_Ingredient AS fi_ing ON fi.Fid = fi_ing.mid
    LEFT JOIN ingredients AS i ON fi_ing.Iid = i.id
    WHERE fi.Fid = ?`;

  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

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
      if (row.ingredientId) {
        foodItem.ingredients.push({
          ingredientId: row.ingredientId,
          ingredientName: row.ingredientName,
          ingredientCalories: row.ingredientCalories,
          ingredientPrice: row.ingredientPrice,
          gram: row.gram,
          totalCalo: row.totalCalo
        });
        foodItem.totalCalories += Number(row.totalCalo || 0);
        foodItem.totalPrice += (Number(row.ingredientPrice || 0) * (Number(row.gram || 0) / 1000));
      }
    });

    res.json(foodItem);
  });
});

// Add chi tiết món ăn
app.post('/foodItems_ingredient', (req, res) => {  
  const validation = validateFoodIngredientPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { mid, Iid, gram, totalCalo } = validation.value;
  const query = 'INSERT INTO FoodItems_Ingredient (mid, Iid, gram, totalCalo) VALUES (?, ?, ?, ?)';
  db.query(query, [mid, Iid, gram, totalCalo], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ingredient is already linked to this food item' });
      }
      return res.status(500).json({ error: 'Server error' });
    }
    res.json({ success: true, message: 'Food item ingredient added' });
  });
});

app.delete('/foodItems_ingredient/:foodId', (req, res) => {
  const foodId = toPositiveInt(req.params.foodId);
  if (!foodId) {
    return res.status(400).json({ error: 'Food item ID is invalid' });
  }

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
