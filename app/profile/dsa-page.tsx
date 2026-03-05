'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, clearAuth, apiGet, apiPostAuth } from '@/lib/api';
import {
  Code2, TrendingUp, Zap, LogOut, MapPin, Phone,
  CheckCircle2, Copy, Trophy, Target, Flame, Award,
} from 'lucide-react';

/* ── TYPES ── */
interface Auth { token: string; email: string | null; name: string | null; }
interface LeetCodeData {
  username: string;
  about?: string;
  ranking?: number;
  reputation?: number;
  total_solved?: number;
  easy_solved?: number;
  medium_solved?: number;
  hard_solved?: number;
  acceptance_rate?: number;
  contribution_points?: number;
  profile_image?: string;
  badges?: { name: string; icon?: string }[];
  recent_submissions?: { title: string; status: string; lang: string; timestamp: string }[];
}

/* ── DESIGN SYSTEM ── */
const C = {
  ink: '#0f172a',
  paper: '#f8fafc',
  surface: '#ffffff',
  accent: '#7c3aed',
  accentHov: '#6d28d9',
  accentSoft: '#ede9fe',
  accent2: '#ef4444',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  orange: '#f97316',
  yellow: '#eab308',
};

/* ── SCROLL REVEAL ── */
function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0px)' : 'translateY(32px)',
      transition: `opacity 0.55s cubic-bezier(.4,0,.2,1) ${delay}ms, transform 0.55s cubic-bezier(.4,0,.2,1) ${delay}ms`,
    } as React.CSSProperties,
  };
}

/* ── NAVBAR ── */
export function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Resume Builder', 'DSA'];
  return (
    <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 60, gap: 36, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
      {NAV.map(label => (
        <button key={label} onClick={() => {
          if (label === 'Dashboard') router.push('/home');
          if (label === 'Development') router.push('/development');
          if (label === 'Resume Builder') router.push('/resume');
          if (label === 'DSA') router.push('/dsa');
        }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: active === label ? C.accent : C.muted, fontWeight: active === label ? 700 : 500, borderBottom: active === label ? `2.5px solid ${C.accent}` : '2.5px solid transparent', paddingBottom: 4, transition: 'all 0.2s' }}>
          {label}
        </button>
      ))}
    </nav>
  );
}

/* ── TOAST ── */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: type === 'success' ? C.success : C.accent2, color: '#fff', borderRadius: 14, padding: '13px 20px', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 32px rgba(15,23,42,0.18)' }}>
      {type === 'success' ? <CheckCircle2 size={16} /> : '✕'} {msg}
    </div>
  );
}

/* ── STAT CARD ── */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const reveal = useScrollReveal(80);
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 4px 18px rgba(15,23,42,0.06)', flex: 1, minWidth: 160 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 26, color: C.ink, margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.muted, margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      </div>
    </div>
  );
}

