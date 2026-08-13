const SectionHeading = ({ eyebrow, title, description, align = 'left' }) => {
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      {eyebrow && (
        <div className={`inline-flex items-center rounded-full border border-primary/16 bg-primary/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-primary ${align === 'center' ? 'justify-center' : ''}`}>
          {eyebrow}
        </div>
      )}
      <h2 className="mt-4 text-3xl font-black tracking-tight text-white leading-[1.02] md:text-[3.6rem]">{title}</h2>
      {description && (
        <p className={`mt-4 text-sm leading-8 text-text-muted md:text-base ${align === 'center' ? 'max-w-3xl mx-auto' : 'max-w-3xl'}`}>
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
