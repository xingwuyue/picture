import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CompressionMode = 'lossless' | 'low-loss' | 'balanced' | 'aggressive';

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const getApiBaseCandidates = () => {
  const envBase =
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env !== 'undefined' &&
    typeof import.meta.env.VITE_API_BASE === 'string'
      ? import.meta.env.VITE_API_BASE
      : '';

  const candidates = [
    envBase,
    'http://localhost:3006',
    'http://127.0.0.1:3006',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ]
    .filter(Boolean)
    .map((baseUrl) => normalizeBaseUrl(baseUrl));

  return Array.from(new Set(candidates));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

let cachedApiBaseUrl: string | null = null;

const requestApiJson = async (path: string, init: RequestInit) => {
  const candidates = cachedApiBaseUrl
    ? [cachedApiBaseUrl, ...getApiBaseCandidates().filter((value) => value !== cachedApiBaseUrl)]
    : getApiBaseCandidates();

  let lastError: unknown = null;

  for (const baseUrl of candidates) {
    const url = `${normalizeBaseUrl(baseUrl)}${path}`;

    try {
      const response = await fetchWithTimeout(url, init, 30000);
      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`服务端返回了非 JSON 响应: ${text.substring(0, 200)}`);
      }

      const json = (await response.json()) as unknown;
      cachedApiBaseUrl = baseUrl;
      return { response, json, baseUrl };
    } catch (error) {
      lastError = error;

      const message = error instanceof Error ? error.message : String(error);
      const isNetworkError = error instanceof TypeError && message.includes('fetch');
      const isAborted = error instanceof DOMException && error.name === 'AbortError';
      const isNonJson =
        error instanceof Error && message.startsWith('服务端返回了非 JSON 响应:');

      if (isNetworkError || isAborted || isNonJson) {
        continue;
      }

      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError || '请求失败'));
};

export interface ImageFile {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  format: string;
}

export interface CompressionResult {
  name: string;
  path: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  success: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;
}

export interface Config {
  sourceFolder?: string;
  backupFolder?: string;
  outputFolder?: string;
  imageFormats: string[];
  outputFormat: string;
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  quality: number;
  compressionMode: CompressionMode;
  avoidLargerOutput: boolean;
  preserveMetadata: boolean;
  overwriteOriginal?: boolean;
}

interface CompressionState {
  config: Config;
  selectedFolder: string;
  images: ImageFile[];
  compressionResults: CompressionResult[];
  logs: string[];
  isProcessing: boolean;
  isScanning: boolean;
  setSelectedFolder: (folder: string) => void;
  setConfig: (config: Partial<Config>) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  clearResults: () => void;
  scanImages: () => Promise<void>;
  compressImages: () => Promise<void>;
  backupImages: () => Promise<void>;
  setImages: (images: ImageFile[]) => void;
  setCompressionResults: (results: CompressionResult[]) => void;
  setIsProcessing: (processing: boolean) => void;
  setIsScanning: (scanning: boolean) => void;
}

const defaultConfig: Config = {
  imageFormats: ['png', 'jpg', 'jpeg', 'webp', 'avif'],
  outputFormat: 'original',
  maintainAspectRatio: true,
  quality: 80,
  compressionMode: 'balanced',
  avoidLargerOutput: true,
  preserveMetadata: false,
  overwriteOriginal: false
};

