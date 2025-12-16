// バリデーションサービス

import { validateRowFields, validateUnique, validateRowRules } from '../lib/validation/index.js';
import type { Schema, Row, Column } from '../types/index.js';
import type { ValidationResult, ValidationError } from '../types/validation.js';
import type { RowRule } from '../types/schema.js';

export class ValidationService {
  /**
   * 全行のバリデーションを実行
   */
  validateAll(rows: Row[], schema: Schema): ValidationResult {
    const errors: ValidationError[] = [];

    // 1. フィールドバリデーション
    for (const row of rows) {
      const fieldErrors = validateRowFields(row, schema.columns);
      errors.push(...fieldErrors);
    }

    // 2. unique制約チェック
    const uniqueErrors = validateUnique(rows, schema.columns);
    errors.push(...uniqueErrors);

    // 3. 行ルール評価
    if (schema.validation?.rowRules && schema.validation.rowRules.length > 0) {
      for (const row of rows) {
        const ruleErrors = validateRowRules(row, schema.validation.rowRules);
        errors.push(...ruleErrors);
      }
    }

    return {
      valid: errors.length === 0,
      errorCount: errors.length,
      errors,
    };
  }

  /**
   * フィールドバリデーション
   */
  validateField(value: unknown, column: Column, rowIndex: number): ValidationError | null {
    const errors = validateRowFields({ _rowIndex: rowIndex, [column.key]: value }, [column]);
    return errors.length > 0 ? errors[0] : null;
  }

  /**
   * unique制約チェック
   */
  validateUnique(rows: Row[], columns: Column[]): ValidationError[] {
    return validateUnique(rows, columns);
  }

  /**
   * 行ルール評価
   */
  validateRowRules(row: Row, rules: RowRule[]): ValidationError[] {
    return validateRowRules(row, rules);
  }
}

