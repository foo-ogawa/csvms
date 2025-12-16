// 差分確認モーダルコンポーネント

import React, { useMemo } from 'react';
import { Modal, Tag, Space, Empty, Typography } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { Column, Row } from '@/api/types';

const { Text } = Typography;

interface DiffPreviewModalProps {
  open: boolean;
  onClose: () => void;
  columns: Column[];
  originalRows: Row[];
  currentRows: Row[];
  primaryKey?: string;
}

type DiffType = 'added' | 'removed' | 'modified';

interface DiffRow {
  type: DiffType;
  rowIndex: number;
  originalRow?: Row;
  currentRow?: Row;
  changedColumns?: string[];
}

// 2つの行が同じかどうか比較
const rowsEqual = (row1: Row, row2: Row, columns: Column[]): boolean => {
  return columns.every((col) => {
    const v1 = row1[col.key];
    const v2 = row2[col.key];
    // 空文字とundefinedを同じとみなす
    if ((v1 === '' || v1 === undefined || v1 === null) &&
        (v2 === '' || v2 === undefined || v2 === null)) {
      return true;
    }
    return String(v1) === String(v2);
  });
};

// 変更されたカラムを取得
const getChangedColumns = (original: Row, current: Row, columns: Column[]): string[] => {
  return columns
    .filter((col) => {
      const v1 = original[col.key];
      const v2 = current[col.key];
      if ((v1 === '' || v1 === undefined || v1 === null) &&
          (v2 === '' || v2 === undefined || v2 === null)) {
        return false;
      }
      return String(v1) !== String(v2);
    })
    .map((col) => col.key);
};

// 差分を計算
const computeDiff = (
  originalRows: Row[],
  currentRows: Row[],
  columns: Column[],
  primaryKey?: string
): DiffRow[] => {
  const diffs: DiffRow[] = [];

  // プライマリキーがある場合はそれでマッチング
  if (primaryKey) {
    const originalByKey = new Map<string, { row: Row; index: number }>();
    originalRows.forEach((row, index) => {
      const key = String(row[primaryKey] ?? '');
      if (key) {
        originalByKey.set(key, { row, index });
      }
    });

    const currentByKey = new Map<string, { row: Row; index: number }>();
    currentRows.forEach((row, index) => {
      const key = String(row[primaryKey] ?? '');
      if (key) {
        currentByKey.set(key, { row, index });
      }
    });

    // 削除された行を検出
    originalByKey.forEach((original, key) => {
      if (!currentByKey.has(key)) {
        diffs.push({
          type: 'removed',
          rowIndex: original.index,
          originalRow: original.row,
        });
      }
    });

    // 追加・変更された行を検出
    currentRows.forEach((currentRow, index) => {
      const key = String(currentRow[primaryKey] ?? '');
      const original = key ? originalByKey.get(key) : null;

      if (!original || !key) {
        // 新規行（プライマリキーがないか、元にない）
        diffs.push({
          type: 'added',
          rowIndex: index,
          currentRow,
        });
      } else if (!rowsEqual(original.row, currentRow, columns)) {
        // 変更された行
        diffs.push({
          type: 'modified',
          rowIndex: index,
          originalRow: original.row,
          currentRow,
          changedColumns: getChangedColumns(original.row, currentRow, columns),
        });
      }
    });
  } else {
    // プライマリキーがない場合はインデックスで比較
    const maxLen = Math.max(originalRows.length, currentRows.length);

    for (let i = 0; i < maxLen; i++) {
      const original = originalRows[i];
      const current = currentRows[i];

      if (!original && current) {
        diffs.push({
          type: 'added',
          rowIndex: i,
          currentRow: current,
        });
      } else if (original && !current) {
        diffs.push({
          type: 'removed',
          rowIndex: i,
          originalRow: original,
        });
      } else if (original && current && !rowsEqual(original, current, columns)) {
        diffs.push({
          type: 'modified',
          rowIndex: i,
          originalRow: original,
          currentRow: current,
          changedColumns: getChangedColumns(original, current, columns),
        });
      }
    }
  }

  // rowIndexでソート
  return diffs.sort((a, b) => a.rowIndex - b.rowIndex);
};

// 値の表示用フォーマット
const formatValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return '(空)';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
};

