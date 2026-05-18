import React, { useState, useCallback } from 'react';
import { useCompressionStore } from './stores/compressionStore';
import FolderSettings from './components/FolderSettings';
import ImageFormats from './components/ImageFormats';
import OutputSettings from './components/OutputSettings';
import ActionButtons from './components/ActionButtons';
import ImageList from './components/ImageList';
import CompressionResults from './components/CompressionResults';
import OperationLogs from './components/OperationLogs';
import './modular-layout.css';

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
    compressionResults
  } = useCompressionStore();

  const [isScanning, setIsScanning] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFolderSelect = useCallback(async () => {
    const mockFolders = [
      'D:\\图片测试',
      'D:\\照片',
      'D:\\下载\\图片',
      'C:\\用户\\图片',
      'D:\\工作\\图片素材'
    ];

    const folder = window.prompt(
      '请选择文件夹路径（或输入自定义路径）：\n\n' +
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

    setSelectedFolder(resolvedPath);
    addLog(`选择了文件夹: ${resolvedPath}`);
  }, [setSelectedFolder, addLog]);

  const handleScanImages = useCallback(async () => {
    if (!selectedFolder) return;
    setIsScanning(true);
    try {
      await scanImages();
    } catch (error) {
      console.error('扫描图片失败:', error);
    } finally {
      setIsScanning(false);
    }
  }, [selectedFolder, scanImages]);

  const handleCompressImages = useCallback(async () => {
    setIsCompressing(true);
    try {
      await compressImages();
    } catch (error) {
      console.error('压缩图片失败:', error);
    } finally {
      setIsCompressing(false);
    }
  }, [compressImages]);

  const handleBackupImages = useCallback(async () => {
    setIsCompressing(true);
    try {
      await backupImages();
    } catch (error) {
      console.error('备份图片失败:', error);
    } finally {
      setIsCompressing(false);
    }
  }, [backupImages]);

  return (
    <div className="app-container">
      <div className="app-shell">
        <header className="app-header">
          <div className="header-copy">
            <p className="eyebrow">Batch ready · 本地处理</p>
            <h1 className="app-title">图片压缩工具</h1>
            <p className="app-subtitle">
              支持 PNG/JPG/WebP 转换、批量压缩和一键备份，不占用上传带宽。
            </p>
            <div className="header-tags">
              <span className="pill pill-blue">WebP 转换</span>
              <span className="pill pill-amber">批量压缩</span>
              <span className="pill pill-green">安全备份</span>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-metric">
              <span className="metric-label">当前目录</span>
              <div className="metric-value">{selectedFolder ? '已就绪' : '未选择'}</div>
              <div className="metric-sub">
                {selectedFolder || '请选择源文件夹以开始'}
              </div>
            </div>
            <div className="hero-metric">
              <span className="metric-label">队列</span>
              <div className="metric-value">{images.length}</div>
              <div className="metric-sub">待处理图片</div>
            </div>
            <div className="hero-metric">
              <span className="metric-label">结果</span>
              <div className="metric-value">{compressionResults.length}</div>
              <div className="metric-sub">已生成记录</div>
            </div>
          </div>
        </header>

        <div className="status-bar">
          <div className="status-chip">
            <span className="chip-label">已选目录</span>
            <span className="chip-value">{selectedFolder || '未选择'}</span>
          </div>
          <div className="status-chip">
            <span className="chip-label">待压缩</span>
            <span className="chip-value">{images.length} 张</span>
          </div>
          <div className="status-chip">
            <span className="chip-label">压缩结果</span>
            <span className="chip-value">{compressionResults.length} 条</span>
          </div>
        </div>

        <main className="app-main">
          <section className="settings-panel">
            <div className="settings-grid">
              <div className="settings-module">
                <FolderSettings
                  selectedFolder={selectedFolder}
                  onFolderSelect={handleFolderSelect}
                  onScanImages={handleScanImages}
                  isScanning={isScanning}
                />
              </div>

              <div className="settings-module">
                <ImageFormats />
              </div>

              <div className="settings-module">
                <OutputSettings />
              </div>
            </div>
          </section>

          <section className="action-panel">
            <ActionButtons
              onCompressImages={handleCompressImages}
              onClearResults={clearResults}
              onBackupImages={handleBackupImages}
              isCompressing={isCompressing}
              disabled={!selectedFolder}
            />
          </section>

          <section className="content-panel">
            <div className="content-grid">
              <div className="content-module">
                <ImageList />
              </div>
              <div className="content-module">
                <CompressionResults />
              </div>
            </div>
          </section>

          <section className="logs-panel">
            <OperationLogs />
          </section>
        </main>

        <footer className="app-footer">
          <p className="footer-text">批量压缩、格式转换与备份 | 运行于本地，无需上传</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
