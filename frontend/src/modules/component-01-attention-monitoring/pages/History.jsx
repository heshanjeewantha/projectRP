import { useCallback, useEffect, useState } from 'react';
import { getMissedHistory, markReviewed } from '../services/missedApi';
import { getStudentPopupAnswers } from '../../component-02-knowledge-graph-question-system/services/popupApi';
import useStore from '../../shared-app/utils/useStore';
import { History as HistoryIcon, CheckCircle, Clock, Calendar, BrainCircuit, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';

const History = () => {
  const [history, setHistory] = useState([]);
  const [popupHistory, setPopupHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = useStore((state) => state.userId);

  const loadHistory = useCallback(async () => {
    try {
      const res = await getMissedHistory(userId);
      setHistory(res.data || []);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadPopupHistory = useCallback(async () => {
    try {
      const res = await getStudentPopupAnswers(userId);
      setPopupHistory(res || []);
    } catch (e) {
      console.error('Failed to load popup history', e);
    }
  }, [userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHistory();
      void loadPopupHistory();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadHistory, loadPopupHistory]);

  const handleMarkReviewed = async (docId) => {
    try {
      await markReviewed(docId);
      loadHistory();
    } catch (e) {
      console.error(e);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-stack">
        {/* Hero Header */}
        <DashboardPanel className="dashboard-panel-hero">
          <Header
            label="Learning Records"
            icon={HistoryIcon}
            title="Learning History & Checkpoints"
            description="Review interactive concept popup checks, knowledge graph feedback, and AI attention logs where you needed extra focus."
          />
        </DashboardPanel>

        {/* Popup Chat History Section */}
        <DashboardPanel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <BrainCircuit size={18} />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-text-main">
                  Popup Knowledge Checks
                </h3>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                Concept checkpoints completed during your interactive lectures.
              </p>
            </div>
            <span className="self-start sm:self-auto rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Knowledge Graph
            </span>
          </div>

          {popupHistory.length === 0 ? (
            <div className="rounded-2xl border border-border bg-black/[0.02] dark:bg-black/20 p-8 text-center text-sm text-text-muted">
              No knowledge check popups recorded yet. Complete a video lesson to see checkpoints here.
            </div>
          ) : (
            <div className="grid gap-4">
              {popupHistory.map((entry) => (
                <motion.div
                  key={entry.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="history-card"
                >
                  {/* Topic and Status Badge */}
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      <span className="text-xs font-black uppercase tracking-wider text-text-main">
                        {entry.conceptName || 'O/L ICT Concept'}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        entry.isCorrect
                          ? 'border border-success/30 bg-success/15 text-emerald-600 dark:text-emerald-300'
                          : 'border border-danger/30 bg-danger/15 text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      {entry.isCorrect ? '✓ Correct Answer' : '⚠ Review Needed'}
                    </span>
                  </div>

                  {/* Conversation Flow */}
                  <div className="space-y-3">
                    {/* Tutor Question */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/25 mt-0.5 shadow-sm">
                        <Bot size={15} />
                      </div>
                      <div className="history-tutor-bubble flex-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-primary mb-1">
                          Tutor Question
                        </div>
                        <p className="text-sm font-semibold text-text-main leading-relaxed">
                          {entry.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Student Answer */}
                    <div className="flex items-start justify-end gap-3">
                      <div className="history-user-bubble flex-1 max-w-[85%]">
                        <div className="text-[10px] font-black uppercase tracking-wider text-sky-500 mb-1">
                          Your Selected Answer
                        </div>
                        <p className="text-sm font-bold text-text-main leading-relaxed">
                          {entry.selectedAnswer}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500 border border-sky-500/25 mt-0.5 shadow-sm">
                        <User size={15} />
                      </div>
                    </div>

                    {/* Feedback Explanation */}
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border mt-0.5 shadow-sm ${
                        entry.isCorrect ? 'bg-success/15 text-success border-success/25' : 'bg-danger/15 text-danger border-danger/25'
                      }`}>
                        <Sparkles size={15} />
                      </div>
                      <div className={`history-feedback-bubble flex-1 ${entry.isCorrect ? 'is-correct' : 'is-wrong'}`}>
                        <div
                          className={`text-[10px] font-black uppercase tracking-wider mb-1 ${
                            entry.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          Feedback &amp; Explanation
                        </div>
                        <p className="text-sm font-medium leading-relaxed">
                          {entry.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </DashboardPanel>

        {/* Attention Missed Segments Section */}
        <DashboardPanel>
          <div className="flex items-center gap-2.5 border-b border-border pb-5 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 text-warning border border-warning/20">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-text-main">
                Attention Review Segments
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Lecture segments where distraction or fatigue was detected during video playback.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-text-muted">
              <Clock size={28} className="mx-auto mb-3 animate-spin text-primary opacity-60" />
              <p className="text-sm font-medium">Fetching learning logs...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-border bg-black/[0.02] dark:bg-black/20 p-8 text-center text-sm text-text-muted">
              <CheckCircle size={32} className="mx-auto mb-2 text-primary opacity-60" />
              <p className="font-semibold text-text-main">All caught up!</p>
              <p className="mt-1 text-xs text-text-muted">No missed attention segments recorded.</p>
            </div>
          ) : (
            <div className="grid gap-5">
              <AnimatePresence mode="popLayout">
                {history.map((session) => (
                  <motion.div
                    key={session._id}
                    variants={cardVariants}
                    layout
                    className="history-card overflow-hidden !p-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-black/[0.02] dark:bg-white/[0.02] px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-text-main block">
                            {new Date(session.created_at).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            {new Date(session.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {session.segments.some((s) => !s.reviewed) ? (
                        <button
                          type="button"
                          onClick={() => handleMarkReviewed(session._id)}
                          className="flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-600 active:scale-95 cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          Mark Reviewed
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/15 px-3.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                          <CheckCircle size={14} />
                          Completed
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="grid gap-3">
                        {session.segments.map((seg, idx) => (
                          <div
                            key={idx}
                            className={`history-segment-card ${seg.reviewed ? 'is-reviewed' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-warning">
                                <Clock size={13} />
                                <span>
                                  {Math.floor(seg.start_time)}s — {Math.floor(seg.end_time)}s
                                </span>
                              </div>
                              {seg.reviewed && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                  Reviewed
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm leading-relaxed ${
                                seg.reviewed
                                  ? 'text-text-muted line-through'
                                  : 'font-medium text-text-main'
                              }`}
                            >
                              {seg.transcript_text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
};

export default History;
