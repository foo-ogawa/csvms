// API型定義

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

// Config
export interface ConfigResponse {
  version: number;
  workspace: {
    root: string;
    allowWrite: boolean;
  };
  datasets: {
    id: string;
    title: string;
  }[];
  // 単独モード情報
  singleMode: boolean;
  singleDataset?: {
    id: string;
    title: string;
  };
}

// Dataset一覧
export interface DatasetSummary {
  id: string;
  title: string;
  csvPath: string;
  rowCount: number;
  lastModified: string;
}

export interface DatasetsResponse {
  datasets: DatasetSummary[];
}

// Datasetメタ情報
export interface DatasetMeta {
  id: string;
  title: string;
  csvPath: string;
  fileHash: string;
  rowCount: number;
  lastModified: string;
  schema: Schema;
}

// スキーマ
export interface Schema {
  schemaVersion?: number;
  id: string;
  title: string;
  csv?: {
    delimiter?: string;
    header?: boolean;
    primaryKey?: string;
    normalize?: {
      sortKeys?: { column: string; order: 'asc' | 'desc' }[];
      quotePolicy?: 'minimal' | 'always' | 'none';
      newline?: 'lf' | 'crlf';
      encoding?: string;
      bom?: boolean;
    };
  };
  columns: Column[];
  ui?: {
    list?: {
      viewMode?: 'table' | 'tile' | 'both';
      columns?: { key: string; width?: number; pinned?: boolean; align?: string }[];
      tile?: {
        columns?: number;
        titleField?: string;
        subtitleField?: string;
        imageField?: string;
      };
      quickSearch?: { columns: string[] };
    };
    form?: {
      layout?: {
        type: 'flat' | 'sections';
        columns?: number;
        sections?: { title?: string; columns?: number; fields: string[] }[];
      };
    };
  };
  validation?: {
    rowRules?: {
      id: string;
      message: string;
      expr: string;
    }[];
  };
}

export interface Column {
  key: string;
  label: string;
  type: 'string' | 'integer' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: { value: string; label: string }[];
  ui?: {
    widget?: string;
    placeholder?: string;
    helpText?: string;
    readonlyOnEdit?: boolean;
    step?: number;
  };
}

// 行データ
export interface Row {
  _rowIndex: number;
  // フロントエンド用拡張プロパティ（オプショナル）
  _isNew?: boolean;
  _isDirty?: boolean;
  [key: string]: unknown;
}

export interface RowsResponse {
  fileHash: string;
  totalCount: number;
  rows: Row[];
}

// バリデーション
export interface ValidationError {
  rowIndex: number;
  columnKey: string | null;
  code: string;
  ruleId?: string;
  message: string;
}

export interface ValidateResponse {
  valid: boolean;
  errorCount: number;
  errors: ValidationError[];
}

// 保存
export interface SaveResponse {
  saved: boolean;
  fileHash: string;
  rowCount: number;
  normalizedPath: string;
}

// 差分
export interface DiffResponse {
  hasDiff: boolean;
  diff: string;
  stats: {
    added: number;
    removed: number;
    modified: number;
  };
}

