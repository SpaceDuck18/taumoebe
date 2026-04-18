import Link from 'next/link';
import RiskBadge from './RiskBadge';

export default function BatchCard({ batch }) {
  const prepDate = new Date(batch.preparationTime);
  const expiryDate = new Date(batch.expiryTime);
  const now = new Date();
  const isExpired = now > expiryDate;

  const hoursRemaining = Math.max(0, (expiryDate - now) / (1000 * 60 * 60));

  const categoryLabels = {
    veg: '🥬 Vegetables',
    rice: '🍚 Rice',
    bread: '🍞 Bread',
    curry: '🍛 Curry',
    dal: '🍲 Dal',
    snacks: '🍿 Snacks',
    fruits: '🍎 Fruits',
    dairy: '🥛 Dairy',
    mixed: '🍱 Mixed',
    other: '📦 Other',
  };

  return (
    <Link href={`/batches/${batch.batchId}`}>
      <div className="glass-card p-5 cursor-pointer group animate-fade-in">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-mono text-gray-500 mb-1">{batch.batchId}</p>
            <h3 className="text-base font-semibold text-white group-hover:text-brand-400 transition-colors">
              {categoryLabels[batch.category] || batch.category}
            </h3>
          </div>
          <RiskBadge level={isExpired ? 'HIGH' : batch.riskLevel} />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-500">Meals</p>
            <p className="text-sm font-semibold text-white">{batch.quantity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Value</p>
            <p className="text-sm font-semibold text-white">₹{batch.totalValue}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Prepared</p>
            <p className="text-sm text-gray-300">{prepDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Time Left</p>
            <p className={`text-sm font-medium ${isExpired ? 'text-red-400' : hoursRemaining < 1 ? 'text-red-400' : hoursRemaining < 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isExpired ? 'Expired' : `${hoursRemaining.toFixed(1)}h`}
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-400/20">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
            batch.status === 'created' ? 'bg-blue-500/15 text-blue-400' :
            batch.status === 'mapped' ? 'bg-purple-500/15 text-purple-400' :
            batch.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
            'bg-red-500/15 text-red-400'
          }`}>
            {batch.status.toUpperCase()}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(batch.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
