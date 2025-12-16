// 編集パネルコンポーネント

import React from 'react';
import { Button, Space, Popconfirm, Tag, Tooltip } from 'antd';
import { CopyOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Schema, Row, ValidationError } from '@/api/types';
import { DynamicForm } from '@/components/Form';
import { SchemaViewer } from '@/components/SchemaViewer';

interface EditPanelProps {
  schema: Schema;
  row: Row | null;
  rowIndex: number | null;
  errors: ValidationError[];
  onChange: (values: Partial<Row>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

export const EditPanel: React.FC<EditPanelProps> = ({
  schema,
  row,
  rowIndex,
  errors,
  onChange,
  onDuplicate,
  onDelete,
  readOnly = false,
}) => {
  // 行のエラー
  const rowErrors = errors.filter((e) => e.rowIndex === rowIndex);

  // プライマリキーのカラム
  const primaryKey = schema.csv?.primaryKey;
  const pkColumn = primaryKey ? schema.columns.find((c) => c.key === primaryKey) : null;
  const pkValue = row && pkColumn ? row[pkColumn.key] : null;

  // 未選択時はスキーマ表示
  if (!row || rowIndex === null) {
    return (
      <div className="detail-panel">
        <div className="detail-panel-header">
          <h3>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            スキーマ情報
          </h3>
        </div>
        <div className="detail-panel-content">
          <SchemaViewer schema={schema} />
        </div>
      </div>
    );
  }

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <div>
          <h3 style={{ marginBottom: 4 }}>
            編集: {pkValue ? String(pkValue) : `行 ${rowIndex + 1}`}
          </h3>
          <Space size="small">
            {row._isNew && <Tag color="green">新規</Tag>}
            {row._isDirty && !row._isNew && <Tag color="orange">変更あり</Tag>}
            {rowErrors.length > 0 && (
              <Tag color="red">{rowErrors.length}件のエラー</Tag>
            )}
          </Space>
        </div>
        <Space>
          <Tooltip title="複製">
            <Button
              icon={<CopyOutlined />}
              onClick={onDuplicate}
              disabled={readOnly}
            />
          </Tooltip>
          <Popconfirm
            title="この行を削除しますか？"
            description="この操作は取り消せません"
            onConfirm={onDelete}
            okText="削除"
            cancelText="キャンセル"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="削除">
              <Button
                icon={<DeleteOutlined />}
                danger
                disabled={readOnly}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      </div>
      <div className="detail-panel-content">
        <DynamicForm
          schema={schema}
          row={row}
          isNew={row._isNew ?? false}
          errors={rowErrors}
          onChange={onChange}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};
