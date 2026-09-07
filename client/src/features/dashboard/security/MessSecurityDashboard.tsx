import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { messEntryApi } from '@/api/messEntry.api';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  UtensilsCrossed, CheckCircle2,
  ArrowRight, UserCheck,
  ArrowUpRight, Building2, Users,
} from 'lucide-react';

interface MessSecurityDashboardProps {
  securityUser: any;
}

export const MessSecurityDashboard: React.FC<MessSecurityDashboardProps> = ({ securityUser }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const assignedMess = securityUser?.assignedMess || null;
  const assignedMessName = assignedMess?.name || null;

  // Fetch mess today stats
  const { data: messStatsData } = useQuery({
    queryKey: ['mess-entry-stats'],
    queryFn: () => messEntryApi.getStats(),
    refetchInterval: 8000,
  });
  const messStats = messStatsData?.data?.data;
  const messName = assignedMessName || messStats?.mess?.name || 'Main Campus Mess';

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
        title="Mess Dining Dashboard"
        description="Student dining entry verification and live meal scanning terminal"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.45rem 0.875rem', borderRadius: '0.625rem',
            backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb',
            border: '1px solid rgba(245,158,11,0.3)',
            color: isDark ? '#fbbf24' : '#b45309',
            fontSize: '0.8125rem', fontWeight: 600,
          }}>
            <UtensilsCrossed style={{ width: '0.9375rem', height: '0.9375rem' }} />
            <span>Assigned: <strong>{messName}</strong></span>
          </div>
        }
      />

      {/* Hero Mess Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: '1rem',
          padding: '1.5rem 1.75rem',
          background: 'linear-gradient(135deg, #78350f 0%, #b45309 55%, #d97706 100%)',
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
              backgroundColor: 'rgba(255,255,255,0.25)',
              fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.05em',
            }}>
              <span style={{
                width: '0.45rem', height: '0.45rem', borderRadius: '50%',
                backgroundColor: '#4ade80', display: 'inline-block',
              }} />
              MESS VERIFICATION ACTIVE
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
            Dining Hall Entry Scanner — {messName}
          </h2>
          <p style={{ fontSize: '0.8125rem', opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
            Scan student dynamic rotating QR codes to verify active hostel room allocation and admit residents for dining.
          </p>
        </div>

        <Link
          to="/security/mess-entry"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.25rem', borderRadius: '0.625rem',
            backgroundColor: 'white', color: '#78350f',
            fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s ease',
          }}
        >
          <UtensilsCrossed style={{ width: '1rem', height: '1rem' }} />
          Launch Mess Scanner
          <ArrowRight style={{ width: '0.875rem', height: '0.875rem' }} />
        </Link>
      </motion.div>

      {/* Mess Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Metric 1: Assigned Mess */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Duty Mess Facility
              </div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.375rem', lineHeight: 1.2 }}>
                {messName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 style={{ width: '0.75rem', height: '0.75rem' }} />
                <span>Duty Active</span>
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <UtensilsCrossed style={{ width: '1.125rem', height: '1.125rem', color: '#f59e0b' }} />
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Today's Total Entries */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Today's Total Entries
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1 }}>
                {messStats?.todayCount ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                Students scanned & admitted
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <UserCheck style={{ width: '1.125rem', height: '1.125rem', color: '#16a34a' }} />
            </div>
          </div>
        </motion.div>

        {/* Metric 3: Eligibility Rule */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Resident Eligibility
              </div>
              <div style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.375rem', lineHeight: 1.2 }}>
                All Hostels
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                Active room allocation required
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
      </div>

      {/* Operations & Tools for Mess */}
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Mess Operations & Tools
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[
            {
              title: 'Mess QR Scanner',
              description: 'Launch the camera scanner to verify dynamic rotating QR codes for student dining admission.',
              icon: UtensilsCrossed,
              href: '/security/mess-entry',
              color: '#d97706',
              bgLight: '#fffbeb',
              cta: 'Open Scanner',
            },
            {
              title: 'Live Counter Monitor',
              description: 'Lightweight, ultra-fast daily attendance tallying with zero database lag or slow logging.',
              icon: Users,
              href: '/security/mess-entry',
              color: '#0d9488',
              bgLight: '#f0fdfa',
              cta: 'View Live Count',
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
                  <span>{action.cta}</span>
                  <ArrowUpRight style={{ width: '0.875rem', height: '0.875rem' }} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Protocol Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={cardStyle}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isDark ? '#fbbf24' : '#d97706',
            }}>
              <UtensilsCrossed style={{ width: '1.125rem', height: '1.125rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Mess Admission Protocol
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.125rem 0 0' }}>
                Fast verification with lightweight count tracking
              </p>
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
            Students residing in any BMSCE hostel are admitted to the main mess facility. The scanner verifies cryptographic rotating QR codes in real-time and records the admission tally instantly without storing individual scan logs.
          </p>
          <Link
            to="/security/mess-entry"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.25rem', borderRadius: '0.625rem',
              backgroundColor: '#d97706', color: 'white', fontWeight: 700,
              fontSize: '0.8125rem', textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(217,119,6,0.25)',
            }}
          >
            <UtensilsCrossed style={{ width: '0.875rem', height: '0.875rem' }} />
            <span>Launch Mess Scanner</span>
            <ArrowRight style={{ width: '0.875rem', height: '0.875rem' }} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
