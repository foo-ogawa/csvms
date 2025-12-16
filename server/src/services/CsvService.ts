// CSV操作サービス

import fs from 'node:fs/promises';
import { parseCSV, serializeCSV, normalizeRows } from '../lib/csv/index.js';
import { calculateFileHash } from '../lib/utils/hash.js';
import type { Schema, Row } from '../types/index.js';
import type { ParseResult } from '../lib/csv/parser.js';

export class CsvService {
  /**
   * CSVファイルを読み込み、行配列に変換
   */
  async parse(filePath: string, schema: Schema): Promise<ParseResult> {
    return parseCSV(filePath, schema);
  }

  /**
   * 行配列を正規化してCSV文字列に変換
   */
  serialize(rows: Row[], schema: Schema): string {
    const normalizedRows = normalizeRows(rows, schema);
    // 正規化された行にダミーの _rowIndex を付与
    const rowsWithIndex = normalizedRows.map((row, index) => ({
      ...row,
      _rowIndex: index,
    })) as Row[];
    return serializeCSV(rowsWithIndex, schema);
  }

  /**
   * ファイルハッシュを計算
   */
  async calculateHash(filePath: string): Promise<string> {
    return calculateFileHash(filePath);
  }

  /**
   * 正規化してファイルに書き込み
   */
  async write(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * ファイルが存在するかチェック
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ファイルの最終更新日時を取得
   */
  async getLastModified(filePath: string): Promise<Date> {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  }
}

