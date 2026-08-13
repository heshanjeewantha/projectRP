import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Eraser,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-react';

import {
  askChatbot,
  checkMicroChallenge,
  clearChatbotHistory,
  getChatbotHistory,
  getChatbotTopics,
  getLessonSummary,
  getMicroChallenge,
} from '../services/chatbotApi';
import useStore from '../../shared-app/utils/useStore';
import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';

const MODE_OPTIONS = [
  { value: 'learning', label: 'Learning Mode', icon: BookOpen },
  { value: 'exam', label: 'Exam Mode', icon: GraduationCap },
];

const STATE_OPTIONS = [
  { value: 'understanding', label: 'Understanding' },
  { value: 'not_understanding', label: 'Not Understanding' },
  { value: 'bored', label: 'Bored' },
  { value: 'distracted', label: 'Distracted' },
];

const DEFAULT_TOPIC_OPTIONS = [
  { id: 'computer_system', name: 'Computer System', prerequisites: [] },
  { id: 'data_information', name: 'Data and Information', prerequisites: ['Computer System'] },
  { id: 'operating_systems', name: 'Operating Systems', prerequisites: ['Computer System'] },
  { id: 'word_processing', name: 'Word Processing', prerequisites: ['Operating Systems'] },
  { id: 'spreadsheets', name: 'Spreadsheets', prerequisites: ['Data and Information'] },
  { id: 'databases', name: 'Databases', prerequisites: ['Data and Information', 'Spreadsheets'] },
  { id: 'dbms', name: 'DBMS', prerequisites: ['Databases'] },
  { id: 'normalization', name: 'Normalization', prerequisites: ['Databases', 'DBMS'] },
  { id: 'internet_email', name: 'Internet and Email', prerequisites: ['Computer System'] },
  { id: 'networking', name: 'Networking', prerequisites: ['Internet and Email'] },
  { id: 'programming_basics', name: 'Programming Basics', prerequisites: ['Data and Information'] },
  { id: 'flowcharts', name: 'Flowcharts', prerequisites: ['Programming Basics'] },
  { id: 'cyber_security', name: 'Cyber Security', prerequisites: ['Internet and Email'] },
];

const deriveStateFromAttention = (attentionStatus) =>
  attentionStatus === 'not_attentive' ? 'distracted' : 'understanding';

const QUESTION_OPENERS = [
  'what',
  'why',
  'how',
  'when',
  'where',
  'which',
  'who',
  'define',
  'explain',
  'describe',
  'compare',
  'difference',
  'give',
  'list',
  'state',
  'mention',
  'can',
  'could',
  'is',
  'are',
  'do',
  'does',
];

const shouldSkipMicroChallenge = (text, latestBotMessage) => {
  const normalized = text.trim().toLowerCase();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const looksLikeQuestion =
    normalized.includes('?') ||
    QUESTION_OPENERS.some((item) => normalized.startsWith(`${item} `) || normalized === item);

  if (!looksLikeQuestion && wordCount <= 45) {
    return true;
  }

  if (latestBotMessage?.nextDifficultyPrompt && wordCount <= 60) {
    return true;
  }

  return false;
};

const getSourceLabel = (sourceType) =>
  sourceType === 'LLM' ? 'LLM Answer' : 'Dataset Fallback Answer';

