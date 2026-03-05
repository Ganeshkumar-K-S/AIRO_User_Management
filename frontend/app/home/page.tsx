'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, clearAuth, apiGet, apiPatch } from '@/lib/api';
import {
  GraduationCap, Briefcase, Trophy, Zap, Laptop2, MapPin, Phone,
  LogOut, CheckCircle2, Building2, Calendar, Star, Package, Globe,
  Github, Clock, Pencil, Trash2, Plus, PencilLine, Award,
} from 'lucide-react';

/* ── TYPES ── */
interface Auth { token: string; email: string | null; name: string | null; }
interface Education { degree: string; branch: string; institution: string; cgpa?: number; start_year?: number; end_year?: number; }
interface Project { title: string; description: string; tech_stack?: string[]; github_link?: string; live_link?: string; }
interface Skill { name: string; category?: string; level?: number; }
interface Experience { role?: string; company?: string; start_date?: string; end_date?: string; description?: string; }
interface Achievement { title: string; description?: string; date?: string; }
interface Profile {
  full_name?: string; email?: string; phone?: string; location?: string;
  education?: Education[]; projects?: Project[]; skills?: Skill[];
  experience?: Experience[]; achievements?: Achievement[]; certifications?: Certification[];
}
interface Certification { title: string; issuer: string; issue_date?: string; link?: string; }

/* ── DESIGN SYSTEM ── */
const C = {
  ink:        '#0f172a',
  paper:      '#f8fafc',
  surface:    '#ffffff',
  accent:     '#7c3aed',
  accentHov:  '#6d28d9',
  accentSoft: '#ede9fe',
  accent2:    '#ef4444',
  muted:      '#64748b',
  border:     '#e2e8f0',
  success:    '#16a34a',
};

/* ── INPUT STYLES ── */
const inp: React.CSSProperties = {
  width: '100%', padding: '11px 15px', borderRadius: 12,
  border: `1px solid ${C.border}`, fontFamily: 'Montserrat, sans-serif', fontSize: 14,
  outline: 'none', background: C.surface, color: C.ink, boxSizing: 'border-box', transition: 'all 0.2s',
};
const mlbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block',
};
const fg: React.CSSProperties = { display: 'flex', flexDirection: 'column', marginBottom: 16 };

/* ── SCROLL REVEAL ── */
function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { setVisible(entry.isIntersecting); }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? 'translateY(0px)' : 'translateY(32px)', transition: `opacity 0.55s cubic-bezier(.4,0,.2,1) ${delay}ms, transform 0.55s cubic-bezier(.4,0,.2,1) ${delay}ms` } as React.CSSProperties };
}

