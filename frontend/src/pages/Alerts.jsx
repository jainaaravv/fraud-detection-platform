import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import TransactionTable from '../components/TransactionTable';
import StatsCard from '../components/StatsCard';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [a, an] = await Promise.all([api.getAlerts(), api.getAnalytics()]);
      setAlerts(a);
      setAnalytics(an);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Fraud Alerts
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Transactions with fraud probability &gt; 80%
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Active Alerts"
          value={analytics?.high_risk_alerts || 0}
          subtitle="High risk transactions"
          icon={ShieldAlert}
          gradient="var(--gradient-red)"
        />
        <StatsCard
          title="Overall Fraud Rate"
          value={`${((analytics?.fraud_rate || 0) * 100).toFixed(1)}%`}
          subtitle={`${analytics?.fraud_transactions || 0} fraud transactions`}
          icon={AlertTriangle}
          gradient="var(--gradient-purple)"
        />
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.2)',
          }}>
          <ShieldAlert size={20} style={{ color: 'var(--accent-red)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--accent-red)' }}>
            {alerts.length} high-risk transaction{alerts.length !== 1 ? 's' : ''} detected — review immediately
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: 'var(--accent-red)' }}>Monitoring</span>
          </span>
        </div>
      )}

      {/* Alerts Table */}
      <div className="card" style={{ padding: '0' }}>
        {loading ? (
          <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>
        ) : alerts.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldAlert size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No high-risk alerts detected</p>
          </div>
        ) : (
          <TransactionTable transactions={alerts} />
        )}
      </div>
    </div>
  );
}
