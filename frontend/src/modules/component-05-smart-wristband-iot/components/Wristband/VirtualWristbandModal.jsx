import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Watch, Wifi, BatteryCharging, Vibrate, Volume2, VolumeX, Sparkles, X, Activity } from 'lucide-react';

/**
 * Web Audio API synthesized haptic buzzer sound for virtual vibration simulation
 */
const playHapticBuzzerSound = (pattern = 'Repeated Pulse') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const beep = (freq, duration, delay) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        } catch (e) {
          // ignore
        }
      }, delay);
    };

    if (pattern === 'Repeated Pulse') {
      [0, 150, 300, 450].forEach((d) => beep(180, 0.1, d));
    } else if (pattern === 'Double Pulse') {
      [0, 180].forEach((d) => beep(240, 0.12, d));
    } else if (pattern === 'Long Pulse') {
      beep(150, 0.8, 0);
    } else if (pattern === 'Short Pulse') {
      beep(320, 0.15, 0);
    } else {
      beep(200, 0.2, 0);
    }
  } catch (err) {
    console.warn('Audio buzzer unavailable:', err);
  }
};

const VirtualWristbandModal = ({
  isOpen = true,
  onClose,
  activeAlert = null,
  isBleConnected = false,
  onBleConnect,
}) => {
  const [isVibrating, setIsVibrating] = useState(false);
  const [oledText, setOledText] = useState('SIGNLEARN READY');
  const [currentPattern, setCurrentPattern] = useState('Standby');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationHistory, setVibrationHistory] = useState([]);
  const vibrationTimeoutRef = useRef(null);

  // Trigger vibration when activeAlert prop updates
  useEffect(() => {
    if (activeAlert) {
      const msg = activeAlert.oledMessage || activeAlert.message || 'ALERT TRIGGERED';
      const pat = activeAlert.vibrationPattern || activeAlert.pattern || 'Repeated Pulse';
      const dur = activeAlert.duration || 1200;

      setOledText(msg.toUpperCase());
      setCurrentPattern(pat);
      setIsVibrating(true);

      if (soundEnabled) {
        playHapticBuzzerSound(pat);
      }

      setVibrationHistory((prev) => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          message: msg,
          pattern: pat,
        },
        ...prev.slice(0, 4),
      ]);

      clearTimeout(vibrationTimeoutRef.current);
      vibrationTimeoutRef.current = setTimeout(() => {
        setIsVibrating(false);
        setOledText('SIGNLEARN READY');
        setCurrentPattern('Standby');
      }, dur + 600);
    }
    return () => clearTimeout(vibrationTimeoutRef.current);
  }, [activeAlert, soundEnabled]);

  const testTrigger = (text, pattern) => {
    setOledText(text);
    setCurrentPattern(pattern);
    setIsVibrating(true);
    if (soundEnabled) {
      playHapticBuzzerSound(pattern);
    }
    clearTimeout(vibrationTimeoutRef.current);
    vibrationTimeoutRef.current = setTimeout(() => {
      setIsVibrating(false);
      setOledText('SIGNLEARN READY');
      setCurrentPattern('Standby');
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <div className="relative flex flex-col rounded-3xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Watch size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Smart Haptic Wristband</h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${isBleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-primary'}`} />
                {isBleConnected ? 'ESP32 BLE Connected' : 'IoT Virtual Simulation'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute Buzzer Audio' : 'Enable Buzzer Audio'}
          >
            {soundEnabled ? <Volume2 size={16} className="text-primary" /> : <VolumeX size={16} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Wristband OLED Device Body */}
      <div className="my-4 flex flex-col items-center justify-center">
        <motion.div
          animate={
            isVibrating
              ? {
                  x: [-3, 3, -3, 3, -1, 1, 0],
                  boxShadow: [
                    '0 0 15px rgba(239, 68, 68, 0.4)',
                    '0 0 30px rgba(239, 68, 68, 0.8)',
                    '0 0 15px rgba(239, 68, 68, 0.3)',
                  ],
                }
              : {
                  boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.5)',
                }
          }
          transition={{ duration: 0.25, repeat: isVibrating ? 4 : 0 }}
          className={`w-full rounded-2xl border p-4 transition-colors ${
            isVibrating
              ? 'border-red-500/80 bg-gradient-to-br from-slate-950 via-red-950/40 to-slate-950'
              : 'border-white/15 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900'
          }`}
        >
          {/* Top Bar on OLED Screen */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span className="flex items-center gap-1 font-mono font-semibold text-primary">
              <Wifi size={12} className={isBleConnected ? 'text-emerald-400' : 'text-primary'} />
              ESP32-BAND
            </span>
            <span className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
              <BatteryCharging size={13} />
              94%
            </span>
          </div>

          {/* OLED Display Matrix */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-500/30 bg-black/90 px-4 py-4 shadow-inner">
            <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400/70">
              OLED HAPTIC DISPLAY
            </span>
            <motion.div
              key={oledText}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="my-1.5 font-mono text-base font-black tracking-wider text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            >
              {oledText}
            </motion.div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <Activity size={10} className={isVibrating ? 'text-red-400 animate-spin' : 'text-slate-500'} />
              <span>Pattern: <strong className="text-white">{currentPattern}</strong></span>
            </div>
          </div>

          {/* Bottom Status LED */}
          <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isVibrating ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span className="text-slate-300 font-medium">{isVibrating ? 'VIBRATING NOW' : 'Haptic Ready'}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">v0.1.0-IoT</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Action Simulation Buttons */}
      <div className="border-t border-white/10 pt-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
          <span className="font-semibold text-slate-300">Simulation Controls</span>
          {onBleConnect && (
            <button
              onClick={onBleConnect}
              className="text-xs text-primary hover:underline font-medium"
            >
              {isBleConnected ? 'Disconnect BLE' : 'Pair Real ESP32 BLE'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => testTrigger('WRONG SIGN', 'Repeated Pulse')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all active:scale-95 shadow-sm min-h-[40px]"
          >
            <Vibrate size={15} />
            <span>Test Error Buzz</span>
          </button>
          <button
            onClick={() => testTrigger('SIGN PASSED', 'Short Pulse')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95 shadow-sm min-h-[40px]"
          >
            <Sparkles size={15} />
            <span>Test Pass Pulse</span>
          </button>
        </div>
      </div>

      {/* Real-time Log */}
      {vibrationHistory.length > 0 && (
        <div className="mt-3 rounded-xl bg-black/50 p-2.5 text-xs font-mono text-slate-400 border border-white/10">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Recent Haptic Events</div>
          {vibrationHistory.map((item) => (
            <div key={item.id} className="flex justify-between py-1 border-b border-white/5 last:border-0 text-[11px]">
              <span className="text-cyan-400 font-semibold">{item.message} ({item.pattern})</span>
              <span className="text-slate-500">{item.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VirtualWristbandModal;
