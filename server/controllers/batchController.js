const { v4: uuidv4 } = require('uuid');
const Batch = require('../models/Batch');
const User = require('../models/User');
const { calculateRisk } = require('../engines/riskEngine');
const { generateComplianceReport } = require('../engines/complianceEngine');
const { calculateCost } = require('../engines/costEngine');
const { generatePDF } = require('../utils/pdfGenerator');
const MasterCoordinator = require('../agents/MasterCoordinator');

/**
 * POST /batches
 * Create a new food surplus batch via Multi-Agent Orchestration
 * 
 * The controller is now a thin wrapper — all business logic
 * (validation, image analysis, risk modeling) is delegated to
 * the MasterCoordinator Processor (MCP) which orchestrates
 * specialized agents (DVA, VAA, RMA).
 */
exports.createBatch = async (req, res) => {
  try {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  🔄 Incoming Batch Request — Routing to MCP');
    console.log('══════════════════════════════════════════════════');

    // Delegate entirely to the Master Coordinator
    const result = await MasterCoordinator.processBatch(req.body, req.file, req.user);

    if (!result.success) {
      // Agent pipeline rejected the input — return structured error
      return res.status(400).json({
        error: result.error,
        validationErrors: result.validationErrors || null,
        agentTrace: result.agentTrace,
        processingDuration: result.processingDuration,
      });
    }

    // Success — return batch with agent trace
    res.status(201).json({
      batch: result.batch,
      risk: result.risk,
      agentTrace: result.agentTrace,
      processingDuration: result.processingDuration,
      requiresHumanReview: result.requiresHumanReview,
    });
  } catch (error) {
    console.error('❌ Unhandled controller error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /batches
 * Get all batches for the authenticated donor
 */
exports.getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ donorId: req.user._id }).sort({ createdAt: -1 });
    res.json({ batches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /batches/:id
 * Get a specific batch by batchId with real-time risk recalculation
 */
exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id, donorId: req.user._id });

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    // Recalculate risk in real-time
    const currentRisk = calculateRisk(batch.category, batch.preparationTime);

    res.json({ batch, currentRisk });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /batches/:id/report
 * Generate compliance report for a batch (JSON or PDF)
 */
exports.getBatchReport = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id, donorId: req.user._id });

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    const donor = await User.findById(batch.donorId).select('-password');
    const report = generateComplianceReport(batch, donor);

    // If PDF format requested
    if (req.query.format === 'pdf') {
      const pdfBuffer = await generatePDF(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=compliance-report-${batch.batchId}.pdf`);
      return res.send(pdfBuffer);
    }

    // Default: return JSON report
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /batches/stats
 * Get dashboard statistics for the authenticated donor
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const batches = await Batch.find({ donorId: req.user._id });

    const totalBatches = batches.length;
    const totalMeals = batches.reduce((sum, b) => sum + b.quantity, 0);
    const totalValue = batches.reduce((sum, b) => sum + b.totalValue, 0);

    const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    const statusCounts = { created: 0, mapped: 0, completed: 0, expired: 0 };
    const categoryCounts = {};

    batches.forEach((b) => {
      riskCounts[b.riskLevel] = (riskCounts[b.riskLevel] || 0) + 1;
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
    });

    // Check for today's entries (reminder system)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBatches = batches.filter((b) => new Date(b.createdAt) >= today);
    const hasEntryToday = todayBatches.length > 0;

    // Recent batches (last 5)
    const recentBatches = batches
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      stats: {
        totalBatches,
        totalMeals,
        totalValue: Math.round(totalValue * 100) / 100,
        riskCounts,
        statusCounts,
        categoryCounts,
        todayBatches: todayBatches.length,
        hasEntryToday,
        recentBatches,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /batches/agent-status
 * Returns multi-agent system health metrics and execution statistics.
 * This endpoint provides observability into the agent orchestration pipeline.
 */
exports.getAgentStatus = (req, res) => {
  try {
    const metrics = MasterCoordinator.getAgentMetrics();
    res.json({ agentStatus: metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
