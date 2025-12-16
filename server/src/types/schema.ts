// スキーマ型定義

export interface Schema {
  schemaVersion: number;
  id: string;
  title: string;
  csv: CsvConfig;
  columns: Column[];
  ui: UiConfig;
  validation?: ValidationConfig;
}

export interface CsvConfig {
  delimiter: string;
  header: boolean;
  primaryKey: string;
  normalize: NormalizeConfig;
}

export interface NormalizeConfig {
  sortKeys?: SortKey[];
  quotePolicy: 'minimal' | 'always' | 'none';
  newline: 'lf' | 'crlf';
  encoding: 'utf-8';
  bom: boolean;
}

export interface SortKey {
  column: string;
  order: 'asc' | 'desc';
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
  enum?: EnumValue[];
  ui?: ColumnUi;
}

export interface EnumValue {
  value: string;
  label: string;
}

export interface ColumnUi {
  widget: string;
  readonlyOnEdit?: boolean;
  step?: number;
  placeholder?: string;
  helpText?: string;
}

export interface UiConfig {
  list: ListConfig;
  form: FormConfig;
}

export interface ListConfig {
  columns: ListColumn[];
  quickSearch?: { columns: string[] };
}

export interface ListColumn {
  key: string;
  width?: number;
  pinned?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface FormConfig {
  layout: FormLayout;
}

export interface FormLayout {
  type: 'sections' | 'flat';
  columns?: number;
  sections?: FormSection[];
}

export interface FormSection {
  title: string;
  columns?: number;
  fields: string[];
}

export interface ValidationConfig {
  rowRules?: RowRule[];
}

export interface RowRule {
  id: string;
  message: string;
  expr: string;
}

