// 起動時バリデーション

import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import chalk from 'chalk';
import { SchemaService } from '../services/SchemaService.js';
import { parseCSVContent } from '../lib/csv/parser.js';
import type { ResolvedConfig, DatasetConfig } from './types.js';
import type { Schema } from '../types/index.js';

export interface ValidationIssue {
  type: 'error' | 'warning';
  dataset?: string;
  file?: string;
  message: string;
  hint?: string;
}

export interface StartupValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const schemaService = new SchemaService();

/**
 * 起動時の包括的バリデーションを実行
 */
export async function validateStartupConfig(config: ResolvedConfig): Promise<StartupValidationResult> {
  const issues: ValidationIssue[] = [];

  // ワークスペースディレクトリの存在確認
  const workspaceExists = await checkPathExists(config.workspace.root);
  if (!workspaceExists) {
    issues.push({
      type: 'error',
      message: `Workspace directory not found: ${config.workspace.root}`,
      hint: `Create the directory or update the workspace.root setting in the config file.`,
    });
    // ワークスペースがない場合、他のチェックは意味がないので早期リターン
    return { valid: false, issues };
  }

  // 各データセットのバリデーション
  for (const dataset of config.datasets) {
    const datasetIssues = await validateDataset(dataset, config.workspace.root);
    issues.push(...datasetIssues);
  }

  // データセットID重複チェック
  const datasetIds = config.datasets.map((d) => d.id);
  const duplicateIds = datasetIds.filter((id, index) => datasetIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    issues.push({
      type: 'error',
      message: `Duplicate dataset IDs found: ${[...new Set(duplicateIds)].join(', ')}`,
      hint: `Each dataset must have a unique ID. Update the duplicate IDs in the config file.`,
    });
  }

  return {
    valid: issues.filter((i) => i.type === 'error').length === 0,
    issues,
  };
}

/**
 * 単一データセットのバリデーション
 */
