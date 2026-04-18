/**
 * Cost Estimation Engine
 * Calculates total value of donated food batches.
 */

/**
 * Calculate cost estimation for a batch
 * @param {number} quantity - Number of meals
 * @param {number} costPerMeal - Cost per meal in local currency
 * @returns {{ costPerMeal: number, totalValue: number }}
 */
function calculateCost(quantity, costPerMeal) {
  const cost = parseFloat(costPerMeal) || 0;
  const qty = parseInt(quantity) || 0;
  return {
    costPerMeal: Math.round(cost * 100) / 100,
    totalValue: Math.round(qty * cost * 100) / 100,
  };
}

module.exports = { calculateCost };
