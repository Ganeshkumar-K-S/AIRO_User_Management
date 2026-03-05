'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { apiPost, saveAuth } from '@/lib/api';

const OTP_LEN = 6;
const RESEND_SEC = 60;

export default function OTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(RESEND_SEC);
  const [pending, setPending] = useState<{ full_name: string; email: string; password: string } | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem('pending_signup');
    if (!raw) { router.replace('/signup'); return; }
    setPending(JSON.parse(raw));
    setTimeout(() => refs.current[0]?.focus(), 80);
  }, [router]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setError('');
    if (digit && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (otp[i]) { const n = [...otp]; n[i] = ''; setOtp(n); }
      else if (i > 0) refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && i > 0)          refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    const next = [...otp];
    digits.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    refs.current[Math.min(digits.length, OTP_LEN - 1)]?.focus();
  }

  const verify = useCallback(async () => {
    if (!pending) return;
    const code = otp.join('');
    if (code.length < OTP_LEN) { setError('Enter the complete 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      // POST /auth/signup  { full_name, email, password, otp }
      await apiPost('/auth/signup', {
        full_name: pending.full_name,
        email:     pending.email,
        password:  pending.password,
        otp:       code,
      });

      // Auto-login → get JWT
      const loginData = await apiPost('/auth/login', {
        email:    pending.email,
        password: pending.password,
      });

      // ✅ JWT stored → every future apiGet / apiPostAuth / apiPatch
      //    will send:  Authorization: Bearer <token>
      saveAuth(loginData.access_token, pending.email, pending.full_name);
      sessionStorage.removeItem('pending_signup');
      setSuccess(true);
      setTimeout(() => router.push('/home'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  }, [otp, pending, router]);

  // Auto-submit when all filled
  useEffect(() => {
    if (otp.every(d => d !== '') && !loading && !success) verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  async function resend() {
    if (!pending || timer > 0) return;
    setResending(true);
    try {
      await apiPost('/auth/send-otp', { email: pending.email });
      setOtp(Array(OTP_LEN).fill(''));
      setTimer(RESEND_SEC);
      refs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setResending(false);
    }
  }

  const masked = pending?.email.replace(/(.{2}).+(@.+)/, '$1***$2') ?? '...';

  if (success) return (
    <AuthLayout>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div className="success-circle">
          <svg className="checkmark" width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 className="heading" style={{ fontSize: 32, marginBottom: 10 }}>
          Account <span className="heading-accent">Created!</span>
        </h2>
        <p className="sub-text">Welcome aboard. Redirecting to your dashboard...</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <span className="spinner" style={{ borderColor: 'rgba(108,71,255,.3)', borderTopColor: 'var(--accent)', width: 28, height: 28 }}/>
        </div>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout>
      <div style={{ maxWidth: 400 }}>
        {/* Back */}
        <button onClick={() => router.push('/signup')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 13.5, marginBottom: 36, padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 12L6 8l4-4"/>
          </svg>
          Back
        </button>

        <div className="fade-in-up" style={{ marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(108,71,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a4 4 0 00-8 0v2"/>
              <circle cx="12" cy="14" r="1.5" fill="var(--accent)"/>
            </svg>
          </div>
          <h1 className="heading" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>
            Verify your<br /><span className="heading-accent">Email</span>
          </h1>
          <p className="sub-text">
            We sent a 6-digit code to<br />
            <strong style={{ color: 'var(--ink)' }}>{masked}</strong>
          </p>
        </div>

        <div className="fade-in-up fade-in-up-delay-1">
          <div className="otp-container" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                className={`otp-input ${digit ? 'filled' : ''} ${error ? 'otp-error' : ''}`}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          {error && (
            <p className="error-msg" style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
              {error}
            </p>
          )}

          <button className="btn-primary" style={{ marginTop: 28 }} onClick={verify}
            disabled={loading || otp.some(d => !d)}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span className="spinner" /> Verifying...</span>
              : 'Verify & Create Account'
            }
          </button>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            {timer > 0
              ? <p className="timer-text">Resend code in <span className="timer-accent">0:{String(timer).padStart(2, '0')}</span></p>
              : <p className="timer-text">Didn&apos;t receive it?{' '}
                  <button className="btn-link" onClick={resend} disabled={resending} style={{ fontSize: 13 }}>
                    {resending ? 'Sending...' : 'Resend OTP'}
                  </button>
                </p>
            }
          </div>

          <div style={{
            marginTop: 28, padding: '12px 16px',
            background: 'rgba(108,71,255,0.05)',
            borderRadius: 10, border: '1px solid rgba(108,71,255,0.12)',
          }}>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'center' }}>
              Code expires in <strong style={{ color: 'var(--ink)' }}>5 minutes</strong>.
              Check your spam folder if you don&apos;t see it.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
