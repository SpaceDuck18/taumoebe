/**
 * Master Coordinator Processor (MCP)
 * 
 * The central orchestration engine for the Taumoebe multi-agent system.
 * This is the "brain" that receives raw batch data and coordinates
 * specialized agents to produce a validated, analyzed, risk-scored,
 * and compliance-ready batch record.
 * 
 * Orchestration Flow:
 *   1. Initialize payload and audit logger
 *   2. Run DVA (Data Validation Agent) and VAA (Visual Analysis Agent) concurrently
 *   3. MCP Decision Layer — inspect outputs and set routing flags
 *   4. Route to RMA (Risk Modeling Agent) with combined intelligence
 *   5. Persist the batch record with full agent trace
 *   6. Return structured result with audit trail
 * 
 * Key Design Principles:
 * - Fault Tolerance: If VAA fails, system degrades gracefully (doesn't crash)
 * - Observability: Every step is logged via AgentLogger for audit trail
 * - Agent Autonomy: Each agent makes independent assessments; MCP coordinates
 * - Parallel Execution: DVA and VAA run concurrently via Promise.allSettled
 */

const { v4: uuidv4 } = require('uuid');
const Batch = require('../models/Batch');
const AgentError = require('./AgentError');
const AgentLogger = require('./AgentLogger');
const DataValidationAgent = require('./DataValidationAgent');
const VisualAnalysisAgent = require('./VisualAnalysisAgent');
const RiskModelingAgent = require('./RiskModelingAgent');

// In-memory agent execution metrics (persisted across requests)
const agentMetrics = {
  totalProcessed: 0,
  totalSuccess: 0,
  totalFailures: 0,
  agentStats: {
    DVA: { executions: 0, failures: 0, totalDuration: 0 },
    VAA: { executions: 0, failures: 0, totalDuration: 0 },
    RMA: { executions: 0, failures: 0, totalDuration: 0 },
  },
  lastProcessedAt: null,
};

class MasterCoordinator {
  static AGENT_ID = 'MCP';

