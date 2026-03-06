"use client"

interface SkillGapProps {
  gapData: any;
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

const SkillGap = ({ gapData }: SkillGapProps) => {
  if (!gapData || !gapData.skills_analysis) return null;

  const skillsAnalysis = gapData.skills_analysis;
  const matchedSkills = [
    ...(skillsAnalysis.matched_required_skills || []),
    ...(skillsAnalysis.matched_preferred_skills || []),
    ...(skillsAnalysis.partial_match_skills || [])
  ];

  const missingSkills = [
    ...(skillsAnalysis.missing_required_skills || []),
    ...(skillsAnalysis.missing_preferred_skills || [])
  ];
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '36px 40px', boxShadow: '0 4px 28px rgba(15,23,42,0.05)' }} className="animate-fade-slide-up">
      <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24, color: C.ink, margin: '0 0 24px', letterSpacing: '-0.5px' }}>Skill Gap Analysis</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: C.success, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
            Matched Skills
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                style={{
                  background: `${C.success}15`, color: C.success, borderRadius: 8, padding: '6px 14px',
                  fontFamily: 'Montserrat, sans-serif', fontSize: 13.5, fontWeight: 700, cursor: 'default', border: `1px solid ${C.success}40`
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: C.accent2, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
            Missing Skills
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {missingSkills.map((skill) => (
              <span
                key={skill}
                style={{
                  background: `${C.accent2}10`, color: C.accent2, borderRadius: 8, padding: '6px 14px',
                  fontFamily: 'Montserrat, sans-serif', fontSize: 13.5, fontWeight: 700, cursor: 'default', border: `1px solid ${C.accent2}40`
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillGap;
