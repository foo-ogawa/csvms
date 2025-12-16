// CSVパーサ

import Papa from 'papaparse';
import fs from 'node:fs/promises';
import type { Schema, Row } from '../../types/index.js';

export interface ParseResult {
  rows: Row[];
  headers: string[];
  errors: ParseError[];
}

export interface ParseError {
  row: number;
  message: string;
}

/**
 * CSVファイルをパースして行配列に変換
 */
export async function parseCSV(filePath: string, schema: Schema): Promise<ParseResult> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseCSVContent(content, schema);
}

/**
 * CSV文字列をパースして行配列に変換
 */
export function parseCSVContent(content: string, schema: Schema): ParseResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header: schema.csv.header,
    delimiter: schema.csv.delimiter,
    skipEmptyLines: true,
  });

  const errors: ParseError[] = [];

  // パースエラーを収集
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      errors.push({
        row: error.row ?? -1,
        message: error.message,
      });
    }
  }

  // ヘッダー検証
  const headers = result.meta.fields ?? [];
  const uniqueHeaders = new Set(headers);
  if (headers.length !== uniqueHeaders.size) {
    const duplicates = headers.filter((h, i) => headers.indexOf(h) !== i);
    errors.push({
      row: 0,
      message: `Duplicate header columns: ${duplicates.join(', ')}`,
    });
  }

  // 行データを変換
  const rows: Row[] = result.data.map((record, index) => {
    const row: Row = { _rowIndex: index };

    for (const column of schema.columns) {
      const rawValue = record[column.key];
      row[column.key] = convertValue(rawValue, column.type);
    }

    return row;
  });

  return { rows, headers, errors };
}

/**
 * 値を指定された型に変換
 */
function convertValue(value: string | undefined, type: string): unknown {
  if (value === undefined || value === '') {
    return type === 'boolean' ? false : type === 'integer' || type === 'number' ? null : '';
  }

  switch (type) {
    case 'integer': {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    }
    case 'number': {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    case 'boolean':
      return value.toLowerCase() === 'true' || value === '1';
    case 'date':
    case 'datetime':
    case 'string':
    case 'enum':
    default:
      return value;
  }
}

