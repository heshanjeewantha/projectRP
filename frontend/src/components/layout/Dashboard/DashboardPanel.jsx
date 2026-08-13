const DashboardPanel = ({ className = '', children }) => {
  return <section className={`dashboard-panel ${className}`}>{children}</section>;
};

export default DashboardPanel;
