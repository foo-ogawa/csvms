// 動的フォーム生成コンポーネント

import React, { useEffect, useRef, useCallback } from 'react';
import { Form, Card } from 'antd';
import { useForm } from 'react-hook-form';
import type { Schema, Row, ValidationError } from '@/api/types';
import {
  TextField,
  NumberField,
  SelectField,
  CheckboxField,
  DateField,
  DateTimeField,
  MarkdownField,
} from './widgets';

interface DynamicFormProps {
  schema: Schema;
  row: Row;
  isNew: boolean;
  errors: ValidationError[];
  onChange: (values: Partial<Row>) => void;
  readOnly?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  row,
  isNew,
  errors,
  onChange,
  readOnly = false,
}) => {
  // 現在の行インデックスを追跡
  const currentRowIndexRef = useRef<number>(row._rowIndex);
  const isInitializedRef = useRef(false);

  // フォーム初期値を計算（行が変わったときのみ）
  const getDefaultValues = useCallback(() => {
    const values: Record<string, unknown> = {};
    schema.columns.forEach((col) => {
      values[col.key] = row[col.key] ?? col.default ?? '';
    });
    return values;
  }, [schema.columns, row]);

  const { control, watch, reset } = useForm({
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  });

  // 行が変わったときのみフォームをリセット
  useEffect(() => {
    if (currentRowIndexRef.current !== row._rowIndex) {
      currentRowIndexRef.current = row._rowIndex;
      isInitializedRef.current = false;
      reset(getDefaultValues());
    }
  }, [row._rowIndex, reset, getDefaultValues]);

  // 初期化完了フラグ
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitializedRef.current = true;
    }, 100);
    return () => clearTimeout(timer);
  }, [row._rowIndex]);

  // フォーム値の変更を監視（デバウンス付き）
  useEffect(() => {
    const subscription = watch((values) => {
      // 初期化中は変更を通知しない
      if (!isInitializedRef.current) return;
      
      // 同じ行の場合のみ変更を通知
      if (currentRowIndexRef.current === row._rowIndex) {
        onChange(values);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange, row._rowIndex]);

  // フィールドのエラー取得
  const getFieldError = (columnKey: string): string | undefined => {
    const fieldError = errors.find((e) => e.columnKey === columnKey);
    return fieldError?.message;
  };

  // ウィジェットのレンダリング
  const renderField = (columnKey: string) => {
    const col = schema.columns.find((c) => c.key === columnKey);
    if (!col) return null;

    // 編集時にreadOnlyになるフィールド
    const isReadOnlyField = readOnly || (!isNew && col.ui?.readonlyOnEdit);

    const commonProps = {
      name: col.key as never,
      label: col.label,
      required: col.required,
      readOnly: isReadOnlyField,
      helpText: col.ui?.helpText || getFieldError(col.key),
      control,
    };

    // ui.widget または type に基づいてウィジェットを選択
    const widget = col.ui?.widget;

    if (widget === 'markdown') {
      return <MarkdownField key={col.key} {...commonProps} />;
    }

    if (widget === 'textarea') {
      return <TextField key={col.key} {...commonProps} multiline placeholder={col.ui?.placeholder} />;
    }

    switch (col.type) {
      case 'string':
        return (
          <TextField
            key={col.key}
            {...commonProps}
            placeholder={col.ui?.placeholder}
          />
        );

      case 'integer':
      case 'number':
        return (
          <NumberField
            key={col.key}
            {...commonProps}
            min={col.min}
            max={col.max}
          />
        );

      case 'boolean':
        return (
          <CheckboxField
            key={col.key}
            {...commonProps}
            useSwitch={widget === 'switch'}
          />
        );

      case 'enum':
        return (
          <SelectField
            key={col.key}
            {...commonProps}
            options={col.enum || []}
          />
        );

      case 'date':
        return <DateField key={col.key} {...commonProps} />;

      case 'datetime':
        return <DateTimeField key={col.key} {...commonProps} />;

      default:
        return (
          <TextField
            key={col.key}
            {...commonProps}
            placeholder={col.ui?.placeholder}
          />
        );
    }
  };

  // レイアウト設定
  const layout = schema.ui?.form?.layout;

  // セクション分けレイアウト
  if (layout?.type === 'sections' && layout.sections) {
    return (
      <Form layout="vertical">
        {layout.sections.map((section, idx) => (
          <Card
            key={idx}
            size="small"
            title={section.title}
            style={{ marginBottom: 16 }}
          >
            <div
              className={`form-grid columns-${section.columns || layout.columns || 1}`}
            >
              {section.fields.map((fieldKey) => renderField(fieldKey))}
            </div>
          </Card>
        ))}
      </Form>
    );
  }

  // フラットレイアウト
  return (
    <Form layout="vertical">
      <div className={`form-grid columns-${layout?.columns || 1}`}>
        {schema.columns.map((col) => renderField(col.key))}
      </div>
    </Form>
  );
};
