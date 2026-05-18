import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3006;
const SUPPORTED_FORMATS = ['png', 'jpg', 'jpeg', 'webp'];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 获取文件夹中的图片文件
app.post('/api/scan-images', async (req, res) => {
  try {
    const { folderPath, imageFormats } = req.body;

    if (!folderPath) {
      return res.status(400).json({ success: false, error: '缺少文件夹路径' });
    }

    if (!await fs.pathExists(folderPath)) {
      return res.status(400).json({ success: false, error: '文件夹路径不存在' });
    }

    const formats = (imageFormats?.length ? imageFormats : SUPPORTED_FORMATS).map(f => f.toLowerCase());
    const images = [];

    async function scanDirectory(dirPath, relativePath = '') {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        const relPath = path.join(relativePath, item.name);

        if (item.isDirectory()) {
          await scanDirectory(fullPath, relPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase().slice(1);
          if (formats.includes(ext)) {
            const stats = await fs.stat(fullPath);
            images.push({
              name: item.name,
              path: fullPath,
              relativePath: relPath,
              size: stats.size,
              format: ext
            });
          }
        }
      }
    }

    await scanDirectory(folderPath);
    res.json({
      success: true,
      images
    });
  } catch (error) {
    console.error('扫描图片错误:', error);
    res.status(500).json({
      success: false,
      error: '扫描图片失败',
      message: error.message
    });
  }
});

// 备份文件夹
app.post('/api/backup', async (req, res) => {
  try {
    const { sourcePath, backupPath } = req.body;

    if (!sourcePath || !backupPath) {
      return res.status(400).json({ success: false, error: '源路径或备份路径缺失' });
    }

    if (!await fs.pathExists(sourcePath)) {
      return res.status(400).json({ success: false, error: '源文件夹不存在' });
    }

    // 确保备份目录存在
    await fs.ensureDir(backupPath);

    const imageFiles = [];

    async function collectImageFiles(dirPath, relativePath = '') {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        const relPath = path.join(relativePath, item.name);

        if (item.isDirectory()) {
          await collectImageFiles(fullPath, relPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase().slice(1);
          if (SUPPORTED_FORMATS.includes(ext)) {
            imageFiles.push({
              sourcePath: fullPath,
              relativePath: relPath,
              backupPath: path.join(backupPath, relPath)
            });
          }
        }
      }
    }

    await collectImageFiles(sourcePath);
    let copiedCount = 0;

    for (const file of imageFiles) {
      try {
        await fs.ensureDir(path.dirname(file.backupPath));
        await fs.copy(file.sourcePath, file.backupPath);
        copiedCount++;
      } catch (error) {
        console.error(`备份失败 ${file.relativePath}:`, error);
      }
    }

    res.json({
      success: true,
      message: `备份完成，成功复制 ${copiedCount}/${imageFiles.length} 个图片文件`,
      totalFiles: imageFiles.length,
      copiedFiles: copiedCount
    });
  } catch (error) {
    console.error('备份错误:', error);
    res.status(500).json({
      success: false,
      error: '备份失败',
      message: error.message
    });
  }
});

