import DashboardPanel from './DashboardPanel';
import Header from './Header';

const WebcamPanel = ({ icon, title, description, status, media }) => {
  return (
    <DashboardPanel>
      <Header label="Webcam" icon={icon} title={title} description={description} />
      <div className="mt-5">{media}</div>
      <div className="lesson-status-strip">
        Status:{' '}
        <span className={status.tone}>
          {status.label}
        </span>
      </div>
    </DashboardPanel>
  );
};

export default WebcamPanel;
