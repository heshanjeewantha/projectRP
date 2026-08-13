import DashboardPanel from './DashboardPanel';
import Header from './Header';
import StatCard from './StatCard';

const VideoPanel = ({
  icon,
  title,
  description,
  chips = [],
  stats = [],
  media,
}) => {
  return (
    <DashboardPanel className="dashboard-panel-hero">
      <Header label="Lesson" icon={icon} title={title} description={description} />

      {chips.length > 0 && (
        <div className="dashboard-chip-row mt-5">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={`dashboard-chip ${chip.accent ? 'text-primary' : ''}`}
            >
              {chip.icon ? <chip.icon size={16} className={chip.accent ? 'text-primary' : ''} /> : null}
              <span>{chip.label}</span>
            </span>
          ))}
        </div>
      )}

      {stats.length > 0 && (
        <div className="dashboard-stat-grid mt-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      <div className="mt-6">{media}</div>
    </DashboardPanel>
  );
};

export default VideoPanel;
