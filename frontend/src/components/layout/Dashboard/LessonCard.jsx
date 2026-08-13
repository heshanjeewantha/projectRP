import DashboardPanel from './DashboardPanel';
import Header from './Header';

const LessonCard = ({ icon, title, description, lessonTitle, status, duration }) => {
  return (
    <DashboardPanel>
      <Header label="Now Playing" icon={icon} title={title} description={description} />

      <div className="lesson-current-card">
        <div className="lesson-current-label">Live Lesson</div>
        <div className="dashboard-text-wrap lesson-current-title">
          {lessonTitle}
        </div>
        <div className="lesson-current-meta">
          <span className="lesson-current-pill">
            {status}
          </span>
          <span className="lesson-current-pill">
            {duration}
          </span>
        </div>
      </div>
    </DashboardPanel>
  );
};

export default LessonCard;
