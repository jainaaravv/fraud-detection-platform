export default function StatsCard({ title, value, subtitle, icon: Icon, gradient }) {
  return (
    <div className="card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</p>
          <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: gradient || 'var(--gradient-blue)' }}>
            <Icon size={22} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
