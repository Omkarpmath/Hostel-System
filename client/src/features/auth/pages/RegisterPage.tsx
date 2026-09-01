import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  Phone,
  User,
  Shield,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useTheme } from '@/providers/ThemeProvider';
import type { Role } from '@/types';

const VIDEO_URL = 'https://res.cloudinary.com/xkjefedn/video/upload/q_auto,f_mp4,c_limit,w_1920/FINAL.mp4';

const roles: Array<{ value: Role; label: string }> = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'ADMIN', label: 'Hostel Office / Admin' },
  { value: 'WARDEN', label: 'Warden' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'SECURITY', label: 'Security Staff' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'STUDENT' as Role,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.register(form);
      setSuccess(true);
      window.setTimeout(() => navigate('/login'), 1600);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '2.75rem',
    boxSizing: 'border-box',
    paddingLeft: '2.5rem',
    paddingRight: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.35)',
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#ffffff',
    fontSize: '0.9375rem',
    fontWeight: 600,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0a0f1d',
        fontFamily: 'inherit',
      }}
    >
      {/* ─── 1. Full-Screen Native Looping Background Video ─── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* ─── 2. Cinematic Gradient Ambient Overlay ─── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: isDark
            ? 'linear-gradient(135deg, rgba(8, 15, 30, 0.86) 0%, rgba(15, 32, 68, 0.74) 45%, rgba(6, 12, 24, 0.92) 100%)'
            : 'linear-gradient(135deg, rgba(10, 24, 55, 0.80) 0%, rgba(20, 52, 110, 0.68) 45%, rgba(10, 32, 50, 0.84) 100%)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* ─── 3. Foreground Content Layer ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
        }}
      >
        {/* Left panel — Branding (hidden on mobile, visible on desktop) */}
        <div
          style={{
            display: 'none',
            width: '48%',
            position: 'relative',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '4.5rem 4rem',
            color: 'white',
          }}
          className="lg:!flex"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: '32rem' }}
          >
            {/* Logo Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
              <div
                style={{
                  width: '3.75rem',
                  height: '3.75rem',
                  borderRadius: '1.125rem',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Building2 style={{ width: '2rem', height: '2rem' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>BMSCE</h1>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                      color: '#93c5fd',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Hostels
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', opacity: 0.85, fontWeight: 500, margin: '0.125rem 0 0' }}>
                  Hostel Management System
                </p>
              </div>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#67e8f9' }}>
                Account Setup
              </span>
              <h2
                style={{
                  fontSize: '3rem',
                  fontWeight: 900,
                  lineHeight: 1.12,
                  marginTop: '0.5rem',
                  letterSpacing: '-0.03em',
                }}
              >
                Join the hostel
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #93c5fd 0%, #67e8f9 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  platform.
                </span>
              </h2>
            </div>

            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: '3rem' }}>
              Create the right account for your campus role and manage hostel services, room bookings, attendance, and fee invoices from one secure workspace.
            </p>

            {/* Feature pill highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { title: 'Students', sub: 'Book rooms, pay mess fees, track night roll calls' },
                { title: 'Staff & Wardens', sub: 'Manage occupancy, leaves, complaints & visitors' },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '0.875rem',
                    padding: '0.875rem 1.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'white' }}>{item.title}: </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>{item.sub}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right panel — Floating Glassmorphism Registration Form */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem 1.5rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '100%',
              maxWidth: '32rem',
              borderRadius: '1.75rem',
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.38)' : 'rgba(255, 255, 255, 0.30)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(255, 255, 255, 0.45)',
              boxShadow: isDark
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 25px 50px -12px rgba(0, 20, 60, 0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
              padding: '2.5rem 2.25rem',
            }}
          >
            {/* Header: Theme Toggle & Mobile Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              {/* Mobile Logo */}
              <div className="lg:!hidden" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #1e40af 0%, #0d9488 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <Building2 style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>BMSCE Hostel</h1>
                  <p style={{ fontSize: '0.6875rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)', margin: 0 }}>Management System</p>
                </div>
              </div>

              <div className="hidden lg:!block" />

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                style={{
                  padding: '0.625rem',
                  borderRadius: '0.75rem',
                  border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.4)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                {isDark ? (
                  <Sun style={{ width: '1.25rem', height: '1.25rem', color: '#fbbf24' }} />
                ) : (
                  <Moon style={{ width: '1.25rem', height: '1.25rem', color: '#1e40af' }} />
                )}
              </button>
            </div>

            {/* Welcome Heading */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ padding: '0.375rem', borderRadius: '0.5rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                  <UserPlus style={{ width: '1.125rem', height: '1.125rem' }} />
                </div>
                <h2 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Create an account
                </h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500, marginTop: '0.25rem', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                Fill in your credentials to register for your campus portal
              </p>
            </div>

            {/* Success Notification */}
            {success ? (
              <div style={{ padding: '2rem', textAlign: 'center', borderRadius: '1rem', backgroundColor: 'rgba(22, 163, 74, 0.25)', backdropFilter: 'blur(8px)', border: '1px solid #16a34a' }}>
                <CheckCircle2 style={{ width: '2.5rem', height: '2.5rem', color: '#4ade80', margin: '0 auto' }} />
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#4ade80', marginTop: '0.75rem' }}>
                  Account Created Successfully
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#e2e8f0', marginTop: '0.25rem' }}>
                  Taking you to sign in...
                </p>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      backgroundColor: 'rgba(220, 38, 38, 0.25)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                    }}
                  >
                    <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* First Name & Last Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      First name *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#e2e8f0' }} />
                      <input
                        required
                        value={form.firstName}
                        onChange={(e) => update('firstName', e.target.value)}
                        placeholder="First"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      Last name *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#e2e8f0' }} />
                      <input
                        required
                        value={form.lastName}
                        onChange={(e) => update('lastName', e.target.value)}
                        placeholder="Last"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#e2e8f0' }} />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="you@bmsce.ac.in"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Phone & Role */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      Phone <span style={{ fontWeight: 400, color: '#cbd5e1' }}>(optional)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#e2e8f0' }} />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        placeholder="+91..."
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      Campus Role *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Shield style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#e2e8f0' }} />
                      <select
                        value={form.role}
                        onChange={(e) => update('role', e.target.value)}
                        style={{
                          ...inputStyle,
                          cursor: 'pointer',
                          appearance: 'auto',
                        }}
                      >
                        {roles.map((r) => (
                          <option key={r.value} value={r.value} style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 600 }}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#e2e8f0' }} />
                    <input
                      required
                      minLength={6}
                      type="password"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="Minimum 6 characters"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    padding: '0.875rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0d9488 100%)',
                    color: 'white',
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 4px 16px rgba(37,99,235,0.45)',
                    transition: 'opacity 0.2s, transform 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 style={{ width: '1.125rem', height: '1.125rem', animation: 'spin 1s linear infinite' }} />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </form>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#f1f5f9', marginTop: '1.5rem', marginBottom: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#38bdf8', fontWeight: 800, textDecoration: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
