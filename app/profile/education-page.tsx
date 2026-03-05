'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, apiGet, apiPatch } from '@/lib/api';
import { Navbar } from '@/app/home/page';

interface EducationEntry {
  degree: string; branch: string; institution: string;
  cgpa: string; start_year: string; end_year: string;
}

const EMPTY: EducationEntry = { degree: '', branch: '', institution: '', cgpa: '', start_year: '', end_year: 'Present' };
const DEGREES = ['High School', 'Diploma', "Associate's", "Bachelor's", "Master's", 'MBA', 'Ph.D.', 'Other'];
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() + 1 - i));

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999, background: type === 'success' ? '#22c55e' : '#ef4444', color: 'white', borderRadius: 10, padding: '12px 18px', fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  );
}

/**
 * Convert a server education record → form strings.
 * Key fix: if end_year is null/undefined (ongoing), use "Present" so the
 * dropdown correctly selects the "Present" option.
 */
function serverToForm(e: Record<string, unknown>): EducationEntry {
  return {
    degree:      String(e.degree      ?? ''),
    branch:      String(e.branch      ?? ''),
    institution: String(e.institution ?? ''),
    cgpa:        e.cgpa  != null ? String(e.cgpa)       : '',
    start_year:  e.start_year != null ? String(e.start_year) : '',
    end_year:    e.end_year   != null ? String(e.end_year)   : 'Present',
  };
}

/**
 * Convert form strings → what the backend expects.
 * Key fix: "Present" → null (not the string "Present"), numbers as integers.
 */
function formToServer(e: EducationEntry) {
  return {
    degree:      e.degree,
    branch:      e.branch,
    institution: e.institution,
    ...(e.cgpa       ? { cgpa:       parseFloat(e.cgpa)       } : {}),
    ...(e.start_year ? { start_year: parseInt(e.start_year)   } : {}),
    end_year: (e.end_year === 'Present' || !e.end_year) ? null : parseInt(e.end_year),
  };
}

