// @ts-nocheck
import React, { useState, useEffect } from 'react';
import ModuleCard from './ModuleCard';
import FolderSettings from './FolderSettings';
import ImageFormats from './ImageFormats';
import OutputSettings from './OutputSettings';
import ActionButtons from './ActionButtons';
import ImageList from './ImageList';
import CompressionResults from './CompressionResults';
import OperationLogs from './OperationLogs';

interface ImageFile {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  format: string;
}

interface CompressionResult {
  name: string;
  path: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  success: boolean;
  error?: string;
}

interface Config {
  sourceFolder?: string;
  backupFolder?: string;
  imageFormats?: string[];
  outputFormat?: string;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

const ImageCompressor: React.FC = () => {
  const [sourceFolder, setSourceFolder] = useState<string>('');
  const [backupFolder, setBackupFolder] = useState<string>('');
  const [imageFormats, setImageFormats] = useState<string[]>(['png', 'jpg', 'jpeg', 'webp']);
  const [outputFormat, setOutputFormat] = useState<string>('original');
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('http://localhost:3006/api/load-config');
      const config: Config = await response.json();
      
      if (config.sourceFolder) setSourceFolder(config.sourceFolder);
      if (config.backupFolder) setBackupFolder(config.backupFolder);
      if (config.imageFormats) setImageFormats(config.imageFormats);
      if (config.outputFormat) setOutputFormat(config.outputFormat);
      if (config.width) setWidth(config.width);
      if (config.height) setHeight(config.height);
      if (config.maintainAspectRatio !== undefined) setMaintainAspectRatio(config.maintainAspectRatio);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const saveConfig = async () => {
    const config: Config = {
      sourceFolder,
      backupFolder,
      imageFormats,
      outputFormat,
      width,
      height,
      maintainAspectRatio
    };

    try {
      await fetch('http://localhost:3006/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      addLog('配置已保存');
    } catch (error) {
      console.error('保存配置失败:', error);
      addLog('保存配置失败');
    }
  };

  const selectFolder = async (type: 'source' | 'backup') => {
    const folderPath = prompt(`请${type === 'source' ? '源' : '备份'}文件夹的完整路径：`);
    if (folderPath) {
      if (type === 'source') {
        setSourceFolder(folderPath);
      } else {
        setBackupFolder(folderPath);
      }
      addLog(`已设置${type === 'source' ? '源' : '备份'}文件夹: ${folderPath}`);
    }
  };

  const loadTestPaths = () => {
    const testSource = '.\\test-images';
    const testBackup = '.\\test-backup';
    setSourceFolder(testSource);
    setBackupFolder(testBackup);
    addLog('已加载测试路径');
  };

  const scanImages = async () => {
    if (!sourceFolder) {
      alert('请先选择源文件夹');
      return;
    }

    setIsScanning(true);
    addLog('开始扫描图片...');

    try {
      const response = await fetch('http://localhost:3006/api/scan-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: sourceFolder,
          imageFormats
        })
      });

      const data = await response.json();
      if (data.images) {
        setImages(data.images);
        addLog(`扫描完成，找到 ${data.images.length} 张图片`);
      } else {
        addLog('扫描失败');
      }
    } catch (error) {
      console.error('扫描图片失败:', error);
      addLog('扫描图片失败');
    } finally {
      setIsScanning(false);
    }
  };

  const backupImages = async () => {
    if (!sourceFolder || !backupFolder) {
      alert('请先选择源文件夹和备份文件夹');
      return;
    }

    setIsProcessing(true);
    addLog('开始备份图片...');
    addLog(`源文件夹: ${sourceFolder}`);
    addLog(`备份文件夹: ${backupFolder}`);

    try {
      const response = await fetch('http://localhost:3006/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePath: sourceFolder,
          backupPath: backupFolder
        })
      });

      const data = await response.json();
      if (data.success) {
        addLog(`备份完成: ${data.message}`);
        addLog(`总计文件: ${data.totalFiles}, 成功复制: ${data.copiedFiles}`);
      } else {
        addLog(`备份失败: ${data.error}`);
        if (data.details) {
          addLog(`错误详情: ${data.details}`);
        }
      }
    } catch (error) {
      console.error('备份失败:', error);
      addLog(`备份失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const compressImages = async () => {
    if (images.length === 0) {
      alert('请先扫描图片');
      return;
    }

    setIsProcessing(true);
    setCompressionResults([]);
    addLog('开始压缩图片...');
    addLog(`压缩设置: 格式=${outputFormat}, 宽度=${width || '原尺寸'}, 高度=${height || '原尺寸'}, 等比=${maintainAspectRatio}`);

    try {
      const response = await fetch('http://localhost:3006/api/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          outputFormat,
          width,
          height,
          maintainAspectRatio
        })
      });

      const data = await response.json();
      if (data.results) {
        setCompressionResults(data.results);
        
        // 统计结果
        const successful = data.results.filter((r: CompressionResult) => r.success);
        const failed = data.results.filter((r: CompressionResult) => !r.success);
        
        addLog(`压缩完成：成功 ${successful.length} 张，失败 ${failed.length} 张`);
        
        if (successful.length > 0) {
          const totalOriginalSize = successful.reduce((sum: number, r: CompressionResult) => sum + r.originalSize, 0);
          const totalCompressedSize = successful.reduce((sum: number, r: CompressionResult) => sum + r.compressedSize, 0);
          const totalSaved = totalOriginalSize - totalCompressedSize;
          const totalSavedPercent = ((totalSaved / totalOriginalSize) * 100).toFixed(2);
          
          addLog(`总计节省空间：${formatFileSize(totalSaved)} (${totalSavedPercent}%)`);
        }
        
        if (failed.length > 0) {
          addLog(`失败文件: ${failed.length} 个`);
          failed.forEach((file: CompressionResult) => {
            addLog(`  - ${file.name}: ${file.error}`);
          });
        }
      } else {
        addLog(`压缩失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('压缩失败:', error);
      addLog(`压缩失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="app-container">
      <div className="app-content">
        {/* 主内容区 */}
        <div>
          {/* 头部 */}
          <ModuleCard title="智能图片压缩工具" subtitle="高效、智能、安全的图片压缩解决方案" icon="🎯">
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0 }}>
                支持批量处理，智能备份，格式转换，尺寸调整等功能
              </p>
            </div>
          </ModuleCard>

          {/* 文件夹设置 */}
          <FolderSettings
            sourceFolder={sourceFolder}
            backupFolder={backupFolder}
            onSourceFolderChange={setSourceFolder}
            onBackupFolderChange={setBackupFolder}
            onSelectFolder={selectFolder}
          />

          {/* 图片格式和输出设置 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <ImageFormats
              imageFormats={imageFormats}
              onFormatChange={setImageFormats}
            />
            <OutputSettings
              outputFormat={outputFormat}
              width={width}
              height={height}
              maintainAspectRatio={maintainAspectRatio}
              onOutputFormatChange={setOutputFormat}
              onWidthChange={setWidth}
              onHeightChange={setHeight}
              onAspectRatioChange={setMaintainAspectRatio}
            />
          </div>

          {/* 操作按钮 */}
          <ActionButtons
            isScanning={isScanning}
            isProcessing={isProcessing}
            hasImages={images.length > 0}
            sourceFolder={sourceFolder}
            backupFolder={backupFolder}
            onScan={scanImages}
            onBackup={backupImages}
            onCompress={compressImages}
            onSaveConfig={saveConfig}
            onLoadTestPaths={loadTestPaths}
          />

          {/* 图片列表 */}
          <ImageList images={images} />

          {/* 压缩结果 */}
          <CompressionResults results={compressionResults} />
        </div>

        {/* 侧边栏 */}
        <div className="sidebar">
          {/* 操作日志 */}
          <OperationLogs logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default ImageCompressor;
