'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, apiGet, apiPatch } from '@/lib/api';
import { Navbar } from '@/app/home/page';

/* ─── shared toast ─── */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999, background: type === 'success' ? '#22c55e' : '#ef4444', color: 'white', borderRadius: 10, padding: '12px 18px', fontFamily: 'Montserrat,sans-serif', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)' }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontFamily: 'Montserrat,sans-serif', fontSize: 14, outline: 'none', background: 'white', color: '#1a1a2e', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, fontFamily: 'Montserrat,sans-serif' };

/* ══════════════════════════════════════════════════════════
   SKILLS PAGE
══════════════════════════════════════════════════════════ */
interface SkillEntry { name: string; category: string; customCategory: string; level: number; }
const EMPTY_SKILL: SkillEntry = { name: '', category: '', customCategory: '', level: 3 };

// ⚠️ ML removed, "Other" added
const SKILL_DOMAINS = [
  'Web Development', 'Mobile Development', 'Backend Development',
  'DevOps & Cloud', 'Data Science', 'Cybersecurity',
  'Blockchain', 'Game Development', 'Embedded Systems',
  'UI/UX Design', 'Database', 'Other',
];

const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

function SkillLevelPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={lbl}>Proficiency — <span style={{ color: '#f97316', fontWeight: 700 }}>{LEVEL_LABELS[value]}</span></label>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} style={{ flex: 1, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: n <= value ? '#f97316' : '#e5e7eb', transition: 'background .2s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'Montserrat,sans-serif' }}>Beginner</span>
        <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'Montserrat,sans-serif' }}>Expert</span>
      </div>
    </div>
  );
}

function serverToSkill(s: Record<string, unknown>): SkillEntry {
  const cat = String(s.category ?? '');
  const isCustom = cat && !SKILL_DOMAINS.slice(0, -1).includes(cat); // not in preset list (excluding "Other")
  return {
    name:           String(s.name ?? ''),
    category:       isCustom ? 'Other' : cat,
    customCategory: isCustom ? cat : '',
    level:          Number(s.level ?? 3),
  };
}

function skillToServer(e: SkillEntry) {
  return {
    name:     e.name,
    category: e.category === 'Other' ? (e.customCategory.trim() || 'Other') : e.category,
    level:    e.level,
  };
}

