import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import useStore from '../../../shared-app/utils/useStore';

/**
 * AttentionHeatmap
 * Maps session attention events onto a horizontal timeline bar.
 * Color-codes each segment: green (attentive), amber (distracted), red (phone/drowsy).
 */
const AttentionHeatmap = ({ videoDuration = 0 }) => {
  const { attentionEvents, isWebcamActive } = useStore();

  const segments = useMemo(() => {
    if (!attentionEvents.length || !videoDuration) return [];

    // Build 100 equal buckets across the video duration
    const BUCKETS = 100;
    const bucketDuration = videoDuration / BUCKETS;
    const buckets = Array.from({ length: BUCKETS }, () => ({
      attentive: 0, not_attentive: 0, reason: 'ok', total: 0,
    }));

    for (const evt of attentionEvents) {
      const idx = Math.min(Math.floor(evt.timestamp / bucketDuration), BUCKETS - 1);
      if (idx < 0) continue;
      buckets[idx].total++;
      if (evt.status === 'attentive') {
        buckets[idx].attentive++;
      } else {
        buckets[idx].not_attentive++;
        // Track worst reason
        if (evt.reason === 'phone_detected' || evt.reason === 'drowsy') {
          buckets[idx].reason = evt.reason;
        } else if (buckets[idx].reason === 'ok') {
          buckets[idx].reason = evt.reason;
        }
      }
    }

    return buckets.map((b, i) => {
      let color;
      if (b.total === 0) {
        color = 'rgba(255,255,255,0.06)';
      } else if (b.not_attentive === 0) {
        color = '#5fbf97';   // fully attentive
      } else if (b.reason === 'phone_detected') {
        color = '#ef4444';   // phone
      } else if (b.reason === 'drowsy') {
        color = '#f59e0b';   // drowsy
      } else if (b.attentive >= b.not_attentive) {
        color = '#a3e4c1';   // mostly attentive
      } else {
        color = '#fb923c';   // mostly distracted
      }
      return { index: i, color, ...b };
    });
  }, [attentionEvents, videoDuration]);

  if (!isWebcamActive) return null;

  if (!videoDuration || segments.length === 0) {
    return (
      <div className="rounded-[20px] bg-black/20 px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
          <Activity size={12} />
          Attention Heatmap
        </div>
        <div className="h-6 w-full rounded-lg bg-white/5 flex items-center justify-center">
          <span className="text-[10px] text-text-muted">Play video to see heatmap</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-black/20 px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
          <Activity size={12} />
          Attention Heatmap
        </div>
        <div className="flex items-center gap-3 text-[9px] text-text-muted">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#5fbf97]" />Focused</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#fb923c]" />Distracted</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#ef4444]" />Phone</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-[#f59e0b]" />Drowsy</span>
        </div>
      </div>

      {/* Heatmap bar */}
      <div className="flex h-8 w-full overflow-hidden rounded-lg gap-[1px]">
        {segments.map((seg) => (
          <motion.div
            key={seg.index}
            className="flex-1 cursor-default rounded-sm"
            style={{ backgroundColor: seg.color }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: seg.index * 0.003, duration: 0.2 }}
            title={
              seg.total === 0
                ? `${Math.round(seg.index * videoDuration / 100)}s — no data`
                : `${Math.round(seg.index * videoDuration / 100)}s — ${seg.attentive > seg.not_attentive ? 'attentive' : seg.reason}`
            }
          />
        ))}
      </div>

      {/* Time labels */}
      <div className="mt-1.5 flex justify-between text-[9px] text-text-muted">
        <span>0s</span>
        <span>{Math.round(videoDuration / 4)}s</span>
        <span>{Math.round(videoDuration / 2)}s</span>
        <span>{Math.round((videoDuration * 3) / 4)}s</span>
        <span>{Math.round(videoDuration)}s</span>
      </div>
    </div>
  );
};

export default AttentionHeatmap;
