import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  GraduationCap,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import TopicConceptDiagram from './TopicConceptDiagram';

const ShortNotesCard = ({
  shortNote,
  onClose,
  onAskChatbot,
}) => {
  const [copied, setCopied] = useState(false);

  if (!shortNote) return null;

  const handleCopy = () => {
    const textToCopy = `
# ${shortNote.topicName} — O/L ICT Revision Short Notes
${shortNote.summary}

## Key Concepts:
${(shortNote.keyConcepts || []).map((k) => `• ${k}`).join('\n')}

## Real-World Analogy:
${shortNote.realWorldAnalogy}

## O/L Exam Tip:
${shortNote.examTip}

## Memory Hook:
${shortNote.memoryHook}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="short-note-card relative overflow-hidden rounded-[28px] p-6 sm:p-8 shadow-2xl transition-all"
    >
      {/* ── Top Header Bar ── */}
      <div className="flex items-start sm:items-center justify-between gap-4 border-b border-white/10 dark:border-white/10 pb-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="note-header-icon flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl shadow-md">
            <BookOpen size={26} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <span className="note-badge-pill rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
                High-Yield O/L Short Note
              </span>
              <span className="text-xs text-text-muted font-medium">
                Syllabus Quick Revision
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
              {shortNote.topicName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-text-muted hover:text-white dark:hover:text-white transition-all hover:bg-white/10 min-h-[40px] cursor-pointer"
            title="Copy Short Notes"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2.5 text-text-muted hover:text-white transition-all hover:bg-white/10 min-h-[40px] min-w-[40px] flex items-center justify-center border border-white/10 cursor-pointer"
              title="Close Short Notes"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* ── Content Body (Generous Responsive Spacing) ── */}
      <div className="mt-6 space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* 1. Quick Summary Box */}
        <div className="note-callout-summary rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Concept Overview</span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed font-medium">
            {shortNote.summary}
          </p>
        </div>

        {/* 2. Real-World Analogy */}
        {shortNote.realWorldAnalogy && (
          <div className="note-callout-analogy rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="note-callout-analogy-title flex items-center gap-2 text-sm sm:text-base font-bold text-sky-400 mb-2.5">
              <Lightbulb size={19} />
              <span>Real-World Analogy</span>
            </div>
            <p className="note-callout-analogy-text text-sm sm:text-base leading-relaxed italic">
              "{shortNote.realWorldAnalogy}"
            </p>
          </div>
        )}

        {/* 3. Visual Concept Architecture Diagram */}
        <TopicConceptDiagram
          topicId={shortNote.topicId}
          topicName={shortNote.topicName}
        />

        {/* 4. Key Syllabus Takeaways */}
        {shortNote.keyConcepts && shortNote.keyConcepts.length > 0 && (
          <div className="note-callout-takeaways rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="note-callout-takeaways-title flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-3">
              <ListChecks size={18} className="text-primary" />
              <span>Key Syllabus Takeaways</span>
            </div>
            <ul className="space-y-4">
              {shortNote.keyConcepts.map((concept, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3.5"
                >
                  <span className="mt-0.5 flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/40 text-[11px] font-extrabold shadow-sm">
                    {idx + 1}
                  </span>
                  <span className="note-callout-takeaways-item text-xs sm:text-sm leading-relaxed font-medium flex-1">
                    {concept}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. O/L Exam Tip & Memory Hook Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {shortNote.examTip && (
            <div className="note-callout-examtip rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="note-callout-examtip-title flex items-center gap-2 text-sm sm:text-base font-bold text-amber-400 mb-2.5">
                <GraduationCap size={20} />
                <span>O/L Exam Tip</span>
              </div>
              <p className="note-callout-examtip-text text-xs sm:text-sm leading-relaxed font-medium">
                {shortNote.examTip}
              </p>
            </div>
          )}

          {shortNote.memoryHook && (
            <div className="note-callout-memoryhook rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="note-callout-memoryhook-title flex items-center gap-2 text-sm sm:text-base font-bold text-purple-400 mb-2.5">
                <Zap size={20} />
                <span>Memory Hook / Mnemonic</span>
              </div>
              <p className="note-callout-memoryhook-text text-xs sm:text-sm leading-relaxed font-mono font-bold">
                {shortNote.memoryHook}
              </p>
            </div>
          )}
        </div>

        {/* 6. Common Exam Traps */}
        {shortNote.commonMistakes && shortNote.commonMistakes.length > 0 && (
          <div className="note-callout-traps rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="note-callout-traps-title flex items-center gap-2 text-sm sm:text-base font-bold text-rose-400 mb-3.5">
              <AlertCircle size={20} />
              <span>Common Exam Traps to Avoid</span>
            </div>
            <ul className="space-y-3">
              {shortNote.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="note-callout-traps-item flex items-start gap-3 text-xs sm:text-sm leading-relaxed font-medium">
                  <span className="shrink-0 text-rose-400 mt-0.5">⚠️</span>
                  <span className="flex-1">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Footer Action Bar ── */}
      {onAskChatbot && (
        <div className="mt-6 border-t border-white/10 dark:border-white/10 pt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted font-medium">
            <Sparkles size={16} className="text-primary" />
            <span>Ready to test your understanding on this topic?</span>
          </div>

          <button
            type="button"
            onClick={() => onAskChatbot(shortNote.topicId, shortNote.topicName)}
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-xs sm:text-sm font-black text-[#032418] transition-all hover:bg-primary-hover shadow-xl shadow-primary/25 min-h-[44px] active:scale-95 cursor-pointer"
          >
            <MessageSquare size={18} />
            <span>Ask AI to Quiz Me on this Topic</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ShortNotesCard;
