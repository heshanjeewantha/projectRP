import { Award, CheckCircle2, Download, Printer, RotateCcw, Share2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CourseCertificateModal = ({
  isOpen = true,
  onClose,
  studentName = 'Student Learner',
  masteryScore = 94,
  completedKeywordsCount = 15,
  onRestartCourse,
}) => {
  if (!isOpen) return null;

  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const certificateId = `SIGN-ICT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Certificate Frame Outer Border */}
          <div className="relative rounded-2xl border-4 border-double border-amber-500/50 bg-slate-950/90 p-8 text-center shadow-inner">
            {/* Corner Ornamental Accents */}
            <div className="absolute top-2 left-2 text-amber-400/60 font-serif text-lg">✦</div>
            <div className="absolute top-2 right-2 text-amber-400/60 font-serif text-lg">✦</div>
            <div className="absolute bottom-2 left-2 text-amber-400/60 font-serif text-lg">✦</div>
            <div className="absolute bottom-2 right-2 text-amber-400/60 font-serif text-lg">✦</div>

            {/* Header Badge */}
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30">
              <Award size={36} />
            </div>

            <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-400">
              OFFICIAL COURSE COMPLETION DIPLOMA
            </span>

            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
              Certificate of ICT Sign Language Mastery
            </h2>

            <p className="mt-1 text-sm font-medium text-amber-300/80">
              Ordinary Level (O/L) Computer Studies Sign Curriculum
            </p>

            <p className="mt-6 text-xs text-slate-400">This certifies that</p>
            <h3 className="mt-1 text-xl font-bold text-primary underline decoration-primary/40 underline-offset-4">
              {studentName}
            </h3>

            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-slate-300">
              has successfully mastered all required Ordinary Level (O/L) ICT sign language keywords,
              verified with AI camera gesture tracking and Smart Wristband real-time haptic evaluation.
            </p>

            {/* Metrics Ribbon */}
            <div className="my-6 grid grid-cols-3 gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Mastery Score</div>
                <div className="text-lg font-black text-emerald-400 font-mono">{masteryScore}%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Keywords Passed</div>
                <div className="text-lg font-black text-primary font-mono">{completedKeywordsCount} / 15</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Evaluation</div>
                <div className="text-lg font-black text-amber-400 font-mono">DISTINCTION</div>
              </div>
            </div>

            {/* Signature & Date */}
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
              <div className="text-left">
                <p className="font-semibold text-white">Date of Issue: {issueDate}</p>
                <p className="font-mono text-[10px] text-slate-500">ID: {certificateId}</p>
              </div>
              <div className="text-right">
                <div className="font-serif italic text-amber-400 font-bold">SignLearn AI System</div>
                <p className="text-[10px] text-slate-500">Authorized Digital Credential</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onRestartCourse}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:bg-white/10 transition-all min-h-[40px] active:scale-95"
            >
              <RotateCcw size={16} />
              <span>Restart Course</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-[#032418] shadow-lg shadow-primary/30 hover:bg-primary-hover transition-all min-h-[40px] active:scale-95"
              >
                <Printer size={16} />
                <span>Print / Save Certificate</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CourseCertificateModal;
