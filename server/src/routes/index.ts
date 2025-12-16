// ルーター統合

import { Router } from 'express';
import healthRouter from './health.js';
import { createConfigRouter } from './config.js';
import { createDatasetsRouter } from './datasets.js';
import type { ResolvedConfig } from '../config/index.js';
import type { DatasetService } from '../services/DatasetService.js';

export function createApiRouter(config: ResolvedConfig, datasetService: DatasetService) {
  const router = Router();

  router.use('/health', healthRouter);
  router.use('/config', createConfigRouter(config));
  router.use('/datasets', createDatasetsRouter(datasetService));

  return router;
}

