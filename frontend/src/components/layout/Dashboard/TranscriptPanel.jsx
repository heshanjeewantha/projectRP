import { motion } from 'framer-motion';
import DashboardPanel from './DashboardPanel';
import Header from './Header';

const TranscriptPanel = ({ icon, title, description, segments = [], currentPlaybackTime = 0, formatClock }) => {
  return (
    <DashboardPanel>
      <Header label="Transcript" icon={icon} title={title} description={description} />

      <div className="custom-scrollbar mt-6 grid max-h-[420px] gap-3 overflow-y-auto pr-1">
        {segments.length === 0 ? (
          <div className="rounded-[20px] bg-black/20 px-5 py-8 text-sm text-text-muted">
            Waiting for transcript generation...
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
                className={`rounded-[20px] px-4 py-4 transition-all duration-300 ${
                  isCurrent ? 'bg-primary/[0.08]' : 'bg-black/18'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="rounded-xl bg-primary/12 px-3 py-1 text-sm font-bold text-primary">
                    {formatClock(segment.start_time)}
                  </span>
                  <p className="dashboard-text-wrap flex-1 text-base text-white/92">
                    <span className="font-semibold text-primary">[{segment.label || 'LESSON'}]</span>{' '}
                    <span>{segment.text}</span>
                  </p>
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
