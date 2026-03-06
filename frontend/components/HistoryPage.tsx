"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Clock, Download, Eye, FileText,
  TrendingUp, RefreshCw, X, AlertCircle, ExternalLink,
  Layers, Sparkles, Filter
} from "lucide-react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_RT_BACKEND_URL || "http://localhost:8000";
const USER_ID =
  typeof window !== "undefined"
    ? localStorage.getItem("user_id") || "664f1b2c8e1d2a3b4c5d6e7f"
    : "664f1b2c8e1d2a3b4c5d6e7f";

// ─── SCORE BADGE ─────────────────────────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  const color =
    score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const bg =
    score >= 80
      ? "rgba(34,197,94,0.08)"
      : score >= 60
      ? "rgba(217,119,6,0.08)"
      : "rgba(220,38,38,0.08)";
  const border =
    score >= 80
      ? "rgba(34,197,94,0.25)"
      : score >= 60
      ? "rgba(217,119,6,0.25)"
      : "rgba(220,38,38,0.25)";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: "5px 12px",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        color,
        whiteSpace: "nowrap",
      }}
    >
      <TrendingUp size={13} />
      {score != null ? `${score}%` : "—"}
    </div>
  );
};

// ─── VERSION CARD ─────────────────────────────────────────────────────────────
const VersionCard = ({ item, index, onView, onDownload }) => {
  const date = item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div
      className="profile-item-row fade-in-up"
      style={{
        animationDelay: `${index * 70}ms`,
        opacity: 0,
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      {/* Icon */}
      <div
        className="profile-item-icon"
        style={{ background: "rgba(108,71,255,0.08)", color: "var(--accent)", flexShrink: 0 }}
      >
        <FileText size={22} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <p className="profile-item-title">Resume Version {item.version}</p>
        <p className="profile-item-sub" style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
          <Clock size={12} />
          {date}
        </p>
      </div>

      {/* Score */}
      {item.match_score != null && <ScoreBadge score={item.match_score} />}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button className="card-action-btn" onClick={() => onView(item)}
          style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Eye size={13} /> View
        </button>
        <button
          className="card-action-btn"
          onClick={() => onDownload(item)}
          disabled={!item.resume_url}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            ...((!item.resume_url) && { opacity: 0.4, cursor: "not-allowed" }),
          }}
        >
          <Download size={13} /> Download
        </button>
      </div>
    </div>
  );
};

