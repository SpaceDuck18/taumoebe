/**
 * Custom error class for agent-specific failures
 * Enables precise error tracking and fault tolerance at the agent level
 * 
 * Usage:
 *   throw new AgentError('DVA', 'Invalid quantity', 'VALIDATION_FAILED');
 */
class AgentError extends Error {
  constructor(agent, message, code = 'AGENT_FAILURE') {
    super(message);
    this.name = 'AgentError';
    this.agent = agent; // Which agent failed: 'DVA', 'VAA', 'RMA', 'MCP'
    this.code = code; // Error type for structured handling
    this.timestamp = new Date().toISOString();
  }

  /**
   * Serialize agent error for logging and API responses
   */
  toJSON() {
    return {
      name: this.name,
      agent: this.agent,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
    };
  }
}

module.exports = AgentError;
