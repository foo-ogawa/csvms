// 数値フィールドウィジェット

import React from 'react';
import { Form, InputNumber } from 'antd';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';

interface NumberFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  control: Control<T>;
}

export function NumberField<T extends FieldValues>({
  name,
  label,
  required = false,
  readOnly = false,
  min,
  max,
  step = 1,
  helpText,
  control,
}: NumberFieldProps<T>) {
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
      <InputNumber
        {...field}
        value={field.value ?? undefined}
        onChange={(value) => field.onChange(value)}
        min={min}
        max={max}
        step={step}
        disabled={readOnly}
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}

