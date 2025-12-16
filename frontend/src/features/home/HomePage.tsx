// Home画面コンポーネント

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography } from 'antd';
import { TableOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { DatasetCard } from './DatasetCard';
import { ConfigPreview } from './ConfigPreview';

const { Title } = Typography;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { config } = useAppStore();

  if (!config) {
    return null;
  }

  return (
    <div className="home-page">
      <Title level={2} style={{ marginBottom: 32 }}>
        📊 CSV CMS - Home
      </Title>

      <ConfigPreview config={config} />

      <div className="home-section">
        <h2 className="home-section-title">
          <TableOutlined /> Datasets
        </h2>
        <div className="dataset-cards">
          {config.datasets.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              onClick={() => navigate(`/datasets/${dataset.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

