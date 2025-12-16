// Dataset API

import { api } from './client';
import type {
  ApiResponse,
  ConfigResponse,
  DatasetsResponse,
  DatasetMeta,
  RowsResponse,
  ValidateResponse,
  SaveResponse,
  DiffResponse,
  Row,
} from './types';

export const datasetsApi = {
  // 設定情報取得
  getConfig: () =>
    api.get('config').json<ApiResponse<ConfigResponse>>(),

  // Dataset一覧取得
  getDatasets: () =>
    api.get('datasets').json<ApiResponse<DatasetsResponse>>(),

  // Datasetメタ情報取得
  getMeta: (id: string) =>
    api.get(`datasets/${id}/meta`).json<ApiResponse<DatasetMeta>>(),

  // 行データ取得
  getRows: (id: string, offset?: number, limit?: number) => {
    const searchParams: Record<string, string> = {};
    if (offset !== undefined) searchParams.offset = String(offset);
    if (limit !== undefined) searchParams.limit = String(limit);
    return api.get(`datasets/${id}/rows`, { searchParams }).json<ApiResponse<RowsResponse>>();
  },

  // バリデーション実行
  validate: (id: string, rows: Row[]) =>
    api.post(`datasets/${id}/validate`, { json: { rows } })
      .json<ApiResponse<ValidateResponse>>(),

  // 保存
  save: (id: string, rows: Row[], expectedFileHash: string) =>
    api.post(`datasets/${id}/save`, {
      json: { rows, expectedFileHash },
    }).json<ApiResponse<SaveResponse>>(),

  // 差分プレビュー
  getDiff: (id: string, rows: Row[]) =>
    api.post(`datasets/${id}/diff`, { json: { rows } })
      .json<ApiResponse<DiffResponse>>(),
};

