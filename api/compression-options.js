export const COMPRESSION_MODES = ['lossless', 'low-loss', 'balanced', 'aggressive'];
export const AVIF_QUALITY_OFFSET = 18;

export const normalizeCompressionMode = (mode) =>
  COMPRESSION_MODES.includes(mode) ? mode : 'balanced';

export const normalizeFormat = (format) => {
  const value = String(format || '').toLowerCase();
  return value === 'jpg' ? 'jpeg' : value;
};

export const getTargetFormat = (outputFormat, sourceExt) => {
  const sourceFormat = normalizeFormat(sourceExt || 'png');
  return outputFormat === 'original' ? sourceFormat : normalizeFormat(outputFormat);
};

const clampQuality = (quality, fallback) => {
  const value = Number.isFinite(quality) ? Math.round(quality) : fallback;
  return Math.min(Math.max(value, 1), 100);
};

const avifQuality = (quality) => Math.min(Math.max(quality - AVIF_QUALITY_OFFSET, 1), 100);

export const buildEncoderOptions = (format, mode, quality) => {
  const normalizedFormat = normalizeFormat(format);
  const normalizedMode = normalizeCompressionMode(mode);
  const qualityValue = clampQuality(quality, 80);

  if (normalizedMode === 'lossless') {
    if (normalizedFormat === 'png') {
      return { compressionLevel: 9, adaptiveFiltering: true };
    }

    if (normalizedFormat === 'webp' || normalizedFormat === 'avif') {
      return { lossless: true, effort: 6 };
    }

    return {
      quality: 100,
      mozjpeg: true,
      chromaSubsampling: '4:4:4'
    };
  }

  if (normalizedMode === 'low-loss') {
    if (normalizedFormat === 'jpeg') {
      return {
        quality: 92,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: '4:4:4'
      };
    }

    if (normalizedFormat === 'png') {
      return { compressionLevel: 9, adaptiveFiltering: true };
    }

    if (normalizedFormat === 'webp') {
      return { quality: 90, effort: 6 };
    }

    if (normalizedFormat === 'avif') {
      return { quality: 70, effort: 6 };
    }
  }

  if (normalizedMode === 'aggressive') {
    if (normalizedFormat === 'jpeg') {
      return { quality: 68, mozjpeg: true, progressive: true };
    }

    if (normalizedFormat === 'png') {
      return { compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 72 };
    }

    if (normalizedFormat === 'webp') {
      return { quality: 66, effort: 6 };
    }

    if (normalizedFormat === 'avif') {
      return { quality: 48, effort: 7 };
    }
  }

  if (normalizedFormat === 'jpeg') {
    return { quality: qualityValue, mozjpeg: true, progressive: true };
  }

  if (normalizedFormat === 'png') {
    return { quality: qualityValue, compressionLevel: 9, palette: true };
  }

  if (normalizedFormat === 'webp') {
    return { quality: qualityValue, effort: 5 };
  }

  if (normalizedFormat === 'avif') {
    return { quality: avifQuality(qualityValue), effort: 6 };
  }

  return {};
};

export const shouldKeepOriginalOutput = ({ originalSize, compressedSize, avoidLargerOutput }) =>
  avoidLargerOutput === true && compressedSize > originalSize;

export const shouldCopyForLosslessJpeg = ({ sourceExt, targetFormat, mode, hasResize }) =>
  normalizeCompressionMode(mode) === 'lossless' &&
  normalizeFormat(sourceExt) === 'jpeg' &&
  targetFormat === 'jpeg' &&
  !hasResize;
