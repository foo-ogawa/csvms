// 設定ファイル読み込み

import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { ConfigSchema } from './schema.js';
import type { Config, ServerOptions, ResolvedConfig } from './types.js';

const CONFIG_FILE_NAMES = [
  'csvms.config.yaml',
  'csvms.config.yml',
  'csvms.yaml',
  'csvms.yml',
  '.csvms.yaml',
  '.csvms.yml',
];

/**
 * 設定ファイルを探索
 */
async function findConfigFile(startDir: string): Promise<string | null> {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = path.join(startDir, fileName);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // File not found, continue
    }
  }
  return null;
}

/**
 * 設定ファイルを読み込み・パース
 */
async function loadConfigFile(configPath: string): Promise<unknown> {
  const content = await fs.readFile(configPath, 'utf-8');
  return YAML.parse(content);
}

/**
 * 設定を検証
 */
function validateConfig(rawConfig: unknown): Config {
  const result = ConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Invalid configuration: ${errors}`);
  }
  return result.data;
}

/**
 * スキーマファイルからタイトルを取得
 */
async function loadSchemaTitle(schemaPath: string): Promise<{ id: string; title: string }> {
  const content = await fs.readFile(schemaPath, 'utf-8');
  const schema = YAML.parse(content);
  return {
    id: schema.id || path.basename(schemaPath, path.extname(schemaPath)),
    title: schema.title || path.basename(schemaPath, path.extname(schemaPath)),
  };
}

/**
 * 2つのパスの共通の親ディレクトリを取得
 */
function getCommonAncestor(path1: string, path2: string): string {
  const parts1 = path1.split(path.sep);
  const parts2 = path2.split(path.sep);
  const commonParts: string[] = [];

  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i]) {
      commonParts.push(parts1[i]);
    } else {
      break;
    }
  }

  return commonParts.join(path.sep) || path.sep;
}

/**
 * 単独モード設定を生成
 */
async function loadSingleModeConfig(options: ServerOptions): Promise<ResolvedConfig> {
  const schemaPath = path.resolve(options.schema!);

  // スキーマファイルの存在確認
  try {
    await fs.access(schemaPath);
  } catch {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  // CSVパスを決定（指定がなければスキーマと同じ名前の.csv）
  let csvPath: string;
  if (options.csv) {
    csvPath = path.resolve(options.csv);
  } else {
    const schemaDir = path.dirname(schemaPath);
    const schemaBasename = path.basename(schemaPath);
    // .schema.yaml, .schema.yml, .yaml, .yml を除去して .csv に変換
    const csvBasename = schemaBasename
      .replace(/\.schema\.(yaml|yml|json)$/i, '.csv')
      .replace(/\.(yaml|yml|json)$/i, '.csv');
    csvPath = path.join(schemaDir, csvBasename);
  }

  // CSVファイルの存在確認
  try {
    await fs.access(csvPath);
  } catch {
    throw new Error(`CSV file not found: ${csvPath}. Use --csv to specify the CSV file path.`);
  }

  // スキーマからタイトルを取得
  const { id, title } = await loadSchemaTitle(schemaPath);

  // ワークスペースルートを決定
  // 明示的に指定されていない場合は、CSVとスキーマの共通の親ディレクトリを使用
  let workspaceRoot: string;
  if (options.workspace) {
    workspaceRoot = path.resolve(options.workspace);
  } else {
    // CSVとスキーマファイルの共通の親ディレクトリを取得
    workspaceRoot = getCommonAncestor(path.dirname(csvPath), path.dirname(schemaPath));
  }

  // 書き込み許可を決定
  let allowWrite = false;
  if (options.readOnly === true) {
    allowWrite = false;
  } else if (options.allowWrite === true) {
    allowWrite = true;
  }

  // CSVパスとスキーマパスを相対パスに変換
  const relativeCsvPath = path.relative(workspaceRoot, csvPath);
  const relativeSchemaPath = path.relative(workspaceRoot, schemaPath);

  return {
    version: 1,
    configPath: `--schema ${schemaPath}`,
    workspace: {
      root: workspaceRoot,
      allowWrite,
      allowGlobs: ['**/*.csv', '**/*.yaml', '**/*.yml', '**/*.json'],
      denyGlobs: ['**/node_modules/**', '**/.git/**'],
    },
    datasets: [
      {
        id,
        title,
        csvPath: relativeCsvPath,
        schemaPath: relativeSchemaPath,
      },
    ],
    serverOptions: {
      port: options.port ?? 0,
      host: options.host ?? '127.0.0.1',
      open: options.open !== false,
      logLevel: options.logLevel ?? 'info',
    },
    singleMode: true,
    singleDataset: { id, title },
  };
}

/**
 * 設定をロード
 */
export async function loadConfig(options: ServerOptions): Promise<ResolvedConfig> {
  // 単独モード: --schema オプションが指定された場合
  if (options.schema) {
    return loadSingleModeConfig(options);
  }

  // 通常モード: 設定ファイルを使用
  let configPath: string;
  if (options.config) {
    configPath = path.resolve(options.config);
    try {
      await fs.access(configPath);
    } catch {
      throw new Error(`Config file not found: ${configPath}`);
    }
  } else {
    const workspaceDir = options.workspace ? path.resolve(options.workspace) : process.cwd();
    const foundPath = await findConfigFile(workspaceDir);
    if (!foundPath) {
      throw new Error(
        `Config file not found. Create one of: ${CONFIG_FILE_NAMES.join(', ')} in ${workspaceDir}`,
      );
    }
    configPath = foundPath;
  }

  // 設定ファイルを読み込み・検証
  const rawConfig = await loadConfigFile(configPath);
  const config = validateConfig(rawConfig);

  // ワークスペースルートを解決
  const configDir = path.dirname(configPath);
  const workspaceRoot = path.resolve(configDir, config.workspace.root);

  // CLI オプションでの上書き
  let allowWrite = config.workspace.allowWrite;
  if (options.readOnly === true) {
    allowWrite = false;
  } else if (options.allowWrite === true) {
    allowWrite = true;
  }

  return {
    ...config,
    configPath,
    workspace: {
      ...config.workspace,
      root: workspaceRoot,
      allowWrite,
    },
    serverOptions: {
      port: options.port ?? 0,
      host: options.host ?? '127.0.0.1',
      open: options.open !== false,
      logLevel: options.logLevel ?? 'info',
    },
    singleMode: false,
  };
}

export type { Config, ServerOptions, ResolvedConfig };

