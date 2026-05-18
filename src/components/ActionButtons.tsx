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
  const { images, compressionResults, config } = useCompressionStore();
  const hasImages = images.length > 0;
  const hasResults = compressionResults.length > 0;

  return (
    <section className="panel action-panel">
      <div className="panel-header horizontal">
        <div>
          <h2 className="panel-title">执行操作</h2>
          <p className="panel-description">扫描后可先备份，再开始压缩。</p>
        </div>
        <span className="queue-pill">{images.length} 张待处理</span>
      </div>

      <div className="action-grid">
        <button
          className="btn btn-primary"
          type="button"
          onClick={onCompressImages}
          disabled={disabled || isCompressing || !hasImages}
        >
          {isCompressing ? '正在处理...' : '开始压缩'}
        </button>

        {onBackupImages && (
          <button
            className="btn btn-success"
            type="button"
            onClick={onBackupImages}
            disabled={disabled || isCompressing || !config.backupFolder}
          >
            先备份
          </button>
        )}

        <button
          className="btn btn-secondary"
          type="button"
          onClick={onClearResults}
          disabled={isCompressing || (!hasImages && !hasResults)}
        >
          清空结果
        </button>
      </div>
    </section>
  );
};

export default ActionButtons;
