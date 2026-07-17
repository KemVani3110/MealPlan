import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './PlanMeal.css';
import TaskBar from '../TaskBar/TaskBar';
import Snowfall from '../Snowfall/SnowFall';

const API_URL = 'http://localhost:3060';
const mealTimes = ['Bữa sáng', 'Bữa trưa', 'Bữa chiều'];
const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const adultDailyCalories = 2000;
const childDailyCalories = 1300;

const getCurrentDate = () => new Date().toISOString().split('T')[0];
const getDateAfter = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};
const getSlotKey = (mealTime, dayOfWeek) => `${mealTime}__${dayOfWeek}`;

const createEmptyMealSlots = () => {
  const slots = {};
  mealTimes.forEach((mealTime) => {
    daysOfWeek.forEach((dayOfWeek) => {
      slots[getSlotKey(mealTime, dayOfWeek)] = [];
    });
  });
  return slots;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(toNumber(value));

const formatNumber = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits }).format(toNumber(value));

const formatCalories = (value) => `${formatNumber(value, 1)} calo`;

const formatCalorieDifference = (value) => {
  const normalizedValue = toNumber(value);
  if (normalizedValue > 0) return `Dư ${formatCalories(normalizedValue)}`;
  if (normalizedValue < 0) return `Thiếu ${formatCalories(Math.abs(normalizedValue))}`;
  return 'Đủ mục tiêu';
};

const formatDateForInput = (date) => {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  return new Date(date).toISOString().split('T')[0];
};

const getDefaultPlanName = (startDate, endDate) => {
  if (startDate && endDate) return `Kế hoạch ${formatDateForInput(startDate)} - ${formatDateForInput(endDate)}`;
  return 'Kế hoạch mới';
};

const normalizeMeal = (meal, foodCatalog = []) => {
  if (!meal) return null;

  const foodId = meal.foodId || meal.Fid;
  const catalogMeal = foodCatalog.find((item) => item.Fid === foodId || item.foodId === foodId);

  return {
    ...(catalogMeal || {}),
    ...meal,
    foodId,
    Fid: catalogMeal?.Fid || meal.Fid || foodId,
    foodName: catalogMeal?.foodName || meal.foodName || '',
    foodPrice: toNumber(catalogMeal?.foodPrice ?? meal.foodPrice),
    foodCalories: toNumber(catalogMeal?.foodCalories ?? meal.foodCalories),
    ingredients: catalogMeal?.ingredients || meal.ingredients || [],
    quantity: Math.max(1, toNumber(meal.quantity, 1)),
  };
};

const buildSlotsFromDetails = (details = [], foodCatalog = []) => {
  const slots = createEmptyMealSlots();

  details.forEach((detail) => {
    const slotKey = getSlotKey(detail.mealTime, detail.dayOfWeek);
    if (!slots[slotKey]) return;

    const meal = normalizeMeal(detail, foodCatalog);
    if (meal?.foodId) {
      slots[slotKey].push(meal);
    }
  });

  return slots;
};

const getMealsTotalCost = (meals) =>
  meals.reduce((total, meal) => total + toNumber(meal?.foodPrice) * toNumber(meal?.quantity, 1), 0);

const getMealsTotalCalories = (meals) =>
  meals.reduce((total, meal) => total + toNumber(meal?.foodCalories) * toNumber(meal?.quantity, 1), 0);