const ChatbotPage = () => {
  const { userId, attentionStatus } = useStore();
  const location = useLocation();

  const [chatHistory, setChatHistory] = useState([]);
  const [topicOptions, setTopicOptions] = useState(DEFAULT_TOPIC_OPTIONS);
  const [question, setQuestion] = useState('');
  const [selectedMode, setSelectedMode] = useState('learning');
  const [manualLearningState, setManualLearningState] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState(DEFAULT_TOPIC_OPTIONS[0]?.id || '');
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [challengeOffer, setChallengeOffer] = useState(null);
  const [challengeSelection, setChallengeSelection] = useState('');
  const [challengeResult, setChallengeResult] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingQuestionText, setPendingQuestionText] = useState('');
  const [summaryPreview, setSummaryPreview] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const chatScrollRef = useRef(null);
  const learningState = manualLearningState || deriveStateFromAttention(attentionStatus);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const historyResponse = await getChatbotHistory(userId);
        if (!isMounted) return;
        setChatHistory(historyResponse || []);
      } catch (error) {
        console.error('Failed to load chatbot history', error);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    const loadTopics = async () => {
      try {
        const response = await getChatbotTopics();
        if (!isMounted || !response?.length) return;
        const normalizedTopics = response.map((topic) => ({
          id: topic.topicId,
          name: topic.topicName,
          prerequisites: topic.prerequisites || [],
        }));
        setTopicOptions(normalizedTopics);
        setSelectedTopicId((current) =>
          normalizedTopics.some((topic) => topic.id === current)
            ? current
            : normalizedTopics[0]?.id || current
        );
      } catch (error) {
        console.error('Failed to load chatbot topics', error);
      }
    };

    loadTopics();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const node = chatScrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [chatHistory, isSending, challengeOffer, challengeResult]);

  const selectedTopic = useMemo(
    () => topicOptions.find((topic) => topic.id === selectedTopicId) || topicOptions[0],
    [selectedTopicId, topicOptions]
  );

  const prerequisiteTopics = selectedTopic?.prerequisites || [];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const questionParam = params.get('question');
    const topicParam = params.get('topic');

    const frameId = window.requestAnimationFrame(() => {
      if (questionParam) {
        setQuestion(questionParam);
      }

      if (topicParam) {
        const matchedTopic = topicOptions.find(
          (topic) =>
            topic.id === topicParam ||
            topic.name.toLowerCase() === topicParam.toLowerCase()
        );
        if (matchedTopic) {
          setSelectedTopicId(matchedTopic.id);
        }
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.search, topicOptions]);

  const resetChallengeFlow = () => {
    setChallengeOffer(null);
    setChallengeSelection('');
    setChallengeResult(null);
    setPendingPayload(null);
    setPendingQuestionText('');
  };

  const sendChatRequest = async (payload) => {
    setIsSending(true);
    try {
      const response = await askChatbot(payload);
      setChatHistory((previous) => [...previous, response]);
      setQuestion('');
      resetChallengeFlow();
    } catch (error) {
      console.error('Failed to send chatbot question', error);
    } finally {
      setIsSending(false);
    }
  };

  const openSummaryPreview = async (topicId) => {
    if (!topicId) return;
    setIsSummaryLoading(true);
    try {
      const summary = await getLessonSummary(topicId);
      setSummaryPreview(summary);
    } catch (error) {
      console.error('Failed to load lesson summary preview', error);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending) return;
    const latestBotMessage = chatHistory[chatHistory.length - 1];

    const payload = {
      studentId: userId,
      question: trimmedQuestion,
      selectedMode,
      currentLearningState: learningState,
      currentTopic: selectedTopic?.id || '',
      prerequisiteTopics,
    };

    if (selectedMode === 'exam') {
      await sendChatRequest(payload);
      return;
    }

    if (shouldSkipMicroChallenge(trimmedQuestion, latestBotMessage)) {
      await sendChatRequest(payload);
      return;
    }

    try {
      const offer = await getMicroChallenge(payload);
      if (offer?.shouldOfferChallenge && offer?.challenge) {
        setChallengeOffer(offer);
        setPendingPayload(payload);
        setPendingQuestionText(trimmedQuestion);
        setQuestion('');
        return;
      }
    } catch (error) {
      console.error('Failed to load micro-challenge, sending direct answer', error);
    }

    await sendChatRequest(payload);
  };

  const handleChallengeCheck = async () => {
    if (!challengeOffer?.challenge || !challengeSelection || !pendingPayload) return;
    try {
      const response = await checkMicroChallenge({
        studentId: userId,
        challengeId: challengeOffer.challenge.challengeId,
        selectedAnswer: challengeSelection,
        topicId: challengeOffer.challenge.topicId,
      });
      setChallengeResult(response);
    } catch (error) {
      console.error('Failed to check micro challenge', error);
    }
  };

  const handleClearHistory = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await clearChatbotHistory(userId);
      setChatHistory([]);
      resetChallengeFlow();
    } catch (error) {
      console.error('Failed to clear chatbot history', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="dashboard-shell chatbot-page-shell">
      <div className="dashboard-layout">
        <div className="dashboard-stack">
          <DashboardPanel className="dashboard-panel-hero">
            <Header
              label="Chatbot"
              icon={MessageSquare}
              title="Advanced adaptive learning chatbot"
              description="Ask O/L ICT questions in learning or exam mode. The chatbot can offer an optional prerequisite challenge, detect repeated difficulty, and guide you to topic summaries when needed."
            />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="dashboard-chip text-primary">
                <Sparkles size={16} className="text-primary" />
                {selectedMode === 'learning' ? 'Learning mode' : 'Exam mode'}
              </span>
              <span className="dashboard-chip">
                <BrainCircuit size={16} className="text-primary" />
                State: {STATE_OPTIONS.find((item) => item.value === learningState)?.label}
              </span>
              <span className="dashboard-chip">
                <Lightbulb size={16} className="text-primary" />
                Topic: {selectedTopic?.name}
              </span>
            </div>
          </DashboardPanel>

          <DashboardPanel className="min-h-[760px]">
            <div ref={chatScrollRef} className="chatbot-scroll-area custom-scrollbar">
              {chatHistory.length === 0 ? (
                <div className="chatbot-empty-state">
                  Ask your first O/L ICT question to start the adaptive learning conversation.
                </div>
              ) : (
                chatHistory.map((item) => (
                  <div key={item.id} className="chatbot-thread-group">
                    <div className="chatbot-user-row">
                      <div className="chatbot-user-bubble">
                        <div className="chatbot-user-meta">Student</div>
                        <p className="dashboard-text-wrap text-sm text-white">{item.question}</p>
                      </div>
                    </div>

                    <div className="chatbot-bot-row">
                      <div className="chatbot-bot-bubble">
                        <div className="chatbot-bot-meta">
                          <Bot size={12} />
                          Chatbot
                          <span className="chatbot-meta-tag">{item.modeBadge || item.mode}</span>
                          <span className="chatbot-meta-tag">{item.learningStateBadge || item.learningState?.replaceAll('_', ' ')}</span>
                          <span className="chatbot-meta-tag">{getSourceLabel(item.sourceType)}</span>
                          {item.compressedAnswer ? (
                            <span className="chatbot-meta-tag is-exam">Compressed answer</span>
                          ) : null}
                        </div>

                        {item.conceptReEntry && item.conceptRefreshPoints?.length > 0 ? (
                          <div className="chatbot-refresh-card">
                            <div className="chatbot-refresh-title">
                              <Lightbulb size={15} />
                              Let&apos;s do a quick refresh before continuing
                            </div>
                            <ul className="chatbot-refresh-list">
                              {item.conceptRefreshPoints.map((point) => (
                                <li key={`${item.id}-${point}`}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <p className="dashboard-text-wrap whitespace-pre-line text-sm text-white/95">
                          {item.answer}
                        </p>
                        {item.sourceType === 'LOCAL_DATASET' ? (
                          <p className="chatbot-source-note">
                            Answered using local lesson dataset.
                          </p>
                        ) : null}

                        {item.prerequisiteTopics?.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.prerequisiteTopics.map((topic) => (
                              <span key={`${item.id}-${topic}`} className="chatbot-topic-tag">
                                {topic}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {item.nextDifficultyPrompt ? (
                          <div className="chatbot-followup-card">
                            <div className="chatbot-followup-label">Difficulty escalation</div>
                            <p className="dashboard-text-wrap text-sm text-white/90">{item.nextDifficultyPrompt}</p>
                          </div>
                        ) : null}

                        {item.summaryTopicId ? (
                          <div className="chatbot-summary-card">
                            <div className="chatbot-summary-copy">
                              {item.summaryRecommendation || 'A quick summary is available for this topic.'}
                            </div>
                            <div className="chatbot-summary-actions">
                              <button
                                type="button"
                                onClick={() => openSummaryPreview(item.summaryTopicId)}
                                className="chatbot-inline-button"
                              >
                                Preview Summary
                              </button>
                              <Link to={`/lesson-summary/${item.summaryTopicId}`} className="chatbot-inline-button is-primary">
                                Open Summary
                                <ArrowRight size={14} />
                              </Link>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {challengeOffer?.challenge ? (
                <div className="chatbot-challenge-card">
                  <div className="chatbot-challenge-kicker">Optional micro-challenge</div>
                  <h3 className="chatbot-challenge-title">{challengeOffer.prompt}</h3>
                  {pendingQuestionText ? (
                    <p className="chatbot-challenge-copy">Pending question: {pendingQuestionText}</p>
                  ) : null}

                  {!challengeResult ? (
                    <>
                      <div className="chatbot-challenge-question">
                        {challengeOffer.challenge.questionText}
                      </div>
                      <div className="chatbot-challenge-options">
                        {challengeOffer.challenge.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setChallengeSelection(option)}
                            className={`chatbot-challenge-option ${challengeSelection === option ? 'is-active' : ''}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <div className="chatbot-challenge-actions">
                        <button
                          type="button"
                          onClick={() => sendChatRequest(pendingPayload)}
                          className="chatbot-inline-button"
                        >
                          Skip &amp; Show Answer
                        </button>
                        <button
                          type="button"
                          onClick={handleChallengeCheck}
                          disabled={!challengeSelection}
                          className="chatbot-inline-button is-primary"
                        >
                          Try Challenge
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={`chatbot-challenge-result ${challengeResult.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                      <div className="chatbot-challenge-result-title">
                        {challengeResult.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {challengeResult.feedback}
                      </div>
                      <p className="dashboard-text-wrap text-sm text-white/90">{challengeResult.explanation}</p>
                      <div className="chatbot-challenge-actions">
                        {challengeResult.summaryTopicId ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openSummaryPreview(challengeResult.summaryTopicId)}
                              className="chatbot-inline-button"
                            >
                              View Summary
                            </button>
                            <Link to={`/lesson-summary/${challengeResult.summaryTopicId}`} className="chatbot-inline-button">
                              Open Summary Page
                            </Link>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => sendChatRequest(pendingPayload)}
                          className="chatbot-inline-button is-primary"
                        >
                          Continue to answer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {isSending ? (
                <div className="chatbot-bot-row">
                  <div className="chatbot-loading-bubble">Generating adaptive answer...</div>
                </div>
              ) : null}
            </div>

            <div className="chatbot-compose">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask an O/L ICT question..."
                rows={4}
                className="chatbot-textarea"
              />

              <div className="chatbot-compose-row">
                <div className="chatbot-topic-line">
                  Topic: <span className="text-white">{selectedTopic?.name || 'General ICT'}</span>
                </div>
                <button
                  onClick={handleSend}
                  disabled={isSending || !question.trim()}
                  className="chatbot-send-button"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
          </DashboardPanel>
        </div>

        <div className="dashboard-stack">
          <DashboardPanel>
            <Header
              label="Mode"
              icon={BookOpen}
              title="Conversation setup"
              description="Choose the response mode, learning state, and current O/L ICT topic before sending the question."
            />

            <div className="chatbot-setup-grid">
              <div className="chatbot-mode-grid">
                {MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedMode(option.value)}
                    className={`chatbot-mode-button ${selectedMode === option.value ? 'is-active' : ''}`}
                  >
                    <option.icon size={18} className={selectedMode === option.value ? 'text-primary' : ''} />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>

              <div className="chatbot-control-card">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Learning State
                </div>
                <div className="chatbot-state-grid">
                  {STATE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setManualLearningState(option.value)}
                      className={`chatbot-state-button ${learningState === option.value ? 'is-active' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="chatbot-control-card">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Current Topic
                </div>
                <select
                  value={selectedTopicId}
                  onChange={(event) => setSelectedTopicId(event.target.value)}
                  className="chatbot-topic-select"
                >
                  {topicOptions.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <Header
              label="Context"
              icon={BrainCircuit}
              title={selectedTopic?.name || 'Topic context'}
              description="The chatbot uses prerequisite reminders, concept re-entry checks, and repeated-query tracking to guide the student more carefully."
            />

            <div className="mt-6 grid gap-4">
              <div className="rounded-[20px] bg-black/18 p-4">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Prerequisites
                </div>
                <div className="flex flex-wrap gap-2">
                  {prerequisiteTopics.length === 0 ? (
                    <span className="text-sm text-text-muted">No prerequisite topics required.</span>
                  ) : (
                    prerequisiteTopics.map((topic) => (
                      <span key={topic} className="chatbot-topic-tag">
                        {topic}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[20px] bg-black/18 p-4">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Adaptive features
                </div>
                <ul className="grid gap-2 text-sm text-text-muted">
                  <li className="dashboard-text-wrap">Learning mode offers a quick prerequisite challenge before some answers.</li>
                  <li className="dashboard-text-wrap">Exam mode compresses the answer into short, marks-focused points.</li>
                  <li className="dashboard-text-wrap">Repeated questions can create a teacher alert if the same concept becomes a difficulty area.</li>
                </ul>
              </div>

              <div className="rounded-[20px] bg-black/18 p-4">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Summary help
                </div>
                <div className="dashboard-text-wrap text-sm text-text-muted">
                  If a micro-challenge is answered incorrectly, the chatbot can recommend a lesson summary with key points, prerequisites, and sample questions.
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <Header
              label="History"
              icon={Eraser}
              title="Chat storage"
              description="Messages are stored per student so the system can track reinforcement, repeated queries, and topic progress."
            />
            <button
              onClick={handleClearHistory}
              disabled={isClearing || chatHistory.length === 0}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-[16px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-medium text-danger transition hover:bg-danger/16 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Eraser size={16} />
              Clear Chat History
            </button>
          </DashboardPanel>
        </div>
      </div>

      {summaryPreview || isSummaryLoading ? (
        <div className="chatbot-summary-preview-backdrop">
          <div className="chatbot-summary-preview-card">
            <div className="chatbot-summary-preview-head">
              <div>
                <div className="dashboard-label">
                  <Lightbulb size={12} />
                  Lesson Summary
                </div>
                <h3 className="chatbot-summary-preview-title">
                  {summaryPreview?.topicName || 'Loading summary...'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSummaryPreview(null)}
                className="quiz-modal-close"
              >
                <XCircle size={16} />
              </button>
            </div>

            {isSummaryLoading ? (
              <div className="chatbot-summary-preview-copy">Loading summary...</div>
            ) : summaryPreview ? (
              <>
                <p className="chatbot-summary-preview-copy">{summaryPreview.summary}</p>
                <div className="chatbot-summary-preview-list">
                  {summaryPreview.keyPoints?.map((point) => (
                    <div key={point} className="chatbot-summary-point">
                      <CircleAlert size={14} className="text-primary" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
                <div className="chatbot-summary-actions">
                  <Link
                    to={`/lesson-summary/${summaryPreview.topicId}`}
                    className="chatbot-inline-button is-primary"
                  >
                    Open full summary
                    <ArrowRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSummaryPreview(null)}
                    className="chatbot-inline-button"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ChatbotPage;
