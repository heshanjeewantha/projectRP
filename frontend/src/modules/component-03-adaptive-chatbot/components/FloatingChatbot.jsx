import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageCircle, Minimize2, Send, Sparkles, X } from 'lucide-react';

import { askChatbot, getChatbotHistory } from '../services/chatbotApi';
import useStore from '../../shared-app/utils/useStore';
import ChatbotFormattedAnswer from './Chatbot/ChatbotFormattedAnswer';
import './FloatingChatbot.css';

const routeTopicMap = {
  '/': 'Introduction to ICT',
  '/lesson': 'Lesson Support',
  '/chatbot': 'ICT Chatbot',
  '/sign-avatar': 'Sign Avatar',
  '/wristband': 'Smart Wristband',
  '/history': 'Learning History',
  '/admin': 'Admin Dashboard',
  '/admin/analytics': 'Teacher Analytics',
  '/admin/repeated-alerts': 'Repeated Query Alerts',
  '/upload': 'Content Upload',
};

const FLOATING_STARTER_MESSAGES = [
  {
    id: 'starter-message',
    role: 'assistant',
    answer:
      'Ask any O/L ICT question here. I can give quick lesson help without leaving the current page.',
  },
];

const buildMockReply = ({ question, selectedMode, currentLearningState, currentTopic }) => {
  const baseTopic = currentTopic || 'O/L ICT';

  if (selectedMode === 'exam') {
    return `Short answer: ${baseTopic} is related to your question "${question}". Focus on a definition and 2 or 3 key points for exam writing.`;
  }

  if (currentLearningState === 'distracted') {
    return `Quick help: your question is about ${baseTopic}. First remember the main idea, then try one small example.`;
  }

  if (currentLearningState === 'not_understanding') {
    return `Simple explanation: ${baseTopic} can be understood step by step. Start with the basic meaning, then connect it to one everyday example.`;
  }

  if (currentLearningState === 'bored') {
    return `Let's make it lighter: ${baseTopic} is easier to remember if you connect it to school work, email, or daily computer use.`;
  }

  return `Here is a learning-focused answer about ${baseTopic}: "${question}" connects to the current lesson topic, so I can explain it in simple O/L ICT language whenever you need.`;
};

const getSourceLabel = (sourceType) =>
  sourceType === 'LLM' ? 'LLM Answer' : 'Dataset Fallback Answer';

