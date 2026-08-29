import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Play, AlertCircle, Clock, Sparkles, X, Volume2 } from 'lucide-react';

const formatClock = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const DistractionAlertModal = ({ isOpen, alertData, onRewind, onContinue }) => {
  const startTime = alertData?.startTime ?? 0;
  const duration = alertData?.duration ?? 10;
  const reason = alertData?.reason || 'Looking away from screen';
  const missedText =
    alertData?.missedText ||
    'Computer — An electronic device for processing, storing, and retrieving digital data.';

  const getReasonDisplay = (r) => {
    switch (r) {
      case 'head_turned':
      case 'head_down':
        return 'Head Turned Away';
      case 'eyes_closed':
      case 'drowsy':
        return 'Drowsiness / Eyes Closed';
      case 'no_face':
        return 'Student Left View';
      case 'phone_distraction':
        return 'Phone Usage Detected';
      default:
        return typeof r === 'string' && r.length > 0 ? r : 'Inattention Detected';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && alertData && (
        <motion.div
          key="distraction-alert-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl px-4 py-6 pointer-events-auto"
        >
          {/* Main Card */}
          <motion.div
            key="distraction-alert-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-amber-400/35 bg-gradient-to-b from-[#111a14]/95 via-[#0b120d]/98 to-[#050906] p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(245,158,11,0.18)] ring-1 ring-white/10 text-white"
          >
            {/* Ambient Lighting Orbs */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-44 w-44 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-1 w-32 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent blur-xs" />

            {/* Top Bar: Pill Badges & Close Button */}
            <div className="relative flex items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  Missed Content
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-300">
                  <Clock size={12} className="text-amber-400" /> {Math.round(duration)}s Inattention
                </span>
              </div>

              <button
                type="button"
                onClick={() => onContinue && onContinue()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                title="Dismiss & Continue"
              >
                <X size={15} />
              </button>
            </div>

            {/* Header Description */}
            <div className="relative flex items-center gap-3.5 my-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 text-amber-400 border border-amber-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">
                  {getReasonDisplay(reason)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Video paused automatically so you never miss a lesson concept.
                </p>
              </div>
            </div>

            {/* Missed Transcript Card */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:p-5 backdrop-blur-md shadow-inner">
              <div className="flex items-center justify-between gap-2 border-b border-amber-500/15 pb-2.5 mb-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles size={13} className="text-amber-400" />
                  What You Missed
                </div>
                <span className="rounded-md bg-black/40 border border-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
                  @ {formatClock(startTime)}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <p className="text-sm sm:text-base font-medium italic text-amber-100/95 leading-relaxed tracking-wide">
                  "{missedText}"
                </p>
              </div>
            </div>

            {/* Action Selection Prompt */}
            <p className="text-xs text-slate-400 text-center my-4 font-medium">
              Choose an action below to resume your learning session:
            </p>

            {/* Two High-Contrast Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {/* Action 1: Back to Attention Lost Time (Rewind) */}
              <button
                type="button"
                id="btn-rewind-distraction"
                onClick={() => onRewind && onRewind(startTime)}
                className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_10px_25px_rgba(245,158,11,0.35)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 shrink-0 stroke-[2.5]" />
                <span>Rewind to Missed Point ({formatClock(startTime)})</span>
              </button>

              {/* Action 2: Continue Playing */}
              <button
                type="button"
                id="btn-continue-distraction"
                onClick={() => onContinue && onContinue()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-6 py-3.5 text-sm font-bold text-slate-200 hover:bg-white/[0.16] hover:text-white hover:border-white/30 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current shrink-0" />
                <span>Continue</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DistractionAlertModal;
