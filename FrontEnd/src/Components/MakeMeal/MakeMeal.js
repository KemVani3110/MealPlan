// MakeMeal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MakeMeal.css';
import TaskBar from '../TaskBar/TaskBar';
import Snowfall from '../Snowfall/SnowFall';

const MakeMeal = () => {
    const [meals, setMeals] = useState([]);
    const [filteredMeals, setFilteredMeals] = useState([]);
    const [selectedMeals, setSelectedMeals] = useState([]);
    const [favoriteMeals, setFavoriteMeals] = useState([]);
    const [reviews, setReviews] = useState({});
    const [peopleCount, setPeopleCount] = useState(1);
    const [childrenCount, setChildrenCount] = useState(0);
    const [hasChildren, setHasChildren] = useState(false);
    const [mealSearch, setMealSearch] = useState('');
    const [selectedSearch, setSelectedSearch] = useState('');
    const [selectedMealDetails, setSelectedMealDetails] = useState(null);
    const [newReview, setNewReview] = useState({ username: '', avatar: '', comment: '', rating: 0 });

    const adultCalories = 667;
    const childCalories = 400;

    useEffect(() => {
        axios.get('http://localhost:3060/food-items')
            .then(response => {
                setMeals(response.data);
                setFilteredMeals(response.data);
            })
            .catch(error => console.error('Error fetching meals:', error));
    }, []);

    const addMeal = (meal) => {
        const existingMeal = selectedMeals.find(m => m.Fid === meal.Fid);
        if (existingMeal) {
            setSelectedMeals(selectedMeals.map(m =>
                m.Fid === meal.Fid ? { ...m, quantity: m.quantity + 1 } : m
            ));
        } else {
            setSelectedMeals([...selectedMeals, { ...meal, quantity: 1 }]);
        }
    };

    const removeMeal = (mealId) => {
        setSelectedMeals(selectedMeals.filter(m => m.Fid !== mealId));
    };

    const updateQuantity = (mealId, increment) => {
        setSelectedMeals(selectedMeals.map(m =>
            m.Fid === mealId ? { ...m, quantity: Math.max(1, m.quantity + increment) } : m
        ));
    };

    const toggleFavorite = (meal) => {
        if (favoriteMeals.find(fav => fav.Fid === meal.Fid)) {
            setFavoriteMeals(favoriteMeals.filter(fav => fav.Fid !== meal.Fid));
        } else {
            setFavoriteMeals([...favoriteMeals, meal]);
        }
    };

    const addReview = (mealId) => {
        if (newReview.comment.trim() === '') return;

        const review = {
            username: newReview.username || 'Ẩn danh',
            avatar: newReview.avatar || 'https://i.pinimg.com/736x/e9/36/ab/e936ab240156c33be7974c2c36188bdf.jpg',
            comment: newReview.comment,
            rating: newReview.rating,
            likes: 0,
            dislikes: 0
        };

        setReviews({
            ...reviews,
            [mealId]: reviews[mealId] ? [...reviews[mealId], review] : [review],
        });

        setNewReview({ username: '', avatar: '', comment: '', rating: 0 });
    };

    const handleMealDetails = (meal) => {
        setSelectedMealDetails(meal);
    };

    const closeMealDetails = () => {
        setSelectedMealDetails(null);
    };

    const handleMealSearch = (search) => {
        setMealSearch(search);
        setFilteredMeals(meals.filter(meal => meal.foodName.toLowerCase().includes(search.toLowerCase())));
    };

    const handleSelectedSearch = (search) => {
        setSelectedSearch(search);
        setSelectedMeals(selectedMeals.filter(meal => meal.foodName.toLowerCase().includes(search.toLowerCase())));
    };

    const handleChildrenCountChange = (count) => {
        setChildrenCount(Math.max(0, Math.min(count, peopleCount)));
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

    const totalCalories = selectedMeals.reduce((acc, meal) => acc + ((meal.foodCalories || 0) * meal.quantity), 0);
    const totalRequiredCalories = (peopleCount - childrenCount) * adultCalories + childrenCount * childCalories;
    const calorieDifference = totalCalories - totalRequiredCalories;

    return (
        <div className="meal-prep-container">
            <TaskBar />
            <Snowfall />
            <div className="meal-prep-sidebar">
                <h2>Món ăn đã chọn</h2>
                <div className="meal-prep-search-bar">
                    <input
                        type="text"
                        placeholder="Tìm món ăn đã chọn..."
                        value={selectedSearch}
                        onChange={(e) => handleSelectedSearch(e.target.value)}
                    />
                    <button className="meal-prep-btn">🔍</button>
                </div>
                {selectedMeals.length > 0 ? (
                    <div className="meal-prep-selected-list">
                        {selectedMeals.map(meal => (
                            <div key={meal.Fid} className="meal-prep-selected-item">
                                <h4>{meal.foodName}</h4>
                                <p><strong>Calo:</strong> {meal.foodCalories || 0} calo</p>
                                <div className="meal-prep-quantity-control">
                                    <button className="meal-prep-btn" onClick={() => updateQuantity(meal.Fid, -1)}>-</button>
                                    <span>{meal.quantity}</span>
                                    <button className="meal-prep-btn" onClick={() => updateQuantity(meal.Fid, 1)}>+</button>
                                </div>
                                <button className="meal-prep-remove-btn" onClick={() => removeMeal(meal.Fid)}>Xóa</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Chưa có món ăn nào được chọn.</p>
                )}
                <div className="meal-prep-summary">
                    <p>Tổng calo: <span className="meal-prep-total">{totalCalories} calo</span></p>
                    <p>Nhu cầu calo: <span className="meal-prep-total">{totalRequiredCalories} calo</span></p>
                    <p>Chênh lệch: <span className={calorieDifference >= 0 ? 'calorie-excess' : 'calorie-deficit'}>{calorieDifference} calo</span></p>
                </div>
            </div>

            <div className="meal-prep-main-section">
                <div className="meal-prep-form-section">
                    <h2>Thông tin bữa ăn</h2>
                    <label>Số người ăn:</label>
                    <div className="meal-prep-quantity-control">
                        <button className="meal-prep-btn" onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}>-</button>
                        <input
                            type="number"
                            value={peopleCount}
                            onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value, 10)))}
                        />
                        <button className="meal-prep-btn" onClick={() => setPeopleCount(peopleCount + 1)}>+</button>
                    </div>

                    <label>
                        <input
                            type="checkbox"
                            checked={hasChildren}
                            onChange={() => setHasChildren(!hasChildren)}
                        />
                        Có trẻ em?
                    </label>

                    {hasChildren && (
                        <div className="meal-prep-quantity-control">
                            <label>Số trẻ em:</label>
                            <button className="meal-prep-btn" onClick={() => handleChildrenCountChange(childrenCount - 1)}>-</button>
                            <input
                                type="number"
                                value={childrenCount}
                                onChange={(e) => handleChildrenCountChange(parseInt(e.target.value, 10))}
                            />
                            <button className="meal-prep-btn" onClick={() => handleChildrenCountChange(childrenCount + 1)}>+</button>
                        </div>
                    )}
                </div>

                <div className="meal-prep-gallery">
                    <div className="meal-prep-search">
                        <input
                            type="text"
                            placeholder="Tìm món ăn..."
                            value={mealSearch}
                            onChange={(e) => handleMealSearch(e.target.value)}
                        />
                        <button className="meal-prep-btn">🔍</button>
                    </div>
                    <h2>Danh sách món ăn</h2>
                    <div className="meal-prep-cards">
                        {filteredMeals.map(meal => (
                            <div key={meal.Fid} className="meal-prep-card" onClick={() => handleMealDetails(meal)}>
                                <img src={meal.image} alt={meal.foodName} className="meal-prep-image" />
                                <h3>{meal.foodName}</h3>
                                <p>{meal.foodPrice} VNĐ</p>
                                <button className="meal-prep-btn" onClick={(e) => { e.stopPropagation(); addMeal(meal); }}>Chọn</button>
                                <button
                                    className="meal-prep-btn"
                                    style={{ backgroundColor: 'white' }}
                                    onClick={(e) => { e.stopPropagation(); toggleFavorite(meal); }}
                                >
                                    {favoriteMeals.find(fav => fav.Fid === meal.Fid) ? '❤️' : '🤍'}
                                </button>
                                <button
                                    className="meal-prep-btn"
                                    style={{ backgroundColor: 'white' }}
                                    onClick={(e) => { e.stopPropagation(); shareMeal(meal); }}
                                >
                                    🔗
                                </button>

                            </div>
                        ))}
                    </div>
                </div>

                {selectedMealDetails && (
                    <div className="meal-prep-popup-overlay" onClick={closeMealDetails}>
                        <div className="meal-prep-popup-content" onClick={(e) => e.stopPropagation()}>
                            <button className="meal-prep-popup-close" onClick={closeMealDetails}>×</button>
                            <h2 className='title-detail-makemeal'>Chi tiết món ăn</h2>
                            <div className="meal-details-makemeal">
                                <img src={selectedMealDetails.image} alt={selectedMealDetails.foodName} className="popup-image-makemeal" />
                                <div className="meal-info-makemeal">
                                    <h3 className='meal-h3'>{selectedMealDetails.foodName}</h3>
                                    <p className='meal-p'><strong>Mô tả:</strong> {selectedMealDetails.description}</p>
                                    <p className='meal-p'><strong>Calo:</strong> {selectedMealDetails.foodCalories || 0} calo</p>
                                    <p className='meal-p'><strong>Giá:</strong> {selectedMealDetails.foodPrice} VNĐ</p>
                                    <div className="meal-actions-makemeal">
                                        <button className="icon-btn-makemeal" onClick={() => toggleFavorite(selectedMealDetails)}>
                                            {favoriteMeals.find(fav => fav.Fid === selectedMealDetails.Fid) ? '❤️' : '🤍'}
                                        </button>
                                        <button className="icon-btn-makemeal" onClick={() => shareMeal(selectedMealDetails)}>🔗</button>
                                    </div>
                                </div>
                            </div>

                            <div className="ingredients-reviews">
                                <div className="ingredients-section">
                                    <h4>Nguyên liệu:</h4>
                                    <ul>
                                        {selectedMealDetails.ingredients.map(ingredient => (
                                            <li key={ingredient.ingredientId}>
                                                {ingredient.ingredientName} - {ingredient.gram} gram
                                            </li>
                                        ))}
                                    </ul>
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
                                </div>

                                <div className="reviews-section">
                                    <h4>Đánh giá:</h4>
                                    <div className="reviews-container">
                                        <ul className="reviews-list">
                                            {(reviews[selectedMealDetails.Fid] || []).map((review, index) => (
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
        </div>
    );
};

export default MakeMeal;
