import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, index)).toFixed(2))} ${sizes[index]}`;
};

const ImageList: React.FC = () => {
  const { images } = useCompressionStore();

  return (
    <section className="panel result-panel">
      <div className="panel-header horizontal">
        <div>
          <h2 className="panel-title">扫描结果</h2>
          <p className="panel-description">扫描后将在这里显示图片列表。</p>
        </div>
        <span className="count-badge">{images.length} 张</span>
      </div>

      {images.length === 0 ? (
        <div className="empty-state">选择图片目录后开始扫描。</div>
      ) : (
        <div className="list-table">
          {images.map((image, index) => (
            <div className="list-row" key={`${image.path}-${index}`}>
              <div className="list-main">
                <strong>{image.name}</strong>
                <span>{image.relativePath}</span>
              </div>
              <span className="size-cell">{formatFileSize(image.size)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ImageList;
