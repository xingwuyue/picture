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

const toSafeQuality = (quality) =>
  Number.isFinite(quality) ? Math.min(Math.max(Math.round(quality), 1), 100) : 88;

const getErrorMessage = (error) => (error instanceof Error ? error.message : String(error));

const normalizeImageError = (error) => {
  const message = getErrorMessage(error);

  if (error?.code === 'UNKNOWN' && error?.syscall === 'open') {
    return `文件访问失败: ${error.path || ''}。可能原因: 文件被占用、权限不足或路径过长`;
  }

  if (error?.code === 'ENOENT') {
    return `文件不存在: ${error.path || ''}`;
  }

  if (error?.code === 'EACCES') {
    return `权限不足，无法访问文件: ${error.path || ''}`;
  }

  if (error?.code === 'EMFILE' || error?.code === 'ENFILE') {
    return '系统资源不足，打开文件过多';
  }

  return message || '未知错误';
};

app.post('/api/scan-images', async (req, res) => {
  try {
    const { folderPath, imageFormats } = req.body;

    if (!folderPath) {
      return res.status(400).json({ success: false, error: '缺少文件夹路径' });
    }

    if (!(await fs.pathExists(folderPath))) {
      return res.status(400).json({ success: false, error: '文件夹路径不存在' });
    }

    const formats = (imageFormats?.length ? imageFormats : SUPPORTED_FORMATS).map((format) =>
      String(format).toLowerCase()
    );
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
    res.json({ success: true, images });
  } catch (error) {
    console.error('扫描图片错误:', error);
    res.status(500).json({
      success: false,
      error: '扫描图片失败',
      message: getErrorMessage(error)
    });
  }
});

app.post('/api/backup', async (req, res) => {
  try {
    const { sourcePath, backupPath } = req.body;

    if (!sourcePath || !backupPath) {
      return res.status(400).json({ success: false, error: '源路径或备份路径缺失' });
    }

    if (!(await fs.pathExists(sourcePath))) {
      return res.status(400).json({ success: false, error: '源文件夹不存在' });
    }

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
        copiedCount += 1;
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
      message: getErrorMessage(error)
    });
  }
});

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

    const qualityValue = toSafeQuality(quality);
    const results = [];

    console.log(`开始压缩 ${images.length} 张图片`);

    for (const image of images) {
      try {
        const originalSize = image.size || 0;
        const accessMode = overwriteOriginal
          ? fs.constants.R_OK | fs.constants.W_OK
          : fs.constants.R_OK;

        await fs.access(image.path, accessMode);

        const baseOutputDir = outputDir || path.join(path.dirname(image.path), '__compressed');
        const useDir = overwriteOriginal ? path.dirname(image.path) : baseOutputDir;
        await fs.ensureDir(useDir);

        const baseName = path.basename(image.path, path.extname(image.path));
        const sourceExt = path.extname(image.path).replace('.', '').toLowerCase() || 'png';
        const targetFormat = outputFormat === 'original' ? sourceExt : String(outputFormat).toLowerCase();
        const normalizedFormat = targetFormat === 'jpg' ? 'jpeg' : targetFormat;
        const targetExt = `.${normalizedFormat === 'jpeg' ? 'jpg' : normalizedFormat}`;
        const targetPath = path.join(useDir, `${baseName}${targetExt}`);

        const imageSharp = sharp(image.path, { failOn: 'none' });
        const metadata = await imageSharp.metadata();

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
            resizeOptions = {
              width: width || metadata.width,
              height: height || metadata.height
            };
          }
        }

        let processedImage = imageSharp;
        if (Object.keys(resizeOptions).length > 0) {
          processedImage = processedImage.resize(resizeOptions);
        }

        let outputBuffer;
        switch (normalizedFormat) {
          case 'png':
            outputBuffer = await processedImage
              .png({ quality: qualityValue, compressionLevel: 9, palette: true })
              .toBuffer();
            break;
          case 'jpeg':
            outputBuffer = await processedImage.jpeg({ quality: qualityValue, mozjpeg: true }).toBuffer();
            break;
          case 'webp':
            outputBuffer = await processedImage
              .webp({ quality: qualityValue, effort: 5, nearLossless: sourceExt === 'png' })
              .toBuffer();
            break;
          default:
            outputBuffer = await processedImage.toBuffer();
        }

        await fs.writeFile(targetPath, outputBuffer);

        const compressedSize = outputBuffer.length;
        const compressionRatio = (
          ((originalSize - compressedSize) / Math.max(originalSize || compressedSize, 1)) *
          100
        ).toFixed(2);

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
        results.push({
          name: image.name,
          path: image.path,
          originalSize: image.size || 0,
          compressedSize: 0,
          compressionRatio: '0',
          error: normalizeImageError(error),
          success: false
        });
      }
    }

    results.sort((a, b) => b.originalSize - b.compressedSize - (a.originalSize - a.compressedSize));
    res.json({ success: true, results });
  } catch (error) {
    console.error('压缩图片错误:', error);
    res.status(500).json({
      success: false,
      error: '压缩图片失败',
      message: getErrorMessage(error)
    });
  }
});

app.post('/api/save-config', async (req, res) => {
  try {
    const config = req.body;
    const configPath = path.join(__dirname, '..', 'config.json');

    await fs.writeJson(configPath, config, { spaces: 2 });
    res.json({ success: true, message: '配置保存成功' });
  } catch (error) {
    console.error('保存配置错误:', error);
    res.status(500).json({
      success: false,
      error: '保存配置失败',
      message: getErrorMessage(error)
    });
  }
});

app.get('/api/load-config', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '..', 'config.json');

    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      res.json({ success: true, config });
    } else {
      res.json({ success: true, config: {} });
    }
  } catch (error) {
    console.error('加载配置错误:', error);
    res.status(500).json({
      success: false,
      error: '加载配置失败',
      message: getErrorMessage(error)
    });
  }
});

app.listen(PORT, () => {
  console.log(`服务端运行在 http://localhost:${PORT}`);
});
