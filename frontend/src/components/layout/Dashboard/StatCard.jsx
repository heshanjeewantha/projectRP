const StatCard = ({ icon: Icon, label, value, description }) => {
  return (
    <article className="dashboard-stat-card lesson-stat-card">
      <div className="lesson-stat-icon">
        {Icon ? <Icon size={24} /> : null}
      </div>
      <div className="lesson-stat-label">{label}</div>
      <div className="dashboard-text-wrap lesson-stat-value">
        {value}
      </div>
      <p className="dashboard-text-wrap lesson-stat-copy">{description}</p>
    </article>
  );
};

export default StatCard;
