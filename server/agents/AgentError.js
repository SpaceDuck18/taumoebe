/**
 * AgentError — Custom Error Contract for Multi-Agent System
 * 
 * Tracks which agent failed, the error code, and provides
 * structured error data for the MCP to make routing decisions.
 * 
 * This is the inter-agent error protocol that enables fault-tolerant
 * orchestration: the MasterCoordinator catches AgentErrors and decides
 * whether to retry, degrade, or abort based on the error code.
 */

class AgentError extends Error {
  /**
   * @param {string} agent - The agent identifier (e.g., 'DVA', 'VAA', 'RMA')
   * @param {string} message - Human-readable error description
   * @param {string} code - Machine-readable error code for routing decisions
   * @param {Object} [details={}] - Additional context (field errors, thresholds, etc.)
   */
  constructor(agent, message, code, details = {}) {
    super(message);
    this.name = 'AgentError';
    this.agent = agent;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Serialize to a structured JSON object for logging and API responses
   */
  toJSON() {
    return {
      name: this.name,
      agent: this.agent,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

// ── Standard Error Codes ──────────────────────────────────────
// These codes allow the MCP to make deterministic routing decisions
AgentError.CODES = {
  // Data Validation Agent (DVA) errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',

  // Visual Analysis Agent (VAA) errors
  IMAGE_MISSING: 'IMAGE_MISSING',
  IMAGE_INVALID_TYPE: 'IMAGE_INVALID_TYPE',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  IMAGE_ANALYSIS_FAILED: 'IMAGE_ANALYSIS_FAILED',
  IMAGE_LOW_CONFIDENCE: 'IMAGE_LOW_CONFIDENCE',

  // Risk Modeling Agent (RMA) errors
  RISK_CALCULATION_FAILED: 'RISK_CALCULATION_FAILED',
  RISK_DATA_INSUFFICIENT: 'RISK_DATA_INSUFFICIENT',

  // Master Coordinator Processor (MCP) errors
  ORCHESTRATION_FAILED: 'ORCHESTRATION_FAILED',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  PERSISTENCE_FAILED: 'PERSISTENCE_FAILED',
};

module.exports = AgentError;
