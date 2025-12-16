// Dataset型定義

import type { Schema } from './schema';

export interface DatasetSummary {
  id: string;
  title: string;
  rowCount: number;
  errorCount: number;
}

export interface DatasetMeta {
  id: string;
  schema: Schema;
  fileHash: string;
  rowCount: number;
  lastModified: string;
}

export interface Row {
  _rowIndex: number;
  _isNew: boolean;
  _isDirty: boolean;
  [columnKey: string]: unknown;
}

export interface Config {
  version: number;
  workspace: {
    root: string;
    allowWrite: boolean;
  };
  datasets: DatasetSummary[];
  configYaml: string;
}

export interface SaveResult {
  success: boolean;
  newFileHash: string;
  savedAt: string;
}

