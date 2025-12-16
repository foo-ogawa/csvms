// Dataset操作サービス

import path from 'node:path';
import type { ResolvedConfig, DatasetConfig } from '../config/index.js';
import type { CsvService } from './CsvService.js';
import type { SchemaService } from './SchemaService.js';
import type { ValidationService } from './ValidationService.js';
import type {
  DatasetSummary,
  DatasetMeta,
  Row,
  RowsResult,
  SaveResult,
  DiffResult,
} from '../types/dataset.js';
import type { ValidationResult } from '../types/validation.js';
import { createAppError } from '../middleware/errorHandler.js';
import { normalizeRows } from '../lib/csv/normalizer.js';

export class DatasetService {
  constructor(
    private config: ResolvedConfig,
    private csvService: CsvService,
    private schemaService: SchemaService,
    private validationService: ValidationService,
  ) {}

  /**
   * Dataset設定を取得
   */
  private getDatasetConfig(id: string): DatasetConfig {
    const dataset = this.config.datasets.find((d) => d.id === id);
    if (!dataset) {
      throw createAppError('DATASET_NOT_FOUND', `Dataset "${id}" が見つかりません`, 404);
    }
    return dataset;
  }

  /**
   * フルパスを取得
   */
  private resolvePath(relativePath: string): string {
    return path.resolve(this.config.workspace.root, relativePath);
  }

  /**
   * Dataset一覧を取得
   */
  async listDatasets(): Promise<DatasetSummary[]> {
    const summaries: DatasetSummary[] = [];

    for (const dataset of this.config.datasets) {
      const csvPath = this.resolvePath(dataset.csvPath);

      let rowCount = 0;
      let lastModified = new Date().toISOString();

      try {
        const schemaPath = this.resolvePath(dataset.schemaPath);
        const schema = await this.schemaService.load(schemaPath);
        const result = await this.csvService.parse(csvPath, schema);
        rowCount = result.rows.length;
        lastModified = (await this.csvService.getLastModified(csvPath)).toISOString();
      } catch {
        // ファイルが存在しない場合は0行として扱う
      }

      summaries.push({
        id: dataset.id,
        title: dataset.title,
        csvPath: dataset.csvPath,
        rowCount,
        lastModified,
      });
    }

    return summaries;
  }

  /**
   * Datasetメタ情報を取得
   */
  async getMeta(id: string): Promise<DatasetMeta> {
    const dataset = this.getDatasetConfig(id);
    const csvPath = this.resolvePath(dataset.csvPath);
    const schemaPath = this.resolvePath(dataset.schemaPath);

    // スキーマ存在チェック
    if (!(await this.schemaService.exists(schemaPath))) {
      throw createAppError('SCHEMA_NOT_FOUND', `スキーマファイルが見つかりません: ${dataset.schemaPath}`, 404);
    }

    // スキーマ読み込み
    let schema;
    try {
      schema = await this.schemaService.load(schemaPath);
    } catch (err) {
      throw createAppError('SCHEMA_INVALID', `スキーマの形式が不正です: ${(err as Error).message}`, 400);
    }

    // CSV存在チェック
    if (!(await this.csvService.exists(csvPath))) {
      throw createAppError('CSV_NOT_FOUND', `CSVファイルが見つかりません: ${dataset.csvPath}`, 404);
    }

    // ファイル情報取得
    const fileHash = await this.csvService.calculateHash(csvPath);
    const lastModified = await this.csvService.getLastModified(csvPath);

    // 行数取得
    const result = await this.csvService.parse(csvPath, schema);

    return {
      id: dataset.id,
      title: dataset.title,
      csvPath: dataset.csvPath,
      fileHash,
      rowCount: result.rows.length,
      lastModified: lastModified.toISOString(),
      schema,
    };
  }

  /**
   * 行データを取得
   */
  async getRows(id: string, offset?: number, limit?: number): Promise<RowsResult> {
    const dataset = this.getDatasetConfig(id);
    const csvPath = this.resolvePath(dataset.csvPath);
    const schemaPath = this.resolvePath(dataset.schemaPath);

    // スキーマ読み込み
    const schema = await this.schemaService.load(schemaPath);

    // CSV存在チェック
    if (!(await this.csvService.exists(csvPath))) {
      throw createAppError('CSV_NOT_FOUND', `CSVファイルが見つかりません: ${dataset.csvPath}`, 404);
    }

    // CSVパース
    let result;
    try {
      result = await this.csvService.parse(csvPath, schema);
    } catch (err) {
      throw createAppError('CSV_PARSE_ERROR', `CSVのパースに失敗しました: ${(err as Error).message}`, 400);
    }

    // ヘッダー検証
    if (result.errors.length > 0) {
      const headerErrors = result.errors.filter((e) => e.row === 0);
      if (headerErrors.length > 0) {
        throw createAppError('CSV_HEADER_INVALID', `ヘッダ行が不正です: ${headerErrors[0].message}`, 400);
      }
    }

    // ファイルハッシュ取得
    const fileHash = await this.csvService.calculateHash(csvPath);

    // ページネーション
    let rows = result.rows;
    const totalCount = rows.length;
    if (offset !== undefined || limit !== undefined) {
      const start = offset ?? 0;
      const end = limit !== undefined ? start + limit : undefined;
      rows = rows.slice(start, end);
    }

    return {
      fileHash,
      totalCount,
      rows,
    };
  }

