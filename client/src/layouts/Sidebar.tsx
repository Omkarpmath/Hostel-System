 
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  Users,
  CreditCard,
  ClipboardList,
  MessageSquareWarning,
  QrCode,
  UserCheck,
  Shield,
  LogOut,
  Sun,
  Moon,
  
  X,
  ChevronLeft,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const navByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { label: 'Hostels', icon: Building2, href: '/admin/hostels' },
    { label: 'Rooms', icon: BedDouble, href: '/admin/rooms' },
    { label: 'Students', icon: GraduationCap, href: '/admin/students' },
    { label: 'Allocations', icon: UserCheck, href: '/admin/allocations' },
    { label: 'Fees', icon: CreditCard, href: '/admin/fees' },
    { label: 'Leave Requests', icon: ClipboardList, href: '/admin/leaves' },
    { label: 'Complaints', icon: MessageSquareWarning, href: '/admin/complaints' },
    { label: 'Visitors', icon: Users, href: '/admin/visitors' },
  ],
  STUDENT: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/student/dashboard' },
    { label: 'My Profile', icon: Users, href: '/student/profile' },
    { label: 'Browse Rooms', icon: BedDouble, href: '/student/rooms' },
    { label: 'Fees', icon: CreditCard, href: '/student/fees' },
    { label: 'Leave', icon: ClipboardList, href: '/student/leaves' },
    { label: 'Complaints', icon: MessageSquareWarning, href: '/student/complaints' },
    { label: 'Visitors', icon: Users, href: '/student/visitors' },
  ],
  WARDEN: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/warden/dashboard' },
    { label: 'Students', icon: GraduationCap, href: '/warden/students' },
    { label: 'Leave Requests', icon: ClipboardList, href: '/warden/leaves' },
    { label: 'Complaints', icon: MessageSquareWarning, href: '/warden/complaints' },
    { label: 'QR Verify', icon: QrCode, href: '/warden/verify' },
  ],
  ACCOUNTANT: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/accountant/dashboard' },
    { label: 'Fees', icon: CreditCard, href: '/accountant/fees' },
    { label: 'Receipts', icon: ClipboardList, href: '/accountant/receipts' },
  ],
  SECURITY: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/security/dashboard' },
    { label: 'QR Verify', icon: QrCode, href: '/security/verify' },
    { label: 'Leave Verify', icon: ClipboardList, href: '/security/leaves' },
    { label: 'Visitors', icon: Users, href: '/security/visitors' },
    { label: 'Logs', icon: Shield, href: '/security/logs' },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const navItems = navByRole[user.role] || [];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: 'var(--overlay)' }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar-shell fixed top-0 left-0 z-50 h-screen flex flex-col border-r transition-all duration-300',
          'lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          'sidebar-content flex items-center h-[76px] px-4 border-b border-white/10',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 shadow-lg shadow-blue-950/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">
                  BMSCE Hostel
                </h1>
                <p className="text-[10px] font-medium text-blue-200/70">
                  Management System
                </p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsOpen(false);
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className={cn(
              'p-1.5 rounded-lg text-blue-100/70 transition-colors hover:bg-white/10 hover:text-white',
              isCollapsed && 'hidden lg:block'
            )}
          >
            {window.innerWidth < 1024 ? (
              <X className="w-5 h-5" />
            ) : (
              <ChevronLeft
                className={cn(
                  'w-5 h-5 transition-transform',
                  isCollapsed && 'rotate-180'
                )}
              />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-content flex-1 overflow-y-auto py-5 px-3 space-y-1">
          {!isCollapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200/45">Workspace</p>}
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'sidebar-nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isCollapsed && 'justify-center px-2',
                  isActive
                    ? 'is-active'
                    : ''
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', isActive ? 'text-blue-200' : 'text-blue-200/65')} />
                {!isCollapsed && <span>{item.label}</span>}
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="active-nav"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(94,234,212,0.9)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-content p-3 border-t border-white/10 space-y-1.5">
          <button
            onClick={toggleTheme}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-blue-100/75 hover:bg-white/10 hover:text-white',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0" />
            )}
            {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-blue-100/75 hover:bg-red-400/10 hover:text-red-200',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>

          {/* User info */}
          {!isCollapsed && user && (
            <div
              className="flex items-center gap-3 px-3 py-3 rounded-xl mt-2 bg-white/[0.08] border border-white/[0.07]"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-sm font-bold">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs truncate text-blue-200/60">
                  {user.role}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
