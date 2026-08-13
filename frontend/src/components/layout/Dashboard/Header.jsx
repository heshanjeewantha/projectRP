const Header = ({ label, icon: Icon, title, description, className = '' }) => {
  return (
    <div className={`dashboard-header ${className}`}>
      {label && (
        <div className="dashboard-label">
          {Icon ? <Icon size={12} /> : null}
          <span>{label}</span>
        </div>
      )}
      {title ? <h2 className="dashboard-title">{title}</h2> : null}
      {description ? <p className="dashboard-subtitle">{description}</p> : null}
    </div>
  );
};

export default Header;
