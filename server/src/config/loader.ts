// 設定ファイル読み込み

import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { ConfigSchema } from './schema.js';
import type { Config, ServerOptions, ResolvedConfig } from './types.js';

const CONFIG_FILE_NAMES = [
  'csvcms.config.yaml',
  'csvcms.config.yml',
  'csvcms.yaml',
  'csvcms.yml',
  '.csvcms.yaml',
  '.csvcms.yml',
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
 * 設定をロード
 */
export async function loadConfig(options: ServerOptions): Promise<ResolvedConfig> {
  // 設定ファイルのパスを決定
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
  };
}

export type { Config, ServerOptions, ResolvedConfig };