export default function EducationPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editParam    = searchParams.get('edit');
  const editIdx      = editParam !== null ? parseInt(editParam) : null;
  const isEditMode   = editIdx !== null;

  const [allEducation, setAllEducation] = useState<EducationEntry[]>([]);
  const [entries, setEntries]   = useState<EducationEntry[]>([{ ...EMPTY }]);
  const [errors,  setErrors]    = useState<Partial<EducationEntry>[]>([{}]);
  const [loading, setLoading]   = useState(false);
  const [toast,   setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(d => {
        if (d.education?.length) {
          const formatted: EducationEntry[] = d.education.map(serverToForm);
          setAllEducation(formatted);
          // In edit mode, pre-fill the form with the record being edited
          if (isEditMode && editIdx !== null && formatted[editIdx]) {
            setEntries([{ ...formatted[editIdx] }]);
          }
        }
      })
      .catch(() => {});
  }, [router, editIdx, isEditMode]);

  function change(i: number, field: keyof EducationEntry, val: string) {
    setEntries(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n; });
    setErrors(prev  => { const n = [...prev]; n[i] = { ...n[i], [field]: ''  }; return n; });
  }

  function validate() {
    const required: (keyof EducationEntry)[] = ['degree', 'branch', 'institution', 'start_year'];
    const errs = entries.map(e => {
      const obj: Partial<EducationEntry> = {};
      required.forEach(f => { if (!e[f]) obj[f] = 'Required'; });
      return obj;
    });
    setErrors(errs);
    return errs.every(e => Object.keys(e).length === 0);
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      let merged: ReturnType<typeof formToServer>[];

      if (isEditMode && editIdx !== null) {
        // Replace only the edited record; keep others untouched
        merged = allEducation.map((item, i) =>
          i === editIdx ? formToServer(entries[0]) : formToServer(item)
        );
      } else {
        merged = [...allEducation.map(formToServer), ...entries.map(formToServer)];
      }

      await apiPatch('/form/update-profile', { education: merged });
      setToast({ msg: isEditMode ? 'Education updated!' : 'Education saved!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  /* ── styles ── */
  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontFamily: 'Montserrat, sans-serif', fontSize: 14,
    outline: 'none', background: 'white', color: '#1a1a2e', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    fontSize: 12.5, fontWeight: 600, color: '#6b7280',
    marginBottom: 5, fontFamily: 'Montserrat, sans-serif', display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar active="Dashboard" />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}>
        <button onClick={() => router.push('/home')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13.5, marginBottom: 24, padding: 0, fontFamily: 'Montserrat, sans-serif' }}>
          ← Back to Dashboard
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 28, color: '#1a1a2e', marginBottom: 4 }}>
            🎓 {isEditMode ? 'Edit Education' : 'Add Education'}
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'Montserrat, sans-serif' }}>
            {isEditMode ? 'Update your academic record' : 'Add your academic background'}
          </p>
        </div>

        {/* Existing records shown only in Add mode */}
        {!isEditMode && allEducation.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>
              Saved Records ({allEducation.length})
            </p>
            {allEducation.map((edu, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: '14px 18px', border: '1px solid #e5e7eb', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎓</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 1 }}>{edu.degree} — {edu.branch}</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'Montserrat, sans-serif' }}>
                    {edu.institution} · {edu.start_year} – {edu.end_year || 'Present'}
                    {edu.cgpa ? ` · CGPA ${edu.cgpa}` : ''}
                  </p>
                </div>
                <button onClick={() => router.push(`/profile/education?edit=${i}`)}
                  style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                  ✏️ Edit
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 20 }}>
              {isEditMode ? 'Edit Record' : 'New Record'}
            </h2>

            {entries.map((edu, i) => (
              <div key={i} style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
                {!isEditMode && entries.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{edu.institution || `Education #${i + 1}`}</span>
                    <button type="button" onClick={() => { setEntries(p => p.filter((_, idx) => idx !== i)); setErrors(p => p.filter((_, idx) => idx !== i)); }}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 9px', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
                      Remove
                    </button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {/* Degree */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={lbl}>Degree *</label>
                    <select style={{ ...inp, border: `1.5px solid ${errors[i]?.degree ? '#ef4444' : '#e5e7eb'}` }}
                      value={edu.degree} onChange={e => change(i, 'degree', e.target.value)}>
                      <option value="">Select degree</option>
                      {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors[i]?.degree && <span style={{ fontSize: 12, color: '#ef4444', marginTop: 3, fontFamily: 'Montserrat, sans-serif' }}>Required</span>}
                  </div>

                  {/* Branch */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={lbl}>Branch *</label>
                    <input style={{ ...inp, border: `1.5px solid ${errors[i]?.branch ? '#ef4444' : '#e5e7eb'}` }}
                      placeholder="e.g. Computer Science" value={edu.branch}
                      onChange={e => change(i, 'branch', e.target.value)} />
                    {errors[i]?.branch && <span style={{ fontSize: 12, color: '#ef4444', marginTop: 3, fontFamily: 'Montserrat, sans-serif' }}>Required</span>}
                  </div>

                  {/* CGPA */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={lbl}>CGPA</label>
                    <input style={inp} type="number" step="0.01" min="0" max="10"
                      placeholder="e.g. 8.5" value={edu.cgpa}
                      onChange={e => change(i, 'cgpa', e.target.value)} />
                  </div>

                  {/* Institution */}
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                    <label style={lbl}>Institution *</label>
                    <input style={{ ...inp, border: `1.5px solid ${errors[i]?.institution ? '#ef4444' : '#e5e7eb'}` }}
                      placeholder="e.g. IIT Bombay" value={edu.institution}
                      onChange={e => change(i, 'institution', e.target.value)} />
                    {errors[i]?.institution && <span style={{ fontSize: 12, color: '#ef4444', marginTop: 3, fontFamily: 'Montserrat, sans-serif' }}>Required</span>}
                  </div>

                  {/* Start Year */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={lbl}>Start Year *</label>
                    <select style={{ ...inp, border: `1.5px solid ${errors[i]?.start_year ? '#ef4444' : '#e5e7eb'}` }}
                      value={edu.start_year} onChange={e => change(i, 'start_year', e.target.value)}>
                      <option value="">Select year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {errors[i]?.start_year && <span style={{ fontSize: 12, color: '#ef4444', marginTop: 3, fontFamily: 'Montserrat, sans-serif' }}>Required</span>}
                  </div>

                  {/* End Year — "Present" is the default/first option */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={lbl}>End Year</label>
                    <select style={inp} value={edu.end_year} onChange={e => change(i, 'end_year', e.target.value)}>
                      <option value="Present">Present (ongoing)</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {!isEditMode && (
              <button type="button"
                onClick={() => { setEntries(p => [...p, { ...EMPTY }]); setErrors(p => [...p, {}]); }}
                style={{ width: '100%', padding: '12px', border: '2px dashed #e5e7eb', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#7c3aed', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
                + Add Another
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => router.push('/home')}
                style={{ padding: '12px 24px', border: '1.5px solid #e5e7eb', borderRadius: 10, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ padding: '12px 32px', background: '#1a1a2e', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving...' : isEditMode ? '✓ Update Education' : '✓ Save Education'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}