import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PlanMeal.css';
import TaskBar from '../TaskBar/TaskBar';
import Snowfall from '../Snowfall/SnowFall';



const PlanMeal = () => {
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [currentMeal, setCurrentMeal] = useState(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [hasChildren, setHasChildren] = useState(false);
  const [mealSearches, setMealSearches] = useState(['']);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [meals, setMeals] = useState([]);
  const [formWarning, setFormWarning] = useState(false);
  const [mealPlans, setMealPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);

  const adultCalories = 667;
  const childCalories = 400;
  const totalStandardCalories = (peopleCount - childrenCount) * adultCalories + childrenCount * childCalories;
  const totalSelectedCalories = selectedMeals.reduce(
    (sum, meal) => sum + (meal ? meal.foodCalories * meal.quantity : 0),
    0
  );


  const calorieDifference = totalSelectedCalories - totalStandardCalories;

  // Define meal times and days of the week
  const mealTimes = ['Bữa sáng', 'Bữa trưa', 'Bữa chiều'];
  const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];


  // Load saved meal plan data when component mounts
  useEffect(() => {
    // Fetch meals data from API
    axios
      .get('http://localhost:3060/food-items')
      .then((response) => setMeals(response.data))
      .catch((error) => console.error('Error fetching food items:', error));

    // Load saved meal plan from localStorage
    const savedMealPlan = localStorage.getItem('mealPlan');
    if (savedMealPlan) {
      const parsedMealPlan = JSON.parse(savedMealPlan);
      setPeopleCount(parsedMealPlan.peopleCount || 1);
      setChildrenCount(parsedMealPlan.childrenCount || 0);
      setHasChildren(parsedMealPlan.hasChildren || false);
      setMealSearches(parsedMealPlan.mealSearches || ['']);
      setSelectedMeals(parsedMealPlan.selectedMeals || [null]);
      setTotalCost(parsedMealPlan.totalCost || 0);
      console.log("Loaded meal plan from localStorage:", parsedMealPlan); // Debugging line
    }
  }, []);

  useEffect(() => {
    axios.get('http://localhost:3060/meal-plan')
      .then(response => {
        setMealPlans(response.data.mealPlans);
        if (response.data.mealPlans.length > 0) {
          loadMealPlan(response.data.mealPlans[0].id);
        }
      })
      .catch(error => console.error('Error fetching meal plans:', error));
  }, []);

  const loadMealPlan = (planId) => {
    const selectedPlan = mealPlans.find(plan => plan.id === planId);
    if (selectedPlan) {
      setPeopleCount(selectedPlan.people_count);
      setChildrenCount(selectedPlan.children_count);
      setHasChildren(selectedPlan.children_count > 0);
      setTotalCost(selectedPlan.total_cost);
      setSelectedMeals(selectedPlan.details.map(detail => ({
        foodId: detail.foodId,
        foodName: detail.foodName,
        quantity: detail.quantity,
        mealTime: detail.mealTime,
        dayOfWeek: detail.dayOfWeek,
      })));
      setCurrentPlanId(planId);
    }
  };

  const saveMealPlanToDB = () => {
    const validMeals = selectedMeals.filter(meal => meal !== null && meal.foodId);

    if (validMeals.length === 0) {
      alert('Please select at least one valid meal!');
      return;
    }

    const payload = {
      mealPlanId: currentPlanId,
      dateRangeStart: document.getElementById('start-date').value,
      dateRangeEnd: document.getElementById('end-date').value,
      peopleCount,
      childrenCount,
      totalCost,
      meals: validMeals.map((meal, index) => ({
        mealTime: mealTimes[Math.floor(index / 7)],
        dayOfWeek: daysOfWeek[index % 7],
        foodId: meal.foodId,
        quantity: meal.quantity,
      })),
    };

    axios.post('http://localhost:3060/save-meal-plan', payload)
      .then(response => {
        alert('Meal plan saved successfully!');
        if (!currentPlanId) {
          const newPlan = {
            id: response.data.newMealPlanId,
            date_range_start: payload.dateRangeStart,
            date_range_end: payload.dateRangeEnd,
            people_count: payload.peopleCount,
            children_count: payload.childrenCount,
            total_cost: payload.totalCost,
            details: payload.meals,
          };
          setMealPlans([newPlan, ...mealPlans]);
        }
      })
      .catch(error => console.error('Error saving meal plan:', error));
  };



  // Add new plan
  const addNewPlan = () => {
    setPeopleCount(1);         // Reset số người ăn
    setChildrenCount(0);       // Reset số trẻ em
    setHasChildren(false);     // Không có trẻ em mặc định
    setMealSearches(['']);     // Làm trống tìm kiếm món ăn
    setSelectedMeals([null]);  // Xóa danh sách món ăn
    setTotalCost(0);           // Reset tổng chi phí
    setCurrentPlanId(null);    // Đặt kế hoạch mới (không có ID)
  };


  // Save meal plan data to localStorage when relevant state changes
  useEffect(() => {
    const mealPlanData = {
      peopleCount,
      childrenCount,
      hasChildren,
      mealSearches,
      selectedMeals,
      totalCost,
    };
    console.log("Saving meal plan to localStorage:", mealPlanData); // Debugging line
    localStorage.setItem('mealPlan', JSON.stringify(mealPlanData));
  }, [peopleCount, childrenCount, hasChildren, mealSearches, selectedMeals, totalCost]);

  const totalCalories = (peopleCount - childrenCount) * adultCalories + childrenCount * childCalories;

  const handleSaveMealToDB = () => {
    const validMeals = selectedMeals.filter((meal) => meal !== null && meal.foodId);

    if (validMeals.length === 0) {
      alert("Vui lòng chọn ít nhất một món ăn hợp lệ!");
      return;
    }

    const payload = {
      mealPlanId: currentPlanId, // Null nếu là kế hoạch mới
      dateRangeStart: document.getElementById("start-date").value,
      dateRangeEnd: document.getElementById("end-date").value,
      peopleCount,
      childrenCount,
      totalCost,
      meals: validMeals.map((meal, index) => ({
        mealTime: mealTimes[Math.floor(index / 7)],
        dayOfWeek: daysOfWeek[index % 7],
        foodId: meal.foodId,
        quantity: meal.quantity,
      })),
    };

    axios.post("http://localhost:3060/save-meal-plan", payload)
      .then((response) => {
        alert("Lưu kế hoạch thành công!");

        if (!currentPlanId) {
          // Nếu là kế hoạch mới, thêm vào danh sách kế hoạch
          const newPlan = {
            id: response.data.newMealPlanId,
            date_range_start: payload.dateRangeStart,
            date_range_end: payload.dateRangeEnd,
            people_count: payload.peopleCount,
            children_count: payload.childrenCount,
            total_cost: payload.totalCost,
            details: payload.meals,
          };
          setMealPlans([newPlan, ...mealPlans]); // Thêm kế hoạch mới vào danh sách
        }
      })
      .catch((error) => {
        console.error("Error saving meal plan:", error.response?.data || error.message);
        alert("Vui lòng chọn khung thời gian bắt đầu và kết thúc!");
      });
  };



  const [isFlipping, setIsFlipping] = useState(false);

  const handleSwitchPlanWithFlip = (planId) => {
    setIsFlipping(true); // Kích hoạt hiệu ứng lật
    setTimeout(() => {
      handleSwitchPlan(planId); // Chuyển kế hoạch
      setIsFlipping(false); // Kết thúc hiệu ứng
    }, 600); // Thời gian khớp với hiệu ứng CSS
  };



  //--------
  const handleMealSelection = (meal, index) => {
    const updatedMeals = [...selectedMeals];
    const updatedSearches = [...mealSearches];

    updatedMeals[index] = {
      ...meal,
      foodId: meal.Fid,
      quantity: updatedMeals[index]?.quantity || 1,
    };
    updatedSearches[index] = meal.foodName;

    setSelectedMeals(updatedMeals);
    setMealSearches(updatedSearches);
    updateTotalCost(updatedMeals);
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const updateTotalCost = (meals) => {
    const cost = meals.filter(meal => meal !== null).reduce((total, meal) => total + meal.foodPrice * meal.quantity, 0);
    setTotalCost(cost);
  };

  const increaseQuantity = (index) => {
    const updatedMeals = [...selectedMeals];
    updatedMeals[index].quantity += 1;
    setSelectedMeals(updatedMeals);
    updateTotalCost(updatedMeals);
  };

  const removeMeal = (index) => {
    const updatedMeals = [...selectedMeals];
    const updatedSearches = [...mealSearches];

    updatedMeals.splice(index, 1);
    updatedSearches.splice(index, 1);

    setSelectedMeals(updatedMeals);
    setMealSearches(updatedSearches);

    updateTotalCost(updatedMeals);
  };


  const decreaseQuantity = (index) => {
    const updatedMeals = [...selectedMeals];
    if (updatedMeals[index].quantity > 1) {
      updatedMeals[index].quantity -= 1;
      setSelectedMeals(updatedMeals);
      updateTotalCost(updatedMeals);
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedMeals = [...selectedMeals];
    updatedMeals[index].quantity = newQuantity > 0 ? newQuantity : 1;
    setSelectedMeals(updatedMeals);
    updateTotalCost(updatedMeals);
  };

  const addNewMeal = () => {
    setSelectedMeals([...selectedMeals, null]);
    setMealSearches([...mealSearches, '']);
  };

  const handleSaveMeal = () => {
    if (selectedMeals.every((meal) => meal === null)) {
      setShowWarning(true);
      return;
    }
    if (selectedMeals.some((meal) => meal === null)) {
      setFormWarning(true);
      return;
    }
    setShowWarning(false);
    setFormWarning(false);

    if (selectedMeals.length > 0) {
      // Create summary content for the meal plan modal
      const summaryContent = `
        Số người lớn: ${peopleCount - childrenCount}, Trẻ em: ${childrenCount},
        Món ăn: ${selectedMeals.map((meal) => meal?.foodName).join(', ')}, Tổng chi phí: ${totalCost} VNĐ
      `;
      const ingredientsContent = selectedMeals
        .map(
          (meal) => `
        <h4>${meal.foodName} (x${meal.quantity})</h4>
        <ul class="ingredient-list">
          ${meal.ingredients
              .map(
                (ingredient) => `
            <li>${ingredient.ingredientName} - ${ingredient.gram * meal.quantity} gram</li>
          `
              )
              .join('')}
        </ul>
      `
        )
        .join('');

      if (currentMeal) {
        currentMeal.innerHTML = `
          ${summaryContent}
          <h4>Nguyên liệu cần mua:</h4>
          ${ingredientsContent}
        `;

        // Reset and Edit buttons
        const resetButton = document.createElement('button');
        resetButton.innerHTML = 'x';
        resetButton.className = 'reset-btn';
        resetButton.onclick = () => {
          currentMeal.innerHTML = '<button class="open-modal-btn">Thêm</button>';
          currentMeal.querySelector('button').onclick = openModalForNewMeal;
        };

        const editButton = document.createElement('button');
        editButton.innerHTML = '✏️';
        editButton.className = 'edit-btn';
        editButton.onclick = () => editMeal(currentMeal);

        currentMeal.appendChild(resetButton);
        currentMeal.appendChild(editButton);
      }

      // Save meal plan to localStorage
      localStorage.setItem('mealPlan', JSON.stringify({
        peopleCount,
        childrenCount,
        hasChildren,
        mealSearches,
        selectedMeals,
        totalCost,
      }));
    }

    setMealModalOpen(false); // Close the modal
  };


  const editMeal = (mealCell) => {
    setCurrentMeal(mealCell);
    const mealData = mealCell.dataset;
    setPeopleCount(parseInt(mealData.peopleCount || 1));
    setChildrenCount(parseInt(mealData.childrenCount || 0));
    setHasChildren(Boolean(parseInt(mealData.childrenCount || 0)));
    setMealSearches(mealData.mealSearches ? JSON.parse(mealData.mealSearches) : ['']);
    setSelectedMeals(mealData.selectedMeals ? JSON.parse(mealData.selectedMeals) : [null]);
    setTotalCost(parseFloat(mealData.totalCost || 0));
    setMealModalOpen(true);
  };

  const openModalForNewMeal = (e) => {
    setPeopleCount(1);
    setChildrenCount(0);
    setHasChildren(false);
    setMealSearches(['']);
    setSelectedMeals([null]);
    setTotalCost(0);
    setCurrentMeal(e.target.closest('.meal-cell'));
    setMealModalOpen(true);
  };

  const handleChildrenCountChange = (newChildrenCount) => {
    if (newChildrenCount <= peopleCount) {
      setChildrenCount(newChildrenCount);
    }
  };

  const handleSearchChange = (index, newSearchTerm) => {
    const updatedSearches = [...mealSearches];
    updatedSearches[index] = newSearchTerm;
    setMealSearches(updatedSearches);

    const updatedMeals = [...selectedMeals];
    if (!newSearchTerm) {
      updatedMeals[index] = null;
    }
    setSelectedMeals(updatedMeals);
  };

  const handleSwitchPlan = (planId) => {
    if (planId) {
      loadMealPlan(planId);
    } else {
      setPeopleCount(1);
      setChildrenCount(0);
      setHasChildren(false);
      setMealSearches(['']);
      setSelectedMeals([null]);
      setTotalCost(0);
      setCurrentPlanId(null);
    }
  };

  const handleDeletePlan = (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    axios.delete(`http://localhost:3060/delete-meal-plan/${planId}`)
      .then(() => {
        setMealPlans(mealPlans.filter(plan => plan.id !== planId));
        if (currentPlanId === planId) {
          setCurrentPlanId(null);
        }
        alert('Plan deleted successfully!');
      })
      .catch(error => console.error('Error deleting plan:', error));
  };


  const resetSearch = (index) => {
    const updatedSearches = [...mealSearches];
    updatedSearches[index] = '';
    setMealSearches(updatedSearches);

    const updatedMeals = [...selectedMeals];
    updatedMeals[index] = null;
    setSelectedMeals(updatedMeals);
  };

  return (
    <div className='main' style={{ marginTop: '1%' }}>
      <TaskBar />
      <Snowfall />

      <h1 className='titleFirst'>Lịch ăn uống trong tuần</h1>
      <p className='titleSec'>Chọn món ăn cho mỗi bữa ăn trong tuần của bạn</p>
      <div className='date-range'>
        <label htmlFor='start-date'>Start Date:</label>
        <input type='date' id='start-date' defaultValue={getCurrentDate()} />

        <label htmlFor='end-date'>End Date:</label>
        <input type='date' id='end-date' />
      </div>

      <div className="meal-plan-wrapper">
        <div className="meal-plan-container">
          <div className={`meal-plan ${currentPlanId === null ? 'flip' : ''}`}>
            <div className="plan-front">
              {currentPlanId ? `Plan ${currentPlanId}` : 'Plan mới'}
            </div>
            <div className="plan-back">
              {`Plan ${currentPlanId ? currentPlanId + 1 : 'mới'}`}
            </div>
          </div>
        </div>

        <div className='plan-tabs'>
          {mealPlans.map(plan => (
            <div key={plan.id} className='plan-tab-container'>
              <button
                className={`plan-tab ${currentPlanId === plan.id ? 'active' : ''}`}
                onClick={() => handleSwitchPlan(plan.id)}
              >
                Plan {plan.id}
              </button>
              <button
                className='delete-plan-btn'
                onClick={() => handleDeletePlan(plan.id)}
                title='Delete Plan'
              >
                &times;
              </button>
            </div>
          ))}
          <button className='plan-tab new' onClick={() => handleSwitchPlan(null)}>+ New Plan</button>
          <button className='save-btn' onClick={saveMealPlanToDB}>Save Plan</button>
        </div>
      </div> <br></br>



      <table id="meal-plan">
        <thead>
          <tr>
            <th>Bữa / Ngày</th>
            <th>Thứ Hai</th>
            <th>Thứ Ba</th>
            <th>Thứ Tư</th>
            <th>Thứ Năm</th>
            <th>Thứ Sáu</th>
            <th>Thứ Bảy</th>
            <th>Chủ Nhật</th>
          </tr>
        </thead>
        <tbody>
          {['Bữa sáng', 'Bữa trưa', 'Bữa chiều'].map((mealTime) => (
            <tr key={mealTime}>
              <td>{mealTime}</td>
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <td key={dayIndex}>
                  <div className="meal-cell">
                    <button
                      className="open-modal-btn"
                      onClick={openModalForNewMeal}
                    >
                      Thêm
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>


      {mealModalOpen && (
        <div id="meal-modal" className="modal-makemeal" style={{ display: 'block' }}>
          <div className="modal-content two-columns">
            <span className="close-btn" onClick={() => setMealModalOpen(false)}>&times;</span>
            <h2>Nhập thông tin cho bữa ăn</h2>

            <form id="meal-form">
              <label htmlFor="people-count">Số người ăn:</label>
              <div className="quantity-control">
                <button type="button" onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}>-</button>
                <input
                  type="number"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value, 10)))}
                  min="1"
                />
                <button type="button" onClick={() => setPeopleCount(peopleCount + 1)}>+</button>
              </div>

              <label htmlFor="has-children">
                <input
                  type="checkbox"
                  id="has-children"
                  checked={hasChildren}
                  onChange={() => setHasChildren(!hasChildren)}
                />
                Có trẻ em?
              </label>

              {hasChildren && (
                <div className="children-count">
                  <label htmlFor="children-count">Số lượng trẻ em:</label>
                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() => handleChildrenCountChange(Math.max(0, childrenCount - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={childrenCount}
                      onChange={(e) => handleChildrenCountChange(Math.max(0, parseInt(e.target.value, 10)))}
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => handleChildrenCountChange(childrenCount + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {selectedMeals.map((selectedMeal, index) => (
                <div key={index} className="meal-search">
                  <input
                    id="search"
                    type="text"
                    placeholder="Tìm món ăn..."
                    value={mealSearches[index] || ''}
                    onChange={(e) => handleSearchChange(index, e.target.value)}
                  />
                  <div className="button-row">
                    {mealSearches[index] && (
                      <button
                        style={{ backgroundColor: 'green' }}
                        type="button"
                        className="reset-icon"
                        onClick={() => resetSearch(index)}
                      >
                        &times;
                      </button>
                    )}
                    <div className="meal-options">
                      {meals
                        .filter((meal) => meal.foodName.toLowerCase().includes(mealSearches[index]?.toLowerCase()))
                        .map((meal, idx) => (
                          <button
                            key={meal.foodId || `${meal.foodName}-${idx}`}
                            style={{ marginLeft: 5, marginBottom: 5 }}
                            type="button"
                            onClick={() => handleMealSelection(meal, index)}
                          >
                            {meal.foodName}
                          </button>
                        ))}
                    </div>
                  </div>


                  {selectedMeal && (
                    <div className="meal-details">
                      <br />
                      <p><strong>Mô tả:</strong> {selectedMeal.description}</p>
                      <img src={selectedMeal.image} alt={selectedMeal.foodName} style={{ width: '250px', height: 'auto', borderRadius: 15 }} />
                      <ul className="ingredient-list">
                        {selectedMeal.ingredients.map((ingredient) => (
                          <li key={ingredient.ingredientId}>
                            {ingredient.ingredientName} - {ingredient.gram * selectedMeal.quantity} gram
                          </li>
                        ))}
                      </ul>

                      <div className="meal-quantity">
                        <button type="button" onClick={() => decreaseQuantity(index)}>-</button>
                        <input
                          type="number1"
                          value={selectedMeal.quantity || 1}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10))}
                          min="1"
                        />
                        <button type="button" onClick={() => increaseQuantity(index)}>+</button>
                      </div>
                      <button
                        type="button"
                        className="remove-meal-btn"
                        onClick={() => removeMeal(index)}
                      >
                        ❌
                      </button>
                    </div>
                  )}
                </div>

              ))}

              <br />
              <div className="modal-footer">
                <button type="button" onClick={addNewMeal}>Thêm món mới</button>
                <button style={{ backgroundColor: 'green', marginLeft: 5 }} type="button" className="save-btn" onClick={handleSaveMeal}>Lưu</button>
              </div>

              {showWarning && <p className="warning-text">Vui lòng chọn ít nhất một món ăn!</p>}
              {formWarning && <p className="warning-text">Vui lòng chọn món ăn cho tất cả các bữa ăn!</p>}

              <div className="selected-meals">
                <h3>Các món đã chọn:</h3>
                {selectedMeals.map((meal, index) => (
                  meal && (
                    <div key={meal.foodId} className="selected-meal-item">
                      <button
                        className="remove-meal-btn"
                        onClick={() => removeMeal(index)}
                        title="Xóa món"
                      >
                        &times;
                      </button>
                      <img
                        src={meal.image}
                        alt={meal.foodName}
                        style={{ width: '50px', height: '50px', borderRadius: '5px', marginRight: '10px' }}
                      />
                      <span>{meal.foodName}</span>
                      <span style={{ marginLeft: '10px' }}>x{meal.quantity}</span>
                      <span style={{ marginLeft: '10px', color: '#555' }}>({meal.foodCalories} calo mỗi phần)</span>
                    </div>
                  )
                ))}
              </div>
              <div className="summary">
                <div className="summary-card">
                  <p className="summary-item">Tổng calo cần đạt: <b>{totalStandardCalories}</b> calo</p>
                  <p className="summary-item">Tổng calo đã chọn: <b>{totalSelectedCalories}</b> calo</p>
                  <p className={`summary-item ${calorieDifference >= 0 ? 'calorie-positive' : 'calorie-negative'}`}>
                    {calorieDifference >= 0
                      ? <><span role="img" aria-label="check" className="icon">✔️</span>Dư thừa {calorieDifference} calo</>
                      : <><span role="img" aria-label="warning" className="icon">⚠️</span>Thiếu hụt {Math.abs(calorieDifference)} calo</>}
                  </p>
                  <p className="summary-item">Tổng chi phí: <b>{totalCost}</b> VNĐ</p>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanMeal;