import { motion } from 'framer-motion';

const ConceptMiniCard = ({ concept, isActive = false }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`rounded-[24px] border p-5 transition-all ${
        isActive
          ? 'bg-primary/10 shadow-[0_0_28px_rgba(52,211,153,0.08)]'
          : 'bg-white/[0.03]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-text-muted">{concept.unit}</span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
          isActive ? 'bg-primary/16 text-primary' : 'bg-white/6 text-text-muted'
        }`}>
          {concept.difficultyLevel}
        </span>
      </div>
      <h4 className="mt-4 text-xl font-black text-white break-words">{concept.conceptName}</h4>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{concept.description}</p>
      {concept.keywords?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {concept.keywords.slice(0, 4).map((keyword) => (
            <span key={keyword} className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[11px] font-medium text-text-muted">
              {keyword}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ConceptMiniCard;
