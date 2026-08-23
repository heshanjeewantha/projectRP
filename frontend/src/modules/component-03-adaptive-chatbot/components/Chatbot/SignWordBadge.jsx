import { useState } from 'react';
import { Hand, Sparkles, X, Play, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export const SIGN_DICTIONARY = {
  cpu: { word: 'CPU / Processor', category: 'Hardware', desc: 'Central Processing Unit: Directs fetch-decode-execute cycles and performs computations.' },
  computer: { word: 'Computer', category: 'Hardware', desc: 'Electronic machine for storing, retrieving, and processing data.' },
  database: { word: 'Database / SQL', category: 'Software', desc: 'Structured collection of records organized into relational tables.' },
  network: { word: 'Network / Router', category: 'Networking', desc: 'Interconnected devices exchanging data packets over communication links.' },
  internet: { word: 'Internet / Web', category: 'Networking', desc: 'Global interconnected network of computers using standard TCP/IP.' },
  security: { word: 'Cyber Security', category: 'Security', desc: 'Protection of computer systems and data from unauthorized digital attacks.' },
  data: { word: 'Data Representation', category: 'Theory', desc: 'Raw facts represented in binary bits (0 and 1) for computer processing.' },
  software: { word: 'Operating Software', category: 'Software', desc: 'Programs and operating systems that instruct hardware components.' },
  logic: { word: 'Logic Gates (AND/OR)', category: 'Electronics', desc: 'Electronic circuits computing Boolean logic operations on binary signals.' },
  algorithm: { word: 'Algorithm / Flowchart', category: 'Programming', desc: 'Step-by-step procedure designed to perform a specific calculation or task.' },
};

export const getDetectedSignWords = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matched = [];
  for (const key of Object.keys(SIGN_DICTIONARY)) {
    if (lower.includes(key)) {
      matched.push(key);
    }
  }
  return matched;
};

export const SignWordBadge = ({ word, onOpenSignModal }) => {
  const norm = word.toLowerCase().trim();
  const info = SIGN_DICTIONARY[norm] || { word: word, category: 'ICT Sign', desc: `Sign representation for ${word}.` };

  return (
    <button
      type="button"
      onClick={() => onOpenSignModal(info)}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all cursor-pointer shadow-sm"
      title={`Click to view sign language demonstration for ${info.word}`}
    >
      <Hand size={12} className="text-cyan-400" />
      <span>{info.word}</span>
      <span className="text-[10px] text-cyan-300 bg-cyan-500/20 px-1.5 py-0.2 rounded font-mono">🤟 Sign</span>
    </button>
  );
};

export const SignWordModal = ({ isOpen, signInfo, onClose }) => {
  if (!isOpen || !signInfo) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative flex flex-col w-full max-w-md rounded-3xl border border-cyan-500/40 bg-[#070d09] shadow-2xl overflow-hidden p-6 space-y-4 text-center"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Hand size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {signInfo.word}
                </h4>
                <span className="text-[10px] font-mono uppercase text-cyan-400">{signInfo.category}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-text-muted hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* 3D Sign Avatar Animation Simulator */}
          <div className="relative h-52 w-full rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/30 to-black flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
            <div className="relative flex items-center justify-center h-28 w-28 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 mb-2 shadow-lg shadow-cyan-500/20">
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Hand size={52} className="text-cyan-300" />
              </motion.div>
            </div>
            <p className="text-xs font-mono text-cyan-300 font-bold">Avatar Sign Demonstration Active</p>
            <span className="text-[10px] text-text-muted">MediaPipe 21-point hand skeleton tracking active</span>
          </div>

          {/* Description */}
          <div className="text-left bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
              Concept Sign Definition
            </span>
            <p className="text-xs text-white/90 leading-relaxed">
              {signInfo.desc}
            </p>
          </div>

          {/* Action Links to Component 4 & 5 */}
          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/sign-avatar"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all"
            >
              <span>Full Avatar Studio</span>
              <ArrowUpRight size={13} />
            </Link>
            <Link
              to="/sign-course"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/30 transition-all"
            >
              <span>Practice Arena</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
