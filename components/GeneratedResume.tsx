"use client"

import { Download, RefreshCw } from "lucide-react";

interface GeneratedResumeProps {
  resumeData?: any;
  pdfPath?: string | null;
  onRegenerate: () => void;
}

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
};

const GeneratedResume = ({ resumeData, pdfPath, onRegenerate }: GeneratedResumeProps) => {
  if (!resumeData) return null;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '36px 40px', boxShadow: '0 4px 28px rgba(15,23,42,0.05)' }} className="animate-fade-slide-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24, color: C.ink, margin: 0, letterSpacing: '-0.5px' }}>Generated Resume</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              if (pdfPath) {
                const backendUrl = process.env.NEXT_PUBLIC_JD_BACKEND_URL || "http://localhost:8000";
                window.open(`${backendUrl}/api/download?path=${encodeURIComponent(pdfPath)}`, "_blank");
              }
            }}
            disabled={!pdfPath}
            onMouseEnter={e => { if (pdfPath) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; } }}
            onMouseLeave={e => { if (pdfPath) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; } }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'transparent',
              border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 16px',
              color: C.muted, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13.5,
              cursor: pdfPath ? 'pointer' : 'not-allowed', transition: 'all 0.2s', opacity: pdfPath ? 1 : 0.5
            }}
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={onRegenerate}
            onMouseEnter={e => { e.currentTarget.style.background = C.accentHov; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${C.accent}40`; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 14px ${C.accent}30`; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, background: C.accent, color: '#fff',
              border: 'none', borderRadius: 12, padding: '10px 18px', fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700, fontSize: 13.5, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
              boxShadow: `0 4px 14px ${C.accent}30`
            }}
          >
            <RefreshCw size={16} />
            Regenerate
          </button>
        </div>
      </div>

      <div style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 10 }}>
        {/* Name */}
        <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 32, color: C.ink, margin: '0 0 24px', letterSpacing: '-1px' }}>{resumeData.name}</h3>

        {/* Summary */}
        {resumeData.professional_summary && (
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Summary</h4>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: 0 }}>{resumeData.professional_summary}</p>
          </div>
        )}

        {/* Skills */}
        {resumeData.skills && resumeData.skills.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {resumeData.skills.map((skill: string) => (
                <span
                  key={skill}
                  style={{
                    background: C.accentSoft, color: C.accent, borderRadius: 8, padding: '6px 14px',
                    fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {resumeData.experience && resumeData.experience.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Experience</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {resumeData.experience.map((exp: any, idx: number) => (
                <div key={idx} style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 16, color: C.ink, margin: 0 }}>{exp.role}</p>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, color: C.muted, fontWeight: 600, background: C.surface, padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}` }}>{exp.period || exp.duration || ""}</span>
                  </div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: C.accent, fontWeight: 600, margin: '0 0 12px' }}>{exp.company}</p>
                  <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.6 }}>
                    {exp.bullets?.map((b: string, i: number) => (
                      <li key={i} style={{ marginBottom: 6 }}>{b}</li>
                    ))}
                    {!exp.bullets && exp.description && <li>{exp.description}</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {resumeData.projects && resumeData.projects.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Projects</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {resumeData.projects.map((p: any, idx: number) => (
                <div key={idx} style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 22px' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 15, color: C.ink, margin: '0 0 6px' }}>{p.name || p.title}</p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: C.muted, margin: '0 0 10px', lineHeight: 1.5 }}>{p.desc || p.description}</p>
                  {p.bullets && (
                    <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontFamily: 'Montserrat, sans-serif', fontSize: 13.5, lineHeight: 1.6 }}>
                      {p.bullets.map((b: string, i: number) => (
                        <li key={i} style={{ marginBottom: 4 }}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratedResume;
