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
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToModules}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
            All Modules
          </button>
          <div>
            <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
              Unit {activeModule?.moduleNumber}: {activeModule?.title}
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              Keyword: <span className="text-cyan-400 uppercase">{activeKeyword?.keyword}</span> —{' '}
              <span className="text-slate-300 font-medium text-base">{activeKeyword?.englishMeaning}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Mode Switcher */}
          <button
            onClick={() => setExamMode(!examMode)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
              examMode
                ? 'border border-purple-500/40 bg-purple-500/20 text-purple-300'
                : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {examMode ? <EyeOff size={15} /> : <Eye size={15} />}
            {examMode ? 'Exam Mode (No Avatar)' : 'Practice Mode (With Avatar)'}
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left = Avatar & Instructions, Right = Camera Evaluator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        {/* Left Column: Avatar Demonstration & Sign Breakdown */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Hand size={19} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Avatar Sign Demonstration</h4>
                  <p className="text-xs text-slate-400">Watch the precise finger movements and hand orientation.</p>
                </div>
              </div>

              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-mono text-slate-300 border border-white/10">
                {activeKeyword?.difficulty}
              </span>
            </div>

            {/* Avatar Animation Player Area */}
            {!examMode ? (
              <div className="mt-4 flex flex-col gap-3">
                <SignAvatarDemo
                  keyword={activeKeyword?.keyword}
                  playbackSpeed={playbackSpeed}
                />

                {/* Speed Controls */}
                <div className="flex items-center justify-between px-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">Speed:</span>
                    {[0.5, 1, 1.5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition-all ${
                          playbackSpeed === speed
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  <span className="font-mono text-xs text-slate-400">
                    Gloss: <strong className="text-cyan-400">{activeKeyword?.sourceGloss}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-purple-500/30 bg-purple-950/10 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 mb-3 shadow-lg">
                  <EyeOff size={24} />
                </div>
                <h4 className="text-sm font-bold text-white">Exam Recall Mode Active</h4>
                <p className="mt-1.5 text-xs text-slate-400 max-w-xs leading-relaxed">
                  Avatar is hidden. Perform the sign from memory in front of the camera. The smart wristband will vibrate if you make a mistake.
                </p>
              </div>
            )}

            {/* Keyword Details & Instructions Card */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-primary">Gesture Instructions</h5>
                <span className="text-xs font-semibold text-slate-300">{activeKeyword?.englishMeaning}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{activeKeyword?.gestureDescription}</p>

              {/* Handshape & Movement Tips */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-white/10 pt-3.5 text-xs">
                <div className="rounded-xl bg-black/40 p-3 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Handshape Tip:</span>
                  <p className="text-xs text-slate-300 mt-1">{activeKeyword?.handShapeTip}</p>
                </div>
                <div className="rounded-xl bg-black/40 p-3 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Movement Tip:</span>
                  <p className="text-xs text-slate-300 mt-1">{activeKeyword?.movementTip}</p>
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
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-lg backdrop-blur">
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft size={15} />
              Previous Sign
            </button>

            <span className="text-xs font-mono font-bold text-slate-300">
              Sign {currentIndex + 1} of {keywords.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex >= keywords.length - 1}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next Sign
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignPracticeArena;