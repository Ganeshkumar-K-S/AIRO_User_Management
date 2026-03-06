"use client"

interface HeatmapProps {
  gapData: any;
}

const Heatmap = ({ gapData }: HeatmapProps) => {
  if (!gapData || !gapData.skill_gap_scores) return null;

  const scores = gapData.skill_gap_scores;
  return (
    <div className="neu-card animate-fade-slide-up" style={{ animationDelay: "200ms" }}>
      <h2 className="text-lg font-semibold text-foreground mb-4">ATS Keyword Heatmap</h2>
      <div className="max-h-48 overflow-y-auto rounded-xl p-4 bg-card neu-inset text-sm leading-8">
        <div className="flex flex-wrap items-center">
          {scores.map((gs: any, i: number) => {
            // Map gaps to heat colors: red (missing), yellow (partial), green (matched)
            let colorClass = "bg-success/20 border-success/30 text-success-foreground";
            if (gs.gap > 0.6) colorClass = "bg-destructive/20 border-destructive/30 text-destructive-foreground";
            else if (gs.gap > 0.2) colorClass = "bg-amber-500/20 border-amber-500/30 text-amber-700";

            return (
              <span
                key={i}
                className={`${colorClass} px-2 py-1 mx-1 my-1 rounded border shadow-sm transition-all duration-300 font-medium`}
                style={{ animationDelay: `${i * 30}ms` }}
                title={`Gap Score: ${gs.gap}\nEvidence: ${gs.evidence}`}
              >
                {gs.skill}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
