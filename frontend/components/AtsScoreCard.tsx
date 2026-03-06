"use client"

import { useEffect, useState } from "react";
interface AtsScoreCardProps {
  label: string;
  score: number;
  delay?: number;
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
  warning: '#f97316',
};

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
    if (val > 80) return C.success;
    if (val >= 60) return C.warning;
    return C.accent2;
  };

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (current / 100) * circumference;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '32px 24px', boxShadow: '0 4px 18px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, transition: 'all 0.3s cubic-bezier(.4,0,.2,1)', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(15,23,42,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(15,23,42,0.06)'; }}
    >
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{label}</p>

      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="8"
            stroke="#f1f5f9"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            stroke={getColor(current)}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: "stroke-dashoffset 0.1s ease-out, stroke 0.3s ease",
            }}
          />
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 26, color: getColor(current) }}>
          {current}
        </span>
      </div>
    </div>
  );
};

export default AtsScoreCard;
