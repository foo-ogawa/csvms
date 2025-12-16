// Home画面コンポーネント

import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, Tag, Spin, Empty } from 'antd';
import {
  TableOutlined,
  SettingOutlined,
  FolderOutlined,
  EditOutlined,
  DatabaseOutlined,
  RightOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { config, datasets, isLoading, singleMode, singleDataset } = useAppStore();

  if (isLoading || !config) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin size="large">
          <div style={{ padding: 50 }}>読み込み中...</div>
        </Spin>
      </div>
    );
  }

  // 単独モードの場合、データセットページに即座にリダイレクト
  if (singleMode && singleDataset) {
    return <Navigate to={`/datasets/${singleDataset.id}`} replace />;
  }

  return (
    <div className="home-page" style={{ padding: '24px 16px' }}>
      {/* Configuration */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SettingOutlined /> Configuration
        </h2>
        <Card size="small" style={{ maxWidth: 600 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderOutlined style={{ color: '#faad14' }} />
              <span style={{ fontWeight: 500 }}>Workspace:</span>
              <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
                {config.workspace.root}
              </code>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EditOutlined style={{ color: config.workspace.allowWrite ? '#52c41a' : '#ff4d4f' }} />
              <span style={{ fontWeight: 500 }}>Allow Write:</span>
              <Tag color={config.workspace.allowWrite ? 'success' : 'error'}>
                {config.workspace.allowWrite ? 'Yes' : 'No'}
              </Tag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DatabaseOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontWeight: 500 }}>Datasets:</span>
              <span>{datasets.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Datasets */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TableOutlined /> Datasets
        </h2>
        {datasets.length === 0 ? (
          <Empty description="データセットがありません" />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 320px))',
            gap: 16,
          }}>
            {datasets.map((dataset) => (
              <Card
                key={dataset.id}
                hoverable
                onClick={() => navigate(`/datasets/${dataset.id}`)}
                size="small"
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TableOutlined style={{ fontSize: 18, color: '#1677ff' }} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      {dataset.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8c8c8c' }}>
                    <FileTextOutlined />
                    <span>{dataset.rowCount.toLocaleString()} 行</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                      {dataset.csvPath}
                    </span>
                    <span style={{ color: '#1677ff', fontSize: 13 }}>
                      開く <RightOutlined />
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
