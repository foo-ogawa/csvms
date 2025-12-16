// パストラバーサル防止ミドルウェア

import type { Request, Response, NextFunction } from 'express';
import { isPathSafe, isPathAllowed } from '../lib/utils/path.js';
import { createAppError } from './errorHandler.js';
import type { ResolvedConfig } from '../config/index.js';

/**
 * パストラバーサル防止ミドルウェアを作成
 */
export function createPathGuard(config: ResolvedConfig) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const datasetId = req.params.id;
    if (!datasetId) {
      next();
      return;
    }

    // 設定からDatasetを取得
    const dataset = config.datasets.find((d) => d.id === datasetId);
    if (!dataset) {
      next();
      return;
    }

    // CSVパスの検証
    if (!isPathSafe(config.workspace.root, dataset.csvPath)) {
      next(createAppError('PATH_TRAVERSAL', 'パストラバーサルが検出されました', 400));
      return;
    }

    // スキーマパスの検証
    if (!isPathSafe(config.workspace.root, dataset.schemaPath)) {
      next(createAppError('PATH_TRAVERSAL', 'パストラバーサルが検出されました', 400));
      return;
    }

    // Glob制限のチェック
    if (
      !isPathAllowed(
        dataset.csvPath,
        config.workspace.root,
        config.workspace.allowGlobs,
        config.workspace.denyGlobs,
      )
    ) {
      next(createAppError('PATH_NOT_ALLOWED', '許可されていないパスへのアクセスです', 400));
      return;
    }

    next();
  };
}

