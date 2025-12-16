#!/usr/bin/env node

// CLIエントリポイント

import { program } from 'commander';
import { startServer } from './index.js';

program
  .name('csvms')
  .description('CSVMS - Edit CSV files with a CMS-like UI')
  .version('1.0.0')
  .option('--config <path>', 'Config file path')
  .option('--port <number>', 'Port number', parseInt)
  .option('--host <host>', 'Host to bind', '127.0.0.1')
  .option('--no-open', 'Do not open browser')
  .option('--read-only', 'Read-only mode')
  .option('--allow-write', 'Allow write operations')
  .option('--workspace <path>', 'Workspace root path')
  .option('--log-level <level>', 'Log level (debug|info|warn|error)', 'info')
  .option('--schema <path>', 'Single schema file path (enables single dataset mode)')
  .option('--csv <path>', 'CSV file path (optional with --schema, defaults to same name as schema)')
  .action(async (options) => {
    await startServer({
      config: options.config,
      port: options.port,
      host: options.host,
      open: options.open,
      readOnly: options.readOnly,
      allowWrite: options.allowWrite,
      workspace: options.workspace,
      logLevel: options.logLevel,
      schema: options.schema,
      csv: options.csv,
    });
  });

program.parse();

