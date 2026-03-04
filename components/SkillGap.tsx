"use client"

interface SkillGapProps {
  gapData: any;
}

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
    <div className="neu-card animate-fade-slide-up" style={{ animationDelay: "300ms" }}>
      <h2 className="text-lg font-semibold text-foreground mb-4">Skill Gap Analysis</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Matched Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full px-3 py-1 text-xs font-medium bg-success/15 text-success transition-transform duration-200 hover:scale-110 cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Missing Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full px-3 py-1 text-xs font-medium bg-destructive/15 text-destructive transition-transform duration-200 hover:scale-110 cursor-default"
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
