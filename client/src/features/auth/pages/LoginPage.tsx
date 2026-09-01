import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { getDashboardPath } from '@/lib/utils';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

const VIDEO_URL = 'https://res.cloudinary.com/xkjefedn/video/upload/q_auto,f_mp4,c_limit,w_1920/FINAL.mp4';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // If user already has an active persistent session, redirect immediately to their dashboard
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);
      navigate(getDashboardPath(loggedInUser.role));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0a0f1d', // Fallback background while video loads
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
            width: '52%',
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
            style={{ maxWidth: '34rem' }}
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
                  Campus Hostel Management System
                </p>
              </div>
            </div>

            {/* Headline */}
            <h2
              style={{
                fontSize: '3rem',
                fontWeight: 900,
                lineHeight: 1.12,
                marginBottom: '1.25rem',
                letterSpacing: '-0.03em',
              }}
            >
              Modern Hostel
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #93c5fd 0%, #67e8f9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Management Platform
              </span>
            </h2>

            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: '3rem' }}>
              Streamline residential campus operations with real-time room allocation, automated fee management,
              digital leave tracking, and instant QR night attendance roll calls.
            </p>

            {/* Feature cards with rich glassmorphism */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Room Allocation', desc: 'Real-time room booking' },
                { label: 'Fee Management', desc: 'Online instant receipts' },
                { label: 'Digital QR ID', desc: 'Roll call verification' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '1rem',
                    padding: '1.25rem 1rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                    <Sparkles style={{ width: '0.875rem', height: '0.875rem', color: '#67e8f9' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'white', margin: 0 }}>{feature.label}</p>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right panel — Floating Glassmorphism Login Form */}
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
              maxWidth: '28rem',
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
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
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                Welcome back
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500, marginTop: '0.375rem', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                Sign in to your account to access your hostel portal
              </p>
            </div>

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
                  marginBottom: '1.25rem',
                }}
              >
                <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Email */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '1.125rem',
                      height: '1.125rem',
                      color: '#e2e8f0',
                    }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@bmsce.ac.in"
                    required
                    autoComplete="email"
                    style={{
                      width: '100%',
                      height: '2.75rem',
                      boxSizing: 'border-box',
                      paddingLeft: '2.75rem',
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
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#38bdf8';
                      e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    style={{
                      position: 'absolute',
                      left: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '1.125rem',
                      height: '1.125rem',
                      color: '#e2e8f0',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      height: '2.75rem',
                      boxSizing: 'border-box',
                      paddingLeft: '2.75rem',
                      paddingRight: '2.75rem',
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
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#38bdf8';
                      e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.875rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      color: '#e2e8f0',
                    }}
                  >
                    {showPassword ? (
                      <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} />
                    ) : (
                      <Eye style={{ width: '1.125rem', height: '1.125rem' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.25rem' }}>
                <a
                  href="/reset-password"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#67e8f9',
                    textDecoration: 'none',
                    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0d9488 100%)',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 16px rgba(37,99,235,0.45)',
                  transition: 'opacity 0.2s, transform 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontFamily: 'inherit',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 style={{ width: '1.125rem', height: '1.125rem', animation: 'spin 1s linear infinite' }} />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#f1f5f9', marginTop: '1.5rem', marginBottom: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              New here?{' '}
              <a href="/register" style={{ color: '#38bdf8', fontWeight: 800, textDecoration: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                Create an account
              </a>
            </p>

            {/* Footer */}
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.75)', marginTop: '2rem', marginBottom: 0, lineHeight: 1.5, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
              BMS College of Engineering, Bengaluru
              <br />
              © {new Date().getFullYear()} Hostel Management System
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
