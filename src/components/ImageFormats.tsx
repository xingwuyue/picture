import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

const ImageFormats: React.FC = () => {
  const { config, setConfig } = useCompressionStore();
  const formatOptions = [
    { value: 'png', label: 'PNG', icon: '🖼️' },
    { value: 'jpg', label: 'JPG', icon: '📸' },
    { value: 'jpeg', label: 'JPEG', icon: '📷' },
    { value: 'webp', label: 'WebP', icon: '🕸️' }
  ];

  const handleFormatChange = (format: string, checked: boolean) => {
    if (checked) {
      setConfig({ imageFormats: [...config.imageFormats, format] });
    } else {
      setConfig({ imageFormats: config.imageFormats.filter(f => f !== format) });
    }
  };

  return (
    <div className="module-section">
      <div className="module-header">
        <span className="module-icon">🎯</span>
        <div>
          <h3 className="module-title">需要扫描的格式</h3>
          <p className="module-description">勾选会被扫描并参与压缩/转换的格式</p>
        </div>
      </div>
      
      <div className="checkbox-grid">
        {formatOptions.map((format) => (
          <label key={format.value} className="checkbox-item" htmlFor={`format-${format.value}`}>
            <input
              type="checkbox"
              id={`format-${format.value}`}
              checked={config.imageFormats.includes(format.value)}
              onChange={(e) => handleFormatChange(format.value, e.target.checked)}
            />
            <span>{format.icon} {format.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ImageFormats;
