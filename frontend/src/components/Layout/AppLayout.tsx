// アプリケーション全体レイアウト

import React, { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Layout, message, Spin } from 'antd';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/stores/appStore';
import { useDatasetStore } from '@/stores/datasetStore';

const { Content } = Layout;

export const AppLayout: React.FC = () => {
  const { id: datasetId } = useParams<{ id: string }>();

  const { config, isReadOnly, isLoading, sidebarCollapsed, loadConfig, setSidebarCollapsed } =
    useAppStore();

  const { isDirty, isSaving, detailPanelVisible, save, toggleDetailPanel } = useDatasetStore();

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    const result = await save();
    if (result.success) {
      message.success('保存しました');
    } else {
      message.error('保存に失敗しました');
    }
  };

  const handleShowDiff = () => {
    message.info('差分確認機能（モックでは未実装）');
  };

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
        <Spin size="large" tip="読み込み中..." />
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
      />
      <Layout>
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          datasets={config.datasets}
          currentId={datasetId}
        />
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

