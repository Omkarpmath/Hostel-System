import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  AlertTriangle, RefreshCw, Shield,
  User, Mail, Phone,
} from 'lucide-react';

interface UnassignedSecurityDashboardProps {
  securityUser: any;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const UnassignedSecurityDashboard: React.FC<UnassignedSecurityDashboardProps> = ({
  securityUser,
  onRefresh,
  isRefreshing,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <PageHeader
        title="Security Duty Portal"
        description="Campus security terminal and duty station portal"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: '0.875rem', height: '0.875rem' }} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Check Assignment</span>
          </button>
        }
      />

      {/* Main Notice Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: '1.25rem',
          padding: '2rem',
          background: isDark
            ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(180,83,9,0.2) 100%)'
            : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '1rem',
          backgroundColor: 'rgba(245,158,11,0.2)',
          border: '1px solid rgba(245,158,11,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#d97706',
        }}>
          <AlertTriangle style={{ width: '2rem', height: '2rem' }} />
        </div>

        <div>
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245,158,11,0.2)',
            color: '#b45309',
            fontSize: '0.6875rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            Status: Unassigned
          </span>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: isDark ? '#fef3c7' : '#78350f',
            margin: '0 0 0.5rem',
            letterSpacing: '-0.02em',
          }}>
            Currently Not Assigned to Any Duty
          </h2>
          <p style={{
            fontSize: '0.9375rem',
            color: isDark ? '#fde68a' : '#92400e',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Your account is authenticated, but the hostel administrator has not yet assigned you to a specific <strong>Hostel</strong> or <strong>Mess</strong>.
          </p>
        </div>

        <div style={{
          marginTop: '0.5rem',
          padding: '0.875rem 1.25rem',
          borderRadius: '0.75rem',
          backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(245,158,11,0.25)',
          fontSize: '0.8125rem',
          color: isDark ? '#e2e8f0' : '#475569',
          maxWidth: '500px',
          lineHeight: 1.5,
        }}>
          💡 <strong>Next step:</strong> Ask the administrator to assign your profile in the <em>Admin Security Management</em> panel. Once assigned, click <strong>"Check Assignment"</strong> above to immediately access your tools.
        </div>
      </motion.div>

      {/* Profile Details Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cardStyle}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Security Personnel Profile
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
            Registered credentials on file
          </p>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <User style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>Full Name</span>
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {securityUser?.firstName} {securityUser?.lastName}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Mail style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>Email Address</span>
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {securityUser?.email}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Phone style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>Phone</span>
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {securityUser?.phone || 'Not provided'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Shield style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>System Role</span>
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.25rem' }}>
              SECURITY STAFF
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
