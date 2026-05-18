import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

const formatOptions = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' }
];

const ImageFormats: React.FC = () => {
  const { config, setConfig } = useCompressionStore();

  const handleFormatChange = (format: string, checked: boolean) => {
    const nextFormats = checked
      ? Array.from(new Set([...config.imageFormats, format]))
      : config.imageFormats.filter((value) => value !== format);

    setConfig({ imageFormats: nextFormats });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">格式筛选</h2>
          <p className="panel-description">只扫描勾选格式，减少无关文件进入队列。</p>
        </div>
      </div>

      <div className="checkbox-grid">
        {formatOptions.map((format) => (
          <label className="check-card" key={format.value} htmlFor={`format-${format.value}`}>
            <input
              id={`format-${format.value}`}
              type="checkbox"
              checked={config.imageFormats.includes(format.value)}
              onChange={(event) => handleFormatChange(format.value, event.target.checked)}
            />
            <span>{format.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
};

export default ImageFormats;
