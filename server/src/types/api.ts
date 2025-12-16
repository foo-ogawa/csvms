// API型定義

import type { Schema } from './schema.js';
import type { DatasetSummary, DatasetMeta, Row, RowsResult, SaveResult, DiffResult } from './dataset.js';
import type { ValidationResult } from './validation.js';

// Re-export for convenience
export type { Schema, DatasetSummary, DatasetMeta, Row, RowsResult, SaveResult, DiffResult, ValidationResult };

export interface ApiResponse<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Health endpoint
export interface HealthData {
  status: 'healthy';
  version: string;
  uptime: number;
}

// Config endpoint
export interface ConfigData {
  version: number;
  workspace: {
    root: string;
    allowWrite: boolean;
  };
  datasets: Array<{
    id: string;
    title: string;
  }>;
}

// Datasets list endpoint
export interface DatasetsListData {
  datasets: DatasetSummary[];
}

// Validate request
export interface ValidateRequest {
  rows: Row[];
}

// Save request
export interface SaveRequest {
  rows: Omit<Row, '_rowIndex'>[];
  expectedFileHash: string;
}

// Diff request
export interface DiffRequest {
  rows: Omit<Row, '_rowIndex'>[];
}

// Error codes
export type ApiErrorCode =
  | 'DATASET_NOT_FOUND'
  | 'CSV_NOT_FOUND'
  | 'SCHEMA_NOT_FOUND'
  | 'SCHEMA_INVALID'
  | 'CSV_PARSE_ERROR'
  | 'CSV_HEADER_INVALID'
  | 'VALIDATION_ERROR'
  | 'FILE_CONFLICT'
  | 'READ_ONLY'
  | 'PATH_TRAVERSAL'
  | 'PATH_NOT_ALLOWED'
  | 'INTERNAL_ERROR';

