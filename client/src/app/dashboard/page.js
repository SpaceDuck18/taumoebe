'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { batchAPI } from '@/lib/api';
import DashboardStats from '@/components/DashboardStats';
import BatchCard from '@/components/BatchCard';
import Reminder from '@/components/Reminder';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchStats();
    }
  }, [user, authLoading]);

  const fetchStats = async () => {
    try {
      const response = await batchAPI.getStats();
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-surface-400 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="text-gradient">{user.businessName}</span>
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Reminder */}
        {stats && <Reminder hasEntryToday={stats.hasEntryToday} />}

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-surface-600 mb-3" />
                <div className="h-8 bg-surface-600 rounded-lg w-20 mb-2" />
                <div className="h-3 bg-surface-600 rounded w-24" />
              </div>
            ))}
          </div>
        ) : (
          <DashboardStats stats={stats} />
        )}

        {/* Risk Distribution */}
        {stats && stats.totalBatches > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* Risk Breakdown */}
            <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Risk Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'Low Risk', count: stats.riskCounts.LOW, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                  { label: 'Medium Risk', count: stats.riskCounts.MEDIUM, color: 'bg-amber-500', textColor: 'text-amber-400' },
                  { label: 'High Risk', count: stats.riskCounts.HIGH, color: 'bg-red-500', textColor: 'text-red-400' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{item.label}</span>
                      <span className={`font-medium ${item.textColor}`}>{item.count}</span>
                    </div>
                    <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: `${stats.totalBatches > 0 ? (item.count / stats.totalBatches * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Food Categories</h3>
              <div className="space-y-2">
                {Object.entries(stats.categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => {
                    const emoji = { veg: '🥬', rice: '🍚', bread: '🍞', curry: '🍛', dal: '🍲', snacks: '🍿', fruits: '🍎', dairy: '🥛', mixed: '🍱', other: '📦' };
                    return (
                      <div key={category} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-surface-700/50 transition-colors">
                        <span className="text-sm text-gray-300">{emoji[category] || '📦'} {category}</span>
                        <span className="text-sm font-mono text-brand-400">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Status Overview */}
            <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '400ms' }}>
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Batch Status</h3>
              <div className="space-y-2">
                {[
                  { label: 'Created', count: stats.statusCounts.created, color: 'text-blue-400', bg: 'bg-blue-500/15' },
                  { label: 'Mapped', count: stats.statusCounts.mapped, color: 'text-purple-400', bg: 'bg-purple-500/15' },
                  { label: 'Completed', count: stats.statusCounts.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
                  { label: 'Expired', count: stats.statusCounts.expired, color: 'text-red-400', bg: 'bg-red-500/15' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-700/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.bg} ${item.color}`} />
                      <span className="text-sm text-gray-300">{item.label}</span>
                    </div>
                    <span className={`text-sm font-semibold ${item.color}`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Batches */}
        {stats && stats.recentBatches && stats.recentBatches.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Batches</h2>
              <button
                onClick={() => router.push('/batches')}
                className="btn-ghost text-sm"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentBatches.map((batch) => (
                <BatchCard key={batch.batchId} batch={batch} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats && stats.totalBatches === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-surface-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Batches Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start tracking your food surplus to generate compliance-ready records and risk assessments.
            </p>
            <button
              onClick={() => router.push('/add-surplus')}
              className="btn-primary"
            >
              Create Your First Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
