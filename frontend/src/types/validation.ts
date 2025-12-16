// バリデーション型定義

export interface ValidationError {
  rowIndex: number;
  column?: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

