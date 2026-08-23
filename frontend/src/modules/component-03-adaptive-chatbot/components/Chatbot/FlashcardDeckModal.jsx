import { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFlashcards, reviewFlashcard } from '../../services/chatbotApi';

const FlashcardDeckModal = ({ isOpen, onClose, topicId = 'computer_system', studentId = 'student_demo_123' }) => {
  const [deck, setDeck] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDeck();
    }
  }, [isOpen, topicId]);

  const loadDeck = async () => {
    setIsLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);
    setFeedbackNotice('');
    try {
      const data = await getFlashcards(topicId, studentId);
      setDeck(data);
    } catch (error) {
      console.error('Failed to load flashcard deck', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentCard = deck?.cards?.[currentIndex];
  const totalCards = deck?.cards?.length || 0;

  const handleRating = async (rating) => {
    if (!currentCard) return;
    try {
      const res = await reviewFlashcard({
        studentId,
        cardId: currentCard.id,
        rating,
      });
      setFeedbackNotice(res.message);

      setTimeout(() => {
        setFeedbackNotice('');
        setIsFlipped(false);
        if (currentIndex < totalCards - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setCurrentIndex(0);
        }
      }, 1000);
    } catch (error) {
      console.error('Rating submission failed', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative flex flex-col w-full max-w-xl rounded-3xl border border-white/10 bg-[#070d09] shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Interactive AI Flashcards
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                    SM-2 SRS
                  </span>
                </h3>
                <p className="text-xs text-text-muted">{deck?.topicName || 'Revision Deck'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-text-muted hover:bg-white/5 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body: 3D Flip Flashcard */}
          <div className="p-6 flex flex-col items-center space-y-5">
            {/* Progress indicator */}
            <div className="flex items-center justify-between w-full text-xs font-mono text-text-muted px-2">
              <span>Card {currentIndex + 1} of {totalCards}</span>
              <span className="text-primary flex items-center gap-1">
                <Flame size={12} />
                Spaced Repetition Active
              </span>
            </div>

            {/* Flip Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full h-64 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 flex flex-col justify-between shadow-2xl cursor-pointer hover:border-primary/30 transition-all select-none group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-primary">
                  {currentCard?.category || 'Concept'}
                </span>
                <span className="text-[11px] font-mono text-text-muted flex items-center gap-1 group-hover:text-primary transition-colors">
                  <RotateCcw size={12} />
                  Click to {isFlipped ? 'see question' : 'reveal answer'}
                </span>
              </div>

              {/* Card Face Content */}
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <AnimatePresence mode="wait">
                  {!isFlipped ? (
                    <motion.div
                      key="front"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-2"
                    >
                      <span className="text-[11px] font-mono text-primary uppercase tracking-widest block">Question</span>
                      <p className="text-base font-bold text-white leading-relaxed">
                        {currentCard?.front}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3"
                    >
                      <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest block">Answer</span>
                      <p className="text-sm font-medium text-white/95 whitespace-pre-line leading-relaxed">
                        {currentCard?.back}
                      </p>
                      {currentCard?.mnemonic && (
                        <div className="mt-2 text-xs font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl inline-block">
                          💡 {currentCard.mnemonic}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Card Footer */}
              <div className="text-center text-[11px] text-text-muted">
                {isFlipped ? 'Rate your recall confidence below:' : 'Think of the answer before flipping'}
              </div>
            </div>

            {/* Notice Feedback Toast */}
            {feedbackNotice && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full"
              >
                ✓ {feedbackNotice}
              </motion.div>
            )}

            {/* SM-2 Recall Rating Actions */}
            <div className="grid grid-cols-3 gap-3.5 w-full pt-2">
              <button
                onClick={() => handleRating('hard')}
                className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-all text-xs font-bold min-h-[52px] active:scale-95 shadow-sm"
              >
                <span>🔴 Hard</span>
                <span className="text-[10px] text-text-muted mt-1 font-mono">Review 1d</span>
              </button>
              <button
                onClick={() => handleRating('good')}
                className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all text-xs font-bold min-h-[52px] active:scale-95 shadow-sm"
              >
                <span>🟡 Good</span>
                <span className="text-[10px] text-text-muted mt-1 font-mono">Review 3d</span>
              </button>
              <button
                onClick={() => handleRating('easy')}
                className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-all text-xs font-bold min-h-[52px] active:scale-95 shadow-sm"
              >
                <span>🟢 Easy</span>
                <span className="text-[10px] text-text-muted mt-1 font-mono">Review 7d</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FlashcardDeckModal;
