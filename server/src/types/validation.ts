// バリデーション型定義

export interface ValidationResult {
  valid: boolean;
  errorCount: number;
  errors: ValidationError[];
}

export interface ValidationError {
  rowIndex: number;
  columnKey: string | null;
  code: ValidationErrorCode;
  ruleId?: string;
  message: string;
}

export type ValidationErrorCode =
  | 'REQUIRED'
  | 'MIN_VALUE'
  | 'MAX_VALUE'
  | 'PATTERN'
  | 'ENUM'
  | 'UNIQUE'
  | 'TYPE_INVALID'
  | 'ROW_RULE';

