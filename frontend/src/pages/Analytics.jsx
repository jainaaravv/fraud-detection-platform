import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../api';
import ChartCard from '../components/ChartCard';
import RiskBadge from '../components/RiskBadge';

const COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

const PIE_COLORS = ['#3b82f6', '#ef4444'];

export default function Analytics() {
  const [overTime, setOverTime] = useState([]);
  const [riskDist, setRiskDist] = useState([]);
  const [locations, setLocations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ot, rd, loc, dev, usr] = await Promise.all([
          api.getOverTime(),
          api.getRiskDistribution(),
          api.getLocationStats(),
          api.getDeviceRisk(),
          api.getUserRisk(),
        ]);
        setOverTime(ot);
        setRiskDist(rd);
        setLocations(loc);
        setDevices(dev);
        setUsers(usr);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center animate-pulse" style={{ color: 'var(--text-muted)' }}>
        Loading analytics…
      </div>
    );
  }

  // Derive pie data from risk distribution
  const totalNormal = riskDist.find(r => r.risk_level === 'low')?.count || 0;
  const totalFraud = (riskDist.find(r => r.risk_level === 'medium')?.count || 0) +
    (riskDist.find(r => r.risk_level === 'high')?.count || 0);
  const pieData = [
    { name: 'Normal', value: totalNormal },
    { name: 'Suspicious', value: totalFraud },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Comprehensive fraud intelligence and risk insights
        </p>
      </div>

      {/* Row 1: Alerts Over Time + Risk Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Alerts Over Time" subtitle="High-risk triggers (last 24h)">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={overTime}>
              <defs>
                <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="total" name="Total Txns" stroke="#3b82f6" fill="url(#totalGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="fraud" name="Fraud Alerts" stroke="#f59e0b" fill="url(#fraudGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Score Distribution" subtitle="Transactions by risk level">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={riskDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="risk_level" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {riskDist.map((entry) => (
                  <Cell key={entry.risk_level} fill={COLORS[entry.risk_level] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Transactions/hr + Fraud vs Normal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Transactions Per Hour" subtitle="Volume trend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={overTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={2}
                dot={{ r: 3, fill: '#06b6d4' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fraud vs Normal Transactions" subtitle="Overall distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                paddingAngle={3} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Location Heatmap + Device Risk */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Location Heatmap */}
        <ChartCard title="Fraud Heatmap by Location" subtitle="Top locations by avg. risk score">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {locations.map((loc) => (
              <div key={loc.location} className="flex items-center gap-4">
                <span className="text-sm font-medium w-28 truncate" style={{ color: 'var(--text-primary)' }}>
                  {loc.location}
                </span>
                <div className="flex-1 h-6 rounded-lg overflow-hidden relative"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-lg transition-all duration-700"
                    style={{
                      width: `${Math.min(loc.avg_risk * 100, 100)}%`,
                      background: loc.avg_risk > 0.5 ? 'var(--gradient-red)' :
                        loc.avg_risk > 0.3 ? 'linear-gradient(90deg, #f59e0b, #f97316)' :
                          'var(--gradient-green)',
                    }} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold"
                    style={{ color: 'var(--text-primary)' }}>
                    {(loc.avg_risk * 100).toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)', width: '60px', textAlign: 'right' }}>
                  {loc.fraud_count}/{loc.total}
                </span>
              </div>
            ))}
            {locations.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No location data</p>
            )}
          </div>
        </ChartCard>

        {/* Device Risk Profiling */}
        <ChartCard title="Device Risk Profiling" subtitle="Top devices by avg. risk score">
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Device</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Txns</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Avg Risk</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Level</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.device_id} className="border-b border-white/3">
                    <td className="py-2 px-3 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{d.device_id}</td>
                    <td className="py-2 px-3 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>{d.total}</td>
                    <td className="py-2 px-3 text-sm text-right font-semibold" style={{
                      color: d.avg_risk > 0.5 ? 'var(--accent-red)' : d.avg_risk > 0.3 ? 'var(--accent-yellow)' : 'var(--accent-green)'
                    }}>
                      {(d.avg_risk * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      <RiskBadge level={d.avg_risk > 0.5 ? 'high' : d.avg_risk > 0.3 ? 'medium' : 'low'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {devices.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No device data</p>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Row 4: User Risk Scoring */}
      <ChartCard title="User Risk Scoring" subtitle="Top users by average fraud risk">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-2 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>User ID</th>
                <th className="text-right py-2 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Transactions</th>
                <th className="text-right py-2 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Total Amount</th>
                <th className="text-right py-2 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Avg Risk</th>
                <th className="text-center py-2 px-4 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Level</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.user_id}</td>
                  <td className="py-3 px-4 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>{u.total}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${u.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-semibold" style={{
                    color: u.avg_risk > 0.5 ? 'var(--accent-red)' : u.avg_risk > 0.3 ? 'var(--accent-yellow)' : 'var(--accent-green)'
                  }}>
                    {(u.avg_risk * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <RiskBadge level={u.avg_risk > 0.5 ? 'high' : u.avg_risk > 0.3 ? 'medium' : 'low'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No user data</p>
          )}
        </div>
      </ChartCard>
    </div>
  );
}

const tooltipStyle = {
  background: '#1a2035',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  color: '#f1f5f9',
  fontSize: '13px',
};