/* ── NAVBAR ── */
export function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Resume builder', 'DSA'];
  return (
    <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 60, gap: 36, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
      {NAV.map(label => (
        <button key={label} onClick={() => {
          if (label === 'Dashboard') router.push('/home');
          if (label === 'Development') router.push('/development');
          if (label === 'Resume builder') router.push('/resume');
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
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: type === 'success' ? C.success : C.accent2, color: '#fff', borderRadius: 14, padding: '13px 20px', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 32px rgba(15,23,42,0.18)', animation: 'slideUp 0.3s cubic-bezier(.4,0,.2,1)' }}>
      {type === 'success' ? <CheckCircle2 size={16} /> : '✕'} {msg}
    </div>
  );
}

/* ── MODAL ── */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.surface, borderRadius: 24, padding: '30px 34px', width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(15,23,42,0.2)', border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 20, color: C.ink, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: C.paper, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── CONTACT MODAL ── */
function ContactModal({ phone, location, onSave, onClose }: { phone: string; location: string; onSave: (p: string, l: string) => Promise<void>; onClose: () => void; }) {
  const [p, setP] = useState(phone); const [l, setL] = useState(location); const [saving, setSaving] = useState(false);
  return (
    <Modal title="Edit Contact Info" onClose={onClose}>
      <div style={fg}><label style={mlbl}>Phone Number</label><input style={inp} placeholder="+91 9876543210" value={p} onChange={e => setP(e.target.value)} /></div>
      <div style={fg}><label style={mlbl}>Location</label><input style={inp} placeholder="Chennai, Tamil Nadu" value={l} onChange={e => setL(e.target.value)} /></div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: '10px 24px', border: `1px solid ${C.border}`, borderRadius: 12, background: 'none', cursor: 'pointer', color: C.muted, fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600 }}>Cancel</button>
        <button onClick={async () => { setSaving(true); await onSave(p, l); setSaving(false); }} disabled={saving} style={{ padding: '10px 28px', background: C.accent, border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: `0 6px 20px ${C.accent}50` }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

/* ── SKILLS MODAL ── */
function SkillsModal({ existing, onSave, onClose }: { existing: Skill[]; onSave: (skills: Skill[]) => Promise<void>; onClose: () => void; }) {
  const [skills, setSkills] = useState<Skill[]>(existing.length ? existing.map(s => ({ ...s })) : [{ name: '', category: '', level: undefined }]);
  const [saving, setSaving] = useState(false);
  function add() { setSkills(s => [...s, { name: '', category: '', level: undefined }]); }
  function remove(i: number) { setSkills(s => s.filter((_, idx) => idx !== i)); }
  function change(i: number, field: keyof Skill, val: string) {
    setSkills(s => { const n = [...s]; n[i] = { ...n[i], [field]: field === 'level' ? (val ? parseInt(val) : undefined) : val } as Skill; return n; });
  }
  async function save() { const valid = skills.filter(s => s.name.trim()); if (!valid.length) return; setSaving(true); await onSave(valid); setSaving(false); }
  return (
    <Modal title="Manage Skills" onClose={onClose}>
      {skills.map((s, i) => (
        <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 18px', marginBottom: 12, background: C.paper }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: C.ink }}>{s.name || `Skill #${i + 1}`}</span>
            <button onClick={() => remove(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: C.accent2, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr', gap: 10 }}>
            <div style={fg}><label style={mlbl}>Name *</label><input style={inp} placeholder="e.g. React" value={s.name} onChange={e => change(i, 'name', e.target.value)} /></div>
            <div style={fg}><label style={mlbl}>Category</label><input style={inp} placeholder="Frontend" value={s.category || ''} onChange={e => change(i, 'category', e.target.value)} /></div>
            <div style={fg}><label style={mlbl}>Level 1–10</label><input style={inp} type="number" min="1" max="10" placeholder="8" value={s.level ?? ''} onChange={e => change(i, 'level', e.target.value)} /></div>
          </div>
        </div>
      ))}
      <button onClick={add} style={{ width: '100%', padding: 13, border: `2px dashed ${C.border}`, borderRadius: 12, background: 'transparent', cursor: 'pointer', color: C.accent, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Plus size={16} /> Add Skill
      </button>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '10px 24px', border: `1px solid ${C.border}`, borderRadius: 12, background: 'none', cursor: 'pointer', color: C.muted, fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600 }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding: '10px 28px', background: C.accent, border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: `0 6px 20px ${C.accent}50` }}>
          {saving ? 'Saving…' : 'Save Skills'}
        </button>
      </div>
    </Modal>
  );
}

/* ── SECTION HEADER ── */
function SectionHead({ title, count, subtitle, onAdd, addLabel = '+ Add' }: { title: string; count: number; subtitle: string; onAdd: () => void; addLabel?: string; }) {
  const reveal = useScrollReveal(0);
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, color: C.ink, margin: 0, letterSpacing: '-0.5px' }}>{title}</h2>
          <span style={{ minWidth: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', boxShadow: `0 4px 12px ${C.accent}40` }}>{count}</span>
        </div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: C.muted, margin: 0 }}>{subtitle}</p>
      </div>
      <button onClick={onAdd}
        onMouseEnter={e => { e.currentTarget.style.background = C.accentHov; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${C.accent}50`; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 6px 20px ${C.accent}40`; }}
        style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '12px 24px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s cubic-bezier(.4,0,.2,1)', boxShadow: `0 6px 20px ${C.accent}40`, whiteSpace: 'nowrap' }}>
        {addLabel}
      </button>
    </div>
  );
}

/* ── HORIZONTAL SCROLL CONTAINER ── */
function HScroll({ children }: { children: React.ReactNode }) {
  const reveal = useScrollReveal(100);
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, display: 'flex', gap: 22, overflowX: 'auto', padding: '14px 0 20px', scrollbarWidth: 'none', overflowY: 'visible' }}>
      {children}
    </div>
  );
}

