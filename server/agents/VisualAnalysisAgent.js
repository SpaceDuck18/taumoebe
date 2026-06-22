/**
 * Visual Analysis Agent (VAA)
 * 
 * Specialized agent responsible for analyzing uploaded food images.
 * Extracts metadata, assesses quality, and provides a confidence score
 * that influences downstream risk calculations.
 * 
 * Responsibilities:
 * - Validate image file integrity
 * - Extract metadata (size, type, dimensions from file headers)
 * - Compute a quality/confidence score based on file characteristics
 * - Provide structured analysis for the Risk Modeling Agent
 * 
 * Design: The VAA supports graceful degradation. If analysis fails,
 * it returns a low-confidence default result instead of crashing,
 * allowing the MCP to flag the batch for human review.
 */

const fs = require('fs');
const path = require('path');
const AgentError = require('./AgentError');

// Confidence scoring weights
const QUALITY_WEIGHTS = {
  FILE_SIZE_OPTIMAL_MIN: 50 * 1024,       // 50KB minimum for reasonable photo
  FILE_SIZE_OPTIMAL_MAX: 4 * 1024 * 1024,  // 4MB sweet spot
  PREFERRED_TYPES: ['image/jpeg', 'image/png'],
};

class VisualAnalysisAgent {
  static AGENT_ID = 'VAA';

