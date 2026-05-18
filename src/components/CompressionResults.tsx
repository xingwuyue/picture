import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, index)).toFixed(2))} ${sizes[index]}`;
};

const CompressionResults: React.FC = () => {
  const { compressionResults } = useCompressionStore();
  const successfulResults = compressionResults.filter((result) => result.success && !result.skipped);
  const skippedResults = compressionResults.filter((result) => result.skipped);
  const failedResults = compressionResults.filter((result) => !result.success);

  return (
    <section className="panel result-panel">
      <div className="panel-header horizontal">
        <div>
          <h2 className="panel-title">压缩结果</h2>
          <p className="panel-description">完成压缩后将在这里显示结果。</p>
        </div>
        <div className="result-summary">
          <span className="status-badge success">{successfulResults.length} 成功</span>
          <span className="status-badge warning">{skippedResults.length} 跳过</span>
          <span className="status-badge danger">{failedResults.length} 失败</span>
        </div>
      </div>

      {compressionResults.length === 0 ? (
        <div className="empty-state">暂无压缩结果。</div>
      ) : (
        <div className="result-list">
          {compressionResults.map((result, index) => (
            <div
              className={`result-row ${result.success ? 'is-success' : 'is-error'} ${
                result.skipped ? 'is-skipped' : ''
              }`}
              key={index}
            >
              <div className="result-title-row">
                <strong>{result.name}</strong>
                <span>{result.skipped ? '跳过' : result.success ? '成功' : '失败'}</span>
              </div>
              <div className="result-path">{result.path}</div>

              {result.success ? (
                <>
                  <div className="result-metrics">
                    <span>原始 {formatFileSize(result.originalSize)}</span>
                    <span>输出 {formatFileSize(result.compressedSize)}</span>
                    <span>节省 {result.compressionRatio}%</span>
                  </div>
                  {result.message && <div className="result-note">{result.message}</div>}
                </>
              ) : (
                <div className="error-message">错误: {result.error || '未知错误'}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CompressionResults;
