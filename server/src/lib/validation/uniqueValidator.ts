// unique制約バリデーション

import type { Column, Row } from '../../types/index.js';
import type { ValidationError } from '../../types/validation.js';

/**
 * unique制約のバリデーション
 */
export function validateUnique(rows: Row[], columns: Column[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const column of columns) {
    if (!column.unique) continue;

    const valueMap = new Map<string, number[]>();

    for (const row of rows) {
      const value = row[column.key];
      // 空値はunique対象外
      if (value === null || value === undefined || value === '') continue;

      const key = String(value);
      const indices = valueMap.get(key) ?? [];
      indices.push(row._rowIndex);
      valueMap.set(key, indices);
    }

    // 重複を検出
    for (const [value, indices] of valueMap) {
      if (indices.length > 1) {
        for (const rowIndex of indices) {
          errors.push({
            rowIndex,
            columnKey: column.key,
            code: 'UNIQUE',
            message: `${column.label}「${value}」が重複しています`,
          });
        }
      }
    }
  }

  return errors;
}

