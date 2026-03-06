"use client"

import { useRouter } from "next/navigation";
import { Sparkles, Clock, ArrowLeft } from "lucide-react";

interface HeaderProps {
  onHistoryClick?: () => void;
  onGoBack?: () => void;
}

const Header = ({ onHistoryClick, onGoBack }: HeaderProps) => {
  const router = useRouter();

  const handleGoBack = () => {
    if (onGoBack) onGoBack();
    router.push("/home");
  };

  return (
    <header className="home-nav">
      {/* Logo */}
      <div className="home-nav-logo">
        <span style={{ color: "var(--accent)" }}>AI</span> Resume
      </div>

      {/* Center badge */}
      <div className="home-nav-links">
        <span className="jwt-badge" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} />
          AI Resume Optimizer
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          className="neu-btn"
          onClick={onHistoryClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13,
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            color: "var(--accent)",
            background: "rgba(108,71,255,0.06)",
            border: "1.5px solid rgba(108,71,255,0.18)",
            cursor: "pointer",
            padding: "9px 18px",
          }}
        >
          <Clock size={14} />
          <span>History</span>
        </button>

        <button
          className="neu-btn"
          onClick={handleGoBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13,
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            color: "var(--ink)",
            background: "var(--color-card, #eef0f5)",
            border: "none",
            cursor: "pointer",
            padding: "9px 18px",
          }}
        >
          <ArrowLeft size={14} />
          <span>Go Back</span>
        </button>
      </div>
    </header>
  );
};

export default Header;