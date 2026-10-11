import { motion, AnimatePresence } from 'framer-motion';
import { FastForward, Rewind, Play, Pause, Hand, Sparkles } from 'lucide-react';

const GESTURE_CONFIG = {
  SKIP_FORWARD_10S: {
    icon: FastForward,
    label: '+10s Skipped',
    subtext: 'Open Palm 🖐️ detected',
    color: 'from-emerald-500 to-teal-500',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/20',
  },
  SKIP_BACKWARD_10S: {
    icon: Rewind,
    label: '-10s Rewound',
    subtext: 'Peace Sign ✌️ detected',
    color: 'from-cyan-500 to-blue-500',
    borderColor: 'border-cyan-500/40',
    glowColor: 'shadow-cyan-500/20',
  },
  PLAY_VIDEO: {
    icon: Play,
    label: 'Playback Resumed',
    subtext: 'Thumbs Up 👍 detected',
    color: 'from-emerald-500 to-green-500',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/20',
  },
  PAUSE_VIDEO: {
    icon: Pause,
    label: 'Video Paused',
    subtext: 'Closed Fist ✊ detected',
    color: 'from-rose-500 to-amber-500',
    borderColor: 'border-rose-500/40',
    glowColor: 'shadow-rose-500/20',
  },
  TOGGLE_PLAY_PAUSE: {
    icon: Play,
    label: 'Play / Pause',
    subtext: 'Gesture detected',
    color: 'from-purple-500 to-indigo-500',
    borderColor: 'border-purple-500/40',
    glowColor: 'shadow-purple-500/20',
  },
};

const GestureActionHUD = ({ activeGesture }) => {
  if (!activeGesture) return null;

  const config = GESTURE_CONFIG[activeGesture.action] || {
    icon: Hand,
    label: activeGesture.label || 'Hand Gesture Detected',
    subtext: 'Camera gesture control',
    color: 'from-emerald-500 to-teal-500',
    borderColor: 'border-emerald-500/40',
    glowColor: 'shadow-emerald-500/20',
  };

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 z-40"
      >
        <div
          className={`flex items-center gap-3 rounded-full border ${config.borderColor} bg-slate-900/90 px-5 py-2.5 shadow-xl ${config.glowColor} backdrop-blur-md text-white`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r ${config.color} text-black font-bold shadow-md`}>
            <Icon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-white leading-none">
              <span>{config.label}</span>
              <Sparkles size={12} className="text-amber-300" />
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">{config.subtext}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GestureActionHUD;
