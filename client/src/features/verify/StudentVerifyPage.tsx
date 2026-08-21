import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiBaseUrl } from '@/api/axios';
import {
  User, Building2, BedDouble, CreditCard, UtensilsCrossed,
  CheckCircle2, XCircle, Shield, Calendar, Heart, AlertTriangle,
} from 'lucide-react';

interface VerifyData {
  verified: boolean;
  student: {
    name: string;
    avatarUrl: string | null;
    usn: string;
    department: string;
    year: number;
    semester: number;
    gender: string;
    bloodGroup: string | null;
  };
  hostel: {
    allocated: boolean;
    hostelName: string | null;
    hostelType?: string;
    blockName?: string;
    floorName?: string;
    roomNumber: string | null;
    bedNumber?: number;
  };
  fees: {
    hostelFee: { status: string; paidAt: string | null; amount: string | null };
    messFee: { status: string; paidAt: string | null; amount: string | null };
  };
  verifiedAt: string;
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

export function StudentVerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<VerifyData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError('No QR token provided'); setLoading(false); return; }
    fetch(`${apiBaseUrl}/verify/student/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Invalid QR code');
        setData(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // ─── Loading ───
  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: '3rem', height: '3rem', margin: '0 auto', border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280', fontWeight: 600 }}>Verifying student...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error || !data) {
    return (
      <div style={pageStyle}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ ...cardStyle, textAlign: 'center', padding: '3rem', maxWidth: '28rem' }}>
          <div style={{ width: '4rem', height: '4rem', margin: '0 auto', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle style={{ width: '2rem', height: '2rem', color: '#dc2626' }} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1f2937', marginTop: '1.25rem' }}>
            Invalid or Unrecognized QR Code
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', lineHeight: 1.6 }}>
            {error || 'This QR code could not be verified. It may be invalid or the student profile may not exist.'}
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Verified ───
  const { student, hostel, fees, verifiedAt } = data;
  const initials = student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={pageStyle}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, maxWidth: '28rem', width: '100%' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #0d9488)',
          padding: '1.5rem', borderRadius: '1rem 1rem 0 0',
          margin: '-1.5rem -1.5rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <Shield style={{ width: '1.5rem', height: '1.5rem', color: 'white', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>BMSCE Hostel</h1>
            <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Student Verification</p>
          </div>
          <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem', color: '#4ade80', marginLeft: 'auto', flexShrink: 0 }} />
        </div>

        {/* Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #1e40af, #0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1rem', fontWeight: 800,
            border: '3px solid #e0f2fe',
          }}>
            {student.avatarUrl
              ? <img src={student.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials
            }
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1f2937' }}>{student.name}</h2>
            <p style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 600, fontFamily: 'monospace' }}>{student.usn}</p>
          </div>
        </div>

        {/* Personal Details */}
        <Section title="Personal Details" icon={User}>
          <InfoRow label="Department" value={student.department} />
          <InfoRow label="Year" value={`Year ${student.year} · Semester ${student.semester}`} />
          <InfoRow label="Gender" value={student.gender} />
          {student.bloodGroup && <InfoRow label="Blood Group" value={student.bloodGroup} icon={Heart} />}
        </Section>

        {/* Hostel Details */}
        <Section title="Hostel Details" icon={Building2}>
          {hostel.allocated ? (
            <>
              <InfoRow label="Hostel" value={`${hostel.hostelName} (${hostel.hostelType})`} />
              {hostel.blockName && <InfoRow label="Block · Floor" value={`${hostel.blockName} · ${hostel.floorName}`} />}
              <InfoRow label="Room" value={`Room ${hostel.roomNumber}${hostel.bedNumber ? ` · Bed ${hostel.bedNumber}` : ''}`} icon={BedDouble} />
            </>
          ) : (
            <>
              <InfoRow label="Hostel" value="Not Yet Allotted" muted />
              <InfoRow label="Room" value="Not Yet Allotted" muted icon={BedDouble} />
            </>
          )}
        </Section>

        {/* Fee Status */}
        <Section title="Fee Status" icon={CreditCard}>
          <FeeRow label="Hostel Fee" status={fees.hostelFee.status} paidAt={fees.hostelFee.paidAt} />
          <FeeRow label="Mess Fee" status={fees.messFee.status} paidAt={fees.messFee.paidAt} icon={UtensilsCrossed} />
        </Section>

        {/* Timestamp */}
        <div style={{
          marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', gap: '0.375rem',
        }}>
          <Calendar style={{ width: '0.75rem', height: '0.75rem', color: '#9ca3af' }} />
          <span style={{ fontSize: '0.6875rem', color: '#9ca3af', fontWeight: 500 }}>
            Verified at {new Date(verifiedAt).toLocaleString('en-IN')}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sub-components ───

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem' }}>
        <Icon style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.25rem' }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, muted, icon: Icon }: { label: string; value: string; muted?: boolean; icon?: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {Icon && <Icon style={{ width: '0.75rem', height: '0.75rem' }} />}
        {label}
      </span>
      <span style={{
        fontSize: '0.8125rem', fontWeight: 600,
        color: muted ? '#9ca3af' : '#1f2937',
        fontStyle: muted ? 'italic' : 'normal',
      }}>
        {value}
      </span>
    </div>
  );
}

function FeeRow({ label, status, paidAt, icon: Icon }: { label: string; status: string; paidAt: string | null; icon?: any }) {
  const isPaid = status === 'PAID';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {Icon ? <Icon style={{ width: '0.75rem', height: '0.75rem' }} /> : <CreditCard style={{ width: '0.75rem', height: '0.75rem' }} />}
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {paidAt && <span style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>{fmt(paidAt)}</span>}
        <span style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px',
          backgroundColor: isPaid ? '#dcfce7' : '#fef3c7',
          color: isPaid ? '#15803d' : '#b45309',
        }}>
          {isPaid ? <CheckCircle2 style={{ width: '0.625rem', height: '0.625rem' }} /> : <XCircle style={{ width: '0.625rem', height: '0.625rem' }} />}
          {status}
        </span>
      </div>
    </div>
  );
}

// ─── Styles ───

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: 'linear-gradient(135deg, #f0f9ff, #ecfdf5, #f0f9ff)',
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '1rem',
  padding: '1.5rem',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
  border: '1px solid #e5e7eb',
};
