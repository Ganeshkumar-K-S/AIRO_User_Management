"use client"

import { useEffect, useState } from "react";
interface AtsScoreCardProps {
  label: string;
  score: number;
  delay?: number;
}

const AtsScoreCard = ({ label, score, delay = 0 }: AtsScoreCardProps) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const duration = 1500;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        start = Math.round(eased * score);
        setCurrent(start);
        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [score, delay]);

  const getColor = (val: number) => {
    if (val > 80) return "text-success";
    if (val >= 60) return "text-warning";
    return "text-destructive";
  };

  const getStroke = (val: number) => {
    if (val > 80) return "stroke-success";
    if (val >= 60) return "stroke-warning";
    return "stroke-destructive";
  };

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (current / 100) * circumference;

  return (
    <div className="neu-card flex flex-col items-center gap-3 transition-all duration-300 hover:scale-105 cursor-default">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>

      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="8"
            className="stroke-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={`${getStroke(current)} transition-all duration-300`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: "stroke-dashoffset 0.1s ease-out",
            }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${getColor(current)}`}>
          {current}
        </span>
      </div>
    </div>
  );
};

export default AtsScoreCard;
