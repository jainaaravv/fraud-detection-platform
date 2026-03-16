const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

export const api = {
  getTransactions: (limit = 50) => request(`/transactions?limit=${limit}`),
  getAlerts: (limit = 50) => request(`/alerts?limit=${limit}`),
  getAnalytics: () => request('/analytics'),
  getOverTime: () => request('/analytics/over-time'),
  getRiskDistribution: () => request('/analytics/risk-distribution'),
  getLocationStats: () => request('/analytics/locations'),
  getDeviceRisk: () => request('/analytics/devices'),
  getUserRisk: () => request('/analytics/users'),
  predict: (data) => request('/predict', { method: 'POST', body: JSON.stringify(data) }),
  createTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
};
