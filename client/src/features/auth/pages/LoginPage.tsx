import { useState } from 'react';
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
} from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        display: 'flex',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {/* Left panel — Branding (hidden on mobile) */}
      <div
        style={{
          display: 'none',
          width: '50%',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 40%, #0d9488 100%)',
        }}
        className="lg:!flex"
      >
        {/* Pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '4rem',
            color: 'white',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '1rem',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 style={{ width: '1.75rem', height: '1.75rem' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em' }}>BMSCE</h1>
                <p style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 500 }}>Hostel Management System</p>
              </div>
            </div>

            {/* Headline */}
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
              Modern Hostel
              <br />
              <span style={{ opacity: 0.75 }}>Management Platform</span>
            </h2>

            <p style={{ fontSize: '1.125rem', opacity: 0.55, maxWidth: '28rem', marginBottom: '3.5rem', lineHeight: 1.7 }}>
              Streamline hostel operations with room allocation, fee management,
              leave tracking, and digital verification — all in one place.
            </p>

            {/* Feature cards */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[
                { label: 'Room Allocation', desc: 'Real-time booking' },
                { label: 'Fee Management', desc: 'Payment tracking' },
                { label: 'Digital QR ID', desc: 'Instant verification' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '0.875rem',
                    padding: '1.25rem',
                    border: '1px solid rgba(255,255,255,0.12)',
                    flex: 1,
                  }}
                >
                  <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>{feature.label}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.375rem' }}>{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — Login Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: '26rem' }}
        >
          {/* Theme toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <button
              onClick={toggleTheme}
              style={{
                padding: '0.625rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-card)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'dark' ? (
                <Sun style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-secondary)' }} />
              ) : (
                <Moon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-secondary)' }} />
              )}
            </button>
          </div>

          {/* Mobile logo */}
          <div className="lg:!hidden" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #1e40af 0%, #0d9488 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>BMSCE Hostel</h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Management System</p>
            </div>
          </div>

          {/* Welcome */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>
              Sign in to your account to continue
            </p>
          </div>


          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: theme === 'dark' ? 'rgba(220,38,38,0.1)' : '#fef2f2',
                color: theme === 'dark' ? '#fca5a5' : '#dc2626',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                Email
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
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@bmsce.ac.in"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-primary)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
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
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '2.75rem',
                    paddingRight: '2.75rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-primary)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)';
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
                  }}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: '1.125rem', height: '1.125rem', color: 'var(--text-muted)' }} />
                  ) : (
                    <Eye style={{ width: '1.125rem', height: '1.125rem', color: 'var(--text-muted)' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
              <a
                href="/reset-password"
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#3b82f6',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.8125rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0d9488 100%)',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontFamily: 'inherit',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '1.25rem' }}>
            New here? <a href="/register" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>Create an account</a>
          </p>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2.5rem', lineHeight: 1.6 }}>
            BMS College of Engineering, Bengaluru
            <br />
            © {new Date().getFullYear()} Hostel Management System
          </p>
        </motion.div>
      </div>
    </div>
  );
}
