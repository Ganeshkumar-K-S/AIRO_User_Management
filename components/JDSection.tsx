"use client"

import { useState, useRef } from "react";
import { Upload, Link, FileText, Loader2 } from "lucide-react";
import { getAuth } from "@/lib/api";

const tabs = ["Text", "EML", "PDF", "DOCX", "URL"] as const;
type TabType = (typeof tabs)[number];

interface JDSectionProps {
  onGenerate: (data: unknown) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
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

const inp: React.CSSProperties = {
  width: '100%', padding: '14px 18px', borderRadius: 14,
  border: `1.5px solid ${C.border}`, fontFamily: 'Montserrat, sans-serif', fontSize: 14.5,
  outline: 'none', background: C.surface, color: C.ink, boxSizing: 'border-box', transition: 'all 0.2s',
  resize: 'none',
};

const mlbl: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 8,
  letterSpacing: '0.3px', display: 'block', fontFamily: 'Montserrat, sans-serif'
};

const JDSection = ({ onGenerate, isGenerating, setIsGenerating }: JDSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("Text");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      const formData = new FormData();
      const inputType = activeTab.toLowerCase();
      formData.append("input_type", inputType);

      if (activeTab === "Text") {
        if (!jdText.trim()) throw new Error("Please paste a job description.");
        formData.append("text", jdText);
      } else if (activeTab === "URL") {
        if (!url.trim()) throw new Error("Please enter a URL.");
        formData.append("url", url);
      } else {
        // PDF, DOCX, EML
        if (!file) throw new Error(`Please upload a .${activeTab.toLowerCase()} file.`);
        formData.append("file", file);
      }

      if (resumeText.trim()) {
        formData.append("resume_json", resumeText);
      }

      const backendUrl = process.env.NEXT_PUBLIC_JD_BACKEND_URL || "http://localhost:8000";
      const auth = getAuth();
      const response = await fetch(`${backendUrl}/api/extract`, {
        method: "POST",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_SECRET_KEY ?? "",
          ...(auth?.token ? { "Authorization": `Bearer ${auth.token}` } : {})
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail ?? `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      onGenerate(data);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '36px 40px', boxShadow: '0 4px 28px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24, color: C.ink, margin: 0, letterSpacing: '-0.5px' }}>Upload Job Description</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setFile(null);
              setError(null);
            }}
            style={{
              padding: '8px 20px', borderRadius: 12, fontFamily: 'Montserrat, sans-serif', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === tab ? C.accentSoft : 'transparent',
              color: activeTab === tab ? C.accent : C.muted,
              border: `1.5px solid ${activeTab === tab ? C.accentSoft : C.border}`
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Input Area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === "Text" && (
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste your job description here..."
            style={{ ...inp, height: '100%', minHeight: 180 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}15`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
          />
        )}

        {activeTab === "URL" && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex' }}>
              <Link size={18} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste job listing URL..."
              style={{ ...inp, paddingLeft: 44 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}15`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        )}

        {(activeTab === "PDF" || activeTab === "DOCX" || activeTab === "EML") && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={`.${activeTab.toLowerCase()}`}
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileChange(e.dataTransfer.files?.[0] ?? null);
              }}
              style={{
                border: `2px dashed ${dragOver ? C.accent : C.border}`,
                borderRadius: 16, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s',
                background: dragOver ? C.accentSoft : 'transparent'
              }}
              onMouseEnter={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = `${C.accentSoft}40`; } }}
              onMouseLeave={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent'; } }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 20, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                <Upload size={28} />
              </div>
              {file ? (
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>{file.name}</p>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, color: C.muted, margin: '0 0 6px' }}>
                    Drop your <strong style={{ color: C.ink }}>.{activeTab.toLowerCase()}</strong> file here
                  </p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.muted, margin: 0 }}>or click to browse</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Resume Input Area */}
      <div style={{ width: '100%', marginTop: 8 }}>
        <label style={mlbl}>Upload Resume (JSON)</label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder='Paste your resume in JSON format here... e.g. {"name": "Arun Kumar", "skills": ["Python"]}'
          style={{ ...inp, height: 140 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accent}15`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div style={{ background: '#fff0f0', border: `1px solid ${C.accent2}40`, borderRadius: 12, padding: '12px 16px', color: C.accent2, fontSize: 13.5, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        onMouseEnter={e => { if (!isGenerating) { e.currentTarget.style.background = C.accentHov; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${C.accent}45`; } }}
        onMouseLeave={e => { if (!isGenerating) { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 20px ${C.accent}35`; } }}
        style={{
          width: '100%', padding: 16, background: C.accent, color: '#fff', border: 'none', borderRadius: 14, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.2s cubic-bezier(.4,0,.2,1)', boxShadow: `0 4px 20px ${C.accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, letterSpacing: '0.2px', opacity: isGenerating ? 0.7 : 1
        }}
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing & Generating...
          </>
        ) : (
          <>
            <FileText size={18} />
            Generate Resume
          </>
        )}
      </button>
    </div>
  );
};

export default JDSection;