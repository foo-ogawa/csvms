// ナビゲーションバーコンポーネント

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Tag, Space, Tooltip } from 'antd';
import {
  HomeOutlined,
  SaveOutlined,
  DiffOutlined,
  DatabaseOutlined,
  TableOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

interface NavbarProps {
  isDirty: boolean;
  isReadOnly: boolean;
  isSaving: boolean;
  onSave: () => void;
  onShowDiff: () => void;
  detailPanelVisible?: boolean;
  onToggleDetailPanel?: () => void;
  // 単独モード
  singleMode?: boolean;
  singleDataset?: { id: string; title: string } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDirty,
  isReadOnly,
  isSaving,
  onSave,
  onShowDiff,
  detailPanelVisible,
  onToggleDetailPanel,
  singleMode = false,
  singleDataset = null,
}) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  // 単独モードではデータセットページかどうかに関わらず保存ボタン等を表示
  const showDatasetControls = singleMode || !isHomePage;

  return (
    <header className="app-header">
      <div className="app-header-left">
        {singleMode ? (
          // 単独モード: データセットアイコン + データセット名
          <div className="logo single-mode-title">
            <TableOutlined />
            <span>{singleDataset?.title || 'Dataset'}</span>
          </div>
        ) : (
          // 通常モード: CSVMS ロゴ + Homeボタン
          <>
            <Link to="/" className="logo">
              <DatabaseOutlined />
              <span>CSVMS</span>
            </Link>
            {!isHomePage && (
              <Tooltip title="ホームに戻る">
                <Link to="/">
                  <Button type="text" icon={<HomeOutlined />}>
                    Home
                  </Button>
                </Link>
              </Tooltip>
            )}
          </>
        )}
      </div>
      <div className="app-header-right">
        <Space size="middle">
          {isDirty && (
            <Tag color="warning" icon={<ExclamationCircleOutlined />}>
              未保存の変更があります
            </Tag>
          )}
          {isReadOnly && (
            <Tag color="default" icon={<LockOutlined />}>
              読み取り専用
            </Tag>
          )}
          {showDatasetControls && (
            <>
              <Tooltip title="変更内容を確認">
                <Button
                  icon={<DiffOutlined />}
                  onClick={onShowDiff}
                  disabled={!isDirty}
                >
                  差分確認
                </Button>
              </Tooltip>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={onSave}
                disabled={isReadOnly || !isDirty}
                loading={isSaving}
              >
                保存
              </Button>
              <Tooltip title={detailPanelVisible ? '詳細パネルを閉じる' : '詳細パネルを開く'}>
                <Button
                  icon={detailPanelVisible ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={onToggleDetailPanel}
                />
              </Tooltip>
            </>
          )}
        </Space>
      </div>
    </header>
  );
};

