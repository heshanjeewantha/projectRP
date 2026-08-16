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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <BrainCircuit size={18} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
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
            <div className="rounded-2xl border border-white/5 bg-black/20 p-8 text-center text-sm text-text-muted">
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
                  className="rounded-2xl border border-white/[0.06] bg-[linear-gradient(180deg,rgba(12,18,15,0.9),rgba(8,12,10,0.9))] p-5 shadow-lg transition hover:border-white/15"
                >
                  {/* Topic and Status Badge */}
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                        {entry.conceptName || 'O/L ICT Concept'}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        entry.isCorrect
                          ? 'border border-success/30 bg-success/15 text-emerald-300'
                          : 'border border-danger/30 bg-danger/15 text-rose-300'
                      }`}
                    >
                      {entry.isCorrect ? '✓ Correct Answer' : '⚠ Review Needed'}
                    </span>
                  </div>

                  {/* Conversation Flow */}
                  <div className="space-y-3">
                    {/* Tutor Question */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/25 mt-0.5">
                        <Bot size={14} />
                      </div>
                      <div className="flex-1 rounded-2xl rounded-tl-sm border border-primary/20 bg-primary/10 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                          Tutor Question
                        </div>
                        <p className="text-sm font-medium text-white leading-relaxed">
                          {entry.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Student Answer */}
                    <div className="flex items-start justify-end gap-3">
                      <div className="flex-1 max-w-[85%] rounded-2xl rounded-tr-sm border border-accent/20 bg-accent/10 px-4 py-3 text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
                          Your Selected Answer
                        </div>
                        <p className="text-sm font-semibold text-white leading-relaxed">
                          {entry.selectedAnswer}
                        </p>
                      </div>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/25 mt-0.5">
                        <User size={14} />
                      </div>
                    </div>

                    {/* Feedback Explanation */}
                    <div className="flex items-start gap-3">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border mt-0.5 ${
                        entry.isCorrect ? 'bg-success/15 text-success border-success/25' : 'bg-danger/15 text-danger border-danger/25'
                      }`}>
                        <Sparkles size={14} />
                      </div>
                      <div
                        className={`flex-1 rounded-2xl border px-4 py-3 ${
                          entry.isCorrect
                            ? 'border-success/20 bg-success/10'
                            : 'border-danger/20 bg-danger/10'
                        }`}
                      >
                        <div
                          className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            entry.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          Feedback &amp; Explanation
                        </div>
                        <p className="text-sm text-white/95 leading-relaxed">
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
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-5 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 text-warning border border-warning/20">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
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
            <div className="rounded-2xl border border-white/5 bg-black/20 p-8 text-center text-sm text-text-muted">
              <CheckCircle size={32} className="mx-auto mb-2 text-primary opacity-60" />
              <p className="font-semibold text-white">All caught up!</p>
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
                    className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[linear-gradient(180deg,rgba(12,18,15,0.95),rgba(8,12,10,0.95))] shadow-lg transition hover:border-white/15"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white block">
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
                          className="flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-xs font-bold text-[#032418] shadow-md transition hover:bg-emerald-400 active:scale-95"
                        >
                          <CheckCircle size={14} />
                          Mark Reviewed
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/15 px-3.5 py-1.5 text-xs font-bold text-emerald-300">
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
                            className={`relative overflow-hidden rounded-xl border p-4 transition ${
                              seg.reviewed
                                ? 'border-white/5 bg-white/[0.01] opacity-40'
                                : 'border-warning/20 bg-warning/[0.06]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-warning">
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
                                  : 'font-medium text-white/95'
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
