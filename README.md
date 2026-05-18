# 图片压缩工具

一个本地运行的批量图片压缩工具，适合处理站点素材、照片目录和需要批量转格式的图片文件夹。

## 功能

- 扫描指定目录下的 PNG、JPG、JPEG、WebP 图片。
- 批量压缩图片并显示压缩前后体积。
- 支持保留原格式或转换为 PNG、JPG、JPEG、WebP。
- 可设置输出宽度、高度、是否保持宽高比和压缩质量。
- 可选择备份目录，在压缩前复制原始图片。
- 可指定输出目录；不指定时默认写入源目录下的 `__compressed`。

## 环境要求

- Node.js 16 或更高版本。
- Windows、macOS 或 Linux。
- 能访问本地端口 `3000` 和 `3006`。

## 启动

安装依赖：

```bash
npm install
```

启动前端和后端：

```bash
npm run dev
```

默认地址：

- 前端：`http://localhost:3000`
- 后端 API：`http://localhost:3006`

Windows 用户也可以双击 `start.bat`，脚本会安装依赖、启动服务并打开浏览器。

## 构建

```bash
npm run build
```

构建产物会输出到 `dist/`，该目录默认不提交到 Git。

## 使用流程

1. 在“目录与扫描”中选择图片目录。
2. 在“格式筛选”中勾选需要扫描的图片格式。
3. 点击“扫描图片”，确认待处理列表。
4. 在“输出设置”中调整格式、尺寸、质量和输出目录。
5. 如需保留原图，先选择备份目录并点击“先备份”。
6. 点击“开始压缩”，在“压缩结果”和“操作日志”中查看结果。

## 项目结构

```text
api/                    后端 API
public/                 静态资源
src/                    前端源码
src/components/         React 组件
src/stores/             Zustand 状态与 API 调用
test-images/            测试图片
test-real-images/       真实图片测试样本
vite.config.ts          Vite 配置
```

## 常见问题

### 前端打开但无法扫描

确认后端服务已启动。默认后端地址是 `http://localhost:3006`。

### 端口被占用

修改 `vite.config.ts` 中的前端端口，或释放本机 `3000`、`3006` 端口。

### 压缩失败

检查图片目录是否存在、文件是否被其他程序占用、当前用户是否有读写权限。

### GitHub 推送失败

当前远程地址配置为：

```bash
git@github.com:xingwuyue/picture.git
```

如果推送时出现 `Permission denied (publickey)`，需要把本机 SSH 公钥添加到 GitHub 账号，或确认该账号有仓库写权限。
