// サイドバーコンポーネント

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Badge, Tooltip } from 'antd';
import { TableOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { DatasetSummary } from '@/types';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  datasets: DatasetSummary[];
  currentId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onCollapse,
  datasets,
  currentId,
}) => {
  const navigate = useNavigate();

  const menuItems = datasets.map((ds) => ({
    key: ds.id,
    icon: <TableOutlined />,
    label: collapsed ? (
      <Tooltip title={`${ds.title} (${ds.rowCount})`} placement="right">
        <span>{ds.title}</span>
      </Tooltip>
    ) : (
      <div className="sidebar-item-content">
        <span>
          {ds.title}
          <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>
            ({ds.rowCount})
          </span>
        </span>
        {ds.errorCount > 0 && (
          <Badge
            count={ds.errorCount}
            size="small"
            style={{ backgroundColor: '#ff4d4f' }}
          />
        )}
      </div>
    ),
  }));

  return (
    <Sider
      className="app-sider"
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={220}
      collapsedWidth={60}
      theme="dark"
    >
      <div style={{ padding: '16px 8px', textAlign: 'center' }}>
        {!collapsed && (
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            Datasets
          </span>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={currentId ? [currentId] : []}
        onClick={({ key }) => navigate(`/datasets/${key}`)}
        items={menuItems}
      />
      {datasets.length > 0 && datasets.some((d) => d.errorCount > 0) && !collapsed && (
        <div
          style={{
            padding: '8px 16px',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>エラーのあるデータセットがあります</span>
        </div>
      )}
    </Sider>
  );
};

