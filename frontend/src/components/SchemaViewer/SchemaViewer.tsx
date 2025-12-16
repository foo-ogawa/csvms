// スキーマ仕様表示コンポーネント

import React from 'react';
import { Tag, Typography, Descriptions, Table } from 'antd';
import {
  KeyOutlined,
  NumberOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { Schema, Column } from '@/api/types';

const { Text } = Typography;

interface SchemaViewerProps {
  schema: Schema;
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
  // プライマリキー
  const primaryKey = schema.csv?.primaryKey;

  // カラムテーブルのデータ
  const columnTableData = schema.columns.map((col, idx) => ({
    tableKey: idx,
    ...col,
    isPrimaryKey: col.key === primaryKey,
  }));

  // カラムテーブルの列定義
  const columnTableColumns = [
    {
      title: 'カラム名',
      dataIndex: 'key',
      key: 'key',
      render: (key: string, record: Column & { isPrimaryKey?: boolean }) => (
        <span>
          {record.isPrimaryKey && (
            <KeyOutlined style={{ color: '#faad14', marginRight: 4 }} />
          )}
          <Text code>{key}</Text>
        </span>
      ),
    },
    {
      title: '型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '必須',
      dataIndex: 'required',
      key: 'required',
      render: (required: boolean) =>
        required ? (
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
        ) : (
          <span style={{ color: '#d9d9d9' }}>-</span>
        ),
    },
    {
      title: '制約',
      key: 'constraints',
      render: (_: unknown, record: Column) => {
        const constraints: string[] = [];
        if (record.unique) constraints.push('ユニーク');
        if (record.min !== undefined) constraints.push(`min: ${record.min}`);
        if (record.max !== undefined) constraints.push(`max: ${record.max}`);
        if (record.pattern) constraints.push(`pattern: ${record.pattern}`);
        return constraints.length > 0 ? (
          <span style={{ fontSize: 12 }}>{constraints.join(', ')}</span>
        ) : (
          <span style={{ color: '#d9d9d9' }}>-</span>
        );
      },
    },
  ];

  const normalize = schema.csv?.normalize;

  return (
    <div className="schema-viewer">
      {/* 基本情報 */}
      <div className="schema-viewer-section">
        <h4>基本情報</h4>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="ID">{schema.id}</Descriptions.Item>
          <Descriptions.Item label="タイトル">{schema.title}</Descriptions.Item>
          {primaryKey && (
            <Descriptions.Item label="Primary Key">
              <Tag icon={<KeyOutlined />} color="gold">
                {primaryKey}
              </Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      {/* カラム定義 */}
      <div className="schema-viewer-section">
        <h4>
          <NumberOutlined /> カラム定義（{schema.columns.length}）
        </h4>
        <Table
          dataSource={columnTableData}
          columns={columnTableColumns}
          rowKey="tableKey"
          pagination={false}
          size="small"
          bordered
        />
      </div>

      {/* バリデーションルール */}
      {schema.validation?.rowRules && schema.validation.rowRules.length > 0 && (
        <div className="schema-viewer-section">
          <h4>
            <ExclamationCircleOutlined /> バリデーションルール
          </h4>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {schema.validation.rowRules.map((rule, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                <Text>{rule.message}</Text>
                <br />
                <Text code style={{ fontSize: 11 }}>
                  {rule.expr}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 正規化設定 */}
      {normalize && (
        <div className="schema-viewer-section">
          <h4>正規化設定</h4>
          <Descriptions column={1} size="small">
            {normalize.sortKeys && normalize.sortKeys.length > 0 && (
              <Descriptions.Item label="ソート">
                {normalize.sortKeys.map((s, idx) => (
                  <Tag key={idx}>
                    {s.column} ({s.order})
                  </Tag>
                ))}
              </Descriptions.Item>
            )}
            {normalize.quotePolicy && (
              <Descriptions.Item label="クォート">
                {normalize.quotePolicy}
              </Descriptions.Item>
            )}
            {normalize.newline && (
              <Descriptions.Item label="改行コード">
                {normalize.newline.toUpperCase()}
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      )}
    </div>
  );
};
