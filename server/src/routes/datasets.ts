// /api/datasets/* ルート

import { Router } from 'express';
import type { DatasetService } from '../services/DatasetService.js';
import type {
  ApiResponse,
  DatasetsListData,
  DatasetMeta,
  RowsResult,
  SaveResult,
  DiffResult,
} from '../types/api.js';
import type { ValidationResult } from '../types/validation.js';
import type { Row } from '../types/dataset.js';
import { AppError } from '../middleware/errorHandler.js';

export function createDatasetsRouter(datasetService: DatasetService) {
  const router = Router();

  // GET /api/datasets - Dataset一覧取得
  router.get('/', async (_req, res, next) => {
    try {
      const datasets = await datasetService.listDatasets();
      const response: ApiResponse<DatasetsListData> = {
        ok: true,
        data: { datasets },
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/datasets/:id/meta - Datasetメタ情報取得
  router.get('/:id/meta', async (req, res, next) => {
    try {
      const meta = await datasetService.getMeta(req.params.id);
      const response: ApiResponse<DatasetMeta> = {
        ok: true,
        data: meta,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/datasets/:id/rows - 行データ取得
  router.get('/:id/rows', async (req, res, next) => {
    try {
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const rows = await datasetService.getRows(req.params.id, offset, limit);
      const response: ApiResponse<RowsResult> = {
        ok: true,
        data: rows,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/datasets/:id/validate - バリデーション実行
  router.post('/:id/validate', async (req, res, next) => {
    try {
      const { rows } = req.body as { rows: Row[] };
      if (!rows || !Array.isArray(rows)) {
        throw new AppError('VALIDATION_ERROR', 'rows配列が必要です', 400);
      }
      const result = await datasetService.validate(req.params.id, rows);
      const response: ApiResponse<ValidationResult> = {
        ok: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/datasets/:id/save - 保存
  router.post('/:id/save', async (req, res, next) => {
    try {
      const { rows, expectedFileHash } = req.body as {
        rows: Omit<Row, '_rowIndex'>[];
        expectedFileHash: string;
      };
      if (!rows || !Array.isArray(rows)) {
        throw new AppError('VALIDATION_ERROR', 'rows配列が必要です', 400);
      }
      if (!expectedFileHash) {
        throw new AppError('VALIDATION_ERROR', 'expectedFileHashが必要です', 400);
      }
      const result = await datasetService.save(req.params.id, rows, expectedFileHash);
      const response: ApiResponse<SaveResult> = {
        ok: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/datasets/:id/diff - 差分プレビュー
  router.post('/:id/diff', async (req, res, next) => {
    try {
      const { rows } = req.body as { rows: Omit<Row, '_rowIndex'>[] };
      if (!rows || !Array.isArray(rows)) {
        throw new AppError('VALIDATION_ERROR', 'rows配列が必要です', 400);
      }
      const result = await datasetService.getDiff(req.params.id, rows);
      const response: ApiResponse<DiffResult> = {
        ok: true,
        data: result,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

