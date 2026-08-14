import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import type { Role } from '@/types';

const roles: Array<{ value: Role; label: string }> = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'ADMIN', label: 'Hostel Office / Admin' },
  { value: 'WARDEN', label: 'Warden' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'SECURITY', label: 'Security' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'STUDENT' as Role });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

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

  return (
    <main className="min-h-screen px-5 py-10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-3xl border lg:grid-cols-[0.9fr_1.1fr]" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
        <div className="hidden gradient-bg p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><Building2 className="h-6 w-6" /></div><div><p className="text-xl font-bold">BMSCE</p><p className="text-sm text-white/70">Hostel Management System</p></div></div>
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/65">Account setup</p><h1 className="mt-4 text-5xl font-bold leading-tight tracking-tight">Join the hostel<br /><span className="text-white/70">platform.</span></h1><p className="mt-6 max-w-md text-lg leading-8 text-white/70">Create the right account for your role and manage hostel services from one secure workspace.</p></div>
          <p className="text-sm text-white/60">BMS College of Engineering, Bengaluru</p>
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-xl">
            <div className="mb-8 lg:hidden"><div className="inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-bg text-white"><Building2 className="h-6 w-6" /></div><p className="mt-3 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>BMSCE Hostel</p></div>
            <div className="mb-8"><div className="mb-3 inline-flex rounded-xl bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-900/30"><UserPlus className="h-5 w-5" /></div><h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Create an account</h2><p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Fill in your details to register for a hostel role.</p></div>
            {success ? <div className="rounded-2xl bg-green-50 p-6 text-center dark:bg-green-900/20"><CheckCircle2 className="mx-auto h-10 w-10 text-green-500" /><p className="mt-3 font-semibold text-green-700 dark:text-green-300">Account created successfully</p><p className="mt-1 text-sm text-green-600 dark:text-green-400">Taking you to sign in…</p></div> : <form onSubmit={submit} className="space-y-5">
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
              <div className="grid gap-4 sm:grid-cols-2">{(['firstName', 'lastName'] as const).map((field) => <label key={field} className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{field === 'firstName' ? 'First name' : 'Last name'}<input required value={form[field]} onChange={(event) => update(field, event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-primary-500" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} /></label>)}</div>
              <label className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Email<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-primary-500" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="you@bmsce.ac.in" /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Phone <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span><input value={form.phone} onChange={(event) => update('phone', event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-primary-500" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} /></label><label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Role<select value={form.role} onChange={(event) => update('role', event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-primary-500" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label></div>
              <label className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Password<input required minLength={6} type="password" value={form.password} onChange={(event) => update('password', event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-primary-500" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="Minimum 6 characters" /></label>
              <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white gradient-bg disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Creating account…' : 'Create account'}</button>
            </form>}
            <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Already have an account? <Link to="/login" className="font-semibold text-primary-600">Sign in</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
