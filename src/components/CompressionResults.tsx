import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

const CompressionResults: React.FC = () => {
  const { compressionResults } = useCompressionStore();
  
  if (compressionResults.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const successfulResults = compressionResults.filter(r => r.success);
  const failedResults = compressionResults.filter(r => !r.success);

  return (
    <div className="module-section">
      <div className="results-container">
        <div className="results-header">
          <h3 className="results-title">
            📊 压缩结果
          </h3>
          <div className="result-stats">
            {successfulResults.length > 0 && (
              <span className="stat-item stat-success">
                ✅ {successfulResults.length} 成功
              </span>
            )}
            {failedResults.length > 0 && (
              <span className="stat-item stat-error">
                ⚠️ {failedResults.length} 失败
              </span>
            )}
          </div>
        </div>
        <div className="results-grid">
          {compressionResults.map((result, index) => (
            <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
              <div className="result-header">
                <span className="result-icon">{result.success ? '✅' : '⚠️'}</span>
                <div className="result-main">
                  <div className="result-title">
                    {index + 1}. {result.name}
                  </div>
                  <div className="result-path">📍 {result.path}</div>
                </div>
              </div>
              
              {result.success ? (
                <div className="compression-result">
                  <div className="compression-stats">
                    <div className="compression-stat">
                      <span>原始:</span>
                      <strong>{formatFileSize(result.originalSize)}</strong>
                    </div>
                    <div className="compression-stat">
                      <span>压缩后:</span>
                      <strong>{formatFileSize(result.compressedSize)}</strong>
                    </div>
                    <div className="compression-stat">
                      <span>节省:</span>
                      <span className="compression-ratio">{result.compressionRatio}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span><strong>错误:</strong> {result.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompressionResults;
