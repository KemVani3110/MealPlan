import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './IngredientForm.css';
import TaskBar from '../TaskBar/TaskBar';
import { formatCalories, formatCurrency, formatGram, toNumber } from '../../utils/format';
import { createMealDraft, saveMealWorkflowDraft } from '../../utils/mealWorkflow';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dishes, setDishes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('nameAsc');
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

  const dishesPerPage = 8;

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

  const stats = useMemo(() => {
    const totalCalories = dishes.reduce((sum, dish) => sum + dish.calories, 0);
    const totalPrice = dishes.reduce((sum, dish) => sum + dish.price, 0);
    return {
      dishCount: dishes.length,
      ingredientCount: ingredients.length,
      averageCalories: dishes.length ? totalCalories / dishes.length : 0,
      averagePrice: dishes.length ? totalPrice / dishes.length : 0,
    };
  }, [dishes, ingredients]);

  const filteredDishes = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const minCalories = minCalorieFilter === '' ? 0 : toNumber(minCalorieFilter);
    const maxCalories = maxCalorieFilter === '' ? Infinity : toNumber(maxCalorieFilter, Infinity);

    return dishes
      .filter((dish) => dish.name.toLowerCase().includes(keyword))
      .filter((dish) => dish.calories >= minCalories && dish.calories <= maxCalories)
      .sort((a, b) => {
        if (sortOrder === 'caloriesDesc') return b.calories - a.calories;
        if (sortOrder === 'caloriesAsc') return a.calories - b.calories;
        if (sortOrder === 'priceDesc') return b.price - a.price;
        if (sortOrder === 'priceAsc') return a.price - b.price;
        return a.name.localeCompare(b.name);
      });
  }, [dishes, maxCalorieFilter, minCalorieFilter, searchTerm, sortOrder]);

  const currentDishes = filteredDishes.slice((currentPage - 1) * dishesPerPage, currentPage * dishesPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredDishes.length / dishesPerPage));

  const ingredientSuggestions = useMemo(() => {
    const keyword = ingredientSearchTerm.trim().toLowerCase();
    if (!keyword) return ingredients.slice(0, 8);
    return ingredients
      .filter((ingredient) => ingredient.name.toLowerCase().includes(keyword))
      .slice(0, 8);
  }, [ingredientSearchTerm, ingredients]);

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

  const openDetailModal = useCallback(async (dishId) => {
    try {
      const response = await axios.get(`${API_URL}/food-items/${dishId}`);
      setSelectedDish(response.data);
    } catch (error) {
      console.error('Error fetching dish details:', error);
      setMessage('Không thể tải chi tiết món ăn.');
    }
  }, []);

  useEffect(() => {
    const dishIdFromQuery = Number(searchParams.get('dish'));
    if (!dishIdFromQuery || dishes.length === 0) return;
    openDetailModal(dishIdFromQuery);
  }, [dishes.length, openDetailModal, searchParams]);

  const sendDishToMakeMeal = (dish) => {
    navigate(`/makemeal?food=${dish.Fid}`);
  };

  const sendDishToPlan = (dish) => {
    saveMealWorkflowDraft(createMealDraft({
      source: 'ingredient',
      meals: [{ ...dish, quantity: 1 }],
      note: 'Món được gửi từ kho món và nguyên liệu.',
    }));
    navigate('/planmeal?draft=ingredient');
  };

  return (
    <div className="ingredient-page">
      <TaskBar />

      <main className="ingredient-shell">
        <section className="ingredient-header">
          <div>
            <span className="ingredient-eyebrow">Kho món</span>
            <h1>Quản lý món ăn và nguyên liệu</h1>
            <p>Dữ liệu món ăn được tính từ định lượng nguyên liệu, chi phí và calo mỗi khẩu phần.</p>
          </div>
          <button className="ingredient-primary-btn" type="button" onClick={openAddModal}>
            Thêm món ăn
          </button>
        </section>

        <section className="ingredient-stats">
          <div>
            <span>Món ăn</span>
            <strong>{stats.dishCount}</strong>
          </div>
          <div>
            <span>Nguyên liệu</span>
            <strong>{stats.ingredientCount}</strong>
          </div>
          <div>
            <span>Calo trung bình</span>
            <strong>{formatCalories(stats.averageCalories)}</strong>
          </div>
          <div>
            <span>Chi phí trung bình</span>
            <strong>{formatCurrency(stats.averagePrice)}</strong>
          </div>
        </section>

        <section className="ingredient-toolbar">
          <label className="ingredient-search">
            <span>Tìm món</span>
            <input
              type="text"
              placeholder="Nhập tên món ăn"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <label>
            <span>Calo từ</span>
            <input
              type="number"
              placeholder="0"
              value={minCalorieFilter}
              onChange={(event) => setMinCalorieFilter(event.target.value)}
            />
          </label>
          <label>
            <span>Đến</span>
            <input
              type="number"
              placeholder="1000"
              value={maxCalorieFilter}
              onChange={(event) => setMaxCalorieFilter(event.target.value)}
            />
          </label>
          <label>
            <span>Sắp xếp</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="nameAsc">Tên A-Z</option>
              <option value="caloriesDesc">Calo cao trước</option>
              <option value="caloriesAsc">Calo thấp trước</option>
              <option value="priceDesc">Chi phí cao trước</option>
              <option value="priceAsc">Chi phí thấp trước</option>
            </select>
          </label>
        </section>

        {message && <p className="ingredient-message">{message}</p>}

        <section className="ingredient-results-bar">
          <span>{filteredDishes.length} món phù hợp</span>
          <span>Trang {currentPage}/{totalPages}</span>
        </section>

        <section className="dishes-list">
          {currentDishes.map((dish) => (
            <article className="dish-card" key={dish.Fid}>
              <img src={dish.image} alt={dish.name} />
              <div className="dish-card-body">
                <div>
                  <h3>{dish.name}</h3>
                  <p>{dish.description}</p>
                </div>
                <div className="dish-metrics">
                  <span>{formatCalories(dish.calories)}</span>
                  <span>{formatCurrency(dish.price)}</span>
                </div>
                <div className="card-buttons">
                  <button type="button" onClick={() => openDetailModal(dish.Fid)}>Chi tiết</button>
                  <button type="button" onClick={() => sendDishToMakeMeal(dish)}>Gợi ý bữa</button>
                  <button type="button" onClick={() => sendDishToPlan(dish)}>Lập kế hoạch</button>
                  <button type="button" onClick={() => openEditModal(dish)}>Sửa</button>
                  <button type="button" onClick={() => setDishToDeleteId(dish.Fid)}>Xóa</button>
                </div>
              </div>
            </article>
          ))}

          {currentDishes.length === 0 && (
            <div className="ingredient-empty">
              <h3>Không có món phù hợp</h3>
              <p>Thử đổi từ khóa hoặc khoảng calo.</p>
            </div>
          )}
        </section>

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
      </main>

      {isModalOpen && (
        <div className="modal-ingredient">
          <div className="modal-content-ingredient builder-modal">
            <div className="modal-title-row">
              <div>
                <span className="ingredient-eyebrow">{editingDishId ? 'Cập nhật' : 'Tạo món'}</span>
                <h2>{editingDishId ? 'Cập nhật công thức' : 'Thêm món ăn mới'}</h2>
              </div>
              <button className="modal-close-btn" type="button" onClick={closeModal}>x</button>
            </div>

            <div className="builder-grid">
              <section className="builder-form">
                <label>
                  <span>Tên món</span>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cơm gà"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  />
                </label>
                <label>
                  <span>Ảnh món ăn</span>
                  <input
                    type="text"
                    placeholder="Dán URL ảnh"
                    value={formData.image}
                    onChange={(event) => setFormData({ ...formData, image: event.target.value })}
                  />
                </label>
                <label>
                  <span>Mô tả</span>
                  <textarea
                    placeholder="Mô tả khẩu phần, cách ăn hoặc ghi chú"
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  />
                </label>

                <div className="ingredient-picker">
                  <label>
                    <span>Tìm nguyên liệu</span>
                    <input
                      type="text"
                      placeholder="Gõ tên nguyên liệu"
                      value={ingredientSearchTerm}
                      onChange={(event) => setIngredientSearchTerm(event.target.value)}
                    />
                  </label>
                  <div className="ingredient-suggestions">
                    {ingredientSuggestions.map((ingredient) => (
                      <button key={ingredient.id} type="button" onClick={() => addIngredient(ingredient)}>
                        <strong>{ingredient.name}</strong>
                        <span>{formatCurrency(ingredient.price)}/kg</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="builder-summary">
                <div className="builder-total">
                  <span>Tổng mỗi khẩu phần</span>
                  <strong>{formatCalories(selectedTotals.calories)}</strong>
                  <strong>{formatCurrency(selectedTotals.price)}</strong>
                </div>

                <h3>Định lượng nguyên liệu</h3>
                <div className="selected-ingredients-list">
                  {selectedIngredients.map((ingredient) => {
                    const gram = toNumber(ingredient.gram);
                    return (
                      <div className="ingredient-item" key={ingredient.id}>
                        <div>
                          <strong>{ingredient.name}</strong>
                          <span>
                            {formatCalories((gram / 100) * toNumber(ingredient.calories))} - {formatCurrency((gram / 1000) * toNumber(ingredient.price))}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={ingredient.gram}
                          onChange={(event) => updateIngredientGram(ingredient.id, event.target.value)}
                          className="gram-input"
                        />
                        <button
                          className="remove-btn"
                          type="button"
                          onClick={() => setSelectedIngredients((currentIngredients) => currentIngredients.filter((item) => item.id !== ingredient.id))}
                        >
                          Xóa
                        </button>
                      </div>
                    );
                  })}

                  {selectedIngredients.length === 0 && (
                    <p className="builder-empty">Chưa chọn nguyên liệu.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="modal-buttons">
              <button type="button" onClick={saveDish}>{editingDishId ? 'Lưu thay đổi' : 'Thêm món'}</button>
              <button type="button" onClick={closeModal}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {selectedDish && (
        <div className="dish-detail-modal">
          <div className="dish-detail-modal-content">
            <button className="modal-close-btn" type="button" onClick={() => setSelectedDish(null)}>x</button>
            <img src={selectedDish.image} alt={selectedDish.foodName} className="dish-image" />
            <h2 className="dish-title">{selectedDish.foodName}</h2>
            <p className="dish-description">{selectedDish.description}</p>
            <div className="dish-info">
              <p>Chi phí <span>{formatCurrency(selectedDish.foodPrice)}</span></p>
              <p>Calo <span>{formatCalories(selectedDish.foodCalories)}</span></p>
            </div>
            <h3>Nguyên liệu</h3>
            <ul className="ingredient-list">
              {(selectedDish.ingredients || []).map((ingredient) => (
                <li key={ingredient.ingredientId}>
                  <span>{ingredient.ingredientName}</span>
                  <span>{formatGram(ingredient.gram)}</span>
                </li>
              ))}
            </ul>
            <div className="detail-workflow-actions">
              <button type="button" onClick={() => sendDishToMakeMeal(selectedDish)}>Dùng để gợi ý bữa</button>
              <button type="button" onClick={() => sendDishToPlan(selectedDish)}>Đưa vào kế hoạch</button>
            </div>
          </div>
        </div>
      )}

      {dishToDeleteId && (
        <div className="modal-ingredient">
          <div className="modal-content-ingredient confirm-modal">
            <h2>Xóa món ăn?</h2>
            <p>Món bị xóa sẽ không còn xuất hiện trong danh sách chọn mới.</p>
            <div className="modal-buttons">
              <button type="button" onClick={deleteDish}>Xóa món</button>
              <button type="button" onClick={() => setDishToDeleteId(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientForm;
