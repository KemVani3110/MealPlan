import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './MakeMeal.css';
import TaskBar from '../TaskBar/TaskBar';
import Snowfall from '../Snowfall/SnowFall';
import { formatCalories, formatCalorieDifference, formatCurrency, formatGram } from '../../utils/format';

const API_URL = 'http://localhost:3060';
const adultMealCalories = 667;
const childMealCalories = 400;

const MakeMeal = () => {
  const [meals, setMeals] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [favoriteMeals, setFavoriteMeals] = useState([]);
  const [reviews, setReviews] = useState({});
  const [peopleCount, setPeopleCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [hasChildren, setHasChildren] = useState(false);
  const [mealSearch, setMealSearch] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');
  const [selectedMealDetails, setSelectedMealDetails] = useState(null);
  const [newReview, setNewReview] = useState({ username: '', comment: '', rating: 5 });

  useEffect(() => {
    axios.get(`${API_URL}/food-items`)
      .then((response) => setMeals(response.data || []))
      .catch((error) => console.error('Error fetching meals:', error));
  }, []);

  const filteredMeals = useMemo(() => {
    const keyword = mealSearch.trim().toLowerCase();
    if (!keyword) return meals;
    return meals.filter((meal) => meal.foodName.toLowerCase().includes(keyword));
  }, [mealSearch, meals]);

  const visibleSelectedMeals = useMemo(() => {
    const keyword = selectedSearch.trim().toLowerCase();
    if (!keyword) return selectedMeals;
    return selectedMeals.filter((meal) => meal.foodName.toLowerCase().includes(keyword));
  }, [selectedSearch, selectedMeals]);

  const totalCalories = selectedMeals.reduce((total, meal) => total + Number(meal.foodCalories || 0) * meal.quantity, 0);
  const totalCost = selectedMeals.reduce((total, meal) => total + Number(meal.foodPrice || 0) * meal.quantity, 0);
  const totalRequiredCalories = peopleCount * adultMealCalories + childrenCount * childMealCalories;
  const calorieDifference = totalCalories - totalRequiredCalories;

  const addMeal = (meal) => {
    setSelectedMeals((currentMeals) => {
      const existingMeal = currentMeals.find((item) => item.Fid === meal.Fid);
      if (existingMeal) {
        return currentMeals.map((item) => item.Fid === meal.Fid ? { ...item, quantity: item.quantity + 1 } : item);
      }

      return [...currentMeals, { ...meal, quantity: 1 }];
    });
  };

  const removeMeal = (mealId) => {
    setSelectedMeals((currentMeals) => currentMeals.filter((meal) => meal.Fid !== mealId));
  };

  const updateQuantity = (mealId, increment) => {
    setSelectedMeals((currentMeals) =>
      currentMeals.map((meal) =>
        meal.Fid === mealId ? { ...meal, quantity: Math.max(1, meal.quantity + increment) } : meal
      )
    );
  };

  const toggleFavorite = (meal) => {
    setFavoriteMeals((currentFavorites) => {
      if (currentFavorites.some((favorite) => favorite.Fid === meal.Fid)) {
        return currentFavorites.filter((favorite) => favorite.Fid !== meal.Fid);
      }
      return [...currentFavorites, meal];
    });
  };

  const addReview = (mealId) => {
    if (newReview.comment.trim() === '') return;

    const review = {
      username: newReview.username.trim() || 'Ẩn danh',
      comment: newReview.comment.trim(),
      rating: Math.min(Math.max(Number(newReview.rating) || 5, 1), 5),
      likes: 0,
      dislikes: 0,
    };

    setReviews((currentReviews) => ({
      ...currentReviews,
      [mealId]: currentReviews[mealId] ? [...currentReviews[mealId], review] : [review],
    }));
    setNewReview({ username: '', comment: '', rating: 5 });
  };

  const updateReviewReaction = (mealId, reviewIndex, key) => {
    setReviews((currentReviews) => {
      const mealReviews = [...(currentReviews[mealId] || [])];
      mealReviews[reviewIndex] = { ...mealReviews[reviewIndex], [key]: mealReviews[reviewIndex][key] + 1 };
      return { ...currentReviews, [mealId]: mealReviews };
    });
  };

  const shareMeal = (meal) => {
    const shareLink = `${window.location.origin}/makemeal?food=${meal.Fid}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareLink);
    }
    alert(`Đã sao chép liên kết: ${shareLink}`);
  };

  const handleChildrenCountChange = (count) => {
    setChildrenCount(Math.max(0, Number(count) || 0));
  };

  return (
    <div className="meal-prep-container">
      <TaskBar />
      <Snowfall />

      <aside className="meal-prep-sidebar">
        <h2>Món đã chọn</h2>
        <div className="meal-prep-search-bar">
          <input
            type="text"
            placeholder="Tìm trong món đã chọn..."
            value={selectedSearch}
            onChange={(event) => setSelectedSearch(event.target.value)}
          />
          <button className="meal-prep-btn" type="button">Tìm</button>
        </div>

        {selectedMeals.length > 0 ? (
          <div className="meal-prep-selected-list">
            {visibleSelectedMeals.map((meal) => (
              <div key={meal.Fid} className="meal-prep-selected-item">
                <div>
                  <h4>{meal.foodName}</h4>
                  <p>{formatCalories(meal.foodCalories || 0)} / phần</p>
                </div>
                <div className="meal-prep-quantity-control">
                  <button className="meal-prep-btn" type="button" onClick={() => updateQuantity(meal.Fid, -1)}>-</button>
                  <span>{meal.quantity}</span>
                  <button className="meal-prep-btn" type="button" onClick={() => updateQuantity(meal.Fid, 1)}>+</button>
                </div>
                <button className="meal-prep-remove-btn" type="button" onClick={() => removeMeal(meal.Fid)}>Xóa</button>
              </div>
            ))}
          </div>
        ) : (
          <p>Chưa có món ăn nào được chọn.</p>
        )}

        <div className="meal-prep-summary">
          <p>Tổng calo: <span className="meal-prep-total">{formatCalories(totalCalories)}</span></p>
          <p>Tổng chi phí: <span className="meal-prep-total">{formatCurrency(totalCost)}</span></p>
          <p>Nhu cầu calo: <span className="meal-prep-total">{formatCalories(totalRequiredCalories)}</span></p>
          <p>Chênh lệch: <span className={calorieDifference >= 0 ? 'calorie-excess' : 'calorie-deficit'}>{formatCalorieDifference(calorieDifference)}</span></p>
        </div>
      </aside>

      <main className="meal-prep-main-section">
        <section className="meal-prep-form-section">
          <h2>Thông tin bữa ăn</h2>
          <label>Người lớn</label>
          <div className="meal-prep-quantity-control">
            <button className="meal-prep-btn" type="button" onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}>-</button>
            <input
              type="number"
              min="1"
              value={peopleCount}
              onChange={(event) => setPeopleCount(Math.max(1, Number(event.target.value) || 1))}
            />
            <button className="meal-prep-btn" type="button" onClick={() => setPeopleCount(peopleCount + 1)}>+</button>
          </div>

          <label className="meal-prep-checkbox">
            <input
              type="checkbox"
              checked={hasChildren}
              onChange={() => {
                if (hasChildren) setChildrenCount(0);
                setHasChildren(!hasChildren);
              }}
            />
            Có trẻ em
          </label>

          {hasChildren && (
            <div className="meal-prep-quantity-control">
              <label>Số trẻ em</label>
              <button className="meal-prep-btn" type="button" onClick={() => handleChildrenCountChange(childrenCount - 1)}>-</button>
              <input
                type="number"
                min="0"
                value={childrenCount}
                onChange={(event) => handleChildrenCountChange(event.target.value)}
              />
              <button className="meal-prep-btn" type="button" onClick={() => handleChildrenCountChange(childrenCount + 1)}>+</button>
            </div>
          )}
        </section>

        <section className="meal-prep-gallery">
          <div className="meal-prep-search">
            <input
              type="text"
              placeholder="Tìm món ăn..."
              value={mealSearch}
              onChange={(event) => setMealSearch(event.target.value)}
            />
            <button className="meal-prep-btn" type="button">Tìm</button>
          </div>

          <h2>Danh sách món ăn</h2>
          <div className="meal-prep-cards">
            {filteredMeals.map((meal) => (
              <div key={meal.Fid} className="meal-prep-card" onClick={() => setSelectedMealDetails(meal)}>
                <img src={meal.image} alt={meal.foodName} className="meal-prep-image" />
                <h3>{meal.foodName}</h3>
                <p>{formatCurrency(meal.foodPrice)}</p>
                <p>{formatCalories(meal.foodCalories)}</p>
                <button className="meal-prep-btn" type="button" onClick={(event) => { event.stopPropagation(); addMeal(meal); }}>Chọn</button>
                <button className="meal-prep-btn subtle" type="button" onClick={(event) => { event.stopPropagation(); toggleFavorite(meal); }}>
                  {favoriteMeals.some((favorite) => favorite.Fid === meal.Fid) ? 'Đã thích' : 'Thích'}
                </button>
                <button className="meal-prep-btn subtle" type="button" onClick={(event) => { event.stopPropagation(); shareMeal(meal); }}>
                  Chia sẻ
                </button>
              </div>
            ))}
          </div>
        </section>

        {selectedMealDetails && (
          <div className="meal-prep-popup-overlay" onClick={() => setSelectedMealDetails(null)}>
            <div className="meal-prep-popup-content" onClick={(event) => event.stopPropagation()}>
              <button className="meal-prep-popup-close" type="button" onClick={() => setSelectedMealDetails(null)}>×</button>
              <h2 className="title-detail-makemeal">Chi tiết món ăn</h2>
              <div className="meal-details-makemeal">
                <img src={selectedMealDetails.image} alt={selectedMealDetails.foodName} className="popup-image-makemeal" />
                <div className="meal-info-makemeal">
                  <h3 className="meal-h3">{selectedMealDetails.foodName}</h3>
                  <p className="meal-p"><strong>Mô tả:</strong> {selectedMealDetails.description}</p>
                  <p className="meal-p"><strong>Calo:</strong> {formatCalories(selectedMealDetails.foodCalories)}</p>
                  <p className="meal-p"><strong>Giá:</strong> {formatCurrency(selectedMealDetails.foodPrice)}</p>
                  <div className="meal-actions-makemeal">
                    <button className="icon-btn-makemeal" type="button" onClick={() => toggleFavorite(selectedMealDetails)}>
                      {favoriteMeals.some((favorite) => favorite.Fid === selectedMealDetails.Fid) ? 'Đã thích' : 'Thích'}
                    </button>
                    <button className="icon-btn-makemeal" type="button" onClick={() => shareMeal(selectedMealDetails)}>Chia sẻ</button>
                  </div>
                </div>
              </div>

              <div className="ingredients-reviews">
                <div className="ingredients-section">
                  <h4>Nguyên liệu</h4>
                  <ul>
                    {(selectedMealDetails.ingredients || []).map((ingredient) => (
                      <li key={ingredient.ingredientId}>
                        {ingredient.ingredientName} - {formatGram(ingredient.gram)}
                      </li>
                    ))}
                  </ul>
                  <div className="review-form-container">
                    <h5>Viết đánh giá của bạn</h5>
                    <input
                      type="text"
                      placeholder="Tên của bạn"
                      value={newReview.username}
                      onChange={(event) => setNewReview({ ...newReview, username: event.target.value })}
                      className="review-input"
                    />
                    <textarea
                      placeholder="Viết đánh giá của bạn..."
                      rows="3"
                      value={newReview.comment}
                      onChange={(event) => setNewReview({ ...newReview, comment: event.target.value })}
                      className="review-textarea"
                    />
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={newReview.rating}
                      onChange={(event) => setNewReview({ ...newReview, rating: event.target.value })}
                      className="review-rating-input"
                    />
                    <button className="review-submit-btn" type="button" onClick={() => addReview(selectedMealDetails.Fid)}>Gửi</button>
                  </div>
                </div>

                <div className="reviews-section">
                  <h4>Đánh giá</h4>
                  <ul className="reviews-list">
                    {(reviews[selectedMealDetails.Fid] || []).map((review, index) => (
                      <li key={`${review.username}-${index}`} className="review-item">
                        <div className="review-content">
                          <div className="review-header">
                            <strong>{review.username}</strong>
                            <span className="review-rating">{review.rating}/5</span>
                          </div>
                          <p className="review-comment">{review.comment}</p>
                          <div className="review-actions">
                            <button className="review-action-btn" type="button" onClick={() => updateReviewReaction(selectedMealDetails.Fid, index, 'likes')}>Thích {review.likes}</button>
                            <button className="review-action-btn" type="button" onClick={() => updateReviewReaction(selectedMealDetails.Fid, index, 'dislikes')}>Không thích {review.dislikes}</button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MakeMeal;