  /**
   * Process a new food surplus batch through the multi-agent pipeline
   * 
   * @param {Object} rawData - Raw request body (quantity, category, preparationTime, notes, costPerMeal)
   * @param {Object} file - Multer file object from image upload
   * @param {Object} user - Authenticated user object (req.user)
   * @returns {{ success: boolean, batch: Object|null, risk: Object|null, agentTrace: Array, error: string|null }}
   */
  static async processBatch(rawData, file, user) {
    const logger = new AgentLogger();
    agentMetrics.totalProcessed++;

    logger.log(this.AGENT_ID, 'START', '═══ Multi-Agent Batch Processing Pipeline Initiated ═══', {
      donorId: user._id,
      businessName: user.businessName,
    });

    try {
      // ══════════════════════════════════════════════════════
      // PHASE 1: Parallel Agent Execution (DVA + VAA)
      // The MCP runs DVA and VAA concurrently using Promise.allSettled
      // This is a hallmark of production-grade agent orchestration
      // ══════════════════════════════════════════════════════
      logger.log(this.AGENT_ID, 'INFO', 'Phase 1: Launching DVA and VAA agents in parallel...');

      const dvaStart = Date.now();
      const vaaStart = Date.now();

      const [dvaResult, vaaResult] = await Promise.allSettled([
        // DVA: Validate and sanitize inputs
        Promise.resolve(DataValidationAgent.validate(rawData, file, logger)),
        // VAA: Analyze the uploaded image
        VisualAnalysisAgent.analyze(file, rawData.category, logger),
      ]);

      // Track agent durations
      const dvaDuration = Date.now() - dvaStart;
      const vaaDuration = Date.now() - vaaStart;
      agentMetrics.agentStats.DVA.executions++;
      agentMetrics.agentStats.DVA.totalDuration += dvaDuration;
      agentMetrics.agentStats.VAA.executions++;
      agentMetrics.agentStats.VAA.totalDuration += vaaDuration;

      // ══════════════════════════════════════════════════════
      // PHASE 2: MCP Decision Layer
      // Inspect outputs from both agents and make routing decisions
      // This is where the MCP demonstrates "agency" — it reasons
      // ══════════════════════════════════════════════════════
      logger.log(this.AGENT_ID, 'INFO', 'Phase 2: MCP Decision Layer — inspecting agent outputs...');

      // ── Handle DVA Result ─────────────────────────────
      let validatedData, dvaWarnings;

      if (dvaResult.status === 'rejected') {
        // DVA crashed unexpectedly (should not happen, but MCP handles it)
        agentMetrics.agentStats.DVA.failures++;
        logger.log(this.AGENT_ID, 'FAILURE', `DVA agent crashed: ${dvaResult.reason?.message || 'Unknown error'}`);
        agentMetrics.totalFailures++;
        return this._buildErrorResponse(logger, 'Data validation agent encountered an internal error. Please try again.');
      }

      const dva = dvaResult.value;
      if (!dva.success) {
        // DVA found validation errors — abort pipeline
        agentMetrics.agentStats.DVA.failures++;
        logger.log(this.AGENT_ID, 'DECISION', 'DVA reported validation errors. Aborting pipeline — data quality gate not met.');
        agentMetrics.totalFailures++;
        return {
          success: false,
          batch: null,
          risk: null,
          agentTrace: logger.getTrace(),
          error: dva.errors[0]?.message || 'Input validation failed.',
          validationErrors: dva.errors,
        };
      }

      validatedData = dva.data;
      dvaWarnings = dva.warnings || [];

      if (dvaWarnings.length > 0) {
        logger.log(this.AGENT_ID, 'DECISION', `DVA issued ${dvaWarnings.length} warning(s). Passing caution flags to RMA.`, {
          warningFields: dvaWarnings.map(w => w.field),
        });
      }

      // ── Handle VAA Result ─────────────────────────────
      let imageAnalysis;

      if (vaaResult.status === 'rejected') {
        // VAA crashed — degrade gracefully (don't abort)
        agentMetrics.agentStats.VAA.failures++;
        logger.log(this.AGENT_ID, 'DECISION', 'VAA agent crashed. Activating graceful degradation — proceeding with fallback analysis.');
        imageAnalysis = {
          qualityScore: 0.2,
          confidenceLevel: 'LOW',
          degraded: true,
          degradedReason: vaaResult.reason?.message || 'VAA crash',
          analyzedType: 'Unknown — Manual Review Required',
          imageUrl: file ? `/uploads/${file.filename}` : null,
        };
      } else {
        const vaa = vaaResult.value;
        imageAnalysis = vaa.data;

        if (vaa.warnings && vaa.warnings.length > 0) {
          logger.log(this.AGENT_ID, 'DECISION', `VAA issued ${vaa.warnings.length} warning(s). Flagging for risk adjustment.`);
        }
      }

      // MCP Decision: Should this batch require human review?
      const mcpFlags = {
        requiresHumanReview: imageAnalysis.degraded || imageAnalysis.qualityScore < 0.4,
        cautionLevel: dvaWarnings.length > 0 ? 'ELEVATED' : 'NORMAL',
      };

      if (mcpFlags.requiresHumanReview) {
        logger.log(this.AGENT_ID, 'DECISION', 'Batch flagged for HUMAN REVIEW due to low image confidence or degraded analysis.', mcpFlags);
      }

      // ══════════════════════════════════════════════════════
      // PHASE 3: Risk Modeling Agent
      // Pass combined DVA+VAA intelligence to RMA
      // ══════════════════════════════════════════════════════
      logger.log(this.AGENT_ID, 'INFO', 'Phase 3: Routing to Risk Modeling Agent (RMA) with combined intelligence...');

      const rmaStart = Date.now();
      agentMetrics.agentStats.RMA.executions++;

      let riskResult;
      try {
        riskResult = RiskModelingAgent.calculate(validatedData, dvaWarnings, imageAnalysis, logger);
      } catch (rmaError) {
        agentMetrics.agentStats.RMA.failures++;
        logger.log(this.AGENT_ID, 'FAILURE', `RMA failed: ${rmaError.message}`);
        agentMetrics.totalFailures++;
        return this._buildErrorResponse(logger, 'Risk calculation failed. Please try again.');
      }

      agentMetrics.agentStats.RMA.totalDuration += Date.now() - rmaStart;

      if (!riskResult.success) {
        agentMetrics.agentStats.RMA.failures++;
        logger.log(this.AGENT_ID, 'FAILURE', 'RMA returned unsuccessful result.');
        agentMetrics.totalFailures++;
        return this._buildErrorResponse(logger, 'Risk modeling produced no result.');
      }

      const riskData = riskResult.data;

      // ══════════════════════════════════════════════════════
      // PHASE 4: Persistence — Create Immutable Batch Record
      // ══════════════════════════════════════════════════════
      logger.log(this.AGENT_ID, 'INFO', 'Phase 4: Persisting batch record with full agent trace...');

      const batchId = `TF-${uuidv4().split('-')[0].toUpperCase()}`;

      const batch = await Batch.create({
        batchId,
        donorId: user._id,
        quantity: validatedData.quantity,
        category: validatedData.category,
        preparationTime: validatedData.preparationTime,
        imageUrl: imageAnalysis.imageUrl || (file ? `/uploads/${file.filename}` : ''),
        notes: validatedData.notes,
        riskLevel: riskData.riskLevel,
        expiryTime: riskData.expiryTime,
        costPerMeal: riskData.costEstimate.costPerMeal,
        totalValue: riskData.costEstimate.totalValue,
        status: 'created',
        // New agent-specific fields
        agentTrace: logger.getTrace(),
        imageAnalysis: {
          qualityScore: imageAnalysis.qualityScore,
          confidenceLevel: imageAnalysis.confidenceLevel,
          analyzedType: imageAnalysis.analyzedType,
          degraded: imageAnalysis.degraded || false,
        },
        riskModifiers: riskData.riskModifiers || [],
        requiresHumanReview: mcpFlags.requiresHumanReview || riskData.requiresHumanReview || false,
      });

      // ══════════════════════════════════════════════════════
      // PHASE 5: Result Aggregation
      // ══════════════════════════════════════════════════════
      logger.log(this.AGENT_ID, 'SUCCESS', `═══ Pipeline Complete ═══ Batch ${batchId} created. Risk: ${riskData.riskLevel}. Duration: ${logger.getTotalDuration()}`, {
        batchId,
        riskLevel: riskData.riskLevel,
        totalDuration: logger.getTotalDuration(),
      });

      agentMetrics.totalSuccess++;
      agentMetrics.lastProcessedAt = new Date().toISOString();

      return {
        success: true,
        batch,
        risk: {
          level: riskData.riskLevel,
          hoursRemaining: riskData.hoursRemaining,
          safeWindowHours: riskData.safeWindowHours,
          baseHoursRemaining: riskData.baseHoursRemaining,
          modifiers: riskData.riskModifiers,
        },
        agentTrace: logger.getTrace(),
        processingDuration: logger.getTotalDuration(),
        requiresHumanReview: mcpFlags.requiresHumanReview || riskData.requiresHumanReview,
        error: null,
      };

    } catch (error) {
      agentMetrics.totalFailures++;
      logger.log(this.AGENT_ID, 'FAILURE', `Pipeline error: ${error.message}`);

      return this._buildErrorResponse(logger, error.message || 'An unexpected error occurred during batch processing.');
    }
  }

