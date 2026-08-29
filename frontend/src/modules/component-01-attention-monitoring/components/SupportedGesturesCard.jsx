import { motion } from 'framer-motion';
import {
  Hand,
  Sparkles,
  FastForward,
  Rewind,
  Play,
  Pause,
  Radio,
  Zap,
} from 'lucide-react';
import useStore from '../../shared-app/utils/useStore';

const GESTURE_ITEMS = [
  {
    id: 'SKIP_FORWARD_10S',
    emoji: '🖐️',
    name: 'Open Palm',
    action: 'Skip Forward',
    delta: '+10s',
    keyHint: 'Right Arrow / Palm',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    activeGlow: 'border-emerald-400 bg-emerald-500/25 shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400/60',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    iconComp: FastForward,
  },
  {
    id: 'SKIP_BACKWARD_10S',
    emoji: '✌️',
    name: 'Peace Sign',
    action: 'Rewind Video',
    delta: '-10s',
    keyHint: 'Left Arrow / Peace',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    activeGlow: 'border-cyan-400 bg-cyan-500/25 shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400/60',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    iconComp: Rewind,
  },
  {
    id: 'TOGGLE_PLAY_PAUSE',
    emoji: '✊',
    name: 'Fist or Thumbs Up',
    action: 'Play / Pause Video',
    delta: 'Play / Pause',
    keyHint: 'Toggle Play/Pause',
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    border: 'border-purple-500/30 hover:border-purple-400/60',
    activeGlow: 'border-purple-400 bg-purple-500/25 shadow-lg shadow-purple-500/30 ring-1 ring-purple-400/60',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    iconComp: Play,
  },
];

const SupportedGesturesCard = () => {
  const { gestureAction, liveSignText, isWebcamActive } = useStore();

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl transition-all">
      {/* Decorative ambient neon background glows */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="pointer-events-none absolute left-1/2 -bottom-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl" />

      <div className="relative flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Branding & Camera Status Header */}
        <div className="flex items-center justify-between gap-3 lg:shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 ring-1 ring-emerald-500/30 shadow-inner">
              <Hand className="h-5 w-5 animate-pulse" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Smart Gesture Controls
                </h4>
                <Sparkles size={13} className="text-amber-400" />
              </div>
              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                <Radio size={11} className={isWebcamActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
                {isWebcamActive ? 'AI Camera Tracking Active' : 'Enable Webcam for Gestures'}
              </p>
            </div>
          </div>

          {/* Active Gesture Live Pill */}
          {gestureAction && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              <Zap size={12} className="animate-bounce text-amber-300" />
              <span>{liveSignText || 'Gesture Triggered'}</span>
            </motion.div>
          )}
        </div>

        {/* Center/Right: 3 Interactive Gesture Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
          {GESTURE_ITEMS.map((g) => {
            const isActive = gestureAction === g.id;
            const IconComponent = g.iconComp;

            return (
              <motion.div
                key={g.id}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                animate={{
                  scale: isActive ? 1.03 : 1,
                }}
                className={`group relative overflow-hidden rounded-xl border p-2.5 transition-all duration-200 ${
                  isActive
                    ? g.activeGlow
                    : `bg-white/[0.03] ${g.border} hover:bg-white/[0.06] hover:shadow-lg`
                }`}
              >
                {/* Subtle gradient fill */}
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${g.gradient} opacity-40`} />

                <div className="relative flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Emoji Avatar Box */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950/70 border border-white/10 text-lg shadow-inner group-hover:scale-110 transition-transform">
                      {g.emoji}
                    </div>

                    {/* Text Details */}
                    <div className="min-w-0 truncate">
                      <p className="text-xs font-bold text-white truncate">{g.name}</p>
                      <p className="text-[10px] font-medium text-slate-300 truncate mt-0.5">
                        {g.action}
                      </p>
                    </div>
                  </div>

                  {/* Delta Action Pill */}
                  <div
                    className={`shrink-0 flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide font-mono shadow-sm ${g.badge}`}
                  >
                    <IconComponent size={11} />
                    <span>{g.delta}</span>
                  </div>
                </div>

                {/* Bottom Active Glow Bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SupportedGesturesCard;
