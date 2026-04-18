'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { batchAPI } from '@/lib/api';
import RiskBadge from '@/components/RiskBadge';

export default function BatchDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const batchId = params.id;

  const [batch, setBatch] = useState(null);
  const [currentRisk, setCurrentRisk] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && batchId) {
      fetchBatch();
    }
  }, [user, authLoading, batchId]);

  const fetchBatch = async () => {
    try {
      const response = await batchAPI.getById(batchId);
      setBatch(response.data.batch);
      setCurrentRisk(response.data.currentRisk);
    } catch (err) {
      console.error('Failed to fetch batch:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const response = await batchAPI.getReport(batchId);
      setReport(response.data.report);
      setShowReport(true);
    } catch (err) {
      console.error('Failed to fetch report:', err);
    }
  };

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await batchAPI.getReportPDF(batchId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compliance-report-${batchId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const categoryLabels = {
    veg: '🥬 Vegetables', rice: '🍚 Rice', bread: '🍞 Bread', curry: '🍛 Curry',
    dal: '🍲 Dal', snacks: '🍿 Snacks', fruits: '🍎 Fruits', dairy: '🥛 Dairy',
    mixed: '🍱 Mixed', other: '📦 Other',
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-surface-400 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="page-container">
        <div className="page-content text-center py-20 animate-fade-in">
          <h2 className="text-xl font-semibold text-white mb-2">Batch Not Found</h2>
          <p className="text-gray-500 mb-6">The batch you are looking for does not exist.</p>
          <button onClick={() => router.push('/batches')} className="btn-primary">
            Back to Batches
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date() > new Date(batch.expiryTime);
  const hoursRemaining = currentRisk?.hoursRemaining || 0;

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/batches')}
          className="btn-ghost mb-6 flex items-center gap-2 animate-fade-in"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Batches
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <p className="text-sm font-mono text-gray-500 mb-1">{batch.batchId}</p>
            <h1 className="text-3xl font-bold text-white">
              {categoryLabels[batch.category] || batch.category}
            </h1>
          </div>
          <RiskBadge level={isExpired ? 'HIGH' : (currentRisk?.riskLevel || batch.riskLevel)} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
              {[
                { label: 'Meals', value: batch.quantity, color: 'text-white' },
                { label: 'Cost/Meal', value: `₹${batch.costPerMeal}`, color: 'text-brand-400' },
                { label: 'Total Value', value: `₹${batch.totalValue}`, color: 'text-purple-400' },
                {
                  label: 'Time Left',
                  value: isExpired ? 'Expired' : `${hoursRemaining.toFixed(1)}h`,
                  color: isExpired ? 'text-red-400' : hoursRemaining < 1 ? 'text-red-400' : hoursRemaining < 3 ? 'text-amber-400' : 'text-emerald-400',
                },
              ].map((metric) => (
                <div key={metric.label} className="glass-card p-4 text-center">
                  <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{metric.label}</p>
                </div>
              ))}
            </div>

            {/* Detailed Info */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-lg font-semibold text-white mb-4">Batch Details</h2>
              <div className="space-y-3">
                {[
                  { label: 'Batch ID', value: batch.batchId, mono: true },
                  { label: 'Category', value: categoryLabels[batch.category] || batch.category },
                  { label: 'Status', value: batch.status.toUpperCase() },
                  { label: 'Prepared At', value: new Date(batch.preparationTime).toLocaleString() },
                  { label: 'Expires At', value: new Date(batch.expiryTime).toLocaleString() },
                  { label: 'Created At', value: new Date(batch.createdAt).toLocaleString() },
                  { label: 'Safe Window', value: `${currentRisk?.safeWindowHours || '-'} hours` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-surface-400/10 last:border-0">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <span className={`text-sm font-medium text-white ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
                  </div>
                ))}
                {batch.notes && (
                  <div className="pt-2">
                    <span className="text-sm text-gray-500">Notes</span>
                    <p className="text-sm text-gray-300 mt-1">{batch.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-lg font-semibold text-white mb-4">Real-Time Risk Assessment</h2>
              <div className="flex items-center gap-4 mb-4">
                <RiskBadge level={isExpired ? 'HIGH' : (currentRisk?.riskLevel || batch.riskLevel)} />
                <span className="text-sm text-gray-400">
                  {isExpired
                    ? 'This batch has exceeded its safe consumption window.'
                    : `${hoursRemaining.toFixed(1)} hours remaining in safe window.`}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Prepared</span>
                  <span>Expires</span>
                </div>
                <div className="h-3 bg-surface-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isExpired ? 'bg-red-500' :
                      hoursRemaining < 1 ? 'bg-red-500' :
                      hoursRemaining < 3 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${isExpired ? 100 : Math.min(100, Math.max(5, (1 - hoursRemaining / (currentRisk?.safeWindowHours || 4)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Image & Actions */}
          <div className="space-y-6">
            {/* Food Image */}
            <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="aspect-square bg-surface-700 flex items-center justify-center">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${batch.imageUrl}`}
                  alt="Food photo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="flex flex-col items-center justify-center h-full"><svg class="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p class="text-xs text-gray-600 mt-2">Image unavailable</p></div>';
                  }}
                />
              </div>
              <div className="p-3 bg-surface-800/50">
                <p className="text-xs text-gray-500 text-center">
                  📸 Proof captured at {new Date(batch.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="glass-card p-5 space-y-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Compliance Actions</h3>
              <button
                onClick={fetchReport}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                id="view-report-btn"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View JSON Report
              </button>
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                id="download-pdf-btn"
              >
                {downloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF Report
                  </>
                )}
              </button>
            </div>

            {/* Proof Badge */}
            <div className="glass-card p-4 border-emerald-500/20 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs font-semibold text-emerald-400">Immutable Record</span>
              </div>
              <p className="text-xs text-gray-500">
                This batch record is sealed. Core data fields cannot be modified after creation.
              </p>
            </div>
          </div>
        </div>

        {/* JSON Report Modal */}
        {showReport && report && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-surface-400/20">
                <h3 className="text-lg font-semibold text-white">Compliance Report</h3>
                <button
                  onClick={() => setShowReport(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-auto p-5 flex-1">
                <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
