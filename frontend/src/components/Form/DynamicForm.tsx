// 動的フォーム生成コンポーネント

import React, { useEffect } from 'react';
import { Form, Card } from 'antd';
import { useForm } from 'react-hook-form';
import type { Schema, Row, ValidationError } from '@/types';
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
  // フォーム初期値
  const defaultValues = React.useMemo(() => {
    const values: Record<string, unknown> = {};
    schema.columns.forEach((col) => {
      values[col.key] = row[col.key] ?? col.defaultValue ?? '';
    });
    return values;
  }, [schema.columns, row]);

  const { control, watch, reset } = useForm({
    defaultValues,
    mode: 'onChange',
  });

  // 行が変わったらフォームをリセット
  useEffect(() => {
    reset(defaultValues);
  }, [row._rowIndex, reset, defaultValues]);

  // フォーム値の変更を監視
  useEffect(() => {
    const subscription = watch((values) => {
      onChange(values);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  // フィールドのエラー取得
  const getFieldError = (columnKey: string): string | undefined => {
    const fieldError = errors.find((e) => e.column === columnKey);
    return fieldError?.message;
  };

  // ウィジェットのレンダリング
  const renderField = (columnKey: string) => {
    const col = schema.columns.find((c) => c.key === columnKey);
    if (!col) return null;

    const commonProps = {
      name: col.key as never,
      label: col.label,
      required: col.required,
      readOnly,
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
              className={`form-grid columns-${layout.columns || 1}`}
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

