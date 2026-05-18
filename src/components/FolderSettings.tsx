import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

interface Props {
  selectedFolder: string;
  onFolderSelect: () => void;
  onScanImages: () => void;
  isScanning: boolean;
}

const FolderSettings: React.FC<Props> = ({
  selectedFolder,
  onFolderSelect,
  onScanImages,
  isScanning
}) => {
  const { config, setConfig } = useCompressionStore();

  const handleBackupFolderSelect = () => {
    const sampleFolders = [
      'D:\\图片备份',
      'D:\\Backup',
      'D:\\工作\\素材备份',
      'C:\\Users\\Public\\Pictures\\Backup'
    ];

    const folder = window.prompt(
      `请输入备份目录路径，或输入序号选择示例目录:\n\n${sampleFolders
        .map((path, index) => `${index + 1}. ${path}`)
        .join('\n')}`,
      config.backupFolder || '1'
    );

    if (!folder) return;

    const index = Number.parseInt(folder, 10);
    const resolvedPath =
      !Number.isNaN(index) && index >= 1 && index <= sampleFolders.length
        ? sampleFolders[index - 1]
        : folder;

    setConfig({ backupFolder: resolvedPath });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">目录与扫描</h2>
          <p className="panel-description">选择源目录，扫描后再执行备份或压缩。</p>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="source-folder">
          图片目录
        </label>
        <div className="path-field">
          <input
            id="source-folder"
            className="control-input"
            type="text"
            value={selectedFolder}
            readOnly
            placeholder="选择图片目录后开始扫描。"
          />
          <button className="btn btn-secondary" type="button" onClick={onFolderSelect}>
            选择
          </button>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="backup-folder">
          备份目录
        </label>
        <div className="path-field">
          <input
            id="backup-folder"
            className="control-input"
            type="text"
            value={config.backupFolder || ''}
            readOnly
            placeholder="可选，压缩前可先复制原图。"
          />
          <button className="btn btn-secondary" type="button" onClick={handleBackupFolderSelect}>
            选择
          </button>
        </div>
      </div>

      <button
        className="btn btn-primary full-width"
        type="button"
        onClick={onScanImages}
        disabled={isScanning || !selectedFolder}
      >
        {isScanning ? '正在扫描...' : '扫描图片'}
      </button>
    </section>
  );
};

export default FolderSettings;
