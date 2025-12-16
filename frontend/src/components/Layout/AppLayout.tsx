// アプリケーション全体レイアウト

import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Layout, message, Spin } from 'antd';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { DiffPreviewModal } from './DiffPreviewModal';
import { useAppStore } from '@/stores/appStore';
import { useDatasetStore } from '@/stores/datasetStore';

const { Content } = Layout;

export const AppLayout: React.FC = () => {
  const { id: datasetId } = useParams<{ id: string }>();

  const {
    config,
    datasets,
    isReadOnly,
    isLoading,
    sidebarCollapsed,
    singleMode,
    singleDataset,
    loadConfig,
    loadDatasets,
    setSidebarCollapsed,
  } = useAppStore();

  const { isDirty, isSaving, detailPanelVisible, rows, originalRows, meta, save, toggleDetailPanel } = useDatasetStore();

  // 差分モーダルの状態
  const [diffModalOpen, setDiffModalOpen] = useState(false);

  useEffect(() => {
    loadConfig();
    loadDatasets();
  }, [loadConfig, loadDatasets]);

  const handleSave = async () => {
    const result = await save();
    if (result.success) {
      message.success('保存しました');
      // 保存後にdatasets一覧を再読込（件数更新）
      loadDatasets();
    } else {
      message.error(result.error || '保存に失敗しました');
    }
  };

  const handleShowDiff = useCallback(() => {
    if (!isDirty) return;
    setDiffModalOpen(true);
  }, [isDirty]);

  const handleCloseDiffModal = useCallback(() => {
    setDiffModalOpen(false);
  }, []);

  // ページ離脱時の警告
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (isLoading || !config) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large">
          <div style={{ padding: 50, textAlign: 'center' }}>読み込み中...</div>
        </Spin>
      </div>
    );
  }

  return (
    <Layout className="app-layout">
      <Navbar
        isDirty={isDirty}
        isReadOnly={isReadOnly}
        isSaving={isSaving}
        onSave={handleSave}
        onShowDiff={handleShowDiff}
        detailPanelVisible={detailPanelVisible}
        onToggleDetailPanel={toggleDetailPanel}
        singleMode={singleMode}
        singleDataset={singleDataset}
      />
      <Layout>
        {!singleMode && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            datasets={datasets}
            currentId={datasetId}
          />
        )}
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>

      {/* 差分確認モーダル */}
      <DiffPreviewModal
        open={diffModalOpen}
        onClose={handleCloseDiffModal}
        columns={meta?.schema.columns ?? []}
        originalRows={originalRows}
        currentRows={rows}
        primaryKey={meta?.schema.csv?.primaryKey}
      />
    </Layout>
  );
};
