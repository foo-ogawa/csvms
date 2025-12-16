// 日付フィールドウィジェット

import { Form, DatePicker } from 'antd';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';
import dayjs from 'dayjs';

interface DateFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  helpText?: string;
  control: Control<T>;
}

export function DateField<T extends FieldValues>({
  name,
  label,
  required = false,
  readOnly = false,
  helpText,
  control,
}: DateFieldProps<T>) {
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
        value={value}
        onChange={(date) => {
          field.onChange(date ? date.format('YYYY-MM-DD') : '');
        }}
        disabled={readOnly}
        format="YYYY-MM-DD"
        style={{ width: '100%' }}
      />
    </Form.Item>
  );
}

