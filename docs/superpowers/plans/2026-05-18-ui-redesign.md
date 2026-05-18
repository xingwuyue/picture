# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the active UI into a clean batch image compression workspace and replace corrupted Chinese copy in app and docs.

**Architecture:** Keep the existing React + Zustand frontend and Express backend. Refactor active components and CSS only where needed, preserving existing API request payloads and store persistence.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Express, Sharp.

---

## File Structure

- Modify `src/App.tsx`: page composition, header metrics, high-level handlers.
- Modify `src/components/FolderSettings.tsx`: source and backup folder controls.
- Modify `src/components/ImageFormats.tsx`: scan format selector.
- Modify `src/components/OutputSettings.tsx`: output configuration.
- Modify `src/components/ActionButtons.tsx`: primary operations.
- Modify `src/components/ImageList.tsx`: scanned files list.
- Modify `src/components/CompressionResults.tsx`: compression result display.
- Modify `src/components/OperationLogs.tsx`: compact log display and clear action.
- Modify `src/stores/compressionStore.ts`: readable Chinese logs and small response fixes only.
- Replace `src/modular-layout.css`: restrained tool UI styling.
- Modify `src/style.css`: global base styles.
- Delete unused starter/demo files if unreferenced: `src/main.ts`, `src/counter.ts`, `src/typescript.svg`, obsolete compressor variants.
- Modify `README.md` and `使用说明.md`: readable Chinese docs.

## Task 1: Verify Baseline and Inventory Active Files

**Files:**
- Inspect: `src/main.tsx`
- Inspect: `src/App.tsx`
- Inspect: `src/components/*.tsx`
- Inspect: `src/stores/compressionStore.ts`

- [ ] **Step 1: Run baseline build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 2: Find active imports**

Run: `rg -n "ImageCompressor|counter|typescript.svg|modern-layout|style-enhancements|modular-layout|OperationLogs" src`

Expected: identify which legacy files are not imported by `src/main.tsx` or `src/App.tsx`.

- [ ] **Step 3: Check Git state**

Run: `git status --short`

Expected: only plan file changes before implementation starts.

## Task 2: Repair Store Logs and Shared Data Behavior

**Files:**
- Modify: `src/stores/compressionStore.ts`

- [ ] **Step 1: Replace corrupted log strings**

Replace user-facing log/error text with readable Simplified Chinese:

```ts
addLog('请先选择文件夹');
addLog('请先设置备份文件夹路径');
addLog(`开始备份: ${selectedFolder} -> ${config.backupFolder}`);
addLog(`备份完成，成功复制 ${copiedFiles}/${totalFiles} 个文件`);
addLog(`备份失败: ${error || message || '未知错误'}`);
addLog(`开始扫描文件夹: ${selectedFolder}`);
addLog(`扫描完成，找到 ${images.length} 张图片`);
addLog(`扫描失败: ${error || message || '未知错误'}`);
addLog('开始压缩...');
addLog(`压缩完成，成功 ${successful}/${images.length} 个`);
addLog(`成功: ${result.name} - 节省 ${result.compressionRatio}%`);
addLog(`失败: ${result.name} - ${result.error || '未知错误'}`);
```

- [ ] **Step 2: Keep API compatibility**

Preserve request bodies for `/api/backup`, `/api/scan-images`, and `/api/compress`. Keep `quality`, `overwriteOriginal`, and `outputDir` fields unchanged.

- [ ] **Step 3: Run TypeScript build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/stores/compressionStore.ts
git commit -m "fix: repair readable operation logs"
```

## Task 3: Rebuild Active UI Components

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/FolderSettings.tsx`
- Modify: `src/components/ImageFormats.tsx`
- Modify: `src/components/OutputSettings.tsx`
- Modify: `src/components/ActionButtons.tsx`
- Modify: `src/components/ImageList.tsx`
- Modify: `src/components/CompressionResults.tsx`
- Modify: `src/components/OperationLogs.tsx`

- [ ] **Step 1: Update `App.tsx` composition**

Use a compact layout with header metrics, workflow panels, result panels, and logs. Keep existing handlers and store methods.

- [ ] **Step 2: Replace component copy**

Use these visible labels:

```text
图片压缩工具
本地批量压缩、格式转换和备份，适合处理站点素材与照片目录。
目录与扫描
格式筛选
输出设置
执行操作
扫描结果
压缩结果
操作日志
```

- [ ] **Step 3: Keep form controls complete**

Ensure the UI still exposes source folder, backup folder, image formats, output format, width, height, aspect ratio, overwrite original, output folder, quality, scan, backup, compress, and clear results.

- [ ] **Step 4: Add empty states**

Show concise empty states:

```text
选择图片目录后开始扫描。
扫描后将在这里显示图片列表。
完成压缩后将在这里显示结果。
暂无操作记录。
```

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/App.tsx src/components
git commit -m "refactor: rebuild compression workspace UI"
```

## Task 4: Replace Layout CSS

**Files:**
- Modify: `src/modular-layout.css`
- Modify: `src/style.css`

- [ ] **Step 1: Replace decorative theme**

Use a neutral tool interface with:

```css
:root {
  --bg: #f5f7fb;
  --surface: #ffffff;
  --surface-muted: #f8fafc;
  --text: #172033;
  --muted: #667085;
  --border: #d9e0ea;
  --primary: #2563eb;
  --success: #16803c;
  --warning: #b45309;
  --danger: #c2410c;
  --radius: 10px;
}
```

- [ ] **Step 2: Use stable responsive grids**

Use grid tracks that avoid overlap:

```css
.workspace-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.4fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Keep controls readable**

Buttons, inputs, selects, lists, and result rows must have fixed padding, clear focus states, and no text overlap at 360px width.

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/modular-layout.css src/style.css
git commit -m "style: simplify workspace layout"
```

## Task 5: Remove Unused Starter and Legacy Files

**Files:**
- Delete if unreferenced: `src/main.ts`
- Delete if unreferenced: `src/counter.ts`
- Delete if unreferenced: `src/typescript.svg`
- Delete if unreferenced: `src/components/ImageCompressor.tsx`
- Delete if unreferenced: `src/components/ImageCompressor-new.tsx`
- Delete if unreferenced: `src/components/ModuleCard.tsx`
- Delete if unreferenced: `src/modern-layout.css`
- Delete if unreferenced: `src/style-enhancements.css`

- [ ] **Step 1: Confirm references**

Run: `rg -n "main.ts|counter|typescript.svg|ImageCompressor|ModuleCard|modern-layout|style-enhancements" src index.html`

Expected: no active references from `src/main.tsx` or `src/App.tsx`.

- [ ] **Step 2: Delete only unreferenced files**

Use `Remove-Item -LiteralPath` for files confirmed unused.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 4: Commit**

Run:

```bash
git add -u src
git commit -m "chore: remove unused starter files"
```

## Task 6: Rewrite Documentation

**Files:**
- Modify: `README.md`
- Modify: `使用说明.md`

- [ ] **Step 1: Rewrite README**

Include:

```markdown
# 图片压缩工具

一个本地运行的批量图片压缩工具，支持扫描目录、筛选格式、调整输出尺寸、转换格式、备份原图和查看压缩结果。

## 启动

```bash
npm install
npm run dev
```

前端默认由 Vite 启动，后端服务默认监听 `http://localhost:3006`。
```

- [ ] **Step 2: Rewrite usage guide**

Cover folder selection, scanning, output settings, backup, compression, logs, and common errors.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 4: Commit**

Run:

```bash
git add README.md 使用说明.md
git commit -m "docs: rewrite Chinese usage documentation"
```

## Task 7: Browser Verification and Final Commit

**Files:**
- Verify: local app at Vite URL

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

Expected: backend starts on port 3006 and Vite prints a local URL.

- [ ] **Step 2: Inspect desktop layout**

Open the Vite URL in the browser at around 1366px width. Confirm no overlapping text, controls are visible, empty states are readable, and main workflow is clear.

- [ ] **Step 3: Inspect mobile layout**

Check around 390px width. Confirm panels stack, buttons fit, and long paths truncate or wrap safely.

- [ ] **Step 4: Final build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 5: Check Git status**

Run: `git status --short`

Expected: clean working tree after final commits.

- [ ] **Step 6: Attempt push**

Run: `git push -u origin master`

Expected: succeeds if GitHub SSH key is configured; otherwise fails with `Permission denied (publickey)` and the local commits remain ready.