export const useCompressionStore = create<CompressionState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      selectedFolder: '',
      images: [],
      compressionResults: [],
      logs: [],
      isProcessing: false,
      isScanning: false,

      setSelectedFolder: (folder) => set({ selectedFolder: folder }),

      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig }
        })),

      addLog: (log) =>
        set((state) => ({
          logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${log}`]
        })),

      clearLogs: () => set({ logs: [] }),

      clearResults: () => set({ compressionResults: [], images: [] }),

      setImages: (images) => set({ images }),

      setCompressionResults: (results) => set({ compressionResults: results }),

      setIsProcessing: (processing) => set({ isProcessing: processing }),

      setIsScanning: (scanning) => set({ isScanning: scanning }),

      backupImages: async () => {
        const { selectedFolder, config, addLog, setIsProcessing } = get();

        if (!selectedFolder) {
          addLog('请先选择文件夹');
          return;
        }

        if (!config.backupFolder) {
          addLog('请先设置备份文件夹路径');
          return;
        }

        setIsProcessing(true);
        addLog(`开始备份: ${selectedFolder} -> ${config.backupFolder}`);

        try {
          const { json, baseUrl } = await requestApiJson('/api/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourcePath: selectedFolder,
              backupPath: config.backupFolder
            })
          });

          if (!isRecord(json)) {
            addLog(`备份失败: 服务端返回了非预期数据 (${baseUrl})`);
            return;
          }

          const copiedFiles = typeof json.copiedFiles === 'number' ? json.copiedFiles : undefined;
          const totalFiles = typeof json.totalFiles === 'number' ? json.totalFiles : undefined;
          const message = typeof json.message === 'string' ? json.message : undefined;
          const error = typeof json.error === 'string' ? json.error : undefined;

          if (json.success === true) {
            if (typeof copiedFiles === 'number' && typeof totalFiles === 'number') {
              addLog(`备份完成，成功复制 ${copiedFiles}/${totalFiles} 个文件`);
            } else {
              addLog(`备份完成${message ? `: ${message}` : ''}`);
            }
          } else {
            addLog(`备份失败: ${error || message || '未知错误'}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (error instanceof TypeError && message.includes('fetch')) {
            const candidates = getApiBaseCandidates().join(' / ');
            addLog(`备份错误: 无法连接本地服务 (${candidates})，请确认后端服务已启动`);
          } else {
            addLog(`备份错误: ${message}`);
          }
        } finally {
          setIsProcessing(false);
        }
      },

      scanImages: async () => {
        const { selectedFolder, config, addLog, setImages, setIsScanning } = get();

        if (!selectedFolder) {
          addLog('请先选择文件夹');
          return;
        }

        setIsScanning(true);
        addLog(`开始扫描文件夹: ${selectedFolder}`);

        try {
          const { json, baseUrl } = await requestApiJson('/api/scan-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              folderPath: selectedFolder,
              imageFormats: config.imageFormats
            })
          });

          if (!isRecord(json)) {
            addLog(`扫描失败: 服务端返回了非预期数据 (${baseUrl})`);
            return;
          }

          const images = json.images;

          if (Array.isArray(images)) {
            setImages(images as ImageFile[]);
            addLog(`扫描完成，找到 ${images.length} 张图片`);
          } else if (json.success === false) {
            const error = typeof json.error === 'string' ? json.error : undefined;
            const message = typeof json.message === 'string' ? json.message : undefined;
            addLog(`扫描失败: ${error || message || '未知错误'}`);
          } else {
            addLog(`扫描失败: 未知响应 (${baseUrl}) - ${JSON.stringify(json)}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (error instanceof TypeError && message.includes('fetch')) {
            const candidates = getApiBaseCandidates().join(' / ');
            addLog(`扫描错误: 无法连接本地服务 (${candidates})，请确认后端服务已启动`);
          } else {
            addLog(`扫描错误: ${message}`);
          }
        } finally {
          setIsScanning(false);
        }
      },

      compressImages: async () => {
        const { images, config, addLog, setCompressionResults, setIsProcessing } = get();

        if (images.length === 0) {
          addLog('没有可压缩的图片，请先扫描目录');
          return;
        }

        setIsProcessing(true);
        addLog(`开始压缩，模式: ${config.compressionMode}`);

        try {
          const { json, baseUrl } = await requestApiJson('/api/compress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images,
              outputFormat: config.outputFormat,
              width: config.width,
              height: config.height,
              maintainAspectRatio: config.maintainAspectRatio,
              outputDir: config.outputFolder || undefined,
              overwriteOriginal: config.overwriteOriginal === true,
              quality: config.quality,
              compressionMode: config.compressionMode,
              avoidLargerOutput: config.avoidLargerOutput,
              preserveMetadata: config.preserveMetadata
            })
          });

          if (!isRecord(json)) {
            addLog(`压缩失败: 服务端返回了非预期数据 (${baseUrl})`);
            setCompressionResults([]);
            return;
          }

          const rawResults = Array.isArray(json.results) ? json.results : null;

          if (rawResults) {
            const results: CompressionResult[] = rawResults.map((result: any) => ({
              name: result.name,
              path: result.path || result.outputPath || result.relativePath,
              originalSize:
                images.find((image) => image.name === result.name)?.size || result.originalSize || 0,
              compressedSize: result.compressedSize || 0,
              compressionRatio: result.compressionRatio || '0',
              success: result.success !== false,
              skipped: result.skipped === true,
              message: result.message,
              error: result.error
            }));

            setCompressionResults(results);
            const successful = results.filter((result) => result.success && !result.skipped).length;
            const skipped = results.filter((result) => result.skipped).length;
            addLog(`压缩完成，成功 ${successful}/${images.length} 个，跳过 ${skipped} 个`);

            results.forEach((result) => {
              if (result.skipped) {
                addLog(`跳过: ${result.name} - ${result.message || '已保留原图'}`);
              } else if (result.success) {
                addLog(`成功: ${result.name} - 节省 ${result.compressionRatio}%`);
              } else {
                addLog(`失败: ${result.name} - ${result.error || '未知错误'}`);
              }
            });
          } else {
            const error = typeof json.error === 'string' ? json.error : undefined;
            const message = typeof json.message === 'string' ? json.message : undefined;
            addLog(`压缩失败: ${error || message || '未知错误'}`);
            setCompressionResults([]);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (error instanceof TypeError && message.includes('fetch')) {
            const candidates = getApiBaseCandidates().join(' / ');
            addLog(`压缩错误: 无法连接本地服务 (${candidates})，请确认后端服务已启动`);
          } else {
            addLog(`压缩错误: ${message}`);
          }
          setCompressionResults([]);
        } finally {
          setIsProcessing(false);
        }
      }
    }),
    {
      name: 'compression-store',
      partialize: (state) => ({
        config: state.config,
        selectedFolder: state.selectedFolder
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CompressionState> | undefined;
        return {
          ...currentState,
          ...persisted,
          config: {
            ...defaultConfig,
            ...persisted?.config,
            imageFormats: persisted?.config?.imageFormats || defaultConfig.imageFormats
          }
        };
      }
    }
  )
);
