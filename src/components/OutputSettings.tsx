import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

const OutputSettings: React.FC = () => {
  const { config, setConfig } = useCompressionStore();
  const formatOptions = [
    { value: 'original', label: '保持原格式' },
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' }
  ];

  const handleNumberChange = (value: string, key: 'width' | 'height') => {
    const parsed = value ? parseInt(value, 10) : undefined;
    setConfig({ [key]: parsed } as Partial<typeof config>);
  };

  return (
    <div className="module-section">
      <div className="module-header">
        <span className="module-icon">⚙️</span>
        <div>
          <h3 className="module-title">输出与压缩</h3>
          <p className="module-description">控制输出格式、尺寸、质量与落地目录</p>
        </div>
      </div>
      
      <div className="grid-4">
        <div className="control-group">
          <label className="control-label">输出格式</label>
          <select
            value={config.outputFormat}
            onChange={(e) => setConfig({ outputFormat: e.target.value })}
            className="select-control"
          >
            {formatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label className="control-label">宽度 (px)</label>
          <input
            type="number"
            value={config.width || ''}
            onChange={(e) => handleNumberChange(e.target.value, 'width')}
            placeholder="留空保持原尺寸"
            className="number-control"
          />
        </div>
        
        <div className="control-group">
          <label className="control-label">高度 (px)</label>
          <input
            type="number"
            value={config.height || ''}
            onChange={(e) => handleNumberChange(e.target.value, 'height')}
            placeholder="留空保持原尺寸"
            className="number-control"
          />
        </div>
        
        <div className="control-group">
          <label className="control-label">尺寸策略</label>
          <label className="checkbox-item inline-checkbox" htmlFor="aspect-ratio">
            <input
              type="checkbox"
              id="aspect-ratio"
              checked={config.maintainAspectRatio}
              onChange={(e) => setConfig({ maintainAspectRatio: e.target.checked })}
            />
            <span>保持宽高比</span>
          </label>
        </div>

        <div className="control-group">
          <label className="control-label">覆盖原目录</label>
          <label className="checkbox-item inline-checkbox" htmlFor="overwrite-original">
            <input
              type="checkbox"
              id="overwrite-original"
              checked={!!config.overwriteOriginal}
              onChange={(e) => setConfig({ overwriteOriginal: e.target.checked })}
            />
            <span>直接写入源目录（可能覆盖原文件）</span>
          </label>
        </div>

        <div className="control-group">
          <label className="control-label">输出目录（可选）</label>
          <input
            type="text"
            value={config.outputFolder || ''}
            onChange={(e) => setConfig({ outputFolder: e.target.value })}
            placeholder="不填则写入源目录下 __compressed"
            className="control-input"
          />
        </div>

        <div className="control-group quality-group">
          <label className="control-label">压缩质量</label>
          <div className="slider-row">
            <input
              type="range"
              min={40}
              max={100}
              value={config.quality}
              onChange={(e) => setConfig({ quality: parseInt(e.target.value, 10) })}
              className="range-control"
            />
            <span className="pill pill-blue">{config.quality}%</span>
          </div>
          <p className="field-hint">数值越高画质越好，文件越大</p>
        </div>
      </div>
    </div>
  );
};

export default OutputSettings;
