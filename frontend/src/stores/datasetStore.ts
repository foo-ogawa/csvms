// Dataset編集状態管理

import { create } from 'zustand';
import type { DatasetMeta, Row, ValidationError } from '@/types';
import { getDatasetMeta, getDatasetRows } from '@/mocks/data';

export type InsertPosition =
  | { type: 'head' }
  | { type: 'last' }
  | { type: 'before'; index: number }
  | { type: 'after'; index: number };

interface DatasetState {
  currentDatasetId: string | null;
  meta: DatasetMeta | null;
  originalRows: Row[];
  rows: Row[];
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
  updateRow: (index: number, values: Partial<Row>) => void;
  insertRow: (position: InsertPosition) => void;
  duplicateRow: (index: number) => void;
  deleteRow: (index: number) => void;
  selectRow: (index: number | null) => void;
  validate: () => Promise<ValidationError[]>;
  save: () => Promise<{ success: boolean }>;
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
const cloneRows = (rows: Row[]): Row[] => rows.map((r) => ({ ...r }));

// 変更検知
const checkDirty = (rows: Row[], originalRows: Row[]): boolean => {
  if (rows.length !== originalRows.length) return true;
  return rows.some((row, i) => {
    const original = originalRows[i];
    if (!original) return true;
    return Object.keys(row).some((key) => {
      if (key.startsWith('_')) return false;
      return row[key] !== original[key];
    });
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
    // モックデータを使用
    await new Promise((resolve) => setTimeout(resolve, 200));
    const meta = getDatasetMeta(id);
    const rows = getDatasetRows(id);

    if (!meta) {
      throw new Error(`Dataset not found: ${id}`);
    }

    const viewMode = meta.schema.ui?.list?.viewMode === 'tile' ? 'tile' : 'table';

    set({
      currentDatasetId: id,
      meta,
      originalRows: cloneRows(rows),
      rows: cloneRows(rows),
      selectedRowIndex: null,
      validationErrors: [],
      isDirty: false,
      fileHash: meta.fileHash,
      viewMode,
      searchQuery: '',
      sortColumn: null,
      sortOrder: 'asc',
    });
  },

  updateRow: (index: number, values: Partial<Row>) => {
    const { rows, originalRows } = get();
    const newRows = [...rows];
    newRows[index] = {
      ...newRows[index],
      ...values,
      _isDirty: true,
    };
    set({
      rows: newRows,
      isDirty: checkDirty(newRows, originalRows),
    });
  },

  insertRow: (position: InsertPosition) => {
    const { rows, originalRows, meta } = get();
    if (!meta) return;

    // 空の新規行を作成
    const newRow: Row = {
      _rowIndex: -1,
      _isNew: true,
      _isDirty: true,
    };

    // デフォルト値を設定
    meta.schema.columns.forEach((col) => {
      if (col.defaultValue !== undefined) {
        newRow[col.key] = col.defaultValue;
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
      isDirty: checkDirty(newRows, originalRows),
    });
  },

  duplicateRow: (index: number) => {
    const { rows, originalRows, meta } = get();
    if (!meta) return;

    const sourceRow = rows[index];
    const newRow: Row = {
      ...sourceRow,
      _rowIndex: -1,
      _isNew: true,
      _isDirty: true,
    };

    // プライマリキーをクリア
    const pkColumn = meta.schema.columns.find((c) => c.primaryKey);
    if (pkColumn) {
      newRow[pkColumn.key] = '';
    }

    const newRows = [...rows];
    newRows.splice(index + 1, 0, newRow);

    set({
      rows: newRows,
      selectedRowIndex: index + 1,
      isDirty: checkDirty(newRows, originalRows),
    });
  },

  deleteRow: (index: number) => {
    const { rows, originalRows, selectedRowIndex } = get();
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
      isDirty: checkDirty(newRows, originalRows),
    });
  },

  selectRow: (index: number | null) => {
    set({ selectedRowIndex: index });
  },

  validate: async () => {
    // モック: バリデーションエラーを返す
    await new Promise((resolve) => setTimeout(resolve, 100));
    const errors: ValidationError[] = [];
    const { rows, meta } = get();

    if (!meta) return errors;

    rows.forEach((row, rowIndex) => {
      meta.schema.columns.forEach((col) => {
        // required チェック
        if (col.required && !row[col.key]) {
          errors.push({
            rowIndex,
            column: col.key,
            message: `${col.label}は必須です`,
            type: 'error',
          });
        }

        // パターンチェック
        if (col.pattern && row[col.key]) {
          const regex = new RegExp(col.pattern);
          if (!regex.test(String(row[col.key]))) {
            errors.push({
              rowIndex,
              column: col.key,
              message: `${col.label}の形式が不正です`,
              type: 'error',
            });
          }
        }

        // 数値範囲チェック
        if ((col.type === 'integer' || col.type === 'number') && row[col.key] !== undefined) {
          const value = Number(row[col.key]);
          if (col.min !== undefined && value < col.min) {
            errors.push({
              rowIndex,
              column: col.key,
              message: `${col.label}は${col.min}以上である必要があります`,
              type: 'error',
            });
          }
          if (col.max !== undefined && value > col.max) {
            errors.push({
              rowIndex,
              column: col.key,
              message: `${col.label}は${col.max}以下である必要があります`,
              type: 'error',
            });
          }
        }
      });
    });

    set({ validationErrors: errors });
    return errors;
  },

  save: async () => {
    set({ isSaving: true });
    try {
      // モック: 保存処理
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const { rows } = get();
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
        fileHash: `hash_${Date.now()}`,
      });

      return { success: true };
    } catch {
      set({ isSaving: false });
      return { success: false };
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

