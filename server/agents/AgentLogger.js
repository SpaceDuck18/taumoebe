/**
 * AgentLogger - Centralized audit trail for multi-agent orchestration
 * 
 * Records each agent's execution (start/success/warning/failure) with timestamps
 * and elapsed durations. The complete trace is stored on the batch record for
 * full observability and debugging.
 * 
 * Trace entry format:
 * {
 *   type: 'START|SUCCESS|WARNING|FAILURE|DECISION|INFO',
 *   agent: 'MCP|DVA|VAA|RMA',
 *   message: string,
 *   duration?: number (ms),
 *   timestamp: ISO string,
 *   data?: object (for decisions/results)
 * }
 */
class AgentLogger {
  constructor() {
    this.trace = [];
  }

  /**
   * Log an agent execution event
   */
  log(type, agent, message, duration = null, data = null) {
    const entry = {
      type, // START, SUCCESS, WARNING, FAILURE, DECISION, INFO
      agent,
      message,
      timestamp: new Date().toISOString(),
    };

    if (duration !== null) {
      entry.duration = duration;
    }

    if (data !== null) {
      entry.data = data;
    }

    this.trace.push(entry);
    console.log(`[${agent}] ${type}: ${message}${duration ? ` (${duration}ms)` : ''}`);
    return entry;
  }

  /**
   * Get the complete audit trail
   */
  getTrace() {
    return this.trace;
  }

  /**
   * Get summary stats: count of each type by agent
   */
  getSummary() {
    const summary = {
      totalSteps: this.trace.length,
      totalDuration: this.trace.reduce((sum, entry) => sum + (entry.duration || 0), 0),
      byAgent: {},
      byType: {},
    };

    this.trace.forEach((entry) => {
      // By agent
      if (!summary.byAgent[entry.agent]) {
        summary.byAgent[entry.agent] = { count: 0, types: {} };
      }
      summary.byAgent[entry.agent].count += 1;
      summary.byAgent[entry.agent].types[entry.type] =
        (summary.byAgent[entry.agent].types[entry.type] || 0) + 1;

      // By type
      summary.byType[entry.type] = (summary.byType[entry.type] || 0) + 1;
    });

    return summary;
  }

  /**
   * Clear trace (for new batch processing)
   */
  reset() {
    this.trace = [];
  }
}

module.exports = AgentLogger;