/* ── INFO CARD ── */
function InfoCard({ accentColor, typeBadge, yearBadge, title, subtitle, stats, footer, onEdit, onDelete }: {
  accentColor: string; typeBadge?: string; yearBadge?: string;
  title: string; subtitle?: string;
  stats?: { icon?: React.ReactNode; label: string; value: string }[];
  footer?: React.ReactNode; onEdit: () => void; onDelete: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ minWidth: 420, maxWidth: 420, flexShrink: 0, borderRadius: 24, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80) top / 100% 4px no-repeat, ${C.surface}`, border: `1px solid ${hov ? accentColor + '55' : C.border}`, boxShadow: hov ? `0 25px 60px rgba(15,23,42,0.14), 0 0 0 1px ${accentColor}20` : '0 4px 18px rgba(15,23,42,0.07)', transform: hov ? 'translateY(-7px) scale(1.01)' : 'none', transition: 'all 0.3s cubic-bezier(.4,0,.2,1)', overflow: 'hidden' }}>
      {/* Badge + actions row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 22px 0', flexWrap: 'wrap' }}>
        {typeBadge && (
          <span style={{ background: `${accentColor}15`, border: `1.5px solid ${accentColor}40`, borderRadius: 999, padding: '5px 16px', fontSize: 12.5, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: accentColor, whiteSpace: 'nowrap' }}>{typeBadge}</span>
        )}
        {yearBadge && (
          <span style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 999, padding: '5px 13px', fontSize: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: C.muted, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Clock size={12} color={C.muted} /> {yearBadge}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, opacity: hov ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button onClick={onEdit} style={{ background: C.accentSoft, border: 'none', borderRadius: 9, padding: '6px 14px', fontSize: 12.5, color: C.accent, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Pencil size={12} /> Edit
          </button>
          <button onClick={onDelete} style={{ background: '#fee2e2', border: 'none', borderRadius: 9, padding: '6px 14px', fontSize: 12.5, color: C.accent2, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 22px 24px' }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 20, color: C.ink, lineHeight: 1.3, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</p>
        {subtitle && <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: C.muted, margin: '0 0 18px', lineHeight: 1.65, wordBreak: 'break-word' }}>{subtitle}</p>}

        {stats && stats.length > 0 && (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', marginTop: subtitle ? 0 : 14, background: C.paper }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding: '11px 16px', borderBottom: i < stats.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = `${accentColor}08`)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {s.icon && <span style={{ color: C.muted, display: 'flex', alignItems: 'center' }}>{s.icon}</span>}
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                </div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: C.ink, margin: 0, textAlign: 'right', wordBreak: 'break-word', maxWidth: '60%' }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {footer && <div style={{ marginTop: 16 }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ── EMPTY STATE ── */
function Empty({ icon, text, onAdd, label }: { icon: React.ReactNode; text: string; onAdd: () => void; label: string }) {
  const reveal = useScrollReveal(60);
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, border: `2px dashed ${C.border}`, borderRadius: 20, padding: '48px 24px', textAlign: 'center', background: `linear-gradient(135deg, ${C.paper}, ${C.accentSoft}30)` }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: C.accent }}>
        {icon}
      </div>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, color: C.muted, margin: '0 0 22px', fontWeight: 500 }}>{text}</p>
      <button onClick={onAdd}
        onMouseEnter={e => { e.currentTarget.style.background = C.accentHov; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = 'none'; }}
        style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 14, padding: '12px 28px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: `0 6px 20px ${C.accent}40`, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <Plus size={16} /> {label}
      </button>
    </div>
  );
}

/* ── SKILLS REVEAL ── */
function SkillsReveal({ children }: { children: React.ReactNode }) {
  const reveal = useScrollReveal(80);
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {children}
    </div>
  );
}

/* ── HOME PAGE ── */
export default function HomePage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<'skills' | 'contact' | null>(null);

  const fetchProfile = useCallback(async (email: string) => {
    const data = await apiGet(`/form/get-profile/${encodeURIComponent(email)}`);
    setProfile(data);
  }, []);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.replace('/login'); return; }
    setAuth(a);
    if (a.email) fetchProfile(a.email).catch(() => setProfile({})).finally(() => setLoading(false));
  }, [router, fetchProfile]);

  function logout() { clearAuth(); router.push('/login'); }

  async function patch(payload: Partial<Profile>, msg: string) {
    try {
      const cleaned = JSON.parse(JSON.stringify(payload, (key, value) => { if (value === "") return null; return value; }));
      await apiPatch('/form/update-profile', cleaned);
      setProfile(p => ({ ...p, ...cleaned }));
      setModal(null);
      setToast({ msg, type: 'success' });
    } catch { setToast({ msg: 'Failed to save', type: 'error' }); }
  }

  const del = {
    edu:  (i: number) => patch({ education:      (profile?.education      ?? []).filter((_, idx) => idx !== i) }, 'Education removed'),
    proj: (i: number) => patch({ projects:       (profile?.projects       ?? []).filter((_, idx) => idx !== i) }, 'Project removed'),
    exp:  (i: number) => patch({ experience:     (profile?.experience     ?? []).filter((_, idx) => idx !== i) }, 'Experience removed'),
    ach:  (i: number) => patch({ achievements:   (profile?.achievements   ?? []).filter((_, idx) => idx !== i) }, 'Achievement removed'),
    cert: (i: number) => patch({ certifications: (profile?.certifications ?? []).filter((_, idx) => idx !== i) }, 'Certification removed'),
    skill:(i: number) => patch({ skills:         (profile?.skills         ?? []).filter((_, idx) => idx !== i) }, 'Skill removed'),
  };

  if (!auth) return null;

  const displayName = profile?.full_name || auth.name || auth.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';

  const SIDEBAR_W = 285;
  const NAV_H = 60;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f8fafc 0%,#eef2ff 60%,#f5f3ff 100%)', fontFamily: 'Montserrat, sans-serif' }}>
      <Navbar active="Dashboard" />

      {/* SIDEBAR */}
      <aside style={{ position: 'fixed', top: NAV_H, left: 0, width: SIDEBAR_W, height: `calc(100vh - ${NAV_H}px)`, overflowY: 'auto', borderRight: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', padding: '40px 28px 40px 34px', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        {/* Avatar */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 24, marginBottom: 16, flexShrink: 0, boxShadow: `0 12px 30px ${C.accent}45` }}>{initials}</div>

        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 18, color: C.ink, margin: '0 0 4px' }}>{displayName}</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.muted, margin: '0 0 24px', wordBreak: 'break-all', lineHeight: 1.5 }}>{auth.email}</p>

        {/* Location */}
        <button onClick={() => setModal('contact')}
          onMouseEnter={e => (e.currentTarget.style.borderColor = C.accent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', fontSize: 13.5, color: profile?.location ? C.ink : C.muted, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', textAlign: 'left', marginBottom: 8, transition: 'border-color 0.2s' }}>
          <MapPin size={16} color={C.muted} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.location || 'Add location'}</span>
        </button>

        {/* Phone */}
        <button onClick={() => setModal('contact')}
          onMouseEnter={e => (e.currentTarget.style.borderColor = C.accent)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
          style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', fontSize: 13.5, color: profile?.phone ? C.ink : C.muted, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', textAlign: 'left', marginBottom: 32, transition: 'border-color 0.2s' }}>
          <Phone size={16} color={C.muted} />
          <span>{profile?.phone || 'Add phone'}</span>
        </button>

        <button onClick={logout}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent2; e.currentTarget.style.color = C.accent2; e.currentTarget.style.background = '#fff0f0'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'none'; }}
          style={{ width: '100%', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', fontFamily: 'Montserrat, sans-serif', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: C.muted, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogOut size={15} /> Logout
        </button>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: SIDEBAR_W, paddingTop: NAV_H, minHeight: '100vh' }}>
        <div style={{ padding: '56px 64px 110px' }}>

          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 48, color: C.ink, margin: '0 0 10px', letterSpacing: '-2px', lineHeight: 1 }}>
            My <span style={{ color: C.accent }}>Profile</span>
          </h1>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, color: C.muted, margin: '0 0 56px', fontWeight: 500 }}>
            Manage, update, and track all your profile information
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 100 }}>
              <span className="spinner" style={{ borderColor: `${C.accent}25`, borderTopColor: C.accent, width: 40, height: 40 }} />
            </div>
          ) : (<>

            {/* EDUCATION */}
            <div style={{ marginBottom: 66 }}>
              <SectionHead title="Education" count={profile?.education?.length ?? 0}
                subtitle="Your academic background and qualifications"
                onAdd={() => router.push('/profile/education')} addLabel="+ Add Education" />
              {profile?.education?.length ? (
                <HScroll>
                  {profile.education.map((e, i) => (
                    <InfoCard key={i} accentColor="#7c3aed"
                      typeBadge={e.degree}
                      yearBadge={`${e.start_year ?? '?'}–${e.end_year ?? 'Now'}`}
                      title={e.branch || e.degree} subtitle={e.institution}
                      stats={[
                        { icon: <Building2 size={14} />, label: 'Institution', value: e.institution || '—' },
                        { icon: <Star size={14} />,      label: 'CGPA',        value: e.cgpa ? String(e.cgpa) : '—' },
                        { icon: <Calendar size={14} />,  label: 'Start Year',  value: e.start_year ? String(e.start_year) : '—' },
                        { icon: <Calendar size={14} />,  label: 'End Year',    value: e.end_year ? String(e.end_year) : 'Present' },
                      ]}
                      onEdit={() => router.push(`/profile/education?edit=${i}`)}
                      onDelete={() => del.edu(i)} />
                  ))}
                </HScroll>
              ) : <Empty icon={<GraduationCap size={28} />} text="Add your degrees, diplomas, and certifications" onAdd={() => router.push('/profile/education')} label="Add Education" />}
            </div>

            {/* PROJECTS */}
            <div style={{ marginBottom: 66 }}>
              <SectionHead title="Projects" count={profile?.projects?.length ?? 0}
                subtitle="Showcase your work, side projects, and contributions"
                onAdd={() => router.push('/profile/projects')} addLabel="+ Add Project" />
              {profile?.projects?.length ? (
                <HScroll>
                  {profile.projects.map((p, i) => (
                    <InfoCard key={i} accentColor="#f97316"
                      typeBadge="Project"
                      yearBadge={p.tech_stack?.slice(0, 2).join(' · ') || undefined}
                      title={p.title} subtitle={p.description}
                      stats={[
                        { icon: <Package size={14} />, label: 'Stack',     value: p.tech_stack?.slice(0, 2).join(', ') || '—' },
                        { icon: <Package size={14} />, label: 'More Tech', value: p.tech_stack && p.tech_stack.length > 2 ? `+${p.tech_stack.length - 2} more` : '—' },
                      ]}
                      footer={
                        (p.github_link || p.live_link) ? (
                          <div style={{ display: 'flex', gap: 16 }}>
                            {p.github_link && <a href={p.github_link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.accent, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textDecoration: 'none' }}><Github size={13} /> GitHub</a>}
                            {p.live_link   && <a href={p.live_link}   target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.success, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textDecoration: 'none' }}><Globe size={13} /> Live</a>}
                          </div>
                        ) : undefined
                      }
                      onEdit={() => router.push(`/profile/projects?edit=${i}`)}
                      onDelete={() => del.proj(i)} />
                  ))}
                </HScroll>
              ) : <Empty icon={<Laptop2 size={28} />} text="Add projects to showcase your technical skills" onAdd={() => router.push('/profile/projects')} label="Add Project" />}
            </div>

            {/* SKILLS */}
            <div style={{ marginBottom: 66 }}>
              <SectionHead title="Skills" count={profile?.skills?.length ?? 0}
                subtitle="Technologies, tools, and expertise you've mastered"
                onAdd={() => setModal('skills')} addLabel="+ Manage Skills" />
              {profile?.skills?.length ? (
                <SkillsReveal>
                  {profile.skills.map((s, i) => (
                    <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 16px', boxShadow: '0 2px 8px rgba(15,23,42,0.06)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none'; }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: C.ink }}>{s.name}</span>
                      {s.category && <span style={{ fontSize: 11.5, color: C.accent, background: C.accentSoft, borderRadius: 6, padding: '2px 9px', fontWeight: 700 }}>{s.category}</span>}
                      {s.level !== undefined && <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>Lv{s.level}</span>}
                      <button onClick={() => del.skill(i)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setModal('skills')}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.surface, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '10px 18px', color: C.muted, fontSize: 13.5, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, transition: 'all 0.2s' }}>
                    <PencilLine size={14} /> Edit all
                  </button>
                </SkillsReveal>
              ) : <Empty icon={<Zap size={28} />} text="Add your technical skills, frameworks, and tools" onAdd={() => setModal('skills')} label="Add Skills" />}
            </div>

            {/* EXPERIENCE */}
            <div style={{ marginBottom: 66 }}>
              <SectionHead title="Experience" count={profile?.experience?.length ?? 0}
                subtitle="Work history, internships, and professional roles"
                onAdd={() => router.push('/profile/experience')} addLabel="+ Add Experience" />
              {profile?.experience?.length ? (
                <HScroll>
                  {profile.experience.map((e, i) => (
                    <InfoCard key={i} accentColor="#16a34a"
                      typeBadge={e.company}
                      yearBadge={!e.end_date ? 'Current' : undefined}
                      title={e.role || 'Role'} subtitle={e.company}
                      stats={[
                        { icon: <Building2 size={14} />, label: 'Company', value: e.company || '—' },
                        { icon: <Calendar size={14} />,  label: 'Period',  value: `${fmtDate(e.start_date)} – ${fmtDate(e.end_date)}` },
                      ]}
                      footer={e.description ? (
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.description}</p>
                      ) : undefined}
                      onEdit={() => router.push(`/profile/experience?edit=${i}`)}
                      onDelete={() => del.exp(i)} />
                  ))}
                </HScroll>
              ) : <Empty icon={<Briefcase size={28} />} text="Add internships, jobs, and freelance work to your profile" onAdd={() => router.push('/profile/experience')} label="Add Experience" />}
            </div>

            {/* ACHIEVEMENTS */}
            <div style={{ marginBottom: 66 }}>
              <SectionHead title="Achievements" count={profile?.achievements?.length ?? 0}
                subtitle="Awards, certifications, hackathons, and milestones"
                onAdd={() => router.push('/profile/achievements')} addLabel="+ Add Achievement" />
              {profile?.achievements?.length ? (
                <HScroll>
                  {profile.achievements.map((a, i) => (
                    <InfoCard key={i} accentColor="#d97706"
                      typeBadge="Achievement"
                      yearBadge={a.date ? new Date(a.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : undefined}
                      title={a.title} subtitle={a.description}
                      stats={a.date ? [
                        { icon: <Calendar size={14} />, label: 'Date', value: new Date(a.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
                      ] : undefined}
                      onEdit={() => router.push(`/profile/achievements?edit=${i}`)}
                      onDelete={() => del.ach(i)} />
                  ))}
                </HScroll>
              ) : <Empty icon={<Trophy size={28} />} text="Add hackathon wins, certifications, and recognitions" onAdd={() => router.push('/profile/achievements')} label="Add Achievement" />}
            </div>
            {/* CERTIFICATIONS - NEW SECTION */}
            <div style={{ marginBottom: 66 }}>
              <SectionHead title="Certifications" count={profile?.certifications?.length ?? 0}
                subtitle="Professional certifications and credentials you've earned"
                onAdd={() => router.push('/profile/certifications')} addLabel="+ Add Certification" />
              {profile?.certifications?.length ? (
                <HScroll>
                  {profile.certifications.map((c, i) => (
                    <InfoCard key={i} accentColor="#eab308"
                      typeBadge={c.issuer}
                      yearBadge={c.issue_date ? new Date(c.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : undefined}
                      title={c.title} subtitle={c.issuer}
                      stats={[
                        { icon: <Building2 size={14} />, label: 'Issuer', value: c.issuer || '—' },
                        { icon: <Calendar size={14} />,  label: 'Issued', value: c.issue_date ? new Date(c.issue_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
                      ]}
                      footer={c.link ? (
                        <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.accent, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textDecoration: 'none' }}>
                          <Award size={13} /> View Certificate
                        </a>
                      ) : undefined}
                      onEdit={() => router.push(`/profile/certifications?edit=${i}`)}
                      onDelete={() => del.cert(i)} />
                  ))}
                </HScroll>
              ) : <Empty icon={<Award size={28} />} text="Add professional certifications and credentials" onAdd={() => router.push('/profile/certifications')} label="Add Certification" />}
            </div>

          </>)}
        </div>

      </main>

      {modal === 'contact' && (
        <ContactModal phone={profile?.phone || ''} location={profile?.location || ''}
          onSave={async (p, l) => { await patch({ phone: p, location: l }, 'Contact updated!'); }}
          onClose={() => setModal(null)} />
      )}
      {modal === 'skills' && (
        <SkillsModal existing={profile?.skills ?? []}
          onSave={async skills => { await patch({ skills }, 'Skills updated!'); }}
          onClose={() => setModal(null)} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}