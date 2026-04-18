'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { batchAPI } from '@/lib/api';
import BatchCard from '@/components/BatchCard';

export default function BatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchBatches();
    }
  }, [user, authLoading]);

  const fetchBatches = async () => {
    try {
      const response = await batchAPI.getAll();
      setBatches(response.data.batches);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter batches
  const filteredBatches = batches.filter((batch) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'low' && batch.riskLevel === 'LOW') ||
      (filter === 'medium' && batch.riskLevel === 'MEDIUM') ||
      (filter === 'high' && batch.riskLevel === 'HIGH');

    const matchesSearch =
      !searchTerm ||
      batch.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white">My Batches</h1>
            <p className="text-gray-500 mt-1">
              {batches.length} total batch{batches.length !== 1 ? 'es' : ''} recorded
            </p>
          </div>
          <button
            onClick={() => router.push('/add-surplus')}
            className="btn-primary flex items-center gap-2 self-start"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Entry
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by batch ID or category..."
              className="input-field pl-10"
              id="search-batches"
            />
          </div>

          {/* Risk Filter Tabs */}
          <div className="flex items-center bg-surface-800 rounded-xl p-1 border border-surface-400/20">
            {[
              { value: 'all', label: 'All' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200
                  ${filter === tab.value
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div>
                    <div className="h-3 bg-surface-600 rounded w-24 mb-2" />
                    <div className="h-5 bg-surface-600 rounded w-32" />
                  </div>
                  <div className="h-6 bg-surface-600 rounded-full w-20" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j}>
                      <div className="h-3 bg-surface-600 rounded w-12 mb-1" />
                      <div className="h-4 bg-surface-600 rounded w-16" />
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-surface-400/20 flex justify-between">
                  <div className="h-5 bg-surface-600 rounded w-16" />
                  <div className="h-4 bg-surface-600 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBatches.map((batch) => (
              <BatchCard key={batch.batchId} batch={batch} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {searchTerm || filter !== 'all' ? 'No Matching Batches' : 'No Batches Yet'}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first surplus entry to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
