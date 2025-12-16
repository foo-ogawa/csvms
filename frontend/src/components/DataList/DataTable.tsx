// データテーブルコンポーネント

import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Tag, Dropdown } from 'antd';
import {
  SortAscendingOutlined,
  SortDescendingOutlined,
  CopyOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import type { Schema, Row, ValidationError } from '@/api/types';
import type { InsertPosition } from '@/stores/datasetStore';

// 拡張Row型（_arrayIndexを持つ）
type RowWithArrayIndex = Row & { _arrayIndex: number };

interface DataTableProps {
  schema: Schema;
  rows: RowWithArrayIndex[];
  selectedRowIndex: number | null; // 表示上のインデックス
  errors: ValidationError[];
  onRowSelect: (arrayIndex: number | null) => void; // 元のrows配列のインデックスを返す
  onSort: (columnKey: string, order: 'asc' | 'desc') => void;
  sortColumn: string | null;
  sortOrder: 'asc' | 'desc';
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onInsert: (position: InsertPosition) => void;
  onMoveRow?: (fromIndex: number, toIndex: number) => void;
  onSelectNext?: () => void;
  onSelectPrev?: () => void;
}

const ROW_HEIGHT = 44;
const INDEX_COLUMN_WIDTH = 60;
const DRAG_HANDLE_WIDTH = 32;

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
  onMoveRow,
  onSelectNext,
  onSelectPrev,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
    const dragHandleWidth = onMoveRow ? DRAG_HANDLE_WIDTH : 0;
    return dragHandleWidth + INDEX_COLUMN_WIDTH + columns.reduce((sum, col) => sum + col.width, 0);
  }, [columns, onMoveRow]);

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

  // キーボードナビゲーション
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // フォーカスがテーブル内にあるか、フォーカスがbody（どこにもフォーカスがない）の場合
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (isInputFocused) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onSelectNext?.();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSelectPrev?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSelectNext, onSelectPrev]);

  // 選択行が変わったらスクロールして表示
  useEffect(() => {
    if (selectedRowIndex !== null && scrollRef.current) {
      virtualizer.scrollToIndex(selectedRowIndex, { align: 'auto' });
    }
  }, [selectedRowIndex, virtualizer]);

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // ドラッグ画像を設定（行全体ではなく小さいインジケータ）
    const dragImage = document.createElement('div');
    dragImage.className = 'drag-image';
    dragImage.textContent = `行 ${index + 1}`;
    dragImage.style.cssText = 'position: absolute; top: -1000px; padding: 8px 16px; background: #1677ff; color: white; border-radius: 4px; font-size: 12px;';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  // ドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && index !== dragIndex) {
      setDragOverIndex(index);
    }
  }, [dragIndex]);

  // ドラッグリーブ
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  // ドロップ
  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex && onMoveRow) {
      onMoveRow(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, onMoveRow]);

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // 行クリック - _arrayIndex（元のrows配列のインデックス）を返す
  const handleRowClick = useCallback(
    (displayIndex: number, arrayIndex: number) => {
      // 既に選択されている行をクリックした場合は選択解除
      onRowSelect(selectedRowIndex === displayIndex ? null : arrayIndex);
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
  const formatValue = (value: unknown, type: string, columnKey: string): React.ReactNode => {
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
      const col = schema.columns.find((c) => c.key === columnKey);
      const option = col?.enum?.find((e) => e.value === value);
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

  // #列のソートをハンドル
  const handleIndexHeaderClick = useCallback(() => {
    const newOrder = sortColumn === '_index' && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort('_index', newOrder);
  }, [sortColumn, sortOrder, onSort]);

  return (
    <div className="data-table-wrapper" ref={tableRef} tabIndex={0}>
      {/* ヘッダー（固定） */}
      <div className="data-table-header" style={{ minWidth: totalWidth }}>
        {onMoveRow && (
          <div className="table-cell header-cell" style={{ width: DRAG_HANDLE_WIDTH, minWidth: DRAG_HANDLE_WIDTH }}>
            
          </div>
        )}
        <div 
          className="table-cell header-cell sortable" 
          style={{ width: INDEX_COLUMN_WIDTH, minWidth: INDEX_COLUMN_WIDTH }}
          onClick={handleIndexHeaderClick}
        >
          <span>#</span>
          {sortColumn === '_index' &&
            (sortOrder === 'asc' ? (
              <SortAscendingOutlined style={{ color: '#1677ff', marginLeft: 4 }} />
            ) : (
              <SortDescendingOutlined style={{ color: '#1677ff', marginLeft: 4 }} />
            ))}
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
            const isDragging = dragIndex === rowIndex;
            const isDragOver = dragOverIndex === rowIndex;

            return (
              <Dropdown
                key={virtualRow.index}
                menu={{ items: contextMenuItems(rowIndex) }}
                trigger={['contextMenu']}
              >
                <div
                  className={`${getRowClassName(row, rowIndex)}${isDragging ? ' row-dragging' : ''}${isDragOver ? ' row-drag-over' : ''}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                    opacity: isDragging ? 0.5 : 1,
                  }}
                  onClick={() => handleRowClick(rowIndex, row._arrayIndex)}
                  onDragOver={(e) => handleDragOver(e, rowIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, rowIndex)}
                >
                  {onMoveRow && (
                    <div
                      className="table-cell drag-handle"
                      style={{ width: DRAG_HANDLE_WIDTH, minWidth: DRAG_HANDLE_WIDTH, cursor: 'grab' }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, rowIndex)}
                      onDragEnd={handleDragEnd}
                    >
                      <HolderOutlined style={{ color: '#bfbfbf' }} />
                    </div>
                  )}
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
                      {formatValue(row[col.key], col.type, col.key)}
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
