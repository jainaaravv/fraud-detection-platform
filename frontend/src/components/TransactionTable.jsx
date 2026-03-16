import RiskBadge from './RiskBadge';

export default function TransactionTable({ transactions, compact = false }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        No transactions found
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/5">
            {!compact && <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>ID</th>}
            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>User</th>
            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Merchant</th>
            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-right" style={{ color: 'var(--text-muted)' }}>Amount</th>
            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Location</th>
            {!compact && <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Device</th>}
            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-center" style={{ color: 'var(--text-muted)' }}>Risk Score</th>
            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap text-center" style={{ color: 'var(--text-muted)' }}>Level</th>
            <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn, i) => (
            <tr key={txn.id || i}
              className="border-b border-white/3 transition-colors duration-150 hover:bg-white/3 animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}>
              {!compact && (
                <td className="py-3 px-4 text-xs font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {txn.id?.slice(0, 8)}…
                </td>
              )}
              <td className="py-3 px-4 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{txn.user_id}</td>
              <td className="py-3 px-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{txn.merchant_id}</td>
              <td className="py-3 px-4 text-sm font-semibold text-right whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                ${txn.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{txn.location}</td>
              {!compact && <td className="py-3 px-4 text-sm font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{txn.device_id}</td>}
              <td className="py-3 px-4 text-center whitespace-nowrap">
                <FraudBar value={txn.fraud_probability} />
              </td>
              <td className="py-3 px-4 text-center whitespace-nowrap">
                <RiskBadge level={txn.risk_level} />
              </td>
              <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                {txn.timestamp ? new Date(txn.timestamp).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FraudBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct > 80 ? 'var(--accent-red)' : pct > 40 ? 'var(--accent-yellow)' : 'var(--accent-green)';
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-semibold" style={{ color, minWidth: '36px' }}>
        {pct}%
      </span>
    </div>
  );
}
