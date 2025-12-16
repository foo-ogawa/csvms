// CSVシリアライザ

import Papa from 'papaparse';
import type { Schema, Row } from '../../types/index.js';

export interface SerializeOptions {
  quotePolicy: 'minimal' | 'always' | 'none';
  newline: 'lf' | 'crlf';
  bom: boolean;
}

/**
 * 行配列をCSV文字列に変換
 */
export function serializeCSV(rows: Row[], schema: Schema): string {
  const options = schema.csv.normalize;

  // スキーマ順に列を並べ替え
  const columnKeys = schema.columns.map((col) => col.key);

  // 行データを文字列に変換
  const data = rows.map((row) => {
    const record: Record<string, string> = {};
    for (const key of columnKeys) {
      record[key] = stringifyValue(row[key], getColumnType(schema, key));
    }
    return record;
  });

  // クォート設定
  const quoteChar = options.quotePolicy === 'none' ? '' : '"';
  const quotes = options.quotePolicy === 'always';

  // CSVを生成
  const csv = Papa.unparse(data, {
    columns: columnKeys,
    quotes,
    quoteChar,
    delimiter: schema.csv.delimiter,
    header: schema.csv.header,
    newline: options.newline === 'crlf' ? '\r\n' : '\n',
  });

  // BOMとトレイリング改行を追加
  const bom = options.bom ? '\uFEFF' : '';
  const trailingNewline = options.newline === 'crlf' ? '\r\n' : '\n';

  return bom + csv + trailingNewline;
}

/**
 * 値を文字列に変換
 */
function stringifyValue(value: unknown, type: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (type) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'integer':
    case 'number':
      return String(value);
    case 'date':
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      return String(value);
    case 'datetime':
      if (value instanceof Date) {
        return value.toISOString();
      }
      return String(value);
    default:
      return String(value);
  }
}

/**
 * スキーマから列の型を取得
 */
function getColumnType(schema: Schema, key: string): string {
  const column = schema.columns.find((col) => col.key === key);
  return column?.type ?? 'string';
}

