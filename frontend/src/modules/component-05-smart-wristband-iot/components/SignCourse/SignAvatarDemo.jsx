import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hand, Play, RotateCcw, Sparkles, Volume2 } from 'lucide-react';

const GESTURE_VISUALS = {
  computer: {
    title: 'Typing / Arched Hands',
    icon: '⌨️',
    handShape: 'Open arched 5-finger hands',
    motion: 'Alternating smooth typing flutter at chest level',
    leftHand: { x: -35, y: 15, rot: -15, fingers: [true, true, true, true, true] },
    rightHand: { x: 35, y: 15, rot: 15, fingers: [true, true, true, true, true] },
    animVariant: {
      y: [0, -6, 0, -6, 0],
      rotate: [-2, 2, -2, 2, 0],
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  hardware: {
    title: 'Solid Fist Tapping Palm',
    icon: '🔨',
    handShape: 'Dominant fist + Flat receiving base palm',
    motion: 'Two firm downward taps showing solid physical structure',
    leftHand: { x: -25, y: 30, rot: 0, fingers: [true, true, true, true, true] }, // flat palm
    rightHand: { x: -20, y: 10, rot: 0, fingers: [false, false, false, false, false] }, // fist
    animVariant: {
      y: [0, -18, 0, -18, 0],
      transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  software: {
    title: 'Gliding Logic Swipe',
    icon: '📜',
    handShape: 'Index + Middle extended (V-shape)',
    motion: 'Smooth horizontal glide across receiving palm',
    leftHand: { x: -25, y: 30, rot: 0, fingers: [true, true, true, true, true] },
    rightHand: { x: -30, y: 20, rot: 30, fingers: [false, true, true, false, false] },
    animVariant: {
      x: [-15, 25, -15],
      transition: { duration: 2.0, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  database: {
    title: 'Stacked Cylinder Layers',
    icon: '🗄️',
    handShape: 'Curved "C" shapes stacked vertically',
    motion: 'Top hand pulses downward to indicate data tiers',
    leftHand: { x: 0, y: 35, rot: 0, fingers: [true, true, true, true, false] },
    rightHand: { x: 0, y: -5, rot: 0, fingers: [true, true, true, true, false] },
    animVariant: {
      y: [-10, 5, -10],
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  network: {
    title: 'Interlocked Nodes',
    icon: '🌐',
    handShape: 'Prominent middle fingers touching and linking',
    motion: 'Fingertips touch, twist, and link together',
    leftHand: { x: -15, y: 20, rot: 25, fingers: [true, true, true, false, false] },
    rightHand: { x: 15, y: 20, rot: -25, fingers: [true, true, true, false, false] },
    animVariant: {
      rotate: [-8, 8, -8],
      x: [-5, 5, -5],
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  internet: {
    title: 'Orbital Middle-Finger Rotation',
    icon: '🌍',
    handShape: 'Open "5" hands with bent middle fingers touching',
    motion: 'Continuous circular orbital rocking back and forth',
    leftHand: { x: -18, y: 18, rot: 15, fingers: [true, true, true, true, true] },
    rightHand: { x: 18, y: 18, rot: -15, fingers: [true, true, true, true, true] },
    animVariant: {
      rotate: [-15, 15, -15],
      y: [-6, 6, -6],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  email: {
    title: 'Envelope Pass-Through',
    icon: '✉️',
    handShape: 'Non-dominant envelope slot + Flat sender hand',
    motion: 'Quick forward pass through the slot towards recipient',
    leftHand: { x: -25, y: 25, rot: -10, fingers: [true, true, true, false, false] },
    rightHand: { x: -35, y: 10, rot: 40, fingers: [false, true, true, false, false] },
    animVariant: {
      x: [-20, 30, -20],
      y: [-5, 10, -5],
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  security: {
    title: 'Crossed Protective Shield',
    icon: '🛡️',
    handShape: 'Closed "S" fists with crossed wrists',
    motion: 'Firm crossing lock in front of chest',
    leftHand: { x: 12, y: 15, rot: 35, fingers: [false, false, false, false, false] },
    rightHand: { x: -12, y: 15, rot: -35, fingers: [false, false, false, false, false] },
    animVariant: {
      scale: [0.96, 1.04, 0.96],
      transition: { duration: 2.0, repeat: Infinity, ease: 'easeInOut' },
    },
  },
};

const SignAvatarDemo = ({ keyword = 'computer', playbackSpeed = 1 }) => {
  const normKey = (keyword || 'computer').toLowerCase();
  const visual = GESTURE_VISUALS[normKey] || GESTURE_VISUALS.computer;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[260px] p-4 bg-slate-900/90 rounded-2xl border border-white/10 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/10 pointer-events-none" />

      {/* Top Banner */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between px-2 text-xs">
        <span className="flex items-center gap-1.5 font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
          <Sparkles size={13} />
          ASL Visual: {visual.title}
        </span>
        <span className="text-xl drop-shadow">{visual.icon}</span>
      </div>

      {/* Interactive Avatar Character & Hands Container */}
      <div className="relative mt-4 flex items-center justify-center h-44 w-full max-w-xs">
        {/* Stylized Avatar Head & Torso */}
        <div className="relative flex flex-col items-center">
          {/* Head */}
          <div className="h-14 w-14 rounded-full bg-gradient-to-b from-amber-200 to-amber-300 border-2 border-amber-400 shadow-md flex items-center justify-center">
            {/* Eyes & Smile */}
            <div className="flex gap-2.5">
              <div className="h-2 w-1.5 rounded-full bg-slate-900" />
              <div className="h-2 w-1.5 rounded-full bg-slate-900" />
            </div>
          </div>
          {/* Neck */}
          <div className="h-3 w-4 bg-amber-300 -mt-0.5" />
          {/* Torso */}
          <div className="h-16 w-28 rounded-t-2xl bg-emerald-700 border-t-2 border-emerald-500 shadow-inner flex items-center justify-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-200/60">
              SignLearn
            </span>
          </div>
        </div>

        {/* Animated Hand Gesture Layer */}
        <motion.div
          animate={visual.animVariant}
          style={{ transitionDuration: `${(visual.animVariant.transition?.duration || 1.6) / playbackSpeed}s` }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {/* Left Hand Representation */}
          <div
            style={{
              transform: `translate(${visual.leftHand.x}px, ${visual.leftHand.y}px) rotate(${visual.leftHand.rot}deg)`,
            }}
            className="absolute flex items-center justify-center"
          >
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/90 border border-primary/50 shadow-lg backdrop-blur">
              <span className="text-[9px] font-mono font-bold text-slate-400">L</span>
              <div className="flex gap-0.5 mt-0.5">
                {visual.leftHand.fingers.map((extended, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full ${
                      extended ? 'h-3.5 bg-emerald-400' : 'h-1.5 bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Hand Representation */}
          <div
            style={{
              transform: `translate(${visual.rightHand.x}px, ${visual.rightHand.y}px) rotate(${visual.rightHand.rot}deg)`,
            }}
            className="absolute flex items-center justify-center"
          >
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-800/90 border border-cyan-400/50 shadow-lg backdrop-blur">
              <span className="text-[9px] font-mono font-bold text-slate-400">R</span>
              <div className="flex gap-0.5 mt-0.5">
                {visual.rightHand.fingers.map((extended, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full ${
                      extended ? 'h-3.5 bg-cyan-400' : 'h-1.5 bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Live Action Summary */}
      <div className="mt-2 w-full text-center border-t border-white/10 pt-2 text-xs">
        <p className="text-[11px] font-medium text-slate-300">
          <strong className="text-primary">{visual.handShape}</strong> • {visual.motion}
        </p>
      </div>
    </div>
  );
};

export default SignAvatarDemo;
