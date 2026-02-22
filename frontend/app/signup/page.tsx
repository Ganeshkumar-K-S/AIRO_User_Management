'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { apiPost } from '@/lib/api';

function getStrength(pw: string) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return [
    { score: 0, label: '',       color: '' },
    { score: 1, label: 'Weak',   color: '#ef4444' },
    { score: 2, label: 'Fair',   color: '#f97316' },
    { score: 3, label: 'Good',   color: '#eab308' },
    { score: 4, label: 'Strong', color: '#22c55e' },
  ][s];
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showC,  setShowC]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = getStrength(form.password);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(fe => ({ ...fe, [field]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim())  e.full_name = 'Full name is required';
    if (!form.email)             e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)          e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min. 8 characters';
    if (!form.confirm)           e.confirm = 'Please confirm your password';
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await apiPost('/auth/send-otp', { email: form.email });
      sessionStorage.setItem('pending_signup', JSON.stringify({
        full_name: form.full_name,
        email:     form.email,
        password:  form.password,
      }));
      router.push('/otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  const EyeOn = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeOff = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <AuthLayout>
      <div style={{ maxWidth: 420 }}>

      <div className="fade-in-up">
        <h1 className="heading" style={{ fontSize: 'clamp(22px, 2.8vw, 36px)', marginTop: 0, marginBottom: 8 }}>
          Join <span className="heading-accent">US</span><br />today
        </h1>
        <p className="sub-text">Create your account and start building your career profile</p>
      </div>

        {error && (
          <div className="error-banner fade-in-up" style={{ marginBottom: 20 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zm0 7a.75.75 0 110-1.5.75.75 0 010 1.5z"/>
            </svg>
            {error}
          </div>
        )}

        <form
          className="fade-in-up fade-in-up-delay-1"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          onSubmit={handleSubmit}
        >
          {/* Full name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" placeholder="Your full name"
              className={`form-input ${fieldErrors.full_name ? 'input-error' : ''}`}
              value={form.full_name} onChange={e => set('full_name', e.target.value)} autoComplete="name" />
            {fieldErrors.full_name && <span className="error-msg">{fieldErrors.full_name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" placeholder="you@example.com"
              className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
              value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
            {fieldErrors.email && <span className="error-msg">{fieldErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                style={{ paddingRight: 44 }}
                value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" />
              <button type="button" className="input-icon-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
            {form.password && (
              <>
                <div className="strength-bar">
                  <div className="strength-fill" style={{ width: `${(strength.score / 4) * 100}%`, background: strength.color }} />
                </div>
                <p style={{ fontSize: 11.5, color: strength.color, marginTop: 4, fontWeight: 500 }}>{strength.label}</p>
              </>
            )}
            {fieldErrors.password && <span className="error-msg">{fieldErrors.password}</span>}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-wrapper">
              <input type={showC ? 'text' : 'password'} placeholder="Re-enter password"
                className={`form-input ${fieldErrors.confirm ? 'input-error' : ''}`}
                style={{ paddingRight: 44 }}
                value={form.confirm} onChange={e => set('confirm', e.target.value)} autoComplete="new-password" />
              <button type="button" className="input-icon-btn" onClick={() => setShowC(!showC)} tabIndex={-1}>
                {showC ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
            {fieldErrors.confirm && <span className="error-msg">{fieldErrors.confirm}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner" /> Sending OTP...
                </span>
              : 'Create Account →'
            }
          </button>
        </form>

        <p className="fade-in-up fade-in-up-delay-2" style={{ marginTop: 28, fontSize: 13.5, color: 'var(--muted)', textAlign: 'center' }}>
          Already have an AIRO account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
