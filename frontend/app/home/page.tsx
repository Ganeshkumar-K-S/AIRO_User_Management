'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAuth, clearAuth } from '@/lib/api';

interface Auth { token: string; email: string | null; name: string | null; }

function decodeJwt(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

const STAT_CARDS = [
  { icon: '💻', label: 'Projects',   value: '0', hint: 'Add your first project' },
  { icon: '🎓', label: 'Education',  value: '0', hint: 'Add your education' },
  { icon: '⚡', label: 'Skills',     value: '0', hint: 'Add your skills' },
  { icon: '💼', label: 'Experience', value: '0', hint: 'Add work experience' },
];

const QUICK = [
  { label: 'Edit Profile',   color: '#6c47ff' },
  { label: 'Add Skills',     color: '#06b6d4' },
  { label: 'Add Projects',   color: '#f97316' },
  { label: 'Add Experience', color: '#22c55e' },
];

export default function HomePage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [jwtPayload, setJwtPayload] = useState<Record<string, unknown> | null>(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.replace('/login'); return; }
    setAuth(a);
    setJwtPayload(decodeJwt(a.token));
  }, [router]);

  function logout() { clearAuth(); router.push('/login'); }

  if (!auth) return null;

  const initials = auth.name
    ? auth.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (auth.email?.[0] ?? '?').toUpperCase();

  const displayName = auth.name || auth.email?.split('@')[0] || 'User';
  const exp = jwtPayload?.exp as number | undefined;
  const expiresAt = exp ? new Date(exp * 1000).toLocaleTimeString() : 'unknown';
  const tokenSnippet = auth.token.slice(0, 24) + '...' + auth.token.slice(-8);

  return (
    <div className="home-scene">
      {/* Navbar */}
      <nav className="home-nav">
        {/* AIRO Logo */}
        <Image src="/airo-logo.svg" alt="AIRO" width={90} height={30} priority />

        <div style={{ display: 'flex', gap: 32, fontSize: 14 }}>
          {['Dashboard', 'Profile', 'Projects', 'Skills'].map(l => (
            <button key={l} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 14, fontFamily: 'DM Sans',
              padding: 0,
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="jwt-badge">
            <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#22c55e"/></svg>
            JWT Active
          </div>
          <button onClick={logout} style={{
            background: 'none', border: '1.5px solid var(--border)', borderRadius: 10,
            padding: '7px 16px', fontFamily: 'DM Sans', fontSize: 13.5,
            cursor: 'pointer', color: 'var(--muted)', transition: 'all .2s',
          }}>Logout</button>
          <div className="avatar">{initials}</div>
        </div>
      </nav>

      <div className="home-hero">
        {/* Welcome */}
        <div className="fade-in-up" style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, letterSpacing: -1, color: 'var(--ink)' }}>
            Welcome back, <span style={{ color: 'var(--accent)' }}>{displayName} 👋</span>
          </h1>
          <p style={{ marginTop: 8, color: 'var(--muted)', fontSize: 15 }}>
            Your AIRO profile is ready. Start adding your details to boost your score.
          </p>
        </div>

        {/* JWT Info */}
        <div className="fade-in-up fade-in-up-delay-1" style={{
          background: 'white', borderRadius: 16, padding: '20px 26px',
          border: '1px solid var(--border)', marginBottom: 26,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
              🔐 Session Token (JWT)
            </p>
            <button className="btn-link" style={{ fontSize: 12.5 }} onClick={() => setShowToken(!showToken)}>
              {showToken ? 'Hide' : 'Show details'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>📧 <strong style={{ color: 'var(--ink)' }}>{auth.email}</strong></span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>⏱ Expires at <strong style={{ color: 'var(--ink)' }}>{expiresAt}</strong></span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>🔑 Algo: <strong style={{ color: 'var(--ink)' }}>HS256</strong></span>
          </div>
          {showToken && (
            <div style={{ background: '#f7f6f2', borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>
                Sent as <code style={{ background: '#e5e4ef', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>Authorization: Bearer &lt;token&gt;</code>
              </p>
              <p style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--ink)', lineHeight: 1.7 }}>
                {tokenSnippet}
              </p>
              {jwtPayload && (
                <pre style={{ fontSize: 11, color: 'var(--ink)', lineHeight: 1.6, marginTop: 8 }}>
                  {JSON.stringify(jwtPayload, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, marginBottom: 24 }}>
          {/* Profile card */}
          <div className="profile-card fade-in-up fade-in-up-delay-2">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 76, height: 76, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontFamily: 'Syne', fontWeight: 800, fontSize: 26,
                boxShadow: '0 8px 24px rgba(108,71,255,0.3)',
              }}>{initials}</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 17 }}>{displayName}</p>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{auth.email}</p>
              </div>

              {/* Score ring */}
              <div style={{ width: '100%', padding: '14px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profile Score</p>
                <div style={{
                  width: 72, height: 72, margin: '0 auto', borderRadius: '50%',
                  background: `conic-gradient(var(--accent) 0deg, var(--border) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>0</div>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10 }}>Complete profile to rank higher</p>
              </div>

              {/* Quick links */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {QUICK.map(q => (
                  <button key={q.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 14px', borderRadius: 10, width: '100%', cursor: 'pointer',
                    background: `${q.color}10`, border: `1px solid ${q.color}20`,
                    color: q.color, fontSize: 13.5, fontWeight: 500, fontFamily: 'DM Sans',
                  }}>
                    {q.label}
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 4l4 4-4 4"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {STAT_CARDS.map((c, i) => (
                <div key={c.label} className={`stat-card fade-in-up fade-in-up-delay-${i + 3}`}>
                  <div className="stat-icon" style={{ fontSize: 22 }}>{c.icon}</div>
                  <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 30, color: 'var(--ink)', marginBottom: 4 }}>{c.value}</p>
                  <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>{c.label}</p>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>{c.hint}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #6c47ff 0%, #9f7aea 100%)',
              borderRadius: 16, padding: '26px 30px', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 8px 28px rgba(108,71,255,0.25)',
            }}>
              <div>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 5 }}>
                  🚀 Complete your AIRO profile
                </p>
                <p style={{ fontSize: 13, opacity: 0.85 }}>
                  A complete profile is 5× more likely to be found by recruiters
                </p>
              </div>
              <button style={{
                background: 'white', color: 'var(--accent)',
                border: 'none', borderRadius: 10, padding: '10px 20px',
                fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13.5,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 20,
              }}>Get Started →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
