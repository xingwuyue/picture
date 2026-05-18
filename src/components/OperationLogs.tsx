import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

const OperationLogs: React.FC = () => {
  const { logs, clearLogs } = useCompressionStore();

  return (
    <div className="module-section">
      <div className="logs-container">
        <div className="logs-header">
          <h3 className="logs-title">
            📝 操作日志
          </h3>
          <div className="log-actions">
            <span className="log-count">{logs.length} 条</span>
            {logs.length > 0 && (
              <button className="ghost-button" onClick={clearLogs}>清空</button>
            )}
          </div>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <span className="empty-text">暂无操作日志</span>
          </div>
        ) : (
          <div className="log-content">
            {logs.map((log, index) => {
              const timestamp = log.match(/\[(.*?)\]/)?.[1] || '';
              const message = log.replace(/\[.*?\]\s*/, '');
              
              return (
                <div key={index} className="log-item">
                  <span className="log-timestamp">{timestamp}</span>
                  <span className="log-message">{message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationLogs;
