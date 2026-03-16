import { useState, useEffect } from 'react';
import { Activity, ShieldAlert, TrendingUp, DollarSign } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../api';
import StatsCard from '../components/StatsCard';
import TransactionTable from '../components/TransactionTable';
import ChartCard from '../components/ChartCard';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [overTime, setOverTime] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [a, t, ot, usr] = await Promise.all([
        api.getAnalytics(),
        api.getTransactions(20),
        api.getOverTime(),
        api.getUserRisk(),
      ]);
      setAnalytics(a);
      setTransactions(t);
      setOverTime(ot);
      setTopUsers(usr.slice(0, 10));
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Real-time fraud monitoring and risk intelligence
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Total Transactions"
          value={analytics?.total_transactions?.toLocaleString() || '0'}
          subtitle={`${analytics?.transactions_today || 0} today`}
          icon={Activity}
          gradient="var(--gradient-blue)"
        />
        <StatsCard
          title="Fraud Detected"
          value={analytics?.fraud_transactions || '0'}
          subtitle={`${((analytics?.fraud_rate || 0) * 100).toFixed(1)}% fraud rate`}
          icon={ShieldAlert}
          gradient="var(--gradient-red)"
        />
        <StatsCard
          title="High Risk Alerts"
          value={analytics?.high_risk_alerts || '0'}
          subtitle="Probability > 80%"
          icon={TrendingUp}
          gradient="var(--gradient-purple)"
        />
        <StatsCard
          title="Avg Risk Score"
          value={`${((analytics?.avg_fraud_probability || 0) * 100).toFixed(1)}%`}
          subtitle="Across all transactions"
          icon={DollarSign}
          gradient="var(--gradient-green)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Transaction Volume" subtitle="Last 24 hours">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={overTime}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#1a2035', border: '1px solid #1e293b',
                  borderRadius: '12px', color: '#f1f5f9', fontSize: '13px'
                }}
              />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#colorTotal)"
                strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 Risky Customers" subtitle="By avg fraud probability">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topUsers} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#475569" fontSize={11} hide />
              <YAxis dataKey="user_id" type="category" stroke="#475569" fontSize={11} width={80} />
              <Tooltip
                contentStyle={{
                  background: '#1a2035', border: '1px solid #1e293b',
                  borderRadius: '12px', color: '#f1f5f9', fontSize: '13px'
                }}
                formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Avg Risk']}
              />
              <Bar dataKey="avg_risk" radius={[0, 4, 4, 0]} barSize={16}>
                {topUsers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.avg_risk > 0.5 ? '#ef4444' : entry.avg_risk > 0.3 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Live Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Live Transactions
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto-refreshes every 5 seconds</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: 'var(--accent-green)' }}>Live</span>
          </div>
        </div>
        <TransactionTable transactions={transactions} compact />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg" style={{ background: 'var(--bg-card)' }} />
      <div className="grid grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: 'var(--bg-card)' }} />
        ))}
      </div>
      <div className="h-72 rounded-2xl" style={{ background: 'var(--bg-card)' }} />
    </div>
  );
}
