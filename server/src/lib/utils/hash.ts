// ファイルハッシュ計算

import crypto from 'node:crypto';
import fs from 'node:fs/promises';

/**
 * ファイルのSHA256ハッシュを計算
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

/**
 * 文字列のSHA256ハッシュを計算
 */
export function calculateStringHash(content: string): string {
  const hash = crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
  return `sha256:${hash}`;
}