export const DiffPreviewModal: React.FC<DiffPreviewModalProps> = ({
  open,
  onClose,
  columns,
  originalRows,
  currentRows,
  primaryKey,
}) => {
  const diffs = useMemo(
    () => computeDiff(originalRows, currentRows, columns, primaryKey),
    [originalRows, currentRows, columns, primaryKey]
  );

  const stats = useMemo(() => ({
    added: diffs.filter((d) => d.type === 'added').length,
    removed: diffs.filter((d) => d.type === 'removed').length,
    modified: diffs.filter((d) => d.type === 'modified').length,
  }), [diffs]);

  const hasChanges = stats.added > 0 || stats.removed > 0 || stats.modified > 0;

  // 表示用カラム（最大5つ + 変更カラム）
  const displayColumns = useMemo(() => {
    // プライマリキーを優先
    const pkCol = columns.find((c) => c.key === primaryKey);
    const otherCols = columns.filter((c) => c.key !== primaryKey).slice(0, 4);
    return pkCol ? [pkCol, ...otherCols] : columns.slice(0, 5);
  }, [columns, primaryKey]);

  const renderDiffRow = (diff: DiffRow) => {
    const { type, rowIndex, originalRow, currentRow, changedColumns } = diff;

    const typeConfig = {
      added: { color: '#52c41a', bg: '#f6ffed', label: '追加', icon: <PlusOutlined /> },
      removed: { color: '#ff4d4f', bg: '#fff2f0', label: '削除', icon: <MinusOutlined /> },
      modified: { color: '#faad14', bg: '#fffbe6', label: '変更', icon: <EditOutlined /> },
    };

    const config = typeConfig[type];
    const row = currentRow || originalRow;

    return (
      <div
        key={`${type}-${rowIndex}`}
        style={{
          marginBottom: 12,
          border: `1px solid ${config.color}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: config.bg,
            padding: '8px 12px',
            borderBottom: `1px solid ${config.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Tag color={type === 'added' ? 'success' : type === 'removed' ? 'error' : 'warning'} icon={config.icon}>
            {config.label}
          </Tag>
          <Text type="secondary">行 {rowIndex + 1}</Text>
          {primaryKey && row && (
            <Text strong style={{ marginLeft: 8 }}>
              {primaryKey}: {formatValue(row[primaryKey])}
            </Text>
          )}
        </div>

        <div style={{ padding: 12 }}>
          {type === 'modified' && originalRow && currentRow && changedColumns ? (
            // 変更の場合は変更されたカラムのみ表示
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #f0f0f0', width: 120 }}>
                    カラム
                  </th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #f0f0f0', background: '#fff2f0' }}>
                    変更前
                  </th>
                  <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #f0f0f0', background: '#f6ffed' }}>
                    変更後
                  </th>
                </tr>
              </thead>
              <tbody>
                {changedColumns.map((colKey) => {
                  const col = columns.find((c) => c.key === colKey);
                  return (
                    <tr key={colKey}>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 500 }}>
                        {col?.label || colKey}
                      </td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f0f0f0', background: '#fff2f0', color: '#ff4d4f' }}>
                        {formatValue(originalRow[colKey])}
                      </td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f0f0f0', background: '#f6ffed', color: '#52c41a' }}>
                        {formatValue(currentRow[colKey])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            // 追加・削除の場合は全カラム表示
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {displayColumns.map((col) => (
                  <tr key={col.key}>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #f0f0f0', fontWeight: 500, width: 120 }}>
                      {col.label}
                    </td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #f0f0f0' }}>
                      {formatValue(row?.[col.key])}
                    </td>
                  </tr>
                ))}
                {columns.length > displayColumns.length && (
                  <tr>
                    <td colSpan={2} style={{ padding: '4px 8px', color: '#999', fontStyle: 'italic' }}>
                      ...他 {columns.length - displayColumns.length} カラム
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      title="変更内容の確認"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      styles={{
        body: {
          maxHeight: '70vh',
          overflow: 'auto',
        },
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Space size="middle">
          {stats.added > 0 && (
            <Tag icon={<PlusOutlined />} color="success">
              追加: {stats.added}行
            </Tag>
          )}
          {stats.removed > 0 && (
            <Tag icon={<MinusOutlined />} color="error">
              削除: {stats.removed}行
            </Tag>
          )}
          {stats.modified > 0 && (
            <Tag icon={<EditOutlined />} color="warning">
              変更: {stats.modified}行
            </Tag>
          )}
          {!hasChanges && (
            <Tag color="default">変更なし</Tag>
          )}
        </Space>
      </div>

      {hasChanges ? (
        <div>{diffs.map(renderDiffRow)}</div>
      ) : (
        <Empty
          description="変更はありません"
          style={{ padding: 40 }}
        />
      )}
    </Modal>
  );
};
