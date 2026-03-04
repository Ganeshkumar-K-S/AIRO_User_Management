"use client"

import { Download, RefreshCw } from "lucide-react";

interface GeneratedResumeProps {
  resumeData?: any;
  pdfPath?: string | null;
  onRegenerate: () => void;
}

const GeneratedResume = ({ resumeData, pdfPath, onRegenerate }: GeneratedResumeProps) => {
  if (!resumeData) return null;

  return (
    <div className="neu-card animate-fade-slide-up">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground">Generated Resume</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (pdfPath) {
                const backendUrl = process.env.NEXT_PUBLIC_JD_BACKEND_URL || "http://localhost:8000";
                window.open(`${backendUrl}/api/download?path=${encodeURIComponent(pdfPath)}`, "_blank");
              }
            }}
            disabled={!pdfPath}
            className="neu-btn flex items-center gap-2 text-sm bg-card text-foreground disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={onRegenerate}
            className="neu-btn flex items-center gap-2 text-sm bg-card text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-5 text-sm">
        {/* Name */}
        <h3 className="text-2xl font-bold text-foreground">{resumeData.name}</h3>

        {/* Summary */}
        {resumeData.professional_summary && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Summary</h4>
            <p className="text-foreground/80 leading-relaxed">{resumeData.professional_summary}</p>
          </div>
        )}

        {/* Skills */}
        {resumeData.skills && resumeData.skills.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-full px-3 py-1 text-xs font-medium bg-muted text-foreground transition-transform duration-200 hover:scale-110 cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {resumeData.experience && resumeData.experience.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Experience</h4>
            <div className="space-y-4">
              {resumeData.experience.map((exp: any, idx: number) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline">
                    <p className="font-semibold text-foreground">{exp.role}</p>
                    <span className="text-xs text-muted-foreground">{exp.period || exp.duration || ""}</span>
                  </div>
                  <p className="text-muted-foreground text-xs mb-1">{exp.company}</p>
                  <ul className="list-disc list-inside space-y-0.5 text-foreground/75">
                    {exp.bullets?.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                    {/* Fallback if bullets is not an array but purely description */}
                    {!exp.bullets && exp.description && <li>{exp.description}</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {resumeData.projects && resumeData.projects.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Projects</h4>
            <div className="space-y-2">
              {resumeData.projects.map((p: any, idx: number) => (
                <div key={idx}>
                  <p className="font-semibold text-foreground">{p.name || p.title}</p>
                  <p className="text-foreground/70 text-xs">{p.desc || p.description}</p>
                  {p.bullets && (
                    <ul className="list-disc list-inside space-y-0.5 text-foreground/75 mt-1">
                      {p.bullets.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
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
