import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 获取文件夹中的图片文件
app.post('/api/scan-images', async (req, res) => {
  try {
    const { folderPath, imageFormats } = req.body;
    
    if (!await fs.pathExists(folderPath)) {
      return res.status(400).json({ error: '文件夹路径不存在' });
    }

    const images = [];
    const formats = imageFormats.map(format => format.toLowerCase());
    
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
    res.json({ images });
  } catch (error) {
    console.error('扫描图片错误:', error);
    res.status(500).json({ error: '扫描图片失败' });
  }
});

// 备份文件夹
app.post('/api/backup', async (req, res) => {
  try {
    const { sourcePath, backupPath } = req.body;
    
    if (!await fs.pathExists(sourcePath)) {
      return res.status(400).json({ error: '源文件夹不存在' });
    }

    await fs.copy(sourcePath, backupPath, {
      filter: (src) => {
        const ext = path.extname(src).toLowerCase();
        return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
      }
    });
    
    res.json({ success: true, message: '备份完成' });
  } catch (error) {
    console.error('备份错误:', error);
    res.status(500).json({ error: '备份失败' });
  }
});

// 压缩图片
app.post('/api/compress', async (req, res) => {
  try {
    const { images, outputFormat, width, height, maintainAspectRatio } = req.body;
    const results = [];
    
    for (const image of images) {
      try {
        const originalSize = image.size;
        const imageSharp = sharp(image.path);
        
        // 获取原始尺寸
        const metadata = await imageSharp.metadata();
        let resizeOptions = {};
        
        if (width || height) {
          if (maintainAspectRatio) {
            if (width && !height) {
              resizeOptions.width = width;
            } else if (height && !width) {
              resizeOptions.height = height;
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
        
        // 根据输出格式处理
        let outputBuffer;
        switch (outputFormat) {
          case 'png':
            outputBuffer = await processedImage.png({ quality: 90 }).toBuffer();
            break;
          case 'jpg':
          case 'jpeg':
            outputBuffer = await processedImage.jpeg({ quality: 90 }).toBuffer();
            break;
          case 'webp':
            outputBuffer = await processedImage.webp({ quality: 90 }).toBuffer();
            break;
          default:
            // 保持原格式
            const ext = path.extname(image.path).toLowerCase().slice(1);
            if (ext === 'png') {
              outputBuffer = await processedImage.png({ quality: 90 }).toBuffer();
            } else if (ext === 'jpg' || ext === 'jpeg') {
              outputBuffer = await processedImage.jpeg({ quality: 90 }).toBuffer();
            } else if (ext === 'webp') {
              outputBuffer = await processedImage.webp({ quality: 90 }).toBuffer();
            } else {
              outputBuffer = await processedImage.toBuffer();
            }
        }
        
        // 写回文件
        await fs.writeFile(image.path, outputBuffer);
        
        const compressedSize = outputBuffer.length;
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
        
        results.push({
          name: image.name,
          path: image.path,
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
          error: error.message,
          success: false
        });
      }
    }
    
    // 按压缩大小排序
    results.sort((a, b) => (b.originalSize - b.compressedSize) - (a.originalSize - a.compressedSize));
    
    res.json({ results });
  } catch (error) {
    console.error('压缩图片错误:', error);
    res.status(500).json({ error: '压缩图片失败' });
  }
});

// 保存配置
app.post('/api/save-config', async (req, res) => {
  try {
    const config = req.body;
    const configPath = path.join(__dirname, '..', 'config.json');
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    res.json({ success: true });
  } catch (error) {
    console.error('保存配置错误:', error);
    res.status(500).json({ error: '保存配置失败' });
  }
});

// 加载配置
app.get('/api/load-config', async (req, res) => {
  try {
    const configPath = path.join(__dirname, '..', 'config.json');
    
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      res.json(config);
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('加载配置错误:', error);
    res.status(500).json({ error: '加载配置失败' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});