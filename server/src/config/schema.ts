// 設定スキーマ（Zod）

import { z } from 'zod';

export const DatasetConfigSchema = z.object({
  id: z.string().min(1, 'Dataset ID is required'),
  title: z.string().min(1, 'Dataset title is required'),
  csvPath: z.string().min(1, 'CSV path is required'),
  schemaPath: z.string().min(1, 'Schema path is required'),
});

export const WorkspaceConfigSchema = z.object({
  root: z.string().default('.'),
  allowWrite: z.boolean().default(false),
  allowGlobs: z.array(z.string()).optional(),
  denyGlobs: z.array(z.string()).optional(),
});

export const ConfigSchema = z.object({
  version: z.number().int().positive().default(1),
  workspace: WorkspaceConfigSchema.default({}),
  datasets: z.array(DatasetConfigSchema).min(1, 'At least one dataset is required'),
});

export type ConfigSchemaType = z.infer<typeof ConfigSchema>;

