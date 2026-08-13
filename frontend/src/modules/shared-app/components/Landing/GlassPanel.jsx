import { motion } from 'framer-motion';

const GlassPanel = ({ title, eyebrow, description, icon: Icon, children, className = '' }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`glass-panel rounded-[30px] border border-white/[0.06] p-6 md:p-7 ${className}`}
    >
      {(title || eyebrow || description) && (
        <div className="mb-5">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/16 bg-primary/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              {Icon ? <Icon size={13} /> : null}
              {eyebrow}
            </div>
          )}
          {title && <h3 className="mt-4 text-2xl font-black text-white md:text-[2.1rem]">{title}</h3>}
          {description && <p className="mt-3 text-sm leading-8 text-text-muted md:text-base">{description}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
};

export default GlassPanel;