/* ── DONUT CHART ── */
function DonutChart({ easy, medium, hard, total }: { easy: number; medium: number; hard: number; total: number }) {
  const reveal = useScrollReveal(100);
  const SIZE = 200, SW = 24, r = (SIZE - SW) / 2;
  const circ = 2 * Math.PI * r;
  const cx = SIZE / 2, cy = SIZE / 2;
  const safe = total || 1;
  let offset = 0;
  const segs = [
    { val: easy, color: C.success, label: 'Easy' },
    { val: medium, color: C.orange, label: 'Medium' },
    { val: hard, color: C.accent2, label: 'Hard' },
  ].map(s => {
    const dash = circ * (s.val / safe);
    const arc = { dash, offset: -offset, color: s.color, val: s.val, label: s.label };
    offset += dash;
    return arc;
  });

  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '32px', boxShadow: '0 4px 18px rgba(15,23,42,0.06)' }}>
      <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 18, color: C.ink, margin: '0 0 24px' }}>Problem Distribution</h3>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
          <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
            {segs.map((a, i) => a.val > 0 && (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth={SW}
                strokeDasharray={`${a.dash} ${circ - a.dash}`} strokeDashoffset={a.offset} strokeLinecap="round" />
            ))}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 36, color: C.ink, lineHeight: 1 }}>{total}</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 600 }}>Total Solved</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {segs.map(s => (
            <div key={s.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 700, color: C.ink }}>{s.label}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 800, color: s.color }}>{s.val}</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${safe ? (s.val / safe) * 100 : 0}%`, height: '100%', background: s.color, borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ACCEPTANCE RATE GAUGE ── */
function AcceptanceGauge({ rate }: { rate: number }) {
  const reveal = useScrollReveal(120);
  const SIZE = 180;
  const SW = 20;
  const r = (SIZE - SW) / 2;
  const circ = Math.PI * r;
  const progress = circ * (rate / 100);

  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '32px', boxShadow: '0 4px 18px rgba(15,23,42,0.06)', textAlign: 'center' }}>
      <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 18, color: C.ink, margin: '0 0 24px' }}>Acceptance Rate</h3>
      <div style={{ position: 'relative', width: SIZE, height: SIZE / 2 + 20, margin: '0 auto' }}>
        <svg width={SIZE} height={SIZE / 2 + 20} style={{ overflow: 'visible' }}>
          <path d={`M ${SW / 2} ${SIZE / 2} A ${r} ${r} 0 0 1 ${SIZE - SW / 2} ${SIZE / 2}`}
            fill="none" stroke="#f1f5f9" strokeWidth={SW} strokeLinecap="round" />
          <path d={`M ${SW / 2} ${SIZE / 2} A ${r} ${r} 0 0 1 ${SIZE - SW / 2} ${SIZE / 2}`}
            fill="none" stroke={rate >= 70 ? C.success : rate >= 50 ? C.orange : C.accent2}
            strokeWidth={SW} strokeLinecap="round"
            strokeDasharray={`${progress} ${circ}`} />
        </svg>
        <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 32, color: C.ink }}>{rate}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── LEETCODE BANNER ── */
function LeetCodeBanner({ leetcode }: { leetcode: LeetCodeData }) {
  const reveal = useScrollReveal(0);
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 28, padding: '36px 40px', marginBottom: 40, boxShadow: '0 4px 24px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
      {leetcode.profile_image && <img src={leetcode.profile_image} alt="LeetCode avatar" style={{ width: 100, height: 100, borderRadius: '50%', border: `3px solid ${C.accentSoft}`, boxShadow: `0 8px 24px ${C.accent}30`, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, color: C.ink, margin: 0 }}>{leetcode.username}</h2>
          <a href={`https://leetcode.com/${leetcode.username}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.accentSoft, color: C.accent, borderRadius: 10, padding: '6px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            <Code2 size={13} /> Open LeetCode
          </a>
        </div>
        {leetcode.about && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: C.muted, margin: '0 0 16px', lineHeight: 1.6 }}>{leetcode.about}</p>}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {leetcode.ranking && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.muted, fontWeight: 600 }}>
              <Trophy size={14} /> Ranking: {leetcode.ranking.toLocaleString()}
            </span>
          )}
          {leetcode.reputation !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.muted, fontWeight: 600 }}>
              <Award size={14} /> Reputation: {leetcode.reputation}
            </span>
          )}
          {leetcode.contribution_points !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.muted, fontWeight: 600 }}>
              <Zap size={14} /> Contributions: {leetcode.contribution_points}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── BADGES SECTION ── */