async function validateDataset(dataset: DatasetConfig, workspaceRoot: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const schemaPath = path.resolve(workspaceRoot, dataset.schemaPath);
  const csvPath = path.resolve(workspaceRoot, dataset.csvPath);

  // 1. スキーマファイルの存在確認
  const schemaExists = await checkPathExists(schemaPath);
  if (!schemaExists) {
    issues.push({
      type: 'error',
      dataset: dataset.id,
      file: dataset.schemaPath,
      message: `Schema file not found: ${dataset.schemaPath}`,
      hint: `Create the schema file at: ${schemaPath}\nExample schema structure:\n  schemaVersion: 1\n  id: ${dataset.id}\n  title: ${dataset.title}\n  csv:\n    delimiter: ","\n    header: true\n    primaryKey: "id"\n  columns:\n    - key: id\n      label: ID\n      type: string\n      required: true`,
    });
    // スキーマがなければこれ以上チェックできない
    return issues;
  }

  // 2. スキーマファイルの形式チェック
  let schema: Schema | null = null;
  try {
    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    let rawSchema: unknown;

    // YAML/JSONパース
    try {
      rawSchema = YAML.parse(schemaContent);
    } catch (parseErr) {
      issues.push({
        type: 'error',
        dataset: dataset.id,
        file: dataset.schemaPath,
        message: `Schema file is not valid YAML/JSON: ${(parseErr as Error).message}`,
        hint: `Check the YAML syntax in: ${schemaPath}\nCommon issues:\n  - Incorrect indentation (use spaces, not tabs)\n  - Missing colons after keys\n  - Unquoted special characters`,
      });
      return issues;
    }

    // スキーマバリデーション
    schema = schemaService.validate(rawSchema);
  } catch (err) {
    const errorMessage = (err as Error).message;
    issues.push({
      type: 'error',
      dataset: dataset.id,
      file: dataset.schemaPath,
      message: `Schema validation failed: ${errorMessage}`,
      hint: formatSchemaValidationHint(errorMessage),
    });
  }

  // 3. CSVファイルの存在確認
  const csvExists = await checkPathExists(csvPath);
  if (!csvExists) {
    issues.push({
      type: 'error',
      dataset: dataset.id,
      file: dataset.csvPath,
      message: `CSV file not found: ${dataset.csvPath}`,
      hint: `Create the CSV file at: ${csvPath}\n${schema ? generateCsvTemplate(schema) : 'Create a CSV file with headers matching the schema columns.'}`,
    });
    return issues;
  }

  // 4. CSVファイルの形式チェック（スキーマが有効な場合のみ）
  if (schema) {
    try {
      const csvContent = await fs.readFile(csvPath, 'utf-8');
      const parseResult = parseCSVContent(csvContent, schema);

      // パースエラー
      if (parseResult.errors.length > 0) {
        for (const error of parseResult.errors) {
          issues.push({
            type: 'error',
            dataset: dataset.id,
            file: dataset.csvPath,
            message: `CSV parse error (row ${error.row + 1}): ${error.message}`,
            hint: `Check the CSV format at: ${csvPath}`,
          });
        }
      }

      // ヘッダーとスキーマの整合性チェック
      const headerIssues = validateCsvHeaders(parseResult.headers, schema, dataset, csvPath);
      issues.push(...headerIssues);

      // primaryKeyの存在確認
      if (!parseResult.headers.includes(schema.csv.primaryKey)) {
        issues.push({
          type: 'error',
          dataset: dataset.id,
          file: dataset.csvPath,
          message: `Primary key column "${schema.csv.primaryKey}" not found in CSV headers`,
          hint: `Add a column "${schema.csv.primaryKey}" to the CSV file, or update csv.primaryKey in the schema.`,
        });
      }

      // primaryKeyの重複チェック（警告）
      if (parseResult.rows.length > 0 && parseResult.headers.includes(schema.csv.primaryKey)) {
        const pkValues = parseResult.rows.map((row) => row[schema.csv.primaryKey]);
        const duplicates = pkValues.filter((v, i) => pkValues.indexOf(v) !== i);
        if (duplicates.length > 0) {
          const uniqueDuplicates = [...new Set(duplicates)].slice(0, 5);
          issues.push({
            type: 'warning',
            dataset: dataset.id,
            file: dataset.csvPath,
            message: `Duplicate primary key values found: ${uniqueDuplicates.join(', ')}${duplicates.length > 5 ? ` and ${duplicates.length - 5} more` : ''}`,
            hint: `Primary key should be unique. Check for duplicate values in the "${schema.csv.primaryKey}" column.`,
          });
        }
      }
    } catch (err) {
      issues.push({
        type: 'error',
        dataset: dataset.id,
        file: dataset.csvPath,
        message: `Failed to read CSV file: ${(err as Error).message}`,
        hint: `Check file permissions and encoding (UTF-8 is expected).`,
      });
    }
  }

  return issues;
}

/**
 * CSVヘッダーとスキーマの整合性チェック
 */
function validateCsvHeaders(
  headers: string[],
  schema: Schema,
  dataset: DatasetConfig,
  _csvPath: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const schemaColumns = schema.columns.map((c) => c.key);

  // スキーマにあるがCSVにない列
  const missingInCsv = schemaColumns.filter((col) => !headers.includes(col));
  if (missingInCsv.length > 0) {
    issues.push({
      type: 'warning',
      dataset: dataset.id,
      file: dataset.csvPath,
      message: `Columns defined in schema but missing in CSV: ${missingInCsv.join(', ')}`,
      hint: `Add these columns to the CSV file, or remove them from the schema if not needed.\nExpected columns: ${schemaColumns.join(', ')}`,
    });
  }

  // CSVにあるがスキーマにない列（警告）
  const extraInCsv = headers.filter((h) => !schemaColumns.includes(h));
  if (extraInCsv.length > 0) {
    issues.push({
      type: 'warning',
      dataset: dataset.id,
      file: dataset.csvPath,
      message: `Columns in CSV but not defined in schema: ${extraInCsv.join(', ')}`,
      hint: `These columns will be ignored. Add them to the schema if needed, or remove from CSV.`,
    });
  }

  return issues;
}

