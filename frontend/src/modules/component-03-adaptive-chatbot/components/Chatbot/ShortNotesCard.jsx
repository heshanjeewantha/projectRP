import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-black/85 p-5 sm:p-6 shadow-2xl backdrop-blur-xl"
    >
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(95,191,151,0.3)]">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/30">
                High-Yield O/L Short Note
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {shortNote.topicName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-text-muted transition-all hover:bg-white/10 hover:text-white min-h-[36px]"
            title="Copy Short Notes"
          >
            {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-text-muted transition-colors hover:bg-white/10 hover:text-white min-h-[36px] flex items-center justify-center"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Content body */}
      <div className="mt-5 space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {/* Quick Summary */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs sm:text-sm leading-relaxed text-white/90">
          <p className="font-medium">{shortNote.summary}</p>
        </div>

        {/* Real-World Analogy */}
        {shortNote.realWorldAnalogy && (
          <div className="rounded-xl border border-sky-500/25 bg-sky-950/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1.5">
              <Lightbulb size={16} />
              <span>Real-World Analogy</span>
            </div>
            <p className="text-xs sm:text-sm text-sky-100/90 italic leading-relaxed">
              "{shortNote.realWorldAnalogy}"
            </p>
          </div>
        )}

        {/* Key Points */}
        {shortNote.keyConcepts && shortNote.keyConcepts.length > 0 && (
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Key Syllabus Takeaways
            </h4>
            <ul className="space-y-2.5">
              {shortNote.keyConcepts.map((concept, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-white/85"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{concept}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* O/L Exam Tip & Common Traps */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-1">
          {shortNote.examTip && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-950/30 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1.5">
                <GraduationCap size={16} />
                <span>O/L Exam Tip</span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                {shortNote.examTip}
              </p>
            </div>
          )}

          {shortNote.memoryHook && (
            <div className="rounded-xl border border-purple-500/25 bg-purple-950/30 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-1.5">
                <Zap size={16} />
                <span>Memory Hook / Mnemonic</span>
              </div>
              <p className="text-xs text-purple-100/90 font-mono leading-relaxed">
                {shortNote.memoryHook}
              </p>
            </div>
          )}
        </div>

        {/* Common Traps */}
        {shortNote.commonMistakes && shortNote.commonMistakes.length > 0 && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-950/30 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-2">
              <AlertCircle size={16} />
              <span>Common Exam Traps to Avoid</span>
            </div>
            <ul className="space-y-1.5">
              {shortNote.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="text-xs text-rose-200/90 flex items-start gap-1.5">
                  <span className="shrink-0">⚠️</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer action */}
      {onAskChatbot && (
        <div className="mt-5 border-t border-white/10 pt-4 flex flex-wrap justify-end">
          <button
            onClick={() => onAskChatbot(shortNote.topicId, shortNote.topicName)}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-[#032418] transition-all hover:bg-primary-hover shadow-lg shadow-primary/20 min-h-[40px] active:scale-95"
          >
            <MessageSquare size={16} />
            <span>Ask AI to Quiz Me on this Topic</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ShortNotesCard;
