'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, clearAuth, apiGet, apiPatch } from '@/lib/api';

interface Auth { token: string; email: string | null; name: string | null; }
interface Education { degree: string; branch: string; institution: string; cgpa?: number; start_year?: number; end_year?: number; }
interface Project { title: string; description: string; tech_stack?: string[]; github_link?: string; live_link?: string; }
interface Skill { name: string; category?: string; level?: number; }
interface Experience { role?: string; company?: string; start_date?: string; end_date?: string; description?: string; }
interface Achievement { title: string; description?: string; date?: string; }
interface Profile {
  full_name?: string; email?: string; phone?: string; location?: string;
  education?: Education[]; projects?: Project[]; skills?: Skill[];
  experience?: Experience[]; achievements?: Achievement[];
}

// ─── Navbar ────────────────────────────────────────────────────────────────
export function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Machine Learning', 'DSA'];
  return (
    <nav style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '0 48px', height: 56, gap: 40,
      background: 'white', borderBottom: '1px solid #e5e7eb',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {NAV.map(label => (
        <button key={label} onClick={() => {
          if (label === 'Dashboard') router.push('/home');
          if (label === 'Development') router.push('/development');
        }} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif', fontSize: 14,
          color: active === label ? '#1a1a2e' : '#6b7280',
          fontWeight: active === label ? 700 : 400,
          padding: '4px 0',
          borderBottom: active === label ? '2.5px solid #1a1a2e' : '2.5px solid transparent',
          transition: 'all 0.2s',
        }}>{label}</button>
      ))}
    </nav>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: type === 'success' ? '#22c55e' : '#ef4444',
      color: 'white', borderRadius: 10, padding: '12px 18px',
      fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14,
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '28px 32px',
        width: '100%', maxWidth: 540, maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#1a1a2e' }}>{title}</h2>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid #e5e7eb', fontFamily: 'DM Sans', fontSize: 14,
  outline: 'none', background: 'white', color: '#1a1a2e', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, fontFamily: 'DM Sans' };
const formGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', marginBottom: 14 };

