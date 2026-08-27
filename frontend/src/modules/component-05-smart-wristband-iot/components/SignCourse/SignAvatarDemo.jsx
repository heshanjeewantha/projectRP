import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Hand,
  Info,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  Watch,
  Wifi,
  Zap,
} from 'lucide-react';

const GESTURE_VISUALS = {
  computer: {
    title: 'Typing Flutter',
    icon: '⌨️',
    category: 'Symmetrical',
    handShape: 'Open arched 5-finger hands',
    motion: 'Alternating smooth typing flutter at chest level',
    leftHand: { x: 145, y: 195, rot: -10, fingers: [true, true, true, true, true], label: 'L Arched (Keys)' },
    rightHand: { x: 255, y: 195, rot: 10, fingers: [true, true, true, true, true], label: 'R Arched (Keys)' },
    trajectoryType: 'typing-flutter',
    leftFingersState: { thumb: 'Arched', index: 'Active', middle: 'Active', ring: 'Active', pinky: 'Active' },
    rightFingersState: { thumb: 'Arched', index: 'Active', middle: 'Active', ring: 'Active', pinky: 'Active' },
    sensorFocus: 'Flex Sensors (All 5 Fingers) + Level Pitch IMU',
    mistakeAvoid: 'Do not make flat palms; keep fingers curved downward like typing on keys.',
    animVariant: {
      left: {
        y: [0, -12, 2, -10, 0],
        rotate: [-10, -6, -14, -8, -10],
        transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
      },
      right: {
        y: [-10, 2, -12, 0, -10],
        rotate: [10, 14, 6, 10, 10],
        transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
  hardware: {
    title: 'Fist Strike on Palm',
    icon: '🔨',
    category: 'Impact Strike',
    handShape: 'Left base palm + Right closed hammer fist',
    motion: 'Right fist delivers firm downward taps onto Left flat palm',
    leftHand: { x: 150, y: 215, rot: 0, fingers: [true, true, true, true, true], label: 'L Base Palm' },
    rightHand: { x: 240, y: 145, rot: -15, fingers: [false, false, false, false, false], label: 'R Fist (Hammer)' },
    trajectoryType: 'downward-tap',
    leftFingersState: { thumb: 'Flat Base', index: 'Flat Base', middle: 'Flat Base', ring: 'Flat Base', pinky: 'Flat Base' },
    rightFingersState: { thumb: 'Tucked', index: 'Folded', middle: 'Folded', ring: 'Folded', pinky: 'Folded' },
    sensorFocus: 'Right IMU Impact Spike + Left Stable Platform',
    mistakeAvoid: 'Ensure the Left base palm stays horizontal and stationary while the Right fist taps.',
    animVariant: {
      left: {
        y: [0, 4, 0, 4, 0],
        transition: { duration: 1.4, repeat: Infinity, ease: 'easeOut' },
      },
      right: {
        x: [0, -62, 0, -62, 0],
        y: [0, 56, 0, 56, 0],
        scale: [1, 1.08, 1, 1.08, 1],
        transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
  software: {
    title: 'Logic Swipe',
    icon: '📜',
    category: 'Glide Motion',
    handShape: 'Left flat palm + Right 2-finger V-shape glide',
    motion: 'Right V-shape slides horizontally across Left receiving palm',
    leftHand: { x: 140, y: 215, rot: 5, fingers: [true, true, true, true, true], label: 'L Base Palm' },
    rightHand: { x: 250, y: 175, rot: -20, fingers: [false, true, true, false, false], label: 'R V-Glide' },
    trajectoryType: 'horizontal-swipe',
    leftFingersState: { thumb: 'Flat Base', index: 'Flat Base', middle: 'Flat Base', ring: 'Flat Base', pinky: 'Flat Base' },
    rightFingersState: { thumb: 'Holding Ring', index: 'Extended (V)', middle: 'Extended (V)', ring: 'Folded', pinky: 'Folded' },
    sensorFocus: 'Right Index/Middle Flex Active + Horizontal Gyro',
    mistakeAvoid: 'Keep Right ring and pinky fingers firmly tucked with the thumb.',
    animVariant: {
      left: {
        y: [0, 0, 0],
        transition: { duration: 1.8, repeat: Infinity },
      },
      right: {
        x: [0, -95, 0],
        y: [0, 4, 0],
        transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
  database: {
    title: 'Stacked Cylinder Layers',
    icon: '🗄️',
    category: 'Vertical Tiering',
    handShape: 'Curved "C" shapes stacked in layered tiers',
    motion: 'Both hands curved into C-shapes; Right pulses downward over Left tier',
    leftHand: { x: 155, y: 225, rot: 0, fingers: [true, true, true, true, false], label: 'L Lower Tier' },
    rightHand: { x: 245, y: 155, rot: 0, fingers: [true, true, true, true, false], label: 'R Upper Tier' },
    trajectoryType: 'cylinder-stack',
    leftFingersState: { thumb: 'Curved C', index: 'Curved C', middle: 'Curved C', ring: 'Curved C', pinky: 'Curved C' },
    rightFingersState: { thumb: 'Curved C', index: 'Curved C', middle: 'Curved C', ring: 'Curved C', pinky: 'Curved C' },
    sensorFocus: 'Dual Flex Sensors at 45° Angle + Vertical Axis IMU',
    mistakeAvoid: 'Curve all fingers simultaneously to maintain the circular cylinder profile.',
    animVariant: {
      left: {
        scale: [1, 1.05, 1],
        transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
      },
      right: {
        x: [0, -35, 0],
        y: [-12, 28, -12],
        scale: [0.95, 1.05, 0.95],
        transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
  network: {
    title: 'Interlocked Nodes',
    icon: '🌐',
    category: 'Node Linkage',
    handShape: 'Middle fingers touching and interlocking nodes',
    motion: 'Fingertips touch, twist, and link together to form network nodes',
    leftHand: { x: 165, y: 190, rot: 18, fingers: [true, true, true, false, false], label: 'L Node' },
    rightHand: { x: 235, y: 190, rot: -18, fingers: [true, true, true, false, false], label: 'R Node' },
    trajectoryType: 'node-link',
    leftFingersState: { thumb: 'Open Node', index: 'Extended', middle: 'Extended (Touch)', ring: 'Folded', pinky: 'Folded' },
    rightFingersState: { thumb: 'Open Node', index: 'Extended', middle: 'Extended (Touch)', ring: 'Folded', pinky: 'Folded' },
    sensorFocus: 'Middle Finger Tip Proximity + Angular Roll Interlock',
    mistakeAvoid: 'Ensure middle fingertips firmly connect at the apex before rotating.',
    animVariant: {
      left: {
        rotate: [15, 30, 15],
        x: [0, 9, 0],
        transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
      },
      right: {
        rotate: [-15, -30, -15],
        x: [0, -9, 0],
        transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
  internet: {
    title: 'Orbital Rocking',
    icon: '🌍',
    category: 'Orbital Rotation',
    handShape: 'Open "5" hands with bent middle fingers pivoting',
    motion: 'Continuous circular orbital rocking back and forth around center',
    leftHand: { x: 155, y: 185, rot: 15, fingers: [true, true, true, true, true], label: 'L Orbit' },
    rightHand: { x: 245, y: 185, rot: -15, fingers: [true, true, true, true, true], label: 'R Orbit' },
    trajectoryType: 'orbital-circle',
    leftFingersState: { thumb: 'Spread 5', index: 'Spread 5', middle: 'Bent Pivot', ring: 'Spread 5', pinky: 'Spread 5' },
    rightFingersState: { thumb: 'Spread 5', index: 'Spread 5', middle: 'Bent Pivot', ring: 'Spread 5', pinky: 'Spread 5' },
    sensorFocus: 'Continuous IMU Gyro Yaw/Pitch Oscillation (Both Wrists)',
    mistakeAvoid: 'Keep hands separated by a few inches while rotating around the center axis.',
    animVariant: {
      left: {
        rotate: [-20, 20, -20],
        y: [-10, 10, -10],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      },
      right: {
        rotate: [20, -20, 20],
        y: [10, -10, 10],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
  email: {
    title: 'Envelope Pass-Through',
    icon: '✉️',
    category: 'Slot Pass',
    handShape: 'Left envelope slot + Right message glider sliding through',
    motion: 'Right hand passes through the Left envelope slot towards recipient',
    leftHand: { x: 140, y: 200, rot: -10, fingers: [true, true, true, false, false], label: 'L Slot' },
    rightHand: { x: 250, y: 170, rot: -25, fingers: [false, true, true, false, false], label: 'R Message' },
    trajectoryType: 'slot-pass',
    leftFingersState: { thumb: 'Slot Arc', index: 'Slot Arc', middle: 'Slot Arc', ring: 'Folded', pinky: 'Folded' },
    rightFingersState: { thumb: 'Flat Tucked', index: 'Flat Glide', middle: 'Flat Glide', ring: 'Folded', pinky: 'Folded' },
    sensorFocus: 'Right Linear Acceleration Burst Forward Through Center',
    mistakeAvoid: 'Deliver a decisive forward push motion from the chest outwards.',
    animVariant: {
      left: {
        scale: [0.98, 1.02, 0.98],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      },
      right: {
        x: [0, -95, 0],
        y: [0, 10, 0],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
  security: {
    title: 'Crossed Protective Shield',
    icon: '🛡️',
    category: 'Crossed Lock',
    handShape: 'Closed "S" fists with crossed wrists locked at chest',
    motion: 'Firm crossing lock in front of chest creating defensive barrier',
    leftHand: { x: 175, y: 185, rot: -35, fingers: [false, false, false, false, false], label: 'L Fist' },
    rightHand: { x: 225, y: 185, rot: 35, fingers: [false, false, false, false, false], label: 'R Fist' },
    trajectoryType: 'shield-lock',
    leftFingersState: { thumb: 'Closed S', index: 'Closed S', middle: 'Closed S', ring: 'Closed S', pinky: 'Closed S' },
    rightFingersState: { thumb: 'Closed S', index: 'Closed S', middle: 'Closed S', ring: 'Closed S', pinky: 'Closed S' },
    sensorFocus: 'Both Wristband IMUs Crossed Inward + High Muscle Tension',
    mistakeAvoid: 'Cross the forearms right at the wrist level, keeping fists completely closed.',
    animVariant: {
      left: {
        scale: [0.96, 1.04, 0.96],
        rotate: [-32, -40, -32],
        transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
      },
      right: {
        scale: [0.96, 1.04, 0.96],
        rotate: [32, 40, 32],
        transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
      },
    },
  },
};

const SignAvatarDemo = ({
  keyword = 'computer',
  playbackSpeed = 1,
  onSpeedChange,
}) => {
  const normKey = (keyword || 'computer').toLowerCase();
  const visual = GESTURE_VISUALS[normKey] || GESTURE_VISUALS.computer;

  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState('visual'); // 'visual', 'anatomy', 'iot'
  const [showMotionGuides, setShowMotionGuides] = useState(true);
  const [isFocusZoom, setIsFocusZoom] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const speeds = [0.5, 0.75, 1, 1.25];

  const handleSpeakCoach = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const textToSpeak = `${visual.title}. ${visual.handShape}. ${visual.motion}. Tip: ${visual.mistakeAvoid}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleReplay = () => {
    setIsPlaying(false);
    setTimeout(() => {
      setReplayKey((k) => k + 1);
      setIsPlaying(true);
    }, 40);
  };

  return (
    <div className="flex flex-col w-full rounded-2xl border border-white/10 bg-slate-900/95 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 border-b border-white/10 bg-slate-950/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary text-base shadow-sm">
              {visual.icon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate">
                  {visual.title}
                </h4>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
                  <Sparkles size={9} />
                  ASL
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 truncate block">
                Category: <span className="text-cyan-400 font-semibold">{visual.category}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsFocusZoom(!isFocusZoom)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono font-bold transition-all border ${
                isFocusZoom
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-sm shadow-amber-500/20'
                  : 'border-white/10 bg-slate-950/70 text-slate-400 hover:text-white'
              }`}
              title="Focus and zoom in on hand gestures"
            >
              {isFocusZoom ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
              <span className="hidden sm:inline">{isFocusZoom ? 'Full View' : 'Focus Hands'}</span>
            </button>
            <button
              onClick={() => setShowMotionGuides(!showMotionGuides)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono font-bold transition-all border ${
                showMotionGuides
                  ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                  : 'border-white/10 bg-slate-950/70 text-slate-400 hover:text-white'
              }`}
              title="Toggle gesture trajectory motion vectors"
            >
              <Zap size={10} />
              <span className="hidden sm:inline">Vectors</span>
            </button>
            <button
              onClick={handleSpeakCoach}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono font-bold transition-all border ${
                isSpeaking
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 animate-pulse'
                  : 'border-white/10 bg-slate-950/70 text-slate-400 hover:text-white'
              }`}
              title="Audio Speech Guide"
            >
              <Volume2 size={11} />
              <span className="hidden sm:inline">Voice</span>
            </button>
          </div>
        </div>

        {/* 3-Tab Segmented Control */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/40 border border-white/5 p-1">
          <button
            onClick={() => setActiveTab('visual')}
            className={`rounded-lg py-1 text-[11px] font-bold text-center transition-all ${
              activeTab === 'visual'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Avatar 3D
          </button>
          <button
            onClick={() => setActiveTab('anatomy')}
            className={`rounded-lg py-1 text-[11px] font-bold text-center transition-all ${
              activeTab === 'anatomy'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fingers Map
          </button>
          <button
            onClick={() => setActiveTab('iot')}
            className={`rounded-lg py-1 text-[11px] font-bold text-center transition-all ${
              activeTab === 'iot'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            IoT Sensor
          </button>
        </div>
      </div>

      {/* 2. Main Visual Canvas Stage */}
      {activeTab === 'visual' && (
        <div className="relative flex flex-col items-center justify-center w-full min-h-[300px] sm:min-h-[340px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-2 sm:p-3 overflow-hidden select-none">
          {/* Cybernetic Grid & Lighting Backdrop */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(#059669 1px, transparent 1px), linear-gradient(90deg, #059669 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          {/* Spotlight Centered Exactly on the Hands Action Area */}
          <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />

          {/* Floating Hand Identification Labels */}
          <div className="absolute top-2.5 left-3 z-10 pointer-events-none">
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/90 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-mono text-emerald-300 backdrop-blur shadow-md shadow-emerald-950/50">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              Left Hand: <strong className="text-white">{visual.leftHand.label}</strong>
            </span>
          </div>

          <div className="absolute top-2.5 right-3 z-10 pointer-events-none">
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/90 border border-cyan-500/40 px-2.5 py-1 text-[10px] font-mono text-cyan-300 backdrop-blur shadow-md shadow-cyan-950/50">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
              Right Hand: <strong className="text-white">{visual.rightHand.label}</strong>
            </span>
          </div>

          {/* SVG Animated Sign Avatar Character */}
          <div key={replayKey} className="relative w-full max-w-[390px] h-[250px] sm:h-[280px]">
            <svg
              viewBox={isFocusZoom ? '80 90 240 190' : '0 0 400 300'}
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full drop-shadow-2xl transition-all duration-500 ease-out"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <radialGradient id="avatarHeadGrad" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </radialGradient>
                <linearGradient id="avatarTorsoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#065f46" />
                  <stop offset="100%" stopColor="#022c22" />
                </linearGradient>
                <linearGradient id="bandLeftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="bandRightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                {/* Hand Neon Glow Filters */}
                <filter id="emeraldHandGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.8" />
                </filter>
                <filter id="cyanHandGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* 1. Natural Humanoid Body (Subtly dimmed to highlight hands) */}
              <g id="avatar-figure" opacity="0.75">
                {/* Torso & Shoulders */}
                <path
                  d="M 120 280 C 120 160, 280 160, 280 280 Z"
                  fill="url(#avatarTorsoGrad)"
                  stroke="#059669"
                  strokeWidth="2"
                />
                {/* Cyber Vest Accent Lines */}
                <path d="M 165 170 L 180 280" stroke="#047857" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M 235 170 L 220 280" stroke="#047857" strokeWidth="1.5" strokeDasharray="3 3" />
                <rect x="175" y="248" width="50" height="15" rx="4" fill="#0f172a" stroke="#059669" strokeWidth="1" />
                <text x="200" y="259" textAnchor="middle" fill="#6ee7b7" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  SIGN-IOT
                </text>

                {/* Upper Arms */}
                <path d="M 130 170 C 95 195, 110 235, 140 250" fill="none" stroke="#047857" strokeWidth="16" strokeLinecap="round" />
                <path d="M 270 170 C 305 195, 290 235, 260 250" fill="none" stroke="#047857" strokeWidth="16" strokeLinecap="round" />

                {/* Neck */}
                <rect x="190" y="115" width="20" height="24" rx="4" fill="#d97706" />

                {/* Head */}
                <circle cx="200" cy="80" r="34" fill="url(#avatarHeadGrad)" stroke="#b45309" strokeWidth="2" />

                {/* Expressive Face */}
                <g id="avatar-face">
                  <circle cx="188" cy="78" r="4.5" fill="#0f172a" />
                  <circle cx="190" cy="76" r="1.5" fill="#ffffff" />
                  <circle cx="212" cy="78" r="4.5" fill="#0f172a" />
                  <circle cx="214" cy="76" r="1.5" fill="#ffffff" />
                  <path d="M 192 93 Q 200 100 208 93" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="160" y="70" width="7" height="18" rx="3.5" fill="#10b981" />
                  <rect x="233" y="70" width="7" height="18" rx="3.5" fill="#06b6d4" />
                </g>
              </g>

              {/* 2. Motion Trajectory Guides */}
              {showMotionGuides && (
                <g id="trajectory-guides" opacity="0.9">
                  {visual.trajectoryType === 'typing-flutter' && (
                    <g>
                      <path d="M 130 195 Q 200 210 270 195" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 4" />
                    </g>
                  )}

                  {visual.trajectoryType === 'downward-tap' && (
                    <g>
                      <path d="M 230 140 L 165 200" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 3" />
                      <circle cx="155" cy="215" r="18" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
                    </g>
                  )}

                  {visual.trajectoryType === 'horizontal-swipe' && (
                    <g>
                      <path d="M 245 170 L 150 200" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4 3" />
                    </g>
                  )}

                  {visual.trajectoryType === 'cylinder-stack' && (
                    <g>
                      <ellipse cx="155" cy="225" rx="32" ry="10" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 3" />
                      <ellipse cx="245" cy="155" rx="32" ry="10" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 3" />
                    </g>
                  )}

                  {visual.trajectoryType === 'node-link' && (
                    <g>
                      <circle cx="200" cy="190" r="22" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 3" />
                    </g>
                  )}

                  {visual.trajectoryType === 'orbital-circle' && (
                    <g>
                      <ellipse cx="200" cy="185" rx="50" ry="22" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 4" />
                    </g>
                  )}

                  {visual.trajectoryType === 'slot-pass' && (
                    <g>
                      <rect x="130" y="190" width="24" height="24" rx="4" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />
                      <path d="M 245 165 L 140 195" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="4 3" />
                    </g>
                  )}

                  {visual.trajectoryType === 'shield-lock' && (
                    <g>
                      <polygon points="200,140 240,155 225,200 200,225 175,200 160,155" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 3" />
                    </g>
                  )}
                </g>
              )}

              {/* 3. PROMINENT LEFT HAND (Screen Left — High-Impact Emerald Glow) */}
              <motion.g
                id="left-hand-layer"
                animate={isPlaying ? visual.animVariant?.left : {}}
                style={{
                  transformOrigin: `${visual.leftHand.x}px ${visual.leftHand.y}px`,
                  transitionDuration: `${(visual.animVariant?.left?.transition?.duration || 1.6) / playbackSpeed}s`,
                }}
              >
                {/* Illuminating Focus Halo around Left Hand */}
                <circle
                  cx={visual.leftHand.x}
                  cy={visual.leftHand.y}
                  r="34"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />

                {/* Connected Glowing Forearm */}
                <line
                  x1="135"
                  y1="235"
                  x2={visual.leftHand.x}
                  y2={visual.leftHand.y}
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                {/* Smart Wristband IoT Device (Left Wrist) */}
                <g transform={`translate(${visual.leftHand.x - 16}, ${visual.leftHand.y + 14}) rotate(${visual.leftHand.rot})`}>
                  <rect x="0" y="0" width="32" height="12" rx="4" fill="url(#bandLeftGrad)" stroke="#064e3b" strokeWidth="1.5" filter="url(#emeraldHandGlow)" />
                  <rect x="9" y="2.5" width="14" height="7" rx="2" fill="#0f172a" />
                  <circle cx="16" cy="6" r="2" fill="#34d399" className="animate-ping" />
                </g>

                {/* Large Articulated Left Hand with Finger Joints & Highlights */}
                <g
                  transform={`translate(${visual.leftHand.x}, ${visual.leftHand.y}) rotate(${visual.leftHand.rot})`}
                  filter="url(#emeraldHandGlow)"
                >
                  {/* Palm Base */}
                  <rect x="-18" y="-16" width="36" height="32" rx="9" fill="#0f172a" stroke="#34d399" strokeWidth="2.5" />
                  <text x="0" y="4" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="900" fontFamily="monospace">
                    L
                  </text>

                  {/* 5 Distinct Detailed Fingers */}
                  {/* Thumb */}
                  <g transform="rotate(-35, -20, -2)">
                    <rect
                      x="-24"
                      y="-10"
                      width="7.5"
                      height="16"
                      rx="3.5"
                      fill={visual.leftHand.fingers[0] ? '#34d399' : '#334155'}
                      stroke="#022c22"
                      strokeWidth="1.2"
                    />
                    {visual.leftHand.fingers[0] && (
                      <circle cx="-20.2" cy="-6" r="1.5" fill="#ffffff" />
                    )}
                  </g>

                  {/* Index */}
                  <g>
                    <rect
                      x="-16"
                      y="-34"
                      width="6.5"
                      height={visual.leftHand.fingers[1] ? '22' : '10'}
                      rx="3"
                      fill={visual.leftHand.fingers[1] ? '#34d399' : '#334155'}
                      stroke="#022c22"
                      strokeWidth="1.2"
                    />
                    {visual.leftHand.fingers[1] && (
                      <circle cx="-12.7" cy="-30" r="1.5" fill="#ffffff" />
                    )}
                  </g>

                  {/* Middle */}
                  <g>
                    <rect
                      x="-7"
                      y="-38"
                      width="6.5"
                      height={visual.leftHand.fingers[2] ? '25' : '10'}
                      rx="3"
                      fill={visual.leftHand.fingers[2] ? '#34d399' : '#334155'}
                      stroke="#022c22"
                      strokeWidth="1.2"
                    />
                    {visual.leftHand.fingers[2] && (
                      <circle cx="-3.7" cy="-34" r="1.5" fill="#ffffff" />
                    )}
                  </g>

                  {/* Ring */}
                  <g>
                    <rect
                      x="2"
                      y="-33"
                      width="6.5"
                      height={visual.leftHand.fingers[3] ? '21' : '10'}
                      rx="3"
                      fill={visual.leftHand.fingers[3] ? '#34d399' : '#334155'}
                      stroke="#022c22"
                      strokeWidth="1.2"
                    />
                    {visual.leftHand.fingers[3] && (
                      <circle cx="5.3" cy="-29" r="1.5" fill="#ffffff" />
                    )}
                  </g>

                  {/* Pinky */}
                  <g>
                    <rect
                      x="11"
                      y="-27"
                      width="6"
                      height={visual.leftHand.fingers[4] ? '17' : '9'}
                      rx="3"
                      fill={visual.leftHand.fingers[4] ? '#34d399' : '#334155'}
                      stroke="#022c22"
                      strokeWidth="1.2"
                    />
                    {visual.leftHand.fingers[4] && (
                      <circle cx="14" cy="-23" r="1.5" fill="#ffffff" />
                    )}
                  </g>
                </g>
              </motion.g>

              {/* 4. PROMINENT RIGHT HAND (Screen Right — High-Impact Cyan Glow) */}
              <motion.g
                id="right-hand-layer"
                animate={isPlaying ? visual.animVariant?.right : {}}
                style={{
                  transformOrigin: `${visual.rightHand.x}px ${visual.rightHand.y}px`,
                  transitionDuration: `${(visual.animVariant?.right?.transition?.duration || 1.6) / playbackSpeed}s`,
                }}
              >
                {/* Illuminating Focus Halo around Right Hand */}
                <circle
                  cx={visual.rightHand.x}
                  cy={visual.rightHand.y}
                  r="34"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />

                {/* Connected Glowing Forearm */}
                <line
                  x1="265"
                  y1="235"
                  x2={visual.rightHand.x}
                  y2={visual.rightHand.y}
                  stroke="#0891b2"
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                {/* Smart Wristband IoT Device (Right Wrist) */}
                <g transform={`translate(${visual.rightHand.x - 16}, ${visual.rightHand.y + 14}) rotate(${visual.rightHand.rot})`}>
                  <rect x="0" y="0" width="32" height="12" rx="4" fill="url(#bandRightGrad)" stroke="#164e63" strokeWidth="1.5" filter="url(#cyanHandGlow)" />
                  <rect x="9" y="2.5" width="14" height="7" rx="2" fill="#0f172a" />
                  <circle cx="16" cy="6" r="2" fill="#38bdf8" className="animate-ping" />
                </g>

                {/* Large Articulated Right Hand with Finger Joints & Highlights */}
                <g
                  transform={`translate(${visual.rightHand.x}, ${visual.rightHand.y}) rotate(${visual.rightHand.rot})`}
                  filter="url(#cyanHandGlow)"
                >
                  {/* Palm Base */}
                  <rect x="-18" y="-16" width="36" height="32" rx="9" fill="#0f172a" stroke="#22d3ee" strokeWidth="2.5" />
                  <text x="0" y="4" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="900" fontFamily="monospace">
                    R
                  </text>

                  {/* 5 Distinct Detailed Fingers */}
                  {/* Thumb */}
                  <g transform="rotate(35, 20, -2)">
                    <rect
                      x="16.5"
                      y="-10"
                      width="7.5"
                      height="16"
                      rx="3.5"
                      fill={visual.rightHand.fingers[0] ? '#22d3ee' : '#334155'}
                      stroke="#083344"
                      strokeWidth="1.2"
                    />
                    {visual.rightHand.fingers[0] && (
                      <circle cx="20.2" cy="-6" r="1.5" fill="#ffffff" />
                    )}
                  </g>

                  {/* Index */}
                  <g>
                    <rect
                      x="9.5"
                      y="-34"
                      width="6.5"
                      height={visual.rightHand.fingers[1] ? '22' : '10'}
                      rx="3"
                      fill={visual.rightHand.fingers[1] ? '#22d3ee' : '#334155'}
                      stroke="#083344"
                      strokeWidth="1.2"
                    />
                    {visual.rightHand.fingers[1] && (
                      <circle cx="12.7" cy="-30" r="1.5" fill="#ffffff" />
                    )}
                  </g>

                  {/* Middle */}
                  <g>
                    <rect
                      x="0.5"
                      y="-38"
                      width="6.5"
                      height={visual.rightHand.fingers[2] ? '25' : '10'}
                      rx="3"
                      fill={visual.rightHand.fingers[2] ? '#22d3ee' : '#334155'}
                      stroke="#083344"
                      strokeWidth="1.2"
                    />
                    {visual.rightHand.fingers[2] && (
                      <circle cx="3.7" cy="-34" r="1.5" fill="#ffffff" />
                    )}
                  </g>

                  {/* Ring */}
                  <g>
                    <rect
                      x="-8.5"
                      y="-33"
                      width="6.5"
                      height={visual.rightHand.fingers[3] ? '21' : '10'}
                      rx="3"
                      fill={visual.rightHand.fingers[3] ? '#22d3ee' : '#334155'}
                      stroke="#083344"
                      strokeWidth="1.2"
                    />
                    {visual.rightHand.fingers[3] && (
                      <circle cx="-5.3" cy="-29" r="1.5" fill="#ffffff" />
                    )}
                  </g>

                  {/* Pinky */}
                  <g>
                    <rect
                      x="-17"
                      y="-27"
                      width="6"
                      height={visual.rightHand.fingers[4] ? '17' : '9'}
                      rx="3"
                      fill={visual.rightHand.fingers[4] ? '#22d3ee' : '#334155'}
                      stroke="#083344"
                      strokeWidth="1.2"
                    />
                    {visual.rightHand.fingers[4] && (
                      <circle cx="-14" cy="-23" r="1.5" fill="#ffffff" />
                    )}
                  </g>
                </g>
              </motion.g>
            </svg>
          </div>
        </div>
      )}

      {/* 2b. Tab: Detailed Hand Shape Breakdown */}
      {activeTab === 'anatomy' && (
        <div className="p-3.5 sm:p-4 flex flex-col gap-3 min-h-[290px] sm:min-h-[330px] bg-slate-950/70 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Hand size={13} />
              Finger Joint Articulation Map
            </span>
            <span className="text-[10px] font-mono text-slate-400 truncate">{visual.title}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-0.5">
            {/* Left Hand Breakdown */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-slate-950 text-[10px] font-black">L</span>
                  Left Hand
                </span>
                <span className="text-[10px] font-mono text-emerald-300/80">{visual.leftHand.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {Object.entries(visual.leftFingersState).map(([finger, state]) => (
                  <div key={finger} className="flex items-center justify-between rounded-lg bg-black/40 px-2 py-1 border border-white/5">
                    <span className="capitalize text-[10px] text-slate-300">{finger}:</span>
                    <strong className="text-[10px] text-emerald-300 font-mono">{state}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Hand Breakdown */}
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-cyan-500 text-slate-950 text-[10px] font-black">R</span>
                  Right Hand
                </span>
                <span className="text-[10px] font-mono text-cyan-300/80">{visual.rightHand.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {Object.entries(visual.rightFingersState).map(([finger, state]) => (
                  <div key={finger} className="flex items-center justify-between rounded-lg bg-black/40 px-2 py-1 border border-white/5">
                    <span className="capitalize text-[10px] text-slate-300">{finger}:</span>
                    <strong className="text-[10px] text-cyan-300 font-mono">{state}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs flex items-start gap-2">
            <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200 text-[10px] sm:text-[11px] leading-relaxed">
              <strong>Tip:</strong> {visual.mistakeAvoid}
            </p>
          </div>
        </div>
      )}

      {/* 2c. Tab: IoT Wristband Telemetry Rules */}
      {activeTab === 'iot' && (
        <div className="p-3.5 sm:p-4 flex flex-col gap-2.5 min-h-[290px] sm:min-h-[330px] bg-slate-950/70 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Watch size={13} />
              Smart Wristband Sensor Target Rules
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Wifi size={10} className="animate-pulse" />
              BLE Synced
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 mt-0.5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Activity size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block">Active Sensor Modality</span>
                <p className="text-[10px] sm:text-[11px] text-slate-300 font-mono mt-0.5">{visual.sensorFocus}</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Zap size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block">Haptic Vibration Pattern</span>
                <p className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5">
                  Real-time haptic corrective buzz triggers if curvature or angle deviates. On 1.2s accurate hold, a success confirmation pulse confirms mastery.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4 sm:py-2.5 border-t border-white/10 bg-slate-950">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 rounded-xl bg-primary/20 border border-primary/40 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/30 transition-all shadow-sm"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={handleReplay}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
            title="Restart animation"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Replay</span>
          </button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold mr-1 hidden sm:inline">
            Speed:
          </span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange ? onSpeedChange(s) : null}
              className={`rounded-lg px-2 py-1 text-[10px] font-mono font-bold transition-all ${
                playbackSpeed === s
                  ? 'bg-primary text-white shadow-sm border border-primary/50'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* 4. Action Summary Footer */}
      <div className="px-3.5 py-2 sm:px-4 border-t border-white/5 bg-slate-950/90 text-xs">
        <p className="text-[11px] text-slate-300 leading-snug break-words">
          <strong className="text-emerald-400">{visual.handShape}</strong>
          <span className="text-slate-500 mx-1.5">•</span>
          <span className="text-slate-400">{visual.motion}</span>
        </p>
      </div>
    </div>
  );
};

export default SignAvatarDemo;
