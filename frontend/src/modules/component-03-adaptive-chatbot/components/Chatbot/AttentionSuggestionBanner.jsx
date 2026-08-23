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
    <div className="mb-4 overflow-hidden rounded-2xl border border-amber-500/25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-black/40 to-black/60 p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <Zap size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Attention-Aware Revision Suggestions
              </h4>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                {recommendations.length} Weak Spots Detected
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Based on your live webcam attention drop & gaze telemetry from recent lessons.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/10 hover:text-white"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3.5 space-y-2.5 pt-2"
          >
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex flex-col gap-2.5 rounded-xl border border-white/5 bg-black/30 p-3 transition-all hover:border-amber-500/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white text-xs">
                      {rec.conceptName}
                    </span>
                    <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] text-amber-400 border border-amber-500/20 font-mono">
                      {rec.averageAttention}% Avg Attention
                    </span>
                    <span className="text-[10px] text-text-muted">
                      ({rec.distractionReason})
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Lesson: <span className="text-white/80">{rec.lessonTitle}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenShortNote && onOpenShortNote(rec.conceptId)}
                    className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <FileText size={12} />
                    Short Note
                  </button>

                  <button
                    onClick={() => onSelectPrompt && onSelectPrompt(rec.suggestedPrompt, rec.conceptId)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-[#032418] transition-colors hover:bg-primary-hover shadow-sm"
                  >
                    <MessageSquare size={12} />
                    Review in Chat
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
