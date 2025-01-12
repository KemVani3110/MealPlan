import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CommunityPage.css';
import TaskBar from '../TaskBar/TaskBar';
import Snowfall from '../Snowfall/SnowFall';

const CommunityPage = () => {
    const [meals, setMeals] = useState([]);
    const [filteredMeals, setFilteredMeals] = useState([]);
    const [mealSearch, setMealSearch] = useState('');
    const [selectedMealDetails, setSelectedMealDetails] = useState(null);
    const [reviews, setReviews] = useState({});
    const [newReview, setNewReview] = useState({ username: '', avatar: '', comment: '', rating: 0 });

    const [rankingData, setRankingData] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:3060/food-items') // API endpoint for meals
            .then(response => {
                setMeals(response.data);
                setFilteredMeals(response.data);
            })
            .catch(error => console.error('Error fetching meals:', error));

        generateRandomRankings(); // Generate random rankings
    }, []);

    const generateRandomRankings = () => {
        const randomRankings = meals.map(meal => ({
            ...meal,
            weeklyLikes: Math.floor(Math.random() * 1000),
            monthlyLikes: Math.floor(Math.random() * 5000)
        }));

        setRankingData(randomRankings);
    };

    const handleMealSearch = (search) => {
        setMealSearch(search);
        setFilteredMeals(meals.filter(meal => meal.foodName.toLowerCase().includes(search.toLowerCase())));
    };

    const handleMealDetails = (meal) => {
        setSelectedMealDetails(meal);
    };

    const closeMealDetails = () => {
        setSelectedMealDetails(null);
    };

    const addReview = (mealId) => {
        if (newReview.comment.trim() === '') return;

        const review = {
            username: newReview.username || 'Ẩn danh',
            avatar: newReview.avatar || 'https://i.pinimg.com/736x/e9/36/ab/e936ab240156c33be7974c2c36188bdf.jpg',
            comment: newReview.comment,
            rating: newReview.rating,
            likes: 0,
            dislikes: 0,
            timestamp: new Date().getTime()
        };

        setReviews({
            ...reviews,
            [mealId]: reviews[mealId] ? [...reviews[mealId], review] : [review],
        });

        setNewReview({ username: '', avatar: '', comment: '', rating: 0 });
    };

    const handleLikeReview = (mealId, reviewIndex) => {
        const mealReviews = reviews[mealId] || [];
        mealReviews[reviewIndex].likes += 1;
        setReviews({ ...reviews, [mealId]: [...mealReviews] });
    };

    const handleDislikeReview = (mealId, reviewIndex) => {
        const mealReviews = reviews[mealId] || [];
        mealReviews[reviewIndex].dislikes += 1;
        setReviews({ ...reviews, [mealId]: [...mealReviews] });
    };

    const shareMeal = (meal) => {
        const shareLink = `${window.location.origin}/meal/${meal.Fid}`;
        navigator.clipboard.writeText(shareLink);
        alert(`Đã sao chép liên kết: ${shareLink}`);
    };

    const getSortedReviews = (mealId) => {
        const mealReviews = reviews[mealId] || [];
        return mealReviews.sort((a, b) => b.likes - a.likes || b.timestamp - a.timestamp);
    };

    return (
        <div className="community-page-container">
            <TaskBar />
            <Snowfall />

            {/* Sidebar - Meal Search */}
            <div className="community-page-sidebar">
                <h2>Tìm kiếm món ăn</h2>
                <div className="community-page-search-bar">
                    <input
                        type="text"
                        placeholder="Tìm món ăn..."
                        value={mealSearch}
                        onChange={(e) => handleMealSearch(e.target.value)}
                    />
                    <button className="community-page-btn">🔍</button>
                </div>
            </div>

            {/* Main Section - Meal List */}
            <div className="community-page-main">
                <h2>Danh sách món ăn</h2>
                <div className="community-page-cards">
                    {filteredMeals.map(meal => (
                        <div key={meal.Fid} className="community-page-card" onClick={() => handleMealDetails(meal)}>
                            <img src={meal.image} alt={meal.foodName} className="community-page-image" />
                            <h3>{meal.foodName}</h3>
                            <p>{meal.foodPrice} VNĐ</p>
                            <button className="community-page-btn" onClick={(e) => { e.stopPropagation(); shareMeal(meal); }}>
                                🔗 Chia sẻ
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rankings Section - Weekly & Monthly Rankings */}
            <div className="community-page-rankings">
                <h3>Bảng xếp hạng</h3>
                <div className="ranking-tabs">
                    <button className="ranking-tab-btn">Tuần</button>
                    <button className="ranking-tab-btn">Tháng</button>
                </div>
                <div className="ranking-list">
                    {rankingData.sort((a, b) => b.weeklyLikes - a.weeklyLikes).slice(0, 5).map((meal, index) => (
                        <div key={index} className="ranking-item">
                            <span>{index + 1}. {meal.foodName}</span>
                            <span>{meal.weeklyLikes} lượt thích</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Meal Details Popup */}
            {selectedMealDetails && (
                <div className="community-page-popup-overlay" onClick={closeMealDetails}>
                    <div className="community-page-popup-content" onClick={(e) => e.stopPropagation()}>
                        <button className="community-page-popup-close" onClick={closeMealDetails}>×</button>
                        <h2 className="title-detail-community">Chi tiết món ăn</h2>
                        <div className="meal-details-community">
                            <img src={selectedMealDetails.image} alt={selectedMealDetails.foodName} className="popup-image-community" />
                            <div className="meal-info-community">
                                <h3>{selectedMealDetails.foodName}</h3>
                                <p><strong>Mô tả:</strong> {selectedMealDetails.description}</p>
                                <p><strong>Calo:</strong> {selectedMealDetails.foodCalories || 0} calo</p>
                                <p><strong>Giá:</strong> {selectedMealDetails.foodPrice} VNĐ</p>
                            </div>

                            {/* Review Form */}
                            <div className="review-form-container">
                                <h5>Viết đánh giá của bạn</h5>
                                <input
                                    type="text"
                                    placeholder="Tên của bạn"
                                    value={newReview.username}
                                    onChange={(e) => setNewReview({ ...newReview, username: e.target.value })}
                                    className="review-input"
                                />
                                <textarea
                                    placeholder="Viết đánh giá của bạn..."
                                    rows="3"
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    className="review-textarea"
                                ></textarea>
                                <div className="rating-container">
                                    <input
                                        type="number"
                                        placeholder="Đánh giá (0-5) ⭐"
                                        value={newReview.rating}
                                        onChange={(e) => setNewReview({ ...newReview, rating: Math.min(Math.max(e.target.value, 0), 5) })}
                                        className="review-rating-input"
                                    />
                                    <span className="rating-label">Đánh giá (1-5) ⭐</span>
                                </div>
                                <button className="review-submit-btn" onClick={() => addReview(selectedMealDetails.Fid)}>Gửi</button>
                            </div>

                            {/* Reviews Section */}
                            <div className="reviews-section">
                                <h4>Đánh giá:</h4>
                                <div className="reviews-container">
                                    <ul className="reviews-list">
                                        {getSortedReviews(selectedMealDetails.Fid).map((review, index) => (
                                            <li key={index} className="review-item">
                                                <div className="review-avatar-container">
                                                    <img src={review.avatar} alt="avatar" className="review-avatar" />
                                                </div>
                                                <div className="review-content">
                                                    <div className="review-header">
                                                        <strong>{review.username}</strong>
                                                        <span className="review-rating">⭐ {review.rating}</span>
                                                    </div>
                                                    <p className="review-comment">{review.comment}</p>
                                                    <div className="review-actions">
                                                        <button className="review-action-btn" onClick={() => handleLikeReview(selectedMealDetails.Fid, index)}>
                                                            👍 {review.likes}
                                                        </button>
                                                        <button className="review-action-btn" onClick={() => handleDislikeReview(selectedMealDetails.Fid, index)}>
                                                            👎 {review.dislikes}
                                                        </button>
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
