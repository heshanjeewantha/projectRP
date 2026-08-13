import { useCallback, useEffect, useState } from 'react';
import { getMissedHistory, markReviewed } from '../services/missedApi';
import { getStudentPopupAnswers } from '../../component-02-knowledge-graph-question-system/services/popupApi';
import useStore from '../../shared-app/utils/useStore';
import { History as HistoryIcon, CheckCircle, Clock, Calendar, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const History = () => {
  const [history, setHistory] = useState([]);
  const [popupHistory, setPopupHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = useStore(state => state.userId);

  const loadHistory = useCallback(async () => {
    try {
      const res = await getMissedHistory(userId);
      setHistory(res.data || []);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadPopupHistory = useCallback(async () => {
    try {
      const res = await getStudentPopupAnswers(userId);
      setPopupHistory(res || []);
    } catch (e) {
      console.error("Failed to load popup history", e);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="px-6 pb-12 max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-4">
            <motion.div 
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              className="bg-primary/20 p-3 rounded-2xl text-primary"
            >
              <HistoryIcon size={28} />
            </motion.div>
            Learning History
          </h2>
          <p className="text-text-muted mt-2 text-lg">Tracks segments where you needed extra focus.</p>
        </div>
      </div>

      <div className="space-y-8">
        <motion.div variants={cardVariants} className="glass-panel p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-xl flex items-center gap-3">
                <BrainCircuit size={22} className="text-primary" />
                Popup Chat History
              </h3>
              <p className="text-text-muted mt-2 text-sm">Every concept popup is shown as a short learning conversation.</p>
            </div>
            <span className="text-[10px] bg-primary/15 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-[0.2em]">
              Knowledge Graph
            </span>
          </div>

          {popupHistory.length === 0 ? (
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-5 py-8 text-center text-text-muted">
              No popup chat history yet.
            </div>
          ) : (
            <div className="space-y-4">
              {popupHistory.map((entry) => (
                <div key={entry.id} className="rounded-[28px] border border-white/8 bg-black/20 px-5 py-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-text-muted">{entry.conceptName}</span>
                    <span className={`text-[10px] uppercase tracking-[0.2em] font-bold px-2.5 py-1 rounded-full ${
                      entry.isCorrect ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    }`}>
                      {entry.isCorrect ? 'Correct' : 'Review'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex">
                      <div className="max-w-[84%] rounded-[22px] rounded-tl-md border border-primary/15 bg-primary/10 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-1">Tutor</div>
                        <p className="text-sm text-white leading-relaxed">{entry.questionText}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="max-w-[84%] rounded-[22px] rounded-tr-md border border-accent/15 bg-accent/10 px-4 py-3 text-right">
                        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent mb-1">Student</div>
                        <p className="text-sm text-white leading-relaxed">{entry.selectedAnswer}</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className={`max-w-[88%] rounded-[22px] rounded-tl-md border px-4 py-3 ${
                        entry.isCorrect ? 'border-success/15 bg-success/10' : 'border-danger/15 bg-danger/10'
                      }`}>
                        <div className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1 ${
                          entry.isCorrect ? 'text-success' : 'text-danger'
                        }`}>
                          Feedback
                        </div>
                        <p className="text-sm text-white/95 leading-relaxed">{entry.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="glass-panel p-12 text-center text-text-muted">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="inline-block mb-4">
              <Clock size={32} />
            </motion.div>
            <p className="font-medium">Fetching your learning logs...</p>
          </div>
        ) : history.length === 0 ? (
          <motion.div variants={cardVariants} className="glass-panel p-16 text-center text-text-muted">
            <HistoryIcon size={64} className="mx-auto mb-6 opacity-10" />
            <p className="text-xl font-bold text-white mb-2">No history yet</p>
            <p className="max-w-xs mx-auto opacity-60">Complete your first AI-tracked lecture to see your progress here.</p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {history.map(session => (
                <motion.div 
                  key={session._id} 
                  variants={cardVariants}
                  layout
                  className="glass-panel overflow-hidden border-white/5 hover:border-primary/20 transition-colors group"
                >
                  <div className="bg-white/[0.02] px-8 py-5 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-text-main block">
                          {new Date(session.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
                          {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    {session.segments.some(s => !s.reviewed) ? (
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMarkReviewed(session._id)}
                        className="text-xs bg-success text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-success/20 flex items-center gap-2"
                      >
                        <CheckCircle size={14} />
                        Mark Reviewed
                      </motion.button>
                    ) : (
                      <div className="text-xs font-bold text-success flex items-center gap-2 bg-success/10 px-4 py-2 rounded-xl">
                        <CheckCircle size={14} />
                        Completed
                      </div>
                    )}
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md font-mono text-text-muted uppercase tracking-tighter">Session ID</span>
                      <h4 className="font-mono text-xs text-text-muted">{session._id}</h4>
                    </div>
                    
                    <div className="grid gap-4">
                      {session.segments.map((seg, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                            seg.reviewed 
                              ? 'bg-white/[0.01] border-white/5 opacity-40' 
                              : 'bg-warning/5 border-warning/20 shadow-sm'
                          }`}
                        >
                          {!seg.reviewed && <div className="absolute top-0 left-0 w-1 h-full bg-warning/50" />}
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <Clock size={12} className={seg.reviewed ? 'text-text-muted' : 'text-warning'} />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${seg.reviewed ? 'text-text-muted' : 'text-warning'}`}>
                                {Math.floor(seg.start_time)}s — {Math.floor(seg.end_time)}s
                              </span>
                            </div>
                            {seg.reviewed && <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Reviewed</span>}
                          </div>
                          <p className={`text-sm leading-relaxed ${seg.reviewed ? 'text-text-muted italic line-through' : 'text-text-main font-medium'}`}>
                            {seg.transcript_text}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default History;
