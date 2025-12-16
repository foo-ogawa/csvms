// ルートコンポーネント

import React from 'react';
import { ConfigProvider } from 'antd';
import jaJP from 'antd/locale/ja_JP';
import { theme } from '@/styles/theme';
import { Routes } from '@/routes';
import '@/styles/global.css';

const App: React.FC = () => {
  return (
    <ConfigProvider theme={theme} locale={jaJP}>
      <Routes />
    </ConfigProvider>
  );
};

export default App;

