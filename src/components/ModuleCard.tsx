import React from 'react';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: string;
}

const ModuleCard: React.FC<Props> = ({ children, title, subtitle, icon }) => {
  return (
    <div className="glass-card">
      {(title || icon) && (
        <div className="module-header">
          {icon && <span className="module-icon">{icon}</span>}
          <div>
            <h3 className="module-title">{title}</h3>
            {subtitle && <p className="module-description">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default ModuleCard;