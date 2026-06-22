/**
 * Data Validation Agent (DVA)
 * 
 * Specialized agent responsible for validating and sanitizing all
 * incoming batch data. Acts as the first gate in the agent pipeline.
 * 
 * Responsibilities:
 * - Validate required fields (quantity, category, preparationTime)
 * - Validate image file presence and metadata
 * - Sanitize and type-cast all inputs
 * - Generate non-critical warnings (unusual values, edge cases)
 * - Return structured validated payload OR structured errors
 * 
 * Design: The DVA never throws. It returns a result object with
 * { success, data, errors, warnings } so the MCP can decide routing.
 */

const AgentError = require('./AgentError');

// Valid food categories (mirrors Batch model enum)
const VALID_CATEGORIES = ['veg', 'rice', 'bread', 'curry', 'dal', 'snacks', 'fruits', 'dairy', 'mixed', 'other'];

// Thresholds for warning generation
const WARNING_THRESHOLDS = {
  MAX_REASONABLE_QUANTITY: 500,   // Flag quantities above 500 meals
  MIN_REASONABLE_QUANTITY: 1,
  MAX_COST_PER_MEAL: 1000,       // Flag per-meal cost above ₹1000
  FUTURE_PREP_TOLERANCE_MS: 5 * 60 * 1000, // Allow 5 min tolerance for future timestamps
};

class DataValidationAgent {
  static AGENT_ID = 'DVA';

  /**
   * Validate and sanitize raw batch input data
   * @param {Object} rawData - Raw request body fields
   * @param {Object|null} file - Multer file object from image upload
   * @param {AgentLogger} logger - Agent audit logger
   * @returns {{ success: boolean, data: Object|null, errors: Array, warnings: Array }}
   */
  static validate(rawData, file, logger) {
    logger.log(this.AGENT_ID, 'START', 'Beginning input validation and sanitization.');

    const errors = [];
    const warnings = [];

    // ── Required Field Validation ──────────────────────────
    const { quantity, category, preparationTime, notes, costPerMeal } = rawData;

    // Quantity validation
    if (!quantity && quantity !== 0) {
      errors.push({ field: 'quantity', message: 'Quantity (number of meals) is required.' });
    } else {
      const parsedQty = parseInt(quantity, 10);
      if (isNaN(parsedQty) || parsedQty < 1) {
        errors.push({ field: 'quantity', message: 'Quantity must be a positive integer.' });
      } else if (parsedQty > WARNING_THRESHOLDS.MAX_REASONABLE_QUANTITY) {
        warnings.push({
          field: 'quantity',
          message: `Unusually high quantity detected (${parsedQty} meals). Flagging for review.`,
          value: parsedQty,
          threshold: WARNING_THRESHOLDS.MAX_REASONABLE_QUANTITY,
        });
      }
    }

    // Category validation
    if (!category) {
      errors.push({ field: 'category', message: 'Food category is required.' });
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.push({
        field: 'category',
        message: `Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    // Preparation time validation
    if (!preparationTime) {
      errors.push({ field: 'preparationTime', message: 'Preparation time is required.' });
    } else {
      const prepDate = new Date(preparationTime);
      if (isNaN(prepDate.getTime())) {
        errors.push({ field: 'preparationTime', message: 'Invalid date format for preparation time.' });
      } else {
        const now = Date.now();
        if (prepDate.getTime() > now + WARNING_THRESHOLDS.FUTURE_PREP_TOLERANCE_MS) {
          warnings.push({
            field: 'preparationTime',
            message: 'Preparation time is in the future. This may indicate a timezone issue.',
            value: prepDate.toISOString(),
          });
        }
      }
    }

    // Cost per meal validation (optional but checked)
    const parsedCost = parseFloat(costPerMeal) || 0;
    if (parsedCost > WARNING_THRESHOLDS.MAX_COST_PER_MEAL) {
      warnings.push({
        field: 'costPerMeal',
        message: `Unusually high cost per meal (₹${parsedCost}). Verify accuracy.`,
        value: parsedCost,
        threshold: WARNING_THRESHOLDS.MAX_COST_PER_MEAL,
      });
    }

    // ── Image Validation ──────────────────────────────────
    if (!file) {
      errors.push({ field: 'image', message: 'Food photo is required for compliance documentation.' });
    } else {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedMimes.includes(file.mimetype)) {
        errors.push({
          field: 'image',
          message: `Invalid image type "${file.mimetype}". Only JPEG, PNG, and WebP are accepted.`,
        });
      }
      if (file.size > 5 * 1024 * 1024) {
        errors.push({
          field: 'image',
          message: `Image size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the 5MB limit.`,
        });
      }
    }

    // ── Result Assembly ───────────────────────────────────
    if (errors.length > 0) {
      logger.log(this.AGENT_ID, 'FAILURE', `Validation failed with ${errors.length} error(s).`, { errors });
      return {
        success: false,
        data: null,
        errors,
        warnings,
      };
    }

    // Build clean, type-safe payload
    const validatedData = {
      quantity: parseInt(quantity, 10),
      category: category.toLowerCase(),
      preparationTime: new Date(preparationTime),
      notes: (notes || '').trim(),
      costPerMeal: Math.round(parsedCost * 100) / 100,
    };

    if (warnings.length > 0) {
      logger.log(this.AGENT_ID, 'WARNING', `Validation passed with ${warnings.length} warning(s).`, { warnings });
    }

    logger.log(this.AGENT_ID, 'SUCCESS', 'Input validation and sanitization complete.', {
      validatedFields: Object.keys(validatedData),
      warningCount: warnings.length,
    });

    return {
      success: true,
      data: validatedData,
      errors: [],
      warnings,
    };
  }
}

module.exports = DataValidationAgent;
