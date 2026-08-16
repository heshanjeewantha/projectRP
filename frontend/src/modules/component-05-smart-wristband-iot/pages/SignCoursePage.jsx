import { useState, useEffect, useRef } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Cpu,
  Flame,
  Hand,
  Layers,
  Network,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  Vibrate,
  Watch,
  Wifi,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple CSS confetti burst
const ConfettiBurst = () => {
  const pieces = Array.from({ length: 40 }, (_, i) => i);
  const colors = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa', '#fb7185'];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((i) => (
        <motion.div
          key={i}
          initial={{
            x: `${30 + Math.random() * 40}vw`,
            y: `-${10 + Math.random() * 10}vh`,
            opacity: 1,
            rotate: 0,
            scale: 0.8 + Math.random() * 0.8,
          }}
          animate={{
            y: `${90 + Math.random() * 20}vh`,
            rotate: (Math.random() - 0.5) * 720,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 2.5 + Math.random() * 1.5, delay: Math.random() * 0.8, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: 8 + Math.random() * 8,
            height: 8 + Math.random() * 8,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          }}
        />
      ))}
    </div>
  );
};

import useStore from '../../shared-app/utils/useStore';
import Header from '../../../components/layout/Dashboard/Header';
import SignPracticeArena from '../components/SignCourse/SignPracticeArena';
import VirtualWristbandModal from '../components/Wristband/VirtualWristbandModal';
import CourseCertificateModal from '../components/SignCourse/CourseCertificateModal';
import WristbandPage from './WristbandPage';
import {
  getSignCourseModules,
  getStudentSignProgress,
  evaluateSignAttempt,
  resetSignCourseProgress,
} from '../services/signCourseApi';
import wristbandBle from '../services/wristbandBleController';

const ICON_MAP = {
  Cpu: Cpu,
  Layers: Layers,
  Network: Network,
  ShieldCheck: ShieldCheck,
};

