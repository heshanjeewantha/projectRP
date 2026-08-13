import { motion } from 'framer-motion';

const HeroStatCard = ({ icon: Icon, label, value, description, accent = 'primary' }) => {
  const accentClass = accent === 'accent' ? 'text-accent bg-accent/10' : 'text-primary bg-primary/10';

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group rounded-[24px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(17,24,21,0.82),rgba(11,16,13,0.72))] px-5 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.14)]"
    >
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${accentClass}`}>
        <Icon size={24} />
      </div>
      <div className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{label}</div>
      <div className="mt-3 break-words text-3xl font-black leading-tight text-white md:text-4xl">{value}</div>
      <p className="mt-3 text-sm leading-8 text-text-muted">{description}</p>
    </motion.div>
  );
};

export default HeroStatCard;
