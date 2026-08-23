import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

const AttentionSuggestionBanner = ({
  recommendations = [],
  onSelectPrompt,
  onOpenShortNote,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-amber-500/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-black/50 to-black/70 p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.35)]">
            <Zap size={18} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Attention-Aware Revision Suggestions
              </h4>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                {recommendations.length} Weak Spots Detected
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Based on your live webcam attention drop & gaze telemetry from recent lessons.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-xl p-2 text-text-muted transition-colors hover:bg-white/10 hover:text-white shrink-0 min-h-[36px] flex items-center justify-center"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3 pt-2"
          >
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-4 transition-all hover:border-amber-500/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      {rec.conceptName}
                    </span>
                    <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/25 font-mono">
                      {rec.averageAttention}% Avg Attention
                    </span>
                    <span className="text-xs text-text-muted">
                      ({rec.distractionReason})
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Lesson: <span className="text-white/90 font-medium">{rec.lessonTitle}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0 mt-2 sm:mt-0">
                  <button
                    onClick={() => onOpenShortNote && onOpenShortNote(rec.conceptId)}
                    className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-[13px] font-semibold text-primary whitespace-nowrap transition-all hover:bg-primary/20 hover:border-primary/60 min-h-[42px] min-w-[130px] active:scale-[0.97]"
                  >
                    <FileText size={16} className="shrink-0" />
                    <span>Short Note</span>
                  </button>

                  <button
                    onClick={() => onSelectPrompt && onSelectPrompt(rec.suggestedPrompt, rec.conceptId)}
                    className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-bold text-[#032418] whitespace-nowrap transition-all hover:bg-primary-hover shadow-lg shadow-primary/25 min-h-[42px] min-w-[155px] active:scale-[0.97]"
                  >
                    <MessageSquare size={16} className="shrink-0" />
                    <span>Review in Chat</span>
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttentionSuggestionBanner;
