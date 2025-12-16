// クイック検索コンポーネント

import React, { useState, useEffect } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface QuickSearchProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({
  value,
  onChange,
  placeholder = '検索...',
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  return (
    <Input
      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      allowClear
      style={{ width: 200 }}
    />
  );
};

