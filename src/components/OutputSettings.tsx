import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';
import type { CompressionMode } from '../stores/compressionStore';

const formatOptions = [
  { value: 'original', label: '保留原始格式' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' }
];

const modeOptions: Array<{ value: CompressionMode; label: string; hint: string }> = [
  { value: 'lossless', label: '无损优先', hint: 'PNG/WebP/AVIF 无损；JPG 尽量不重编码' },
  { value: 'low-loss', label: '低损高画质', hint: '适合照片与生产素材，优先观感' },
  { value: 'balanced', label: '均衡压缩', hint: '使用质量滑杆，兼顾体积和画质' },
  { value: 'aggressive', label: '极限压缩', hint: '更小体积，允许更明显画质损失' }
];

const OutputSettings: React.FC = () => {
  const { config, setConfig } = useCompressionStore();

  const handleNumberChange = (value: string, key: 'width' | 'height') => {
    const parsed = value ? Number.parseInt(value, 10) : undefined;
    setConfig({ [key]: Number.isNaN(parsed) ? undefined : parsed });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">输出设置</h2>
          <p className="panel-description">控制格式、压缩模式、尺寸、质量和输出位置。</p>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="compression-mode">
          压缩模式
        </label>
        <select
          id="compression-mode"
          className="select-control"
          value={config.compressionMode}
          onChange={(event) => setConfig({ compressionMode: event.target.value as CompressionMode })}
        >
          {modeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="field-note">
          {modeOptions.find((option) => option.value === config.compressionMode)?.hint}
        </p>
      </div>

      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="output-format">
            输出格式
          </label>
          <select
            id="output-format"
            className="select-control"
            value={config.outputFormat}
            onChange={(event) => setConfig({ outputFormat: event.target.value })}
          >
            {formatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="width">
            宽度 (px)
          </label>
          <input
            id="width"
            className="number-control"
            type="number"
            min={1}
            value={config.width || ''}
            onChange={(event) => handleNumberChange(event.target.value, 'width')}
            placeholder="留空保持原尺寸"
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="height">
            高度 (px)
          </label>
          <input
            id="height"
            className="number-control"
            type="number"
            min={1}
            value={config.height || ''}
            onChange={(event) => handleNumberChange(event.target.value, 'height')}
            placeholder="留空保持原尺寸"
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="quality">
            压缩质量
          </label>
          <div className="range-row">
            <input
              id="quality"
              className="range-control"
              type="range"
              min={40}
              max={100}
              value={config.quality}
              onChange={(event) => setConfig({ quality: Number.parseInt(event.target.value, 10) })}
            />
            <span className="value-pill">{config.quality}%</span>
          </div>
        </div>
      </div>

      <div className="option-row">
        <label className="switch-row" htmlFor="aspect-ratio">
          <input
            id="aspect-ratio"
            type="checkbox"
            checked={config.maintainAspectRatio}
            onChange={(event) => setConfig({ maintainAspectRatio: event.target.checked })}
          />
          <span>保持宽高比</span>
        </label>

        <label className="switch-row" htmlFor="avoid-larger-output">
          <input
            id="avoid-larger-output"
            type="checkbox"
            checked={config.avoidLargerOutput}
            onChange={(event) => setConfig({ avoidLargerOutput: event.target.checked })}
          />
          <span>跳过变大输出</span>
        </label>

        <label className="switch-row" htmlFor="preserve-metadata">
          <input
            id="preserve-metadata"
            type="checkbox"
            checked={config.preserveMetadata}
            onChange={(event) => setConfig({ preserveMetadata: event.target.checked })}
          />
          <span>保留元数据</span>
        </label>

        <label className="switch-row" htmlFor="overwrite-original">
          <input
            id="overwrite-original"
            type="checkbox"
            checked={!!config.overwriteOriginal}
            onChange={(event) => setConfig({ overwriteOriginal: event.target.checked })}
          />
          <span>直接写入源目录</span>
        </label>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="output-folder">
          输出目录
        </label>
        <input
          id="output-folder"
          className="control-input"
          type="text"
          value={config.outputFolder || ''}
          onChange={(event) => setConfig({ outputFolder: event.target.value })}
          placeholder="留空则写入源目录下的 __compressed"
        />
      </div>
    </section>
  );
};

export default OutputSettings;