  /**
   * バリデーションを実行
   */
  async validate(id: string, rows: Row[]): Promise<ValidationResult> {
    const dataset = this.getDatasetConfig(id);
    const schemaPath = this.resolvePath(dataset.schemaPath);

    // スキーマ読み込み
    const schema = await this.schemaService.load(schemaPath);

    // バリデーション実行
    return this.validationService.validateAll(rows, schema);
  }

  /**
   * 行データを保存
   */
  async save(id: string, rows: Omit<Row, '_rowIndex'>[], expectedHash: string): Promise<SaveResult> {
    const dataset = this.getDatasetConfig(id);
    const csvPath = this.resolvePath(dataset.csvPath);
    const schemaPath = this.resolvePath(dataset.schemaPath);

    // スキーマ読み込み
    const schema = await this.schemaService.load(schemaPath);

    // 行に _rowIndex を付与
    const rowsWithIndex: Row[] = rows.map((row, index) => ({
      ...row,
      _rowIndex: index,
    }));

    // バリデーション実行
    const validationResult = this.validationService.validateAll(rowsWithIndex, schema);
    if (!validationResult.valid) {
      throw createAppError('VALIDATION_ERROR', 'バリデーションエラーがあります', 400, {
        errorCount: validationResult.errorCount,
        errors: validationResult.errors,
      });
    }

    // ファイル競合チェック
    if (await this.csvService.exists(csvPath)) {
      const currentHash = await this.csvService.calculateHash(csvPath);
      if (currentHash !== expectedHash) {
        throw createAppError('FILE_CONFLICT', 'ファイルが外部で変更されています', 409, {
          expectedHash,
          currentHash,
        });
      }
    }

    // 正規化してCSV文字列を生成
    const csvContent = this.csvService.serialize(rowsWithIndex, schema);

    // ファイル書き込み
    await this.csvService.write(csvPath, csvContent);

    // 新しいハッシュを計算
    const newHash = await this.csvService.calculateHash(csvPath);

    return {
      saved: true,
      fileHash: newHash,
      rowCount: rows.length,
      normalizedPath: dataset.csvPath,
    };
  }

  /**
   * 差分プレビュー
   */
  async getDiff(id: string, rows: Omit<Row, '_rowIndex'>[]): Promise<DiffResult> {
    const dataset = this.getDatasetConfig(id);
    const csvPath = this.resolvePath(dataset.csvPath);
    const schemaPath = this.resolvePath(dataset.schemaPath);

    // スキーマ読み込み
    const schema = await this.schemaService.load(schemaPath);

    // 現在のCSVを読み込み
    let currentRows: Row[] = [];
    if (await this.csvService.exists(csvPath)) {
      const result = await this.csvService.parse(csvPath, schema);
      currentRows = result.rows;
    }

    // 新しい行に _rowIndex を付与
    const newRowsWithIndex: Row[] = rows.map((row, index) => ({
      ...row,
      _rowIndex: index,
    }));

    // 正規化
    const currentNormalized = normalizeRows(currentRows, schema);
    const newNormalized = normalizeRows(newRowsWithIndex, schema);

    // 差分を計算（簡易実装）
    const currentCsv = this.csvService.serialize(currentRows, schema);
    const newCsv = this.csvService.serialize(newRowsWithIndex, schema);

    const hasDiff = currentCsv !== newCsv;

    // 統計計算（簡易）
    const primaryKey = schema.csv.primaryKey;
    const currentKeys = new Set(currentNormalized.map((r) => String(r[primaryKey])));
    const newKeys = new Set(newNormalized.map((r) => String(r[primaryKey])));

    let added = 0;
    let removed = 0;
    let modified = 0;

    for (const key of newKeys) {
      if (!currentKeys.has(key)) {
        added++;
      }
    }

    for (const key of currentKeys) {
      if (!newKeys.has(key)) {
        removed++;
      }
    }

    // 修正数は両方に存在するキーで内容が異なるもの
    for (const newRow of newNormalized) {
      const key = String(newRow[primaryKey]);
      if (currentKeys.has(key)) {
        const currentRow = currentNormalized.find((r) => String(r[primaryKey]) === key);
        if (currentRow && JSON.stringify(currentRow) !== JSON.stringify(newRow)) {
          modified++;
        }
      }
    }

    // 簡易diff生成
    const diff = hasDiff
      ? `--- a/${dataset.csvPath}\n+++ b/${dataset.csvPath}\n(差分詳細は省略)`
      : '';

    return {
      hasDiff,
      diff,
      stats: { added, removed, modified },
    };
  }
}

