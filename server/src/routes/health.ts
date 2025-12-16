// GET /api/health

import { Router } from 'express';
import type { ApiResponse, HealthData } from '../types/api.js';

const router = Router();
const startTime = Date.now();

router.get('/', (_req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const response: ApiResponse<HealthData> = {
    ok: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      uptime,
    },
  };
  res.json(response);
});

export default router;

