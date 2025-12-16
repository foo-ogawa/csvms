// データテーブルコンポーネント

import React, { useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Tag, Dropdown } from 'antd';
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  CopyOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import type { Schema, Row, ValidationError } from '@/types';
import type { InsertPosition } from '@/stores/datasetStore';

interface DataTableProps {
  schema: Schema;
  rows: Row[];
  selectedRowIndex: number | null;
  errors: ValidationError[];
  onRowSelect: (index: number | null) => void;
  onSort: (columnKey: string, order: 'asc' | 'desc') => void;
  sortColumn: string | null;
  sortOrder: 'asc' | 'desc';
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onInsert: (position: InsertPosition) => void;
}

const ROW_HEIGHT = 44;
const INDEX_COLUMN_WIDTH = 60;

export const DataTable: React.FC<DataTableProps> = ({
  schema,
  rows,
  selectedRowIndex,
  errors,
  onRowSelect,
  onSort,
  sortColumn,
  sortOrder,
  onDuplicate,
  onDelete,
  onInsert,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 表示するカラムを取得
  const columns = useMemo(() => {
    const listColumns = schema.ui?.list?.columns;
    if (listColumns && listColumns.length > 0) {
      return listColumns.map((lc) => {
        const col = schema.columns.find((c) => c.key === lc.key);
        return { ...col!, width: lc.width || 150, pinned: lc.pinned };
      });
    }
    return schema.columns.map((col) => ({ ...col, width: 150, pinned: false }));
  }, [schema]);

  // テーブル全体の幅を計算
  const totalWidth = useMemo(() => {
    return INDEX_COLUMN_WIDTH + columns.reduce((sum, col) => sum + col.width, 0);
  }, [columns]);

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

  // 仮想スクロール設定
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // 行クリック
  const handleRowClick = useCallback(
    (index: number) => {
      onRowSelect(selectedRowIndex === index ? null : index);
    },
    [selectedRowIndex, onRowSelect]
  );

  // ヘッダークリック（ソート）
  const handleHeaderClick = useCallback(
    (columnKey: string) => {
      const newOrder = sortColumn === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(columnKey, newOrder);
    },
    [sortColumn, sortOrder, onSort]
  );

  // セル値のフォーマット
  const formatValue = (value: unknown, type: string): React.ReactNode => {
    if (value === undefined || value === null || value === '') {
      return <span style={{ color: '#bfbfbf' }}>-</span>;
    }

    if (type === 'boolean') {
      return value ? (
        <Tag color="green">Yes</Tag>
      ) : (
        <Tag color="default">No</Tag>
      );
    }

    if (type === 'enum') {
      const enumCol = schema.columns.find((c) => c.type === 'enum');
      const option = enumCol?.enum?.find((e) => e.value === value);
      return <Tag>{option?.label || String(value)}</Tag>;
    }

    return String(value);
  };

  // 行のクラス名
  const getRowClassName = (row: Row, index: number): string => {
    const classes: string[] = ['table-row'];
    if (index === selectedRowIndex) classes.push('row-selected');
    if (row._isNew) classes.push('row-is-new');
    else if (row._isDirty) classes.push('row-is-dirty');
    if (rowErrors.has(index)) classes.push('row-has-error');
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

  return (
    <div className="data-table-wrapper">
      {/* ヘッダー（固定） */}
      <div className="data-table-header" style={{ minWidth: totalWidth }}>
        <div className="table-cell header-cell" style={{ width: INDEX_COLUMN_WIDTH, minWidth: INDEX_COLUMN_WIDTH }}>
          #
        </div>
        {columns.map((col) => (
          <div
            key={col.key}
            className="table-cell header-cell sortable"
            style={{ width: col.width, minWidth: col.width }}
            onClick={() => handleHeaderClick(col.key)}
          >
            <span>{col.label}</span>
            {sortColumn === col.key &&
              (sortOrder === 'asc' ? (
                <SortAscendingOutlined style={{ color: '#1677ff', marginLeft: 4 }} />
              ) : (
                <SortDescendingOutlined style={{ color: '#1677ff', marginLeft: 4 }} />
              ))}
          </div>
        ))}
      </div>

      {/* ボディ（スクロール可能） */}
      <div className="data-table-body" ref={scrollRef}>
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: totalWidth,
            position: 'relative',
          }}
        >
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const rowIndex = virtualRow.index;

            return (
              <Dropdown
                key={virtualRow.index}
                menu={{ items: contextMenuItems(rowIndex) }}
                trigger={['contextMenu']}
              >
                <div
                  className={getRowClassName(row, rowIndex)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => handleRowClick(rowIndex)}
                >
                  <div
                    className="table-cell"
                    style={{ width: INDEX_COLUMN_WIDTH, minWidth: INDEX_COLUMN_WIDTH, color: '#8c8c8c', fontSize: 12 }}
                  >
                    {row._isNew ? 'NEW' : row._rowIndex}
                  </div>
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="table-cell"
                      style={{ width: col.width, minWidth: col.width }}
                    >
                      {formatValue(row[col.key], col.type)}
                    </div>
                  ))}
                </div>
              </Dropdown>
            );
          })}
        </div>
      </div>
    </div>
  );
};
