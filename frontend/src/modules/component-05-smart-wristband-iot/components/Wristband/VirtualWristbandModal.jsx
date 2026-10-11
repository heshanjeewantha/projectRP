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
        } catch {
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
    let startAlertTimeout;

    if (activeAlert) {
      const msg = activeAlert.oledMessage || activeAlert.message || 'ALERT TRIGGERED';
      const pat = activeAlert.vibrationPattern || activeAlert.pattern || 'Repeated Pulse';
      const dur = activeAlert.duration || 1200;

      startAlertTimeout = setTimeout(() => {
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
      }, 0);
    }

    return () => {
      clearTimeout(startAlertTimeout);
      clearTimeout(vibrationTimeoutRef.current);
    };
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
    <div className="virtual-wristband-panel relative flex min-w-0 flex-col rounded-2xl border p-4 shadow-2xl backdrop-blur-xl sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Watch size={20} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-[var(--color-text-main)]">Smart Haptic Wristband</h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex min-w-0 items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${isBleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-primary'}`} />
                <span className="truncate">{isBleConnected ? 'ESP32 BLE Connected' : 'IoT Virtual Simulation'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
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
      <div className="my-4 flex min-w-0 flex-col items-center justify-center">
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
          className={`virtual-wristband-device w-full min-w-0 rounded-2xl border p-3 transition-colors sm:p-4 ${
            isVibrating
              ? 'border-red-500/80 bg-gradient-to-br from-slate-950 via-red-950/40 to-slate-950'
              : 'border-white/15 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900'
          }`}
        >
          {/* Top Bar on OLED Screen */}
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-slate-400">
            <span className="flex min-w-0 items-center gap-1 font-mono font-semibold text-primary">
              <Wifi size={12} className={isBleConnected ? 'text-emerald-400' : 'text-primary'} />
              <span className="truncate">ESP32-BAND</span>
            </span>
            <span className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
              <BatteryCharging size={13} />
              94%
            </span>
          </div>

          {/* OLED Display Matrix */}
          <div className="virtual-wristband-oled flex min-w-0 flex-col items-center justify-center rounded-xl border border-cyan-500/30 px-3 py-4 shadow-inner sm:px-4">
            <span className="virtual-wristband-oled-label font-mono text-[9px] uppercase tracking-widest">
              OLED HAPTIC DISPLAY
            </span>
            <motion.div
              key={oledText}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="virtual-wristband-oled-text my-1.5 max-w-full break-words text-center font-mono text-sm font-black tracking-wider drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] sm:text-base"
            >
              {oledText}
            </motion.div>
            <div className="virtual-wristband-oled-status flex items-center gap-1.5 text-[10px] font-mono">
              <Activity size={10} className={isVibrating ? 'text-red-400 animate-spin' : 'text-slate-500'} />
              <span>Pattern: <strong>{currentPattern}</strong></span>
            </div>
          </div>

          {/* Bottom Status LED */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
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
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Simulation Controls</span>
          {onBleConnect && (
            <button
              onClick={onBleConnect}
              className="min-h-[32px] rounded-lg px-2 text-xs font-medium text-primary hover:bg-primary/10"
            >
              {isBleConnected ? 'Disconnect BLE' : 'Pair Real ESP32 BLE'}
            </button>
          )}
        </div>
        <div className="virtual-wristband-actions">
          <button
            onClick={() => testTrigger('WRONG SIGN', 'Repeated Pulse')}
            className="virtual-wristband-action-button inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all active:scale-95 shadow-sm"
          >
            <Vibrate size={15} />
            <span>Test Error Buzz</span>
          </button>
          <button
            onClick={() => testTrigger('SIGN PASSED', 'Short Pulse')}
            className="virtual-wristband-action-button inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95 shadow-sm"
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
