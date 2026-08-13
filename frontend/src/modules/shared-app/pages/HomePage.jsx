import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  ChartColumnBig,
  CheckCircle2,
  PlayCircle,
  Radar,
  Sparkles,
} from 'lucide-react';
import { getLoginQuiz, submitLoginQuiz } from '../../component-03-adaptive-chatbot/services/chatbotApi';
import LoginQuizModal from '../../component-03-adaptive-chatbot/components/Chatbot/LoginQuizModal';
import useStore from '../utils/useStore';

const stats = [
  { icon: BookOpen, label: 'Lesson aware', value: 'Timeline synced' },
  { icon: BrainCircuit, label: 'Popup logic', value: 'Graph guided' },
  { icon: CheckCircle2, label: 'Student flow', value: 'Simple feedback' },
];

const features = [
  {
    icon: BrainCircuit,
    title: 'Concept diagrams',
    text: 'Each lesson introduces the idea visually first so students can understand the topic before answering.',
  },
  {
    icon: Radar,
    title: 'Adaptive popup flow',
    text: 'The platform watches the lesson timeline and selects the most relevant concept-based question.',
  },
  {
    icon: ChartColumnBig,
    title: 'Progress awareness',
    text: 'Popup answers and attention patterns are captured to build a calmer and more guided learning journey.',
  },
];

const highlights = [
  'Knowledge graph based topic mapping',
  'Lesson timeline aligned question timing',
  'Diagram to MCQ to feedback learning cycle',
  'Cleaner experience for students and teachers',
];

const HomePage = () => {
  const { userId, sessionId } = useStore();
  const [quizPayload, setQuizPayload] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    let isMounted = true;
    const storageKey = `signlearn-login-quiz-${sessionId}`;

    const loadQuiz = async () => {
      if (!userId || window.sessionStorage.getItem(storageKey)) {
        return;
      }

      try {
        const response = await getLoginQuiz(userId);
        if (!isMounted) return;
        if (response?.shouldShowQuiz && response?.questions?.length) {
          setQuizPayload(response);
        }
        window.sessionStorage.setItem(storageKey, 'seen');
      } catch (error) {
        console.error('Failed to load login quiz', error);
      }
    };

    loadQuiz();
    return () => {
      isMounted = false;
    };
  }, [sessionId, userId]);

  const handleQuizSubmit = async ({ quizId, answers, skipped }) => {
    setQuizLoading(true);
    try {
      return await submitLoginQuiz({
        studentId: userId,
        quizId,
        answers,
        skipped,
      });
    } finally {
      setQuizLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.08 }}
        className="home-page-shell"
      >
        <motion.section variants={fadeUp} className="home-hero-panel">
          <div className="home-hero-overlay" />

          <div className="home-hero-grid">
            <div>
              <div className="home-kicker">
                <Sparkles size={13} />
                Calm AI Learning System
              </div>

              <h1 className="home-hero-title">
                SignLearn AI helps students learn with better timing, simpler guidance, and less visual noise.
              </h1>

              <p className="home-hero-copy">
                The platform follows each lesson timeline, understands the active O/L ICT
                concept, shows simple diagrams, and asks the right popup question at the
                right moment.
              </p>

              <div className="home-action-row">
                <Link to="/lesson" className="home-primary-action">
                  Open Lesson
                  <ArrowRight size={16} />
                </Link>
                <Link to="/chatbot" className="home-secondary-action">
                  Open Chatbot
                </Link>
              </div>

              <div className="home-stat-grid">
                {stats.map((item) => (
                  <div key={item.label} className="home-stat-card">
                    <div className="home-stat-label">
                      <item.icon size={17} />
                      {item.label}
                    </div>
                    <div className="home-stat-value">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="home-side-stack">
              <div className="home-side-card">
                <div className="home-side-kicker">
                  <PlayCircle size={13} />
                  Learning flow
                </div>
                <h2 className="home-side-title">Diagram to Question to Feedback</h2>
                <p className="home-side-copy">
                  Students first get a short explanation, then a focused concept check, and
                  then instant feedback with saved progress.
                </p>
              </div>

              <div className="home-side-card">
                <div className="home-side-kicker-muted">Why this feels better</div>
                <div className="home-highlight-list">
                  {highlights.map((highlight) => (
                    <div key={highlight} className="home-highlight-item">
                      <span className="home-highlight-dot" />
                      <p>{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="home-feature-section">
          <div className="home-feature-intro">
            <div className="home-kicker-soft">Platform features</div>
            <h2 className="home-feature-title">
              A calmer student dashboard for AI-supported learning
            </h2>
            <p className="home-feature-copy">
              The student home page is designed to stay focused, reduce clutter, and guide
              learners into the main lesson tools with clear actions.
            </p>
          </div>

          <div className="home-feature-grid">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -3 }}
                className="home-feature-card"
              >
                <div className="home-feature-icon">
                  <feature.icon size={20} />
                </div>
                <h3 className="home-feature-card-title">{feature.title}</h3>
                <p className="home-feature-card-copy">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </motion.div>

      {quizPayload ? (
        <LoginQuizModal
          quiz={quizPayload}
          isSubmitting={quizLoading}
          onSubmit={handleQuizSubmit}
          onClose={() => setQuizPayload(null)}
        />
      ) : null}
    </>
  );
};

export default HomePage;
