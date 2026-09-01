import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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
        {/* Top bar (Desktop & Mobile) */}
        <header
          className="flex items-center justify-between h-14 px-4 md:px-8 border-b flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          {/* Mobile hamburger menu + Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-500/10 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
            </button>
            <span className="lg:hidden text-sm font-bold gradient-text">BMSCE Hostel</span>
          </div>

          <div className="hidden lg:block">
            <span className="text-xs font-semibold text-slate-400">
              BMS College of Engineering • Hostel Management System
            </span>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
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
