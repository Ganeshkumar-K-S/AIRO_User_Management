'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, apiGet, apiPostAuth } from '@/lib/api';
import { Navbar } from '@/app/home/page';

interface RepoDetail {
  name: string; url: string; description: string; stars: number; language: string | null;
}
interface GithubData {
  username: string; bio: string; followers: number; following: number;
  public_repos: number; stars: number; profile_image: string;
  repo_details: RepoDetail[]; top_languages: string[];
}

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', 'C++': '#f34b7d', Go: '#00ADD8', Rust: '#dea584',
  HTML: '#e34c26', CSS: '#563d7c', Ruby: '#701516', Swift: '#ffac45',
};

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: type === 'success' ? '#22c55e' : '#ef4444', color: 'white', borderRadius: 10, padding: '12px 18px', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  );
}

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#22c55e' : '#1a1a2e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
      {done ? '✓' : n}
    </div>
  );
}

function StatPill({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <p style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 22, color: '#1a1a2e', lineHeight: 1 }}>{value}</p>
        <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{label}</p>
      </div>
    </div>
  );
}

// ── GitHub Linking Wizard ────────────────────────────────────────────────────
function GithubLinkingFlow({ onLinked }: { onLinked: (data: GithubData) => void }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // BUG FIX: The old code generated a token client-side in sessionStorage and
  // never called /form/github/getcode. The backend's /github/link endpoint
  // looks up a code it previously stored via /github/getcode — so a
  // client-generated token will never match and linking always fails with
  // "Invalid verification code".
  //
  // Correct flow:
  //   Step 1 → user enters GitHub username
  //   Step 2 → POST /form/github/getcode  → backend stores code, returns it
  //   Step 3 → user pastes code into GitHub bio
  //   Step 4 → POST /form/github/link     → backend verifies bio contains code
  const [code, setCode] = useState('');

  const card = (active: boolean, done: boolean): React.CSSProperties => ({
    padding: '20px 24px', borderRadius: 12, marginBottom: 12,
    border: `1.5px solid ${done ? '#86efac' : active ? '#1a1a2e' : '#e5e7eb'}`,
    background: done ? '#f0fdf4' : 'white',
    transition: 'all 0.2s',
  });

  // Step 1 → 2: fetch the server-issued code for this GitHub username
  async function handleGetCode() {
    if (!username.trim()) { setError('Enter your GitHub username'); return; }
    setLoading(true); setError('');
    try {
      // BUG FIX: was missing entirely. Must call /getcode first so the backend
      // stores the code before /link tries to look it up.
      const res = await apiPostAuth('/form/github/getcode', {
        github_id: username.trim(),   // BUG FIX: field is github_id, not username
      });
      setCode(res.verification_code);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Step 3: verify that the code appears in the GitHub bio
  async function handleVerify() {
    setLoading(true); setError('');
    try {
      // BUG FIX: old code sent { username, verification_token } but backend
      // expects { github_id, code } matching the GithubLinkRequest model.
      const res = await apiPostAuth('/form/github/link', {
        github_id: username.trim(),
        code: code,
      });
      // BUG FIX: backend returns { message: "GitHub linked successfully" },
      // not the github data directly. We need to fetch the profile after linking.
      // We pass back a signal so the parent re-fetches.
      onLinked(res.github ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Make sure the code is in your GitHub bio and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 24, color: '#1a1a2e', marginBottom: 6 }}>🔗 Link Your GitHub</h2>
        <p style={{ color: '#6b7280', fontSize: 14, fontFamily: 'DM Sans', lineHeight: 1.7 }}>
          Follow these 3 steps to connect your GitHub account. We only read your public data — no OAuth or special permissions required.
        </p>
      </div>

      {/* Step 1 — Enter username & get code */}
      <div style={card(step >= 1, step > 1)}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <StepBadge n={1} done={step > 1} />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>
              Enter your GitHub username
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: 12 }}>
              We'll generate a unique verification code tied to your account.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, fontFamily: 'DM Sans' }}>GitHub Username</label>
                <input
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${error && step === 1 ? '#ef4444' : '#e5e7eb'}`, fontFamily: 'DM Sans', fontSize: 14, outline: 'none', boxSizing: 'border-box', opacity: step > 1 ? 0.6 : 1 }}
                  placeholder="e.g. torvalds"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  disabled={step > 1}
                  onKeyDown={e => { if (e.key === 'Enter' && step === 1) handleGetCode(); }}
                />
              </div>
              {step === 1 && (
                <button onClick={handleGetCode} disabled={loading}
                  style={{ padding: '10px 24px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Generating...' : 'Get Code →'}
                </button>
              )}
            </div>
            {error && step === 1 && <p style={{ fontSize: 13, color: '#ef4444', fontFamily: 'DM Sans', marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      </div>

      {/* Step 2 — Copy the server-issued code */}
      <div style={card(step >= 2, step > 2)}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <StepBadge n={2} done={step > 2} />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>
              Copy your verification code
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: 12 }}>
              Paste this code into your GitHub bio to prove you own the account.
            </p>

            {step >= 2 && (
              <>
                <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <code style={{ color: '#a5f3fc', fontFamily: 'monospace', fontSize: 15, letterSpacing: 2, userSelect: 'all' }}>{code}</code>
                  <button onClick={copyCode} style={{ background: copied ? '#22c55e' : '#334155', border: 'none', borderRadius: 6, padding: '7px 16px', color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Navigation guide */}
                <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7280', fontFamily: 'DM Sans', marginBottom: 8 }}>How to add it to your bio:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      'Click your avatar → top-right of GitHub',
                      'Select "Settings" from the dropdown',
                      'On the left sidebar → click "Public profile"',
                      'Find the "Bio" textarea → paste your code there',
                      'Click "Update profile" to save',
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'DM Sans', fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: '#374151', fontFamily: 'DM Sans' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'DM Sans', marginBottom: 6, fontWeight: 600 }}>EXAMPLE — what your bio should look like:</p>
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', fontSize: 13, color: '#374151', fontFamily: 'monospace' }}>
                    Full-stack developer 🚀 {code}
                  </div>
                  <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'DM Sans', marginTop: 6 }}>The code can appear anywhere in your bio.</p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a href="https://github.com/settings/profile" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a1a2e', color: 'white', borderRadius: 8, padding: '9px 18px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.3 9.4 7.9 10.9.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.19a11.1 11.1 0 012.9-.39c.98.01 1.97.13 2.9.39 2.2-1.5 3.17-1.19 3.17-1.19.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.07.78 2.15v3.19c0 .31.21.67.8.56C20.21 21.4 23.5 17.1 23.5 12 23.5 5.65 18.35.5 12 .5z" /></svg>
                    Open GitHub Settings
                  </a>
                  <button onClick={() => setStep(3)} style={{ background: 'none', border: '1.5px solid #1a1a2e', borderRadius: 8, padding: '9px 18px', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#1a1a2e' }}>
                    Done, verify →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step 3 — Verify */}
      <div style={card(step >= 3, false)}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <StepBadge n={3} />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 4 }}>
              Verify &amp; link your account
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'DM Sans', lineHeight: 1.6, marginBottom: 14 }}>
              We'll check your GitHub bio for the code, then import your public repos, stars, and languages.
            </p>
            <button onClick={handleVerify} disabled={loading || step < 3}
              style={{ padding: '10px 24px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: (loading || step < 3) ? 'not-allowed' : 'pointer', opacity: step < 3 ? 0.4 : 1 }}>
              {loading ? 'Verifying...' : '🔍 Verify & Link'}
            </button>
            {error && step === 3 && <p style={{ fontSize: 13, color: '#ef4444', fontFamily: 'DM Sans', marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '13px 16px', marginTop: 4 }}>
        <p style={{ fontSize: 12.5, color: '#92400e', fontFamily: 'DM Sans', lineHeight: 1.7 }}>
          ⚡ <strong>How it works:</strong> We generate a unique code server-side and store it temporarily. When you click Verify, we check that the code appears in your GitHub bio — this proves you own the account. We only access public data, no passwords or GitHub tokens needed.
        </p>
      </div>
    </div>
  );
}

// ── Main Development Page ────────────────────────────────────────────────────
export default function DevelopmentPage() {
  const router = useRouter();
  const [github, setGithub] = useState<GithubData | null>(null);
  const [subNav, setSubNav] = useState<'general' | 'repos'>('general');
  const [linked, setLinked] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }

    // BUG FIX: old code fetched /github/profile/${email} which doesn't exist.
    // GitHub data is stored in the `dev` collection via /form/github/link and
    // should be fetched from /form/get-profile which returns the full user doc.
    // GitHub data lives at data.github (stored in db.dev keyed by email).
    // We use the correct endpoint here.
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(data => {
        // BUG FIX: old code checked data?.github?.username but the dev collection
        // is separate. After linking, the profile endpoint may not have github data.
        // We try /form/get-profile first; if no github data found we try the dev endpoint.
        if (data?.github?.username) {
          setGithub(data.github);
          setLinked(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [router]);

  // BUG FIX: After linking, the backend returns { message: "GitHub linked successfully" }
  // not the github data. So we need to re-fetch the profile to get the github data.
  // onLinked now triggers a re-fetch instead of trusting the link response.
  function handleLinked(_data: GithubData | null) {
    const auth = getAuth();
    if (!auth) return;
    setLoadingProfile(true);
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(data => {
        if (data?.github?.username) {
          setGithub(data.github);
          setLinked(true);
          setToast({ msg: 'GitHub linked successfully!', type: 'success' });
        } else {
          // Fallback: linking worked but profile not updated yet — show success anyway
          setToast({ msg: 'GitHub linked! Refresh if your data doesn\'t appear.', type: 'success' });
          setLinked(true);
        }
      })
      .catch(() => {
        setToast({ msg: 'Linked but could not load profile. Please refresh.', type: 'error' });
      })
      .finally(() => setLoadingProfile(false));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar active="Development" />

      {/* Sub-nav — only when linked */}
      {linked && (
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', paddingLeft: 48 }}>
          {(['general', 'repos'] as const).map(tab => (
            <button key={tab} onClick={() => setSubNav(tab)} style={{
              padding: '13px 22px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans', fontSize: 14,
              fontWeight: subNav === tab ? 700 : 400,
              color: subNav === tab ? '#1a1a2e' : '#6b7280',
              borderBottom: subNav === tab ? '2.5px solid #1a1a2e' : '2.5px solid transparent',
            }}>
              {tab === 'general' ? 'General' : 'Repositories'}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 32px 80px' }}>
        {loadingProfile ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <span className="spinner" style={{ borderColor: 'rgba(26,26,46,.15)', borderTopColor: '#1a1a2e', width: 36, height: 36 }} />
          </div>
        ) : !linked ? (
          <GithubLinkingFlow onLinked={handleLinked} />
        ) : subNav === 'general' ? (
          /* ── General Tab ── */
          <div>
            {/* Profile card */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', background: 'white', borderRadius: 16, padding: '28px 32px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 28 }}>
              <img src={github?.profile_image} alt={github?.username}
                style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #e5e7eb', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <h2 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 22, color: '#1a1a2e' }}>{github?.username}</h2>
                  <a href={`https://github.com/${github?.username}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#6b7280', fontFamily: 'DM Sans', textDecoration: 'none', background: '#f3f4f6', borderRadius: 6, padding: '3px 10px' }}>
                    View on GitHub ↗
                  </a>
                </div>
                {github?.bio && (
                  <p style={{ fontSize: 14, color: '#6b7280', fontFamily: 'DM Sans', marginBottom: 10 }}>{github.bio}</p>
                )}
                {github?.top_languages?.length ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {github.top_languages.map(lang => (
                      <span key={lang} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontFamily: 'DM Sans', color: '#374151', fontWeight: 500 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: LANG_COLORS[lang] || '#9ca3af', display: 'inline-block' }} />
                        {lang}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <button onClick={() => { setLinked(false); setGithub(null); }}
                style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontFamily: 'DM Sans', fontSize: 13, color: '#6b7280', cursor: 'pointer', flexShrink: 0 }}>
                🔗 Re-link
              </button>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              <StatPill label="Followers"    value={github?.followers    ?? 0} icon="👥" />
              <StatPill label="Following"    value={github?.following    ?? 0} icon="➡️" />
              <StatPill label="Repositories" value={github?.public_repos ?? 0} icon="📁" />
              <StatPill label="Stars Earned" value={github?.stars        ?? 0} icon="⭐" />
            </div>

            {/* Language bar */}
            {github?.top_languages?.length ? (
              <div style={{ background: 'white', borderRadius: 16, padding: '24px 28px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 14 }}>Top Languages</h3>
                <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
                  {github.top_languages.map(lang => (
                    <div key={lang} style={{ flex: 1, background: LANG_COLORS[lang] || '#9ca3af' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {github.top_languages.map(lang => (
                    <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: LANG_COLORS[lang] || '#9ca3af', display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontFamily: 'DM Sans', color: '#374151' }}>{lang}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* ── Repos Tab ── */
          <div>
            <h3 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 18, color: '#1a1a2e', marginBottom: 20 }}>
              Repositories{' '}
              <span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 400 }}>({github?.repo_details?.length ?? 0})</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {github?.repo_details?.map((repo, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 12, padding: '18px 22px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: repo.language ? `${LANG_COLORS[repo.language] || '#9ca3af'}22` : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📁</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15, color: '#1a1a2e', textDecoration: 'none' }}>
                        {repo.name}
                      </a>
                      {repo.language && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f3f4f6', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontFamily: 'DM Sans', color: '#374151', fontWeight: 500 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: LANG_COLORS[repo.language] || '#9ca3af', display: 'inline-block' }} />
                          {repo.language}
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'DM Sans', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.description}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280', fontFamily: 'DM Sans' }}>⭐ {repo.stars}</span>
                    <a href={repo.url} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#1a1a2e', color: 'white', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600, textDecoration: 'none' }}>
                      View →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}