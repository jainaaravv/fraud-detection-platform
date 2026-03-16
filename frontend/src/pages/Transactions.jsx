import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { api } from '../api';
import TransactionTable from '../components/TransactionTable';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    try {
      const data = await api.getTransactions(200);
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      !search ||
      t.user_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.merchant_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.location?.toLowerCase().includes(search.toLowerCase()) ||
      t.device_id?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      t.risk_level === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in pr-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Transactions
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} of {transactions.length} transactions
          </p>
        </div>
        <button onClick={fetchData}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 md:w-auto w-full"
          style={{ background: 'var(--gradient-blue)', color: '#fff' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by user, merchant, location, device…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'low', 'medium', 'high'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase transition-all ${
                filter === f ? 'text-white' : ''
              }`}
              style={
                filter === f
                  ? { background: 'var(--gradient-blue)' }
                  : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }
              }>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0' }}>
        {loading ? (
          <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <TransactionTable transactions={filtered} />
        )}
      </div>
    </div>
  );
}
