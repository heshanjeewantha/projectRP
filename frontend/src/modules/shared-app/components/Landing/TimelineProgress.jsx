import { Clock3, Radar } from 'lucide-react';
import { motion } from 'framer-motion';

const TimelineProgress = ({ transcript = [], currentPlaybackTime = 0 }) => {
  const visibleSegments = transcript.slice(0, 6);
  const duration = visibleSegments.length > 0 ? visibleSegments[visibleSegments.length - 1].end_time : 0;
  const progress = duration ? Math.min((currentPlaybackTime / duration) * 100, 100) : 0;

  return (
    <div className="rounded-[28px] bg-black/20 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/16 bg-primary/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            <Radar size={12} />
            Smart Timeline
          </div>
          <h4 className="mt-3 text-xl font-black text-white">Real-time lesson flow</h4>
          <p className="mt-2 text-sm text-text-muted">The timeline tracks playback progress and transcript checkpoints as the lesson moves forward.</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-text-muted font-bold">Current Time</div>
          <div className="mt-2 text-2xl font-black text-white">{Math.floor(currentPlaybackTime)}s</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-3 rounded-full bg-white/6 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(52,211,153,0.85),rgba(134,239,172,0.95))] shadow-[0_0_22px_rgba(52,211,153,0.35)]"
          />
        </div>

        <div className="mt-5 grid gap-3">
          {visibleSegments.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-text-muted">
              Timeline markers will appear once transcript segments are available.
            </div>
          ) : (
            visibleSegments.map((segment, index) => {
              const isActive = currentPlaybackTime >= segment.start_time && currentPlaybackTime <= segment.end_time;

              return (
                <motion.div
                  key={`${segment.start_time}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className={`rounded-2xl px-4 py-4 transition-all ${
                    isActive
                      ? 'bg-primary/10 shadow-[0_0_24px_rgba(52,211,153,0.08)]'
                      : 'bg-white/[0.03]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${isActive ? 'bg-primary/16 text-primary' : 'bg-white/6 text-text-muted'}`}>
                        <Clock3 size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {Math.floor(segment.start_time)}s - {Math.floor(segment.end_time)}s
                        </div>
                        <p className="mt-1 text-sm text-text-muted leading-relaxed">{segment.text}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                        Active
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineProgress;
