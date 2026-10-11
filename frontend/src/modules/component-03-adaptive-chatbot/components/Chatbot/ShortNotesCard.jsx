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
      <div className="flex items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="note-header-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-emerald-500/10">
            <BookOpen size={28} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="note-badge-pill rounded-full px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider">
                High-Yield O/L Short Note
              </span>
              <span className="text-xs text-text-muted font-medium">
                Syllabus Quick Revision
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-text-main">
              {shortNote.topicName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-black/5 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-text-muted hover:text-primary transition-all hover:bg-black/10 dark:hover:bg-white/10 min-h-[42px] cursor-pointer"
            title="Copy Short Notes"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2.5 text-text-muted hover:text-primary transition-all hover:bg-black/10 dark:hover:bg-white/10 min-h-[42px] min-w-[42px] flex items-center justify-center border border-border cursor-pointer"
              title="Close Short Notes"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* ── Content Body (Spacious Layout & Generous Line Spacing) ── */}
      <div className="mt-8 space-y-8 max-h-[65vh] overflow-y-auto pr-3 pb-10 custom-scrollbar">
        {/* 1. Quick Summary Box */}
        <div className="note-callout-summary rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
            <Sparkles size={16} />
            <span>Concept Overview</span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed sm:leading-loose font-medium text-text-main">
            {shortNote.summary}
          </p>
        </div>

        {/* 2. Real-World Analogy */}
        {shortNote.realWorldAnalogy && (
          <div className="note-callout-analogy rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="note-callout-analogy-title flex items-center gap-2 text-sm sm:text-base font-bold text-sky-500 dark:text-sky-400 mb-3">
              <Lightbulb size={20} />
              <span>Real-World Analogy</span>
            </div>
            <p className="note-callout-analogy-text text-sm sm:text-base leading-relaxed sm:leading-loose italic font-medium">
              "{shortNote.realWorldAnalogy}"
            </p>
          </div>
        )}

        {/* 3. Highlighted Visual Concept Architecture Diagram */}
        <TopicConceptDiagram
          topicId={shortNote.topicId}
          topicName={shortNote.topicName}
        />

        {/* 4. Key Syllabus Takeaways */}
        {shortNote.keyConcepts && shortNote.keyConcepts.length > 0 && (
          <div className="note-callout-takeaways rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="note-callout-takeaways-title flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider mb-5 border-b border-border pb-3.5">
              <ListChecks size={19} />
              <span>Key Syllabus Takeaways</span>
            </div>
            <div className="space-y-3.5">
              {shortNote.keyConcepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-3.5 rounded-xl border border-border bg-black/[0.02] dark:bg-white/[0.02] transition hover:border-primary/40"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-slate-950 text-[11px] font-black shadow-md shadow-primary/20">
                    {idx + 1}
                  </span>
                  <span className="note-callout-takeaways-item text-xs sm:text-sm leading-relaxed sm:leading-loose font-medium flex-1">
                    {concept}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. O/L Exam Tip & Memory Hook Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {shortNote.examTip && (
            <div className="note-callout-examtip rounded-2xl p-6 shadow-sm space-y-3 min-h-[140px] flex flex-col justify-between">
              <div className="note-callout-examtip-title flex items-center gap-2 text-sm sm:text-base font-bold text-amber-500 dark:text-amber-400">
                <GraduationCap size={22} />
                <span>O/L Exam Tip</span>
              </div>
              <p className="note-callout-examtip-text text-xs sm:text-sm leading-relaxed sm:leading-loose font-medium flex-1">
                {shortNote.examTip}
              </p>
            </div>
          )}

          {shortNote.memoryHook && (
            <div className="note-callout-memoryhook rounded-2xl p-6 shadow-sm space-y-3 min-h-[140px] flex flex-col justify-between">
              <div className="note-callout-memoryhook-title flex items-center gap-2 text-sm sm:text-base font-bold text-purple-600 dark:text-purple-400">
                <Zap size={22} />
                <span>Memory Hook / Mnemonic</span>
              </div>
              <p className="note-callout-memoryhook-text text-xs sm:text-sm leading-relaxed sm:leading-loose font-mono font-bold flex-1">
                {shortNote.memoryHook}
              </p>
            </div>
          )}
        </div>

        {/* 6. Common Exam Traps */}
        {shortNote.commonMistakes && shortNote.commonMistakes.length > 0 && (
          <div className="note-callout-traps rounded-2xl p-6 shadow-sm space-y-3.5">
            <div className="note-callout-traps-title flex items-center gap-2 text-sm sm:text-base font-bold text-rose-500 dark:text-rose-400 mb-2">
              <AlertCircle size={22} />
              <span>Common Exam Traps to Avoid</span>
            </div>
            <ul className="space-y-3">
              {shortNote.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="note-callout-traps-item flex items-start gap-3.5 text-xs sm:text-sm leading-relaxed sm:leading-loose font-medium">
                  <span className="shrink-0 text-rose-500 mt-1">⚠️</span>
                  <span className="flex-1">{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Footer Action Bar ── */}
      {onAskChatbot && (
        <div className="mt-8 border-t border-border pt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-text-muted font-medium">
            <Sparkles size={16} className="text-primary" />
            <span>Ready to test your understanding on this topic?</span>
          </div>

          <button
            type="button"
            onClick={() => onAskChatbot(shortNote.topicId, shortNote.topicName)}
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-primary px-7 py-3.5 text-xs sm:text-sm font-black text-slate-950 transition-all hover:bg-primary-hover shadow-xl shadow-primary/25 min-h-[46px] active:scale-95 cursor-pointer"
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
