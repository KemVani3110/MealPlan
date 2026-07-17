export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatNumber = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits }).format(toNumber(value));

export const formatCurrency = (value) => `${formatNumber(value)}đ`;

export const formatCalories = (value) => `${formatNumber(value, 1)} calo`;

export const formatGram = (value) => `${formatNumber(value)}g`;

export const formatCalorieDifference = (value) => {
  const normalizedValue = toNumber(value);
  if (normalizedValue > 0) return `Dư ${formatCalories(normalizedValue)}`;
  if (normalizedValue < 0) return `Thiếu ${formatCalories(Math.abs(normalizedValue))}`;
  return 'Đủ mục tiêu';
};
