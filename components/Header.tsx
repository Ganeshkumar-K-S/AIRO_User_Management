"use client"

import { Sparkles, Clock, ArrowLeft } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full px-6 md:px-10 py-4 flex items-center justify-between bg-background">
      <div className="flex items-center gap-3">
        <div className="neu-btn p-2.5 cursor-pointer">
          <Sparkles className="w-5 h-5 text-foreground" />
        </div>
      </div>

      <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">
         AI Resume Optimizer
      </h1>

      <div className="flex items-center gap-3">
        <button className="neu-btn flex items-center gap-2 text-sm text-foreground bg-card">
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
        </button>
        <button className="neu-btn flex items-center gap-2 text-sm text-foreground bg-card">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Go Back</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
