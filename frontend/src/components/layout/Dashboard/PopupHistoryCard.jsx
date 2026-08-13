const PopupHistoryCard = ({ answer }) => {
  return (
    <article className="rounded-[20px] bg-black/18 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          {answer.conceptName}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
            answer.isCorrect ? 'bg-primary/12 text-primary' : 'bg-danger/12 text-danger'
          }`}
        >
          {answer.isCorrect ? 'Correct' : 'Review'}
        </span>
      </div>
      <p className="dashboard-text-wrap mt-3 text-base text-white/92">{answer.questionText}</p>
      <p className="dashboard-text-wrap mt-2 text-sm text-text-muted">{answer.explanation}</p>
    </article>
  );
};

export default PopupHistoryCard;