// 压缩图片
app.post('/api/compress', async (req, res) => {
  try {
    const {
      images = [],
      outputFormat = 'original',
      width,
      height,
      maintainAspectRatio = true,
      outputDir,
      overwriteOriginal = false,
      quality
    } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, error: '没有可压缩的图片' });
    }

    const qualityValue = Number.isFinite(quality) ? Math.min(Math.max(Math.round(quality), 1), 100) : 88;
    const results = [];

    console.log(`开始压缩 ${images.length} 张图片`);

    for (const image of images) {
      try {
        const originalSize = image.size;

        // 检查文件是否存在且可访问
        try {
          await fs.access(image.path, fs.constants.R_OK | fs.constants.W_OK);
        } catch (accessError) {
          throw new Error(`无法访问文件: ${accessError.message}`);
        }

        // 计算目标写入路径（支持覆盖原目录与改变扩展名）
        const baseOutputDir = outputDir || path.join(path.dirname(image.path), '__compressed');
        const useDir = overwriteOriginal ? path.dirname(image.path) : baseOutputDir;
        await fs.ensureDir(useDir);
        const baseName = path.basename(image.path, path.extname(image.path));
        const sourceExt = path.extname(image.path).replace('.', '').toLowerCase() || 'png';
        const targetFormat = outputFormat === 'original' ? sourceExt : outputFormat.toLowerCase();
        const normalizedFormat = targetFormat === 'jpg' ? 'jpeg' : targetFormat;
        const targetExt = `.${normalizedFormat === 'jpeg' ? 'jpg' : normalizedFormat}`;
        const targetPath = path.join(useDir, `${baseName}${targetExt}`);

        const imageSharp = sharp(image.path, { failOn: 'none' });
        const metadata = await imageSharp.metadata();

        // 计算缩放参数
        let resizeOptions = {};
        if (width || height) {
          if (maintainAspectRatio) {
            if (width && !height) {
              resizeOptions = { width };
            } else if (height && !width) {
              resizeOptions = { height };
            } else if (width && height) {
              resizeOptions = { width, height, fit: 'inside' };
            }
          } else {
            resizeOptions = { width: width || metadata.width, height: height || metadata.height };
          }
        }

        let processedImage = imageSharp;
        if (Object.keys(resizeOptions).length > 0) {
          processedImage = processedImage.resize(resizeOptions);
        }

        // 输出格式处理，统一用 sharp 以保证跨格式转换（如 PNG → WebP）
        let outputBuffer;
        switch (normalizedFormat) {
          case 'png':
            outputBuffer = await processedImage.png({
              quality: qualityValue,
              compressionLevel: 9,
              palette: true
            }).toBuffer();
            break;
          case 'jpeg':
            outputBuffer = await processedImage.jpeg({
              quality: qualityValue,
              mozjpeg: true
            }).toBuffer();
            break;
          case 'webp':
            outputBuffer = await processedImage.webp({
              quality: qualityValue,
              effort: 5,
              nearLossless: sourceExt === 'png'
            }).toBuffer();
            break;
          default:
            if (sourceExt === 'png') {
              outputBuffer = await processedImage.png({ quality: qualityValue }).toBuffer();
            } else if (sourceExt === 'jpg' || sourceExt === 'jpeg') {
              outputBuffer = await processedImage.jpeg({ quality: qualityValue }).toBuffer();
            } else if (sourceExt === 'webp') {
              outputBuffer = await processedImage.webp({ quality: qualityValue }).toBuffer();
            } else {
              outputBuffer = await processedImage.toBuffer();
            }
        }

        await fs.writeFile(targetPath, outputBuffer);

        const compressedSize = outputBuffer.length;
        const compressionRatio = ((originalSize - compressedSize) / Math.max(originalSize || compressedSize, 1) * 100).toFixed(2);

        results.push({
          name: image.name,
          path: targetPath,
          originalSize,
          compressedSize,
          compressionRatio,
          success: true
        });
      } catch (error) {
        console.error(`处理图片 ${image.name} 失败:`, error);

        let errorMessage = error.message || '未知错误';
        if (error.code === 'UNKNOWN' && error.syscall === 'open') {
          errorMessage = `文件访问失败: ${error.path}. 可能原因: 文件被占用、权限不足或路径过长`;
        } else if (error.code === 'ENOENT') {
          errorMessage = `文件不存在: ${error.path}`;
        } else if (error.code === 'EACCES') {
          errorMessage = `权限不足: 无法访问文件 ${error.path}`;
        } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
          errorMessage = '系统资源不足: 打开文件过多';
        }

        results.push({
          name: image.name,
          path: image.path,
          originalSize: image.size || 0,
          compressedSize: 0,
          compressionRatio: '0',
          error: errorMessage,
          success: false
        });
      }
    }

    results.sort((a, b) => (b.originalSize - b.compressedSize) - (a.originalSize - a.compressedSize));

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('压缩图片错误:', error);
    res.status(500).json({
      success: false,
      error: '压缩图片失败',
      message: error.message
    });
  }
});

// 保存配置
app.post('/api/save-config', async (req, res) => {
  try {
    const config = req.body;
    const configPath = path.join(__dirname, '..', 'config.json');

    await fs.writeJson(configPath, config, { spaces: 2 });
    res.json({
      success: true,
      message: '配置保存成功'
    });
  } catch (error) {
    console.error('保存配置错误:', error);
    res.status(500).json({
      success: false,
      error: '保存配置失败',
      message: error.message
    });
  }
});

// 加载配置
app.get('/api/load-config', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '..', 'config.json');

    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      res.json({
        success: true,
        config
      });
    } else {
      res.json({
        success: true,
        config: {}
      });
    }
  } catch (error) {
    console.error('加载配置错误:', error);
    res.status(500).json({
      success: false,
      error: '加载配置失败',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
