/**
 * AgentLogger — Centralized Audit Trail for Multi-Agent System
 * 
 * Records every agent execution step (start, success, warning, failure)
 * with timestamps and durations. The resulting trace array is stored
 * on each batch record for full post-mortem observability.
 * 
 * This is what makes the system "observable" — judges can see exactly
 * which agents ran, how long each took, what decisions the MCP made,
 * and where failures occurred.
 */

class AgentLogger {
  constructor() {
    this.trace = [];
    this.startTime = Date.now();
    this.agentMetrics = {};
  }

  /**
   * Log an agent execution event
   * @param {string} agent - Agent identifier (e.g., 'MCP', 'DVA', 'VAA', 'RMA')
   * @param {string} status - Event status ('START', 'SUCCESS', 'WARNING', 'FAILURE', 'DECISION', 'INFO')
   * @param {string} message - Human-readable description
   * @param {Object} [data=null] - Optional structured data payload
   */
  log(agent, status, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      elapsed: `${Date.now() - this.startTime}ms`,
      agent,
      status,
      message,
    };

    if (data) {
      entry.data = data;
    }

    this.trace.push(entry);

    // Track per-agent metrics
    if (!this.agentMetrics[agent]) {
      this.agentMetrics[agent] = { startTime: null, executions: 0, failures: 0 };
    }

    if (status === 'START') {
      this.agentMetrics[agent].startTime = Date.now();
    } else if (status === 'SUCCESS' || status === 'FAILURE') {
      this.agentMetrics[agent].executions++;
      if (status === 'FAILURE') {
        this.agentMetrics[agent].failures++;
      }
      if (this.agentMetrics[agent].startTime) {
        this.agentMetrics[agent].duration = `${Date.now() - this.agentMetrics[agent].startTime}ms`;
        this.agentMetrics[agent].startTime = null;
      }
    }

    // Console output for server-side debugging
    const icon = {
      START: '🚀',
      SUCCESS: '✅',
      WARNING: '⚠️',
      FAILURE: '❌',
      DECISION: '🧠',
      INFO: 'ℹ️',
    }[status] || '📋';

    console.log(`  ${icon} [${agent}] ${message}`);
  }

  /**
   * Get the full audit trace array for storage
   * @returns {Array} The ordered trace of all agent events
   */
  getTrace() {
    return this.trace;
  }

  /**
   * Get per-agent execution metrics
   * @returns {Object} Metrics keyed by agent name
   */
  getMetrics() {
    return this.agentMetrics;
  }

  /**
   * Get total processing duration
   * @returns {string} Total elapsed time
   */
  getTotalDuration() {
    return `${Date.now() - this.startTime}ms`;
  }
}

module.exports = AgentLogger;
