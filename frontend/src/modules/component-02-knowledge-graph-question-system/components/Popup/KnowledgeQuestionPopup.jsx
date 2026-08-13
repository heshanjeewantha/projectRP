import { useEffect, useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Gauge,
  MoveRight,
  TimerReset,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ConceptDiagramPanel from './ConceptDiagramPanel';

const KnowledgeQuestionPopup = ({ popupSession, isSubmitting, onSubmitAnswer, onContinue }) => {
  const question = popupSession?.question;
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('diagram');

  useEffect(() => {
    setSelectedAnswer('');
    setSubmissionResult(null);
    setError('');
    setStep('diagram');
  }, [question?.questionId]);

  if (!popupSession || !question) {
    return null;
  }

  const handleStartQuestion = () => {
    setStep('question');
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      setError('Choose an answer before submitting.');
      return;
    }

    setError('');

    try {
      const result = await onSubmitAnswer(question, selectedAnswer);
      setSubmissionResult(result);
      setStep('feedback');
    } catch (submitError) {
      setError('The answer could not be submitted. Please try again.');
      console.error(submitError);
    }
  };

  const isAnswered = Boolean(submissionResult);

  const getOptionClasses = (option) => {
    if (!isAnswered) {
      return selectedAnswer === option
        ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20'
        : 'border-white/10 bg-white/5 text-text-main hover:border-white/20 hover:bg-white/10';
    }

    if (option === submissionResult.correctAnswer) {
      return 'border-success/40 bg-success/15 text-white';
    }

    if (option === submissionResult.selectedAnswer && !submissionResult.isCorrect) {
      return 'border-danger/40 bg-danger/15 text-white';
    }

    return 'border-white/10 bg-white/[0.03] text-text-muted';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/82 backdrop-blur-md px-4 py-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="popup-shell custom-scrollbar"
        >
          <div className="popup-header">
            <div className="popup-header-row">
              <div className="popup-heading-block">
                <div className="popup-kicker">
                  <BrainCircuit size={16} />
                  Knowledge Graph Popup
                </div>
                <h3 className="popup-title">{popupSession.currentConcept?.conceptName}</h3>
              </div>

              <div className="popup-timeline-card">
                <div className="popup-timeline-label">
                  Timeline
                </div>
                <div className="popup-timeline-value">
                  {Math.floor(popupSession.timelineWindow?.startTime ?? 0)}s - {Math.floor(popupSession.timelineWindow?.endTime ?? 0)}s
                </div>
              </div>
            </div>

            <div className="popup-insight-card">
              <div className="popup-insight-label">
                Selection Insight
              </div>
              <p className="popup-insight-copy">
                {popupSession.selectionReason || 'A concept-aware checkpoint was selected for the current lesson segment.'}
              </p>
            </div>
          </div>

          <div className="popup-content">
            <div className="popup-meta-row">
              <span className="popup-meta-pill">
                <Gauge size={14} />
                {question.difficultyLevel}
              </span>
              <span className="popup-meta-pill">
                <TimerReset size={14} />
                {question.conceptId}
              </span>
            </div>

            {step === 'diagram' && (
              <div className="popup-step-stack">
                <div className="popup-explainer-card">
                  <div className="popup-section-label popup-section-label-accent">
                    Quick Explanation
                  </div>
                  <p className="popup-section-copy">
                    Review this simple diagram first. It summarizes the topic you are currently learning, then the popup moves to the MCQ.
                  </p>
                </div>

                <ConceptDiagramPanel diagram={popupSession.currentConcept?.diagram} compact />

                <div className="popup-summary-card">
                  <div className="popup-section-label">
                    Topic Summary
                  </div>
                  <p className="popup-summary-copy">
                    {popupSession.currentConcept?.description}
                  </p>
                  {popupSession.currentConcept?.keywords?.length > 0 && (
                    <div className="popup-keyword-row">
                      {popupSession.currentConcept.keywords.slice(0, 6).map((keyword) => (
                        <span key={keyword} className="popup-keyword-pill">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step !== 'diagram' && (
              <>
                <div className="popup-question-block">
                  <div className="popup-section-label">
                    Multiple Choice Checkpoint
                  </div>
                  <p className="popup-question-title">{question.questionText}</p>
                </div>

                <div className="popup-options-grid">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isAnswered || isSubmitting}
                      onClick={() => setSelectedAnswer(option)}
                      className={`popup-option-card ${getOptionClasses(option)}`}
                    >
                      <div className="popup-option-row">
                        <span className="popup-option-text">{option}</span>
                        {isAnswered && option === submissionResult.correctAnswer && <CheckCircle2 size={18} className="text-success" />}
                        {isAnswered && option === submissionResult.selectedAnswer && !submissionResult.isCorrect && <XCircle size={18} className="text-danger" />}
                      </div>
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="popup-warning-card">
                    <CircleAlert size={16} />
                    {error}
                  </div>
                )}

                {isAnswered && (
                  <div className={`popup-feedback-card ${submissionResult.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                    <div className="popup-feedback-title">
                      {submissionResult.isCorrect ? (
                        <>
                          <CheckCircle2 className="text-success" />
                          Correct answer
                        </>
                      ) : (
                        <>
                          <XCircle className="text-danger" />
                          Not quite
                        </>
                      )}
                    </div>
                    <p className="popup-feedback-copy">{submissionResult.explanation}</p>
                    {!submissionResult.isCorrect && (
                      <p className="popup-feedback-answer">
                        Correct answer: <span className="font-semibold text-white">{submissionResult.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="popup-action-row">
              {step === 'diagram' ? (
                <button
                  type="button"
                  onClick={handleStartQuestion}
                  className="popup-primary-button"
                >
                  Start MCQ
                  <MoveRight size={16} />
                </button>
              ) : !isAnswered ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="popup-primary-button"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onContinue}
                  className="popup-primary-button"
                >
                  Continue Lesson
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KnowledgeQuestionPopup;
