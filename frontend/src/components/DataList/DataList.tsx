// データ一覧コンポーネント（テーブル/タイル切替）

import React, { useMemo } from 'react';
import { Button, Segmented, Space, Tooltip } from 'antd';
import {
  TableOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  ClearOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { Schema, Row, ValidationError } from '@/api/types';
import type { InsertPosition } from '@/stores/datasetStore';
import { InsertMenu } from './InsertMenu';
import { QuickSearch } from './QuickSearch';
import { DataTable } from './DataTable';
import { DataTileGrid } from './DataTileGrid';

interface DataListProps {
  schema: Schema;
  rows: Row[];
  viewMode: 'table' | 'tile';
  selectedRowIndex: number | null;
  errors: ValidationError[];
  searchQuery: string;
  sortColumn: string | null;
  sortOrder: 'asc' | 'desc';
  isDirty: boolean;
  readOnly?: boolean;
  onRowSelect: (index: number | null) => void;
  onInsert: (position: InsertPosition) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onMoveRow: (fromIndex: number, toIndex: number) => void;
  onSort: (columnKey: string, order: 'asc' | 'desc') => void;
  onResetSort: () => void;
  onQuickSearch: (query: string) => void;
  onViewModeChange: (mode: 'table' | 'tile') => void;
  onResetChanges: () => void;
  onReload: () => void;
}

export const DataList: React.FC<DataListProps> = ({
  schema,
  rows,
  viewMode,
  selectedRowIndex,
  errors,
  searchQuery,
  sortColumn,
  sortOrder,
  isDirty,
  readOnly = false,
  onRowSelect,
  onInsert,
  onDuplicate,
  onDelete,
  onMoveRow,
  onSort,
  onResetSort,
  onQuickSearch,
  onViewModeChange,
  onResetChanges,
  onReload,
}) => {
  // 表示モード切替が可能かどうか
  const canToggleViewMode = schema.ui?.list?.viewMode === 'both';

  // 拡張Row型（配列インデックスを保持）
  type RowWithArrayIndex = Row & { _arrayIndex: number };

  // フィルタリング・ソート済みの行（元のインデックスを保持）
  const filteredRows = useMemo((): RowWithArrayIndex[] => {
    // 元のインデックスを付与
    let result: RowWithArrayIndex[] = rows.map((row, idx) => ({ ...row, _arrayIndex: idx }));

    // 検索フィルタ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        schema.columns.some((col) => {
          const value = row[col.key];
          return value !== undefined && String(value).toLowerCase().includes(query);
        })
      );
    }

    // ソート
    if (sortColumn) {
      if (sortColumn === '_index') {
        // #列でソート（表示インデックス順）
        result.sort((a, b) => {
          const comparison = a._arrayIndex - b._arrayIndex;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      } else {
        result.sort((a, b) => {
          const aVal = a[sortColumn];
          const bVal = b[sortColumn];

          if (aVal === bVal) return 0;
          if (aVal === undefined || aVal === null) return 1;
          if (bVal === undefined || bVal === null) return -1;

          const comparison = String(aVal).localeCompare(String(bVal), 'ja', {
            numeric: true,
          });
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [rows, searchQuery, sortColumn, sortOrder, schema.columns]);

  // ソートやフィルタがかかっているかどうか（ドラッグ&ドロップの有効/無効に使用）
  const canDragDrop = !sortColumn && !searchQuery;

  // selectedRowIndex（元のrows配列のインデックス）をfilteredRowsでの表示インデックスに変換
  const displaySelectedIndex = useMemo(() => {
    if (selectedRowIndex === null) return null;
    const idx = filteredRows.findIndex((row) => row._arrayIndex === selectedRowIndex);
    return idx >= 0 ? idx : null;
  }, [filteredRows, selectedRowIndex]);

  // 表示インデックスから元のrows配列のインデックスに変換してmoveRowを呼び出す
  const handleMoveRow = (fromDisplayIndex: number, toDisplayIndex: number) => {
    const fromRow = filteredRows[fromDisplayIndex];
    const toRow = filteredRows[toDisplayIndex];
    if (fromRow && toRow) {
      onMoveRow(fromRow._arrayIndex, toRow._arrayIndex);
    }
  };

  // キーボードナビゲーション - filteredRowsベースで次/前の行を選択
  const handleSelectNext = () => {
    if (filteredRows.length === 0) return;
    
    if (displaySelectedIndex === null) {
      // 選択がない場合は最初の行を選択
      onRowSelect(filteredRows[0]._arrayIndex);
    } else if (displaySelectedIndex < filteredRows.length - 1) {
      // 次の行を選択
      onRowSelect(filteredRows[displaySelectedIndex + 1]._arrayIndex);
    }
  };

  const handleSelectPrev = () => {
    if (filteredRows.length === 0) return;
    
    if (displaySelectedIndex === null) {
      // 選択がない場合は最後の行を選択
      onRowSelect(filteredRows[filteredRows.length - 1]._arrayIndex);
    } else if (displaySelectedIndex > 0) {
      // 前の行を選択
      onRowSelect(filteredRows[displaySelectedIndex - 1]._arrayIndex);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="data-list-toolbar">
        <div className="data-list-toolbar-left">
          <QuickSearch value={searchQuery} onChange={onQuickSearch} />
          {sortColumn ? (
            <Button
              icon={<CloseCircleOutlined />}
              onClick={onResetSort}
              type="primary"
              ghost
            >
              ソート解除
            </Button>
          ) : (
            <InsertMenu
              selectedRowIndex={selectedRowIndex}
              onInsert={onInsert}
              disabled={readOnly}
            />
          )}
        </div>
        <div className="data-list-toolbar-right">
          <Space size="middle">
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>
              {filteredRows.length.toLocaleString()} 件
            </span>
            {errors.length > 0 && (
              <span style={{ color: '#ff4d4f', fontSize: 13 }}>
                {errors.length} エラー
              </span>
            )}
          </Space>
          <Tooltip title="変更を取り消す">
            <Button
              icon={<ClearOutlined />}
              onClick={onResetChanges}
              disabled={!isDirty}
            />
          </Tooltip>
          <Tooltip title="リロード">
            <Button icon={<ReloadOutlined />} onClick={onReload} />
          </Tooltip>
          {canToggleViewMode && (
            <Segmented
              value={viewMode}
              onChange={(v) => onViewModeChange(v as 'table' | 'tile')}
              options={[
                { value: 'table', icon: <TableOutlined /> },
                { value: 'tile', icon: <AppstoreOutlined /> },
              ]}
            />
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {viewMode === 'table' ? (
          <DataTable
            schema={schema}
            rows={filteredRows}
            selectedRowIndex={displaySelectedIndex}
            errors={errors}
            onRowSelect={onRowSelect}
            onSort={onSort}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onInsert={onInsert}
            onMoveRow={!readOnly && canDragDrop ? handleMoveRow : undefined}
            onSelectNext={handleSelectNext}
            onSelectPrev={handleSelectPrev}
          />
        ) : (
          <DataTileGrid
            schema={schema}
            rows={filteredRows}
            selectedRowIndex={displaySelectedIndex}
            errors={errors}
            onRowSelect={onRowSelect}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onInsert={onInsert}
          />
        )}
      </div>
    </div>
  );
};

