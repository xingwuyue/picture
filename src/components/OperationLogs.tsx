import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

const splitLog = (log: string) => {
  const match = log.match(/^\[(.*?)\]\s?(.*)$/);
  return {
    time: match?.[1] || '',
    message: match?.[2] || log
  };
};

const OperationLogs: React.FC = () => {
  const { logs, clearLogs } = useCompressionStore();

  return (
    <section className="panel logs-panel">
      <div className="panel-header horizontal">
        <div>
          <h2 className="panel-title">操作日志</h2>
          <p className="panel-description">记录扫描、备份和压缩过程。</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={clearLogs} disabled={logs.length === 0}>
          清空
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">暂无操作记录。</div>
      ) : (
        <div className="log-list">
          {logs.map((log, index) => {
            const { time, message } = splitLog(log);
            return (
              <div className="log-row" key={`${log}-${index}`}>
                <time>{time}</time>
                <span>{message}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default OperationLogs;
