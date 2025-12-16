// 日時フィールドウィジェット

import { Form, DatePicker } from 'antd';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';
import dayjs from 'dayjs';

interface DateTimeFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  helpText?: string;
  control: Control<T>;
}

export function DateTimeField<T extends FieldValues>({
  name,
  label,
  required = false,
  readOnly = false,
  helpText,
  control,
}: DateTimeFieldProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  const value = field.value ? dayjs(field.value as string) : null;

  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={error ? 'error' : undefined}
      help={error?.message || helpText}
    >
      <DatePicker
        showTime
        value={value}
        onChange={(date) => {
          field.onChange(date ? date.format('YYYY-MM-DDTHH:mm:ss') : '');
        }}
        disabled={readOnly}
        format="YYYY-MM-DD HH:mm:ss"
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}

