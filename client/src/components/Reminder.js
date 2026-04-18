'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Reminder({ hasEntryToday }) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if it's past 6 PM and no entry today
    const hour = new Date().getHours();
    if (!hasEntryToday && hour >= 18 && !dismissed) {
      setVisible(true);
    }
    // Also show if explicitly no entry today (regardless of time for demo)
    if (!hasEntryToday && !dismissed) {
      setVisible(true);
    }
  }, [hasEntryToday, dismissed]);

  if (!visible) return null;

  return (
    <div className="animate-slide-down mb-6">
      <div className="glass-card p-4 border-brand-500/30 bg-brand-500/5">
        <div className="flex items-start gap-3">
          {/* Bell Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-400 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <div className="flex-1">
            <h4 className="text-sm font-semibold text-brand-400">Daily Surplus Reminder</h4>
            <p className="text-sm text-gray-400 mt-0.5">
              You haven&apos;t logged any food surplus today. Track your donations to maintain compliance records.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Link
                href="/add-surplus"
                className="px-4 py-1.5 text-xs font-semibold bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Log Surplus Now
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
