'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SurplusForm from '@/components/SurplusForm';

export default function AddSurplusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-surface-400 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-white">Add Food Surplus</h1>
          <p className="text-gray-500 mt-1">
            Create an immutable, compliance-ready record of your food donation.
          </p>
        </div>

        {/* Info Banner */}
        <div className="glass-card p-4 mb-6 border-brand-500/20 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">
                <span className="text-brand-400 font-medium">Compliance Note:</span> Each entry generates a unique batch ID, 
                risk assessment, and timestamp. Records are <span className="text-white">immutable</span> after creation.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card p-6 sm:p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <SurplusForm />
        </div>
      </div>
    </div>
  );
}
