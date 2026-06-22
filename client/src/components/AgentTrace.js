'use client';

/**
 * AgentTrace Component
 * 
 * Renders the multi-agent execution audit trail as an animated
 * timeline/stepper. Shows each agent's execution status, duration,
 * and MCP decisions in a visually compelling format.
 * 
 * This is the "observability layer" that makes the multi-agent
 * architecture visible to users and hackathon judges.
 */

import { useState } from 'react';

const STATUS_CONFIG = {
  START: { icon: '🚀', color: 'text-blue-400', bgColor: 'bg-blue-500/15', label: 'Started' },
  SUCCESS: { icon: '✅', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', label: 'Success' },
  WARNING: { icon: '⚠️', color: 'text-amber-400', bgColor: 'bg-amber-500/15', label: 'Warning' },
  FAILURE: { icon: '❌', color: 'text-red-400', bgColor: 'bg-red-500/15', label: 'Failed' },
  DECISION: { icon: '🧠', color: 'text-purple-400', bgColor: 'bg-purple-500/15', label: 'Decision' },
  INFO: { icon: 'ℹ️', color: 'text-sky-400', bgColor: 'bg-sky-500/15', label: 'Info' },
};

const AGENT_LABELS = {
  MCP: { name: 'Master Coordinator', short: 'MCP', color: 'text-brand-400' },
  DVA: { name: 'Data Validation Agent', short: 'DVA', color: 'text-blue-400' },
  VAA: { name: 'Visual Analysis Agent', short: 'VAA', color: 'text-cyan-400' },
  RMA: { name: 'Risk Modeling Agent', short: 'RMA', color: 'text-amber-400' },
};

export default function AgentTrace({ trace, duration, compact = false }) {
  const [expanded, setExpanded] = useState(!compact);

  if (!trace || trace.length === 0) return null;

  // Group trace entries by phase for visual separation
  const phases = groupByPhase(trace);

  return (
    <div className="mt-4 animate-fade-in">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-600/50 hover:border-brand-500/30 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold text-white">Multi-Agent Processing Trace</h4>
            <p className="text-xs text-gray-500">
              {trace.length} steps • {duration || 'N/A'} total
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Trace Timeline */}
      {expanded && (
        <div className="mt-2 rounded-xl bg-surface-800/50 border border-surface-700/50 overflow-hidden">
          <div className="p-3 max-h-80 overflow-y-auto custom-scrollbar">
            {trace.map((entry, index) => {
              const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.INFO;
              const agentConfig = AGENT_LABELS[entry.agent] || { name: entry.agent, short: entry.agent, color: 'text-gray-400' };

              return (
                <div
                  key={index}
                  className="flex items-start gap-3 py-1.5 group animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-2 h-2 rounded-full ${config.bgColor} ring-2 ring-surface-700 flex-shrink-0`} />
                    {index < trace.length - 1 && (
                      <div className="w-px h-full bg-surface-600/50 mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs">{config.icon}</span>
                      <span className={`text-xs font-mono font-bold ${agentConfig.color}`}>
                        [{agentConfig.short}]
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color} font-medium`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">
                        {entry.elapsed}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed break-words">
                      {entry.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Footer */}
          <div className="px-3 py-2 border-t border-surface-700/50 bg-surface-800/30">
            <div className="flex items-center justify-between text-[10px] text-gray-600">
              <span>
                Agents: {[...new Set(trace.map(t => t.agent))].join(' → ')}
              </span>
              <span>Pipeline: {duration}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Group trace entries into phases for visual separation
 * (Not currently used for rendering but available for enhanced layouts)
 */
function groupByPhase(trace) {
  const phases = [];
  let currentPhase = [];

  trace.forEach((entry) => {
    if (entry.status === 'START' && currentPhase.length > 0) {
      phases.push(currentPhase);
      currentPhase = [];
    }
    currentPhase.push(entry);
  });

  if (currentPhase.length > 0) {
    phases.push(currentPhase);
  }

  return phases;
}
