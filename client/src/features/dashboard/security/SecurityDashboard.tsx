import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { attendanceApi } from '@/api/attendance.api';
import { operationsApi } from '@/api/operations.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  ScanLine, ClipboardList, Users, Building2,
  ArrowRight, UserCheck, AlertTriangle,
  ArrowUpRight, CheckCircle2,
} from 'lucide-react';

export function SecurityDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 1. Fetch live user profile to get fresh assigned hostel
  const { data: profileData } = useQuery({
    queryKey: ['security-profile'],
    queryFn: () => authApi.getProfile(),
    staleTime: 30000,
  });
  const securityUser = (profileData?.data as any)?.data || user;

  // 2. Fetch today's attendance session
  const { data: activeSessionData } = useQuery({
    queryKey: ['active-attendance-session'],
    queryFn: () => attendanceApi.getActiveSession(),
    refetchInterval: 5000,
  });
  const todaySession = (activeSessionData?.data as any)?.data || null;
  const isSessionActive = todaySession?.status === 'ACTIVE';
  const isSessionCompleted = todaySession?.status === 'COMPLETED';
  const scannedCount = todaySession?._count?.records ?? (todaySession?.records?.length || 0);

  // 3. Fetch visitor logs
  const { data: visitorsData } = useQuery({
    queryKey: ['visitors'],
    queryFn: () => operationsApi.visitors(),
    retry: 1,
  });
  const visitors: any[] = (visitorsData?.data as any)?.data || [];

  const assignedHostel = securityUser?.assignedHostel || todaySession?.hostel || null;
  const assignedHostelName = assignedHostel?.name || null;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.875rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Security Dashboard"
        description="Night curfew attendance management and campus gate access control"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          assignedHostelName ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.45rem 0.875rem', borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
              border: '1px solid rgba(59,130,246,0.25)',
              color: isDark ? '#93c5fd' : '#1d4ed8',
              fontSize: '0.8125rem', fontWeight: 600,
            }}>
              <Building2 style={{ width: '0.9375rem', height: '0.9375rem' }} />
              <span>Assigned: <strong>{assignedHostelName}</strong></span>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.45rem 0.875rem', borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
              border: '1px solid rgba(245,158,11,0.3)',
              color: isDark ? '#fbbf24' : '#b45309',
              fontSize: '0.8125rem', fontWeight: 600,
            }}>
              <AlertTriangle style={{ width: '0.9375rem', height: '0.9375rem' }} />
              <span>Unassigned Location</span>
            </div>
          )
        }
      />

      {/* Hero Curfew Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: '1rem',
          padding: '1.5rem 1.75rem',
          background: isSessionActive
            ? 'linear-gradient(135deg, #065f46 0%, #047857 55%, #0f766e 100%)'
            : isSessionCompleted
              ? 'linear-gradient(135deg, #1e293b 0%, #334155 55%, #0f766e 100%)'
              : 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #0d9488 100%)',
          color: 'white',
          boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ maxWidth: '34rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.2rem 0.55rem', borderRadius: '9999px',
              backgroundColor: isSessionActive
                ? 'rgba(255,255,255,0.25)'
                : isSessionCompleted
                  ? 'rgba(16,185,129,0.3)'
                  : 'rgba(255,255,255,0.2)',
              fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.05em',
            }}>
              {isSessionActive && (
                <span style={{
                  width: '0.45rem', height: '0.45rem', borderRadius: '50%',
                  backgroundColor: '#4ade80', display: 'inline-block',
                }} />
              )}
              {isSessionActive ? 'SESSION ACTIVE' : isSessionCompleted ? 'COMPLETED TONIGHT' : 'CURFEW STANDBY'}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            {isSessionActive
              ? `Attendance session in progress for ${todaySession.hostel?.name || assignedHostelName || 'Hostel'}`
              : isSessionCompleted
                ? `Night Attendance Completed for ${todaySession.hostel?.name || assignedHostelName || 'Hostel'}`
                : assignedHostelName
                  ? `Ready for ${assignedHostelName} Night Attendance`
                  : 'Hostel Assignment Required'}
          </h2>
          <p style={{ fontSize: '0.8125rem', opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
            {isSessionActive
              ? `Started at ${new Date(todaySession.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Total scanned: ${scannedCount} student${scannedCount !== 1 ? 's' : ''}.`
              : isSessionCompleted
                ? `Session ended at ${todaySession.endedAt ? new Date(todaySession.endedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'curfew'}. Verified ${scannedCount} student${scannedCount !== 1 ? 's' : ''}.`
                : assignedHostelName
                  ? 'Launch the QR scanner to record nightly student attendance and automatically verify leave approvals.'
                  : 'Please contact the administrator to assign your security account to a hostel block in Admin Settings.'}
          </p>
        </div>

        <Link
          to={isSessionCompleted ? '/security/attendance-log' : '/security/attendance'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.25rem', borderRadius: '0.625rem',
            backgroundColor: 'white', color: isSessionActive ? '#065f46' : isSessionCompleted ? '#0f766e' : '#1e3a8a',
            fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s ease',
          }}
        >
          {isSessionCompleted ? <ClipboardList style={{ width: '1rem', height: '1rem' }} /> : <ScanLine style={{ width: '1rem', height: '1rem' }} />}
          {isSessionActive ? 'Open Scanner' : isSessionCompleted ? 'View Register' : 'Start Session'}
          <ArrowRight style={{ width: '0.875rem', height: '0.875rem' }} />
        </Link>
      </motion.div>

      {/* Modern Compact Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Duty Location */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Duty Location
              </div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.375rem', lineHeight: 1.2 }}>
                {assignedHostelName || 'Unassigned'}
              </div>
              <div style={{ fontSize: '0.75rem', color: assignedHostelName ? '#16a34a' : '#d97706', marginTop: '0.375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {assignedHostelName ? <CheckCircle2 style={{ width: '0.75rem', height: '0.75rem' }} /> : <AlertTriangle style={{ width: '0.75rem', height: '0.75rem' }} />}
                <span>{assignedHostelName ? 'Assigned & Active' : 'Action Required'}</span>
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 style={{ width: '1.125rem', height: '1.125rem', color: '#3b82f6' }} />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Curfew Session Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Curfew Session
              </div>
              <div style={{
                fontSize: '1.0625rem', fontWeight: 800,
                color: isSessionActive ? '#16a34a' : isSessionCompleted ? '#0d9488' : 'var(--text-primary)',
                marginTop: '0.375rem', lineHeight: 1.2,
              }}>
                {isSessionActive ? 'Session Active' : isSessionCompleted ? 'Completed' : 'Standby'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                {isSessionActive ? 'Scanning in progress' : isSessionCompleted ? 'Tonight\'s check completed' : 'Ready for evening check'}
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isSessionActive
                ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                : isSessionCompleted
                  ? (isDark ? 'rgba(13,148,136,0.15)' : '#f0fdfa')
                  : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isSessionCompleted ? (
                <CheckCircle2 style={{ width: '1.125rem', height: '1.125rem', color: '#0d9488' }} />
              ) : (
                <ScanLine style={{ width: '1.125rem', height: '1.125rem', color: isSessionActive ? '#16a34a' : '#f59e0b' }} />
              )}
            </div>
          </div>
        </motion.div>

        {/* Card 3: Checked-in Count */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Session Scans
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1 }}>
                {scannedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                {isSessionCompleted ? 'Students verified' : 'Students marked present'}
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : '#f0fdfa',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <UserCheck style={{ width: '1.125rem', height: '1.125rem', color: '#0d9488' }} />
            </div>
          </div>
        </motion.div>

        {/* Card 4: Visitors Logged */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Visitors Logged
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1 }}>
                {visitors.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                Gate entries recorded
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#f5f3ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Users style={{ width: '1.125rem', height: '1.125rem', color: '#8b5cf6' }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Action Navigation Tiles */}
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Operations & Tools
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            {
              title: 'Night Attendance Scanner',
              description: 'Launch QR scanner for nightly curfew checks with automated approved leave verification.',
              icon: ScanLine,
              href: '/security/attendance',
              color: '#3b82f6',
              bgLight: '#eff6ff',
            },
            {
              title: 'Attendance Logs & Registers',
              description: 'Review daily registers, filter by status (Present, On Leave, Absent), and export CSV reports.',
              icon: ClipboardList,
              href: '/security/attendance-log',
              color: '#0d9488',
              bgLight: '#f0fdfa',
            },
            {
              title: 'Visitor Entry Management',
              description: 'Record incoming visitors, check IDs, and track campus check-in and check-out times.',
              icon: Users,
              href: '/security/visitors',
              color: '#8b5cf6',
              bgLight: '#f5f3ff',
            },
          ].map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              style={cardStyle}
            >
              <Link
                to={action.href}
                style={{
                  display: 'flex', flexDirection: 'column', height: '100%',
                  padding: '1.25rem', textDecoration: 'none', color: 'inherit',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : action.bgLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '0.875rem',
                  }}>
                    <action.icon style={{ width: '1.25rem', height: '1.25rem', color: action.color }} />
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                    {action.title}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    {action.description}
                  </p>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  color: action.color, fontSize: '0.75rem', fontWeight: 700,
                  marginTop: '1rem',
                }}>
                  <span>Open Tool</span>
                  <ArrowUpRight style={{ width: '0.875rem', height: '0.875rem' }} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Visitors Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={cardStyle}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Recent Visitors Log
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              Latest entries logged at the campus gate
            </p>
          </div>
          <Link
            to="/security/visitors"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
            }}
          >
            <span>View All</span>
            <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
          </Link>
        </div>

        {visitors.length > 0 ? (
          <div style={{ padding: 0 }}>
            {visitors.slice(0, 5).map((v: any, i: number) => (
              <div
                key={v.id || i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.875rem 1.25rem',
                  borderBottom: i < Math.min(visitors.length, 5) - 1 ? '1px solid var(--border-primary)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2rem', height: '2rem', borderRadius: '50%',
                    backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#f5f3ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDark ? '#a78bfa' : '#7c3aed', fontSize: '0.6875rem', fontWeight: 800,
                  }}>
                    {(v.visitorName?.[0] || 'V').toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {v.visitorName}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: '0.0625rem 0 0' }}>
                      Visiting: {v.student?.user?.firstName || 'Student'} ({v.relationship || 'Visitor'}) · {v.purpose || 'Visit'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={v.status || 'PENDING'} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No visitor records yet"
            description="Visitor check-ins and check-outs will be listed here."
          />
        )}
      </motion.div>
    </div>
  );
}


