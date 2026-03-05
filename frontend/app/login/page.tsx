'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '@/components/AuthLayout';
import { apiPost, saveAuth } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('/auth/login', {
        email: form.email,
        password: form.password,
      });
      saveAuth(data.access_token, form.email, '');
      router.push('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(fe => ({ ...fe, [field]: '' }));
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
      <div style={{ maxWidth: 400 }}>
        <div className="fade-in-up">
          <h1 className="heading">
            Holla,<br />
            <span className="heading-accent">Welcome Back</span>
          </h1>
          <p className="sub-text">Sign in to your AIRO account and continue your journey</p>
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
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
              value={form.email}
              onChange={e => set('email', e.target.value)}
              autoComplete="email"
            />
            {fieldErrors.email && <span className="error-msg">{fieldErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••••••"
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                style={{ paddingRight: 44 }}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
            {fieldErrors.password && <span className="error-msg">{fieldErrors.password}</span>}
          </div>

          {/* Remember / Forgot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="checkbox-label">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button type="button" className="btn-link">Forgot Password?</button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner" /> Signing in...
                </span>
              : 'Sign In'
            }
          </button>
        </form>

        <p className="fade-in-up fade-in-up-delay-2" style={{ marginTop: 32, fontSize: 13.5, color: 'var(--muted)', textAlign: 'center' }}>
          New to AIRO?{' '}
          <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
