import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <BrowserRouter>
      {/* Subtle Noise Overlay for Realism */}
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0 opacity-[0.03]"></div>
      
      <div className="flex min-h-screen relative z-10">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main 
          className={`flex-1 overflow-auto transition-all duration-300 w-full ${
            isSidebarOpen 
              ? 'md:pl-64 pl-20' 
              : 'pl-20'
          }`}
        >
          <div className="p-8 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
