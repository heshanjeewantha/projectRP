import { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  Lightbulb,
  Send,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPastPaperQuestions, evaluatePastPaperAnswer } from '../../services/chatbotApi';

const PastPaperGraderModal = ({ isOpen, onClose, topicId = 'computer_system', studentId = 'student_demo_123' }) => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadQuestions(topicId);
    }
  }, [isOpen, topicId]);

  const loadQuestions = async (activeTopic) => {
    setIsLoading(true);
    try {
      const list = await getPastPaperQuestions(activeTopic);
      setQuestions(list || []);
      if (list && list.length > 0) {
        const matched = list.find((q) => q.topicId === activeTopic) || list[0];
        setSelectedQuestionId(matched.id);
        setEvaluationResult(null);
        setStudentAnswer('');
      }
    } catch (error) {
      console.error('Failed to load past paper questions', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions.find((q) => q.id === selectedQuestionId) || questions[0];

  const handleEvaluate = async () => {
    if (!studentAnswer.trim() || !selectedQuestionId) return;
    setIsEvaluating(true);
    try {
      const res = await evaluatePastPaperAnswer({
        studentId,
        questionId: selectedQuestionId,
        studentAnswer,
      });
      setEvaluationResult(res);
    } catch (error) {
      console.error('Evaluation failed', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-3xl border border-white/10 bg-[#070d09] shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <FileCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  O/L Past Paper Auto-Grader
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                    Official Rubric
                  </span>
                </h3>
                <p className="text-xs text-text-muted">
                  Type your structured answer. The AI evaluates your keywords against the official marking criteria.
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

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            {/* Question Selector Tabs */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-2">
                Select Past Paper Question:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestionId(q.id);
                      setEvaluationResult(null);
                    }}
                    className={`text-left p-3 rounded-2xl border transition-all ${
                      selectedQuestionId === q.id
                        ? 'border-primary/40 bg-primary/10 text-white shadow-sm'
                        : 'border-white/5 bg-white/[0.02] text-text-muted hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-primary font-bold uppercase">{q.year}</div>
                    <div className="text-xs font-semibold truncate mt-0.5">{q.topicName}</div>
                    <div className="text-[10px] text-text-muted mt-1">{q.maxMarks} Marks</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Question Box */}
            {currentQuestion && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between text-xs font-mono text-primary mb-1">
                  <span>{currentQuestion.year} — {currentQuestion.topicName}</span>
                  <span className="font-bold text-amber-400">Max Marks: {currentQuestion.maxMarks}</span>
                </div>
                <p className="text-sm font-medium text-white/95 leading-relaxed">
                  {currentQuestion.questionText}
                </p>
              </div>
            )}

            {/* Answer Input Area */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between mb-2">
                <span>Your Answer:</span>
                <span className="text-[10px] text-primary">Be clear & mention key technical terms</span>
              </label>
              <textarea
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Type your structured answer here (e.g. 1. Control Unit fetches instructions... 2. ALU performs arithmetic...)"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white focus:border-primary/40 focus:outline-none transition-colors custom-scrollbar"
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating || !studentAnswer.trim()}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-[#032418] shadow-lg shadow-primary/20 hover:brightness-105 transition-all disabled:opacity-50 min-h-[40px] active:scale-95"
                >
                  {isEvaluating ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      <span>Evaluating with Marking Scheme...</span>
                    </>
                  ) : (
                    <>
                      <Award size={16} />
                      <span>Grade My Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Evaluation Result Display */}
            {evaluationResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/[0.08] to-transparent p-5 space-y-4 shadow-xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Marks Awarded:</span>
                    <span className="text-xl font-black text-primary">
                      {evaluationResult.awardedMarks} / {evaluationResult.maxMarks}
                    </span>
                    <span className="text-xs text-text-muted">({evaluationResult.percentage}%)</span>
                  </div>
                  <span className="rounded-full bg-primary/20 border border-primary/30 px-3 py-1 text-xs font-bold text-primary">
                    {evaluationResult.gradeBadge}
                  </span>
                </div>

                <p className="text-xs font-medium text-white/90">
                  {evaluationResult.feedback}
                </p>

                {/* Rubric Points Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 p-3">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-2">
                      <CheckCircle2 size={14} />
                      Matched Marking Points
                    </div>
                    {evaluationResult.matchedKeyPoints.length === 0 ? (
                      <div className="text-[11px] text-text-muted">No core marking keywords detected.</div>
                    ) : (
                      <ul className="space-y-1.5 text-[11px] text-slate-300">
                        {evaluationResult.matchedKeyPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 shrink-0">✓</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-2xl bg-amber-500/[0.06] border border-amber-500/20 p-3">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-2">
                      <XCircle size={14} />
                      Missing Examiner Criteria
                    </div>
                    {evaluationResult.missingKeyPoints.length === 0 ? (
                      <div className="text-[11px] text-emerald-400 font-semibold">Full rubric coverage achieved!</div>
                    ) : (
                      <ul className="space-y-1.5 text-[11px] text-slate-300">
                        {evaluationResult.missingKeyPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400 shrink-0">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Official Model Answer */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                    <Lightbulb size={13} />
                    Official Model Answer
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">
                    {evaluationResult.modelAnswer}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PastPaperGraderModal;
