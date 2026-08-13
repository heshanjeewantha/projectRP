import { useMemo, useState } from 'react';
import { BrainCircuit, CheckCircle2, Clock3, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginQuizModal = ({ quiz, onClose, onSubmit, isSubmitting = false }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [result, setResult] = useState(null);

  const answeredCount = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers]
  );

  const handleOptionSelect = (questionId, option) => {
    setSelectedAnswers((previous) => ({
      ...previous,
      [questionId]: option,
    }));
  };

  const handleSubmit = async (skipped = false) => {
    const answers = skipped
      ? []
      : quiz.questions.map((item) => ({
          questionId: item.questionId,
          selectedAnswer: selectedAnswers[item.questionId] || '',
        }));

    const response = await onSubmit({
      quizId: quiz.quizId,
      answers,
      skipped,
    });
    setResult(response);
  };

  return (
    <div className="quiz-modal-backdrop">
      <div className="quiz-modal-card">
        <div className="quiz-modal-header">
          <div>
            <div className="dashboard-label">
              <BrainCircuit size={12} />
              Login Quiz
            </div>
            <h2 className="quiz-modal-title">Quick reinforcement check</h2>
            <p className="quiz-modal-copy">{quiz.message}</p>
          </div>
          <button type="button" onClick={onClose} className="quiz-modal-close">
            <X size={16} />
          </button>
        </div>

        {!result ? (
          <>
            <div className="quiz-modal-meta">
              <span className="dashboard-chip">
                <Clock3 size={15} className="text-primary" />
                {quiz.questions.length} questions
              </span>
              <span className="dashboard-chip">
                <Sparkles size={15} className="text-primary" />
                {answeredCount}/{quiz.questions.length} answered
              </span>
            </div>

            <div className="quiz-modal-body custom-scrollbar">
              {quiz.questions.map((question, index) => (
                <div key={question.questionId} className="quiz-question-card">
                  <div className="quiz-question-topline">
                    <span className="quiz-question-index">Q{index + 1}</span>
                    <span className="quiz-question-priority">{question.priority}</span>
                  </div>
                  <h3 className="quiz-question-text">{question.questionText}</h3>
                  <div className="quiz-option-grid">
                    {question.options.map((option) => (
                      <button
                        key={`${question.questionId}-${option}`}
                        type="button"
                        onClick={() => handleOptionSelect(question.questionId, option)}
                        className={`quiz-option-button ${
                          selectedAnswers[question.questionId] === option ? 'is-active' : ''
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="quiz-modal-actions">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="quiz-secondary-button"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="quiz-primary-button"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </>
        ) : (
          <div className="quiz-result-card">
            <div className="quiz-result-score">
              <CheckCircle2 size={18} className="text-primary" />
              Score: {result.score}% ({result.correctAnswers}/{result.totalQuestions})
            </div>
            <p className="quiz-result-copy">{result.recommendation}</p>
            {result.recommendedTopics?.length > 0 && (
              <div className="quiz-result-list">
                <div className="quiz-result-label">Recommended revision topics</div>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedTopics.map((topic) => (
                    <span key={topic} className="chatbot-topic-tag">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="quiz-modal-actions">
              {quiz.weakTopics?.[0] ? (
                <Link
                  to={`/lesson-summary/${quiz.questions[0]?.topicId || ''}`}
                  className="quiz-secondary-button"
                >
                  View a summary
                </Link>
              ) : null}
              <button type="button" onClick={onClose} className="quiz-primary-button">
                Continue learning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginQuizModal;
