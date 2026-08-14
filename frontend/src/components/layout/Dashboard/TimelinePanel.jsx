import { motion } from 'framer-motion';
import DashboardPanel from './DashboardPanel';
import Header from './Header';

const TimelinePanel = ({ icon, title, description, currentPlaybackTime, timelineDuration, timelineProgress, segments }) => {
  return (
    <DashboardPanel>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Header label="Timeline" icon={icon} title={title} description={description} />
        <div className="w-fit rounded-2xl bg-black/25 px-4 py-3 text-left sm:w-auto sm:text-right border border-white/5">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Current Time</div>
          <div className="mt-1 text-[1.6rem] sm:text-[2rem] font-black text-white">{Math.floor(currentPlaybackTime)}s</div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${timelineProgress}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(74,222,128,0.92),rgba(110,231,183,0.88))]"
          />
        </div>
        <div className="text-sm font-semibold text-white">
          {Math.floor(currentPlaybackTime)}s / {timelineDuration}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {segments.length === 0 ? (
          <div className="rounded-[20px] bg-black/20 px-5 py-8 text-sm text-text-muted">
            Timeline markers will appear once transcript segments are available.
          </div>
        ) : (
          segments.map((segment, index) => (
            <div
              key={`${segment.start_time}-${index}`}
              className={`rounded-[18px] px-4 py-3 ${
                segment.state === 'current' ? 'bg-primary/[0.08]' : 'bg-black/18'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-1 h-4 w-4 rounded-full ${
                    segment.state === 'completed'
                      ? 'bg-primary'
                      : segment.state === 'current'
                        ? 'border-4 border-primary bg-transparent'
                        : 'bg-white/12'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="text-base font-semibold text-white">
                      {Math.floor(segment.start_time)}s - {Math.floor(segment.end_time)}s
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                      {segment.state}
                    </div>
                  </div>
                  <p className="dashboard-text-wrap mt-1 text-sm text-text-muted">{segment.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardPanel>
  );
};

export default TimelinePanel;
