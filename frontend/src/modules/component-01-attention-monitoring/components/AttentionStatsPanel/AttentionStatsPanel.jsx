import { motion } from 'framer-motion';
import {
  Eye, Moon, Smartphone, Activity, Navigation,
  TrendingUp, AlertTriangle, CheckCircle,
} from 'lucide-react';
import useStore from '../../../shared-app/utils/useStore';

// ── Sub-components ────────────────────────────────────────────────────────────

const MetricRow = ({ icon: Icon, label, value, sub, color = '#8b8fa8' }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-black/20 px-4 py-3">
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${color}22` }}
    >
      <Icon size={15} style={{ color }} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
      {sub && <div className="text-[10px] text-text-muted">{sub}</div>}
    </div>
  </div>
);

const GaugeBar = ({ label, value, max = 100, color, warning }) => {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = warning ? '#ef4444' : color;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-text-muted">{label}</span>
        <span style={{ color: barColor }}>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </div>
    </div>
  );
};

const StatusBadge = ({ status, reason }) => {
  const configs = {
    ok:             { label: 'Focused',       color: '#5fbf97', bg: '#5fbf9715', icon: CheckCircle },
    eyes_closed:    { label: 'Eyes Closed',   color: '#f59e0b', bg: '#f59e0b15', icon: Eye },
    drowsy:         { label: 'Drowsy',        color: '#f59e0b', bg: '#f59e0b15', icon: Moon },
    yawning:        { label: 'Yawning',       color: '#fb923c', bg: '#fb923c15', icon: Moon },
    head_turned:    { label: 'Looking Away',  color: '#a78bfa', bg: '#a78bfa15', icon: Navigation },
    phone_detected: { label: 'Using Phone',   color: '#ef4444', bg: '#ef444415', icon: Smartphone },
    no_face:        { label: 'No Face',       color: '#8b8fa8', bg: '#8b8fa815', icon: AlertTriangle },
    unknown:        { label: 'Calibrating',   color: '#8b8fa8', bg: '#8b8fa815', icon: Activity },
  };

  const cfg = configs[reason] || configs.unknown;
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
      style={{ backgroundColor: cfg.bg }}
    >
      <Icon size={15} style={{ color: cfg.color }} />
      <span className="text-sm font-semibold" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const AttentionStatsPanel = () => {
  const {
    attentionStatus,
    attentionDetail,
    drowsinessScore,
    perclos,
    phoneDetected,
    phoneDetectedCount,
    yawning,
    gazeDirection,
    blinkRate,
    engagementScore,
    attentionEvents,
    isWebcamActive,
  } = useStore();

  const reason = attentionDetail?.reason ?? 'unknown';
  const ear    = attentionDetail?.ear    ?? 0;
  const mar    = attentionDetail?.mar    ?? 0;

  // Distraction breakdown from session events
  const totalEvents    = attentionEvents.length || 1;
  const distractedEvts = attentionEvents.filter((e) => e.status === 'not_attentive').length;
  const sessionAttentionPct = Math.round(((totalEvents - distractedEvts) / totalEvents) * 100);

  // Gaze label
  const gazeLabel = {
    center: '👁️ On Screen',
    left:   '← Looking Left',
    right:  'Looking Right →',
    up:     '↑ Looking Up',
    down:   '↓ Looking Down',
    unknown: '? Unknown',
  }[gazeDirection] || gazeDirection;

  if (!isWebcamActive) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] bg-black/20 px-5 py-10 text-center">
        <Activity size={28} className="opacity-30 text-text-muted" />
        <p className="text-sm text-text-muted">Start webcam to see attention stats</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-3"
    >
      {/* Current Status */}
      <StatusBadge status={attentionStatus} reason={reason} />

      {/* Engagement + PERCLOS gauges */}
      <div className="rounded-[20px] bg-black/20 px-5 py-4 flex flex-col gap-3">
        <GaugeBar
          label="Engagement"
          value={engagementScore}
          max={100}
          color="#5fbf97"
          warning={engagementScore < 40}
        />
        <GaugeBar
          label="Drowsiness (PERCLOS)"
          value={Math.round(drowsinessScore * 100)}
          max={100}
          color="#f59e0b"
          warning={drowsinessScore >= 0.35}
        />
        <GaugeBar
          label="Session Attention"
          value={sessionAttentionPct}
          max={100}
          color="#818cf8"
          warning={sessionAttentionPct < 50}
        />
      </div>

      {/* Metrics grid */}
      <div className="grid gap-2">
        <MetricRow
          icon={Eye}
          label="Blink Rate"
          value={blinkRate > 0 ? `${Math.round(blinkRate)} bpm` : '—'}
          sub="Normal: 12–20 bpm"
          color={blinkRate > 0 && (blinkRate < 10 || blinkRate > 25) ? '#f59e0b' : '#5fbf97'}
        />
        <MetricRow
          icon={Navigation}
          label="Gaze Direction"
          value={gazeLabel}
          color={gazeDirection === 'center' ? '#5fbf97' : '#a78bfa'}
        />
        <MetricRow
          icon={Smartphone}
          label="Phone Detections"
          value={phoneDetectedCount > 0 ? `${phoneDetectedCount} times` : 'None'}
          sub="This session"
          color={phoneDetectedCount > 0 ? '#ef4444' : '#5fbf97'}
        />
        <MetricRow
          icon={Moon}
          label="Yawning"
          value={yawning ? 'Detected' : 'None'}
          color={yawning ? '#fb923c' : '#5fbf97'}
        />
      </div>

      {/* EAR / MAR debug metrics */}
      <div className="rounded-[20px] bg-black/20 px-5 py-4">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
          Raw Metrics
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'EAR', value: ear.toFixed(3), warn: ear < 0.21, note: 'Eye Ratio' },
            { label: 'MAR', value: mar.toFixed(3), warn: mar > 0.6,  note: 'Mouth Ratio' },
            { label: 'PERCLOS', value: `${Math.round(perclos * 100)}%`, warn: perclos > 0.35, note: 'Eye Closure %' },
            { label: 'Engagement', value: `${engagementScore}`, warn: engagementScore < 40, note: '/100' },
          ].map(({ label, value, warn, note }) => (
            <div key={label} className="rounded-xl bg-black/20 px-3 py-2 text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{label}</div>
              <div
                className="mt-0.5 text-base font-bold"
                style={{ color: warn ? '#f59e0b' : '#5fbf97' }}
              >
                {value}
              </div>
              <div className="text-[9px] text-text-muted">{note}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AttentionStatsPanel;
