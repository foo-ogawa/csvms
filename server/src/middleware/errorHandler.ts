// エラーハンドリングミドルウェア

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/utils/logger.js';
import type { ApiError, ApiErrorCode } from '../types/api.js';

export class AppError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createAppError(
  code: ApiErrorCode,
  message: string,
  statusCode: number = 400,
  details?: unknown,
): AppError {
  return new AppError(code, message, statusCode, details);
}

/**
 * エラーハンドリングミドルウェア
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const response: ApiError = {
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // 予期しないエラー
  logger.error({ err }, 'Unhandled error');
  const response: ApiError = {
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'サーバ内部エラーが発生しました',
    },
  };
  res.status(500).json(response);
}

/**
 * 404ハンドラ
 */
export function notFoundHandler(_req: Request, res: Response): void {
  const response: ApiError = {
    ok: false,
    error: {
      code: 'DATASET_NOT_FOUND',
      message: 'リソースが見つかりません',
    },
  };
  res.status(404).json(response);
}