export function SkillsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get('edit');
  const editIdx   = editParam !== null ? parseInt(editParam) : null;
  const isEdit    = editIdx !== null;

  const [allSkills, setAllSkills] = useState<SkillEntry[]>([]);
  const [entries,   setEntries]   = useState<SkillEntry[]>([{ ...EMPTY_SKILL }]);
  const [errors,    setErrors]    = useState<Partial<SkillEntry>[]>([{}]);
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(true);
  const [toast,     setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(d => {
        if (d.skills?.length) {
          const formatted = d.skills.map(serverToSkill);
          setAllSkills(formatted);
          if (editIdx !== null && formatted[editIdx]) setEntries([{ ...formatted[editIdx] }]);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [router, editIdx]);

  function change(i: number, field: keyof SkillEntry, val: string | number) {
    setEntries(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n; });
    setErrors(prev  => { const n = [...prev]; n[i] = { ...n[i], [field]: '' };  return n; });
  }

  function validate() {
    const errs = entries.map(e => {
      const obj: Partial<SkillEntry> = {};
      if (!e.name.trim())     obj.name     = 'Required';
      if (!e.category.trim()) obj.category = 'Required';
      if (e.category === 'Other' && !e.customCategory.trim()) obj.customCategory = 'Please enter domain name';
      return obj;
    });
    setErrors(errs);
    return errs.every(e => Object.keys(e).length === 0);
  }

  async function handleDelete(idx: number) {
    setLoading(true);
    try {
      const updated = allSkills.filter((_, i) => i !== idx).map(skillToServer);
      await apiPatch('/form/update-profile', { skills: updated });
      setAllSkills(prev => prev.filter((_, i) => i !== idx));
      setToast({ msg: 'Skill deleted!', type: 'success' });
    } catch {
      setToast({ msg: 'Failed to delete', type: 'error' });
    } finally { setLoading(false); }
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      let merged;
      if (isEdit && editIdx !== null) {
        merged = allSkills.map((s, i) => i === editIdx ? skillToServer(entries[0]) : skillToServer(s));
      } else {
        merged = [...allSkills.map(skillToServer), ...entries.map(skillToServer)];
      }
      await apiPatch('/form/update-profile', { skills: merged });
      setToast({ msg: isEdit ? 'Skill updated!' : 'Skills saved!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed', type: 'error' });
    } finally { setLoading(false); }
  }

  if (fetching) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar active="Dashboard" />
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ width: 36, height: 36, border: '4px solid #e5e7eb', borderTopColor: '#1a1a2e', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar active="Dashboard" />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}>
        <button onClick={() => router.push('/home')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13.5, marginBottom: 24, padding: 0, fontFamily: 'Montserrat,sans-serif' }}>
          ← Back to Dashboard
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 28, color: '#1a1a2e', marginBottom: 4 }}>
            🛠️ {isEdit ? 'Edit Skill' : 'Add Skills'}
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'Montserrat,sans-serif' }}>
            {isEdit ? 'Update skill details' : 'Showcase your technical expertise'}
          </p>
        </div>

        {/* existing skills list */}
        {!isEdit && allSkills.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Montserrat,sans-serif' }}>
              Saved Skills ({allSkills.length})
            </p>
            {allSkills.map((sk, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: '12px 18px', border: '1px solid #e5e7eb', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🛠️</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 2 }}>{sk.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Montserrat,sans-serif' }}>{sk.category === 'Other' ? sk.customCategory || 'Other' : sk.category}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => <div key={n} style={{ width: 10, height: 4, borderRadius: 2, background: n <= sk.level ? '#f97316' : '#e5e7eb' }} />)}
                    </div>
                    <span style={{ fontSize: 11, color: '#f97316', fontFamily: 'Montserrat,sans-serif', fontWeight: 600 }}>{LEVEL_LABELS[sk.level]}</span>
                  </div>
                </div>
                <button onClick={() => router.push(`/profile/skills?edit=${i}`)} style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', fontWeight: 600, flexShrink: 0 }}>✏️ Edit</button>
                <button onClick={() => handleDelete(i)} disabled={loading} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: '#ef4444', cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', fontWeight: 600, flexShrink: 0 }}>🗑 Delete</button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 20 }}>
              {isEdit ? 'Edit Skill' : 'New Skill'}
            </h2>

            {entries.map((sk, i) => (
              <div key={i} style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
                {!isEdit && entries.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{sk.name || `Skill #${i + 1}`}</span>
                    <button type="button" onClick={() => { setEntries(p => p.filter((_, idx) => idx !== i)); setErrors(p => p.filter((_, idx) => idx !== i)); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 9px', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>Remove</button>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={lbl}>Skill Name *</label>
                    <input style={{ ...inp, border: `1.5px solid ${errors[i]?.name ? '#ef4444' : '#e5e7eb'}` }} placeholder="e.g. React, Python, Docker" value={sk.name} onChange={e => change(i, 'name', e.target.value)} />
                    {errors[i]?.name && <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'Montserrat,sans-serif', marginTop: 3, display: 'block' }}>{errors[i].name}</span>}
                  </div>

                  {/* domain selector */}
                  <div>
                    <label style={lbl}>Domain / Category *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                      {SKILL_DOMAINS.map(d => (
                        <button key={d} type="button" onClick={() => change(i, 'category', d)} style={{ padding: '8px 6px', borderRadius: 8, border: `1.5px solid ${sk.category === d ? '#f97316' : '#e5e7eb'}`, background: sk.category === d ? '#fff7ed' : 'white', color: sk.category === d ? '#f97316' : '#6b7280', fontFamily: 'Montserrat,sans-serif', fontWeight: sk.category === d ? 700 : 500, fontSize: 11.5, cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                          {d}
                        </button>
                      ))}
                    </div>
                    {errors[i]?.category && <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'Montserrat,sans-serif', marginTop: 3, display: 'block' }}>{errors[i].category}</span>}
                  </div>

                  {/* custom domain input — shown only when "Other" is selected */}
                  {sk.category === 'Other' && (
                    <div>
                      <label style={lbl}>Enter Domain Name *</label>
                      <input
                        style={{ ...inp, border: `1.5px solid ${errors[i]?.customCategory ? '#ef4444' : '#f97316'}`, background: '#fff7ed' }}
                        placeholder="e.g. Robotics, Quantum Computing, AR/VR"
                        value={sk.customCategory}
                        onChange={e => change(i, 'customCategory', e.target.value)}
                      />
                      {errors[i]?.customCategory && <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'Montserrat,sans-serif', marginTop: 3, display: 'block' }}>{errors[i].customCategory}</span>}
                    </div>
                  )}

                  <SkillLevelPicker value={sk.level} onChange={v => change(i, 'level', v)} />
                </div>
              </div>
            ))}

            {!isEdit && (
              <button type="button" onClick={() => { setEntries(p => [...p, { ...EMPTY_SKILL }]); setErrors(p => [...p, {}]); }} style={{ width: '100%', padding: '12px', border: '2px dashed #e5e7eb', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#f97316', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
                + Add Another Skill
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => router.push('/home')} style={{ padding: '12px 24px', border: '1.5px solid #e5e7eb', borderRadius: 10, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'Montserrat,sans-serif', fontSize: 14 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding: '12px 32px', background: '#1a1a2e', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving...' : isEdit ? '✓ Update Skill' : '✓ Save Skills'}
              </button>
            </div>
          </div>
        </form>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ACHIEVEMENTS PAGE  (unchanged from your original)
══════════════════════════════════════════════════════════ */
interface AchEntry { title: string; description: string; date: string; }
const EMPTY_ACH: AchEntry = { title: '', description: '', date: '' };

export function AchievementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdx = searchParams.get('edit') !== null ? parseInt(searchParams.get('edit')!) : null;
  const isEdit  = editIdx !== null;

  const [allAch,  setAllAch]  = useState<AchEntry[]>([]);
  const [entries, setEntries] = useState<AchEntry[]>([{ ...EMPTY_ACH }]);
  const [errors,  setErrors]  = useState<Partial<AchEntry>[]>([{}]);
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(true);
  const [toast,   setToast]   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(d => {
        if (d.achievements?.length) {
          const f = d.achievements.map((a: Record<string,unknown>) => ({ title: String(a.title ?? ''), description: String(a.description ?? ''), date: a.date ? String(a.date).substring(0,10) : '' }));
          setAllAch(f);
          if (editIdx !== null && f[editIdx]) setEntries([{ ...f[editIdx] }]);
        }
      })
      .catch(() => {}).finally(() => setFetching(false));
  }, [router, editIdx]);

  function change(i: number, field: keyof AchEntry, val: string) {
    setEntries(prev => { const n=[...prev]; n[i]={...n[i],[field]:val}; return n; });
    setErrors(prev => { const n=[...prev]; n[i]={...n[i],[field]:''}; return n; });
  }

  function validate() {
    const errs = entries.map(e => { const o: Partial<AchEntry>={}; if(!e.title.trim()) o.title='Required'; return o; });
    setErrors(errs); return errs.every(e=>Object.keys(e).length===0);
  }

  async function handleDelete(idx: number) {
    setLoading(true);
    try {
      const updated = allAch.filter((_,i)=>i!==idx).map(a=>({ title:a.title, description:a.description||null, date:a.date?new Date(a.date).toISOString():null }));
      await apiPatch('/form/update-profile',{achievements:updated});
      setAllAch(prev=>prev.filter((_,i)=>i!==idx));
      setToast({msg:'Achievement deleted!',type:'success'});
    } catch { setToast({msg:'Failed',type:'error'}); } finally { setLoading(false); }
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault(); if(!validate()) return; setLoading(true);
    try {
      const toServer = (a:AchEntry) => ({ title:a.title, description:a.description||null, date:a.date?new Date(a.date).toISOString():null });
      const merged = isEdit && editIdx!==null ? allAch.map((a,i)=>i===editIdx?toServer(entries[0]):toServer(a)) : [...allAch.map(toServer),...entries.map(toServer)];
      await apiPatch('/form/update-profile',{achievements:merged});
      setToast({msg:isEdit?'Achievement updated!':'Achievements saved!',type:'success'});
      setTimeout(()=>router.push('/home'),1200);
    } catch(err:unknown) { setToast({msg:err instanceof Error?err.message:'Failed',type:'error'}); } finally { setLoading(false); }
  }

  if(fetching) return <div style={{minHeight:'100vh',background:'#f9fafb'}}><Navbar active="Dashboard"/><div style={{textAlign:'center',padding:80}}><div style={{width:36,height:36,border:'4px solid #e5e7eb',borderTopColor:'#1a1a2e',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></div>;

  return (
    <div style={{minHeight:'100vh',background:'#f9fafb'}}>
      <Navbar active="Dashboard"/>
      <div style={{maxWidth:760,margin:'0 auto',padding:'32px 24px 80px'}}>
        <button onClick={()=>router.push('/home')} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:'#6b7280',fontSize:13.5,marginBottom:24,padding:0,fontFamily:'Montserrat,sans-serif'}}>← Back to Dashboard</button>
        <div style={{marginBottom:28}}>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:28,color:'#1a1a2e',marginBottom:4}}>🏅 {isEdit?'Edit Achievement':'Add Achievements'}</h1>
          <p style={{color:'#9ca3af',fontSize:14,fontFamily:'Montserrat,sans-serif'}}>{isEdit?'Update achievement details':'Highlight your milestones and awards'}</p>
        </div>
        {!isEdit && allAch.length>0 && (
          <div style={{marginBottom:28}}>
            <p style={{fontSize:12,fontWeight:700,letterSpacing:'0.5px',color:'#9ca3af',textTransform:'uppercase',marginBottom:12,fontFamily:'Montserrat,sans-serif'}}>Saved Achievements ({allAch.length})</p>
            {allAch.map((a,i)=>(
              <div key={i} style={{background:'white',borderRadius:10,padding:'14px 18px',border:'1px solid #e5e7eb',marginBottom:8,display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:34,height:34,borderRadius:8,background:'#fefce8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🏅</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:14,color:'#1a1a2e',marginBottom:1}}>{a.title}</p>
                  {a.date&&<p style={{fontSize:12,color:'#9ca3af',fontFamily:'Montserrat,sans-serif'}}>{a.date}</p>}
                </div>
                <button onClick={()=>router.push(`/profile/achievements?edit=${i}`)} style={{background:'none',border:'1.5px solid #e5e7eb',borderRadius:7,padding:'5px 12px',fontSize:12,color:'#6b7280',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:600,flexShrink:0}}>✏️ Edit</button>
                <button onClick={()=>handleDelete(i)} disabled={loading} style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:7,padding:'5px 12px',fontSize:12,color:'#ef4444',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:600,flexShrink:0}}>🗑 Delete</button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSave}>
          <div style={{background:'white',borderRadius:16,border:'1px solid #e5e7eb',padding:'28px 32px',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            {entries.map((a,i)=>(
              <div key={i} style={{border:'1.5px solid #e5e7eb',borderRadius:12,padding:'20px 22px',marginBottom:16}}>
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div>
                    <label style={lbl}>Title *</label>
                    <input style={{...inp,border:`1.5px solid ${errors[i]?.title?'#ef4444':'#e5e7eb'}`}} placeholder="e.g. National Hackathon Winner" value={a.title} onChange={e=>change(i,'title',e.target.value)}/>
                    {errors[i]?.title&&<span style={{fontSize:12,color:'#ef4444',fontFamily:'Montserrat,sans-serif',marginTop:3,display:'block'}}>{errors[i].title}</span>}
                  </div>
                  <div>
                    <label style={lbl}>Description</label>
                    <textarea style={{...inp,resize:'vertical',lineHeight:1.6}} placeholder="Brief description..." rows={2} value={a.description} onChange={e=>change(i,'description',e.target.value)}/>
                  </div>
                  <div>
                    <label style={lbl}>Date</label>
                    <input type="date" style={inp} value={a.date} onChange={e=>change(i,'date',e.target.value)}/>
                  </div>
                </div>
              </div>
            ))}
            {!isEdit&&(<button type="button" onClick={()=>{setEntries(p=>[...p,{...EMPTY_ACH}]);setErrors(p=>[...p,{}]);}} style={{width:'100%',padding:'12px',border:'2px dashed #e5e7eb',borderRadius:10,background:'transparent',cursor:'pointer',color:'#f97316',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13.5,display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:24}}>+ Add Another Achievement</button>)}
            <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:8}}>
              <button type="button" onClick={()=>router.push('/home')} style={{padding:'12px 24px',border:'1.5px solid #e5e7eb',borderRadius:10,background:'none',cursor:'pointer',color:'#6b7280',fontFamily:'Montserrat,sans-serif',fontSize:14}}>Cancel</button>
              <button type="submit" disabled={loading} style={{padding:'12px 32px',background:'#1a1a2e',border:'none',borderRadius:10,color:'white',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:14,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>{loading?'Saving...':isEdit?'✓ Update':'✓ Save'}</button>
            </div>
          </div>
        </form>
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   EXPERIENCE PAGE  (unchanged from your original)
══════════════════════════════════════════════════════════ */
interface ExpEntry { role: string; company: string; start_date: string; end_date: string; description: string; }
const EMPTY_EXP: ExpEntry = { role:'',company:'',start_date:'',end_date:'',description:'' };

export function ExperiencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdx = searchParams.get('edit')!==null ? parseInt(searchParams.get('edit')!) : null;
  const isEdit  = editIdx !== null;

  const [allExp,  setAllExp]  = useState<ExpEntry[]>([]);
  const [entries, setEntries] = useState<ExpEntry[]>([{...EMPTY_EXP}]);
  const [errors,  setErrors]  = useState<Partial<ExpEntry>[]>([{}]);
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(true);
  const [toast,   setToast]   = useState<{msg:string;type:'success'|'error'}|null>(null);

  useEffect(()=>{
    const auth=getAuth(); if(!auth){router.replace('/login');return;}
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email??'')}`)
      .then(d=>{
        if(d.experience?.length){
          const f=d.experience.map((e:Record<string,unknown>)=>({role:String(e.role??''),company:String(e.company??''),start_date:e.start_date?String(e.start_date).substring(0,10):'',end_date:e.end_date?String(e.end_date).substring(0,10):'',description:String(e.description??'')}));
          setAllExp(f); if(editIdx!==null&&f[editIdx]) setEntries([{...f[editIdx]}]);
        }
      }).catch(()=>{}).finally(()=>setFetching(false));
  },[router,editIdx]);

  function change(i:number,field:keyof ExpEntry,val:string){setEntries(prev=>{const n=[...prev];n[i]={...n[i],[field]:val};return n;});setErrors(prev=>{const n=[...prev];n[i]={...n[i],[field]:''};return n;});}
  function validate(){const errs=entries.map(e=>{const o:Partial<ExpEntry>={};if(!e.role.trim())o.role='Required';if(!e.company.trim())o.company='Required';return o;});setErrors(errs);return errs.every(e=>Object.keys(e).length===0);}

  async function handleDelete(idx:number){
    setLoading(true);try{const updated=allExp.filter((_,i)=>i!==idx).map(e=>({role:e.role,company:e.company,start_date:e.start_date?new Date(e.start_date).toISOString():null,end_date:e.end_date?new Date(e.end_date).toISOString():null,description:e.description||null}));await apiPatch('/form/update-profile',{experience:updated});setAllExp(prev=>prev.filter((_,i)=>i!==idx));setToast({msg:'Experience deleted!',type:'success'});}catch{setToast({msg:'Failed',type:'error'});}finally{setLoading(false);}
  }

  async function handleSave(ev:React.FormEvent){
    ev.preventDefault();if(!validate())return;setLoading(true);
    try{const toS=(e:ExpEntry)=>({role:e.role,company:e.company,start_date:e.start_date?new Date(e.start_date).toISOString():null,end_date:e.end_date?new Date(e.end_date).toISOString():null,description:e.description||null});const merged=isEdit&&editIdx!==null?allExp.map((e,i)=>i===editIdx?toS(entries[0]):toS(e)):[...allExp.map(toS),...entries.map(toS)];await apiPatch('/form/update-profile',{experience:merged});setToast({msg:isEdit?'Updated!':'Saved!',type:'success'});setTimeout(()=>router.push('/home'),1200);}catch(err:unknown){setToast({msg:err instanceof Error?err.message:'Failed',type:'error'});}finally{setLoading(false);}
  }

  if(fetching)return <div style={{minHeight:'100vh',background:'#f9fafb'}}><Navbar active="Dashboard"/><div style={{textAlign:'center',padding:80}}><div style={{width:36,height:36,border:'4px solid #e5e7eb',borderTopColor:'#1a1a2e',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div></div>;

  return(
    <div style={{minHeight:'100vh',background:'#f9fafb'}}>
      <Navbar active="Dashboard"/>
      <div style={{maxWidth:760,margin:'0 auto',padding:'32px 24px 80px'}}>
        <button onClick={()=>router.push('/home')} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:'#6b7280',fontSize:13.5,marginBottom:24,padding:0,fontFamily:'Montserrat,sans-serif'}}>← Back to Dashboard</button>
        <div style={{marginBottom:28}}>
          <h1 style={{fontFamily:'Montserrat,sans-serif',fontWeight:800,fontSize:28,color:'#1a1a2e',marginBottom:4}}>💼 {isEdit?'Edit Experience':'Add Experience'}</h1>
          <p style={{color:'#9ca3af',fontSize:14,fontFamily:'Montserrat,sans-serif'}}>Add internships, jobs, and freelance work</p>
        </div>
        {!isEdit&&allExp.length>0&&(
          <div style={{marginBottom:28}}>
            <p style={{fontSize:12,fontWeight:700,letterSpacing:'0.5px',color:'#9ca3af',textTransform:'uppercase',marginBottom:12,fontFamily:'Montserrat,sans-serif'}}>Saved ({allExp.length})</p>
            {allExp.map((e,i)=>(
              <div key={i} style={{background:'white',borderRadius:10,padding:'14px 18px',border:'1px solid #e5e7eb',marginBottom:8,display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:34,height:34,borderRadius:8,background:'#f0f9ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>💼</div>
                <div style={{flex:1}}><p style={{fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:14,color:'#1a1a2e',marginBottom:1}}>{e.role}</p><p style={{fontSize:13,color:'#9ca3af',fontFamily:'Montserrat,sans-serif'}}>{e.company}</p></div>
                <button onClick={()=>router.push(`/profile/experience?edit=${i}`)} style={{background:'none',border:'1.5px solid #e5e7eb',borderRadius:7,padding:'5px 12px',fontSize:12,color:'#6b7280',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:600,flexShrink:0}}>✏️ Edit</button>
                <button onClick={()=>handleDelete(i)} disabled={loading} style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:7,padding:'5px 12px',fontSize:12,color:'#ef4444',cursor:'pointer',fontFamily:'Montserrat,sans-serif',fontWeight:600,flexShrink:0}}>🗑 Delete</button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSave}>
          <div style={{background:'white',borderRadius:16,border:'1px solid #e5e7eb',padding:'28px 32px',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
            {entries.map((e,i)=>(
              <div key={i} style={{border:'1.5px solid #e5e7eb',borderRadius:12,padding:'20px 22px',marginBottom:16}}>
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div><label style={lbl}>Role *</label><input style={{...inp,border:`1.5px solid ${errors[i]?.role?'#ef4444':'#e5e7eb'}`}} placeholder="e.g. Software Engineer Intern" value={e.role} onChange={ev=>change(i,'role',ev.target.value)}/>{errors[i]?.role&&<span style={{fontSize:12,color:'#ef4444',fontFamily:'Montserrat,sans-serif',marginTop:3,display:'block'}}>{errors[i].role}</span>}</div>
                    <div><label style={lbl}>Company *</label><input style={{...inp,border:`1.5px solid ${errors[i]?.company?'#ef4444':'#e5e7eb'}`}} placeholder="e.g. Google" value={e.company} onChange={ev=>change(i,'company',ev.target.value)}/>{errors[i]?.company&&<span style={{fontSize:12,color:'#ef4444',fontFamily:'Montserrat,sans-serif',marginTop:3,display:'block'}}>{errors[i].company}</span>}</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div><label style={lbl}>Start Date</label><input type="date" style={inp} value={e.start_date} onChange={ev=>change(i,'start_date',ev.target.value)}/></div>
                    <div><label style={lbl}>End Date</label><input type="date" style={inp} value={e.end_date} onChange={ev=>change(i,'end_date',ev.target.value)}/></div>
                  </div>
                  <div><label style={lbl}>Description</label><textarea style={{...inp,resize:'vertical',lineHeight:1.6}} rows={3} placeholder="What did you work on?" value={e.description} onChange={ev=>change(i,'description',ev.target.value)}/></div>
                </div>
              </div>
            ))}
            {!isEdit&&(<button type="button" onClick={()=>{setEntries(p=>[...p,{...EMPTY_EXP}]);setErrors(p=>[...p,{}]);}} style={{width:'100%',padding:'12px',border:'2px dashed #e5e7eb',borderRadius:10,background:'transparent',cursor:'pointer',color:'#f97316',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:13.5,display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:24}}>+ Add Another</button>)}
            <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:8}}>
              <button type="button" onClick={()=>router.push('/home')} style={{padding:'12px 24px',border:'1.5px solid #e5e7eb',borderRadius:10,background:'none',cursor:'pointer',color:'#6b7280',fontFamily:'Montserrat,sans-serif',fontSize:14}}>Cancel</button>
              <button type="submit" disabled={loading} style={{padding:'12px 32px',background:'#1a1a2e',border:'none',borderRadius:10,color:'white',fontFamily:'Montserrat,sans-serif',fontWeight:700,fontSize:14,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>{loading?'Saving...':isEdit?'✓ Update':'✓ Save'}</button>
            </div>
          </div>
        </form>
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}