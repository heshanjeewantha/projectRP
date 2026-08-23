import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  FileCheck2,
  Flame,
  RotateCcw,
  Sparkles,
  Timer,
  X,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startMockExam, submitMockExam } from '../../services/chatbotApi';

const MockExamModal = ({ isOpen, onClose, studentId = 'student_demo_123' }) => {
  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(600); // 10 mins
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initExam();
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || examResult || !examData) return;
    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, examResult, examData, answers]);

  const initExam = async () => {
    setIsLoading(true);
    setExamResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeRemainingSeconds(600);
    try {
      const data = await startMockExam(studentId);
      setExamData(data);
    } catch (error) {
      console.error('Failed to initialize mock exam', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleAutoSubmit = () => {
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!examData || isSubmitting) return;
    setIsSubmitting(true);
    const timeSpent = 600 - timeRemainingSeconds;
    try {
      const res = await submitMockExam({
        examId: examData.examId,
        studentId,
        answers,
        timeSpentSeconds: timeSpent,
      });
      setExamResult(res);
    } catch (error) {
      console.error('Mock exam submission failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const questions = examData?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/10 bg-[#070d09] shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Timer size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  10-Min O/L Mock Exam Simulator
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                    Timed
                  </span>
                </h3>
                <p className="text-xs text-text-muted">
                  Adaptive 10-Question Test with O/L Grade Predictor (A to W)
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            {!examResult && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                timeRemainingSeconds < 120
                  ? 'border-red-500/40 bg-red-500/10 text-red-400 animate-pulse'
                  : 'border-white/10 bg-white/5 text-primary'
              }`}>
                <Clock size={13} />
                <span>{formatTimer(timeRemainingSeconds)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-text-muted hover:bg-white/5 hover:text-white transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {!examResult ? (
              <div className="space-y-6">
                {/* Progress bar and question indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-text-muted">
                    <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                    <span>{answeredCount}/{totalQuestions} Answered</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Box */}
                {currentQ && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-primary font-bold uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                          {currentQ.topicName}
                        </span>
                        <span className="text-[10px] text-text-muted capitalize">
                          {currentQ.difficulty} Difficulty
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white leading-relaxed">
                        {currentQ.questionText}
                      </h4>
                    </div>

                    {/* Option Choices */}
                    <div className="space-y-2.5">
                      {currentQ.options.map((opt) => {
                        const isSelected = answers[currentQ.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectOption(currentQ.id, opt)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs font-medium ${
                              isSelected
                                ? 'border-primary/50 bg-primary/10 text-white shadow-md'
                                : 'border-white/5 bg-white/[0.02] text-slate-300 hover:bg-white/[0.04] hover:text-white'
                            }`}
                          >
                            <span>{opt}</span>
                            <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-primary bg-primary text-[#032418]' : 'border-white/20'
                            }`}>
                              {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#032418]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Navigation Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-white/10">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:bg-white/10 disabled:opacity-30 min-h-[40px] transition-all"
                  >
                    Previous
                  </button>

                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/10 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-white/20 min-h-[40px] transition-all"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-[#032418] shadow-lg shadow-primary/30 hover:brightness-105 min-h-[40px] transition-all"
                    >
                      <Award size={16} />
                      <span>Submit &amp; Predict Grade</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Exam Result View */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Grade Badge Header */}
                <div className="text-center p-6 rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted">
                    Predicted O/L ICT Grade
                  </span>
                  <h2 className="text-3xl font-black text-primary tracking-tight">
                    {examResult.predictedGrade}
                  </h2>
                  <div className="flex items-center justify-center gap-4 text-xs font-mono text-white/90 pt-1">
                    <span>Score: <strong>{examResult.score}/{examResult.totalQuestions} ({examResult.percentage}%)</strong></span>
                    <span>•</span>
                    <span>Time: <strong>{examResult.timeTakenFormatted}</strong></span>
                  </div>
                  <p className="text-xs text-text-muted max-w-md mx-auto pt-2">
                    {examResult.feedback}
                  </p>
                </div>

                {/* Topic Breakdown Bars */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Domain Performance:
                  </h4>
                  <div className="space-y-2.5">
                    {examResult.topicBreakdown.map((tb) => (
                      <div key={tb.topicName} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-white/90">
                          <span>{tb.topicName}</span>
                          <span className="font-mono text-primary">{tb.correct}/{tb.total} ({tb.percentage}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              tb.percentage >= 70 ? 'bg-primary' : tb.percentage >= 40 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${tb.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Study Prescription Recommendations */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Sparkles size={14} />
                    Personalized AI Study Prescription
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {examResult.studyPrescription.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 shrink-0">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Retake Button */}
                <div className="flex justify-center">
                  <button
                    onClick={initExam}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
                  >
                    <RotateCcw size={14} />
                    Take Another Mock Exam
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MockExamModal;
