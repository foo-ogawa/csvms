// データタイルグリッドコンポーネント

import React, { useMemo } from 'react';
import { Card, Tag, Dropdown, Empty } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import type { Schema, Row, ValidationError } from '@/api/types';
import type { InsertPosition } from '@/stores/datasetStore';

// 拡張Row型（_arrayIndexを持つ）
type RowWithArrayIndex = Row & { _arrayIndex: number };

interface DataTileGridProps {
  schema: Schema;
  rows: RowWithArrayIndex[];
  selectedRowIndex: number | null; // 表示上のインデックス
  errors: ValidationError[];
  onRowSelect: (arrayIndex: number | null) => void; // 元のrows配列のインデックスを返す
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onInsert: (position: InsertPosition) => void;
}

export const DataTileGrid: React.FC<DataTileGridProps> = ({
  schema,
  rows,
  selectedRowIndex,
  errors,
  onRowSelect,
  onDuplicate,
  onDelete,
  onInsert,
}) => {
  // タイル設定
  const tileConfig = schema.ui?.list?.tile || {
    columns: 3,
    titleField: schema.columns[0]?.key || '',
    subtitleField: schema.columns[1]?.key,
  };

  // 行のエラー情報
  const rowErrors = useMemo(() => {
    const map = new Map<number, ValidationError[]>();
    errors.forEach((err) => {
      const existing = map.get(err.rowIndex) || [];
      existing.push(err);
      map.set(err.rowIndex, existing);
    });
    return map;
  }, [errors]);

  // タイルのクラス名
  const getTileClassName = (row: Row, index: number): string => {
    const classes: string[] = ['tile-card'];
    if (index === selectedRowIndex) classes.push('selected');
    if (row._isNew) classes.push('is-new');
    else if (row._isDirty) classes.push('is-dirty');
    if (rowErrors.has(index)) classes.push('has-error');
    return classes.join(' ');
  };

  // コンテキストメニュー
  const contextMenuItems = (index: number) => [
    {
      key: 'insertBefore',
      label: '前に挿入',
      icon: <ArrowUpOutlined />,
      onClick: () => onInsert({ type: 'before', index }),
    },
    {
      key: 'insertAfter',
      label: '後に挿入',
      icon: <ArrowDownOutlined />,
      onClick: () => onInsert({ type: 'after', index }),
    },
    { type: 'divider' as const },
    {
      key: 'duplicate',
      label: '複製',
      icon: <CopyOutlined />,
      onClick: () => onDuplicate(index),
    },
    {
      key: 'delete',
      label: '削除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(index),
    },
  ];

  // プライマリキー取得
  const primaryKey = schema.csv?.primaryKey;
  const pkColumn = primaryKey ? schema.columns.find((c) => c.key === primaryKey) : schema.columns[0];

  if (rows.length === 0) {
    return (
      <div style={{ padding: 48, flex: 1 }}>
        <Empty description="データがありません" />
      </div>
    );
  }

  return (
    <div className={`tile-grid columns-${tileConfig.columns}`} style={{ alignContent: 'flex-start' }}>
      {rows.map((row, index) => {
        const titleField = tileConfig.titleField || schema.columns[0]?.key;
        const title = titleField ? row[titleField] : row._rowIndex;
        const subtitle = tileConfig.subtitleField
          ? row[tileConfig.subtitleField]
          : undefined;
        const pkValue = pkColumn ? row[pkColumn.key] : row._rowIndex;

        return (
          <Dropdown
            key={index}
            menu={{ items: contextMenuItems(index) }}
            trigger={['contextMenu']}
          >
            <Card
              className={getTileClassName(row, index)}
              onClick={() =>
                onRowSelect(selectedRowIndex === index ? null : row._arrayIndex)
              }
              size="small"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {String(title || '-')}
                </div>
                {subtitle !== undefined && (
                  <div>
                    {typeof subtitle === 'boolean' ? (
                      <Tag color={subtitle ? 'green' : 'default'}>
                        {subtitle ? 'Yes' : 'No'}
                      </Tag>
                    ) : (
                      <Tag>{String(subtitle)}</Tag>
                    )}
                  </div>
                )}
                <div
                  style={{
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: 8,
                    marginTop: 4,
                    color: '#8c8c8c',
                    fontSize: 12,
                  }}
                >
                  {pkColumn ? `${pkColumn.label}: ` : 'ID: '}
                  {String(pkValue)}
                </div>
                {row._isNew && (
                  <Tag color="green" style={{ alignSelf: 'flex-start' }}>
                    NEW
                  </Tag>
                )}
                {row._isDirty && !row._isNew && (
                  <Tag color="orange" style={{ alignSelf: 'flex-start' }}>
                    変更あり
                  </Tag>
                )}
              </div>
            </Card>
          </Dropdown>
        );
      })}
    </div>
  );
};

