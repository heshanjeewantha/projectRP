import { ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

const ConceptCard = ({ concept, isActive = false }) => {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      className={`rounded-[22px] px-4 py-4 transition-all ${
        isActive ? 'bg-primary/[0.07] shadow-[0_0_22px_rgba(52,211,153,0.08)]' : 'bg-black/18'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-primary">
          <ClipboardList size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {concept.unit}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                concept.difficultyLevel?.toLowerCase() === 'easy'
                  ? 'bg-primary/12 text-primary'
                  : 'bg-warning/12 text-warning'
              }`}
            >
              {concept.difficultyLevel}
            </span>
          </div>
          <h4 className="dashboard-text-wrap mt-2 text-[1.5rem] font-black leading-tight text-white">
            {concept.conceptName}
          </h4>
          <p className="dashboard-text-wrap mt-2 text-sm text-text-muted">{concept.description}</p>
          <div className="mt-3 text-right text-lg font-semibold text-primary">{concept.match}% Match</div>
        </div>
      </div>
    </motion.article>
  );
};

export default ConceptCard;
