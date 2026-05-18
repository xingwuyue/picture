import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

const ImageList: React.FC = () => {
  const { images } = useCompressionStore();
  if (images.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="module-section">
      <div className="file-list-container">
        <div className="file-list-header">
          <h3 className="file-list-title">
            📷 扫描结果
          </h3>
          <span className="file-count">{images.length} 张</span>
        </div>
        <div className="file-list">
          {images.map((image, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <span className="file-icon">🖼️</span>
                <div className="file-details">
                  <div className="file-name">{image.name}</div>
                  <div className="file-path">{image.relativePath}</div>
                </div>
              </div>
              <span className="file-size">{formatFileSize(image.size)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageList;
