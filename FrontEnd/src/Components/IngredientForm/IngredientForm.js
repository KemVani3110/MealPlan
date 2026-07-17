import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './IngredientForm.css';
import TaskBar from '../TaskBar/TaskBar';
import Snowfall from '../Snowfall/SnowFall';
import { formatCalories, formatCurrency, formatGram, toNumber } from '../../utils/format';

const API_URL = 'http://localhost:3060';

const emptyForm = {
  name: '',
  image: '',
  description: '',
};

const normalizeDish = (dish) => ({
  Fid: dish.Fid,
  name: dish.name || dish.foodName || '',
  image: dish.image || '',
  description: dish.description || '',
  price: toNumber(dish.price ?? dish.foodPrice),
  calories: toNumber(dish.calories ?? dish.foodCalories),
});

const IngredientForm = () => {
  const [dishes, setDishes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [minCalorieFilter, setMinCalorieFilter] = useState('');
  const [maxCalorieFilter, setMaxCalorieFilter] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [editingDishId, setEditingDishId] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishToDeleteId, setDishToDeleteId] = useState(null);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dishesPerPage = 9;

  const fetchDishes = async () => {
    try {
      const response = await axios.get(`${API_URL}/dishes`);
      setDishes((response.data || []).map(normalizeDish));
    } catch (error) {
      console.error('Error fetching dishes:', error);
      setMessage('Không thể tải danh sách món ăn.');
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await axios.get(`${API_URL}/ingredients`);
      setIngredients(response.data || []);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      setMessage('Không thể tải danh sách nguyên liệu.');
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchIngredients();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, minCalorieFilter, maxCalorieFilter, sortOrder]);

  const selectedTotals = useMemo(() => {
    return selectedIngredients.reduce((totals, ingredient) => {
      const gram = toNumber(ingredient.gram);
      return {
        calories: totals.calories + (gram / 100) * toNumber(ingredient.calories),
        price: totals.price + (gram / 1000) * toNumber(ingredient.price),
      };
    }, { calories: 0, price: 0 });
  }, [selectedIngredients]);

  const filteredDishes = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const minCalories = minCalorieFilter === '' ? 0 : toNumber(minCalorieFilter);
    const maxCalories = maxCalorieFilter === '' ? Infinity : toNumber(maxCalorieFilter, Infinity);

    return dishes
      .filter((dish) => dish.name.toLowerCase().includes(keyword))
      .filter((dish) => dish.calories >= minCalories && dish.calories <= maxCalories)
      .sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  }, [dishes, maxCalorieFilter, minCalorieFilter, searchTerm, sortOrder]);

  const currentDishes = filteredDishes.slice((currentPage - 1) * dishesPerPage, currentPage * dishesPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredDishes.length / dishesPerPage));

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedIngredients([]);
    setIngredientSearchTerm('');
    setEditingDishId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = async (dish) => {
    try {
      const response = await axios.get(`${API_URL}/food-items/${dish.Fid}`);
      const dishDetails = response.data;
      setEditingDishId(dish.Fid);
      setFormData({
        name: dishDetails.foodName,
        image: dishDetails.image,
        description: dishDetails.description,
      });
      setSelectedIngredients((dishDetails.ingredients || []).map((ingredient) => ({
        id: ingredient.ingredientId,
        name: ingredient.ingredientName,
        calories: ingredient.ingredientCalories,
        price: ingredient.ingredientPrice,
        gram: ingredient.gram,
      })));
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching dish details:', error);
      setMessage('Không thể mở món để chỉnh sửa.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const saveDish = async () => {
    if (!formData.name.trim()) {
      setMessage('Tên món ăn là bắt buộc.');
      return;
    }

    if (selectedIngredients.length === 0) {
      setMessage('Hãy chọn ít nhất một nguyên liệu.');
      return;
    }

    const payload = {
      ...formData,
      price: selectedTotals.price,
      calories: selectedTotals.calories,
    };

    try {
      const dishResponse = editingDishId
        ? await axios.put(`${API_URL}/dishes/${editingDishId}`, payload).then(() => ({ data: { dishId: editingDishId } }))
        : await axios.post(`${API_URL}/dishes`, payload);

      const dishId = dishResponse.data.dishId;
      if (editingDishId) {
        await axios.delete(`${API_URL}/foodItems_ingredient/${editingDishId}`);
      }

      await Promise.all(selectedIngredients.map((ingredient) => {
        const gram = toNumber(ingredient.gram);
        return axios.post(`${API_URL}/foodItems_ingredient`, {
          mid: dishId,
          Iid: ingredient.id,
          gram,
          totalCalo: (gram / 100) * toNumber(ingredient.calories),
        });
      }));

      await fetchDishes();
      setMessage(editingDishId ? 'Đã cập nhật món ăn.' : 'Đã thêm món ăn mới.');
      closeModal();
    } catch (error) {
      console.error('Error saving dish:', error);
      setMessage('Không thể lưu món ăn.');
    }
  };

  const deleteDish = async () => {
    if (!dishToDeleteId) return;

    try {
      await axios.delete(`${API_URL}/dishes/${dishToDeleteId}`);
      await fetchDishes();
      setMessage('Đã xóa món ăn.');
    } catch (error) {
      console.error('Error deleting dish:', error);
      setMessage('Không thể xóa món ăn.');
    } finally {
      setDishToDeleteId(null);
    }
  };

  const addIngredient = (ingredient) => {
    if (selectedIngredients.some((item) => item.id === ingredient.id)) return;
    setSelectedIngredients((currentIngredients) => [...currentIngredients, { ...ingredient, gram: 100 }]);
    setIngredientSearchTerm('');
  };

  const updateIngredientGram = (ingredientId, gram) => {
    setSelectedIngredients((currentIngredients) =>
      currentIngredients.map((ingredient) =>
        ingredient.id === ingredientId ? { ...ingredient, gram: Math.max(0, toNumber(gram)) } : ingredient
      )
    );
  };

  const openDetailModal = async (dishId) => {
    try {
      const response = await axios.get(`${API_URL}/food-items/${dishId}`);
      setSelectedDish(response.data);
    } catch (error) {
      console.error('Error fetching dish details:', error);
      setMessage('Không thể tải chi tiết món ăn.');
    }
  };

  const ingredientSuggestions = ingredients
    .filter((ingredient) => ingredient.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()))
    .slice(0, 8);

  return (
    <div>
      <TaskBar />
      <Snowfall />

      <div className="ingredient-form">
        <h1 className="ingredient-h1">Quản lý món ăn và nguyên liệu</h1>

        <div className="search-bar-ingredient">
          <input
            type="text"
            placeholder="Tìm món ăn..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="calorie-filter">
          <input
            type="number"
            placeholder="Calo tối thiểu"
            value={minCalorieFilter}
            onChange={(event) => setMinCalorieFilter(event.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Calo tối đa"
            value={maxCalorieFilter}
            onChange={(event) => setMaxCalorieFilter(event.target.value)}
          />
        </div>

        <div className="button-group-ingredient">
          <button className="sort-btn" type="button" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>
          <button className="add-dish-btn" type="button" onClick={openAddModal}>
            Thêm món ăn mới
          </button>
        </div>

        {message && <p className="modal-message">{message}</p>}

        <div className="dishes-list">
          {currentDishes.map((dish) => (
            <div className="dish-card" key={dish.Fid}>
              <img src={dish.image} alt={dish.name} />
              <h3>{dish.name}</h3>
              <p>{dish.description}</p>
              <p>{formatCurrency(dish.price)}</p>
              <p>{formatCalories(dish.calories)}</p>
              <div className="card-buttons">
                <button type="button" onClick={() => openDetailModal(dish.Fid)}>Chi tiết</button>
                <button type="button" onClick={() => openEditModal(dish)}>Sửa</button>
                <button type="button" onClick={() => setDishToDeleteId(dish.Fid)}>Xóa</button>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index + 1}
              type="button"
              onClick={() => setCurrentPage(index + 1)}
              className={currentPage === index + 1 ? 'active' : ''}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {isModalOpen && (
          <div className="modal-ingredient">
            <div className="modal-content-ingredient">
              <h2>{editingDishId ? 'Cập nhật món ăn' : 'Thêm món ăn'}</h2>
              <input
                type="text"
                placeholder="Tên món ăn"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              />
              <input
                type="text"
                placeholder="URL ảnh"
                value={formData.image}
                onChange={(event) => setFormData({ ...formData, image: event.target.value })}
              />
              <textarea
                placeholder="Mô tả"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              />

              <div className="price-calories-input">
                <input type="text" value={formatCurrency(selectedTotals.price)} readOnly />
                <span>Chi phí</span>
              </div>
              <div className="price-calories-input">
                <input type="text" value={formatCalories(selectedTotals.calories)} readOnly />
                <span>Calo</span>
              </div>

              <input
                type="text"
                placeholder="Tìm nguyên liệu..."
                value={ingredientSearchTerm}
                onChange={(event) => setIngredientSearchTerm(event.target.value)}
              />
              {ingredientSearchTerm && (
                <div className="dropdown">
                  <ul>
                    {ingredientSuggestions.map((ingredient) => (
                      <li key={ingredient.id} onClick={() => addIngredient(ingredient)}>
                        {ingredient.name} - {formatCurrency(ingredient.price)}/kg
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <h3>Nguyên liệu đã chọn</h3>
              <ul className="selected-ingredients-list">
                {selectedIngredients.map((ingredient) => (
                  <li className="ingredient-item" key={ingredient.id}>
                    <span>{ingredient.name}</span>
                    <input
                      type="number"
                      value={ingredient.gram}
                      onChange={(event) => updateIngredientGram(ingredient.id, event.target.value)}
                      placeholder="Gram"
                      className="gram-input"
                    />
                    <button
                      className="remove-btn"
                      type="button"
                      onClick={() => setSelectedIngredients((currentIngredients) => currentIngredients.filter((item) => item.id !== ingredient.id))}
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>

              <div className="modal-buttons">
                <button type="button" onClick={saveDish}>{editingDishId ? 'Cập nhật' : 'Thêm món'}</button>
                <button type="button" onClick={closeModal}>Hủy</button>
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
                <p className="dish-price">Giá: <span>{formatCurrency(selectedDish.foodPrice)}</span></p>
                <p className="dish-calories">Calo: <span>{formatCalories(selectedDish.foodCalories)}</span></p>
              </div>
              <h3>Nguyên liệu</h3>
              <ul className="ingredient-list">
                {(selectedDish.ingredients || []).map((ingredient) => (
                  <li key={ingredient.ingredientId} className="ingredient-item">
                    {ingredient.ingredientName} - {formatGram(ingredient.gram)}
                  </li>
                ))}
              </ul>
              <button className="close-btn" type="button" onClick={() => setSelectedDish(null)}>Đóng</button>
            </div>
          </div>
        )}

        {dishToDeleteId && (
          <div className="modal-ingredient">
            <div className="modal-content-ingredient">
              <h2>Xác nhận xóa món ăn</h2>
              <p>Món bị xóa sẽ không còn dùng được trong các lần chọn mới.</p>
              <div className="modal-buttons">
                <button type="button" onClick={deleteDish}>Xóa</button>
                <button type="button" onClick={() => setDishToDeleteId(null)}>Hủy</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientForm;
