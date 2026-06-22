/**
 * RiskModelingAgent (RMA) - Risk Assessment & Reasoning
 * 
 * Responsibilities:
 * - Combines baseline food safety windows with cross-agent intelligence
 * - Applies risk modifiers based on image quality, DVA warnings, and category
 * - Demonstrates agent reasoning: adjusts risk based on data from other agents
 * 
 * Key Feature: RMA doesn't just execute the risk engine; it applies intelligent
 * multipliers based on warnings from DVA and confidence from VAA. This is where
 * the "multi-agent reasoning" happens.
 */
const { calculateRisk } = require('../engines/riskEngine');
const { calculateCost } = require('../engines/costEngine');

class RiskModelingAgent {
  /**
   * Calculate comprehensive risk assessment
   * @param {Object} validatedData - Output from DVA
   * @param {Object} imageAnalysis - Output from VAA
   * @param {Object} dvaWarnings - Warnings from DVA (quantities, times)
   * @param {Object} logger - AgentLogger instance
   * @returns {Object} { riskLevel, expiryTime, hoursRemaining, modifiers, costEstimate }
   */
  static calculate(validatedData, imageAnalysis, dvaWarnings, logger) {
    const startTime = Date.now();
    logger.log('START', 'RMA', 'Beginning risk assessment');

    try {
      // ────── BASELINE RISK CALCULATION ──────
      // Use existing risk engine (wrapping it in agent architecture)
      const baselineRisk = calculateRisk(
        validatedData.category,
        validatedData.preparationTime
      );

      // ────── COST ESTIMATION ──────
      const costEstimate = calculateCost(validatedData.quantity, validatedData.costPerMeal);

      // ────── RISK MODIFIERS ──────
      const modifiers = [];
      let riskMultiplier = 1.0;

      // Modifier 1: Image Confidence (VAA output)
      // Low confidence → apply caution
      if (imageAnalysis.confidence < 0.6) {
        const mod = 1.5; // 50% increase
        modifiers.push({
          factor: 'Low Image Confidence',
          confidence: (imageAnalysis.confidence * 100).toFixed(1) + '%',
          multiplier: mod,
          reason: 'Image quality too low for reliable analysis',
        });
        riskMultiplier *= mod;
      } else if (imageAnalysis.confidence < 0.8) {
        const mod = 1.3; // 30% increase
        modifiers.push({
          factor: 'Moderate Image Confidence',
          confidence: (imageAnalysis.confidence * 100).toFixed(1) + '%',
          multiplier: mod,
          reason: 'Image quality acceptable but not ideal',
        });
        riskMultiplier *= mod;
      }

      // Modifier 2: DVA Warnings
      if (dvaWarnings && dvaWarnings.length > 0) {
        dvaWarnings.forEach((warning) => {
          if (warning.includes('Unusually high quantity')) {
            const mod = 1.1;
            modifiers.push({
              factor: 'High Quantity Warning',
              multiplier: mod,
              reason: warning,
            });
            riskMultiplier *= mod;
          } else if (warning.includes('future')) {
            const mod = 1.2;
            modifiers.push({
              factor: 'Future Preparation Time',
              multiplier: mod,
              reason: warning,
            });
            riskMultiplier *= mod;
          } else if (warning.includes('cost')) {
            const mod = 1.05;
            modifiers.push({
              factor: 'High Cost Warning',
              multiplier: mod,
              reason: warning,
            });
            riskMultiplier *= mod;
          }
        });
      }

      // Modifier 3: Image Analysis Result (if degraded)
      if (!imageAnalysis.success) {
        const mod = 1.25;
        modifiers.push({
          factor: 'Degraded Image Analysis',
          multiplier: mod,
          reason: 'Image analysis failed; using fallback',
        });
        riskMultiplier *= mod;
      }

      // ────── APPLY MULTIPLIERS TO BASELINE ──────
      const adjustedHoursRemaining = Math.max(
        1,
        Math.round(baselineRisk.hoursRemaining / riskMultiplier)
      );

      // Recalculate risk level based on adjusted time
      let adjustedRiskLevel = baselineRisk.riskLevel;
      if (adjustedHoursRemaining <= 2) {
        adjustedRiskLevel = 'HIGH';
      } else if (adjustedHoursRemaining <= 6) {
        adjustedRiskLevel = 'MEDIUM';
      } else {
        adjustedRiskLevel = 'LOW';
      }

      const result = {
        riskLevel: adjustedRiskLevel,
        baselineRiskLevel: baselineRisk.riskLevel,
        expiryTime: baselineRisk.expiryTime,
        hoursRemaining: adjustedHoursRemaining,
        safeWindowHours: baselineRisk.safeWindowHours,
        riskMultiplier: parseFloat(riskMultiplier.toFixed(2)),
        modifiers,
        costEstimate,
      };

      const duration = Date.now() - startTime;
      logger.log('SUCCESS', 'RMA', 'Risk assessment complete', duration, {
        riskLevel: adjustedRiskLevel,
        multiplier: riskMultiplier.toFixed(2) + 'x',
        modifierCount: modifiers.length,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.log('FAILURE', 'RMA', `Risk calculation failed: ${error.message}`, duration);
      throw error;
    }
  }
}

module.exports = RiskModelingAgent;
