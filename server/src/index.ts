// サーバエントリポイント

import getPort from 'get-port';
import open from 'open';
import { createApp } from './app.js';
import { loadConfig, type ServerOptions, type ResolvedConfig } from './config/index.js';
import { logger, setLogLevel } from './lib/utils/logger.js';

export async function startServer(options: ServerOptions = {}): Promise<void> {
  try {
    // 設定読み込み
    const config = await loadConfig(options);
    logger.info({ configPath: config.configPath }, 'Configuration loaded');

    // ログレベル設定
    setLogLevel(config.serverOptions.logLevel);

    // アプリケーション作成
    const app = createApp(config);

    // ポート取得
    const port =
      config.serverOptions.port === 0
        ? await getPort({ port: [3000, 3001, 3002, 3003, 3004, 3005] })
        : config.serverOptions.port;

    // サーバ起動
    const server = app.listen(port, config.serverOptions.host, () => {
      const url = `http://${config.serverOptions.host}:${port}`;
      logger.info({ url, port }, 'Server started');
      console.log(`\n  CSV CMS is running at: ${url}\n`);

      // ブラウザ起動
      if (config.serverOptions.open) {
        open(url).catch(() => {
          logger.debug('Failed to open browser');
        });
      }
    });

    // 終了シグナルハンドリング
    const shutdown = () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    console.error('Error:', (err as Error).message);
    process.exit(1);
  }
}

// Note: 直接実行時のstartServer()呼び出しはcli.tsに移行

export { createApp } from './app.js';
export { loadConfig } from './config/index.js';
export type { ServerOptions, ResolvedConfig };

