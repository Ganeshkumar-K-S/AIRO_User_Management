'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, apiGet, apiPatch } from '@/lib/api';
import { Navbar } from '@/app/home/page';

interface CertEntry {
  title: string;
  issuer: string;
  issue_date: string;
  link: string;
}

const EMPTY: CertEntry = { title: '', issuer: '', issue_date: '', link: '' };

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999, background: type === 'success' ? '#22c55e' : '#ef4444', color: 'white', borderRadius: 10, padding: '12px 18px', fontFamily: 'Montserrat,sans-serif', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)' }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  );
}

function serverToForm(c: Record<string, unknown>): CertEntry {
  return {
    title:      String(c.title      ?? ''),
    issuer:     String(c.issuer     ?? ''),
    issue_date: c.issue_date ? String(c.issue_date).substring(0, 10) : '',
    link:       String(c.link       ?? ''),
  };
}

function formToServer(e: CertEntry) {
  return {
    title:      e.title      || null,
    issuer:     e.issuer     || null,
    issue_date: e.issue_date ? new Date(e.issue_date).toISOString() : null,
    link:       e.link       || null,
  };
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontFamily: 'Montserrat,sans-serif', fontSize: 14, outline: 'none', background: 'white', color: '#1a1a2e', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, fontFamily: 'Montserrat,sans-serif' };

export default function CertificationsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editParam    = searchParams.get('edit');
  const editIdx      = editParam !== null ? parseInt(editParam) : null;
  const isEditMode   = editIdx !== null;

  const [allCerts, setAllCerts] = useState<CertEntry[]>([]);
  const [entries,  setEntries]  = useState<CertEntry[]>([{ ...EMPTY }]);
  const [errors,   setErrors]   = useState<Partial<CertEntry>[]>([{}]);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.replace('/login'); return; }
    apiGet(`/form/get-profile/${encodeURIComponent(auth.email ?? '')}`)
      .then(d => {
        if (d.certifications?.length) {
          const formatted = d.certifications.map(serverToForm);
          setAllCerts(formatted);
          if (editIdx !== null && formatted[editIdx]) setEntries([{ ...formatted[editIdx] }]);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [router, editIdx]);

  function change(i: number, field: keyof CertEntry, val: string) {
    setEntries(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n; });
    setErrors(prev  => { const n = [...prev]; n[i] = { ...n[i], [field]: '' };  return n; });
  }

  function validate() {
    const errs = entries.map(e => {
      const obj: Partial<CertEntry> = {};
      if (!e.title.trim())  obj.title  = 'Required';
      if (!e.issuer.trim()) obj.issuer = 'Required';
      return obj;
    });
    setErrors(errs);
    return errs.every(e => Object.keys(e).length === 0);
  }

  async function handleDelete(idx: number) {
    setLoading(true);
    try {
      const updated = allCerts.filter((_, i) => i !== idx).map(formToServer);
      await apiPatch('/form/update-profile', { certifications: updated });
      setAllCerts(prev => prev.filter((_, i) => i !== idx));
      setToast({ msg: 'Certification deleted!', type: 'success' });
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
      let merged;
      if (isEditMode && editIdx !== null) {
        merged = allCerts.map((item, i) => i === editIdx ? formToServer(entries[0]) : formToServer(item));
      } else {
        merged = [...allCerts.map(formToServer), ...entries.map(formToServer)];
      }
      await apiPatch('/form/update-profile', { certifications: merged });
      setToast({ msg: isEditMode ? 'Certification updated!' : 'Certifications saved!', type: 'success' });
      setTimeout(() => router.push('/home'), 1200);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
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
            🏆 {isEditMode ? 'Edit Certification' : 'Add Certifications'}
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'Montserrat,sans-serif' }}>
            {isEditMode ? 'Update certification details' : 'Showcase your earned certificates'}
          </p>
        </div>

        {!isEditMode && allCerts.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Montserrat,sans-serif' }}>
              Saved Certifications ({allCerts.length})
            </p>
            {allCerts.map((cert, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: '14px 18px', border: '1px solid #e5e7eb', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏆</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 1 }}>{cert.title}</p>
                  <p style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'Montserrat,sans-serif' }}>{cert.issuer}{cert.issue_date ? ` · ${cert.issue_date}` : ''}</p>
                </div>
                <button onClick={() => router.push(`/profile/certifications?edit=${i}`)} style={{ background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', fontWeight: 600, flexShrink: 0 }}>✏️ Edit</button>
                <button onClick={() => handleDelete(i)} disabled={loading} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '5px 12px', fontSize: 12, color: '#ef4444', cursor: 'pointer', fontFamily: 'Montserrat,sans-serif', fontWeight: 600, flexShrink: 0 }}>🗑 Delete</button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 20 }}>
              {isEditMode ? 'Edit Certification' : 'New Certification'}
            </h2>

            {entries.map((cert, i) => (
              <div key={i} style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
                {!isEditMode && entries.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{cert.title || `Certification #${i + 1}`}</span>
                    <button type="button" onClick={() => { setEntries(p => p.filter((_, idx) => idx !== i)); setErrors(p => p.filter((_, idx) => idx !== i)); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 9px', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>Remove</button>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={lbl}>Certificate Title *</label>
                      <input style={{ ...inp, border: `1.5px solid ${errors[i]?.title ? '#ef4444' : '#e5e7eb'}` }} placeholder="e.g. AWS Cloud Practitioner" value={cert.title} onChange={e => change(i, 'title', e.target.value)} />
                      {errors[i]?.title && <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'Montserrat,sans-serif', marginTop: 3, display: 'block' }}>{errors[i].title}</span>}
                    </div>
                    <div>
                      <label style={lbl}>Issuing Organization *</label>
                      <input style={{ ...inp, border: `1.5px solid ${errors[i]?.issuer ? '#ef4444' : '#e5e7eb'}` }} placeholder="e.g. Amazon Web Services" value={cert.issuer} onChange={e => change(i, 'issuer', e.target.value)} />
                      {errors[i]?.issuer && <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'Montserrat,sans-serif', marginTop: 3, display: 'block' }}>{errors[i].issuer}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={lbl}>Issue Date</label>
                      <input type="date" style={inp} value={cert.issue_date} onChange={e => change(i, 'issue_date', e.target.value)} />
                    </div>
                    <div>
                      <label style={lbl}>Certificate Link</label>
                      <input type="url" style={inp} placeholder="https://credential.net/..." value={cert.link} onChange={e => change(i, 'link', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {!isEditMode && (
              <button type="button" onClick={() => { setEntries(p => [...p, { ...EMPTY }]); setErrors(p => [...p, {}]); }} style={{ width: '100%', padding: '12px', border: '2px dashed #e5e7eb', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#f97316', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
                + Add Another Certification
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => router.push('/home')} style={{ padding: '12px 24px', border: '1.5px solid #e5e7eb', borderRadius: 10, background: 'none', cursor: 'pointer', color: '#6b7280', fontFamily: 'Montserrat,sans-serif', fontSize: 14 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding: '12px 32px', background: '#1a1a2e', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving...' : isEditMode ? '✓ Update Certification' : '✓ Save Certifications'}
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