  /**
   * Build a standardized error response with the agent trace
   */
  static _buildErrorResponse(logger, errorMessage) {
    return {
      success: false,
      batch: null,
      risk: null,
      agentTrace: logger.getTrace(),
      processingDuration: logger.getTotalDuration(),
      error: errorMessage,
    };
  }

  /**
   * Get aggregated agent health metrics
   * Used by the /batches/agent-status observability endpoint
   * 
   * @returns {Object} Agent execution statistics
   */
  static getAgentMetrics() {
    const stats = {};
    for (const [agent, data] of Object.entries(agentMetrics.agentStats)) {
      stats[agent] = {
        ...data,
        averageDuration: data.executions > 0
          ? `${Math.round(data.totalDuration / data.executions)}ms`
          : 'N/A',
        successRate: data.executions > 0
          ? `${(((data.executions - data.failures) / data.executions) * 100).toFixed(1)}%`
          : 'N/A',
      };
    }

    return {
      system: 'Taumoeba Multi-Agent Orchestration System',
      coordinator: 'MasterCoordinator v1.0',
      agents: ['DVA (Data Validation)', 'VAA (Visual Analysis)', 'RMA (Risk Modeling)'],
      totalProcessed: agentMetrics.totalProcessed,
      totalSuccess: agentMetrics.totalSuccess,
      totalFailures: agentMetrics.totalFailures,
      successRate: agentMetrics.totalProcessed > 0
        ? `${((agentMetrics.totalSuccess / agentMetrics.totalProcessed) * 100).toFixed(1)}%`
        : 'N/A',
      agentStats: stats,
      lastProcessedAt: agentMetrics.lastProcessedAt,
      uptime: process.uptime ? `${Math.round(process.uptime())}s` : 'N/A',
    };
  }
}

module.exports = MasterCoordinator;