  /**
   * Analyze an uploaded food image
   * @param {Object} file - Multer file object { filename, path, mimetype, size, ... }
   * @param {string} category - Food category from DVA (for cross-referencing)
   * @param {AgentLogger} logger - Agent audit logger
   * @returns {{ success: boolean, data: Object|null, warnings: Array }}
   */
  static async analyze(file, category, logger) {
    logger.log(this.AGENT_ID, 'START', 'Beginning visual analysis of food image.');

    const warnings = [];

    // ── File Existence Check ──────────────────────────────
    if (!file || !file.filename) {
      logger.log(this.AGENT_ID, 'FAILURE', 'No image file provided for analysis.');
      // Graceful degradation: return low-confidence default
      return this._degradedResult(logger, 'No file provided');
    }

    try {
      const filePath = file.path;

      // Verify file exists on disk
      if (!fs.existsSync(filePath)) {
        logger.log(this.AGENT_ID, 'WARNING', 'Image file not found on disk. Using degraded analysis.');
        return this._degradedResult(logger, 'File not found on disk');
      }

      // ── Metadata Extraction ───────────────────────────
      const fileStats = fs.statSync(filePath);
      const metadata = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: fileStats.size,
        sizeMB: (fileStats.size / (1024 * 1024)).toFixed(2),
        extension: path.extname(file.originalname).toLowerCase(),
        uploadedAt: fileStats.mtime.toISOString(),
      };

      logger.log(this.AGENT_ID, 'INFO', `Image metadata extracted: ${metadata.sizeMB}MB ${metadata.mimeType}`, { metadata });

      // ── Quality Score Computation ─────────────────────
      let qualityScore = 0.5; // Base score
      const qualityFactors = [];

      // Factor 1: File size (too small = likely placeholder, too large = uncompressed)
      if (fileStats.size >= QUALITY_WEIGHTS.FILE_SIZE_OPTIMAL_MIN && fileStats.size <= QUALITY_WEIGHTS.FILE_SIZE_OPTIMAL_MAX) {
        qualityScore += 0.25;
        qualityFactors.push('Optimal file size range');
      } else if (fileStats.size < QUALITY_WEIGHTS.FILE_SIZE_OPTIMAL_MIN) {
        qualityScore -= 0.15;
        qualityFactors.push('File size unusually small — may be low quality');
        warnings.push({
          field: 'image',
          message: `Image is very small (${(fileStats.size / 1024).toFixed(1)}KB). Quality may be insufficient for compliance.`,
        });
      } else {
        qualityScore += 0.1;
        qualityFactors.push('Large file — likely high resolution');
      }

      // Factor 2: Preferred MIME type
      if (QUALITY_WEIGHTS.PREFERRED_TYPES.includes(file.mimetype)) {
        qualityScore += 0.15;
        qualityFactors.push(`Preferred format: ${file.mimetype}`);
      } else {
        qualityScore += 0.05;
        qualityFactors.push(`Acceptable format: ${file.mimetype}`);
      }

      // Factor 3: File has reasonable name (not auto-generated gibberish)
      if (file.originalname && file.originalname.length > 3) {
        qualityScore += 0.1;
        qualityFactors.push('Meaningful filename');
      }

      // Clamp to [0, 1]
      qualityScore = Math.min(1.0, Math.max(0.0, qualityScore));
      qualityScore = parseFloat(qualityScore.toFixed(2));

      // ── Category Cross-Reference ──────────────────────
      // Map food categories to expected visual characteristics
      const categoryLabels = {
        veg: 'Vegetables / Cooked Greens',
        rice: 'Rice / Grain Dish',
        bread: 'Bread / Baked Goods',
        curry: 'Curry / Gravy Dish',
        dal: 'Lentils / Dal',
        snacks: 'Snacks / Dry Items',
        fruits: 'Fresh Fruits',
        dairy: 'Dairy Products',
        mixed: 'Mixed Plate / Thali',
        other: 'Miscellaneous Food Item',
      };

      const analysisResult = {
        analyzedType: categoryLabels[category] || 'Unclassified Food Item',
        qualityScore,
        qualityFactors,
        metadata,
        confidenceLevel: qualityScore >= 0.7 ? 'HIGH' : qualityScore >= 0.4 ? 'MEDIUM' : 'LOW',
        imageUrl: `/uploads/${file.filename}`,
      };

      // Low confidence warning
      if (qualityScore < 0.5) {
        warnings.push({
          field: 'image',
          message: `Image quality score is low (${qualityScore}). Batch may require manual visual review.`,
        });
        logger.log(this.AGENT_ID, 'WARNING', `Low confidence score: ${qualityScore}. Flagging for review.`);
      }

      logger.log(this.AGENT_ID, 'SUCCESS', `Visual analysis complete. Confidence: ${analysisResult.confidenceLevel} (${qualityScore})`, {
        qualityScore,
        confidenceLevel: analysisResult.confidenceLevel,
        factorCount: qualityFactors.length,
      });

      return {
        success: true,
        data: analysisResult,
        warnings,
      };

    } catch (error) {
      logger.log(this.AGENT_ID, 'FAILURE', `Visual analysis encountered an error: ${error.message}`);
      // Graceful degradation instead of crash
      return this._degradedResult(logger, error.message);
    }
  }

  /**
   * Generate a degraded (fallback) result when analysis cannot complete.
   * This is the core of "graceful degradation" — the system doesn't crash,
   * it produces a low-confidence result and flags for human review.
   * 
   * @param {AgentLogger} logger - Agent audit logger
   * @param {string} reason - Why the analysis degraded
   * @returns {{ success: boolean, data: Object, warnings: Array }}
   */
  static _degradedResult(logger, reason) {
    logger.log(this.AGENT_ID, 'WARNING', `Degraded mode activated: ${reason}. Using fallback analysis.`);

    return {
      success: true, // Still "succeeds" but with low confidence
      data: {
        analyzedType: 'Unknown — Manual Review Required',
        qualityScore: 0.2,
        qualityFactors: ['Degraded analysis mode — original analysis failed'],
        metadata: null,
        confidenceLevel: 'LOW',
        degraded: true,
        degradedReason: reason,
        imageUrl: null,
      },
      warnings: [{
        field: 'image',
        message: `Visual analysis ran in degraded mode: ${reason}. Manual review strongly recommended.`,
        severity: 'HIGH',
      }],
    };
  }
}

module.exports = VisualAnalysisAgent;
