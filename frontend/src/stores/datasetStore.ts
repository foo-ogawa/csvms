// Dataset編集状態管理

import { create } from 'zustand';
import { datasetsApi } from '@/api';
import type { DatasetMeta, Row, ValidationError, Schema } from '@/api/types';

export type InsertPosition =
  | { type: 'head' }
  | { type: 'last' }
  | { type: 'before'; index: number }
  | { type: 'after'; index: number };

// フロントエンド用に拡張した行型
interface EditableRow extends Row {
  _isNew?: boolean;
  _isDirty?: boolean;
}

interface DatasetState {
  currentDatasetId: string | null;
  meta: DatasetMeta | null;
  originalRows: EditableRow[];
  rows: EditableRow[];
  selectedRowIndex: number | null;
  validationErrors: ValidationError[];
  isDirty: boolean;
  fileHash: string | null;
  isSaving: boolean;
  viewMode: 'table' | 'tile';
  searchQuery: string;
  sortColumn: string | null;
  sortOrder: 'asc' | 'desc';
  detailPanelVisible: boolean;
  detailPanelWidth: number;

  // Actions
  loadDataset: (id: string) => Promise<void>;
  updateRow: (index: number, values: Partial<EditableRow>) => void;
  insertRow: (position: InsertPosition) => void;
  duplicateRow: (index: number) => void;
  deleteRow: (index: number) => void;
  selectRow: (index: number | null) => void;
  validate: () => Promise<ValidationError[]>;
  save: () => Promise<{ success: boolean; error?: string }>;
  reload: () => Promise<void>;
  resetChanges: () => void;
  setViewMode: (mode: 'table' | 'tile') => void;
  setSearchQuery: (query: string) => void;
  setSortColumn: (column: string | null, order: 'asc' | 'desc') => void;
  setDetailPanelVisible: (visible: boolean) => void;
  setDetailPanelWidth: (width: number) => void;
  toggleDetailPanel: () => void;
}

// 行のディープコピー
const cloneRows = (rows: EditableRow[]): EditableRow[] => rows.map((r) => ({ ...r }));

// 変更検知
const checkDirty = (rows: EditableRow[], originalRows: EditableRow[], schema: Schema): boolean => {
  if (rows.length !== originalRows.length) return true;
  return rows.some((row, i) => {
    const original = originalRows[i];
    if (!original) return true;
    return schema.columns.some((col) => row[col.key] !== original[col.key]);
  });
};