const PlanMeal = () => {
  const [meals, setMeals] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [planName, setPlanName] = useState('Kế hoạch mới');
  const [mealSlots, setMealSlots] = useState(createEmptyMealSlots);
  const [dateRangeStart, setDateRangeStart] = useState(getCurrentDate());
  const [dateRangeEnd, setDateRangeEnd] = useState(getDateAfter(6));
  const [peopleCount, setPeopleCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [hasChildren, setHasChildren] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [mealSearchTerm, setMealSearchTerm] = useState('');
  const [modalWarning, setModalWarning] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const adultCount = Math.max(peopleCount, 0);
  const dailyTargetCalories = adultCount * adultDailyCalories + childrenCount * childDailyCalories;
  const mealTargetCalories = Math.round(dailyTargetCalories / mealTimes.length);
  const planMeals = useMemo(() => Object.values(mealSlots).flat(), [mealSlots]);
  const totalCost = useMemo(() => getMealsTotalCost(planMeals), [planMeals]);
  const totalCalories = useMemo(() => getMealsTotalCalories(planMeals), [planMeals]);
  const filledSlotCount = useMemo(
    () => Object.values(mealSlots).filter((slotMeals) => slotMeals.length > 0).length,
    [mealSlots]
  );
  const totalSlotCount = mealTimes.length * daysOfWeek.length;
  const completionPercent = Math.round((filledSlotCount / totalSlotCount) * 100);

  const shoppingList = useMemo(() => {
    const ingredientMap = {};

    planMeals.forEach((meal) => {
      meal.ingredients.forEach((ingredient) => {
        const key = ingredient.ingredientName;
        if (!ingredientMap[key]) {
          ingredientMap[key] = { name: key, gram: 0 };
        }
        ingredientMap[key].gram += toNumber(ingredient.gram) * toNumber(meal.quantity, 1);
      });
    });

    return Object.values(ingredientMap).sort((a, b) => b.gram - a.gram);
  }, [planMeals]);

  const filteredMeals = useMemo(() => {
    const keyword = mealSearchTerm.trim().toLowerCase();
    if (!keyword) return meals;
    return meals.filter((meal) => meal.foodName.toLowerCase().includes(keyword));
  }, [mealSearchTerm, meals]);

  const applyMealPlan = useCallback((plan, foodCatalog = []) => {
    if (!plan) return;

    const normalizedChildrenCount = toNumber(plan.children_count);
    setPlanName(plan.plan_name || getDefaultPlanName(plan.date_range_start, plan.date_range_end));
    setPeopleCount(toNumber(plan.people_count, 1));
    setChildrenCount(normalizedChildrenCount);
    setHasChildren(normalizedChildrenCount > 0);
    setDateRangeStart(formatDateForInput(plan.date_range_start) || getCurrentDate());
    setDateRangeEnd(formatDateForInput(plan.date_range_end));
    setMealSlots(buildSlotsFromDetails(plan.details, foodCatalog));
    setCurrentPlanId(plan.id);
    setMealModalOpen(false);
    setActiveSlot(null);
    setSelectedMeals([]);
    setMealSearchTerm('');
    setSaveStatus('');
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [foodResponse, planResponse] = await Promise.all([
        axios.get(`${API_URL}/food-items`),
        axios.get(`${API_URL}/meal-plan`),
      ]);

      const foodCatalog = foodResponse.data || [];
      const plans = planResponse.data.mealPlans || [];

      setMeals(foodCatalog);
      setMealPlans(plans);

      if (plans.length > 0) {
        applyMealPlan(plans[0], foodCatalog);
        return;
      }

      const savedMealPlan = localStorage.getItem('mealPlan');
      if (savedMealPlan) {
        const parsedMealPlan = JSON.parse(savedMealPlan);
        setPlanName(parsedMealPlan.planName || 'Kế hoạch mới');
        setPeopleCount(parsedMealPlan.peopleCount || 1);
        setChildrenCount(parsedMealPlan.childrenCount || 0);
        setHasChildren(parsedMealPlan.hasChildren || false);
        setDateRangeStart(parsedMealPlan.dateRangeStart || getCurrentDate());
        setDateRangeEnd(parsedMealPlan.dateRangeEnd || getDateAfter(6));
        setMealSlots(parsedMealPlan.mealSlots || createEmptyMealSlots());
      }
    } catch (error) {
      console.error('Error loading meal plan data:', error);
      setSaveStatus('Không thể tải dữ liệu món ăn hoặc kế hoạch.');
    }
  }, [applyMealPlan]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const mealPlanData = {
      planName,
      peopleCount,
      childrenCount,
      hasChildren,
      dateRangeStart,
      dateRangeEnd,
      mealSlots,
      totalCost,
    };
    localStorage.setItem('mealPlan', JSON.stringify(mealPlanData));
  }, [planName, peopleCount, childrenCount, hasChildren, dateRangeStart, dateRangeEnd, mealSlots, totalCost]);

  const refreshMealPlans = async (planIdToLoad = currentPlanId) => {
    const response = await axios.get(`${API_URL}/meal-plan`);
    const plans = response.data.mealPlans || [];
    setMealPlans(plans);

    const nextPlan = plans.find((plan) => plan.id === planIdToLoad) || plans[0];
    if (nextPlan) {
      applyMealPlan(nextPlan, meals);
    }
  };

  const resetCurrentDraft = () => {
    setPlanName('Kế hoạch mới');
    setPeopleCount(1);
    setChildrenCount(0);
    setHasChildren(false);
    setMealSlots(createEmptyMealSlots());
    setDateRangeStart(getCurrentDate());
    setDateRangeEnd(getDateAfter(6));
    setCurrentPlanId(null);
    setMealModalOpen(false);
    setActiveSlot(null);
    setSelectedMeals([]);
    setMealSearchTerm('');
    setSaveStatus('Đang tạo kế hoạch mới.');
  };

  const startNewPlan = () => {
    const hasCurrentData = currentPlanId || planMeals.length > 0 || planName.trim() !== 'Kế hoạch mới';
    if (
      hasCurrentData &&
      !window.confirm('Tạo kế hoạch mới sẽ rời kế hoạch hiện tại. Nếu bạn bấm nhầm, chọn Hủy để giữ nguyên.')
    ) {
      return;
    }

    resetCurrentDraft();
  };

  const handlePeopleCountChange = (value) => {
    const normalizedPeopleCount = Math.max(1, toNumber(value, 1));
    setPeopleCount(normalizedPeopleCount);
  };

  const handleChildrenCountChange = (value) => {
    setChildrenCount(Math.max(0, toNumber(value)));
  };

  const handleHasChildrenChange = () => {
    setHasChildren((currentValue) => {
      if (currentValue) {
        setChildrenCount(0);
      }
      return !currentValue;
    });
  };

  const openModalForSlot = (mealTime, dayOfWeek) => {
    const slotKey = getSlotKey(mealTime, dayOfWeek);
    const slotMeals = mealSlots[slotKey] || [];

    setActiveSlot({ mealTime, dayOfWeek, slotKey });
    setSelectedMeals(slotMeals.map((meal) => normalizeMeal(meal, meals)));
    setMealSearchTerm('');
    setModalWarning('');
    setMealModalOpen(true);
  };

  const addMealToSelection = (meal) => {
    setSelectedMeals((currentMeals) => {
      const normalizedMeal = normalizeMeal({ ...meal, foodId: meal.Fid, quantity: 1 }, meals);
      const existingIndex = currentMeals.findIndex((item) => item.foodId === normalizedMeal.foodId);

      if (existingIndex >= 0) {
        return currentMeals.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentMeals, normalizedMeal];
    });
    setModalWarning('');
  };

  const updateSelectedMealQuantity = (index, value) => {
    setSelectedMeals((currentMeals) =>
      currentMeals.map((meal, mealIndex) =>
        mealIndex === index ? { ...meal, quantity: Math.max(1, toNumber(value, 1)) } : meal
      )
    );
  };

  const removeSelectedMeal = (index) => {
    setSelectedMeals((currentMeals) => currentMeals.filter((_, mealIndex) => mealIndex !== index));
  };

  const saveSlotMeals = () => {
    if (!activeSlot) return;

    if (selectedMeals.length === 0) {
      setModalWarning('Hãy chọn ít nhất một món cho bữa này.');
      return;
    }

    setMealSlots((currentSlots) => ({
      ...currentSlots,
      [activeSlot.slotKey]: selectedMeals.map((meal) => normalizeMeal(meal, meals)),
    }));
    setMealModalOpen(false);
  };

  const clearSlot = (slotKey) => {
    setMealSlots((currentSlots) => ({
      ...currentSlots,
      [slotKey]: [],
    }));
  };

  const saveMealPlanToDB = async () => {
    const validMeals = Object.entries(mealSlots).flatMap(([slotKey, slotMeals]) => {
      const [mealTime, dayOfWeek] = slotKey.split('__');
      return slotMeals.map((meal) => ({
        mealTime,
        dayOfWeek,
        foodId: meal.foodId,
        quantity: meal.quantity,
      }));
    });

    if (!dateRangeStart || !dateRangeEnd) {
      setSaveStatus('Vui lòng chọn ngày bắt đầu và ngày kết thúc.');
      return;
    }

    if (validMeals.length === 0) {
      setSaveStatus('Vui lòng thêm ít nhất một món vào lịch tuần.');
      return;
    }

    const payload = {
      mealPlanId: currentPlanId,
      planName: planName.trim() || getDefaultPlanName(dateRangeStart, dateRangeEnd),
      dateRangeStart,
      dateRangeEnd,
      peopleCount,
      childrenCount: hasChildren ? childrenCount : 0,
      totalCost,
      meals: validMeals,
    };

    try {
      setSaveStatus('Đang lưu kế hoạch...');
      const response = await axios.post(`${API_URL}/save-meal-plan`, payload);
      const savedPlanId = currentPlanId || response.data.newMealPlanId;
      await refreshMealPlans(savedPlanId);
      setSaveStatus('Đã lưu kế hoạch thành công.');
    } catch (error) {
      console.error('Error saving meal plan:', error.response?.data || error.message);
      setSaveStatus('Không thể lưu kế hoạch. Vui lòng kiểm tra lại dữ liệu.');
    }
  };

  const handleSwitchPlan = (planId) => {
    if (!planId) {
      resetCurrentDraft();
      return;
    }

    const selectedPlan = mealPlans.find((plan) => plan.id === planId);
    if (selectedPlan) {
      applyMealPlan(selectedPlan, meals);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Bạn có chắc muốn xóa kế hoạch này?')) return;

    try {
      await axios.delete(`${API_URL}/delete-meal-plan/${planId}`);
      const remainingPlans = mealPlans.filter((plan) => plan.id !== planId);
      setMealPlans(remainingPlans);

      if (currentPlanId === planId) {
        if (remainingPlans.length > 0) {
          applyMealPlan(remainingPlans[0], meals);
        } else {
          resetCurrentDraft();
        }
      }

      setSaveStatus('Đã xóa kế hoạch.');
    } catch (error) {
      console.error('Error deleting plan:', error);
      setSaveStatus('Không thể xóa kế hoạch.');
    }
  };

  const getDayMeals = (dayOfWeek) =>
    mealTimes.flatMap((mealTime) => mealSlots[getSlotKey(mealTime, dayOfWeek)] || []);

  const renderSlot = (mealTime, dayOfWeek) => {
    const slotKey = getSlotKey(mealTime, dayOfWeek);
    const slotMeals = mealSlots[slotKey] || [];
    const slotCalories = getMealsTotalCalories(slotMeals);

    if (slotMeals.length === 0) {
      return (
        <button className="empty-slot-button" type="button" onClick={() => openModalForSlot(mealTime, dayOfWeek)}>
          <span>Thêm món</span>
          <small>{mealTime}</small>
        </button>
      );
    }

    return (
      <div className="meal-slot-filled">
        <div className="slot-meal-list">
          {slotMeals.map((meal, index) => (
            <div className="slot-meal-row" key={`${meal.foodId}-${index}`}>
              <span>{meal.foodName}</span>
              <strong>x{meal.quantity}</strong>
            </div>
          ))}
        </div>
        <div className="slot-meta">
          <span>{formatCalories(slotCalories)}</span>
          <span>{formatCurrency(getMealsTotalCost(slotMeals))}đ</span>
        </div>
        <div className="slot-actions">
          <button type="button" onClick={() => openModalForSlot(mealTime, dayOfWeek)}>Sửa</button>
          <button type="button" onClick={() => clearSlot(slotKey)}>Xóa</button>
        </div>
      </div>
    );
  };

  return (
    <div className="meal-page">
      <TaskBar />
      <Snowfall />

      <section className="meal-hero">
        <div>
          <p className="eyebrow">Meal Planner</p>
          <h1>Lịch ăn uống trong tuần</h1>
          <p className="hero-copy">Lên món theo từng bữa, kiểm soát calo, chi phí và nguyên liệu cần mua cho cả tuần.</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="primary-action" onClick={saveMealPlanToDB}>Lưu kế hoạch</button>
        </div>
      </section>

      <section className="planner-controls" aria-label="Thông tin kế hoạch">
        <label className="plan-name-field">
          <span>Tên kế hoạch</span>
          <input type="text" value={planName} onChange={(event) => setPlanName(event.target.value)} />
        </label>
        <label>
          <span>Ngày bắt đầu</span>
          <input type="date" value={dateRangeStart} onChange={(event) => setDateRangeStart(event.target.value)} />
        </label>
        <label>
          <span>Ngày kết thúc</span>
          <input type="date" value={dateRangeEnd} onChange={(event) => setDateRangeEnd(event.target.value)} />
        </label>
        <label>
          <span>Người lớn</span>
          <div className="stepper-control">
            <button type="button" onClick={() => handlePeopleCountChange(peopleCount - 1)}>-</button>
            <input type="number" min="1" value={peopleCount} onChange={(event) => handlePeopleCountChange(event.target.value)} />
            <button type="button" onClick={() => handlePeopleCountChange(peopleCount + 1)}>+</button>
          </div>
        </label>
        <label className="children-toggle">
          <span>Có trẻ em</span>
          <input type="checkbox" checked={hasChildren} onChange={handleHasChildrenChange} />
        </label>
        {hasChildren && (
          <label>
            <span>Số trẻ em</span>
            <div className="stepper-control">
              <button type="button" onClick={() => handleChildrenCountChange(childrenCount - 1)}>-</button>
              <input type="number" min="0" value={childrenCount} onChange={(event) => handleChildrenCountChange(event.target.value)} />
              <button type="button" onClick={() => handleChildrenCountChange(childrenCount + 1)}>+</button>
            </div>
          </label>
        )}
      </section>

      <section className="plan-tabs" aria-label="Danh sách kế hoạch đã lưu">
        {mealPlans.map((plan) => (
          <div className="plan-tab-group" key={plan.id}>
            <button
              type="button"
              className={`plan-tab ${currentPlanId === plan.id ? 'active' : ''}`}
              onClick={() => handleSwitchPlan(plan.id)}
            >
              {plan.plan_name || getDefaultPlanName(plan.date_range_start, plan.date_range_end)}
            </button>
            <button type="button" className="delete-plan-btn" onClick={() => handleDeletePlan(plan.id)}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className="plan-tab new-plan-tab" onClick={startNewPlan}>
          + Tạo kế hoạch
        </button>
      </section>

      {saveStatus && <p className="save-status">{saveStatus}</p>}

      <main className="planner-layout">
        <section className="week-board" aria-label="Lịch ăn uống tuần">
          <div className="week-grid week-header">
            <div className="meal-time-heading">Bữa</div>
            {daysOfWeek.map((dayOfWeek) => {
              const dayCalories = getMealsTotalCalories(getDayMeals(dayOfWeek));
              return (
                <div className="day-heading" key={dayOfWeek}>
                  <strong>{dayOfWeek}</strong>
                  <span>{formatNumber(dayCalories, 1)}/{formatNumber(dailyTargetCalories)} calo</span>
                </div>
              );
            })}
          </div>

          {mealTimes.map((mealTime) => (
            <div className="week-grid meal-row" key={mealTime}>
              <div className="meal-row-label">
                <strong>{mealTime}</strong>
                <span>Mục tiêu {formatCalories(mealTargetCalories)}</span>
              </div>
              {daysOfWeek.map((dayOfWeek) => (
                <div className="meal-slot" key={dayOfWeek}>
                  {renderSlot(mealTime, dayOfWeek)}
                </div>
              ))}
            </div>
          ))}
        </section>

        <aside className="planner-summary" aria-label="Tóm tắt kế hoạch">
          <div className="summary-block">
            <p className="summary-label">Tiến độ</p>
            <strong>{completionPercent}%</strong>
            <span>{filledSlotCount}/{totalSlotCount} bữa đã có món</span>
            <div className="progress-track">
              <div style={{ width: `${completionPercent}%` }} />
            </div>
          </div>

          <div className="summary-grid">
            <div>
              <span>Chi phí tuần</span>
              <strong>{formatCurrency(totalCost)}đ</strong>
            </div>
            <div>
              <span>Calo tuần</span>
              <strong>{formatCalories(totalCalories)}</strong>
            </div>
            <div>
              <span>Người lớn</span>
              <strong>{adultCount}</strong>
            </div>
            <div>
              <span>Trẻ em</span>
              <strong>{childrenCount}</strong>
            </div>
          </div>

          <div className="shopping-list">
            <div className="panel-heading">
              <h2>Nguyên liệu cần mua</h2>
              <span>{shoppingList.length} loại</span>
            </div>
            {shoppingList.length === 0 ? (
              <p className="empty-note">Chọn món trong lịch để tự tổng hợp nguyên liệu.</p>
            ) : (
              <ul>
                {shoppingList.slice(0, 10).map((ingredient) => (
                  <li key={ingredient.name}>
                    <span>{ingredient.name}</span>
                    <strong>{formatNumber(ingredient.gram)}g</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>

      {mealModalOpen && (
        <div className="meal-modal-overlay" role="dialog" aria-modal="true">
          <div className="meal-modal-panel">
            <div className="modal-heading">
              <div>
                <p>{activeSlot?.dayOfWeek}</p>
                <h2>{activeSlot?.mealTime}</h2>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setMealModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <section className="meal-catalog">
                <label>
                  <span>Tìm món</span>
                  <input
                    type="search"
                    placeholder="Nhập tên món..."
                    value={mealSearchTerm}
                    onChange={(event) => setMealSearchTerm(event.target.value)}
                  />
                </label>

                <div className="catalog-list">
                  {filteredMeals.map((meal) => (
                    <button type="button" key={meal.Fid} className="catalog-item" onClick={() => addMealToSelection(meal)}>
                      <span>{meal.foodName}</span>
                      <small>{formatCalories(meal.foodCalories)} · {formatCurrency(meal.foodPrice)}đ</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="selected-panel">
                <div className="panel-heading">
                  <h3>Món trong bữa</h3>
                  <span>{formatCalories(getMealsTotalCalories(selectedMeals))}</span>
                </div>

                {selectedMeals.length === 0 ? (
                  <p className="empty-note">Chưa có món nào cho bữa này.</p>
                ) : (
                  <div className="selected-list">
                    {selectedMeals.map((meal, index) => (
                      <div className="selected-row" key={`${meal.foodId}-${index}`}>
                        <div>
                          <strong>{meal.foodName}</strong>
                          <span>{formatCurrency(meal.foodPrice)}đ · {formatCalories(meal.foodCalories)}/phần</span>
                        </div>
                        <div className="quantity-editor">
                          <button type="button" onClick={() => updateSelectedMealQuantity(index, meal.quantity - 1)}>-</button>
                          <input
                            type="number"
                            min="1"
                            value={meal.quantity}
                            onChange={(event) => updateSelectedMealQuantity(index, event.target.value)}
                          />
                          <button type="button" onClick={() => updateSelectedMealQuantity(index, meal.quantity + 1)}>+</button>
                        </div>
                        <button type="button" className="remove-row-btn" onClick={() => removeSelectedMeal(index)}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="slot-total">
                  <span>Chi phí bữa</span>
                  <strong>{formatCurrency(getMealsTotalCost(selectedMeals))}đ</strong>
                </div>
                <div className="slot-total">
                  <span>So với mục tiêu</span>
                  <strong>{formatCalorieDifference(getMealsTotalCalories(selectedMeals) - mealTargetCalories)}</strong>
                </div>
                {modalWarning && <p className="modal-warning">{modalWarning}</p>}
              </section>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-action" onClick={() => setMealModalOpen(false)}>Hủy</button>
              <button type="button" className="primary-action" onClick={saveSlotMeals}>Lưu bữa này</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanMeal;
