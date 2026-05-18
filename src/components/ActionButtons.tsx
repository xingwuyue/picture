import React from 'react';
import { useCompressionStore } from '../stores/compressionStore';

interface Props {
  onCompressImages: () => void;
  onClearResults: () => void;
  onBackupImages?: () => void;
  isCompressing: boolean;
  disabled: boolean;
}

const ActionButtons: React.FC<Props> = ({
  onCompressImages,
  onClearResults,
  onBackupImages,
  isCompressing,
  disabled
}) => {
  const { images, config } = useCompressionStore();
  const nothingToDo = images.length === 0;

  return (
    <div className="module-section">
      <div className="module-header">
        <span className="module-icon">🚀</span>
        <div>
          <h3 className="module-title">操作控制</h3>
          <p className="module-description">扫描完后可选择备份并启动压缩</p>
        </div>
      </div>
      
      <div className="btn-group">
        <button
          onClick={onCompressImages}
          disabled={disabled || isCompressing || nothingToDo}
          className="btn btn-primary"
          style={{ flex: 1 }}
        >
          {isCompressing ? '⏳ 正在压缩...' : '🚀 开始压缩'}
        </button>
        
        {onBackupImages && (
          <button
            onClick={onBackupImages}
            disabled={disabled || isCompressing || !config.backupFolder}
            className="btn btn-green"
            style={{ flex: 1 }}
          >
            💾 先备份
          </button>
        )}
        
        <button
          onClick={onClearResults}
          disabled={isCompressing}
          className="btn btn-secondary"
          style={{ flex: 1 }}
        >
          🗑️ 清空结果
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
