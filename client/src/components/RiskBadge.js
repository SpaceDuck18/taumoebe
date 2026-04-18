export default function RiskBadge({ level, showDot = true }) {
  const config = {
    LOW: {
      class: 'badge-low',
      label: 'Low Risk',
      dot: 'bg-emerald-400',
    },
    MEDIUM: {
      class: 'badge-medium',
      label: 'Medium Risk',
      dot: 'bg-amber-400',
    },
    HIGH: {
      class: 'badge-high',
      label: 'High Risk',
      dot: 'bg-red-400',
    },
  };

  const { class: badgeClass, label, dot } = config[level] || config.MEDIUM;

  return (
    <span className={badgeClass}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />}
      {label}
    </span>
  );
}
