import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
 

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="dashboard-shell flex h-screen overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      <div className="dashboard-main flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header
          className="lg:hidden flex items-center h-14 px-4 border-b"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <Menu className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          </button>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm font-bold gradient-text">BMSCE Hostel</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] p-5 md:p-8 lg:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
