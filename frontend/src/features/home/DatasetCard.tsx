// Datasetカードコンポーネント

import React from 'react';
import { Card, Badge, Space, Typography } from 'antd';
import {
  TableOutlined,
  RightOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { DatasetSummary } from '@/types';

const { Text } = Typography;

interface DatasetCardProps {
  dataset: DatasetSummary;
  onClick: () => void;
}

export const DatasetCard: React.FC<DatasetCardProps> = ({ dataset, onClick }) => {
  return (
    <Card className="dataset-card" hoverable onClick={onClick} size="small">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="dataset-card-header">
          <TableOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          <Text strong style={{ fontSize: 16 }}>
            {dataset.title}
          </Text>
        </div>
        <div className="dataset-card-stats">
          <Space>
            <FileTextOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary">{dataset.rowCount.toLocaleString()} 行</Text>
          </Space>
          {dataset.errorCount > 0 && (
            <Space>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
              <Text type="danger">{dataset.errorCount} エラー</Text>
            </Space>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Badge
            count={
              <span
                style={{
                  color: '#1677ff',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                開く <RightOutlined />
              </span>
            }
          />
        </div>
      </div>
    </Card>
  );
};