const FloatingChatbot = ({ pathname }) => {
  const { userId, userRole, attentionStatus, currentVideo } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState('learning');
  const [messages, setMessages] = useState(FLOATING_STARTER_MESSAGES);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [usedMockResponse, setUsedMockResponse] = useState(false);
  const scrollRef = useRef(null);

  const currentLearningState =
    attentionStatus === 'not_attentive' ? 'distracted' : 'understanding';
  const currentTopic = currentVideo?.title || routeTopicMap[pathname] || 'General O/L ICT';
  const canUseBackend = Boolean(userId && userRole === 'student');

  useEffect(() => {
    if (!isOpen || !canUseBackend) return undefined;

    let isMounted = true;
    const loadHistory = async () => {
      try {
        const history = await getChatbotHistory(userId);
        if (!isMounted) return;

        if (!history?.length) {
          setMessages(FLOATING_STARTER_MESSAGES);
          return;
        }

        const normalized = history.flatMap((item, index) => [
          {
            id: `${item.id || item.createdAt || index}-question`,
            role: 'user',
            question: item.question,
          },
          {
            id: `${item.id || item.createdAt || index}-answer`,
            role: 'assistant',
            answer: item.answer,
            meta: `${item.modeBadge || item.mode} | ${item.learningStateBadge || item.learningState?.replaceAll('_', ' ')}`,
            sourceType: item.sourceType,
          },
        ]);

        setMessages(normalized);
      } catch (error) {
        console.error('Failed to load floating chatbot history', error);
        setMessages(FLOATING_STARTER_MESSAGES);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [canUseBackend, isOpen, userId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isSending, isOpen]);

  const handleSend = async () => {
    const question = draft.trim();
    if (!question || isSending) return;

    setMessages((previous) => [
      ...previous,
      { id: `user-${Date.now()}`, role: 'user', question },
    ]);
    setDraft('');
    setIsSending(true);

    try {
      if (!canUseBackend) {
        throw new Error('Backend unavailable for floating mode');
      }

      const response = await askChatbot({
        studentId: userId,
        question,
        selectedMode,
        currentLearningState,
        currentTopic,
        prerequisiteTopics: [],
      });

      setMessages((previous) => [
        ...previous,
        {
          id: response.id || `assistant-${Date.now()}`,
          role: 'assistant',
          answer: response.answer,
          meta: `${response.modeBadge || response.mode} | ${response.learningStateBadge || response.learningState?.replaceAll('_', ' ')}`,
          sourceType: response.sourceType,
        },
      ]);
      setUsedMockResponse(false);
    } catch (error) {
      console.error('Floating chatbot fallback used', error);
      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-fallback-${Date.now()}`,
          role: 'assistant',
          answer: buildMockReply({
            question,
            selectedMode,
            currentLearningState,
            currentTopic,
          }),
          meta: 'mock response',
        },
      ]);
      setUsedMockResponse(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="floating-chatbot">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="floating-chatbot__panel"
          >
            <div className="floating-chatbot__header">
              <div className="floating-chatbot__header-brand">
                <div className="floating-chatbot__icon-wrap">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="floating-chatbot__title">Chat Support</div>
                  <div className="floating-chatbot__subtitle">{currentTopic}</div>
                </div>
              </div>

              <div className="floating-chatbot__header-actions">
                <button
                  type="button"
                  className="floating-chatbot__icon-button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Minimize chatbot"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  type="button"
                  className="floating-chatbot__icon-button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chatbot"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="floating-chatbot__toolbar">
              <div className="floating-chatbot__mode-toggle">
                {['learning', 'exam'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedMode(mode)}
                    className={`floating-chatbot__mode-button ${selectedMode === mode ? 'is-active' : ''}`}
                  >
                    {mode === 'learning' ? 'Learning' : 'Exam'}
                  </button>
                ))}
              </div>
              <div className="floating-chatbot__state-pill">
                <Sparkles size={13} />
                {currentLearningState.replaceAll('_', ' ')}
              </div>
            </div>

            {usedMockResponse ? (
              <div className="floating-chatbot__notice">
                Backend is unavailable right now. Showing mock support replies.
              </div>
            ) : null}

            <div ref={scrollRef} className="floating-chatbot__messages custom-scrollbar">
              {messages.map((message) =>
                message.role === 'user' ? (
                  <div key={message.id} className="floating-chatbot__message-row is-user">
                    <div className="floating-chatbot__bubble is-user">
                      <div className="floating-chatbot__meta is-user">Student</div>
                      <p>{message.question}</p>
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="floating-chatbot__message-row">
                    <div className="floating-chatbot__bubble">
                      <div className="floating-chatbot__meta">
                        Assistant
                        {message.meta ? (
                          <span className="floating-chatbot__meta-tag">{message.meta}</span>
                        ) : null}
                        {message.sourceType ? (
                          <span className="floating-chatbot__meta-tag">
                            {getSourceLabel(message.sourceType)}
                          </span>
                        ) : null}
                      </div>
                      <ChatbotFormattedAnswer content={message.answer} compact />
                      {message.sourceType === 'LOCAL_DATASET' ? (
                        <div className="floating-chatbot__source-note">
                          Answered using local lesson dataset.
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              )}

              {isSending ? (
                <div className="floating-chatbot__message-row">
                  <div className="floating-chatbot__bubble">
                    <p>Generating answer...</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="floating-chatbot__composer">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Type your ICT question..."
                className="floating-chatbot__textarea"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !draft.trim()}
                className="floating-chatbot__send"
              >
                <Send size={15} />
                Send
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="floating-chatbot__trigger"
        aria-label="Open floating chatbot"
      >
        <span className="floating-chatbot__trigger-dot" />
        <MessageCircle size={22} />
      </motion.button>
    </div>
  );
};

export default FloatingChatbot;
