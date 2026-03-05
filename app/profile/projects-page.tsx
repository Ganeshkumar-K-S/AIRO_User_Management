'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, apiGet, apiPatch } from '@/lib/api';
import { Navbar } from '@/app/home/page';

interface ProjectEntry {
  title: string; description: string;
  tech_stack: string; github_link: string; live_link: string;
}

const EMPTY: ProjectEntry = { title: '', description: '', tech_stack: '', github_link: '', live_link: '' };

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999, background: type === 'success' ? '#22c55e' : '#ef4444', color: 'white', borderRadius: 10, padding: '12px 18px', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  );
}

function serverToForm(p: Record<string, unknown>): ProjectEntry {
  return {
    title:       String(p.title       ?? ''),
    description: String(p.description ?? ''),
    tech_stack:  Array.isArray(p.tech_stack) ? (p.tech_stack as string[]).join(', ') : '',
    github_link: String(p.github_link ?? ''),
    live_link:   String(p.live_link   ?? ''),
  };
}

function formToServer(e: ProjectEntry) {
  return {
    title:       e.title,
    description: e.description,
    ...(e.tech_stack  ? { tech_stack:  e.tech_stack.split(',').map(t => t.trim()).filter(Boolean) } : {}),
    ...(e.github_link ? { github_link: e.github_link } : {}),
    ...(e.live_link   ? { live_link:   e.live_link   } : {}),
  };
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontFamily: 'Montserrat, sans-serif', fontSize: 14, outline: 'none', background: 'white', color: '#1a1a2e', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, fontFamily: 'Montserrat, sans-serif' };

export default function ProjectsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editParam    = searchParams.get('edit');
  const editIdx      = editParam !== null ? parseInt(editParam) : null;
  const isEditMode   = editIdx !== null;

  const [allProjects, setAllProjects] = useState<ProjectEntry[]>([]);
  const [entries,  setEntries]  = useState<ProjectEntry[]>([{ ...EMPTY }]);
  const [errors,   setErrors]   = useState<Partial<ProjectEntry>[]>([{}]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(d => {
        if (d.projects?.length) {
          const formatted = d.projects.map(serverToForm);
          setAllProjects(formatted);
          if (editIdx !== null && formatted[editIdx] !== undefined) {
            setEntries([{ ...formatted[editIdx] }]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [router, editIdx]);

  function change(i: number, field: keyof ProjectEntry, val: string) {
    setEntries(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n; });
    setErrors(prev  => { const n = [...prev]; n[i] = { ...n[i], [field]: '' };  return n; });
  }

  function validate() {
    const errs = entries.map(e => {
      const obj: Partial<ProjectEntry> = {};
      if (!e.title.trim())       obj.title       = 'Required';
      if (!e.description.trim()) obj.description = 'Required';
      return obj;
    });
    setErrors(errs);
    return errs.every(e => Object.keys(e).length === 0);
  }

  async function handleDelete(idx: number) {
    setLoading(true);
    try {
      const updated = allProjects.filter((_, i) => i !== idx).map(formToServer);
      await apiPatch('/form/update-profile', { projects: updated });
      setAllProjects(prev => prev.filter((_, i) => i !== idx));
      setToast({ msg: 'Project deleted!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch {
      setToast({ msg: 'Failed to delete', type: 'error' });
    } finally { setLoading(false); }
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      let merged: ReturnType<typeof formToServer>[];
      if (isEditMode && editIdx !== null) {
        merged = allProjects.map((item, i) => i === editIdx ? formToServer(entries[0]) : formToServer(item));
      } else {
        merged = [...allProjects.map(formToServer), ...entries.map(formToServer)];
      }
      await apiPatch('/form/update-profile', { projects: merged });
      setToast({ msg: isEditMode ? 'Project updated!' : 'Projects saved!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
    } finally { setLoading(false); }
  }

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
        <button onClick={() => router.push('/home')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13.5, marginBottom: 24, padding: 0, fontFamily: 'Montserrat, sans-serif' }}>
          ← Back to Dashboard
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 28, color: '#1a1a2e', marginBottom: 4 }}>
            💻 {isEditMode ? 'Edit Project' : 'Add Projects'}
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'Montserrat, sans-serif' }}>
            {isEditMode ? 'Update project details' : 'Showcase your work and side projects'}
          </p>
        </div>

        {!isEditMode && allProjects.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>
              Saved Projects ({allProjects.length})
            </p>
            {allProjects.map((proj, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: '14px 18px', border: '1px solid #e5e7eb', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💻</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 1 }}>{proj.title}</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.description}</p>
                </div>
                <button
                  onClick={() => router.push(`/profile/projects?edit=${i}`)}
                  style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, flexShrink: 0 }}
                >✏️ Edit</button>
                <button
                  onClick={() => handleDelete(i)}
                  disabled={loading}
                  style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: '#ef4444', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, flexShrink: 0 }}
                >🗑 Delete</button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 20 }}>
              {isEditMode ? 'Edit Project' : 'New Project'}
            </h2>

            {entries.map((proj, i) => (
              <div key={i} style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
                {!isEditMode && entries.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{proj.title || `Project #${i + 1}`}</span>
                    <button type="button" onClick={() => { setEntries(p => p.filter((_, idx) => idx !== i)); setErrors(p => p.filter((_, idx) => idx !== i)); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 9px', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>Remove</button>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={lbl}>Title *</label>
                    <input style={{ ...inp, border: `1.5px solid ${errors[i]?.title ? '#ef4444' : '#e5e7eb'}` }} placeholder="e.g. Portfolio Website" value={proj.title} onChange={e => change(i, 'title', e.target.value)} />
                    {errors[i]?.title && <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'Montserrat, sans-serif', marginTop: 3, display: 'block' }}>{errors[i].title}</span>}
                  </div>
                  <div>
                    <label style={lbl}>Description *</label>
                    <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.6, border: `1.5px solid ${errors[i]?.description ? '#ef4444' : '#e5e7eb'}` }} placeholder="What does this project do?" rows={3} value={proj.description} onChange={e => change(i, 'description', e.target.value)} />
                    {errors[i]?.description && <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'Montserrat, sans-serif', marginTop: 3, display: 'block' }}>{errors[i].description}</span>}
                  </div>
                  <div>
                    <label style={lbl}>Tech Stack <span style={{ color: '#9ca3af', fontWeight: 400 }}>(comma separated)</span></label>
                    <input style={inp} placeholder="e.g. React, Node.js, MongoDB" value={proj.tech_stack} onChange={e => change(i, 'tech_stack', e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={lbl}>GitHub Link</label>
                      <input style={inp} type="url" placeholder="https://github.com/..." value={proj.github_link} onChange={e => change(i, 'github_link', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Live Link</label>
                      <input style={inp} type="url" placeholder="https://..." value={proj.live_link} onChange={e => change(i, 'live_link', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!isEditMode && (
              <button type="button" onClick={() => { setEntries(p => [...p, { ...EMPTY }]); setErrors(p => [...p, {}]); }} style={{ width: '100%', padding: '12px', border: '2px dashed #e5e7eb', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#f97316', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
                + Add Another Project
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => router.push('/home')} style={{ padding: '12px 24px', border: '1.5px solid #e5e7eb', borderRadius: 10, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding: '12px 32px', background: '#1a1a2e', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving...' : isEditMode ? '✓ Update Project' : '✓ Save Projects'}
              </button>
            </div>
          </div>
        </form>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}