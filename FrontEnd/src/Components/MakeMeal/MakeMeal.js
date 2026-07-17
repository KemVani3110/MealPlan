import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './MakeMeal.css';
import TaskBar from '../TaskBar/TaskBar';
import { formatCalories, formatCalorieDifference, formatCurrency, formatGram, toNumber } from '../../utils/format';
import { createMealDraft, saveMealWorkflowDraft } from '../../utils/mealWorkflow';

const API_URL = 'http://localhost:3060';
const adultMealCalories = 667;
const childMealCalories = 400;
const recommendationModes = {
  balanced: 'Cân bằng calo và chi phí',
  economy: 'Tiết kiệm chi phí',
  light: 'Nhẹ bụng, ít dư calo',
};

const scoreMealPlan = ({ calories, cost, servings, targetCalories, budget, expectedServings, mode }) => {
  const safeTarget = Math.max(targetCalories, 1);
  const safeBudget = Math.max(budget, 1);
  const calorieGap = Math.abs(calories - targetCalories) / safeTarget;
  const budgetOver = Math.max(cost - budget, 0) / safeBudget;
  const servingGap = Math.abs(servings - expectedServings) / Math.max(expectedServings, 1);
  const overCalories = Math.max(calories - targetCalories, 0) / safeTarget;
  const budgetUsed = cost / safeBudget;

  if (mode === 'economy') {
    return calorieGap * 45 + budgetOver * 120 + budgetUsed * 35 + servingGap * 25;
  }

  if (mode === 'light') {
    return calorieGap * 55 + overCalories * 80 + budgetOver * 80 + servingGap * 25;
  }

  return calorieGap * 70 + budgetOver * 100 + servingGap * 28 + budgetUsed * 12;
};

