import { motion } from 'framer-motion';
import DashboardPanel from './DashboardPanel';
import Header from './Header';

const TranscriptPanel = ({ icon, title, description, segments = [], currentPlaybackTime = 0, formatClock }) => {
  return (
    <DashboardPanel>
      <Header label="Transcript" icon={icon} title={title} description={description} />

      <div className="custom-scrollbar mt-6 flex flex-col max-h-[440px] gap-3 overflow-y-auto pr-1">
        {segments.length === 0 ? (
          <div className="rounded-[20px] bg-black/20 px-5 py-8 text-sm text-text-muted text-center border border-white/5">
            Waiting for sign language transcript sync...
          </div>
        ) : (
          segments.map((segment, index) => {
            const isCurrent =
              currentPlaybackTime >= segment.start_time &&
              currentPlaybackTime <= segment.end_time;

            return (
              <motion.div
                key={`${segment.start_time}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-[18px] px-4 py-3.5 border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-primary/[0.12] border-primary/30 shadow-[0_0_20px_rgba(107,194,156,0.12)]'
                    : 'bg-black/20 border-white/[0.04] hover:border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="shrink-0 rounded-xl bg-primary/15 border border-primary/20 px-3 py-1 text-xs font-bold tracking-wider text-primary">
                    {formatClock(segment.start_time)}
                  </span>
                  <div className="dashboard-text-wrap flex-1 text-sm sm:text-base text-white/92 leading-relaxed">
                    <span className="inline-block uppercase tracking-wider text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30 mr-2.5">
                      {segment.label || 'LESSON'}
                    </span>
                    <span>{segment.text}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </DashboardPanel>
  );
};

export default TranscriptPanel;
