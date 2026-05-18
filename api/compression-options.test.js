import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AVIF_QUALITY_OFFSET,
  buildEncoderOptions,
  getTargetFormat,
  normalizeCompressionMode,
  shouldKeepOriginalOutput
} from './compression-options.js';

test('normalizes unsupported compression modes to balanced', () => {
  assert.equal(normalizeCompressionMode('lossless'), 'lossless');
  assert.equal(normalizeCompressionMode('low-loss'), 'low-loss');
  assert.equal(normalizeCompressionMode('aggressive'), 'aggressive');
  assert.equal(normalizeCompressionMode('unknown'), 'balanced');
  assert.equal(normalizeCompressionMode(undefined), 'balanced');
});

test('keeps source format when output format is original', () => {
  assert.equal(getTargetFormat('original', 'jpg'), 'jpeg');
  assert.equal(getTargetFormat('webp', 'png'), 'webp');
  assert.equal(getTargetFormat('avif', 'jpg'), 'avif');
});

test('uses lossless encoder options for png webp and avif', () => {
  assert.deepEqual(buildEncoderOptions('png', 'lossless', 80), {
    compressionLevel: 9,
    adaptiveFiltering: true
  });
  assert.deepEqual(buildEncoderOptions('webp', 'lossless', 80), {
    lossless: true,
    effort: 6
  });
  assert.deepEqual(buildEncoderOptions('avif', 'lossless', 80), {
    lossless: true,
    effort: 6
  });
});

test('uses low loss options that favor visual quality', () => {
  assert.equal(buildEncoderOptions('jpeg', 'low-loss', 80).quality, 92);
  assert.equal(buildEncoderOptions('jpeg', 'low-loss', 80).chromaSubsampling, '4:4:4');
  assert.equal(buildEncoderOptions('webp', 'low-loss', 80).quality, 90);
  assert.equal(buildEncoderOptions('avif', 'low-loss', 80).quality, 70);
});

test('uses quality slider for balanced mode and lower defaults for aggressive mode', () => {
  assert.equal(buildEncoderOptions('jpeg', 'balanced', 83).quality, 83);
  assert.equal(buildEncoderOptions('webp', 'balanced', 83).quality, 83);
  assert.equal(buildEncoderOptions('avif', 'balanced', 83).quality, 83 - AVIF_QUALITY_OFFSET);
  assert.equal(buildEncoderOptions('jpeg', 'aggressive', 90).quality, 68);
  assert.equal(buildEncoderOptions('webp', 'aggressive', 90).quality, 66);
});

test('keeps original output when generated file is larger and protection is enabled', () => {
  assert.equal(shouldKeepOriginalOutput({ originalSize: 1000, compressedSize: 1001, avoidLargerOutput: true }), true);
  assert.equal(shouldKeepOriginalOutput({ originalSize: 1000, compressedSize: 999, avoidLargerOutput: true }), false);
  assert.equal(shouldKeepOriginalOutput({ originalSize: 1000, compressedSize: 1001, avoidLargerOutput: false }), false);
});
