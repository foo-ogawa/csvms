// スキーマ型定義

export interface EnumOption {
  value: string;
  label: string;
}

export interface Column {
  key: string;
  type: 'string' | 'integer' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
  label: string;
  required?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  defaultValue?: unknown;
  pattern?: string;
  min?: number;
  max?: number;
  enum?: EnumOption[];
  ui?: {
    widget?: 'text' | 'textarea' | 'markdown' | 'number' | 'select' | 'radio' | 'checkbox' | 'switch' | 'date' | 'datetime';
    placeholder?: string;
    helpText?: string;
  };
}

export interface ListColumnConfig {
  key: string;
  width?: number;
  pinned?: boolean;
}

export interface TileConfig {
  columns: number;
  titleField: string;
  subtitleField?: string;
  imageField?: string;
}

export interface FormSection {
  title: string;
  fields: string[];
}

export interface FormLayout {
  type: 'flat' | 'sections';
  columns?: number;
  sections?: FormSection[];
}

export interface Schema {
  id: string;
  title: string;
  description?: string;
  csvPath: string;
  columns: Column[];
  ui?: {
    list?: {
      viewMode: 'table' | 'tile' | 'both';
      columns?: ListColumnConfig[];
      tile?: TileConfig;
    };
    form?: {
      layout?: FormLayout;
    };
  };
  normalize?: {
    sort?: { column: string; order: 'asc' | 'desc' }[];
    quote?: 'all' | 'minimal' | 'none';
    newline?: 'LF' | 'CRLF';
  };
  validation?: {
    rowRules?: {
      expression: string;
      message: string;
    }[];
  };
}

