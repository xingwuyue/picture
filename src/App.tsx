import React, { useCallback } from 'react';
import { useCompressionStore } from './stores/compressionStore';
import FolderSettings from './components/FolderSettings';
import ImageFormats from './components/ImageFormats';
import OutputSettings from './components/OutputSettings';
import ActionButtons from './components/ActionButtons';
import ImageList from './components/ImageList';
import CompressionResults from './components/CompressionResults';
import OperationLogs from './components/OperationLogs';

declare global {
  interface Window {
    electronAPI?: {
      selectFolder: () => Promise<{ canceled: boolean; filePaths: string[] }>;
    };
  }
}

const App: React.FC = () => {
  const {
    selectedFolder,
    setSelectedFolder,
    scanImages,
    compressImages,
    backupImages,
    clearResults,
    addLog,
    images,
    compressionResults,
    isScanning,
    isProcessing
  } = useCompressionStore();

  const handleFolderSelect = useCallback(async () => {
    const sampleFolders = [
      'D:\\图片测试',
      'D:\\照片',
      'D:\\下载\\图片',
      'C:\\Users\\Public\\Pictures',
      'D:\\工作\\图片素材'
    ];

    const folder = window.prompt(
      `请输入图片目录路径，或输入序号选择示例目录:\n\n${sampleFolders
        .map((path, index) => `${index + 1}. ${path}`)
        .join('\n')}`,
      selectedFolder || '1'
    );

    if (!folder) return;

    const index = Number.parseInt(folder, 10);
    const resolvedPath =
      !Number.isNaN(index) && index >= 1 && index <= sampleFolders.length
        ? sampleFolders[index - 1]
        : folder;

    setSelectedFolder(resolvedPath);
    addLog(`已选择图片目录: ${resolvedPath}`);
  }, [addLog, selectedFolder, setSelectedFolder]);

  const handleScanImages = useCallback(async () => {
    await scanImages();
  }, [scanImages]);

  const handleCompressImages = useCallback(async () => {
    await compressImages();
  }, [compressImages]);

  const handleBackupImages = useCallback(async () => {
    await backupImages();
  }, [backupImages]);

  return (
    <div className="app-container">
      <div className="app-shell">
        <header className="app-header">
          <div className="header-copy">
            <p className="eyebrow">本地批处理</p>
            <h1 className="app-title">图片压缩工具</h1>
            <p className="app-subtitle">
              本地批量压缩、格式转换和备份，适合处理站点素材与照片目录。
            </p>
          </div>

          <div className="metric-row" aria-label="当前处理状态">
            <div className="metric-card">
              <span className="metric-label">目录</span>
              <strong className="metric-value">{selectedFolder ? '已选择' : '未选择'}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">待处理</span>
              <strong className="metric-value">{images.length}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-label">结果</span>
              <strong className="metric-value">{compressionResults.length}</strong>
            </div>
          </div>
        </header>

        <main className="app-main">
          <section className="workspace-grid" aria-label="图片压缩工作区">
            <div className="left-column">
              <FolderSettings
                selectedFolder={selectedFolder}
                onFolderSelect={handleFolderSelect}
                onScanImages={handleScanImages}
                isScanning={isScanning}
              />
              <ImageFormats />
            </div>

            <div className="right-column">
              <OutputSettings />
              <ActionButtons
                onCompressImages={handleCompressImages}
                onClearResults={clearResults}
                onBackupImages={handleBackupImages}
                isCompressing={isProcessing}
                disabled={!selectedFolder}
              />
            </div>
          </section>

          <section className="results-grid" aria-label="处理结果">
            <ImageList />
            <CompressionResults />
          </section>

          <OperationLogs />
        </main>
      </div>
    </div>
  );
};

export default App;
