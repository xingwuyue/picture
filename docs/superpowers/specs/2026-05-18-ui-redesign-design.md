# UI Redesign and Encoding Repair Design

## Goal

Improve the image compression tool as a cleaner desktop-style batch processing workspace while restoring readable Chinese text across the app and docs. Keep the current React, Zustand, Express, and Vite stack. Do not add new product features beyond restructuring the existing workflow.

## Current Problems

- Most visible Chinese copy is corrupted mojibake, including labels, logs, README, and usage docs.
- The current UI uses heavy gradients, large rounded cards, decorative effects, and repeated status information.
- Several legacy or duplicate files remain in `src`, making the active UI harder to understand.
- User actions are split across many panels, but the workflow is simple: choose folder, scan, configure output, optionally back up, compress, review results.

## Recommended Approach

Use the larger refactor option:

- Rebuild the active React UI around one compact workflow surface.
- Replace corrupted text with concise Simplified Chinese.
- Keep existing API calls and store behavior unless a small compatibility fix is required.
- Simplify CSS into a restrained operational tool style: light background, white panels, thin borders, 8-12px radii, consistent spacing, clear status colors.
- Remove or isolate unused starter/demo files when they are not referenced by the app.

## Interface Structure

The page has four clear regions:

1. Header
   - Product name: "图片压缩工具".
   - Short utility description.
   - Three metrics: selected folder state, scanned image count, result count.

2. Workflow Controls
   - Directory panel: source folder, backup folder, scan action.
   - Format panel: PNG, JPG, JPEG, WebP scan filters.
   - Output panel: output format, width, height, aspect ratio, overwrite option, output folder, quality slider.
   - Action panel: compress, backup, clear results.

3. Results
   - Scanned image list with name, relative path, and size.
   - Compression results with success/failure status, original size, compressed size, saved ratio, and errors.

4. Logs
   - Compact operation log with timestamps and a clear button.

## Component Boundaries

- `App.tsx` owns page composition and high-level loading state.
- Store actions stay in `compressionStore.ts` and continue to wrap API calls.
- Presentational components receive minimal props or read from the store where already established.
- Shared formatting helpers should be extracted if repeated code becomes noisy.
- Unused Vite starter files and obsolete compressor variants can be removed if not imported.

## Error Handling

- Keep existing API fallback between `localhost:3006`, `127.0.0.1:3006`, `localhost:3001`, and `127.0.0.1:3001`.
- Convert all user-facing error logs to readable Chinese.
- Disabled actions should communicate state through button text and consistent disabled styling.
- Empty states should explain what to do next without long instructions.

## Documentation

- Rewrite `README.md` and `使用说明.md` in readable Chinese.
- Document startup commands, prerequisites, project structure, common problems, and GitHub push note if SSH remains blocked.

## Verification

- Run `npm run build`.
- Run the app locally and inspect the main page in the browser.
- Check mobile and desktop widths for overlapping text or broken layout.
- Check `git status` before committing.

## Git Handling

- Baseline has been committed locally before the redesign.
- Remote is configured as `git@github.com:xingwuyue/picture.git`.
- Push depends on the machine having a GitHub SSH key accepted by that repository.
