'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, apiGet, apiPatch, apiPost } from '@/lib/api';
import { Navbar } from '@/app/home/page';

// ── Types ────────────────────────────────────────────────────────────────────
interface LeetcodeData {
  username: string;
  real_name?: string;
  ranking?: number;
  reputation?: number;
  about?: string;
  avatar?: string;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  updated_at?: string;
}

type Step = 'idle' | 'entering-id' | 'code-sent' | 'linked' | 'loading';

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 999,
      background: type === 'success' ? '#22c55e' : '#ef4444',
      color: 'white', borderRadius: 10, padding: '12px 18px',
      fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 14,
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
    }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  );
}

// ── Difficulty Badge ─────────────────────────────────────────────────────────
function DiffBadge({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div style={{
      background: bg, borderRadius: 12, padding: '18px 22px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      border: `1.5px solid ${color}30`, flex: 1,
    }}>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 30, color, lineHeight: 1 }}>{count}</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11, color, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ── Mini progress bar ────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 6, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function DSAPage() {
  const router = useRouter();

  const [fetching,     setFetching]     = useState(true);
  const [leetcodeData, setLeetcodeData] = useState<LeetcodeData | null>(null);
  const [step,         setStep]         = useState<Step>('idle');
  const [leetcodeId,   setLeetcodeId]   = useState('');
  const [verifyCode,   setVerifyCode]   = useState('');
  const [inputCode,    setInputCode]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

  const loadProfile = useCallback(async () => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }
    try {
      const data = await apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`);
      if (data?.leetcode) setLeetcodeData(data.leetcode as LeetcodeData);
    } catch { /* silent */ }
    finally { setFetching(false); }
  }, [router]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Step 1 — request verification code
  async function handleGetCode() {
    if (!leetcodeId.trim()) return;
    setLoading(true);
    try {
      const res = await apiPost('/form/leetcode/getcode', { leetcode_id: leetcodeId.trim() });
      setVerifyCode(res.verification_code);
      setStep('code-sent');
    } catch {
      showToast('Failed to get verification code', 'error');
    } finally { setLoading(false); }
  }

  // Step 2 — verify & link
  async function handleLink() {
    if (!inputCode.trim()) return;
    setLoading(true);
    try {
      await apiPost('/form/leetcode/link', { leetcode_id: leetcodeId.trim(), code: inputCode.trim() });
      showToast('LeetCode linked successfully!', 'success');
      setStep('idle');
      setLeetcodeId('');
      setVerifyCode('');
      setInputCode('');
      setFetching(true);
      await loadProfile();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Verification failed', 'error');
    } finally { setLoading(false); }
  }

  // Refresh existing data
  async function handleRefresh() {
    setLoading(true);
    try {
      await apiPatch('/form/leetcode/update', {});
      showToast('LeetCode data refreshed!', 'success');
      setFetching(true);
      await loadProfile();
    } catch {
      showToast('Failed to refresh', 'error');
    } finally { setLoading(false); }
  }

  // ── shared input style (matches codebase) ──────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontFamily: 'Montserrat, sans-serif',
    fontSize: 14, outline: 'none', background: 'white',
    color: '#1a1a2e', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    fontSize: 12.5, fontWeight: 600, color: '#6b7280',
    display: 'block', marginBottom: 5, fontFamily: 'Montserrat, sans-serif',
  };

  // ── Loading screen ──────────────────────────────────────────────────────
  if (fetching) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar active="Dashboard" />
      <div style={{ textAlign: 'center', padding: 80 }}>
        <span className="spinner" style={{ borderColor: 'rgba(26,26,46,.15)', borderTopColor: '#1a1a2e', width: 36, height: 36 }} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar active="Dashboard" />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Back */}
        <button
          onClick={() => router.push('/home')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13.5, marginBottom: 24, padding: 0, fontFamily: 'Montserrat, sans-serif' }}
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 28, color: '#1a1a2e', marginBottom: 4 }}>
            🧩 DSA & LeetCode
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'Montserrat, sans-serif' }}>
            Link your LeetCode account to showcase your problem-solving stats
          </p>
        </div>

        {/* ── LINKED STATE: Show stats ──────────────────────────────────── */}
        {leetcodeData && (
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e5e7eb', padding: '32px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', marginBottom: 24 }}>

            {/* Profile row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f3f4f6' }}>
              {leetcodeData.avatar
                ? <img src={leetcodeData.avatar} alt="avatar" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', border: '2px solid #e5e7eb' }} />
                : (
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#fef3c7,#fcd34d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧩</div>
                )
              }
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 18, color: '#1a1a2e', marginBottom: 2 }}>
                  {leetcodeData.real_name || leetcodeData.username}
                </p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#9ca3af' }}>
                  @{leetcodeData.username}
                  {leetcodeData.ranking ? ` · Rank #${leetcodeData.ranking.toLocaleString()}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  style={{ padding: '8px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'none', cursor: loading ? 'not-allowed' : 'pointer', color: '#6b7280', fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 600, opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? '...' : '↻ Refresh'}
                </button>
                <a
                  href={`https://leetcode.com/${leetcodeData.username}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '8px 16px', border: '1.5px solid #fcd34d', borderRadius: 8, background: '#fefce8', color: '#92400e', fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  ↗ Profile
                </a>
              </div>
            </div>

            {/* Total solved hero */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 56, color: '#1a1a2e', lineHeight: 1, marginBottom: 4 }}>
                {leetcodeData.total_solved}
              </p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Problems Solved
              </p>
            </div>

            {/* Difficulty breakdown */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <DiffBadge label="Easy"   count={leetcodeData.easy_solved}   color="#22c55e" bg="#f0fdf4" />
              <DiffBadge label="Medium" count={leetcodeData.medium_solved} color="#f97316" bg="#fff7ed" />
              <DiffBadge label="Hard"   count={leetcodeData.hard_solved}   color="#ef4444" bg="#fef2f2" />
            </div>

            {/* Progress bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f9fafb', borderRadius: 12, padding: '18px 20px' }}>
              {[
                { label: 'Easy',   val: leetcodeData.easy_solved,   max: 800,  color: '#22c55e' },
                { label: 'Medium', val: leetcodeData.medium_solved, max: 1700, color: '#f97316' },
                { label: 'Hard',   val: leetcodeData.hard_solved,   max: 700,  color: '#ef4444' },
              ].map(d => (
                <div key={d.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 600, color: '#4b5563' }}>{d.label}</span>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#9ca3af' }}>{d.val} / {d.max}</span>
                  </div>
                  <ProgressBar value={d.val} max={d.max} color={d.color} />
                </div>
              ))}
            </div>

            {/* Bio / about */}
            {leetcodeData.about && (
              <div style={{ marginTop: 20, padding: '14px 18px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#6b7280', lineHeight: 1.65 }}>
                  {leetcodeData.about}
                </p>
              </div>
            )}

            {/* Updated at */}
            {leetcodeData.updated_at && (
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#d1d5db', marginTop: 16, textAlign: 'right' }}>
                Last synced: {new Date(leetcodeData.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* ── NOT LINKED: Link flow ─────────────────────────────────────── */}
        {!leetcodeData && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24 }}>

            {step === 'idle' && (
              <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#fef3c7,#fcd34d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>🧩</div>
                <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 20, color: '#1a1a2e', marginBottom: 8 }}>
                  Connect LeetCode
                </h2>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13.5, color: '#9ca3af', marginBottom: 28, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 28px' }}>
                  Showcase your problem-solving skills by linking your LeetCode profile
                </p>
                <button
                  onClick={() => setStep('entering-id')}
                  style={{ padding: '12px 32px', background: '#1a1a2e', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  + Link LeetCode Account
                </button>
              </div>
            )}

            {step === 'entering-id' && (
              <div>
                <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 20 }}>
                  Step 1 — Enter your LeetCode username
                </h2>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>LeetCode Username</label>
                  <input
                    style={inp}
                    placeholder="e.g. john_doe"
                    value={leetcodeId}
                    onChange={e => setLeetcodeId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGetCode()}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setStep('idle'); setLeetcodeId(''); }}
                    style={{ padding: '10px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'Montserrat, sans-serif', fontSize: 13.5 }}
                  >Cancel</button>
                  <button
                    type="button"
                    onClick={handleGetCode}
                    disabled={loading || !leetcodeId.trim()}
                    style={{ padding: '10px 24px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13.5, cursor: loading || !leetcodeId.trim() ? 'not-allowed' : 'pointer', opacity: loading || !leetcodeId.trim() ? 0.65 : 1 }}
                  >
                    {loading ? 'Getting code...' : 'Get Verification Code →'}
                  </button>
                </div>
              </div>
            )}

            {step === 'code-sent' && (
              <div>
                <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 8 }}>
                  Step 2 — Verify your account
                </h2>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
                  Add the code below to your LeetCode <strong style={{ color: '#1a1a2e' }}>bio/about</strong> section, then click Verify.
                </p>

                {/* Code display */}
                <div style={{ background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: 12, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#1a1a2e', letterSpacing: 4 }}>{verifyCode}</span>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(verifyCode); showToast('Code copied!', 'success'); }}
                    style={{ padding: '6px 14px', border: '1.5px solid #e5e7eb', borderRadius: 7, background: 'white', cursor: 'pointer', color: '#6b7280', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600 }}
                  >Copy</button>
                </div>

                {/* Instructions */}
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, color: '#92400e', lineHeight: 1.6 }}>
                    1. Go to <strong>leetcode.com</strong> → Edit Profile<br />
                    2. Paste the code into your <strong>About Me</strong> field<br />
                    3. Save, then click Verify below
                  </p>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Enter Verification Code</label>
                  <input
                    style={inp}
                    placeholder="Paste the code here"
                    value={inputCode}
                    onChange={e => setInputCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLink()}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setStep('entering-id'); setVerifyCode(''); setInputCode(''); }}
                    style={{ padding: '10px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'Montserrat, sans-serif', fontSize: 13.5 }}
                  >← Back</button>
                  <button
                    type="button"
                    onClick={handleLink}
                    disabled={loading || !inputCode.trim()}
                    style={{ padding: '10px 24px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13.5, cursor: loading || !inputCode.trim() ? 'not-allowed' : 'pointer', opacity: loading || !inputCode.trim() ? 0.65 : 1 }}
                  >
                    {loading ? 'Verifying...' : '✓ Verify & Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Re-link option when already linked ───────────────────────── */}
        {leetcodeData && step === 'entering-id' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '24px 28px' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 16 }}>Re-link LeetCode</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>LeetCode Username</label>
              <input style={inp} placeholder="LeetCode username" value={leetcodeId} onChange={e => setLeetcodeId(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setStep('idle'); setLeetcodeId(''); }} style={{ padding: '10px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'Montserrat, sans-serif', fontSize: 13.5 }}>Cancel</button>
              <button onClick={handleGetCode} disabled={loading || !leetcodeId.trim()} style={{ padding: '10px 24px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Get Code →</button>
            </div>
          </div>
        )}

        {leetcodeData && step === 'code-sent' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '24px 28px' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 8 }}>Verify Re-link</h2>
            <div style={{ background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: 10, padding: '14px 18px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 800, letterSpacing: 4 }}>{verifyCode}</span>
              <button onClick={() => { navigator.clipboard.writeText(verifyCode); showToast('Copied!', 'success'); }} style={{ padding: '5px 12px', border: '1.5px solid #e5e7eb', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'Montserrat, sans-serif' }}>Copy</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Verification Code</label>
              <input style={inp} placeholder="Enter code" value={inputCode} onChange={e => setInputCode(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setStep('idle'); }} style={{ padding: '10px 20px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'Montserrat, sans-serif', fontSize: 13.5 }}>Cancel</button>
              <button onClick={handleLink} disabled={loading || !inputCode.trim()} style={{ padding: '10px 24px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>✓ Verify</button>
            </div>
          </div>
        )}

        {/* ── Relink trigger when already linked ───────────────────────── */}
        {leetcodeData && step === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setStep('entering-id')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Re-link a different account
            </button>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}