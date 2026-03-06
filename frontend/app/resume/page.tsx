"use client"

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JDSection from "@/components/JDSection";
import GeneratedResume from "@/components/GeneratedResume";
import AtsScoreCard from "@/components/AtsScoreCard";
import Heatmap from "@/components/Heatmap";
import SkillGap from "@/components/SkillGap";
import HistoryPage from "@/components/HistoryPage";
import { FileText } from "lucide-react";

const Index = () => {
  const [isGenerating, setIsGenerating]   = useState(false);
  const [showResults, setShowResults]     = useState(false);
  const [resumeData, setResumeData]       = useState<any>(null);
  const [gapData, setGapData]             = useState<any>(null);
  const [pdfPath, setPdfPath]             = useState<string | null>(null);
  const [atsScores, setAtsScores]         = useState({ with_jd: 0, without_jd: 0 });
  const [showHistory, setShowHistory]     = useState(false);

  const handleGenerate = (data?: any) => {
    if (data && data.status === "success") {
      setResumeData(data.tailored_resume);
      setGapData(data.gap_analysis);
      setPdfPath(data.pdf_path);
      setAtsScores(data.ats_score);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  // ── Show History page ───────────────────────────────────────────────────
  if (showHistory) {
    return <HistoryPage onGoBack={() => setShowHistory(false)} />;
  }

  // ── Main page ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onHistoryClick={() => setShowHistory(true)}
        onGoBack={() => {
          setShowResults(false);
          setResumeData(null);
          setPdfPath(null);
          setGapData(null);
          setAtsScores({ with_jd: 0, without_jd: 0 });
        }}
      />

      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 md:px-10 py-8 w-full">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">

          <JDSection
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />

          <div className="w-full space-y-6">
            {!showResults && !isGenerating && (
              <div className="neu-card flex flex-col items-center justify-center h-80 gap-4 animate-pulse-gentle text-center">
                <div className="neu-btn p-4 bg-card">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Paste a job description and click Generate to see your optimized resume
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="neu-card flex flex-col items-center justify-center h-80 gap-4 text-center">
                <div className="w-10 h-10 border-3 border-muted border-t-foreground rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm animate-pulse-gentle">
                  Analyzing JD and crafting your resume...
                </p>
              </div>
            )}

            {showResults && resumeData && (
              <>
                <GeneratedResume
                  resumeData={resumeData}
                  pdfPath={pdfPath}
                  onRegenerate={() => {
                    setShowResults(false);
                    setResumeData(null);
                    setPdfPath(null);
                  }}
                />

                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3 text-center">
                    ATS Analysis
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <AtsScoreCard label="With JD"    score={atsScores.with_jd}    delay={200} />
                    <AtsScoreCard label="Without JD" score={atsScores.without_jd} delay={500} />
                  </div>
                </div>

                <Heatmap  gapData={gapData} />
                <SkillGap gapData={gapData} />
              </>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;