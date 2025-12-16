// チェックボックスフィールドウィジェット（boolean用）

import { Form, Checkbox, Switch } from 'antd';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { useController } from 'react-hook-form';

interface CheckboxFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  readOnly?: boolean;
  helpText?: string;
  useSwitch?: boolean;
  control: Control<T>;
}

export function CheckboxField<T extends FieldValues>({
  name,
  label,
  readOnly = false,
  helpText,
  useSwitch = false,
  control,
}: CheckboxFieldProps<T>) {
  const {
    field,
    fieldState: { error },
  } = useController({ name, control });

  return (
    <Form.Item
      label={label}
      validateStatus={error ? 'error' : undefined}
      help={error?.message || helpText}
    >
      {useSwitch ? (
        <Switch
          checked={!!field.value}
          onChange={(checked) => field.onChange(checked)}
          disabled={readOnly}
        />
      ) : (
        <Checkbox
          checked={!!field.value}
          onChange={(e) => field.onChange(e.target.checked)}
          disabled={readOnly}
        >
          {label}
        </Checkbox>
      )}
    </Form.Item>
  );
}