const SignCoursePage = () => {
  const { userId } = useStore();
  const effectiveUserId = userId || 'student_demo_123';

  const [activeTab, setActiveTab] = useState('course'); // 'course', 'practice', 'device'
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [activeKeyword, setActiveKeyword] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAlert, setActiveAlert] = useState(null);
  const [isBleConnected, setIsBleConnected] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showVirtualBand, setShowVirtualBand] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [displayedMastery, setDisplayedMastery] = useState(0);
  const masteryAnimRef = useRef(null);

  // Fetch modules and student progress
  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [modulesData, progressData] = await Promise.all([
        getSignCourseModules(),
        getStudentSignProgress(effectiveUserId),
      ]);
      setModules(modulesData);
      setProgress(progressData);

      if (modulesData.length > 0) {
        setActiveModule(modulesData[0]);
        if (modulesData[0].keywords?.length > 0) {
          setActiveKeyword(modulesData[0].keywords[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load course modules or progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [effectiveUserId]);

  // Subscribe to Web Bluetooth status
  useEffect(() => {
    const unsub = wristbandBle.subscribe((event) => {
      if (event.type === 'CONNECTED') {
        setIsBleConnected(true);
      } else if (event.type === 'DISCONNECTED') {
        setIsBleConnected(false);
      }
    });
    return () => unsub();
  }, []);

  const handleBleConnect = async () => {
    try {
      if (isBleConnected) {
        await wristbandBle.disconnect();
      } else {
        await wristbandBle.connect();
      }
    } catch (err) {
      alert(`BLE Connection: ${err.message}`);
    }
  };

  const handleStartModule = (mod) => {
    setActiveModule(mod);
    if (mod.keywords?.length > 0) {
      setActiveKeyword(mod.keywords[0]);
    }
    setActiveTab('practice');
  };

  const handleSelectKeyword = (kw) => {
    setActiveKeyword(kw);
    setActiveTab('practice');
  };

  // Called when camera confirms student held the correct gesture
  const handlePassKeyword = async (keyword, accuracy) => {
    try {
      await evaluateSignAttempt({
        studentId: effectiveUserId,
        moduleId: activeModule?.id || 'module-1',
        keyword,
        isCorrect: true,
        confidence: accuracy / 100,
        durationHeldSeconds: 1.5,
      });

      // Trigger Virtual Wristband Success Pulse
      setActiveAlert({
        alertType: 'Sign Success Alert',
        oledMessage: 'SIGN PASSED',
        vibrationPattern: 'Short Pulse',
        duration: 400,
      });

      // Send to physical BLE wristband if connected
      if (isBleConnected) {
        wristbandBle.triggerVibration('Short Pulse', 'SIGN PASSED', 50, 400);
      }

      // Refresh progress
      const updatedProgress = await getStudentSignProgress(effectiveUserId);
      setProgress(updatedProgress);

      // If course is completed, open certificate modal
      if (updatedProgress.isCourseCompleted) {
        setShowCertificate(true);
      }
    } catch (err) {
      console.error('Error passing keyword:', err);
    }
  };

  // Called when student performs incorrect gesture or times out
  const handleErrorTrigger = async ({ keyword, reason, accuracy }) => {
    try {
      await evaluateSignAttempt({
        studentId: effectiveUserId,
        moduleId: activeModule?.id || 'module-1',
        keyword,
        isCorrect: false,
        confidence: accuracy / 100,
        durationHeldSeconds: 0,
        mistakeReason: reason,
      });

      // Trigger Virtual Wristband Error Buzz
      setActiveAlert({
        alertType: 'Wrong Sign Alert',
        oledMessage: 'RETRY SIGN',
        vibrationPattern: 'Repeated Pulse',
        duration: 1200,
      });

      // Send to physical BLE wristband if connected
      if (isBleConnected) {
        wristbandBle.triggerVibration('Repeated Pulse', 'RETRY SIGN', 90, 1200);
      }

      // Refresh progress
      const updatedProgress = await getStudentSignProgress(effectiveUserId);
      setProgress(updatedProgress);
    } catch (err) {
      console.error('Error reporting mistake:', err);
    }
  };

  const handleResetCourse = async () => {
    if (window.confirm('Are you sure you want to reset all sign learning progress and restart the course?')) {
      const res = await resetSignCourseProgress(effectiveUserId);
      setProgress(res);
      setShowCertificate(false);
      loadCourseData();
    }
  };

  const totalKeywords = modules.reduce((acc, m) => acc + (m.keywords?.length || 0), 0);
  const completedCount = progress?.completedKeywords?.length || 0;
  const masteryPercentage = Math.round((completedCount / Math.max(1, totalKeywords)) * 100);

  // Animate the mastery % counter up
  useEffect(() => {
    clearInterval(masteryAnimRef.current);
    const target = masteryPercentage;
    if (displayedMastery === target) return;
    const step = target > displayedMastery ? 1 : -1;
    masteryAnimRef.current = setInterval(() => {
      setDisplayedMastery((prev) => {
        if (prev === target) { clearInterval(masteryAnimRef.current); return prev; }
        return prev + step;
      });
    }, 18);
    return () => clearInterval(masteryAnimRef.current);
  }, [masteryPercentage]);

  // Confetti on 100%
  useEffect(() => {
    if (masteryPercentage >= 100 && completedCount > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4500);
    }
  }, [masteryPercentage, completedCount]);

  return (
    <div className="w-full min-h-screen pb-16 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Confetti burst on course completion */}
      <AnimatePresence>{showConfetti && <ConfettiBurst />}</AnimatePresence>
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Header
            label="Component 05: Smart Wristband & Sign Course"
            icon={Hand}
            title="Interactive ICT Sign Language Course & Wristband Haptic Feedback"
            description="Learn O/L ICT sign language terms step-by-step. Open your camera to practice gestures with real-time AI evaluation, receiving smart wristband vibration alerts whenever you make a mistake."
          />

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowVirtualBand(!showVirtualBand)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md ${
                showVirtualBand
                  ? 'border border-primary/40 bg-primary/20 text-primary'
                  : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Watch size={16} />
              {showVirtualBand ? 'Hide Virtual Wristband' : 'Show Virtual Wristband'}
            </button>
          </div>
        </div>

        {/* Top Metrics Row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Flame size={22} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Mastery Progress</div>
              <motion.div
                key={masteryPercentage}
                className="text-xl font-black text-white font-mono"
              >
                {displayedMastery}%
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Keywords Passed</div>
              <div className="text-xl font-black text-white font-mono">
                {completedCount} / {totalKeywords}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
              <Vibrate size={22} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Haptic Corrections</div>
              <div className="text-xl font-black text-white font-mono">
                {progress?.wristbandTriggers || 0} buzzes
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Watch size={22} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Wristband Mode</div>
              <div className="text-xs font-bold text-white">
                {isBleConnected ? 'ESP32 BLE Active' : 'IoT Virtual Pulse'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <button
            onClick={() => setActiveTab('course')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'course'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen size={15} />
            Course Curriculum
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'practice'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Hand size={15} />
            Camera Practice Arena
          </button>

          <button
            onClick={() => setActiveTab('device')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === 'device'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Watch size={15} />
            Wristband IoT Settings
          </button>

          {masteryPercentage >= 75 && (
            <button
              onClick={() => setShowCertificate(true)}
              className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all sm:ml-auto"
            >
              <Award size={15} />
              View Certificate
            </button>
          )}
        </div>
      </div>

      {/* Main Content Workspace Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Primary Content (Curriculum or Practice or Settings) */}
        <div className={showVirtualBand ? 'lg:col-span-8 flex flex-col gap-6' : 'lg:col-span-12 flex flex-col gap-6'}>
          {/* TAB 1: CURRICULUM VIEW */}
          {activeTab === 'course' && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Ordinary Level (O/L) ICT Sign Modules</h3>
                  <p className="text-xs text-slate-400">Complete each unit by mastering keywords with the camera.</p>
                </div>
                <button
                  onClick={handleResetCourse}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw size={13} />
                  Reset Progress
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {modules.map((mod) => {
                  const IconComponent = ICON_MAP[mod.iconName] || Cpu;
                  const modCompletedCount = mod.keywords.filter((k) =>
                    progress?.completedKeywords?.includes(k.keyword)
                  ).length;
                  const isModComplete = modCompletedCount === mod.keywords.length;

                  return (
                    <div
                      key={mod.id}
                      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all ${
                        isModComplete
                          ? 'border-emerald-500/40 bg-emerald-950/10'
                          : 'border-white/10 bg-slate-900/60 hover:border-primary/40 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                              isModComplete
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-primary/20 text-primary'
                            }`}
                          >
                            <IconComponent size={24} />
                          </div>
                          <div>
                            <span className="font-mono text-xs font-semibold text-primary uppercase">
                              Unit {mod.moduleNumber}
                            </span>
                            <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                              {mod.title}
                            </h4>
                            <p className="mt-1 text-xs text-slate-300 max-w-xl leading-relaxed">
                              {mod.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartModule(mod)}
                          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                        >
                          Start Unit
                        </button>
                      </div>

                      {/* Keywords Pill Grid */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                        <span className="text-xs text-slate-400 font-semibold mr-1">Keywords:</span>
                        {mod.keywords.map((kw) => {
                          const isKwPassed = progress?.completedKeywords?.includes(kw.keyword);
                          const isActive = activeKeyword?.keyword === kw.keyword;
                          // Difficulty color
                          const d = (kw.difficulty || '').toLowerCase();
                          const diffClass = d === 'easy'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            : d === 'hard'
                            ? 'border-red-500/30 bg-red-500/10 text-red-300'
                            : d === 'medium'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                            : '';
                          return (
                            <button
                              key={kw.id}
                              onClick={() => {
                                setActiveModule(mod);
                                handleSelectKeyword(kw);
                              }}
                              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all border ${
                                isKwPassed
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                  : isActive
                                  ? 'border-primary/60 bg-primary/20 text-primary'
                                  : diffClass || 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-primary/40'
                              }`}
                            >
                              {isKwPassed ? (
                                <CheckCircle2 size={12} className="text-emerald-400" />
                              ) : isActive ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              ) : (
                                <Hand size={12} className="text-slate-400" />
                              )}
                              <span className="uppercase">{kw.keyword}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CAMERA PRACTICE ARENA */}
          {activeTab === 'practice' && activeKeyword && (
            <SignPracticeArena
              activeModule={activeModule}
              activeKeyword={activeKeyword}
              progress={progress}
              onSelectKeyword={setActiveKeyword}
              onPassKeyword={handlePassKeyword}
              onErrorTrigger={handleErrorTrigger}
              onBackToModules={() => setActiveTab('course')}
            />
          )}

          {/* TAB 3: WRISTBAND DEVICE SETTINGS */}
          {activeTab === 'device' && <WristbandPage />}
        </div>

        {/* Right Column: Virtual Smart Wristband Simulator */}
        {showVirtualBand && (
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="sticky top-28">
              <VirtualWristbandModal
                activeAlert={activeAlert}
                isBleConnected={isBleConnected}
                onBleConnect={handleBleConnect}
              />
            </div>
          </div>
        )}
      </div>

      {/* Completion Certificate Modal */}
      <CourseCertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        studentName={effectiveUserId}
        masteryScore={masteryPercentage}
        completedKeywordsCount={completedCount}
        onRestartCourse={handleResetCourse}
      />
    </div>
  );
};

export default SignCoursePage;
