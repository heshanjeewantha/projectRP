import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Hand,
  Play,
  RotateCcw,
  Sparkles,
  Watch,
} from 'lucide-react';
import { motion } from 'framer-motion';

import CameraSignEvaluator from './CameraSignEvaluator';
import SignAvatarDemo from './SignAvatarDemo';

const SignPracticeArena = ({
  activeModule,
  activeKeyword,
  progress,
  onSelectKeyword,
  onPassKeyword,
  onErrorTrigger,
  onBackToModules,
}) => {
  const [examMode, setExamMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const keywords = activeModule?.keywords || [];
  const currentIndex = keywords.findIndex((k) => k.keyword === activeKeyword?.keyword);
  const isPassed = progress?.completedKeywords?.includes(activeKeyword?.keyword);

  const handleNext = () => {
    if (currentIndex < keywords.length - 1) {
      onSelectKeyword(keywords[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectKeyword(keywords[currentIndex - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              onClick={onBackToModules}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">All Modules</span>
            </button>
            <div className="min-w-0">
              <span className="block text-[10px] font-mono font-semibold text-primary uppercase tracking-wider truncate">
                Unit {activeModule?.moduleNumber}: {activeModule?.title}
              </span>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5 leading-tight overflow-wrap-anywhere">
                <span className="text-cyan-400 uppercase">{activeKeyword?.keyword}</span>
                {activeKeyword?.englishMeaning && (
                  <span className="text-slate-400 font-medium text-xs sm:text-sm ml-1.5">— {activeKeyword.englishMeaning}</span>
                )}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setExamMode(!examMode)}
            className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              examMode
                ? 'border border-purple-500/40 bg-purple-500/20 text-purple-300'
                : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {examMode ? <EyeOff size={13} /> : <Eye size={13} />}
            <span className="hidden sm:inline">{examMode ? 'Exam Mode' : 'Practice Mode'}</span>
            <span className="sm:hidden">{examMode ? 'Exam' : 'Practice'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left = Avatar & Instructions, Right = Camera Evaluator */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 items-start">
        {/* Left Column: Avatar Demonstration & Sign Breakdown */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-4 sm:p-5 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Hand size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white">Avatar Sign Demonstration</h4>
                  <p className="text-xs text-slate-400 hidden sm:block">Watch precise finger movements and orientation.</p>
                </div>
              </div>

              <span className="shrink-0 rounded-lg bg-white/5 px-2 py-1 text-xs font-mono text-slate-300 border border-white/10">
                {activeKeyword?.difficulty}
              </span>
            </div>

            {/* Avatar Animation Player Area */}
            {!examMode ? (
              <div className="mt-4 flex flex-col gap-3">
                <SignAvatarDemo
                  keyword={activeKeyword?.keyword}
                  playbackSpeed={playbackSpeed}
                  onSpeedChange={setPlaybackSpeed}
                />
              </div>
            ) : (
              <div className="mt-4 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-purple-500/30 bg-purple-950/10 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 mb-3 shadow-lg">
                  <EyeOff size={24} />
                </div>
                <h4 className="text-sm font-bold text-white">Exam Recall Mode Active</h4>
                <p className="mt-1.5 text-xs text-slate-400 max-w-xs leading-relaxed">
                  Avatar demonstration is hidden. Perform the sign from memory in front of the camera. The smart wristband will deliver real-time haptic corrections if hand position deviates.
                </p>
              </div>
            )}

            {/* Keyword Details & Instructions Card */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/20 text-primary text-xs font-black">
                    1
                  </span>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Gesture Instructions
                  </h5>
                </div>
                <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                  {activeKeyword?.englishMeaning}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed break-words">
                {activeKeyword?.gestureDescription}
              </p>

              {/* Handshape & Movement Tips */}
              <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-white/10 pt-3.5">
                <div className="rounded-xl bg-black/40 p-3 border border-amber-500/20 shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                    <Sparkles size={11} />
                    Handshape Tip:
                  </span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">
                    {activeKeyword?.handShapeTip}
                  </p>
                </div>
                <div className="rounded-xl bg-black/40 p-3 border border-cyan-500/20 shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
                    <Sparkles size={11} />
                    Movement Tip:
                  </span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">
                    {activeKeyword?.movementTip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Camera Evaluator */}
        <div className="flex flex-col gap-4">
          <CameraSignEvaluator
            keyword={activeKeyword?.keyword}
            keywordMeta={activeKeyword}
            onPassKeyword={onPassKeyword}
            onErrorTrigger={onErrorTrigger}
            examMode={examMode}
          />

          {/* Keyword Module Navigation Strip */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/90 p-3 shadow-lg backdrop-blur">
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <span className="text-xs font-mono font-bold text-slate-300 shrink-0">
              {currentIndex + 1} / {keywords.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex >= keywords.length - 1}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignPracticeArena;