import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '@/api/auth.api';
import { useTheme } from '@/providers/ThemeProvider';
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
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

const VIDEO_URL = 'https://res.cloudinary.com/xkjefedn/video/upload/q_auto,f_mp4,c_limit,w_1920/FINAL.mp4';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.resetPassword({ email, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
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
                  Hostel Management System
                </p>
              </div>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#67e8f9' }}>
                Account Security
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
                Restore your
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #93c5fd 0%, #67e8f9 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  account access.
                </span>
              </h2>
            </div>

            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: '3rem' }}>
              Securely reset your password using your registered institutional email address to regain immediate access to your hostel portal.
            </p>

            {/* Security Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { title: 'Encrypted Credential Sync', desc: 'Industry-standard password hashing' },
                { title: 'Immediate Access', desc: 'Seamless sign-in with your new key' },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <ShieldCheck style={{ width: '1.125rem', height: '1.125rem', color: '#67e8f9' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'white', margin: 0 }}>{item.title}</p>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right panel — Floating Glassmorphism Reset Password Form */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ padding: '0.375rem', borderRadius: '0.5rem', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                  <KeyRound style={{ width: '1.125rem', height: '1.125rem' }} />
                </div>
                <h2 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Reset Password
                </h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500, marginTop: '0.375rem', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                Enter your email and new password to restore your account
              </p>
            </div>

            {/* Success Notification */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  borderRadius: '1rem',
                  backgroundColor: 'rgba(22, 163, 74, 0.25)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #16a34a',
                }}
              >
                <CheckCircle2 style={{ width: '2.5rem', height: '2.5rem', color: '#4ade80', margin: '0 auto' }} />
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#4ade80', marginTop: '0.75rem' }}>
                  Password Reset Successfully!
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#e2e8f0', marginTop: '0.25rem' }}>
                  Redirecting to login portal...
                </p>
              </motion.div>
            ) : (
              <>
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Email */}
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      Institutional Email
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
                        style={inputStyle}
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

                  {/* New Password */}
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '0.375rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      New Password
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
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        style={{
                          ...inputStyle,
                          paddingRight: '2.75rem',
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
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
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>

                  {/* Back to Login Button */}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.20)',
                      backdropFilter: 'blur(8px)',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'background-color 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
                    Back to Login
                  </button>
                </form>
              </>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#f1f5f9', marginTop: '1.5rem', marginBottom: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              Remember your password?{' '}
              <Link to="/login" style={{ color: '#38bdf8', fontWeight: 800, textDecoration: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                Sign in
              </Link>
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
