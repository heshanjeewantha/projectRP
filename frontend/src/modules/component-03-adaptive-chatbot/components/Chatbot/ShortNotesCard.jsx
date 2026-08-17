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
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-black/80 p-5 shadow-2xl backdrop-blur-xl"
    >
      {/* Top action bar */}
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(95,191,151,0.3)]">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                High-Yield O/L Short Note
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {shortNote.topicName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:bg-white/10 hover:text-white"
            title="Copy Short Notes"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content body */}
      <div className="mt-4 space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {/* Quick Summary */}
        <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 text-xs leading-relaxed text-white/90">
          <p className="font-medium">{shortNote.summary}</p>
        </div>

        {/* Real-World Analogy */}
        {shortNote.realWorldAnalogy && (
          <div className="rounded-xl border border-sky-500/20 bg-sky-950/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1">
              <Lightbulb size={14} />
              Real-World Analogy
            </div>
            <p className="text-xs text-sky-100/90 italic leading-relaxed">
              "{shortNote.realWorldAnalogy}"
            </p>
          </div>
        )}

        {/* Key Points */}
        {shortNote.keyConcepts && shortNote.keyConcepts.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Key Syllabus Takeaways
            </h4>
            <ul className="space-y-2">
              {shortNote.keyConcepts.map((concept, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-white/85"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{concept}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* O/L Exam Tip & Common Traps */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shortNote.examTip && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                <GraduationCap size={14} />
                O/L Exam Tip
              </div>
              <p className="text-[11px] text-amber-100/85 leading-relaxed">
                {shortNote.examTip}
              </p>
            </div>
          )}

          {shortNote.memoryHook && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mb-1">
                <Zap size={14} />
                Memory Hook / Mnemonic
              </div>
              <p className="text-[11px] text-purple-100/85 font-mono leading-relaxed">
                {shortNote.memoryHook}
              </p>
            </div>
          )}
        </div>

        {/* Common Traps */}
        {shortNote.commonMistakes && shortNote.commonMistakes.length > 0 && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1.5">
              <AlertCircle size={14} />
              Common Exam Traps to Avoid
            </div>
            <ul className="space-y-1">
              {shortNote.commonMistakes.map((mistake, idx) => (
                <li key={idx} className="text-[11px] text-rose-200/80">
                  ⚠️ {mistake}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer action */}
      {onAskChatbot && (
        <div className="mt-4 border-t border-white/10 pt-3 flex justify-end">
          <button
            onClick={() => onAskChatbot(shortNote.topicId, shortNote.topicName)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-[#032418] transition-colors hover:bg-primary-hover shadow-md"
          >
            <MessageSquare size={14} />
            Ask AI to Quiz Me on this Topic
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ShortNotesCard;
