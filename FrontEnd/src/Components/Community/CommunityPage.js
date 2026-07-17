import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './CommunityPage.css';
import TaskBar from '../TaskBar/TaskBar';
import { formatCalories, formatCurrency } from '../../utils/format';

const API_URL = 'http://localhost:3060';

const CommunityPage = () => {
  const [meals, setMeals] = useState([]);
  const [mealSearch, setMealSearch] = useState('');
  const [selectedMealDetails, setSelectedMealDetails] = useState(null);
  const [reviews, setReviews] = useState({});
  const [newReview, setNewReview] = useState({ username: '', comment: '', rating: 5 });
  const [rankingMode, setRankingMode] = useState('week');

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

  const rankingData = useMemo(() => {
    return meals
      .map((meal) => {
        const reviewCount = (reviews[meal.Fid] || []).length;
        const baseScore = Math.round(Number(meal.foodCalories || 0) + Number(meal.foodPrice || 0) / 100);
        return {
          ...meal,
          weeklyLikes: (baseScore % 97) + reviewCount * 12,
          monthlyLikes: (baseScore % 211) + reviewCount * 35,
        };
      })
      .sort((a, b) => rankingMode === 'week' ? b.weeklyLikes - a.weeklyLikes : b.monthlyLikes - a.monthlyLikes)
      .slice(0, 5);
  }, [meals, rankingMode, reviews]);

  const addReview = (mealId) => {
    if (newReview.comment.trim() === '') return;

    const review = {
      username: newReview.username.trim() || 'Ẩn danh',
      comment: newReview.comment.trim(),
      rating: Math.min(Math.max(Number(newReview.rating) || 5, 1), 5),
      likes: 0,
      dislikes: 0,
      timestamp: Date.now(),
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
    const shareLink = `${window.location.origin}/community?food=${meal.Fid}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareLink);
    }
    alert(`Đã sao chép liên kết: ${shareLink}`);
  };

  const sortedReviews = selectedMealDetails
    ? [...(reviews[selectedMealDetails.Fid] || [])].sort((a, b) => b.likes - a.likes || b.timestamp - a.timestamp)
    : [];

  return (
    <div className="community-page-container">
      <TaskBar />

      <aside className="community-page-sidebar">
        <h2>Cộng đồng món ăn</h2>
        <div className="community-page-search-bar">
          <input
            type="text"
            placeholder="Tìm món ăn..."
            value={mealSearch}
            onChange={(event) => setMealSearch(event.target.value)}
          />
          <button className="community-page-btn" type="button">Tìm</button>
        </div>
      </aside>

      <main className="community-page-main">
        <h2>Danh sách món ăn</h2>
        <div className="community-page-cards">
          {filteredMeals.map((meal) => (
            <div key={meal.Fid} className="community-page-card" onClick={() => setSelectedMealDetails(meal)}>
              <img src={meal.image} alt={meal.foodName} className="community-page-image" />
              <h3>{meal.foodName}</h3>
              <p>{formatCurrency(meal.foodPrice)} · {formatCalories(meal.foodCalories)}</p>
              <button className="community-page-btn" type="button" onClick={(event) => { event.stopPropagation(); shareMeal(meal); }}>
                Chia sẻ
              </button>
            </div>
          ))}
        </div>
      </main>

      <section className="community-page-rankings">
        <h3>Bảng xếp hạng</h3>
        <div className="ranking-tabs">
          <button className="ranking-tab-btn" type="button" onClick={() => setRankingMode('week')}>Tuần</button>
          <button className="ranking-tab-btn" type="button" onClick={() => setRankingMode('month')}>Tháng</button>
        </div>
        <div className="ranking-list">
          {rankingData.map((meal, index) => (
            <div key={meal.Fid} className="ranking-item">
              <span>{index + 1}. {meal.foodName}</span>
              <span>{rankingMode === 'week' ? meal.weeklyLikes : meal.monthlyLikes} lượt thích</span>
            </div>
          ))}
        </div>
      </section>

      {selectedMealDetails && (
        <div className="community-page-popup-overlay" onClick={() => setSelectedMealDetails(null)}>
          <div className="community-page-popup-content" onClick={(event) => event.stopPropagation()}>
            <button className="community-page-popup-close" type="button" onClick={() => setSelectedMealDetails(null)}>×</button>
            <h2 className="title-detail-community">Chi tiết món ăn</h2>
            <div className="meal-details-community">
              <img src={selectedMealDetails.image} alt={selectedMealDetails.foodName} className="popup-image-community" />
              <div className="meal-info-community">
                <h3>{selectedMealDetails.foodName}</h3>
                <p><strong>Mô tả:</strong> {selectedMealDetails.description}</p>
                <p><strong>Calo:</strong> {formatCalories(selectedMealDetails.foodCalories)}</p>
                <p><strong>Giá:</strong> {formatCurrency(selectedMealDetails.foodPrice)}</p>
              </div>

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

              <div className="reviews-section">
                <h4>Đánh giá</h4>
                <div className="reviews-container">
                  <ul className="reviews-list">
                    {sortedReviews.map((review, index) => (
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
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
