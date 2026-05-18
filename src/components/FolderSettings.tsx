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
  
  const handleBackupFolderSelect = async () => {
    const mockFolders = [
      'D:\\备份',
      'D:\\图片备份',
      'D:\\Backup',
      'C:\\用户\\备份',
      'D:\\工作\\备份'
    ];
    
    const folder = window.prompt(
      '请选择备份文件夹路径（或输入自定义路径）：\n\n' +
      mockFolders.map((f, i) => `${i + 1}. ${f}`).join('\n') +
      '\n\n输入数字 (1-5) 或自定义路径',
      '1'
    );
    
    if (!folder) return;

    const index = parseInt(folder, 10);
    const resolvedPath =
      !Number.isNaN(index) && index >= 1 && index <= mockFolders.length
        ? mockFolders[index - 1]
        : folder;

    setConfig({ backupFolder: resolvedPath });
  };

  return (
    <div className="module-section">
      <div className="module-header">
        <span className="module-icon">📁</span>
        <div>
          <h3 className="module-title">文件夹设置</h3>
          <p className="module-description">选择源目录，必要时先做备份</p>
        </div>
      </div>
      
      <div className="control-group">
        <label className="control-label">图片文件夹</label>
        <div className="input-wrapper">
          <input
            type="text"
            value={selectedFolder}
            readOnly
            placeholder="请点击选择文件夹"
            className="control-input"
          />
        </div>
        <div className="button-group">
          <button 
            onClick={onFolderSelect}
            className="btn btn-primary"
            disabled={isScanning}
          >
            📂 选择文件夹
          </button>
          {selectedFolder && (
          <button 
            onClick={onScanImages}
            className="btn btn-green"
            disabled={isScanning}
          >
              {isScanning ? '🔍 正在扫描...' : '🔍 扫描图片'}
            </button>
          )}
        </div>
      </div>
      
      <div className="control-group">
        <label className="control-label">备份文件夹（可选）</label>
        <div className="input-wrapper">
          <input
            type="text"
            value={config.backupFolder || ''}
            readOnly
            placeholder="选择后可在压缩前先备份"
            className="control-input"
          />
        </div>
        <div className="button-group">
          <button 
            onClick={handleBackupFolderSelect}
            className="btn btn-secondary"
          >
            💾 选择备份文件夹
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderSettings;
