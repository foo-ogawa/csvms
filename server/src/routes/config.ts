// GET /api/config

import { Router } from 'express';
import type { ResolvedConfig } from '../config/index.js';
import type { ApiResponse, ConfigData } from '../types/api.js';

export function createConfigRouter(config: ResolvedConfig) {
  const router = Router();

  router.get('/', (_req, res) => {
    const response: ApiResponse<ConfigData> = {
      ok: true,
      data: {
        version: config.version,
        workspace: {
          root: config.workspace.root,
          allowWrite: config.workspace.allowWrite,
        },
        datasets: config.datasets.map((d) => ({
          id: d.id,
          title: d.title,
        })),
      },
    };
    res.json(response);
  });

  return router;
}

