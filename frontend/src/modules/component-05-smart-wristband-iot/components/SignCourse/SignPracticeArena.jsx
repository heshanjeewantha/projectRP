import { useState, useEffect } from 'react';
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
  Info,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import CameraSignEvaluator from './CameraSignEvaluator';
import SignAvatarDemo from './SignAvatarDemo';

const TUTORIAL_STEPS = [
  {
    icon: '📦',
    title: 'Two Hand Zones',
    body: 'The camera shows two dashed boxes. Place each hand in its designated zone.',
  },
  {
    icon: '🖐️',
    title: 'Match the Shape',
    body: 'Form the finger shape shown in the Avatar demo. The box turns green when your hand matches.',
  },
  {
    icon: '⏱️',
    title: 'Hold for 1.2 seconds',
    body: 'Keep both hands in matching shapes for 1.2 seconds to confirm the sign and advance.',
  },
  {
    icon: '⌚',
    title: 'Wristband Feedback',
    body: 'The smart wristband vibrates on mistakes (error buzz) and on correct signs (success pulse).',
  },
];

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
  const [streak, setStreak] = useState(0);
  const [showTutorial, setShowTutorial] = useState(() => {
    try { return !localStorage.getItem('c05_tutorial_seen'); } catch { return true; }
  });
  const [tutorialStep, setTutorialStep] = useState(0);

  const keywords = activeModule?.keywords || [];
  const currentIndex = keywords.findIndex((k) => k.keyword === activeKeyword?.keyword);
  const isPassed = progress?.completedKeywords?.includes(activeKeyword?.keyword);

  const closeTutorial = () => {
    setShowTutorial(false);
    try { localStorage.setItem('c05_tutorial_seen', '1'); } catch {}
  };

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

  const handlePassKeyword = (keyword, accuracy) => {
    setStreak((s) => s + 1);
    onPassKeyword(keyword, accuracy);
  };

  const handleErrorTrigger = (args) => {
    setStreak(0);
    onErrorTrigger(args);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* First-Visit Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
            >
              <button
                onClick={closeTutorial}
                className="absolute right-4 top-4 rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                  <Info size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">How to Use the Camera Arena</h3>
                  <p className="text-xs text-slate-400">Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={tutorialStep}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center"
                >
                  <div className="text-4xl mb-3">{TUTORIAL_STEPS[tutorialStep].icon}</div>
                  <h4 className="text-sm font-bold text-white mb-2">{TUTORIAL_STEPS[tutorialStep].title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{TUTORIAL_STEPS[tutorialStep].body}</p>
                </motion.div>
              </AnimatePresence>

              {/* Step dots */}
              <div className="mt-4 flex justify-center gap-1.5">
                {TUTORIAL_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTutorialStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === tutorialStep ? 'w-5 bg-primary' : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                {tutorialStep > 0 && (
                  <button
                    onClick={() => setTutorialStep((s) => s - 1)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                )}
                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <button
                    onClick={() => setTutorialStep((s) => s + 1)}
                    className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={closeTutorial}
                    className="flex-1 rounded-2xl bg-emerald-500 py-2.5 text-sm font-black text-white hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/30"
                  >
                    Let's Practice! 🚀
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          {/* Streak badge */}
          <AnimatePresence>
            {streak > 1 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 px-3 py-2 text-sm font-black text-orange-400"
              >
                <Flame size={16} />
                {streak} 🔥
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tutorial button */}
          <button
            onClick={() => { setShowTutorial(true); setTutorialStep(0); }}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors"
            title="Show tutorial"
          >
            <Info size={15} />
          </button>

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

      {/* Module keyword strip with active highlight */}
      {keywords.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-1">Signs:</span>
          {keywords.map((kw, idx) => {
            const isActive = kw.keyword === activeKeyword?.keyword;
            const isPast = progress?.completedKeywords?.includes(kw.keyword);
            return (
              <button
                key={kw.id || kw.keyword}
                onClick={() => onSelectKeyword(kw)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all border ${
                  isActive
                    ? 'border-primary/60 bg-primary/20 text-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb,99,102,241),0.3)]'
                    : isPast
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isPast && !isActive && <CheckCircle2 size={11} className="text-emerald-400" />}
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                <span className="uppercase">{kw.keyword}</span>
              </button>
            );
          })}
        </div>
      )}

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

              {activeKeyword?.difficulty && (
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                  (() => {
                    const d = (activeKeyword.difficulty || '').toLowerCase();
                    if (d === 'easy') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    if (d === 'medium') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    if (d === 'hard') return 'bg-red-500/20 text-red-300 border-red-500/40';
                    return 'bg-white/5 text-slate-300 border-white/10';
                  })()
                }`}>
                  {activeKeyword.difficulty}
                </span>
              )}
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
            onPassKeyword={handlePassKeyword}
            onErrorTrigger={handleErrorTrigger}
            examMode={examMode}
            streak={streak}
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