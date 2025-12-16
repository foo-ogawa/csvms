// データ一覧コンポーネント（テーブル/タイル切替）

import React, { useMemo } from 'react';
import { Button, Segmented, Space, Tooltip } from 'antd';
import {
  TableOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  ClearOutlined,
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
  onSort: (columnKey: string, order: 'asc' | 'desc') => void;
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
  onSort,
  onQuickSearch,
  onViewModeChange,
  onResetChanges,
  onReload,
}) => {
  // 表示モード切替が可能かどうか
  const canToggleViewMode = schema.ui?.list?.viewMode === 'both';

  // フィルタリング・ソート済みの行
  const filteredRows = useMemo(() => {
    let result = [...rows];

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

    return result;
  }, [rows, searchQuery, sortColumn, sortOrder, schema.columns]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="data-list-toolbar">
        <div className="data-list-toolbar-left">
          <QuickSearch value={searchQuery} onChange={onQuickSearch} />
          <InsertMenu
            selectedRowIndex={selectedRowIndex}
            onInsert={onInsert}
            disabled={readOnly}
          />
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
            selectedRowIndex={selectedRowIndex}
            errors={errors}
            onRowSelect={onRowSelect}
            onSort={onSort}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onInsert={onInsert}
          />
        ) : (
          <DataTileGrid
            schema={schema}
            rows={filteredRows}
            selectedRowIndex={selectedRowIndex}
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

