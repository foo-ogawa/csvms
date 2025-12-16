// Expressアプリ設定

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ResolvedConfig } from './config/index.js';
import { createApiRouter } from './routes/index.js';
import {
  errorHandler,
  notFoundHandler,
  createPathGuard,
  createReadOnlyGuard,
} from './middleware/index.js';
import { CsvService, SchemaService, ValidationService, DatasetService } from './services/index.js';
import { logger } from './lib/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(config: ResolvedConfig) {
  const app = express();

  // ミドルウェア
  app.use(express.json({ limit: '10mb' }));

  // リクエストログ
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, path: req.path }, 'Request');
    next();
  });

  // CORS設定（開発用）
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  // サービス初期化
  const csvService = new CsvService();
  const schemaService = new SchemaService();
  const validationService = new ValidationService();
  const datasetService = new DatasetService(config, csvService, schemaService, validationService);

  // セキュリティミドルウェア
  app.use('/api/datasets/:id', createPathGuard(config));
  app.use('/api/datasets/:id', createReadOnlyGuard(config.workspace.allowWrite));

  // APIルート
  app.use('/api', createApiRouter(config, datasetService));

  // SPA静的ファイル配信
  // ビルド後: server/dist/app.js から server/dist/frontend を参照
  const frontendPath = path.resolve(__dirname, 'frontend');
  app.use(express.static(frontendPath));

  // SPA フォールバック
  app.get('*', (req, res, next) => {
    // APIリクエストは404ハンドラへ
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
      if (err) {
        // フロントエンドがビルドされていない場合
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head><title>CSVMS</title></head>
          <body>
            <h1>CSVMS Server</h1>
            <p>API is running at <a href="/api/health">/api/health</a></p>
            <p>Frontend not built. Run <code>cd frontend && npm run build</code></p>
          </body>
          </html>
        `);
      }
    });
  });

  // 404ハンドラ（APIのみ）
  app.use('/api/*', notFoundHandler);

  // エラーハンドラ
  app.use(errorHandler);

  return app;
}

