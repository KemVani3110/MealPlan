import React, { useState, useEffect } from "react";
import axios from "axios";
import "./IngredientForm.css";
import TaskBar from '../TaskBar/TaskBar';
import Snowfall from '../Snowfall/SnowFall';
const IngredientForm = () => {
  const [dishes, setDishes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    description: "",
    price: "",
    calories: "",
  });
  const [editingDishId, setEditingDishId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState("");

  useEffect(() => {
    fetchDishes();
    fetchIngredients();
  }, []);

  const fetchDishes = async () => {
    try {
      const response = await axios.get("http://localhost:3060/dishes");
      setDishes(response.data);
    } catch (error) {
      console.error("Error fetching dishes:", error);
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await axios.get("http://localhost:3060/ingredients");
      setIngredients(response.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      fetchDishes();
    } else {
      const filteredDishes = dishes.filter((dish) =>
        dish.name.toLowerCase().startsWith(value.toLowerCase())
      );
      setDishes(filteredDishes);
    }
  };

  const handleOpenAddModal = () => {
    setEditingDishId(null);
    setFormData({
      name: "",
      image: "",
      description: "",
      price: "",
      calories: "",
    });
    setSelectedIngredients([]); // Reset selected ingredients
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (dish) => {
    setEditingDishId(dish.Fid);

    try {
      // Fetch dish details
      const dishResponse = await axios.get(`http://localhost:3060/food-items/${dish.Fid}`);
      const dishDetails = dishResponse.data;

      // Set form data
      setFormData({
        name: dishDetails.foodName,
        image: dishDetails.image,
        description: dishDetails.description,
        price: dishDetails.foodPrice,
        calories: dishDetails.foodCalories,
      });

      // Set selected ingredients with fetched data
      setSelectedIngredients(dishDetails.ingredients.map(ingredient => ({
        id: ingredient.ingredientId,
        name: ingredient.ingredientName,
        gram: ingredient.gram,
        calories: ingredient.ingredientCalories,
        price: ingredient.ingredientPrice,
        totalCalo: ingredient.totalCalo,
      })));

    } catch (error) {
      console.error("Error fetching dish details for editing:", error);
    }

    setIsModalOpen(true);
  };

  const handleAddDish = async () => {
    try {
      const totalCalories = calculateTotalCalories();
      const totalPrice = calculateTotalPrice();

      const newDish = {
        ...formData,
        calories: totalCalories,
        price: totalPrice,
      };

      const dishResponse = await axios.post("http://localhost:3060/dishes", newDish);
      const dishId = dishResponse.data.dishId;

      const ingredientPromises = selectedIngredients.map(ingredient => {
        return axios.post("http://localhost:3060/foodItems_ingredient", {
          mid: dishId,
          Iid: ingredient.id,
          gram: ingredient.gram,
          totalCalo: ingredient.totalCalo,
        });
      });

      await Promise.all(ingredientPromises);
      fetchDishes();
      setIsModalOpen(false);
      setSelectedIngredients([]);
      setIngredientSearchTerm("");
    } catch (error) {
      console.error("Error adding dish:", error);
    }
  };

  const handleEditDish = async () => {
    try {
      const totalCalories = calculateTotalCalories();
      const totalPrice = calculateTotalPrice();

      const updatedDish = {
        ...formData,
        calories: totalCalories,
        price: totalPrice,
      };

      await axios.put(`http://localhost:3060/dishes/${editingDishId}`, updatedDish);
      await axios.delete(`http://localhost:3060/foodItems_ingredient/${editingDishId}`);

      const ingredientPromises = selectedIngredients.map(ingredient => {
        return axios.post("http://localhost:3060/foodItems_ingredient", {
          mid: editingDishId,
          Iid: ingredient.id,
          gram: ingredient.gram,
          totalCalo: ingredient.totalCalo,
        });
      });

      await Promise.all(ingredientPromises);
      fetchDishes();
      setIsModalOpen(false);
      setSelectedIngredients([]);
      setIngredientSearchTerm("");
    } catch (error) {
      console.error("Error updating dish:", error);
    }
  };

  const handleDeleteDish = async (id) => {
    try {
      await axios.delete(`http://localhost:3060/dishes/${id}`);
      fetchDishes();
    } catch (error) {
      console.error("Error deleting dish:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDishId(null);
    setSelectedIngredients([]); // Reset selected ingredients when closing modal
  };

  const handleIngredientSearchChange = (e) => {
    setIngredientSearchTerm(e.target.value);
  };

  const addIngredient = (ingredient) => {
    if (!selectedIngredients.find(i => i.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, { ...ingredient, gram: 0 }]);
      setIngredientSearchTerm(""); // Đặt lại giá trị của ingredientSearchTerm
    }
  };

  const removeIngredient = (ingredientId) => {
    setSelectedIngredients(selectedIngredients.filter(i => i.id !== ingredientId));
  };

  const handleGramChange = (ingredientId, gram) => {
    setSelectedIngredients(prevIngredients => {
      return prevIngredients.map(ingredient => {
        if (ingredient.id === ingredientId) {
          const totalCalo = (gram / 100) * ingredient.calories;
          return { ...ingredient, gram, totalCalo };
        }
        return ingredient;
      });
    });
  };

  const calculateTotalCalories = () => {
    return selectedIngredients.reduce((total, ingredient) => total + (ingredient.totalCalo || 0), 0);
  };

  const calculateTotalPrice = () => {
    return selectedIngredients.reduce((total, ingredient) => total + (ingredient.price * (ingredient.gram / 1000) || 0), 0);
  };

  const sortDishes = (order) => {
    const sortedDishes = [...dishes];
    sortedDishes.sort((a, b) => {
      if (order === "asc") {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
    setDishes(sortedDishes);
  };

  const handleSortToggle = () => {
    const newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);
    sortDishes(newSortOrder);
  };

  const handleOpenDetailModal = async (dishId) => {
    try {
      const response = await axios.get(`http://localhost:3060/food-items/${dishId}`);
      setSelectedDish(response.data);
    } catch (error) {
      console.error("Error fetching dish details:", error);
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedDish(null);
  };

  return (
    <div><TaskBar></TaskBar>
      <Snowfall />
      <div className="ingredient-form">

        <h1 className="ingredient-h1">Nguyên liệu món ăn</h1>

        <div className="search-bar-ingredient">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="button-group-ingredient">
          <button className="sort-btn" onClick={handleSortToggle}>
            Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
          </button>

          <button className="add-dish-btn" onClick={handleOpenAddModal}>
            Thêm món ăn mới
          </button>
        </div>

        <div className="dishes-list">
          {dishes.map((dish) => (
            <div className="dish-card" key={dish.Fid}>
              <img src={dish.image} alt={dish.name} />
              <h3>{dish.name}</h3>
              <p>{dish.description}</p>
              <p>Price: {dish.price} VND</p>
              <p>Calories: {dish.calories} cal</p>
              <div className="card-buttons">
                <button onClick={() => handleOpenDetailModal(dish.Fid)}>Details</button>
                <button onClick={() => handleOpenEditModal(dish)}>Edit</button>
                <button onClick={() => handleDeleteDish(dish.Fid)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {isModalOpen && (
          <div className="modal-ingredient">
            <div className="modal-content-ingredient">
              <h2>{editingDishId ? "Edit Dish" : "Add New Dish"}</h2>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                type="text"
                name="image"
                placeholder="Image URL"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="price-calories-input">
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={calculateTotalPrice()} // Show calculated total price
                  readOnly
                />
                <span>VND</span>
              </div>
              <div className="price-calories-input">
                <input
                  type="number"
                  name="calories"
                  placeholder="Calories"
                  value={calculateTotalCalories()} // Show calculated total calories
                  readOnly
                />
                <span>Calories</span>
              </div>
              <input
                type="text"
                placeholder="Search ingredients..."
                value={ingredientSearchTerm}
                onChange={handleIngredientSearchChange}
              />
              {ingredientSearchTerm && (
                <div className="dropdown">
                  <ul>
                    {ingredients
                      .filter((ingredient) =>
                        ingredient.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())
                      )
                      .map((ingredient) => (
                        <li key={ingredient.id} onClick={() => addIngredient(ingredient)}>
                          {ingredient.name}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              <h3>Selected Ingredients:</h3>
              <ul className="selected-ingredients-list">
                {selectedIngredients.map((ingredient) => (
                  <li className="ingredient-item" key={ingredient.id}>
                    <span>{ingredient.name}</span>
                    <input
                      type="number"
                      value={ingredient.gram}
                      onChange={(e) => handleGramChange(ingredient.id, parseInt(e.target.value, 10) || 0)}
                      placeholder="Grams"
                      className="gram-input"
                    />
                    <button className="remove-btn" onClick={() => removeIngredient(ingredient.id)}>Remove</button>
                  </li>
                ))}
              </ul>
              <div className="modal-buttons">
                <button onClick={editingDishId ? handleEditDish : handleAddDish}>
                  {editingDishId ? "Update Dish" : "Add Dish"}
                </button>
                <button onClick={handleCloseModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {selectedDish && (
          <div className="dish-detail-modal">
            <div className="dish-detail-modal-content">
              <h2 className="dish-title">{selectedDish.foodName}</h2>
              <img src={selectedDish.image} alt={selectedDish.foodName} className="dish-image" />
              <p className="dish-description">{selectedDish.description}</p>
              <div className="dish-info">
                <p className="dish-price">Price: <span>{selectedDish.foodPrice} VND</span></p>
                <p className="dish-calories">Calories: <span>{selectedDish.foodCalories} cal</span></p>
              </div>
              <h3>Ingredients:</h3>
              <ul className="ingredient-list">
                {selectedDish.ingredients.map(ingredient => (
                  <li key={ingredient.ingredientId} className="ingredient-item">
                    {ingredient.ingredientName} - {ingredient.gram}g
                  </li>
                ))}
              </ul>
              <button className="close-btn" onClick={handleCloseDetailModal}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientForm;