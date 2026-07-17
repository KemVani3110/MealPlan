const MEAL_WORKFLOW_DRAFT_KEY = 'mealWorkflowDraft';

export const saveMealWorkflowDraft = (draft) => {
  const normalizedDraft = {
    ...draft,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(MEAL_WORKFLOW_DRAFT_KEY, JSON.stringify(normalizedDraft));
  return normalizedDraft;
};

export const readMealWorkflowDraft = () => {
  try {
    const savedDraft = localStorage.getItem(MEAL_WORKFLOW_DRAFT_KEY);
    return savedDraft ? JSON.parse(savedDraft) : null;
  } catch (error) {
    console.error('Error reading meal workflow draft:', error);
    return null;
  }
};

export const clearMealWorkflowDraft = () => {
  localStorage.removeItem(MEAL_WORKFLOW_DRAFT_KEY);
};

export const createMealDraft = ({ source, meals, peopleCount = 1, childrenCount = 0, budget = 0, note = '' }) => ({
  source,
  meals: meals.map((meal) => ({
    Fid: meal.Fid || meal.foodId,
    foodId: meal.foodId || meal.Fid,
    foodName: meal.foodName || meal.name || '',
    foodPrice: meal.foodPrice ?? meal.price ?? 0,
    foodCalories: meal.foodCalories ?? meal.calories ?? 0,
    image: meal.image || '',
    description: meal.description || '',
    ingredients: meal.ingredients || [],
    quantity: Math.max(1, Number(meal.quantity) || 1),
  })),
  peopleCount,
  childrenCount,
  budget,
  note,
});
