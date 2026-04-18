/**
 * Risk Scoring Engine
 * Calculates food safety risk based on category and preparation time.
 * Uses rule-based safe window durations per food category.
 */

// Safe consumption window (hours) by food category
const SAFE_WINDOWS = {
  bread:  4,    // Dry food — longest window
  snacks: 4,    // Dry food
  fruits: 3,    // Fresh but not cooked
  veg:    3,    // Cooked vegetables
  dal:    2.5,  // Cooked lentils
  rice:   2,    // Cooked rice — bacteria-prone
  mixed:  2,    // Mixed dishes — conservative estimate
  curry:  1,    // Perishable curry
  dairy:  1,    // Dairy products — highly perishable
  other:  2     // Default fallback
};

/**
 * Calculate risk level and expiry time for a food batch
 * @param {string} category - Food category
 * @param {string|Date} preparationTime - When the food was prepared
 * @returns {{ riskLevel: string, expiryTime: Date, hoursRemaining: number, safeWindowHours: number }}
 */
function calculateRisk(category, preparationTime) {
  const safeHours = SAFE_WINDOWS[category] || SAFE_WINDOWS.other;
  const prepTime = new Date(preparationTime);
  const expiryTime = new Date(prepTime.getTime() + safeHours * 60 * 60 * 1000);

  const now = new Date();
  const hoursRemaining = (expiryTime - now) / (1000 * 60 * 60);

  let riskLevel;
  if (hoursRemaining >= 3) {
    riskLevel = 'LOW';
  } else if (hoursRemaining >= 1) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'HIGH';
  }

  return {
    riskLevel,
    expiryTime,
    hoursRemaining: Math.max(0, parseFloat(hoursRemaining.toFixed(2))),
    safeWindowHours: safeHours
  };
}

module.exports = { calculateRisk, SAFE_WINDOWS };
