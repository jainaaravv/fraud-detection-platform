export default function ChartCard({ title, children, subtitle }) {
  return (
    <div className="card animate-fade-in">
      <div className="mb-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