function BadgesSection({ badges }: { badges: { name: string; icon?: string }[] }) {
  const reveal = useScrollReveal(140);
  if (!badges || badges.length === 0) return null;

  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '28px 32px', boxShadow: '0 4px 18px rgba(15,23,42,0.06)', marginBottom: 40 }}>
      <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 18, color: C.ink, margin: '0 0 20px' }}>Badges & Achievements</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {badges.map((badge, i) => (
          <div key={i} style={{ background: `linear-gradient(135deg, ${C.yellow}20, ${C.orange}20)`, border: `1.5px solid ${C.yellow}`, borderRadius: 12, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{badge.icon || '🏅'}</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: C.ink }}>{badge.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── LINK LEETCODE PANEL ── */
function LinkLeetCodePanel({ onLinked }: { onLinked: () => void }) {
  const [step, setStep] = useState<'enter' | 'verify'>('enter');
  const [leetcodeId, setLeetcodeId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  async function getCode() {
    if (!leetcodeId.trim()) return;
    setLoading(true);
    try {
      const res = await apiPostAuth('/form/leetcode/getcode', { leetcode_id: leetcodeId });
      setCode(res.verification_code);
      setStep('verify');
    } catch {
      setToast({ msg: 'Failed to get code', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function link() {
    setLoading(true);
    try {
      await apiPostAuth('/form/leetcode/link', { leetcode_id: leetcodeId, code });
      setToast({ msg: 'LeetCode linked!', type: 'success' });
      setTimeout(onLinked, 1000);
    } catch (e: any) {
      setToast({ msg: e?.message || 'Linking failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  const inpStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `1px solid ${C.border}`, fontFamily: 'Montserrat, sans-serif',
    fontSize: 14, outline: 'none', background: C.surface, color: C.ink, boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500, padding: 40 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 28, padding: '48px 52px', maxWidth: 500, width: '100%', boxShadow: '0 8px 40px rgba(15,23,42,0.1)', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Code2 size={36} color={C.accent} />
        </div>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 26, color: C.ink, margin: '0 0 8px' }}>Link LeetCode</h2>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>
          Connect your LeetCode account to showcase your problem-solving stats and achievements.
        </p>
        {step === 'enter' ? (
          <>
            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>
                LeetCode Username
              </label>
              <input style={inpStyle} placeholder="e.g. your_username" value={leetcodeId}
                onChange={e => setLeetcodeId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && getCode()} />
            </div>
            <button onClick={getCode} disabled={loading || !leetcodeId.trim()}
              style={{ width: '100%', padding: '13px', background: C.accent, border: 'none', borderRadius: 14, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading || !leetcodeId.trim() ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? 'Getting code…' : <><Target size={16} /> Get Verification Code</>}
            </button>
          </>
        ) : (
          <>
            <div style={{ background: C.accentSoft, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.accent, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Your Verification Code
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: C.accent, letterSpacing: 4 }}>{code}</span>
                <button onClick={() => navigator.clipboard.writeText(code)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent }}>
                  <Copy size={20} />
                </button>
              </div>
            </div>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
              Add this code to your LeetCode bio at <strong>leetcode.com/profile</strong>, then click Verify below.
            </p>
            <button onClick={link} disabled={loading}
              style={{ width: '100%', padding: '13px', background: C.accent, border: 'none', borderRadius: 14, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              {loading ? 'Verifying…' : <><CheckCircle2 size={16} /> Verify and Link</>}
            </button>
            <button onClick={() => setStep('enter')}
              style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600 }}>
              Back
            </button>
          </>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function DsaPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [leetcode, setLeetcode] = useState<LeetCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string; phone?: string; location?: string } | null>(null);

  const fetchData = useCallback(async (email: string) => {
    try {
      const data = await apiGet(`/form/get-profile/${encodeURIComponent(email)}`);
      setProfile({ full_name: data.full_name, phone: data.phone, location: data.location });
      if (data.leetcode) setLeetcode(data.leetcode);
    } catch { }
  }, []);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.push('/login'); return; }
    setAuth(a);
    if (a.email) fetchData(a.email).finally(() => setLoading(false));
  }, [router, fetchData]);

  async function updateLeetCode() {
    setUpdating(true);
    try {
      await apiPostAuth('/form/leetcode/update', {});
      if (auth?.email) await fetchData(auth.email);
      setToast({ msg: 'LeetCode data refreshed!', type: 'success' });
    } catch {
      setToast({ msg: 'Update failed', type: 'error' });
    } finally {
      setUpdating(false);
    }
  }

  function logout() {
    clearAuth();
    router.push('/login');
  }

  const displayName = profile?.full_name || auth?.name || auth?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const SIDEBAR_W = 285;
  const NAV_H = 60;

  const totalSolved = (leetcode?.easy_solved || 0) + (leetcode?.medium_solved || 0) + (leetcode?.hard_solved || 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f8fafc 0%,#eef2ff 60%,#f5f3ff 100%)', fontFamily: 'Montserrat, sans-serif' }}>
      <Navbar active="DSA" />

      {/* SIDEBAR */}
      <aside style={{ position: 'fixed', top: NAV_H, left: 0, width: SIDEBAR_W, height: `calc(100vh - ${NAV_H}px)`, overflowY: 'auto', borderRight: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', padding: '40px 28px 40px 34px', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24, marginBottom: 16, flexShrink: 0, boxShadow: `0 12px 30px ${C.accent}45`, overflow: 'hidden' }}>
          {leetcode?.profile_image ? <img src={leetcode.profile_image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 18, color: C.ink, margin: '0 0 4px' }}>{displayName}</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.muted, margin: '0 0 8px', wordBreak: 'break-all', lineHeight: 1.5 }}>{auth?.email}</p>
        {leetcode && (
          <a href={`https://leetcode.com/${leetcode.username}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none', marginBottom: 24 }}>
            <Code2 size={14} /> @{leetcode.username}
          </a>
        )}
        {profile?.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, color: C.muted, fontSize: 13.5 }}>
            <MapPin size={15} color={C.muted} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.location}</span>
          </div>
        )}
        {profile?.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 24, color: C.muted, fontSize: 13.5 }}>
            <Phone size={15} color={C.muted} />
            <span style={{ fontFamily: 'Montserrat, sans-serif' }}>{profile.phone}</span>
          </div>
        )}
        {leetcode && (
          <button onClick={updateLeetCode} disabled={updating}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', fontSize: 13, color: C.muted, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, transition: 'all 0.2s', marginBottom: 8, opacity: updating ? 0.6 : 1 }}>
            <TrendingUp size={14} style={{ animation: updating ? 'spin 1s linear infinite' : 'none' }} />
            {updating ? 'Refreshing…' : 'Refresh LeetCode'}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={logout}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent2; e.currentTarget.style.color = C.accent2; e.currentTarget.style.background = '#fff0f0'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'none'; }}
          style={{ width: '100%', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: C.muted, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogOut size={14} /> Logout
        </button>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: SIDEBAR_W, paddingTop: NAV_H, minHeight: '100vh' }}>
        <div style={{ padding: '56px 64px 110px' }}>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 48, color: C.ink, margin: '0 0 10px', letterSpacing: '-2px', lineHeight: 1 }}>
            My <span style={{ color: C.accent }}>DSA Journey</span>
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, color: C.muted, margin: '0 0 56px', fontWeight: 500 }}>
            Track your problem-solving progress, stats, and achievements
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 100 }}>
              <span className="spinner" style={{ borderColor: `${C.accent}25`, borderTopColor: C.accent, width: 40, height: 40 }} />
            </div>
          ) : !leetcode ? (
            <LinkLeetCodePanel onLinked={() => { if (auth?.email) fetchData(auth.email); }} />
          ) : (
            <>
              <LeetCodeBanner leetcode={leetcode} />

              <div style={{ display: 'flex', gap: 20, marginBottom: 56, flexWrap: 'wrap' }}>
                <StatCard icon={<Target size={22} />} label="Total Solved" value={totalSolved} color={C.accent} />
                <StatCard icon={<CheckCircle2 size={22} />} label="Easy" value={leetcode.easy_solved || 0} color={C.success} />
                <StatCard icon={<Zap size={22} />} label="Medium" value={leetcode.medium_solved || 0} color={C.orange} />
                <StatCard icon={<Flame size={22} />} label="Hard" value={leetcode.hard_solved || 0} color={C.accent2} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32, marginBottom: 56 }}>
                <DonutChart
                  easy={leetcode.easy_solved || 0}
                  medium={leetcode.medium_solved || 0}
                  hard={leetcode.hard_solved || 0}
                  total={totalSolved}
                />
                {leetcode.acceptance_rate !== undefined && (
                  <AcceptanceGauge rate={leetcode.acceptance_rate} />
                )}
              </div>

              {leetcode.badges && leetcode.badges.length > 0 && (
                <BadgesSection badges={leetcode.badges} />
              )}
            </>
          )}
        </div>
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { display: inline-block; border: 3px solid; border-radius: 50%; animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}