const MakeMeal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [meals, setMeals] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [favoriteMeals, setFavoriteMeals] = useState([]);
  const [reviews, setReviews] = useState({});
  const [peopleCount, setPeopleCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [budget, setBudget] = useState(150000);
  const [mealSearch, setMealSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('fit');
  const [recommendationMode, setRecommendationMode] = useState('balanced');
  const [selectedMealDetails, setSelectedMealDetails] = useState(null);
  const [newReview, setNewReview] = useState({ username: '', comment: '', rating: 5 });

  useEffect(() => {
    axios.get(`${API_URL}/food-items`)
      .then((response) => setMeals(response.data || []))
      .catch((error) => console.error('Error fetching meals:', error));
  }, []);

  useEffect(() => {
    const foodIdFromQuery = Number(searchParams.get('food'));
    if (!foodIdFromQuery || meals.length === 0) return;

    const mealFromQuery = meals.find((meal) => meal.Fid === foodIdFromQuery);
    if (mealFromQuery) {
      setSelectedMeals((currentMeals) => {
        if (currentMeals.some((item) => item.Fid === mealFromQuery.Fid)) return currentMeals;
        return [...currentMeals, { ...mealFromQuery, quantity: 1 }];
      });
      setSelectedMealDetails(mealFromQuery);
    }
  }, [meals, searchParams]);

  const totalCalories = selectedMeals.reduce((total, meal) => total + toNumber(meal.foodCalories) * meal.quantity, 0);
  const totalCost = selectedMeals.reduce((total, meal) => total + toNumber(meal.foodPrice) * meal.quantity, 0);
  const totalServings = selectedMeals.reduce((total, meal) => total + meal.quantity, 0);
  const totalRequiredCalories = peopleCount * adultMealCalories + childrenCount * childMealCalories;
  const calorieDifference = totalCalories - totalRequiredCalories;
  const calorieRatio = totalRequiredCalories ? Math.min((totalCalories / totalRequiredCalories) * 100, 140) : 0;
  const costRatio = budget ? Math.min((totalCost / budget) * 100, 140) : 0;
  const remainingBudget = budget - totalCost;

  const filteredMeals = useMemo(() => {
    const keyword = mealSearch.trim().toLowerCase();

    return meals
      .filter((meal) => meal.foodName.toLowerCase().includes(keyword))
      .filter((meal) => catalogFilter === 'favorites' ? favoriteMeals.some((favorite) => favorite.Fid === meal.Fid) : true)
      .sort((a, b) => {
        if (sortOrder === 'priceAsc') return toNumber(a.foodPrice) - toNumber(b.foodPrice);
        if (sortOrder === 'caloriesDesc') return toNumber(b.foodCalories) - toNumber(a.foodCalories);
        if (sortOrder === 'nameAsc') return a.foodName.localeCompare(b.foodName);
        return Math.abs(toNumber(a.foodCalories) - adultMealCalories) - Math.abs(toNumber(b.foodCalories) - adultMealCalories);
      });
  }, [catalogFilter, favoriteMeals, mealSearch, meals, sortOrder]);

  const recommendedPlan = useMemo(() => {
    const candidates = meals
      .filter((meal) => toNumber(meal.foodCalories) > 0 && toNumber(meal.foodPrice) >= 0)
      .sort((a, b) => {
        const aCalorieFit = Math.abs(toNumber(a.foodCalories) - adultMealCalories);
        const bCalorieFit = Math.abs(toNumber(b.foodCalories) - adultMealCalories);
        const aBudgetFit = budget ? toNumber(a.foodPrice) / Math.max(budget, 1) : 0;
        const bBudgetFit = budget ? toNumber(b.foodPrice) / Math.max(budget, 1) : 0;
        return (aCalorieFit + aBudgetFit * 80) - (bCalorieFit + bBudgetFit * 80);
      })
      .slice(0, 14);
    const expectedServings = Math.max(1, peopleCount + childrenCount);
    const maxServings = Math.min(Math.max(expectedServings + 2, 2), 8);
    let bestPlan = null;

    const visit = (index, selected, servings, calories, cost) => {
      if (servings > maxServings) return;

      if (index === candidates.length) {
        if (servings === 0) return;
        const score = scoreMealPlan({
          calories,
          cost,
          servings,
          targetCalories: totalRequiredCalories,
          budget,
          expectedServings,
          mode: recommendationMode,
        });

        if (!bestPlan || score < bestPlan.score) {
          bestPlan = { selected, servings, calories, cost, score };
        }
        return;
      }

      const meal = candidates[index];
      visit(index + 1, selected, servings, calories, cost);

      for (let quantity = 1; quantity <= maxServings - servings; quantity += 1) {
        visit(
          index + 1,
          [...selected, { ...meal, quantity }],
          servings + quantity,
          calories + toNumber(meal.foodCalories) * quantity,
          cost + toNumber(meal.foodPrice) * quantity
        );
      }
    };

    visit(0, [], 0, 0, 0);

    if (!bestPlan) {
      return {
        selected: [],
        calories: 0,
        cost: 0,
        servings: 0,
        reasons: ['Chưa có dữ liệu món ăn để tạo gợi ý.'],
      };
    }

    const calorieGap = bestPlan.calories - totalRequiredCalories;
    const budgetGap = budget - bestPlan.cost;
    const reasons = [
      `${bestPlan.servings} phần cho ${expectedServings} người dùng bữa.`,
      Math.abs(calorieGap) <= 80
        ? 'Calo gần đúng mục tiêu của bữa ăn.'
        : calorieGap > 0
          ? `Dư ${formatCalories(calorieGap)}, phù hợp khi cần bữa no hơn.`
          : `Thiếu ${formatCalories(Math.abs(calorieGap))}, nên thêm món nếu cần no hơn.`,
      budgetGap >= 0
        ? `Vẫn còn ${formatCurrency(budgetGap)} trong ngân sách.`
        : `Vượt ${formatCurrency(Math.abs(budgetGap))} so với ngân sách.`,
    ];

    return { ...bestPlan, reasons };
  }, [budget, childrenCount, meals, peopleCount, recommendationMode, totalRequiredCalories]);

  const addMeal = (meal) => {
    setSelectedMeals((currentMeals) => {
      const existingMeal = currentMeals.find((item) => item.Fid === meal.Fid);
      if (existingMeal) {
        return currentMeals.map((item) => item.Fid === meal.Fid ? { ...item, quantity: item.quantity + 1 } : item);
      }

      return [...currentMeals, { ...meal, quantity: 1 }];
    });
  };

  const applyRecommendedPlan = () => {
    setSelectedMeals(recommendedPlan.selected);
  };

  const sendSelectedMealsToPlan = () => {
    const mealsToSend = selectedMeals.length > 0 ? selectedMeals : recommendedPlan.selected;
    if (mealsToSend.length === 0) return;

    saveMealWorkflowDraft(createMealDraft({
      source: 'make-meal',
      meals: mealsToSend,
      peopleCount,
      childrenCount,
      budget,
      note: selectedMeals.length > 0 ? 'Combo người dùng chọn từ trang gợi ý món.' : 'Combo đề xuất tự động từ trang gợi ý món.',
    }));

    navigate('/planmeal?draft=make-meal');
  };

  const openIngredientPage = (meal) => {
    navigate(`/ingredient?dish=${meal.Fid}`);
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

  const changeAdults = (value) => {
    setPeopleCount(Math.max(1, toNumber(value, 1)));
  };

  const changeChildren = (value) => {
    setChildrenCount(Math.max(0, toNumber(value)));
  };

  const calorieTone = Math.abs(calorieDifference) <= 80 ? 'balanced' : calorieDifference > 0 ? 'over' : 'under';
  const budgetTone = remainingBudget >= 0 ? 'balanced' : 'over';

  return (
    <div className="make-meal-page">
      <TaskBar />

      <main className="make-meal-shell">
        <section className="make-meal-header">
          <div>
            <span className="make-meal-eyebrow">Gợi ý bữa ăn</span>
            <h1>Chọn món theo khẩu phần, calo và ngân sách</h1>
            <p>Mỗi món được tính theo giá và calo một phần ăn, sau đó cộng theo số lượng đã chọn.</p>
          </div>
          <div className="make-meal-header-total">
            <span>Tạm tính</span>
            <strong>{formatCurrency(totalCost)}</strong>
            <button type="button" onClick={sendSelectedMealsToPlan}>
              Đưa vào kế hoạch
            </button>
          </div>
        </section>

        <section className="make-meal-layout">
          <aside className="meal-planner-panel">
            <section className="planner-section">
              <h2>Thông tin bữa ăn</h2>
              <div className="planner-grid">
                <label>
                  <span>Người lớn</span>
                  <div className="meal-stepper">
                    <button type="button" onClick={() => changeAdults(peopleCount - 1)}>-</button>
                    <input type="number" min="1" value={peopleCount} onChange={(event) => changeAdults(event.target.value)} />
                    <button type="button" onClick={() => changeAdults(peopleCount + 1)}>+</button>
                  </div>
                </label>
                <label>
                  <span>Trẻ em</span>
                  <div className="meal-stepper">
                    <button type="button" onClick={() => changeChildren(childrenCount - 1)}>-</button>
                    <input type="number" min="0" value={childrenCount} onChange={(event) => changeChildren(event.target.value)} />
                    <button type="button" onClick={() => changeChildren(childrenCount + 1)}>+</button>
                  </div>
                </label>
              </div>
              <label className="budget-input">
                <span>Ngân sách bữa ăn</span>
                <input type="number" min="0" value={budget} onChange={(event) => setBudget(Math.max(0, toNumber(event.target.value)))} />
              </label>
              <label className="budget-input">
                <span>Mục tiêu gợi ý</span>
                <select value={recommendationMode} onChange={(event) => setRecommendationMode(event.target.value)}>
                  {Object.entries(recommendationModes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </section>

            <section className="planner-section">
              <h2>Tổng quan</h2>
              <div className="summary-card">
                <div>
                  <span>Nhu cầu calo</span>
                  <strong>{formatCalories(totalRequiredCalories)}</strong>
                </div>
                <div>
                  <span>Đã chọn</span>
                  <strong>{formatCalories(totalCalories)}</strong>
                </div>
                <div>
                  <span>Chênh lệch</span>
                  <strong className={`tone-${calorieTone}`}>{formatCalorieDifference(calorieDifference)}</strong>
                </div>
              </div>
              <div className="progress-block">
                <div className="progress-label">
                  <span>Calo</span>
                  <strong>{Math.round(calorieRatio)}%</strong>
                </div>
                <div className="progress-track">
                  <span className={`progress-fill tone-${calorieTone}`} style={{ width: `${Math.min(calorieRatio, 100)}%` }} />
                </div>
              </div>
              <div className="progress-block">
                <div className="progress-label">
                  <span>Ngân sách</span>
                  <strong className={`tone-${budgetTone}`}>{remainingBudget >= 0 ? `Còn ${formatCurrency(remainingBudget)}` : `Vượt ${formatCurrency(Math.abs(remainingBudget))}`}</strong>
                </div>
                <div className="progress-track">
                  <span className={`progress-fill tone-${budgetTone}`} style={{ width: `${Math.min(costRatio, 100)}%` }} />
                </div>
              </div>
            </section>

            <section className="planner-section recommendation-section">
              <div className="section-title-row">
                <h2>Bữa đề xuất</h2>
                <span>{recommendationModes[recommendationMode]}</span>
              </div>
              <div className="recommendation-summary">
                <div>
                  <span>Calo</span>
                  <strong>{formatCalories(recommendedPlan.calories)}</strong>
                </div>
                <div>
                  <span>Chi phí</span>
                  <strong>{formatCurrency(recommendedPlan.cost)}</strong>
                </div>
              </div>

              <div className="recommended-meals">
                {recommendedPlan.selected.map((meal) => (
                  <div key={meal.Fid}>
                    <span>{meal.foodName}</span>
                    <strong>x{meal.quantity}</strong>
                  </div>
                ))}
              </div>

              <ul className="recommendation-reasons">
                {recommendedPlan.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              <button
                className="recommendation-apply"
                type="button"
                onClick={applyRecommendedPlan}
                disabled={recommendedPlan.selected.length === 0}
              >
                Áp dụng bữa đề xuất
              </button>
            </section>

            <section className="planner-section selected-section">
              <div className="section-title-row">
                <h2>Món đã chọn</h2>
                <span>{totalServings} phần</span>
              </div>
              <div className="selected-meal-list">
                {selectedMeals.map((meal) => (
                  <article className="selected-meal-item" key={meal.Fid}>
                    <img src={meal.image} alt={meal.foodName} />
                    <div>
                      <h3>{meal.foodName}</h3>
                      <p>{formatCalories(toNumber(meal.foodCalories) * meal.quantity)} - {formatCurrency(toNumber(meal.foodPrice) * meal.quantity)}</p>
                      <div className="meal-stepper compact">
                        <button type="button" onClick={() => updateQuantity(meal.Fid, -1)}>-</button>
                        <span>{meal.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(meal.Fid, 1)}>+</button>
                      </div>
                    </div>
                    <button className="meal-remove-btn" type="button" onClick={() => removeMeal(meal.Fid)}>Xóa</button>
                  </article>
                ))}

                {selectedMeals.length === 0 && (
                  <p className="empty-selected">Chưa có món nào trong bữa ăn.</p>
                )}
              </div>
            </section>
          </aside>

          <section className="meal-catalog-panel">
            <div className="catalog-toolbar">
              <label className="catalog-search">
                <span>Tìm món</span>
                <input
                  type="text"
                  placeholder="Nhập tên món ăn"
                  value={mealSearch}
                  onChange={(event) => setMealSearch(event.target.value)}
                />
              </label>
              <label>
                <span>Hiển thị</span>
                <select value={catalogFilter} onChange={(event) => setCatalogFilter(event.target.value)}>
                  <option value="all">Tất cả món</option>
                  <option value="favorites">Món yêu thích</option>
                </select>
              </label>
              <label>
                <span>Sắp xếp</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="fit">Gần nhu cầu người lớn</option>
                  <option value="priceAsc">Chi phí thấp trước</option>
                  <option value="caloriesDesc">Calo cao trước</option>
                  <option value="nameAsc">Tên A-Z</option>
                </select>
              </label>
            </div>

            <div className="catalog-heading">
              <h2>Danh sách món ăn</h2>
              <span>{filteredMeals.length} món</span>
            </div>

            <div className="meal-prep-cards">
              {filteredMeals.map((meal) => {
                const isFavorite = favoriteMeals.some((favorite) => favorite.Fid === meal.Fid);
                return (
                  <article key={meal.Fid} className="meal-prep-card">
                    <button className={`favorite-toggle ${isFavorite ? 'active' : ''}`} type="button" onClick={() => toggleFavorite(meal)}>
                      {isFavorite ? 'Đã thích' : 'Thích'}
                    </button>
                    <img src={meal.image} alt={meal.foodName} className="meal-prep-image" onClick={() => setSelectedMealDetails(meal)} />
                    <div className="meal-card-body">
                      <h3>{meal.foodName}</h3>
                      <p>{meal.description}</p>
                      <div className="meal-card-metrics">
                        <span>{formatCalories(meal.foodCalories)}</span>
                        <span>{formatCurrency(meal.foodPrice)}</span>
                      </div>
                      <div className="meal-card-actions">
                        <button className="meal-prep-btn" type="button" onClick={() => addMeal(meal)}>Thêm vào bữa</button>
                        <button className="meal-prep-btn subtle" type="button" onClick={() => setSelectedMealDetails(meal)}>Chi tiết</button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredMeals.length === 0 && (
                <div className="catalog-empty">
                  <h3>Không tìm thấy món phù hợp</h3>
                  <p>Thử đổi từ khóa hoặc bộ lọc hiển thị.</p>
                </div>
              )}
            </div>
          </section>
        </section>

        {selectedMealDetails && (
          <div className="meal-prep-popup-overlay" onClick={() => setSelectedMealDetails(null)}>
            <div className="meal-prep-popup-content" onClick={(event) => event.stopPropagation()}>
              <button className="meal-prep-popup-close" type="button" onClick={() => setSelectedMealDetails(null)}>x</button>

              <div className="meal-details-makemeal">
                <img src={selectedMealDetails.image} alt={selectedMealDetails.foodName} className="popup-image-makemeal" />
                <div className="meal-info-makemeal">
                  <span className="make-meal-eyebrow">Chi tiết món</span>
                  <h2>{selectedMealDetails.foodName}</h2>
                  <p>{selectedMealDetails.description}</p>
                  <div className="detail-metrics">
                    <span>{formatCalories(selectedMealDetails.foodCalories)}</span>
                    <span>{formatCurrency(selectedMealDetails.foodPrice)}</span>
                  </div>
                  <div className="meal-actions-makemeal">
                    <button className="meal-prep-btn" type="button" onClick={() => addMeal(selectedMealDetails)}>Thêm vào bữa</button>
                    <button className="meal-prep-btn subtle" type="button" onClick={() => openIngredientPage(selectedMealDetails)}>Xem công thức</button>
                    <button className="meal-prep-btn subtle" type="button" onClick={() => shareMeal(selectedMealDetails)}>Chia sẻ</button>
                  </div>
                </div>
              </div>

              <div className="ingredients-reviews">
                <section className="ingredients-section">
                  <h3>Nguyên liệu</h3>
                  <ul>
                    {(selectedMealDetails.ingredients || []).map((ingredient) => (
                      <li key={ingredient.ingredientId}>
                        <span>{ingredient.ingredientName}</span>
                        <span>{formatGram(ingredient.gram)}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="reviews-section">
                  <div className="review-form-container">
                    <h3>Đánh giá món ăn</h3>
                    <input
                      type="text"
                      placeholder="Tên của bạn"
                      value={newReview.username}
                      onChange={(event) => setNewReview({ ...newReview, username: event.target.value })}
                      className="review-input"
                    />
                    <textarea
                      placeholder="Nhận xét"
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
                    <button className="review-submit-btn" type="button" onClick={() => addReview(selectedMealDetails.Fid)}>Gửi đánh giá</button>
                  </div>

                  <ul className="reviews-list">
                    {(reviews[selectedMealDetails.Fid] || []).map((review, index) => (
                      <li key={`${review.username}-${index}`} className="review-item">
                        <div className="review-header">
                          <strong>{review.username}</strong>
                          <span>{review.rating}/5</span>
                        </div>
                        <p>{review.comment}</p>
                        <div className="review-actions">
                          <button type="button" onClick={() => updateReviewReaction(selectedMealDetails.Fid, index, 'likes')}>Thích {review.likes}</button>
                          <button type="button" onClick={() => updateReviewReaction(selectedMealDetails.Fid, index, 'dislikes')}>Không thích {review.dislikes}</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MakeMeal;
