'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, apiGet, apiPatch } from '@/lib/api';
import { Navbar } from '@/app/home/page';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999, background: type === 'success' ? '#22c55e' : '#ef4444', color: 'white', borderRadius: 10, padding: '12px 18px', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar active="Dashboard" />
      <div style={{ textAlign: 'center', padding: 80 }}>
        <span className="spinner" style={{ borderColor: 'rgba(26,26,46,.15)', borderTopColor: '#1a1a2e', width: 36, height: 36 }} />
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontFamily: 'DM Sans', fontSize: 14, outline: 'none', background: 'white', color: '#1a1a2e', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#6b7280', marginBottom: 5, fontFamily: 'DM Sans', display: 'block' };

// ─────────────────────────────────────────────────────────────────────────────
// SKILLS PAGE  →  /profile/skills   (no edit-by-index; edit = replace all)
// ─────────────────────────────────────────────────────────────────────────────
interface SkillEntry { name: string; category: string; level: string; }
const EMPTY_SKILL: SkillEntry = { name: '', category: '', level: '' };
const SKILL_LEVELS = ['1','2','3','4','5','6','7','8','9','10'];
const CATEGORIES   = ['Frontend','Backend','Database','DevOps','Mobile','AI/ML','Languages','Tools','Other'];

export function SkillsPage() {
  const router = useRouter();
  const [entries,  setEntries]  = useState<SkillEntry[]>([{ ...EMPTY_SKILL }]);
  const [errors,   setErrors]   = useState<{ name?: string }[]>([{}]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Load existing skills on mount ──
  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(d => {
        if (d.skills?.length) {
          const formatted: SkillEntry[] = d.skills.map((s: Record<string, unknown>) => ({
            name:     String(s.name     ?? ''),
            category: String(s.category ?? ''),
            level:    s.level != null ? String(s.level) : '',
          }));
          setEntries(formatted);
          setErrors(formatted.map(() => ({})));
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [router]);

  function change(i: number, field: keyof SkillEntry, val: string) {
    setEntries(p => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });
    if (field === 'name') setErrors(p => { const n = [...p]; n[i] = {}; return n; });
  }
  function addSkill()       { setEntries(p => [...p, { ...EMPTY_SKILL }]); setErrors(p => [...p, {}]); }
  function removeSkill(i: number) { setEntries(p => p.filter((_,idx)=>idx!==i)); setErrors(p=>p.filter((_,idx)=>idx!==i)); }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = entries.map(e => e.name.trim() ? {} : { name: 'Skill name is required' });
    setErrors(errs);
    if (errs.some(e => e.name)) return;
    setLoading(true);
    try {
      const skills = entries.map(e => ({
        name: e.name.trim(),
        ...(e.category ? { category: e.category } : {}),
        ...(e.level    ? { level: parseInt(e.level) } : {}),
      }));
      await apiPatch('/form/update-profile', { skills });
      setToast({ msg: 'Skills saved!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed', type: 'error' });
    } finally { setLoading(false); }
  }

  if (fetching) return <Spinner />;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar active="Dashboard" />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}>
        <button onClick={() => router.push('/home')} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#6b7280', fontSize:13.5, marginBottom:24, padding:0, fontFamily:'DM Sans' }}>← Back to Dashboard</button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily:'DM Sans', fontWeight:700, fontSize:26, color:'#1a1a2e', marginBottom:4 }}>⚡ Skills</h1>
          <p style={{ color:'#9ca3af', fontSize:14, fontFamily:'DM Sans' }}>Edit, add or remove skills — all changes replace the full list</p>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ background:'white', borderRadius:16, border:'1px solid #e5e7eb', padding:'28px 32px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>

            {/* Column headers */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 36px', gap:12, marginBottom:8 }}>
              <span style={lbl}>Skill Name *</span>
              <span style={lbl}>Category</span>
              <span style={lbl}>Level (1–10)</span>
              <span />
            </div>

            {entries.map((skill, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 36px', gap:12, alignItems:'center', marginBottom:10 }}>
                <div>
                  <input style={{ ...inp, border:`1.5px solid ${errors[i]?.name?'#ef4444':'#e5e7eb'}` }} placeholder="e.g. React" value={skill.name} onChange={e=>change(i,'name',e.target.value)} />
                  {errors[i]?.name && <span style={{ fontSize:12, color:'#ef4444', fontFamily:'DM Sans', marginTop:3, display:'block' }}>{errors[i].name}</span>}
                </div>
                <select style={inp} value={skill.category} onChange={e=>change(i,'category',e.target.value)}>
                  <option value="">Select</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select style={inp} value={skill.level} onChange={e=>change(i,'level',e.target.value)}>
                  <option value="">—</option>
                  {SKILL_LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
                <button type="button" onClick={()=>removeSkill(i)} style={{ width:36, height:44, borderRadius:8, background:'#fef2f2', border:'1px solid #fecaca', color:'#ef4444', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>
            ))}

            <button type="button" onClick={addSkill} style={{ width:'100%', padding:'11px', border:'2px dashed #e5e7eb', borderRadius:10, background:'transparent', cursor:'pointer', color:'#06b6d4', fontFamily:'DM Sans', fontWeight:600, fontSize:13.5, display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:8, marginBottom:24 }}>
              + Add Skill
            </button>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
              <button type="button" onClick={()=>router.push('/home')} style={{ padding:'12px 24px', border:'1.5px solid #e5e7eb', borderRadius:10, background:'none', cursor:'pointer', color:'#6b7280', fontFamily:'DM Sans', fontSize:14 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding:'12px 32px', background:'#1a1a2e', border:'none', borderRadius:10, color:'white', fontFamily:'DM Sans', fontWeight:600, fontSize:14, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
                {loading ? 'Saving...' : '✓ Save Skills'}
              </button>
            </div>
          </div>
        </form>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCE PAGE  →  /profile/experience   and  /profile/experience?edit=N
// ─────────────────────────────────────────────────────────────────────────────
interface ExpEntry { role: string; company: string; start_date: string; end_date: string; description: string; current: boolean; }
const EMPTY_EXP: ExpEntry = { role:'', company:'', start_date:'', end_date:'', description:'', current:false };

/** ISO → YYYY-MM for <input type="month"> */
function isoToMonth(iso?: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 7); } catch { return ''; }
}
/** YYYY-MM → ISO */
function monthToIso(val: string): string {
  if (!val) return '';
  return new Date(val + '-01').toISOString();
}

function serverToExpForm(e: Record<string, unknown>): ExpEntry {
  const hasEnd = !!e.end_date;
  return {
    role:        String(e.role        ?? ''),
    company:     String(e.company     ?? ''),
    start_date:  isoToMonth(e.start_date as string),
    end_date:    isoToMonth(e.end_date   as string),
    description: String(e.description ?? ''),
    current:     !hasEnd,
  };
}
function expFormToServer(e: ExpEntry) {
  return {
    role:       e.role,
    company:    e.company,
    start_date: monthToIso(e.start_date),
    ...(e.current || !e.end_date ? {} : { end_date: monthToIso(e.end_date) }),
    ...(e.description ? { description: e.description } : {}),
  };
}

export function ExperiencePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editParam    = searchParams.get('edit');
  const editIdx      = editParam !== null ? parseInt(editParam) : null;
  const isEditMode   = editIdx !== null;

  const [allExp,   setAllExp]   = useState<ExpEntry[]>([]);
  const [entries,  setEntries]  = useState<ExpEntry[]>([{ ...EMPTY_EXP }]);
  const [errors,   setErrors]   = useState<Partial<Record<keyof ExpEntry,string>>[]>([{}]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(d => {
        if (d.experience?.length) {
          const formatted = d.experience.map(serverToExpForm);
          setAllExp(formatted);
          // Pre-fill if editing a specific item
          if (isEditMode && editIdx !== null && formatted[editIdx]) {
            setEntries([{ ...formatted[editIdx] }]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [router, editIdx, isEditMode]);

  function change(i: number, field: keyof ExpEntry, val: string | boolean) {
    setEntries(p => { const n=[...p]; n[i]={...n[i],[field]:val}; return n; });
    if (typeof val==='string') setErrors(p=>{ const n=[...p]; n[i]={...n[i],[field]:''}; return n; });
  }

  /** Permanently delete one item from the saved list */
  async function handleDelete(idx: number) {
    setLoading(true);
    try {
      const updated = allExp.filter((_,i)=>i!==idx).map(expFormToServer);
      await apiPatch('/form/update-profile', { experience: updated });
      setToast({ msg: 'Experience deleted!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch {
      setToast({ msg: 'Failed to delete', type: 'error' });
    } finally { setLoading(false); }
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = entries.map(e => {
      const obj: Partial<Record<keyof ExpEntry,string>> = {};
      if (!e.role.trim())    obj.role       = 'Required';
      if (!e.company.trim()) obj.company    = 'Required';
      if (!e.start_date)     obj.start_date = 'Required';
      return obj;
    });
    setErrors(errs);
    if (errs.some(e=>Object.keys(e).length)) return;
    setLoading(true);
    try {
      let merged: ReturnType<typeof expFormToServer>[];
      if (isEditMode && editIdx !== null) {
        merged = allExp.map((item,i) => i===editIdx ? expFormToServer(entries[0]) : expFormToServer(item));
      } else {
        merged = [...allExp.map(expFormToServer), ...entries.map(expFormToServer)];
      }
      await apiPatch('/form/update-profile', { experience: merged });
      setToast({ msg: isEditMode ? 'Experience updated!' : 'Experience saved!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed', type: 'error' });
    } finally { setLoading(false); }
  }

  if (fetching) return <Spinner />;

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb' }}>
      <Navbar active="Dashboard" />
      <div style={{ maxWidth:760, margin:'0 auto', padding:'32px 24px 80px' }}>
        <button onClick={()=>router.push('/home')} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#6b7280', fontSize:13.5, marginBottom:24, padding:0, fontFamily:'DM Sans' }}>← Back to Dashboard</button>

        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:'DM Sans', fontWeight:700, fontSize:26, color:'#1a1a2e', marginBottom:4 }}>💼 {isEditMode?'Edit Experience':'Add Experience'}</h1>
          <p style={{ color:'#9ca3af', fontSize:14, fontFamily:'DM Sans' }}>{isEditMode?'Update this work entry':'Add your work history and internships'}</p>
        </div>

        {/* Saved list — add mode only */}
        {!isEditMode && allExp.length > 0 && (
          <div style={{ marginBottom:28 }}>
            <p style={{ fontSize:12, fontWeight:600, letterSpacing:'0.5px', color:'#9ca3af', textTransform:'uppercase', marginBottom:12, fontFamily:'DM Sans' }}>Saved ({allExp.length})</p>
            {allExp.map((e,i) => (
              <div key={i} style={{ background:'white', borderRadius:10, padding:'14px 18px', border:'1px solid #e5e7eb', marginBottom:8, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>💼</div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'DM Sans', fontWeight:700, fontSize:14, color:'#1a1a2e', marginBottom:1 }}>{e.role} @ {e.company}</p>
                  <p style={{ fontSize:13, color:'#9ca3af', fontFamily:'DM Sans' }}>{e.start_date} – {e.current?'Present':e.end_date||'Present'}</p>
                </div>
                <button onClick={()=>router.push(`/profile/experience?edit=${i}`)} style={{ background:'none', border:'1.5px solid #e5e7eb', borderRadius:7, padding:'5px 12px', fontSize:12, color:'#6b7280', cursor:'pointer', fontFamily:'DM Sans', fontWeight:600 }}>✏️ Edit</button>
                <button onClick={()=>handleDelete(i)} disabled={loading} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, padding:'5px 12px', fontSize:12, color:'#ef4444', cursor:'pointer', fontFamily:'DM Sans', fontWeight:600 }}>🗑 Delete</button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ background:'white', borderRadius:16, border:'1px solid #e5e7eb', padding:'28px 32px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily:'DM Sans', fontWeight:700, fontSize:16, color:'#1a1a2e', marginBottom:20 }}>{isEditMode?'Edit Entry':'New Entry'}</h2>

            {entries.map((exp,i) => (
              <div key={i} style={{ border:'1.5px solid #e5e7eb', borderRadius:12, padding:'20px 22px', marginBottom:16 }}>
                {!isEditMode && entries.length>1 && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <span style={{ fontFamily:'DM Sans', fontWeight:700, fontSize:13, color:'#1a1a2e' }}>{exp.role||`Experience #${i+1}`}</span>
                    <button type="button" onClick={()=>{ setEntries(p=>p.filter((_,idx)=>idx!==i)); setErrors(p=>p.filter((_,idx)=>idx!==i)); }} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:'3px 9px', color:'#ef4444', fontSize:12, cursor:'pointer', fontFamily:'DM Sans' }}>Remove</button>
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <label style={lbl}>Role *</label>
                    <input style={{ ...inp, border:`1.5px solid ${errors[i]?.role?'#ef4444':'#e5e7eb'}` }} placeholder="e.g. Software Engineer" value={exp.role} onChange={e=>change(i,'role',e.target.value)} />
                    {errors[i]?.role && <span style={{ fontSize:12, color:'#ef4444', fontFamily:'DM Sans', marginTop:3, display:'block' }}>Required</span>}
                  </div>
                  <div>
                    <label style={lbl}>Company *</label>
                    <input style={{ ...inp, border:`1.5px solid ${errors[i]?.company?'#ef4444':'#e5e7eb'}` }} placeholder="e.g. Google" value={exp.company} onChange={e=>change(i,'company',e.target.value)} />
                    {errors[i]?.company && <span style={{ fontSize:12, color:'#ef4444', fontFamily:'DM Sans', marginTop:3, display:'block' }}>Required</span>}
                  </div>
                  <div>
                    <label style={lbl}>Start Date *</label>
                    <input type="month" style={{ ...inp, border:`1.5px solid ${errors[i]?.start_date?'#ef4444':'#e5e7eb'}` }} value={exp.start_date} onChange={e=>change(i,'start_date',e.target.value)} />
                    {errors[i]?.start_date && <span style={{ fontSize:12, color:'#ef4444', fontFamily:'DM Sans', marginTop:3, display:'block' }}>Required</span>}
                  </div>
                  <div>
                    <label style={lbl}>End Date</label>
                    <input type="month" style={{ ...inp, opacity:exp.current?0.4:1 }} value={exp.end_date} disabled={exp.current} onChange={e=>change(i,'end_date',e.target.value)} />
                    <label style={{ display:'flex', alignItems:'center', gap:6, marginTop:7, fontSize:13, color:'#6b7280', cursor:'pointer', fontFamily:'DM Sans' }}>
                      <input type="checkbox" checked={exp.current} onChange={e=>change(i,'current',e.target.checked)} style={{ accentColor:'#1a1a2e' }} />
                      Currently working here
                    </label>
                  </div>
                  <div style={{ gridColumn:'1 / -1' }}>
                    <label style={lbl}>Description</label>
                    <textarea style={{ ...inp, resize:'vertical', lineHeight:1.6 }} placeholder="What did you do in this role?" rows={3} value={exp.description} onChange={e=>change(i,'description',e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            {!isEditMode && (
              <button type="button" onClick={()=>{ setEntries(p=>[...p,{...EMPTY_EXP}]); setErrors(p=>[...p,{}]); }} style={{ width:'100%', padding:'12px', border:'2px dashed #e5e7eb', borderRadius:10, background:'transparent', cursor:'pointer', color:'#22c55e', fontFamily:'DM Sans', fontWeight:600, fontSize:13.5, display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:24 }}>
                + Add Another Experience
              </button>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
              <button type="button" onClick={()=>router.push('/home')} style={{ padding:'12px 24px', border:'1.5px solid #e5e7eb', borderRadius:10, background:'none', cursor:'pointer', color:'#6b7280', fontFamily:'DM Sans', fontSize:14 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding:'12px 32px', background:'#1a1a2e', border:'none', borderRadius:10, color:'white', fontFamily:'DM Sans', fontWeight:600, fontSize:14, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
                {loading?'Saving...':isEditMode?'✓ Update Experience':'✓ Save Experience'}
              </button>
            </div>
          </div>
        </form>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS PAGE  →  /profile/achievements   and  /profile/achievements?edit=N
// ─────────────────────────────────────────────────────────────────────────────
interface AchEntry { title: string; description: string; date: string; }
const EMPTY_ACH: AchEntry = { title:'', description:'', date:'' };

function serverToAchForm(a: Record<string, unknown>): AchEntry {
  return {
    title:       String(a.title       ?? ''),
    description: String(a.description ?? ''),
    date: a.date ? (() => { try { return new Date(a.date as string).toISOString().slice(0,10); } catch { return ''; } })() : '',
  };
}
function achFormToServer(a: AchEntry) {
  return {
    title: a.title,
    ...(a.description ? { description: a.description } : {}),
    ...(a.date        ? { date: new Date(a.date).toISOString() } : {}),
  };
}

export function AchievementsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editParam    = searchParams.get('edit');
  const editIdx      = editParam !== null ? parseInt(editParam) : null;
  const isEditMode   = editIdx !== null;

  const [allAch,   setAllAch]   = useState<AchEntry[]>([]);
  const [entries,  setEntries]  = useState<AchEntry[]>([{ ...EMPTY_ACH }]);
  const [errors,   setErrors]   = useState<{ title?: string }[]>([{}]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(d => {
        if (d.achievements?.length) {
          const formatted = d.achievements.map(serverToAchForm);
          setAllAch(formatted);
          if (isEditMode && editIdx !== null && formatted[editIdx]) {
            setEntries([{ ...formatted[editIdx] }]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [router, editIdx, isEditMode]);

  function change(i: number, field: keyof AchEntry, val: string) {
    setEntries(p=>{ const n=[...p]; n[i]={...n[i],[field]:val}; return n; });
    if (field==='title') setErrors(p=>{ const n=[...p]; n[i]={}; return n; });
  }

  /** Permanently delete one achievement */
  async function handleDelete(idx: number) {
    setLoading(true);
    try {
      const updated = allAch.filter((_,i)=>i!==idx).map(achFormToServer);
      await apiPatch('/form/update-profile', { achievements: updated });
      setToast({ msg: 'Achievement deleted!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch {
      setToast({ msg: 'Failed to delete', type: 'error' });
    } finally { setLoading(false); }
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = entries.map(e => e.title.trim() ? {} : { title:'Required' });
    setErrors(errs);
    if (errs.some(e=>e.title)) return;
    setLoading(true);
    try {
      let merged: ReturnType<typeof achFormToServer>[];
      if (isEditMode && editIdx !== null) {
        merged = allAch.map((item,i) => i===editIdx ? achFormToServer(entries[0]) : achFormToServer(item));
      } else {
        merged = [...allAch.map(achFormToServer), ...entries.map(achFormToServer)];
      }
      await apiPatch('/form/update-profile', { achievements: merged });
      setToast({ msg: isEditMode ? 'Achievement updated!' : 'Achievements saved!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed', type: 'error' });
    } finally { setLoading(false); }
  }

  if (fetching) return <Spinner />;

  return (
    <div style={{ minHeight:'100vh', background:'#f9fafb' }}>
      <Navbar active="Dashboard" />
      <div style={{ maxWidth:760, margin:'0 auto', padding:'32px 24px 80px' }}>
        <button onClick={()=>router.push('/home')} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'#6b7280', fontSize:13.5, marginBottom:24, padding:0, fontFamily:'DM Sans' }}>← Back to Dashboard</button>

        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:'DM Sans', fontWeight:700, fontSize:26, color:'#1a1a2e', marginBottom:4 }}>🏆 {isEditMode?'Edit Achievement':'Add Achievements'}</h1>
          <p style={{ color:'#9ca3af', fontSize:14, fontFamily:'DM Sans' }}>{isEditMode?'Update this achievement':'Competitions, awards, certifications and more'}</p>
        </div>

        {/* Saved list — add mode only */}
        {!isEditMode && allAch.length > 0 && (
          <div style={{ marginBottom:28 }}>
            <p style={{ fontSize:12, fontWeight:600, letterSpacing:'0.5px', color:'#9ca3af', textTransform:'uppercase', marginBottom:12, fontFamily:'DM Sans' }}>Saved ({allAch.length})</p>
            {allAch.map((a,i) => (
              <div key={i} style={{ background:'white', borderRadius:10, padding:'14px 18px', border:'1px solid #e5e7eb', marginBottom:8, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🏆</div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'DM Sans', fontWeight:700, fontSize:14, color:'#1a1a2e', marginBottom:1 }}>{a.title}</p>
                  {a.date && <p style={{ fontSize:13, color:'#9ca3af', fontFamily:'DM Sans' }}>{a.date}</p>}
                </div>
                <button onClick={()=>router.push(`/profile/achievements?edit=${i}`)} style={{ background:'none', border:'1.5px solid #e5e7eb', borderRadius:7, padding:'5px 12px', fontSize:12, color:'#6b7280', cursor:'pointer', fontFamily:'DM Sans', fontWeight:600 }}>✏️ Edit</button>
                <button onClick={()=>handleDelete(i)} disabled={loading} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, padding:'5px 12px', fontSize:12, color:'#ef4444', cursor:'pointer', fontFamily:'DM Sans', fontWeight:600 }}>🗑 Delete</button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ background:'white', borderRadius:16, border:'1px solid #e5e7eb', padding:'28px 32px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily:'DM Sans', fontWeight:700, fontSize:16, color:'#1a1a2e', marginBottom:20 }}>{isEditMode?'Edit Achievement':'New Achievement'}</h2>

            {entries.map((ach,i) => (
              <div key={i} style={{ border:'1.5px solid #e5e7eb', borderRadius:12, padding:'20px 22px', marginBottom:16 }}>
                {!isEditMode && entries.length>1 && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <span style={{ fontFamily:'DM Sans', fontWeight:700, fontSize:13, color:'#1a1a2e' }}>{ach.title||`Achievement #${i+1}`}</span>
                    <button type="button" onClick={()=>{ setEntries(p=>p.filter((_,idx)=>idx!==i)); setErrors(p=>p.filter((_,idx)=>idx!==i)); }} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:'3px 9px', color:'#ef4444', fontSize:12, cursor:'pointer', fontFamily:'DM Sans' }}>Remove</button>
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:14, alignItems:'start' }}>
                    <div>
                      <label style={lbl}>Title *</label>
                      <input style={{ ...inp, border:`1.5px solid ${errors[i]?.title?'#ef4444':'#e5e7eb'}` }} placeholder="e.g. Hackathon Winner" value={ach.title} onChange={e=>change(i,'title',e.target.value)} />
                      {errors[i]?.title && <span style={{ fontSize:12, color:'#ef4444', fontFamily:'DM Sans', marginTop:3, display:'block' }}>Required</span>}
                    </div>
                    <div>
                      <label style={lbl}>Date</label>
                      <input type="date" style={inp} value={ach.date} onChange={e=>change(i,'date',e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Description</label>
                    <textarea style={{ ...inp, resize:'vertical', lineHeight:1.6 }} placeholder="Describe this achievement..." rows={2} value={ach.description} onChange={e=>change(i,'description',e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            {!isEditMode && (
              <button type="button" onClick={()=>{ setEntries(p=>[...p,{...EMPTY_ACH}]); setErrors(p=>[...p,{}]); }} style={{ width:'100%', padding:'12px', border:'2px dashed #e5e7eb', borderRadius:10, background:'transparent', cursor:'pointer', color:'#d97706', fontFamily:'DM Sans', fontWeight:600, fontSize:13.5, display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:24 }}>
                + Add Another Achievement
              </button>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 }}>
              <button type="button" onClick={()=>router.push('/home')} style={{ padding:'12px 24px', border:'1.5px solid #e5e7eb', borderRadius:10, background:'none', cursor:'pointer', color:'#6b7280', fontFamily:'DM Sans', fontSize:14 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding:'12px 32px', background:'#1a1a2e', border:'none', borderRadius:10, color:'white', fontFamily:'DM Sans', fontWeight:600, fontSize:14, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
                {loading?'Saving...':isEditMode?'✓ Update Achievement':'✓ Save Achievements'}
              </button>
            </div>
          </div>
        </form>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}