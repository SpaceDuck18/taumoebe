/**
 * DataValidationAgent (DVA) - First Gate in the Multi-Agent Pipeline
 * 
 * Responsibilities:
 * - Validates required fields (quantity, category, preparationTime)
 * - Validates image file presence, MIME type, and size
 * - Sanitizes and cleans input data
 * - Generates non-critical warnings (unusual quantities, future prep times, high costs)
 * 
 * Design principle: Never throws. Returns structured { success, data, errors, warnings }
 * The MCP (Master Coordinator) decides what to do with failures/warnings.
 */
const AgentError = require('./AgentError');

class DataValidationAgent {
  /**
   * Validate raw request payload
   * @param {Object} rawPayload - { quantity, category, preparationTime, notes, costPerMeal, file }
   * @param {Object} logger - AgentLogger instance for audit trail
   * @returns {Object} { success, data, errors, warnings }
   */
  static validate(rawPayload, logger) {
    const startTime = Date.now();
    logger.log('START', 'DVA', 'Beginning data validation');

    const errors = [];
    const warnings = [];

    // ────── FIELD VALIDATION ──────
    if (!rawPayload.quantity || rawPayload.quantity.toString().trim() === '') {
      errors.push('Quantity is required.');
    } else {
      const qty = parseFloat(rawPayload.quantity);
      if (isNaN(qty) || qty <= 0) {
        errors.push('Quantity must be a positive number.');
      } else if (qty > 500) {
        warnings.push(`Unusually high quantity detected (${qty} meals). Manual review recommended.`);
      }
    }

    if (!rawPayload.category || rawPayload.category.toString().trim() === '') {
      errors.push('Category is required.');
    }

    if (!rawPayload.preparationTime || rawPayload.preparationTime.toString().trim() === '') {
      errors.push('Preparation time is required.');
    } else {
      const prepTime = new Date(rawPayload.preparationTime);
      const now = new Date();
      if (prepTime > now) {
        warnings.push('Preparation time is in the future. Please verify.');
      }
    }

    if (rawPayload.costPerMeal) {
      const cost = parseFloat(rawPayload.costPerMeal);
      if (isNaN(cost) || cost < 0) {
        errors.push('Cost per meal must be a non-negative number.');
      } else if (cost > 100) {
        warnings.push(`High cost per meal detected ($${cost}). Please verify.`);
      }
    }

    // ────── IMAGE VALIDATION ──────
    if (!rawPayload.file) {
      errors.push('Food photo is required for compliance.');
    } else {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedMimes.includes(rawPayload.file.mimetype)) {
        errors.push(
          `Invalid image type: ${rawPayload.file.mimetype}. Allowed: JPEG, PNG, WebP.`
        );
      }

      if (rawPayload.file.size > 5 * 1024 * 1024) {
        errors.push('Image file exceeds 5MB limit.');
      }
    }

    // ────── RESPONSE ──────
    const duration = Date.now() - startTime;

    if (errors.length > 0) {
      logger.log('FAILURE', 'DVA', `Validation failed with ${errors.length} error(s)`, duration, {
        errors,
      });
      return {
        success: false,
        data: null,
        errors,
        warnings: [],
      };
    }

    // Success: return cleaned payload
    const cleanedData = {
      quantity: parseInt(parseFloat(rawPayload.quantity)),
      category: rawPayload.category.trim(),
      preparationTime: new Date(rawPayload.preparationTime),
      notes: (rawPayload.notes || '').trim(),
      costPerMeal: parseFloat(rawPayload.costPerMeal) || 0,
      file: rawPayload.file, // Pass through for VAA
    };

    logger.log('SUCCESS', 'DVA', 'Data validation passed', duration, {
      warnings: warnings.length,
    });

    if (warnings.length > 0) {
      logger.log('WARNING', 'DVA', `Generated ${warnings.length} warning(s)`, null, {
        warnings,
      });
    }

    return {
      success: true,
      data: cleanedData,
      errors: [],
      warnings,
    };
  }
}

module.exports = DataValidationAgent;
