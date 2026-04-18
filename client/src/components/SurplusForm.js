'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { batchAPI } from '@/lib/api';

export default function SurplusForm() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    quantity: '',
    category: '',
    preparationTime: '',
    notes: '',
    costPerMeal: '',
  });

  const categories = [
    { value: 'veg', label: '🥬 Vegetables', desc: 'Cooked vegetables' },
    { value: 'rice', label: '🍚 Rice', desc: 'Cooked rice' },
    { value: 'bread', label: '🍞 Bread', desc: 'Bread, roti, naan' },
    { value: 'curry', label: '🍛 Curry', desc: 'Curries, gravies' },
    { value: 'dal', label: '🍲 Dal', desc: 'Lentils, pulses' },
    { value: 'snacks', label: '🍿 Snacks', desc: 'Dry snacks' },
    { value: 'fruits', label: '🍎 Fruits', desc: 'Fresh fruits' },
    { value: 'dairy', label: '🥛 Dairy', desc: 'Milk products' },
    { value: 'mixed', label: '🍱 Mixed', desc: 'Mixed platter' },
    { value: 'other', label: '📦 Other', desc: 'Other food items' },
  ];

  const [selectedFile, setSelectedFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileSelect = (file) => {
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Please upload a JPEG, PNG, or WebP image.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    // Validation
    if (!formData.quantity || !formData.category || !formData.preparationTime) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!selectedFile) {
      setError('Please upload a food photo for compliance.');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('quantity', formData.quantity);
      submitData.append('category', formData.category);
      submitData.append('preparationTime', formData.preparationTime);
      submitData.append('notes', formData.notes);
      submitData.append('costPerMeal', formData.costPerMeal || '0');
      submitData.append('image', selectedFile);

      const response = await batchAPI.create(submitData);
      const { batch, risk } = response.data;

      setSuccess({
        batchId: batch.batchId,
        riskLevel: risk.level,
        hoursRemaining: risk.hoursRemaining,
      });

      // Reset form
      setFormData({ quantity: '', category: '', preparationTime: '', notes: '', costPerMeal: '' });
      setSelectedFile(null);
      setImagePreview(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-down">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-slide-down">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-400">Batch Created Successfully!</h4>
              <p className="text-sm text-gray-400 mt-1">
                Batch <span className="font-mono text-emerald-300">{success.batchId}</span> recorded.
                Risk Level: <span className={`font-semibold ${success.riskLevel === 'LOW' ? 'text-emerald-400' : success.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'}`}>
                  {success.riskLevel}
                </span>
                {' · '}{success.hoursRemaining.toFixed(1)}h remaining
              </p>
              <button
                type="button"
                onClick={() => router.push('/batches')}
                className="mt-3 text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                View My Batches →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Quantity + Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="quantity" className="input-label">
            Number of Meals <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="e.g. 50"
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="input-label">
            Food Category <span className="text-red-400">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input-field appearance-none"
            required
          >
            <option value="" className="bg-surface-700">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-surface-700">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Preparation Time + Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="preparationTime" className="input-label">
            Preparation Time <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            id="preparationTime"
            name="preparationTime"
            value={formData.preparationTime}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="costPerMeal" className="input-label">
            Cost per Meal (₹) <span className="text-gray-600 text-xs">optional</span>
          </label>
          <input
            type="number"
            id="costPerMeal"
            name="costPerMeal"
            min="0"
            step="0.01"
            value={formData.costPerMeal}
            onChange={handleChange}
            placeholder="e.g. 25"
            className="input-field"
          />
          {formData.quantity && formData.costPerMeal && (
            <p className="text-xs text-gray-500 mt-1">
              Total Value: <span className="text-brand-400 font-semibold">₹{(parseFloat(formData.quantity) * parseFloat(formData.costPerMeal)).toFixed(2)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="input-label">
          Food Photo <span className="text-red-400">*</span>
        </label>
        <div
          className={`mt-1 border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
            ${dragActive ? 'border-brand-500 bg-brand-500/5' :
              imagePreview ? 'border-emerald-500/30 bg-emerald-500/5' :
              'border-surface-400/30 hover:border-brand-500/50 hover:bg-surface-700/50'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-surface-900/80 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div>
              <svg className="w-10 h-10 mx-auto text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-400">
                <span className="text-brand-400 font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-600 mt-1">JPEG, PNG, WebP (max 5MB)</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="input-label">
          Notes <span className="text-gray-600 text-xs">optional</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional info about the food surplus..."
          className="input-field resize-none"
        />
      </div>

      {/* Category Info */}
      {formData.category && (
        <div className="p-4 rounded-xl bg-surface-700/50 border border-surface-400/20 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-brand-400">Safe Window Info</span>
          </div>
          <p className="text-sm text-gray-400">
            {categories.find(c => c.value === formData.category)?.label} has a safe consumption window of{' '}
            <span className="text-white font-medium">
              {{ bread: 4, snacks: 4, fruits: 3, veg: 3, dal: 2.5, rice: 2, mixed: 2, curry: 1, dairy: 1, other: 2 }[formData.category]} hours
            </span>{' '}
            from preparation time.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
        id="submit-surplus"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating Batch...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Surplus Entry
          </>
        )}
      </button>
    </form>
  );
}