// ─── PREVIEW MODAL ────────────────────────────────────────────────────────────
const PreviewModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(13,13,20,0.55)",
        backdropFilter: "blur(8px)",
        zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="profile-card fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 780,
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          padding: 0,
          animationDelay: "0ms", opacity: 0,
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "24px 32px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0, flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <h3 className="profile-card-title" style={{ marginBottom: 2 }}>
              Resume Version {item.version}
            </h3>
            <p className="profile-item-sub">
              {item.created_at ? new Date(item.created_at).toLocaleString() : "No date"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {item.resume_url && (
              <a href={item.resume_url} target="_blank" rel="noreferrer"
                className="card-action-btn"
                style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
                <ExternalLink size={13} /> Open
              </a>
            )}
            <button onClick={onClose} className="card-action-btn"
              style={{
                background: "rgba(220,38,38,0.06)",
                borderColor: "rgba(220,38,38,0.18)",
                color: "#dc2626",
                display: "flex", alignItems: "center",
              }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {item.resume_url ? (
            <iframe src={item.resume_url} title={`Resume v${item.version}`}
              style={{ width: "100%", height: "58vh", border: "none", display: "block" }} />
          ) : (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 12, height: 260,
              color: "var(--muted)", fontSize: 14,
              fontFamily: "'Montserrat', sans-serif",
            }}>
              <FileText size={44} opacity={0.3} />
              No preview URL available for this version.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 32px",
          borderTop: "1px solid var(--border)",
          flexWrap: "wrap", gap: 10,
        }}>
          {item.match_score != null && <ScoreBadge score={item.match_score} />}
          {item.resume_url && (
            <a href={item.resume_url} download={`resume_v${item.version}.pdf`}
              className="btn-primary"
              style={{
                width: "auto", padding: "10px 22px",
                textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
              }}>
              <Download size={14} /> Download PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN HISTORY PAGE ────────────────────────────────────────────────────────
export default function HistoryPage({ onGoBack }) {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const [preview, setPreview]   = useState(null);
  const [sortDir, setSortDir]   = useState("desc");
  const [filterMin, setFilterMin] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/resume/history/${USER_ID}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const displayed = [...history]
    .filter((h) => (h.match_score ?? 0) >= filterMin)
    .sort((a, b) => sortDir === "desc" ? b.version - a.version : a.version - b.version);

  const scores    = history.map((h) => h.match_score).filter((s) => s != null);
  const bestScore = scores.length ? Math.max(...scores) : null;
  const avgScore  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const handleDownload = (item) => {
    if (!item.resume_url) return alert("No download URL for this version.");
    const a = document.createElement("a");
    a.href = item.resume_url;
    a.download = `resume_v${item.version}.pdf`;
    a.click();
  };

  return (
    <div className="home-scene">

      {/* ── Navbar ── */}
      <nav className="home-nav">
        <div className="home-nav-logo">
          <span style={{ color: "var(--accent)" }}>AI</span> Resume
        </div>
        <div className="home-nav-links">
          <span className="jwt-badge">
            <Clock size={13} /> Version History
          </span>
        </div>
        <button
          className="neu-btn"
          onClick={onGoBack}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700, color: "var(--ink)",
            background: "var(--color-card, #eef0f5)",
            border: "none", cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} /> Go Back
        </button>
      </nav>

      {/* ── Hero ── */}
      <div className="home-hero" style={{ paddingBottom: 0 }}>
        <h1 className="home-hero-title fade-in-up" style={{ animationDelay: "0ms", opacity: 0 }}>
          Resume <span style={{ color: "var(--accent)" }}>History</span>
        </h1>
        <p className="home-hero-subtitle fade-in-up fade-in-up-delay-1" style={{ marginBottom: 40 }}>
          Browse every version of your optimised resume. View previews, compare match
          scores, and download any version instantly.
        </p>

        {/* Stats */}
        {!loading && !error && history.length > 0 && (
          <div className="stats-grid" style={{ marginTop: 0, marginBottom: 40 }}>
            <div className="stat-card fade-in-up fade-in-up-delay-1">
              <div className="stat-icon"><Layers size={26} /></div>
              <div className="stat-value">{history.length}</div>
              <div className="stat-label">Total Versions</div>
            </div>
            <div className="stat-card fade-in-up fade-in-up-delay-2">
              <div className="stat-icon" style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a" }}>
                <TrendingUp size={26} />
              </div>
              <div className="stat-value" style={{ color: bestScore >= 80 ? "#16a34a" : "var(--ink)" }}>
                {bestScore ?? "—"}
                <span style={{ fontSize: 22, color: "var(--muted)", fontWeight: 500 }}>%</span>
              </div>
              <div className="stat-label">Best Match Score</div>
            </div>
            <div className="stat-card fade-in-up fade-in-up-delay-3">
              <div className="stat-icon" style={{ background: "rgba(217,119,6,0.08)", color: "#d97706" }}>
                <Sparkles size={26} />
              </div>
              <div className="stat-value">
                {avgScore ?? "—"}
                <span style={{ fontSize: 22, color: "var(--muted)", fontWeight: 500 }}>%</span>
              </div>
              <div className="stat-label">Avg Match Score</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main card ── */}
      <div className="home-hero" style={{ paddingTop: 0, paddingBottom: 80 }}>
        <div className="profile-card fade-in-up fade-in-up-delay-2" style={{ opacity: 0 }}>

          {/* Card header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 14, marginBottom: 28,
          }}>
            <div>
              <h2 className="profile-card-title">All Versions</h2>
              <p className="profile-card-sub" style={{ marginBottom: 0 }}>
                {loading ? "Loading…" : `${displayed.length} version${displayed.length !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="neu-btn"
                onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
                  color: "var(--accent)", background: "rgba(108,71,255,0.06)",
                  border: "1.5px solid rgba(108,71,255,0.18)",
                  cursor: "pointer", padding: "8px 16px",
                }}
              >
                <Layers size={13} />
                {sortDir === "desc" ? "Newest first" : "Oldest first"}
              </button>

              <div style={{ position: "relative" }}>
                <Filter size={13} style={{
                  position: "absolute", left: 12, top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted)", pointerEvents: "none",
                }} />
                <select
                  className="form-input"
                  value={filterMin}
                  onChange={(e) => setFilterMin(Number(e.target.value))}
                  style={{
                    padding: "8px 14px 8px 32px", fontSize: 12,
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600, height: "auto", cursor: "pointer",
                  }}
                >
                  <option value={0}>All scores</option>
                  <option value={60}>≥ 60%</option>
                  <option value={75}>≥ 75%</option>
                  <option value={85}>≥ 85%</option>
                </select>
              </div>

              <button
                className="neu-btn"
                onClick={fetchHistory}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontFamily: "'Montserrat', sans-serif", fontWeight: 700,
                  color: "var(--muted)", background: "var(--color-card, #eef0f5)",
                  border: "none", cursor: "pointer", padding: "8px 16px",
                }}
              >
                <RefreshCw size={13}
                  style={loading ? { animation: "spin 0.7s linear infinite" } : {}} />
                Refresh
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 16, padding: "60px 0",
              color: "var(--muted)", fontFamily: "'Montserrat', sans-serif",
            }}>
              <div className="spinner" style={{
                borderTopColor: "var(--accent)",
                borderColor: "rgba(108,71,255,0.2)",
                width: 36, height: 36, borderWidth: 3,
              }} />
              <p style={{ fontSize: 14 }}>Loading your resume history…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="error-banner" style={{
              flexDirection: "column", alignItems: "center",
              padding: "40px 24px", gap: 12,
            }}>
              <AlertCircle size={36} color="#dc2626" />
              <p style={{ fontWeight: 700 }}>Failed to load history</p>
              <p style={{ fontSize: 12, opacity: 0.7 }}>{error}</p>
              <button className="btn-primary" onClick={fetchHistory}
                style={{ width: "auto", padding: "10px 24px", marginTop: 4,
                  display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && displayed.length === 0 && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 14, padding: "60px 0",
              color: "var(--muted)", fontFamily: "'Montserrat', sans-serif", textAlign: "center",
            }}>
              <FileText size={44} opacity={0.3} />
              <p style={{ fontSize: 14, maxWidth: 280, lineHeight: 1.6 }}>
                No resume versions found. Start optimising your resume to see history here.
              </p>
            </div>
          )}

          {/* List */}
          {!loading && !error && displayed.length > 0 && (
            <>
              <p className="section-label">{displayed.length} Version{displayed.length !== 1 ? "s" : ""}</p>
              {displayed.map((item, i) => (
                <VersionCard
                  key={item._id}
                  item={item}
                  index={i}
                  onView={setPreview}
                  onDownload={handleDownload}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {preview && <PreviewModal item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}