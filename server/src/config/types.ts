// 設定型定義

export interface Config {
  version: number;
  workspace: WorkspaceConfig;
  datasets: DatasetConfig[];
}

export interface WorkspaceConfig {
  root: string;
  allowWrite: boolean;
  allowGlobs?: string[];
  denyGlobs?: string[];
}

export interface DatasetConfig {
  id: string;
  title: string;
  csvPath: string;
  schemaPath: string;
}

export interface ServerOptions {
  config?: string;
  port?: number;
  host?: string;
  open?: boolean;
  readOnly?: boolean;
  allowWrite?: boolean;
  workspace?: string;
  logLevel?: string;
}

export interface ResolvedConfig extends Config {
  configPath: string;
  serverOptions: {
    port: number;
    host: string;
    open: boolean;
    logLevel: string;
  };
}

