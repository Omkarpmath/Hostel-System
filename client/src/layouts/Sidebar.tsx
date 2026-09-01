import { useState, useEffect } from 'react';
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
  LogOut,
  Sun,
  Moon,
  UtensilsCrossed,
  X,
  ChevronLeft,
  ChevronDown,
  GraduationCap,
  ScanLine,
  Megaphone,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

interface SubNavItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  subItems?: SubNavItem[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSectionsByRole: Record<Role, NavSection[]> = {
  ADMIN: [
    {
      title: 'WORKSPACE',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
        { label: 'Students', icon: GraduationCap, href: '/admin/students' },
        {
          label: 'Rooms & Allocations',
          icon: BedDouble,
          subItems: [
            { label: 'Rooms', href: '/admin/rooms' },
            { label: 'Allocations', href: '/admin/allocations' },
          ],
        },
        { label: 'Hostels', icon: Building2, href: '/admin/hostels' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Fees', icon: CreditCard, href: '/admin/fees' },
        { label: 'Mess', icon: UtensilsCrossed, href: '/admin/mess-fee-settings' },
        { label: 'Leave Requests', icon: ClipboardList, href: '/admin/leaves' },
        { label: 'Complaints', icon: MessageSquareWarning, href: '/admin/complaints' },
        { label: 'Visitors', icon: Users, href: '/admin/visitors' },
        { label: 'Attendance', icon: ScanLine, href: '/admin/attendance' },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        { label: 'Announcements', icon: Megaphone, href: '/admin/announcements' },
        { label: 'Notifications', icon: Bell, href: '/admin/notifications' },
      ],
    },
  ],
  WARDEN: [
    {
      title: 'WORKSPACE',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/warden/dashboard' },
        { label: 'Students', icon: GraduationCap, href: '/warden/students' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Leave Requests', icon: ClipboardList, href: '/warden/leaves' },
        { label: 'Complaints', icon: MessageSquareWarning, href: '/warden/complaints' },
        { label: 'Visitors', icon: Users, href: '/warden/visitors' },
        { label: 'Attendance', icon: ScanLine, href: '/warden/attendance' },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        { label: 'Announcements', icon: Megaphone, href: '/warden/announcements' },
        { label: 'Notifications', icon: Bell, href: '/warden/notifications' },
      ],
    },
  ],
  STUDENT: [
    {
      title: 'WORKSPACE',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/student/dashboard' },
        { label: 'My Profile', icon: Users, href: '/student/profile' },
        { label: 'Browse Rooms', icon: BedDouble, href: '/student/rooms' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Fees', icon: CreditCard, href: '/student/fees' },
        { label: 'Mess Fees', icon: UtensilsCrossed, href: '/student/mess-fees' },
        { label: 'Leave', icon: ClipboardList, href: '/student/leaves' },
        { label: 'Complaints', icon: MessageSquareWarning, href: '/student/complaints' },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        { label: 'Announcements', icon: Megaphone, href: '/student/announcements' },
        { label: 'Notifications', icon: Bell, href: '/student/notifications' },
      ],
    },
  ],
  ACCOUNTANT: [
    {
      title: 'WORKSPACE',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/accountant/dashboard' },
        { label: 'Notifications', icon: Bell, href: '/accountant/notifications' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Fees', icon: CreditCard, href: '/accountant/fees' },
      ],
    },
  ],
  SECURITY: [
    {
      title: 'WORKSPACE',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/security/dashboard' },
        { label: 'Notifications', icon: Bell, href: '/security/notifications' },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Night Attendance', icon: ScanLine, href: '/security/attendance' },
        { label: 'Attendance Log', icon: ClipboardList, href: '/security/attendance-log' },
        { label: 'Visitors', icon: Users, href: '/security/visitors' },
      ],
    },
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

  // Collapsible groups state (keyed by item label, e.g. "Rooms & Allocations")
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Rooms & Allocations': true,
  });

  // Auto-expand group if currently on one of its sub-routes
  useEffect(() => {
    if (location.pathname.startsWith('/admin/rooms') || location.pathname.startsWith('/admin/allocations')) {
      setOpenGroups((prev) => ({ ...prev, 'Rooms & Allocations': true }));
    }
  }, [location.pathname]);

  if (!user) return null;

  const sections = navSectionsByRole[user.role] || [];

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isUrlActive = (href?: string) => {
    if (!href) return false;
    return (
      location.pathname === href ||
      (href !== '/' &&
        location.pathname.startsWith(href) &&
        (location.pathname.length === href.length || location.pathname[href.length] === '/'))
    );
  };

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
        {/* Header Branding */}
        <div className={cn(
          'sidebar-content flex items-center h-[70px] px-4 border-b border-white/10 flex-shrink-0',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 shadow-lg shadow-blue-950/30 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                  BMSCE Hostel
                </h1>
                <p className="text-[10px] font-medium text-blue-200/70 truncate">
                  Management System
                </p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
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
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {window.innerWidth < 1024 ? (
              <X className="w-5 h-5" />
            ) : (
              <ChevronLeft
                className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  isCollapsed && 'rotate-180'
                )}
              />
            )}
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <nav className="sidebar-content flex-1 overflow-y-auto py-3 px-3 space-y-4 custom-scrollbar">
          {sections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="space-y-1">
              {/* Section Header */}
              {section.title && !isCollapsed && (
                <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200/40 select-none">
                  {section.title}
                </p>
              )}

              {/* Items in Section */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isGroupActive = hasSubItems
                    ? item.subItems!.some((sub) => isUrlActive(sub.href))
                    : isUrlActive(item.href);
                  const isGroupOpen = !!openGroups[item.label];

                  // ── CASE A: Grouped / Nested Navigation Item (e.g. Rooms & Allocations) ──
                  if (hasSubItems) {
                    if (isCollapsed) {
                      // In collapsed mode: Link directly to first sub-item, active if on any sub-item
                      return (
                        <Link
                          key={item.label}
                          to={item.subItems![0].href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'sidebar-nav-link flex items-center justify-center p-2 rounded-xl text-sm font-medium transition-all duration-200',
                            isGroupActive ? 'is-active' : ''
                          )}
                          title={item.label}
                        >
                          <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', isGroupActive ? 'text-blue-200' : 'text-blue-200/65')} />
                        </Link>
                      );
                    }

                    return (
                      <div key={item.label} className="space-y-0.5">
                        {/* Parent Collapsible Trigger */}
                        <button
                          type="button"
                          onClick={() => toggleGroup(item.label)}
                          className={cn(
                            'w-full sidebar-nav-link flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-left cursor-pointer select-none',
                            isGroupActive ? 'bg-white/[0.08] text-white' : 'hover:bg-white/[0.06] text-blue-100/80'
                          )}
                        >
                          <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', isGroupActive ? 'text-blue-200' : 'text-blue-200/65')} />
                          <span className="flex-1 font-medium">{item.label}</span>
                          <ChevronDown
                            className={cn(
                              'w-3.5 h-3.5 text-blue-200/50 transition-transform duration-200',
                              isGroupOpen && 'rotate-180 text-blue-200'
                            )}
                          />
                        </button>

                        {/* Collapsible Sub-items */}
                        <AnimatePresence initial={false}>
                          {isGroupOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-white/10 ml-5 my-0.5">
                                {item.subItems!.map((sub) => {
                                  const isSubActive = isUrlActive(sub.href);
                                  return (
                                    <Link
                                      key={sub.href}
                                      to={sub.href}
                                      onClick={() => setIsOpen(false)}
                                      className={cn(
                                        'sidebar-nav-link flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                                        isSubActive
                                          ? 'is-active font-semibold'
                                          : 'text-blue-200/70 hover:text-white hover:bg-white/[0.05]'
                                      )}
                                    >
                                      <span className={cn(
                                        'w-1.5 h-1.5 rounded-full transition-all',
                                        isSubActive ? 'bg-teal-300 shadow-[0_0_8px_rgba(94,234,212,0.8)]' : 'bg-white/20'
                                      )} />
                                      <span>{sub.label}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  // ── CASE B: Standard Single Navigation Link ──
                  return (
                    <Link
                      key={item.href || item.label}
                      to={item.href || '#'}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'sidebar-nav-link flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                        isCollapsed && 'justify-center px-2',
                        isGroupActive ? 'is-active' : ''
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', isGroupActive ? 'text-blue-200' : 'text-blue-200/65')} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                      {isGroupActive && !isCollapsed && (
                        <motion.div
                          layoutId="active-nav"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(94,234,212,0.9)] flex-shrink-0"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / Account Area */}
        <div className="sidebar-content p-3 border-t border-white/10 space-y-1 flex-shrink-0">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-blue-100/75 hover:bg-white/10 hover:text-white',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 flex-shrink-0 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 flex-shrink-0 text-blue-200" />
            )}
            {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-blue-100/75 hover:bg-red-400/10 hover:text-red-200',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-red-300/80" />
            {!isCollapsed && <span>Logout</span>}
          </button>

          {/* Compact User Info Card */}
          {!isCollapsed && user && (
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl mt-1.5 bg-white/[0.06] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.firstName.charAt(0)}{user.lastName?.charAt(0) || ''}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate text-white leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] truncate text-blue-200/60 leading-tight">
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
