import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Flame,
  LineChart,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

const KnowledgeGrowthGraph = ({
  growthData,
  onSelectTopic,
}) => {
  const [activeTab, setActiveTab] = useState('mastery'); // 'mastery' | 'trends'

  if (!growthData) return null;

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'Master':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Proficient':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'Developing':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const overallMastery = growthData.overallMastery || 74;
  const overallAttention = growthData.overallAttention || 78;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-5 shadow-xl backdrop-blur-md">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_15px_rgba(95,191,151,0.3)]">
            <BrainCircuit size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Knowledge Growth & Mastery Matrix
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/20">
                <Flame size={12} className="text-amber-400" />
                {growthData.growthStreakDays || 5}d Streak
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Live correlation between attention stability and syllabus concept mastery.
            </p>
          </div>
        </div>

        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            onClick={() => setActiveTab('mastery')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
              activeTab === 'mastery'
                ? 'bg-primary text-[#032418] shadow-sm'
                : 'text-text-muted hover:text-white'
            }`}
          >
            Topic Mastery
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
              activeTab === 'trends'
                ? 'bg-primary text-[#032418] shadow-sm'
                : 'text-text-muted hover:text-white'
            }`}
          >
            7-Day Growth Curve
          </button>
        </div>
      </div>

      {/* Top summary stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-black/30 p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Overall Mastery
          </div>
          <div className="mt-1 text-xl font-extrabold text-primary">
            {overallMastery}%
          </div>
          <div className="mt-0.5 text-[10px] text-emerald-400">
            ▲ +14% this week
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/30 p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Attention Index
          </div>
          <div className="mt-1 text-xl font-extrabold text-amber-400">
            {overallAttention}%
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            Webcam stability
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/30 p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Strongest Topic
          </div>
          <div className="mt-1 truncate text-xs font-bold text-emerald-300">
            {growthData.strongestTopic || 'Cyber Security'}
          </div>
          <div className="mt-0.5 text-[10px] text-emerald-400">
            Master Level
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/30 p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Needs Revision
          </div>
          <div className="mt-1 truncate text-xs font-bold text-amber-300">
            {growthData.needsAttentionTopic || 'Databases'}
          </div>
          <div className="mt-0.5 text-[10px] text-amber-400">
            Developing Level
          </div>
        </div>
      </div>

      {/* Tab: Mastery bars */}
      {activeTab === 'mastery' && (
        <div className="mt-5 space-y-3">
          {(growthData.topics || []).map((topic) => (
            <div
              key={topic.topicId}
              onClick={() => onSelectTopic && onSelectTopic(topic.topicId, topic.topicName)}
              className="group cursor-pointer rounded-xl border border-white/5 bg-black/20 p-3 transition-all hover:border-primary/40 hover:bg-black/40"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                    {topic.topicName}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.2 text-[9px] font-bold ${getLevelBadgeClass(
                      topic.level
                    )}`}
                  >
                    {topic.level}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-text-muted text-[11px]">
                    Att: <strong className="text-amber-300">{topic.attentionCorrelation}%</strong>
                  </span>
                  <span className="font-extrabold text-primary">
                    {topic.masteryScore}%
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#5fbf97,#22c55e)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${topic.masteryScore}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: 7-day Growth curve */}
      {activeTab === 'trends' && (
        <div className="mt-5 rounded-xl border border-white/5 bg-black/30 p-4">
          <div className="flex items-center justify-between text-xs text-text-muted mb-4">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <TrendingUp size={14} className="text-primary" />
              7-Day Mastery vs. Attention Trend
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> Mastery %
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Attention %
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4 border-b border-white/10 pb-2">
            {(growthData.growthHistory || []).map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="flex items-end gap-1 w-full justify-center h-28">
                  {/* Mastery Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.mastery / 100) * 100}%` }}
                    className="w-3 rounded-t-md bg-primary/80"
                    title={`Mastery: ${item.mastery}%`}
                  />
                  {/* Attention Bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(item.attention / 100) * 100}%` }}
                    className="w-3 rounded-t-md bg-amber-400/70"
                    title={`Attention: ${item.attention}%`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-text-muted">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-text-muted">
            Higher student webcam attention during lessons directly accelerates mastery growth curve.
          </p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGrowthGraph;
