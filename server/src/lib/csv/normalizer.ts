// CSV正規化処理

import type { Schema, Row } from '../../types/index.js';

/**
 * 行データを正規化（ソート、列順調整）
 */
export function normalizeRows(rows: Row[], schema: Schema): Omit<Row, '_rowIndex'>[] {
  const sortKeys = schema.csv.normalize.sortKeys;

  // ソートが必要な場合
  let sortedRows = [...rows];
  if (sortKeys && sortKeys.length > 0) {
    sortedRows = stableSort(sortedRows, sortKeys, schema);
  }

  // _rowIndex を除去し、スキーマ順に列を並べ替え
  const columnKeys = schema.columns.map((col) => col.key);
  return sortedRows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const key of columnKeys) {
      normalized[key] = row[key] ?? getDefaultValue(schema, key);
    }
    return normalized;
  });
}

/**
 * 安定ソート
 */
function stableSort(
  rows: Row[],
  sortKeys: Array<{ column: string; order: 'asc' | 'desc' }>,
  schema: Schema,
): Row[] {
  return [...rows].sort((a, b) => {
    for (const sortKey of sortKeys) {
      const column = schema.columns.find((col) => col.key === sortKey.column);
      if (!column) continue;

      const aVal = a[sortKey.column];
      const bVal = b[sortKey.column];

      let comparison = compareValues(aVal, bVal, column.type);
      if (sortKey.order === 'desc') {
        comparison = -comparison;
      }

      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  });
}

/**
 * 値の比較
 */
function compareValues(a: unknown, b: unknown, type: string): number {
  // null/undefined は最後に
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  switch (type) {
    case 'integer':
    case 'number':
      return (a as number) - (b as number);
    case 'boolean':
      return (a as boolean) === (b as boolean) ? 0 : (a as boolean) ? -1 : 1;
    case 'date':
    case 'datetime':
      return new Date(a as string).getTime() - new Date(b as string).getTime();
    default:
      return String(a).localeCompare(String(b));
  }
}

/**
 * デフォルト値を取得
 */
function getDefaultValue(schema: Schema, key: string): unknown {
  const column = schema.columns.find((col) => col.key === key);
  if (!column) return '';

  if (column.default !== undefined) {
    return column.default;
  }

  switch (column.type) {
    case 'integer':
    case 'number':
      return null;
    case 'boolean':
      return false;
    default:
      return '';
  }
}

