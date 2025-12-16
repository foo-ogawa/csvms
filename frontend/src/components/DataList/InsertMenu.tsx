// 新規追加メニューコンポーネント

import React from 'react';
import { Dropdown, Button } from 'antd';
import {
  PlusOutlined,
  DownOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import type { InsertPosition } from '@/stores/datasetStore';

interface InsertMenuProps {
  selectedRowIndex: number | null;
  onInsert: (position: InsertPosition) => void;
  disabled?: boolean;
}

export const InsertMenu: React.FC<InsertMenuProps> = ({
  selectedRowIndex,
  onInsert,
  disabled = false,
}) => {
  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'head':
        onInsert({ type: 'head' });
        break;
      case 'last':
        onInsert({ type: 'last' });
        break;
      case 'before':
        if (selectedRowIndex !== null) {
          onInsert({ type: 'before', index: selectedRowIndex });
        }
        break;
      case 'after':
        if (selectedRowIndex !== null) {
          onInsert({ type: 'after', index: selectedRowIndex });
        }
        break;
    }
  };

  const menuItems =
    selectedRowIndex !== null
      ? [
          { key: 'before', label: '前に挿入', icon: <ArrowUpOutlined /> },
          { key: 'after', label: '後に挿入', icon: <ArrowDownOutlined /> },
        ]
      : [
          { key: 'head', label: '先頭に追加', icon: <VerticalAlignTopOutlined /> },
          { key: 'last', label: '末尾に追加', icon: <VerticalAlignBottomOutlined /> },
        ];

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      disabled={disabled}
    >
      <Button icon={<PlusOutlined />} disabled={disabled}>
        追加 <DownOutlined />
      </Button>
    </Dropdown>
  );
};

