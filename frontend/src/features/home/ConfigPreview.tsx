// 設定ファイルプレビューコンポーネント

import React from 'react';
import { Card, Collapse, Tag, Space, Typography } from 'antd';
import {
  SettingOutlined,
  FolderOutlined,
  EditOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { Config } from '@/types';

const { Text } = Typography;

interface ConfigPreviewProps {
  config: Config;
}

export const ConfigPreview: React.FC<ConfigPreviewProps> = ({ config }) => {
  return (
    <div className="home-section">
      <h2 className="home-section-title">
        <SettingOutlined /> Configuration
      </h2>
      <Card size="small">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOutlined style={{ color: '#faad14' }} />
            <Text strong>Workspace:</Text>
            <Text code>{config.workspace.root}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: config.workspace.allowWrite ? '#52c41a' : '#ff4d4f' }} />
            <Text strong>Allow Write:</Text>
            <Tag color={config.workspace.allowWrite ? 'success' : 'error'}>
              {config.workspace.allowWrite ? 'Yes' : 'No'}
            </Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DatabaseOutlined style={{ color: '#1677ff' }} />
            <Text strong>Datasets:</Text>
            <Text>{config.datasets.length}</Text>
          </div>
        </div>
      </Card>

      <Collapse
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'yaml',
            label: (
              <Space>
                <Text strong>Config File (csvcms.config.yaml)</Text>
              </Space>
            ),
            children: <pre className="config-preview">{config.configYaml}</pre>,
          },
        ]}
      />
    </div>
  );
};

