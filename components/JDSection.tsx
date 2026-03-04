"use client"

import { useState, useRef } from "react";
import { Upload, Link, FileText, Loader2 } from "lucide-react";

const tabs = ["Text", "EML", "PDF", "DOCX", "URL"] as const;
type TabType = (typeof tabs)[number];

interface JDSectionProps {
  onGenerate: (data: unknown) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
}

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
      const response = await fetch(`${backendUrl}/api/extract`, {
        method: "POST",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_SECRET_KEY ?? "",
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
    <div className="neu-card flex flex-col gap-5 h-full">
      <h2 className="text-lg font-semibold text-foreground">Upload Job Description</h2>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setFile(null);
              setError(null);
            }}
            className={`neu-tab ${activeTab === tab ? "active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Input Area */}
      <div className="flex-1 min-h-0">
        {activeTab === "Text" && (
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste your job description here..."
            className="w-full h-48 md:h-64 rounded-xl p-4 bg-card text-foreground text-sm resize-none transition-all duration-300"
            style={{ boxShadow: "var(--shadow-neumorphic-inset)", outline: "none" }}
          />
        )}

        {activeTab === "URL" && (
          <div className="flex items-center gap-3 rounded-xl p-4 bg-card neu-inset">
            <Link className="w-5 h-5 text-muted-foreground" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste job listing URL..."
              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
        )}

        {(activeTab === "PDF" || activeTab === "DOCX" || activeTab === "EML") && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={`.${activeTab.toLowerCase()}`}
              className="hidden"
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
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 hover:scale-[1.02] group ${dragOver ? "border-foreground/50 scale-[1.02]" : "border-border hover:border-foreground/30"
                }`}
            >
              <div className="neu-btn p-3 transition-all duration-300 group-hover:scale-110 bg-card">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              {file ? (
                <p className="text-sm font-medium text-foreground">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Drop your{" "}
                    <span className="font-semibold text-foreground">.{activeTab.toLowerCase()}</span>{" "}
                    file here
                  </p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Resume Input Area */}
      <div className="w-full mt-2">
        <h3 className="text-sm font-semibold text-foreground mb-3">Upload Resume (JSON)</h3>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder='Paste your resume in JSON format here... e.g. {"name": "Arun Kumar", "skills": ["Python"]}'
          className="w-full h-32 md:h-48 rounded-xl p-4 bg-card text-foreground text-sm resize-none transition-all duration-300"
          style={{ boxShadow: "var(--shadow-neumorphic-inset)", outline: "none" }}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ boxShadow: "var(--shadow-neumorphic)" }}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Generate Resume
          </>
        )}
      </button>
    </div>
  );
};

export default JDSection;