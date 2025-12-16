// 式評価（rowRules）

import { Parser } from 'expr-eval';
import type { Row } from '../../types/index.js';
import type { RowRule } from '../../types/schema.js';
import type { ValidationError } from '../../types/validation.js';

// 安全な式評価器（外部コード実行を防止）
const parser = new Parser({
  operators: {
    // 許可する演算子
    logical: true,
    comparison: true,
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    remainder: true,
    power: true,
    concatenate: true,
    conditional: true,
    // 禁止する演算子
    assignment: false,
  },
});

// 許可する関数のみ登録
parser.functions['isEmpty'] = (v: unknown) => v === '' || v === null || v === undefined;
parser.functions['isNotEmpty'] = (v: unknown) =>
  !(v === '' || v === null || v === undefined);
parser.functions['length'] = (v: string) => (v || '').length;
parser.functions['startsWith'] = (v: string, prefix: string) => (v || '').startsWith(prefix);
parser.functions['endsWith'] = (v: string, suffix: string) => (v || '').endsWith(suffix);
parser.functions['contains'] = (v: string, search: string) => (v || '').includes(search);
parser.functions['trim'] = (v: string) => (v || '').trim();
parser.functions['lower'] = (v: string) => (v || '').toLowerCase();
parser.functions['upper'] = (v: string) => (v || '').toUpperCase();
parser.functions['abs'] = Math.abs;
parser.functions['floor'] = Math.floor;
parser.functions['ceil'] = Math.ceil;
parser.functions['round'] = Math.round;
parser.functions['min'] = Math.min;
parser.functions['max'] = Math.max;

/**
 * 式を評価
 */
export function evaluateExpr(expr: string, variables: Record<string, unknown>): boolean {
  try {
    const parsed = parser.parse(expr);
    // expr-evalの型定義と実際の動作に差異があるため、型アサーションを使用
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!parsed.evaluate(variables as any);
  } catch {
    // 式のパースエラーは false として扱う（安全側）
    return false;
  }
}

/**
 * 行ルールを評価
 */
export function evaluateRowRule(row: Row, rule: RowRule): boolean {
  const variables: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key !== '_rowIndex') {
      variables[key] = value;
    }
  }
  return evaluateExpr(rule.expr, variables);
}

/**
 * 全行ルールを評価
 */
export function validateRowRules(row: Row, rules: RowRule[]): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const rule of rules) {
    if (!evaluateRowRule(row, rule)) {
      errors.push({
        rowIndex: row._rowIndex,
        columnKey: null,
        code: 'ROW_RULE',
        ruleId: rule.id,
        message: rule.message,
      });
    }
  }
  return errors;
}