export const useDatasetStore = create<DatasetState>((set, get) => ({
  currentDatasetId: null,
  meta: null,
  originalRows: [],
  rows: [],
  selectedRowIndex: null,
  validationErrors: [],
  isDirty: false,
  fileHash: null,
  isSaving: false,
  viewMode: 'table',
  searchQuery: '',
  sortColumn: null,
  sortOrder: 'asc',
  detailPanelVisible: true,
  detailPanelWidth: 400,

  loadDataset: async (id: string) => {
    // メタ情報を取得
    const metaResponse = await datasetsApi.getMeta(id);
    if (!metaResponse.ok) {
      throw new Error('Failed to load dataset meta');
    }
    const meta = metaResponse.data;

    // 行データを取得
    const rowsResponse = await datasetsApi.getRows(id);
    if (!rowsResponse.ok) {
      throw new Error('Failed to load dataset rows');
    }

    const rows: EditableRow[] = rowsResponse.data.rows.map((row) => ({
      ...row,
      _isNew: false,
      _isDirty: false,
    }));

    const viewMode = meta.schema.ui?.list?.viewMode === 'tile' ? 'tile' : 'table';

    set({
      currentDatasetId: id,
      meta,
      originalRows: cloneRows(rows),
      rows: cloneRows(rows),
      selectedRowIndex: null,
      validationErrors: [],
      isDirty: false,
      fileHash: rowsResponse.data.fileHash,
      viewMode,
      searchQuery: '',
      sortColumn: null,
      sortOrder: 'asc',
    });
  },

  updateRow: (index: number, values: Partial<EditableRow>) => {
    const { rows, originalRows, meta } = get();
    if (!meta) return;

    const newRows = [...rows];
    newRows[index] = {
      ...newRows[index],
      ...values,
      _isDirty: true,
    };
    set({
      rows: newRows,
      isDirty: checkDirty(newRows, originalRows, meta.schema),
    });
  },

  insertRow: (position: InsertPosition) => {
    const { rows, originalRows, meta } = get();
    if (!meta) return;

    // 空の新規行を作成
    const newRow: EditableRow = {
      _rowIndex: -1,
      _isNew: true,
      _isDirty: true,
    };

    // デフォルト値を設定
    meta.schema.columns.forEach((col) => {
      if (col.default !== undefined) {
        newRow[col.key] = col.default;
      } else if (col.type === 'boolean') {
        newRow[col.key] = false;
      } else if (col.type === 'integer' || col.type === 'number') {
        newRow[col.key] = 0;
      } else {
        newRow[col.key] = '';
      }
    });

    const newRows = [...rows];
    let insertIndex: number;

    switch (position.type) {
      case 'head':
        insertIndex = 0;
        newRows.unshift(newRow);
        break;
      case 'last':
        insertIndex = newRows.length;
        newRows.push(newRow);
        break;
      case 'before':
        insertIndex = position.index;
        newRows.splice(position.index, 0, newRow);
        break;
      case 'after':
        insertIndex = position.index + 1;
        newRows.splice(position.index + 1, 0, newRow);
        break;
    }

    set({
      rows: newRows,
      selectedRowIndex: insertIndex,
      isDirty: checkDirty(newRows, originalRows, meta.schema),
    });
  },

  duplicateRow: (index: number) => {
    const { rows, originalRows, meta } = get();
    if (!meta) return;

    const sourceRow = rows[index];
    const newRow: EditableRow = {
      ...sourceRow,
      _rowIndex: -1,
      _isNew: true,
      _isDirty: true,
    };

    // プライマリキーをクリア
    const pkColumn = meta.schema.csv?.primaryKey;
    if (pkColumn) {
      newRow[pkColumn] = '';
    }

    const newRows = [...rows];
    newRows.splice(index + 1, 0, newRow);

    set({
      rows: newRows,
      selectedRowIndex: index + 1,
      isDirty: checkDirty(newRows, originalRows, meta.schema),
    });
  },

  deleteRow: (index: number) => {
    const { rows, originalRows, selectedRowIndex, meta } = get();
    if (!meta) return;

    const newRows = rows.filter((_, i) => i !== index);

    let newSelectedIndex = selectedRowIndex;
    if (selectedRowIndex === index) {
      newSelectedIndex = null;
    } else if (selectedRowIndex !== null && selectedRowIndex > index) {
      newSelectedIndex = selectedRowIndex - 1;
    }

    set({
      rows: newRows,
      selectedRowIndex: newSelectedIndex,
      isDirty: checkDirty(newRows, originalRows, meta.schema),
    });
  },

  selectRow: (index: number | null) => {
    set({ selectedRowIndex: index });
  },

  validate: async () => {
    const { currentDatasetId, rows } = get();
    if (!currentDatasetId) return [];

    try {
      // API内部プロパティを除いた行データを送信
      const cleanRows = rows.map((row) => {
        const cleanRow: Row = { _rowIndex: row._rowIndex };
        Object.keys(row).forEach((key) => {
          if (!key.startsWith('_') || key === '_rowIndex') {
            cleanRow[key] = row[key];
          }
        });
        return cleanRow;
      });

      const response = await datasetsApi.validate(currentDatasetId, cleanRows);
      if (response.ok) {
        const errors = response.data.errors.map((err) => ({
          ...err,
          column: err.columnKey,
          type: 'error' as const,
        }));
        set({ validationErrors: errors });
        return errors;
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
    return [];
  },

  save: async () => {
    const { currentDatasetId, rows, fileHash } = get();
    if (!currentDatasetId || !fileHash) {
      return { success: false, error: 'No dataset loaded' };
    }

    set({ isSaving: true });
    try {
      // API内部プロパティを除いた行データを送信
      const cleanRows = rows.map((row) => {
        const cleanRow: Row = { _rowIndex: row._rowIndex };
        Object.keys(row).forEach((key) => {
          if (!key.startsWith('_') || key === '_rowIndex') {
            cleanRow[key] = row[key];
          }
        });
        return cleanRow;
      });

      const response = await datasetsApi.save(currentDatasetId, cleanRows, fileHash);

      if (response.ok) {
        const savedRows = rows.map((row) => ({
          ...row,
          _isNew: false,
          _isDirty: false,
        }));

        set({
          rows: savedRows,
          originalRows: cloneRows(savedRows),
          isDirty: false,
          isSaving: false,
          fileHash: response.data.fileHash,
        });

        return { success: true };
      } else {
        set({ isSaving: false });
        return { success: false, error: 'Save failed' };
      }
    } catch (error) {
      set({ isSaving: false });
      const message = error instanceof Error ? error.message : 'Save failed';
      return { success: false, error: message };
    }
  },

  reload: async () => {
    const { currentDatasetId } = get();
    if (currentDatasetId) {
      await get().loadDataset(currentDatasetId);
    }
  },

  resetChanges: () => {
    const { originalRows } = get();
    set({
      rows: cloneRows(originalRows),
      isDirty: false,
      selectedRowIndex: null,
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortColumn: (column, order) => set({ sortColumn: column, sortOrder: order }),
  setDetailPanelVisible: (visible) => set({ detailPanelVisible: visible }),
  setDetailPanelWidth: (width) => set({ detailPanelWidth: Math.max(300, Math.min(600, width)) }),
  toggleDetailPanel: () => set((state) => ({ detailPanelVisible: !state.detailPanelVisible })),
}));
