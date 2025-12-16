// Dataset型定義

import type { Schema } from './schema.js';

export interface DatasetSummary {
  id: string;
  title: string;
  csvPath: string;
  rowCount: number;
  lastModified: string;
}

export interface DatasetMeta extends DatasetSummary {
  fileHash: string;
  schema: Schema;
}

export interface Row {
  _rowIndex: number;
  [key: string]: unknown;
}

export interface RowsResult {
  fileHash: string;
  totalCount: number;
  rows: Row[];
}

export interface SaveResult {
  saved: boolean;
  fileHash: string;
  rowCount: number;
  normalizedPath: string;
}

export interface DiffResult {
  hasDiff: boolean;
  diff: string;
  stats: {
    added: number;
    removed: number;
    modified: number;
  };
}

