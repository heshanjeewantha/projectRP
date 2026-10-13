import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Play, AlertCircle, Clock, Sparkles, X, BookOpen, Lightbulb, HelpCircle, Frown } from 'lucide-react';

const formatClock = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const DistractionAlertModal = ({ isOpen, alertData, onRewind, onContinue }) => {
  const startTime = alertData?.startTime ?? 0;
  const duration = alertData?.duration ?? 10;
  const reason = alertData?.reason || 'Looking away from screen';
  const emotion = alertData?.emotion || 'not_attentive';
  const syllabus = alertData?.syllabusContext || null;
  const missedText = alertData?.missedText || 'Computer — An electronic device for processing, storing, and retrieving digital data.';
  const summaryHint = syllabus?.summary_hint || alertData?.summaryHint;
  const keyTerms = syllabus?.key_terms || [];

  const getReasonMeta = () => {
    if (emotion === 'confused' || reason === 'confused') {
      return {
        title: 'Perplexity / Confusion Detected',
        badge: 'Concept Checkpoint',
        icon: HelpCircle,
        color: 'from-amber-500 to-yellow-600',
        border: 'border-yellow-400/40',
        text: 'You seem puzzled by this syllabus topic. Here is a quick breakdown.',
      };
    }
    if (emotion === 'frustrated' || reason === 'frustrated') {
      return {
        title: 'Struggling with Concept',
        badge: 'Syllabus Scaffolding',
        icon: Frown,
        color: 'from-rose-500 to-amber-600',
        border: 'border-rose-400/40',
        text: 'This O/L ICT topic can be challenging. Take a moment to review foundational points.',
      };
    }
    if (reason === 'drowsy' || emotion === 'drowsy') {
      return {
        title: 'Drowsiness Detected',
        badge: 'Attention Drop',
        icon: AlertCircle,
        color: 'from-purple-500 to-amber-600',
        border: 'border-purple-400/40',
        text: 'Prolonged eye closure detected during this lecture segment.',
      };
    }
    if (reason === 'head_turned') {
      return {
        title: 'Head Turned Away',
        badge: 'Visual Inattention',
        icon: AlertCircle,
        color: 'from-amber-500 to-orange-600',
        border: 'border-amber-400/40',
        text: 'Your gaze moved off-screen away from the instructional content.',
      };
    }
    return {
      title: 'Inattention Detected',
      badge: 'Missed Segment',
      icon: AlertCircle,
      color: 'from-amber-500 to-orange-500',
      border: 'border-amber-400/35',
      text: 'Video auto-paused so you stay grounded in the curriculum.',
    };
  };

  const meta = getReasonMeta();
  const IconComponent = meta.icon;

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
            className={`relative w-full max-w-xl overflow-hidden rounded-[28px] border ${meta.border} bg-gradient-to-b from-[#111a14]/95 via-[#0b120d]/98 to-[#050906] p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(245,158,11,0.18)] ring-1 ring-white/10 text-white`}
          >
            {/* Ambient Lighting Orbs */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-44 w-44 rounded-full bg-orange-500/15 blur-3xl" />

            {/* Top Bar: Badges & Dismiss */}
            <div className="relative flex items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  {meta.badge}
                </span>
                {syllabus && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    <BookOpen size={11} /> {syllabus.grade} • Unit {syllabus.unit_number}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1 text-xs font-medium text-slate-300">
                  <Clock size={12} className="text-amber-400" /> {Math.round(duration)}s Interval
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
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.color} text-white shadow-lg`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">
                  {meta.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {syllabus?.subtopic_title ? `Current Syllabus Topic: ${syllabus.subtopic_title}` : meta.text}
                </p>
              </div>
            </div>

            {/* Syllabus Topic Insight Card */}
            {summaryHint ? (
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4 mb-3 backdrop-blur-md">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                  <Lightbulb size={13} className="text-emerald-400" />
                  Curriculum Concept Recap
                </div>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                  {summaryHint}
                </p>
                {keyTerms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-emerald-500/20">
                    {keyTerms.map((term, idx) => (
                      <span key={idx} className="rounded-md bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                        #{term}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Missed Transcript Card */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:p-4.5 backdrop-blur-md shadow-inner">
              <div className="flex items-center justify-between gap-2 border-b border-amber-500/15 pb-2 mb-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles size={13} className="text-amber-400" />
                  What You Missed
                </div>
                <span className="rounded-md bg-black/40 border border-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
                  @ {formatClock(startTime)}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium italic text-amber-100/95 leading-relaxed">
                "{missedText}"
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                id="btn-rewind-distraction"
                onClick={() => onRewind && onRewind(startTime)}
                className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_10px_25px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 shrink-0 stroke-[2.5]" />
                <span>Rewind to Start of Topic ({formatClock(startTime)})</span>
              </button>

              <button
                type="button"
                id="btn-continue-distraction"
                onClick={() => onContinue && onContinue()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-6 py-3 text-sm font-bold text-slate-200 hover:bg-white/[0.16] hover:text-white active:scale-[0.98] transition-all cursor-pointer"
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
