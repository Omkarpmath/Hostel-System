import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Building2, RotateCw, AlertTriangle, LogIn } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BMSET Portal ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    // Reset React state & reload
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backgroundColor: '#0a0f1d',
            fontFamily: 'inherit',
            color: '#f8fafc',
          }}
        >
          <div
            style={{
              maxWidth: '32rem',
              width: '100%',
              backgroundColor: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '2.25rem 2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
            }}
          >
            {/* Crest Icon Badge */}
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AlertTriangle style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
            </div>

            {/* Institution Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Building2 style={{ width: '1.125rem', height: '1.125rem', color: '#60a5fa' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.08em', color: '#93c5fd', textTransform: 'uppercase' }}>
                BMSET Hostels
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem' }}>
              Portal Encountered an Issue
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              We encountered a temporary rendering error. Your data and credentials remain secure.
              Please refresh to reload the application.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                  overflowX: 'auto',
                  maxHeight: '6rem',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <RotateCw style={{ width: '1rem', height: '1rem' }} />
                Reload Application
              </button>

              <a
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                <LogIn style={{ width: '1rem', height: '1rem' }} />
                Return to Login
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
