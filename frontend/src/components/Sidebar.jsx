import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, ShieldAlert, BarChart3, Shield, Menu, ChevronLeft } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/alerts', label: 'Alerts', icon: ShieldAlert },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  return (
    <aside 
      className={`fixed left-0 top-0 h-screen glass flex flex-col z-50 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}
      style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-white/5 min-h-[88px]">
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20"
            style={{ background: 'var(--gradient-blue)' }}>
            <Shield size={22} className="text-white" />
          </div>
          <div className="whitespace-nowrap">
            <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              FraudShield
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--accent-cyan)' }}>Risk Engine</p>
          </div>
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors mx-auto shrink-0"
        >
          {isOpen ? <ChevronLeft size={20} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'text-white shadow-lg shadow-blue-500/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              } ${!isOpen && 'justify-center px-0'}`
            }
            title={!isOpen ? label : ''}
            style={({ isActive }) =>
              isActive
                ? { background: 'var(--gradient-blue)', color: '#fff' }
                : {}
            }
          >
            <Icon size={20} className={`shrink-0 ${!isOpen && 'mx-auto'}`} />
            <span className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 hidden'}`}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-white/5">
        <div className={`flex items-center gap-3 transition-all duration-300 ${!isOpen && 'justify-center'}`}>
          <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/20"
            style={{ background: 'var(--gradient-purple)', color: '#fff' }}>
            A
          </div>
          <div className={`whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-[10px] uppercase tracking-wider text-purple-400">Risk Analyst</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
