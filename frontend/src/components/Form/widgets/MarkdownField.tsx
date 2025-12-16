// Markdownフィールドウィジェット

import React from 'react';
import { Form, Input } from 'antd';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';

const { TextArea } = Input;

// MDXEditor は重量級なのでモックでは TextArea で代替
// 本番実装では @mdxeditor/editor を使用

interface MarkdownFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  helpText?: string;
  control: Control<T>;
}

export function MarkdownField<T extends FieldValues>({
  name,
  label,
  required = false,
  readOnly = false,
  helpText,
  control,
}: MarkdownFieldProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={error ? 'error' : undefined}
      help={error?.message || helpText || 'Markdown形式で入力できます'}
    >
      <TextArea
        {...field}
        value={field.value ?? ''}
        placeholder="# 見出し\n\n本文..."
        disabled={readOnly}
        rows={8}
        style={{ fontFamily: 'monospace' }}
      />
    </Form.Item>
  );
}