/**
 * パスの存在確認
 */
async function checkPathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * スキーマバリデーションエラーのヒントを生成
 */
function formatSchemaValidationHint(errorMessage: string): string {
  const hints: string[] = ['Check the schema file structure:'];

  if (errorMessage.includes('csv.primaryKey')) {
    hints.push('  - csv.primaryKey is required: specify which column is the primary key');
  }
  if (errorMessage.includes('columns')) {
    hints.push('  - columns array is required: define at least one column');
  }
  if (errorMessage.includes('type')) {
    hints.push('  - column.type must be one of: string, integer, number, boolean, date, datetime, enum');
  }
  if (errorMessage.includes('id') || errorMessage.includes('title')) {
    hints.push('  - id and title are required fields');
  }

  hints.push('\nExample minimal schema:');
  hints.push('  schemaVersion: 1');
  hints.push('  id: my_dataset');
  hints.push('  title: My Dataset');
  hints.push('  csv:');
  hints.push('    delimiter: ","');
  hints.push('    header: true');
  hints.push('    primaryKey: "id"');
  hints.push('  columns:');
  hints.push('    - key: id');
  hints.push('      label: ID');
  hints.push('      type: string');

  return hints.join('\n');
}

/**
 * スキーマからCSVテンプレートを生成
 */
function generateCsvTemplate(schema: Schema): string {
  const headers = schema.columns.map((c) => c.key).join(',');
  return `Example CSV structure:\n  ${headers}\n  (add your data rows here)`;
}

/**
 * バリデーション結果をコンソールに出力
 */
export function printValidationResult(result: StartupValidationResult): void {
  if (result.valid && result.issues.length === 0) {
    console.log(chalk.green('\n✓ All configuration files validated successfully.\n'));
    return;
  }

  const errors = result.issues.filter((i) => i.type === 'error');
  const warnings = result.issues.filter((i) => i.type === 'warning');

  console.log('');

  // エラー出力
  if (errors.length > 0) {
    console.log(chalk.red.bold(`✗ ${errors.length} error(s) found:\n`));
    for (const issue of errors) {
      printIssue(issue, 'error');
    }
  }

  // 警告出力
  if (warnings.length > 0) {
    console.log(chalk.yellow.bold(`⚠ ${warnings.length} warning(s):\n`));
    for (const issue of warnings) {
      printIssue(issue, 'warning');
    }
  }

  if (!result.valid) {
    console.log(chalk.red.bold('\n✗ Server startup aborted due to configuration errors.'));
    console.log(chalk.dim('  Fix the errors above and try again.\n'));
  }
}

/**
 * 単一の問題を出力
 */
function printIssue(issue: ValidationIssue, type: 'error' | 'warning'): void {
  const icon = type === 'error' ? chalk.red('✗') : chalk.yellow('⚠');
  const color = type === 'error' ? chalk.red : chalk.yellow;

  // ヘッダー行
  let header = '';
  if (issue.dataset) {
    header += chalk.cyan(`[${issue.dataset}]`);
  }
  if (issue.file) {
    header += header ? ' ' : '';
    header += chalk.dim(issue.file);
  }

  if (header) {
    console.log(`${icon} ${header}`);
    console.log(`  ${color(issue.message)}`);
  } else {
    console.log(`${icon} ${color(issue.message)}`);
  }

  // ヒント
  if (issue.hint) {
    const hintLines = issue.hint.split('\n');
    console.log(chalk.dim('  Hint:'));
    for (const line of hintLines) {
      console.log(chalk.dim(`    ${line}`));
    }
  }

  console.log('');
}

