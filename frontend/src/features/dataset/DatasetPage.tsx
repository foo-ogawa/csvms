// Dataset編集画面

import React, { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Result, message } from 'antd';
import { useAppStore } from '@/stores/appStore';
import { useDatasetStore } from '@/stores/datasetStore';
import { DataList } from '@/components/DataList';
import { Resizer } from '@/components/Layout';
import { EditPanel } from './EditPanel';

export const DatasetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isReadOnly } = useAppStore();

  const {
    meta,
    rows,
    selectedRowIndex,
    validationErrors,
    isDirty,
    viewMode,
    searchQuery,
    sortColumn,
    sortOrder,
    detailPanelVisible,
    detailPanelWidth,
    loadDataset,
    updateRow,
    insertRow,
    duplicateRow,
    deleteRow,
    selectRow,
    setViewMode,
    setSearchQuery,
    setSortColumn,
    resetChanges,
    reload,
    setDetailPanelWidth,
  } = useDatasetStore();

  // データセット読み込み
  useEffect(() => {
    if (id) {
      loadDataset(id).catch((err) => {
        message.error(`データセットの読み込みに失敗しました: ${err.message}`);
      });
    }
  }, [id, loadDataset]);

  // 選択中の行
  const selectedRow = selectedRowIndex !== null ? rows[selectedRowIndex] : null;

  // フォーム変更ハンドラ
  const handleFormChange = (values: Partial<typeof selectedRow>) => {
    if (selectedRowIndex !== null) {
      updateRow(selectedRowIndex, values);
    }
  };

  // 複製ハンドラ
  const handleDuplicate = () => {
    if (selectedRowIndex !== null) {
      duplicateRow(selectedRowIndex);
      message.success('行を複製しました');
    }
  };

  // 削除ハンドラ
  const handleDelete = () => {
    if (selectedRowIndex !== null) {
      deleteRow(selectedRowIndex);
      message.success('行を削除しました');
    }
  };

  // リサイズハンドラ
  const handleResize = useCallback(
    (delta: number) => {
      setDetailPanelWidth(detailPanelWidth + delta);
    },
    [detailPanelWidth, setDetailPanelWidth]
  );

  // ローディング中
  if (!meta) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" tip="データセットを読み込み中..." />
      </div>
    );
  }

  // 存在しない場合
  if (!id) {
    return (
      <Result
        status="404"
        title="Dataset not found"
        subTitle="指定されたデータセットは存在しません"
      />
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* メインコンテンツ（テーブル/タイル） */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <DataList
          schema={meta.schema}
          rows={rows}
          viewMode={viewMode}
          selectedRowIndex={selectedRowIndex}
          errors={validationErrors}
          searchQuery={searchQuery}
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          isDirty={isDirty}
          readOnly={isReadOnly}
          onRowSelect={selectRow}
          onInsert={insertRow}
          onDuplicate={duplicateRow}
          onDelete={deleteRow}
          onSort={setSortColumn}
          onQuickSearch={setSearchQuery}
          onViewModeChange={setViewMode}
          onResetChanges={resetChanges}
          onReload={reload}
        />
      </div>

      {/* 詳細パネル（リサイズ可能） */}
      {detailPanelVisible && (
        <>
          <Resizer onResize={handleResize} />
          <div
            style={{
              width: detailPanelWidth,
              flexShrink: 0,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <EditPanel
              schema={meta.schema}
              row={selectedRow}
              rowIndex={selectedRowIndex}
              errors={validationErrors}
              onChange={handleFormChange}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              readOnly={isReadOnly}
            />
          </div>
        </>
      )}
    </div>
  );
};
