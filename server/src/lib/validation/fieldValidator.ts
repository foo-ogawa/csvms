// フィールドバリデーション

import type { Column, Row } from '../../types/index.js';
import type { ValidationError, ValidationErrorCode } from '../../types/validation.js';

/**
 * フィールドのバリデーションを実行
 */
export function validateField(
  value: unknown,
  column: Column,
  rowIndex: number,
): ValidationError | null {
  // required チェック
  if (column.required) {
    if (value === null || value === undefined || value === '') {
      return createError(rowIndex, column.key, 'REQUIRED', `${column.label}は必須です`);
    }
  }

  // 値が空の場合は以降のチェックをスキップ
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // 型チェック
  const typeError = validateType(value, column, rowIndex);
  if (typeError) {
    return typeError;
  }

  // min/max チェック（number/integer）
  if (column.type === 'integer' || column.type === 'number') {
    const numValue = value as number;
    if (column.min !== undefined && numValue < column.min) {
      return createError(
        rowIndex,
        column.key,
        'MIN_VALUE',
        `${column.label}は${column.min}以上である必要があります`,
      );
    }
    if (column.max !== undefined && numValue > column.max) {
      return createError(
        rowIndex,
        column.key,
        'MAX_VALUE',
        `${column.label}は${column.max}以下である必要があります`,
      );
    }
  }

  // pattern チェック（string）
  if (column.type === 'string' && column.pattern) {
    const strValue = String(value);
    const regex = new RegExp(column.pattern);
    if (!regex.test(strValue)) {
      return createError(
        rowIndex,
        column.key,
        'PATTERN',
        `${column.label}の形式が正しくありません`,
      );
    }
  }

  // enum チェック
  if (column.type === 'enum' && column.enum) {
    const validValues = column.enum.map((e) => e.value);
    if (!validValues.includes(String(value))) {
      return createError(
        rowIndex,
        column.key,
        'ENUM',
        `${column.label}は有効な値ではありません`,
      );
    }
  }

  return null;
}

/**
 * 型のバリデーション
 */
function validateType(value: unknown, column: Column, rowIndex: number): ValidationError | null {
  switch (column.type) {
    case 'integer':
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        return createError(
          rowIndex,
          column.key,
          'TYPE_INVALID',
          `${column.label}は整数である必要があります`,
        );
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return createError(
          rowIndex,
          column.key,
          'TYPE_INVALID',
          `${column.label}は数値である必要があります`,
        );
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return createError(
          rowIndex,
          column.key,
          'TYPE_INVALID',
          `${column.label}は真偽値である必要があります`,
        );
      }
      break;
    case 'date':
      if (typeof value === 'string' && value) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          return createError(
            rowIndex,
            column.key,
            'TYPE_INVALID',
            `${column.label}はYYYY-MM-DD形式である必要があります`,
          );
        }
      }
      break;
    case 'datetime':
      if (typeof value === 'string' && value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return createError(
            rowIndex,
            column.key,
            'TYPE_INVALID',
            `${column.label}は有効な日時である必要があります`,
          );
        }
      }
      break;
  }
  return null;
}

/**
 * バリデーションエラーを生成
 */
function createError(
  rowIndex: number,
  columnKey: string,
  code: ValidationErrorCode,
  message: string,
): ValidationError {
  return { rowIndex, columnKey, code, message };
}

/**
 * 行の全フィールドをバリデーション
 */
export function validateRowFields(row: Row, columns: Column[]): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const column of columns) {
    const error = validateField(row[column.key], column, row._rowIndex);
    if (error) {
      errors.push(error);
    }
  }
  return errors;
}