// ─── Contact Edit Modal ─────────────────────────────────────────────────────
function ContactModal({ phone, location, onSave, onClose }: {
  phone: string; location: string;
  onSave: (phone: string, location: string) => Promise<void>;
  onClose: () => void;
}) {
  const [p, setP] = useState(phone);
  const [l, setL] = useState(location);
  const [saving, setSaving] = useState(false);
  return (
    <Modal title="Edit Contact Info" onClose={onClose}>
      <div style={formGroup}>
        <label style={labelStyle}>Phone Number</label>
        <input style={inputStyle} placeholder="+91 9876543210" value={p} onChange={e => setP(e.target.value)} />
      </div>
      <div style={formGroup}>
        <label style={labelStyle}>Location</label>
        <input style={inputStyle} placeholder="Chennai, Tamil Nadu" value={l} onChange={e => setL(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: '10px 22px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'DM Sans', fontSize: 14 }}>Cancel</button>
        <button onClick={async () => { setSaving(true); await onSave(p, l); setSaving(false); }}
          disabled={saving} style={{ padding: '10px 28px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Skills Modal ──────────────────────────────────────────────────────────
function SkillsModal({ existing, onSave, onClose }: {
  existing: Skill[];
  onSave: (skills: Skill[]) => Promise<void>;
  onClose: () => void;
}) {
  const [skills, setSkills] = useState<Skill[]>(existing.length ? existing.map(s => ({ ...s })) : [{ name: '', category: '', level: undefined }]);
  const [saving, setSaving] = useState(false);

  function addSkill() { setSkills(s => [...s, { name: '', category: '', level: undefined }]); }
  function removeSkill(i: number) { setSkills(s => s.filter((_, idx) => idx !== i)); }
  function change(i: number, field: keyof Skill, val: string) {
    setSkills(s => { const n = [...s]; n[i] = { ...n[i], [field]: field === 'level' ? (val ? parseInt(val) : undefined) : val } as Skill; return n; });
  }

  async function handleSave() {
    const valid = skills.filter(s => s.name.trim());
    if (!valid.length) return;
    setSaving(true);
    await onSave(valid);
    setSaving(false);
  }

  return (
    <Modal title="Edit Skills" onClose={onClose}>
      {skills.map((s, i) => (
        <div key={i} style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>Skill #{i + 1}</span>
            <button type="button" onClick={() => removeSkill(i)} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 9px', fontSize: 12, color: '#ef4444', cursor: 'pointer', fontFamily: 'DM Sans' }}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
            <div style={formGroup}><label style={labelStyle}>Name *</label><input style={inputStyle} placeholder="e.g. React" value={s.name} onChange={e => change(i, 'name', e.target.value)} /></div>
            <div style={formGroup}><label style={labelStyle}>Category</label><input style={inputStyle} placeholder="Frontend" value={s.category || ''} onChange={e => change(i, 'category', e.target.value)} /></div>
            <div style={formGroup}><label style={labelStyle}>Level (1–10)</label><input style={inputStyle} type="number" min="1" max="10" placeholder="8" value={s.level ?? ''} onChange={e => change(i, 'level', e.target.value)} /></div>
          </div>
        </div>
      ))}
      <button onClick={addSkill} style={{ width: '100%', padding: 12, border: '2px dashed #e5e7eb', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#06b6d4', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, marginBottom: 20 }}>+ Add Skill</button>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '10px 22px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'DM Sans', fontSize: 14 }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Skills'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Experience Modal ──────────────────────────────────────────────────────
function ExperienceModal({ existing, editIdx, onSave, onClose }: {
  existing: Experience[];
  editIdx: number | null;
  onSave: (experience: Experience[]) => Promise<void>;
  onClose: () => void;
}) {
  const empty: Experience = { role: '', company: '', start_date: '', end_date: '', description: '' };
  // BUG FIX: if editIdx is set, pre-populate with just that item so the user
  // edits the specific entry rather than the entire list.
  const initialEntries = editIdx !== null && existing[editIdx]
    ? [{ ...existing[editIdx] }]
    : (existing.length ? existing.map(e => ({ ...e })) : [{ ...empty }]);
  const [entries, setEntries] = useState<Experience[]>(initialEntries);
  const [saving, setSaving] = useState(false);

  function change(i: number, field: keyof Experience, val: string) {
    setEntries(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n; });
  }

  async function handleSave() {
    const valid = entries.filter(e => e.role || e.company);
    setSaving(true);
    // BUG FIX: If we were editing a specific item (editIdx), merge just that
    // changed item back into the full list. Previously it replaced ALL experience
    // entries with only the ones visible in the modal.
    let merged: Experience[];
    if (editIdx !== null && existing[editIdx]) {
      merged = existing.map((item, i) => i === editIdx ? (valid[0] ?? item) : item);
    } else {
      merged = valid;
    }
    await onSave(merged);
    setSaving(false);
  }

  return (
    <Modal title="Edit Experience" onClose={onClose}>
      {entries.map((e, i) => (
        <div key={i} style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{e.role || e.company || `Experience #${i + 1}`}</span>
            <button type="button" onClick={() => setEntries(p => p.filter((_, idx) => idx !== i))} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 9px', fontSize: 12, color: '#ef4444', cursor: 'pointer', fontFamily: 'DM Sans' }}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={formGroup}><label style={labelStyle}>Role</label><input style={inputStyle} placeholder="Software Engineer" value={e.role || ''} onChange={ev => change(i, 'role', ev.target.value)} /></div>
            <div style={formGroup}><label style={labelStyle}>Company</label><input style={inputStyle} placeholder="Google" value={e.company || ''} onChange={ev => change(i, 'company', ev.target.value)} /></div>
            <div style={formGroup}><label style={labelStyle}>Start Date</label><input style={inputStyle} type="date" value={e.start_date ? e.start_date.slice(0, 10) : ''} onChange={ev => change(i, 'start_date', ev.target.value)} /></div>
            <div style={formGroup}><label style={labelStyle}>End Date</label><input style={inputStyle} type="date" value={e.end_date ? e.end_date.slice(0, 10) : ''} onChange={ev => change(i, 'end_date', ev.target.value)} /></div>
          </div>
          <div style={formGroup}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} rows={3} placeholder="What did you do?" value={e.description || ''} onChange={ev => change(i, 'description', ev.target.value)} /></div>
        </div>
      ))}
      <button onClick={() => setEntries(p => [...p, { role: '', company: '', start_date: '', end_date: '', description: '' }])} style={{ width: '100%', padding: 12, border: '2px dashed #e5e7eb', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#22c55e', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, marginBottom: 20 }}>+ Add Experience</button>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '10px 22px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'DM Sans', fontSize: 14 }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Experience'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Achievements Modal ─────────────────────────────────────────────────────
function AchievementsModal({ existing, editIdx, onSave, onClose }: {
  existing: Achievement[];
  editIdx: number | null;
  onSave: (achievements: Achievement[]) => Promise<void>;
  onClose: () => void;
}) {
  // BUG FIX: same fix as ExperienceModal — pre-select the specific item being edited
  const initialEntries = editIdx !== null && existing[editIdx]
    ? [{ ...existing[editIdx] }]
    : (existing.length ? existing.map(e => ({ ...e })) : [{ title: '', description: '', date: '' }]);
  const [entries, setEntries] = useState<Achievement[]>(initialEntries);
  const [saving, setSaving] = useState(false);

  function change(i: number, field: keyof Achievement, val: string) {
    setEntries(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n; });
  }

  async function handleSave() {
    const valid = entries.filter(e => e.title.trim());
    setSaving(true);
    // BUG FIX: merge only the edited item back, same pattern as ExperienceModal
    let merged: Achievement[];
    if (editIdx !== null && existing[editIdx]) {
      merged = existing.map((item, i) => i === editIdx ? (valid[0] ?? item) : item);
    } else {
      merged = valid;
    }
    await onSave(merged);
    setSaving(false);
  }

  return (
    <Modal title="Edit Achievements" onClose={onClose}>
      {entries.map((a, i) => (
        <div key={i} style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{a.title || `Achievement #${i + 1}`}</span>
            <button type="button" onClick={() => setEntries(p => p.filter((_, idx) => idx !== i))} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 9px', fontSize: 12, color: '#ef4444', cursor: 'pointer', fontFamily: 'DM Sans' }}>Remove</button>
          </div>
          <div style={formGroup}><label style={labelStyle}>Title *</label><input style={inputStyle} placeholder="Won Hackathon" value={a.title} onChange={e => change(i, 'title', e.target.value)} /></div>
          <div style={formGroup}><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Tell more..." value={a.description || ''} onChange={e => change(i, 'description', e.target.value)} /></div>
          <div style={formGroup}><label style={labelStyle}>Date</label><input style={inputStyle} type="date" value={a.date ? a.date.slice(0, 10) : ''} onChange={e => change(i, 'date', e.target.value)} /></div>
        </div>
      ))}
      <button onClick={() => setEntries(p => [...p, { title: '', description: '', date: '' }])} style={{ width: '100%', padding: 12, border: '2px dashed #e5e7eb', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#d97706', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, marginBottom: 20 }}>+ Add Achievement</button>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '10px 22px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'DM Sans', fontSize: 14 }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', background: '#1a1a2e', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Achievements'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHead({ icon, title, onAdd, onEdit }: { icon: string; title: string; onAdd: () => void; onEdit?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 17, color: '#1a1a2e' }}>{title}</span>
      </div>
      <button onClick={onAdd} style={{
        width: 30, height: 30, borderRadius: 8,
        background: '#f3f4f6', border: '1.5px solid #e5e7eb',
        color: '#6b7280', cursor: 'pointer', fontSize: 20, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>+</button>
    </div>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
      {children}
    </div>
  );
}

// ─── Cards with SkippyEd overlay style ──────────────────────────────────────
function CardShell({
  headerBg, headerContent, children, onEdit, onDelete, width = 240,
}: {
  headerBg: string; headerContent: React.ReactNode;
  children: React.ReactNode; onEdit: () => void; onDelete: () => void; width?: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      minWidth: width, maxWidth: width, flexShrink: 0, borderRadius: 12, overflow: 'hidden',
      border: '1px solid #e5e7eb', background: 'white',
      boxShadow: hov ? '0 4px 20px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ background: headerBg, height: 88, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {headerContent}
        {/* Overlay bar like SkippyEd "Enroll Now | 3 hours" */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          padding: '8px 14px',
          opacity: hov ? 1 : 0, transition: 'opacity 0.2s',
        }}>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', color: 'white', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            ✏️ Edit
          </button>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>|</span>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#fca5a5', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            🗑 Delete
          </button>
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>{children}</div>
    </div>
  );
}

function EduCard({ edu, onEdit, onDelete }: { edu: Education; onEdit: () => void; onDelete: () => void }) {
  return (
    <CardShell width={240} headerBg="linear-gradient(135deg,#ede9fe,#c4b5fd)" headerContent={<span style={{ fontSize: 34 }}>🎓</span>} onEdit={onEdit} onDelete={onDelete}>
      <p style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 3, lineHeight: 1.3 }}>{edu.degree}</p>
      <p style={{ fontSize: 13, color: '#7c3aed', fontWeight: 500, marginBottom: 2 }}>{edu.branch}</p>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 2 }}>{edu.institution}</p>
      {edu.cgpa && <p style={{ fontSize: 12, color: '#9ca3af' }}>CGPA: {edu.cgpa}</p>}
      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{edu.start_year} – {edu.end_year ?? 'Present'}</p>
    </CardShell>
  );
}

function ProjCard({ proj, onEdit, onDelete }: { proj: Project; onEdit: () => void; onDelete: () => void }) {
  return (
    <CardShell width={260} headerBg="linear-gradient(135deg,#fff7ed,#fed7aa)" headerContent={<span style={{ fontSize: 34 }}>💻</span>} onEdit={onEdit} onDelete={onDelete}>
      <p style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 5 }}>{proj.title}</p>
      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{proj.description}</p>
      {proj.tech_stack?.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 7 }}>
          {proj.tech_stack.slice(0, 3).map(t => <span key={t} style={{ background: '#fff7ed', color: '#f97316', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 500 }}>{t}</span>)}
        </div>
      ) : null}
      <div style={{ display: 'flex', gap: 10 }}>
        {proj.github_link && <a href={proj.github_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#7c3aed', fontFamily: 'DM Sans', fontWeight: 500 }}>GitHub →</a>}
        {proj.live_link && <a href={proj.live_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#22c55e', fontFamily: 'DM Sans', fontWeight: 500 }}>Live →</a>}
      </div>
    </CardShell>
  );
}

function ExpCard({ exp, onEdit, onDelete }: { exp: Experience; onEdit: () => void; onDelete: () => void }) {
  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';
  return (
    <CardShell width={240} headerBg="linear-gradient(135deg,#f0fdf4,#bbf7d0)" headerContent={<span style={{ fontSize: 34 }}>💼</span>} onEdit={onEdit} onDelete={onDelete}>
      <p style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 3 }}>{exp.role}</p>
      <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 500, marginBottom: 4 }}>{exp.company}</p>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 5 }}>{fmt(exp.start_date)} – {fmt(exp.end_date)}</p>
      {exp.description && <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{exp.description}</p>}
    </CardShell>
  );
}

function AchCard({ ach, onEdit, onDelete }: { ach: Achievement; onEdit: () => void; onDelete: () => void }) {
  return (
    <CardShell width={220} headerBg="linear-gradient(135deg,#fffbeb,#fde68a)" headerContent={<span style={{ fontSize: 34 }}>🏆</span>} onEdit={onEdit} onDelete={onDelete}>
      <p style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>{ach.title}</p>
      {ach.description && <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{ach.description}</p>}
    </CardShell>
  );
}

// ─── Home Page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  type ModalType = 'skills' | 'experience' | 'achievements' | 'contact' | null;
  const [modal, setModal] = useState<ModalType>(null);

  // BUG FIX: Track which specific item index is being edited in a modal.
  // Previously, clicking "Edit" on any ExpCard/AchCard just opened the modal
  // for the entire list with no way to know which item was selected — so
  // editing always operated on the first entry. Now we pass the idx to the
  // modal so it can pre-select the right item.
  const [modalEditIdx, setModalEditIdx] = useState<number | null>(null);

  function openModal(type: ModalType, idx?: number) {
    setModal(type);
    setModalEditIdx(idx ?? null);
  }

  const fetchProfile = useCallback(async (email: string) => {
    const data = await apiGet(`/form/get-profile/${encodeURIComponent(email)}`);
    setProfile(data);
  }, []);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.replace('/login'); return; }
    setAuth(a);
    if (a.email) {
      fetchProfile(a.email).catch(() => setProfile({})).finally(() => setLoading(false));
    }
  }, [router, fetchProfile]);

  function logout() { clearAuth(); router.push('/login'); }

  // ── Generic patch helper ──
  async function patch(payload: Partial<Profile>, successMsg: string) {
    try {
      await apiPatch('/form/update-profile', payload);
      setProfile(p => ({ ...p, ...payload }));
      setModal(null);
      setToast({ msg: successMsg, type: 'success' });
    } catch {
      setToast({ msg: 'Failed to save', type: 'error' });
    }
  }

  // ── Skills ──
  async function saveSkills(skills: Skill[]) { await patch({ skills }, 'Skills saved!'); }

  // ── Experience ──
  async function saveExperience(experience: Experience[]) { await patch({ experience }, 'Experience saved!'); }

  // ── Achievements ──
  async function saveAchievements(achievements: Achievement[]) { await patch({ achievements }, 'Achievements saved!'); }

  // ── Contact ──
  async function saveContact(phone: string, location: string) { await patch({ phone, location }, 'Contact updated!'); }

  // ── Delete helpers ──
  async function deleteEdu(idx: number) {
    const education = (profile?.education ?? []).filter((_, i) => i !== idx);
    await patch({ education }, 'Education removed');
  }
  async function deleteProj(idx: number) {
    const projects = (profile?.projects ?? []).filter((_, i) => i !== idx);
    await patch({ projects }, 'Project removed');
  }
  async function deleteExp(idx: number) {
    const experience = (profile?.experience ?? []).filter((_, i) => i !== idx);
    await patch({ experience }, 'Experience removed');
  }
  async function deleteAch(idx: number) {
    const achievements = (profile?.achievements ?? []).filter((_, i) => i !== idx);
    await patch({ achievements }, 'Achievement removed');
  }
  async function deleteSkill(idx: number) {
    const skills = (profile?.skills ?? []).filter((_, i) => i !== idx);
    await patch({ skills }, 'Skill removed');
  }

  if (!auth) return null;

  const displayName = profile?.full_name || auth.name || auth.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar active="Dashboard" />

      {/* Profile strip */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '14px 52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{initials}</div>
          <div>
            <p style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>
              Welcome back, <span style={{ color: '#7c3aed' }}>{displayName}</span> 👋
            </p>
            <p style={{ fontSize: 12.5, color: '#9ca3af', fontFamily: 'DM Sans' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Contact chips — always editable */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => openModal('contact')} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: profile?.location ? '#f9fafb' : 'white',
            border: profile?.location ? '1px solid #e5e7eb' : '1px dashed #d1d5db',
            borderRadius: 20, padding: '6px 14px', fontSize: 13,
            color: profile?.location ? '#6b7280' : '#9ca3af',
            cursor: 'pointer', fontFamily: 'DM Sans',
          }}>📍 {profile?.location || 'Add location'}</button>
          <button onClick={() => openModal('contact')} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: profile?.phone ? '#f9fafb' : 'white',
            border: profile?.phone ? '1px solid #e5e7eb' : '1px dashed #d1d5db',
            borderRadius: 20, padding: '6px 14px', fontSize: 13,
            color: profile?.phone ? '#6b7280' : '#9ca3af',
            cursor: 'pointer', fontFamily: 'DM Sans',
          }}>📞 {profile?.phone || 'Add phone'}</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'DM Sans' }}>{auth.email}</span>
          <button onClick={logout} style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 16px', fontFamily: 'DM Sans', fontSize: 14, cursor: 'pointer', color: '#6b7280' }}>Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px 100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <span className="spinner" style={{ borderColor: 'rgba(26,26,46,.15)', borderTopColor: '#1a1a2e', width: 36, height: 36 }} />
          </div>
        ) : (
          <>
            {/* Education */}
            <div style={{ marginBottom: 44 }}>
              <SectionHead icon="🎓" title="Education" onAdd={() => router.push('/profile/education')} />
              {profile?.education?.length ? (
                <HScroll>
                  {profile.education.map((e, i) => (
                    <EduCard key={i} edu={e}
                      onEdit={() => router.push(`/profile/education?edit=${i}`)}
                      onDelete={() => deleteEdu(i)} />
                  ))}
                </HScroll>
              ) : null}
            </div>

            {/* Projects */}
            <div style={{ marginBottom: 44 }}>
              <SectionHead icon="💻" title="Projects" onAdd={() => router.push('/profile/projects')} />
              {profile?.projects?.length ? (
                <HScroll>
                  {profile.projects.map((p, i) => (
                    <ProjCard key={i} proj={p}
                      onEdit={() => router.push(`/profile/projects?edit=${i}`)}
                      onDelete={() => deleteProj(i)} />
                  ))}
                </HScroll>
              ) : null}
            </div>

            {/* Skills */}
            <div style={{ marginBottom: 44 }}>
              <SectionHead icon="⚡" title="Skills" onAdd={() => openModal('skills')} />
              {profile?.skills?.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {profile.skills.map((s, i) => (
                    <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 6, padding: '7px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <span style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 500, fontFamily: 'DM Sans' }}>{s.name}</span>
                      {s.level && <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', borderRadius: 4, padding: '1px 5px' }}>Lv{s.level}</span>}
                      <button onClick={() => openModal('skills')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 12, padding: '0 2px', fontFamily: 'DM Sans' }} title="Edit">✏️</button>
                      <button onClick={() => deleteSkill(i)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 12, padding: '0 2px' }} title="Delete">✕</button>
                    </div>
                  ))}
                  <button onClick={() => openModal('skills')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'white', border: '1.5px dashed #d1d5db', borderRadius: 6, padding: '7px 14px', color: '#9ca3af', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans' }}>+ Add</button>
                </div>
              ) : null}
            </div>

            {/* Experience */}
            <div style={{ marginBottom: 44 }}>
              <SectionHead icon="💼" title="Experience" onAdd={() => openModal('experience')} />
              {profile?.experience?.length ? (
                <HScroll>
                  {profile.experience.map((e, i) => (
                    <ExpCard key={i} exp={e}
                      onEdit={() => openModal('experience', i)}
                      onDelete={() => deleteExp(i)} />
                  ))}
                </HScroll>
              ) : null}
            </div>

            {/* Achievements */}
            <div style={{ marginBottom: 44 }}>
              <SectionHead icon="🏆" title="Achievements" onAdd={() => openModal('achievements')} />
              {profile?.achievements?.length ? (
                <HScroll>
                  {profile.achievements.map((a, i) => (
                    <AchCard key={i} ach={a}
                      onEdit={() => openModal('achievements', i)}
                      onDelete={() => deleteAch(i)} />
                  ))}
                </HScroll>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modal === 'contact' && (
        <ContactModal phone={profile?.phone || ''} location={profile?.location || ''} onSave={saveContact} onClose={() => { setModal(null); setModalEditIdx(null); }} />
      )}
      {modal === 'skills' && (
        <SkillsModal existing={profile?.skills ?? []} onSave={saveSkills} onClose={() => { setModal(null); setModalEditIdx(null); }} />
      )}
      {modal === 'experience' && (
        <ExperienceModal existing={profile?.experience ?? []} editIdx={modalEditIdx} onSave={saveExperience} onClose={() => { setModal(null); setModalEditIdx(null); }} />
      )}
      {modal === 'achievements' && (
        <AchievementsModal existing={profile?.achievements ?? []} editIdx={modalEditIdx} onSave={saveAchievements} onClose={() => { setModal(null); setModalEditIdx(null); }} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}