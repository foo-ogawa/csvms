// セレクトフィールドウィジェット（enum用）

import React from 'react';
import { Form, Select } from 'antd';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';

interface SelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  options: { value: string; label: string }[];
  helpText?: string;
  control: Control<T>;
}

export function SelectField<T extends FieldValues>({
  name,
  label,
  required = false,
  readOnly = false,
  options,
  helpText,
  control,
}: SelectFieldProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={error ? 'error' : undefined}
      help={error?.message || helpText}
    >
      <Select
        {...field}
        value={field.value ?? undefined}
        onChange={(value) => field.onChange(value)}
        options={options}
        disabled={readOnly}
        allowClear={!required}
        placeholder="選択してください"
      />
    </Form.Item>
  );
}

