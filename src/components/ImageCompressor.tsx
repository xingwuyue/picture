import React, { useState, useEffect } from 'react';

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
  const [overwriteOriginal, setOverwriteOriginal] = useState<boolean>(false); // 是否覆盖原目录
  const [images, setImages] = useState<ImageFile[]>([]);
  const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const formatOptions = [
    { value: 'original', label: '保持原格式' },
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' }
  ];

  const formatCheckboxes = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'webp', label: 'WebP' }
  ];

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
      if ((config as any).overwriteOriginal !== undefined) setOverwriteOriginal((config as any).overwriteOriginal);
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
      maintainAspectRatio,
      // @ts-ignore
      overwriteOriginal
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
    // 由于浏览器安全限制，使用提示框让用户手动输入路径
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

  // 快速加载测试路径
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
          maintainAspectRatio,
          overwriteOriginal
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
          
          // 显示前5个压缩最多的文件
          const topCompressed = successful
            .sort((a: CompressionResult, b: CompressionResult) => (b.originalSize - b.compressedSize) - (a.originalSize - a.compressedSize))
            .slice(0, 5);
          
          if (topCompressed.length > 0) {
            addLog('压缩最多的文件：');
            topCompressed.forEach((file: CompressionResult, index: number) => {
              const saved = file.originalSize - file.compressedSize;
              addLog(`  ${index + 1}. ${file.name}: ${formatFileSize(saved)} (${file.compressionRatio}%)`);
            });
          }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              智能图片压缩
            </h1>
            <p className="text-gray-600 text-lg">高效、智能、安全的图片压缩解决方案</p>
          </div>
          
          {/* 文件夹选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                📁 源文件夹路径
              </label>
              <div className="flex group">
                <input
                  type="text"
                  value={sourceFolder}
                  onChange={(e) => setSourceFolder(e.target.value)}
                  placeholder="请选择或输入源文件夹路径"
                  className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-l-xl focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-200"
                />
                <button
                  onClick={() => selectFolder('source')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-r-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  📂 选择
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                💾 备份文件夹路径
              </label>
              <div className="flex group">
                <input
                  type="text"
                  value={backupFolder}
                  onChange={(e) => setBackupFolder(e.target.value)}
                  placeholder="请选择或输入备份文件夹路径"
                  className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-l-xl focus:outline-none focus:border-green-400 focus:bg-white transition-all duration-200"
                />
                <button
                  onClick={() => selectFolder('backup')}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-r-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  📂 选择
                </button>
              </div>
            </div>
          </div>

          {/* 图片格式选择 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-800 mb-4">
              🎯 选择图片格式
            </label>
            <div className="flex flex-wrap gap-4">
              {formatCheckboxes.map((format) => (
                <label key={format.value} className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={imageFormats.includes(format.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setImageFormats([...imageFormats, format.value]);
                      } else {
                        setImageFormats(imageFormats.filter(f => f !== format.value));
                      }
                    }}
                    className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                    {format.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 输出设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                🎨 输出格式
              </label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-200"
              >
                {formatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                📏 宽度 (像素)
              </label>
              <input
                type="number"
                value={width || ''}
                onChange={(e) => setWidth(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="留空保持原尺寸"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                📐 高度 (像素)
              </label>
              <input
                type="number"
                value={height || ''}
                onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="留空保持原尺寸"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-200"
              />
            </div>
            
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              ⚖️ 保持宽高比
            </label>
            <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={maintainAspectRatio}
                  onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                  等比压缩
                </span>
            </label>
          </div>

          {/* 覆盖原目录选项 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              🗂️ 覆盖原目录
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={overwriteOriginal}
                onChange={(e) => setOverwriteOriginal(e.target.checked)}
                className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                直接在原目录写入（可能覆盖原文件）
              </span>
            </label>
          </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-6 mb-8">
            <button
              onClick={scanImages}
              disabled={isScanning || !sourceFolder}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-xl font-semibold text-lg"
            >
              <span className="mr-2">{isScanning ? '🔍' : '📸'}</span>
              {isScanning ? '扫描中...' : '扫描图片'}
            </button>
            
            <button
              onClick={backupImages}
              disabled={isProcessing || !sourceFolder || !backupFolder}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-xl font-semibold text-lg"
            >
              <span className="mr-2">{isProcessing ? '💾' : '📦'}</span>
              {isProcessing ? '备份中...' : '备份图片'}
            </button>
            
            <button
              onClick={compressImages}
              disabled={isProcessing || images.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-xl font-semibold text-lg"
            >
              <span className="mr-2">{isProcessing ? '⚡' : '🚀'}</span>
              {isProcessing ? '压缩中...' : '开始压缩'}
            </button>
            
            <button
              onClick={saveConfig}
              className="px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-xl font-semibold"
            >
              <span className="mr-2">💾</span>
              保存配置
            </button>
            
            <button
              onClick={loadTestPaths}
              className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-xl font-semibold"
            >
              <span className="mr-2">🧪</span>
              加载测试路径
            </button>
          </div>

          {/* 图片列表 */}
          {images.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  📷 找到的图片 
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm ml-2">
                    {images.length} 张
                  </span>
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto bg-gray-50 rounded-2xl border-2 border-gray-200 shadow-inner">
                {images.map((image, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border-b border-gray-200 last:border-b-0 hover:bg-white transition-colors duration-200">
                    <div className="flex items-center">
                      <span className="text-blue-500 mr-3">🖼️</span>
                      <span className="text-sm font-medium text-gray-800 truncate flex-1">{image.relativePath}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
                      {formatFileSize(image.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 压缩结果 */}
          {compressionResults.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  📊 压缩结果
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ✅ {compressionResults.filter(r => r.success).length} 成功
                  </span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ❌ {compressionResults.filter(r => !r.success).length} 失败
                  </span>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto bg-white rounded-2xl border-2 border-gray-200 shadow-inner">
                {compressionResults.map((result, index) => (
                  <div key={index} className={`p-4 border-b border-gray-200 last:border-b-0 ${result.success ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'} transition-colors duration-200`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-2">{result.success ? '✅' : '❌'}</span>
                          <div className="text-base font-semibold text-gray-800">
                            {index + 1}. {result.name}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2 font-mono text-xs">
                          📍 {result.path}
                        </div>
                        {result.success ? (
                          <div className="text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span>📉 压缩效果：</span>
                              <span className="font-bold">
                                {formatFileSize(result.originalSize)} → {formatFileSize(result.compressedSize)} 
                                <span className="text-green-600 ml-2">(节省 {result.compressionRatio}%)</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded-lg">
                            <div className="flex items-center">
                              <span className="mr-2">⚠️</span>
                              <span className="font-semibold">错误: {result.error}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 日志 */}
          {logs.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📝</span>
                <h3 className="text-xl font-bold text-gray-800">
                  操作日志
                </h3>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold ml-auto">
                  {logs.length} 条记录
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto bg-gray-900 rounded-xl p-4 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="text-green-400 mb-2 flex items-start">
                    <span className="text-blue-400 mr-2 flex-shrink-0">{new Date().toLocaleTimeString()}</span>
                    <span className="text-gray-300">{log.split('] ')[1] || log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageCompressor;