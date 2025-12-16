// 読み取り専用チェックミドルウェア

import type { Request, Response, NextFunction } from 'express';
import { createAppError } from './errorHandler.js';

/**
 * Read-only ガードミドルウェアを作成
 */
export function createReadOnlyGuard(allowWrite: boolean) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // GETリクエストは常に許可
    if (req.method === 'GET') {
      next();
      return;
    }

    // 書き込みが許可されている場合は次へ
    if (allowWrite) {
      next();
      return;
    }

    // saveエンドポイントのみをブロック（validateは許可）
    if (req.path.endsWith('/save')) {
      next(
        createAppError(
          'READ_ONLY',
          '読み取り専用モードです。保存は許可されていません。',
          400,
        ),
      );
      return;
    }

    next();
  };
}

