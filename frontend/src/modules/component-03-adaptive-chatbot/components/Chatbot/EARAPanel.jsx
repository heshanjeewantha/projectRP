import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

/**
 * EARA — Explainability of Adaptive Response Architecture
 * Shows the viva panel HOW the final chatbot answer was constructed using:
 *  - Student attention status
 *  - Learning state (bored / not_understanding / distracted / understanding)
 *  - Conversation mode (learning / exam)
 *  - Topic + prerequisites
 *  - Knowledge growth trend
 *  - Past paper style influence
 *  - Adaptive features triggered (concept re-entry, difficulty escalation, summary)
 *  - Answer source (LLM / Local Dataset)
 */
const EARAPanel = ({ isOpen, onClose, messageData, attentionStatus, growthData }) => {
  if (!isOpen || !messageData) return null;

  const learningState = messageData.learningState || 'understanding';
  const mode = messageData.mode || messageData.selectedMode || 'learning';
  const topic = messageData.currentTopic || messageData.topic || '';
  const sourceType = messageData.sourceType || 'LLM';
  const hasPrereqs = messageData.prerequisiteTopics?.length > 0;
  const hasConceptReEntry = Boolean(messageData.conceptReEntry);
  const hasNextDifficulty = Boolean(messageData.nextDifficultyPrompt);
  const hasSummary = Boolean(messageData.summaryTopicId);
  const isExamMode = mode === 'exam' || Boolean(messageData.compressedAnswer);

  const attentionLabel = attentionStatus === 'not_attentive' ? 'Not Attentive' : 'Attentive';
  const attentionColor = attentionStatus === 'not_attentive' ? 'text-red-400' : 'text-emerald-400';

  const stateColorMap = {
    understanding: 'text-emerald-400',
    not_understanding: 'text-amber-400',
    bored: 'text-orange-400',
    distracted: 'text-red-400',
  };
  const stateColor = stateColorMap[learningState] || 'text-slate-400';

  const growthTrend =
    Array.isArray(growthData?.topics)
      ? growthData.topics.find((t) => t.topicId === topic)?.trend ?? null
      : null;

  const triggeredFeatures = [
    hasConceptReEntry && 'Concept Re-Entry',
    hasNextDifficulty && 'Difficulty Escalation',
    hasSummary && 'Summary Recommendation',
  ].filter(Boolean);

  const decisionSteps = [
    {
      icon: Activity,
      label: 'Attention Signal',
      value: attentionLabel,
      color: attentionColor,
      description:
        attentionStatus === 'not_attentive'
          ? 'Student was NOT attentive → chatbot applied distracted-state override and reduced explanation depth.'
          : 'Student was ATTENTIVE → chatbot used the current learning-state depth without override.',
    },
    {
      icon: BrainCircuit,
      label: 'Learning State',
      value: learningState.replace(/_/g, ' '),
      color: stateColor,
      description:
        learningState === 'bored'
          ? 'BORED state → chatbot appended a visual concept diagram to the answer to re-engage the student.'
          : learningState === 'not_understanding'
          ? 'NOT UNDERSTANDING → chatbot appended a concept diagram and used simplified explanation depth.'
          : learningState === 'distracted'
          ? 'DISTRACTED → answer kept short and bullet-pointed to help student re-focus quickly.'
          : 'UNDERSTANDING → full standard-depth explanation generated without modifications.',
    },
    {
      icon: isExamMode ? GraduationCap : BookOpen,
      label: 'Conversation Mode',
      value: isExamMode ? 'Exam Mode' : 'Learning Mode',
      color: isExamMode ? 'text-cyan-400' : 'text-primary',
      description: isExamMode
        ? 'EXAM MODE: answer compressed into official marking-scheme bullet points with marks-per-point structure.'
        : 'LEARNING MODE: full conceptual answer with prerequisite reminders, difficulty escalation, and summary suggestions.',
    },
    {
      icon: Lightbulb,
      label: 'Topic Prerequisites',
      value: hasPrereqs ? messageData.prerequisiteTopics.join(', ') : 'None required',
      color: hasPrereqs ? 'text-violet-400' : 'text-slate-400',
      description: hasPrereqs
        ? `Prerequisites [${messageData.prerequisiteTopics.join(', ')}] were injected into the prompt context to enable concept-dependency reminders.`
        : 'No prerequisite context was attached for this topic — answer is self-contained.',
    },
    {
      icon: TrendingUp,
      label: 'Knowledge Growth Trend',
      value:
        growthTrend !== null
          ? `${growthTrend > 0 ? '+' : ''}${growthTrend}% this week`
          : 'No growth data',
      color:
        growthTrend > 0 ? 'text-emerald-400' : growthTrend < 0 ? 'text-red-400' : 'text-slate-400',
      description:
        growthTrend !== null
          ? `Knowledge growth trend for this topic is ${growthTrend}%. This influenced whether difficulty escalation was offered in the answer.`
          : 'No growth trend data available for this topic — default difficulty level applied.',
    },
    {
      icon: ClipboardCheck,
      label: 'Past Paper Style Applied',
      value: isExamMode ? 'Yes' : 'No',
      color: isExamMode ? 'text-amber-400' : 'text-slate-400',
      description: isExamMode
        ? 'Past paper marking style APPLIED: concise bullet points, technical O/L vocabulary, marks-per-point structure matching examiner rubric.'
        : 'Past paper style NOT applied in learning mode. Full conceptual explanation used to maximize understanding.',
    },
    {
      icon: Zap,
      label: 'Adaptive Features Triggered',
      value: triggeredFeatures.length > 0 ? triggeredFeatures.join(', ') : 'None',
      color: triggeredFeatures.length > 0 ? 'text-primary' : 'text-slate-400',
      description:
        triggeredFeatures.length > 0
          ? [
              hasConceptReEntry && '• Concept Re-Entry: prerequisite refresh shown before main answer.',
              hasNextDifficulty && '• Difficulty Escalation: harder next-level question suggested.',
              hasSummary && '• Summary Recommendation: lesson summary link appended.',
            ]
              .filter(Boolean)
              .join(' ')
          : 'No adaptive features were triggered for this exchange.',
    },
    {
      icon: CheckCircle2,
      label: 'Answer Source',
      value: sourceType === 'LOCAL_DATASET' ? 'Local ICT Dataset' : 'AI Language Model (LLM)',
      color: sourceType === 'LOCAL_DATASET' ? 'text-teal-400' : 'text-indigo-400',
      description:
        sourceType === 'LOCAL_DATASET'
          ? 'Answer retrieved from the curated O/L ICT lesson dataset — deterministic and curriculum-aligned.'
          : 'Answer generated by the AI language model using an adaptive prompt built from all signals above.',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative flex flex-col w-full max-w-2xl max-h-[88vh] rounded-3xl border border-primary/30 bg-[#050e08] shadow-2xl shadow-primary/10 overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-primary/[0.04]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  EARA
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                    Explainability Panel
                  </span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  How this adaptive chatbot answer was constructed
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-text-muted hover:bg-white/5 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Question Echo ── */}
          {messageData.question && (
            <div className="px-6 pt-4 pb-0">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                  Student Question
                </div>
                <p className="text-sm text-white/90 leading-relaxed line-clamp-2">
                  {messageData.question}
                </p>
              </div>
            </div>
          )}

          {/* ── Decision Steps ── */}
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-3">
            {decisionSteps.map((step, idx) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-3.5 flex gap-3 items-start"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/8 mt-0.5">
                  <step.icon size={14} className={step.color} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      {step.label}
                    </span>
                    <span className={`text-xs font-semibold ${step.color}`}>
                      {step.value}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-white/8 px-6 py-3 bg-white/[0.01]">
            <p className="text-[10px] text-text-muted text-center">
              EARA · Explainability of Adaptive Response Architecture · Component 03 — Adaptive Chatbot
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EARAPanel;
