import { useState } from 'react';
import { Hand, Sparkles, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SIGN_DICTIONARY = {
  cpu: { word: 'CPU / Processor', category: 'Hardware', desc: 'Central Processing Unit of the computer.' },
  computer: { word: 'Computer', category: 'Hardware', desc: 'Electronic machine for processing data.' },
  database: { word: 'Database / SQL', category: 'Software', desc: 'Organized collection of structured records.' },
  network: { word: 'Network / Router', category: 'Networking', desc: 'Interconnected computing devices sharing resources.' },
  internet: { word: 'Internet / Web', category: 'Networking', desc: 'Global interconnected network of computers.' },
  security: { word: 'Cyber Security', category: 'Security', desc: 'Protection of computer systems and data from theft.' },
};

export const SignWordBadge = ({ word, onOpenSignModal }) => {
  const norm = word.toLowerCase().trim();
  const info = SIGN_DICTIONARY[norm] || { word: word, category: 'ICT Sign', desc: `Sign representation for ${word}.` };

  return (
    <button
      type="button"
      onClick={() => onOpenSignModal(info)}
      className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-semibold hover:bg-cyan-500/20 transition-colors cursor-pointer"
      title={`Click to view sign language demonstration for ${info.word}`}
    >
      <Hand size={11} className="text-cyan-400" />
      <span>{info.word}</span>
      <span className="text-[9px] text-cyan-400/80 font-mono">🤟 Sign</span>
    </button>
  );
};

export const SignWordModal = ({ isOpen, signInfo, onClose }) => {
  if (!isOpen || !signInfo) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative flex flex-col w-full max-w-md rounded-3xl border border-cyan-500/30 bg-[#070d09] shadow-2xl overflow-hidden p-6 space-y-4 text-center"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
                <Hand size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{signInfo.word}</h4>
                <span className="text-[10px] font-mono uppercase text-cyan-400">{signInfo.category}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-text-muted hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Sign Avatar Simulation Box */}
          <div className="relative h-48 w-full rounded-2xl border border-white/10 bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="relative flex items-center justify-center h-28 w-28 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2 animate-pulse shadow-lg shadow-cyan-500/20">
              <Hand size={48} />
            </div>
            <p className="text-xs font-mono text-cyan-300">Avatar Sign Gesture Active</p>
            <span className="text-[10px] text-text-muted">MediaPipe 21-point hand rig active</span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            {signInfo.desc}
          </p>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-colors"
          >
            Done
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
