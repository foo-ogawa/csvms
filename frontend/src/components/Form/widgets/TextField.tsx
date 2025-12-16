// テキストフィールドウィジェット

import React from 'react';
import { Form, Input } from 'antd';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';

const { TextArea } = Input;

interface TextFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  helpText?: string;
  multiline?: boolean;
  control: Control<T>;
}

export function TextField<T extends FieldValues>({
  name,
  label,
  required = false,
  readOnly = false,
  placeholder,
  helpText,
  multiline = false,
  control,
}: TextFieldProps<T>) {
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
      {multiline ? (
        <TextArea
          {...field}
          value={field.value ?? ''}
          placeholder={placeholder}
          disabled={readOnly}
          rows={4}
        />
      ) : (
        <Input
          {...field}
          value={field.value ?? ''}
          placeholder={placeholder}
          disabled={readOnly}
        />
      )}
    </Form.Item>
  );
}

