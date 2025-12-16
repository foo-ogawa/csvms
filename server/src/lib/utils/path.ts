// パス操作・検証

import path from 'node:path';
import fg from 'fast-glob';

/**
 * パストラバーサルをチェック
 * @returns true if path is safe (within basePath)
 */
export function isPathSafe(basePath: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(basePath);
  const resolvedTarget = path.resolve(basePath, targetPath);

  // ベースパス配下であることを確認
  return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
}

/**
 * パスが許可されているかチェック
 */
export function isPathAllowed(
  filePath: string,
  basePath: string,
  allowGlobs?: string[],
  denyGlobs?: string[],
): boolean {
  const relativePath = path.relative(basePath, path.resolve(basePath, filePath));

  // denyGlobsにマッチしたら拒否
  if (denyGlobs && denyGlobs.length > 0) {
    for (const pattern of denyGlobs) {
      if (fg.isDynamicPattern(pattern)) {
        const matches = fg.sync(pattern, { cwd: basePath, dot: true });
        if (matches.includes(relativePath)) {
          return false;
        }
      } else if (relativePath.includes(pattern)) {
        return false;
      }
    }
  }

  // allowGlobsが設定されていない場合は許可
  if (!allowGlobs || allowGlobs.length === 0) {
    return true;
  }

  // allowGlobsのいずれかにマッチしたら許可
  for (const pattern of allowGlobs) {
    const matches = fg.sync(pattern, { cwd: basePath, dot: true });
    if (matches.includes(relativePath)) {
      return true;
    }
  }

  return false;
}

/**
 * パスを正規化（相対パスをベースパスからの絶対パスに）
 */
export function resolvePath(basePath: string, targetPath: string): string {
  return path.resolve(basePath, targetPath);
}

