import { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Filter,
  Flame,
  Globe,
  GraduationCap,
  Hand,
  Layers,
  Mail,
  Network,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Vibrate,
  X,
  Database,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSignLearningPlan } from '../../services/signCourseApi';

const ICON_MAP = {
  Cpu: Cpu,
  Layers: Layers,
  Network: Network,
  Globe: Globe,
  Mail: Mail,
  Database: Database,
  ShieldCheck: ShieldCheck,
};

const SignLearningPlanModal = ({
  isOpen = false,
  onClose,
  studentId = 'student_demo_123',
  planData = null,
  onStartKeywordPractice,
}) => {
  const [selectedGrade, setSelectedGrade] = useState('ALL'); // 'ALL' | 'Grade 10' | 'Grade 11'
  const [internalPlan, setInternalPlan] = useState(planData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (planData) {
      setInternalPlan(planData);
      return;
    }
    if (isOpen && studentId) {
      let isSubscribed = true;
      setLoading(true);
      getSignLearningPlan(studentId)
        .then((data) => {
          if (isSubscribed) setInternalPlan(data);
        })
        .catch((err) => console.error('Failed to load sign learning plan:', err))
        .finally(() => {
          if (isSubscribed) setLoading(false);
        });
      return () => {
        isSubscribed = false;
      };
    }
  }, [isOpen, studentId, planData]);

  if (!isOpen) return null;

  const plan = internalPlan || {};
  const g10Areas = plan.grade10SyllabusAreas || [];
  const g11Areas = plan.grade11SyllabusAreas || [];

  const displayedAreas =
    selectedGrade === 'Grade 10'
      ? g10Areas
      : selectedGrade === 'Grade 11'
      ? g11Areas
      : [...g10Areas, ...g11Areas];

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-primary/40 bg-gradient-to-b from-slate-900 via-[#070d14] to-slate-950 p-6 sm:p-8 shadow-2xl text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header Banner */}
          <div className="border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-full bg-primary/20 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary border border-primary/30 flex items-center gap-1.5">
                <GraduationCap size={13} />
                O/L ICT Curriculum Grounded
              </span>
              <span className="text-xs text-slate-400">
                Grade 10 &amp; 11 National Syllabus Standards
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Personalized O/L ICT Sign Language Learning Plan
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
              Targeted sign practice plan categorized strictly by Grade 10 and Grade 11 O/L ICT
              syllabus areas with camera AI gesture validation and wristband haptic feedback.
            </p>

            {/* Quick Metrics & Actions Bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Current Mastery</div>
                  <div className="text-xl font-black font-mono text-emerald-400">
                    {plan.overallMastery || 0}%
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Syllabus Terms</div>
                  <div className="text-xl font-black font-mono text-primary">
                    {plan.completedKeywordsCount || 0} / {plan.totalKeywords || 8} Mastered
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Target Standard</div>
                  <div className="text-xl font-black font-mono text-amber-400">O/L DISTINCTION</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grade Filter Tabs */}
          <div className="pt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-primary" />
              <span className="text-xs font-bold text-slate-300">Filter Syllabus Scope:</span>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedGrade('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedGrade === 'ALL'
                    ? 'bg-primary text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Complete O/L Syllabus (7 Units)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGrade('Grade 10')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedGrade === 'Grade 10'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Grade 10 Units ({g10Areas.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedGrade('Grade 11')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedGrade === 'Grade 11'
                    ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Grade 11 Units ({g11Areas.length})
              </button>
            </div>
          </div>

          {/* Categorized Syllabus Areas Grid */}
          <div className="mt-5 space-y-4">
            {displayedAreas.map((area, idx) => {
              const isG10 = area.grade === 'Grade 10';
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 hover:border-primary/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5 ${
                          isG10
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        }`}
                      >
                        {area.grade}
                      </span>
                      <div>
                        <h4 className="text-base font-bold text-white">{area.topicTitle}</h4>
                        <div className="text-xs text-primary font-medium mt-0.5">
                          {area.syllabusUnit}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {area.masteryPercentage}% Mastered
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {area.completedCount} of {area.totalCount} Terms Passed
                      </div>
                    </div>
                  </div>

                  {/* Exam Weight Badge & Action */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="font-semibold text-slate-400">O/L Exam Relevance:</span>
                    <span className="text-slate-200">{area.examWeight}</span>
                  </div>

                  {/* Target Keywords in this Syllabus Unit */}
                  <div className="pt-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Syllabus Keywords &amp; Sign Postures:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {area.targetKeywords.map((kw, kidx) => (
                        <div
                          key={kidx}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {kw.isCompleted ? (
                                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                              ) : (
                                <Hand size={14} className="text-amber-400 shrink-0" />
                              )}
                              <span className="font-mono text-sm font-black text-white uppercase">
                                {kw.keyword}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium">
                                {kw.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 truncate">
                              {kw.englishMeaning} · {kw.examRelevance}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onStartKeywordPractice) onStartKeywordPractice(kw.keyword);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/20 hover:bg-primary text-primary hover:text-slate-950 text-xs font-bold transition-all shrink-0 cursor-pointer"
                            title={`Practice ASL sign for ${kw.keyword}`}
                          >
                            <span>Practice</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Smart Wristband Haptic Coaching Profile */}
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-cyan-200">
                    <Vibrate size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-cyan-300">Wristband Haptic Calibration: </span>
                      <span>{area.wristbandHapticFocus}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4-Week Exam Revision Calendar */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Calendar size={16} className="text-primary" />
              <span>Recommended 4-Week O/L ICT Sign Language Revision Schedule</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(plan.weeklyRevisionSchedule || []).map((week, widx) => (
                <div
                  key={widx}
                  className="p-3.5 rounded-xl border border-white/5 bg-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-primary">{week.week}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock size={11} /> {week.targetMinutes} mins/session
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">{week.focus}</div>
                  <div className="text-[11px] text-slate-300">{week.syllabusTopic}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    Mode: {week.wristbandMode}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official O/L Exam Tips */}
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <Sparkles size={16} />
              <span>O/L ICT Examination Sign Gesture Guidelines</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              {(plan.examTips || []).map((tip, tidx) => (
                <li key={tidx} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SignLearningPlanModal;
