// スキーマ操作サービス

import fs from 'node:fs/promises';
import YAML from 'yaml';
import { z } from 'zod';
import type { Schema, Row, Column, EnumValue } from '../types/index.js';

// スキーマ検証用Zodスキーマ
const EnumValueSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const ColumnUiSchema = z
  .object({
    widget: z.string().optional(),
    readonlyOnEdit: z.boolean().optional(),
    step: z.number().optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
  })
  .optional();

const ColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['string', 'integer', 'number', 'boolean', 'date', 'datetime', 'enum']),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  default: z.unknown().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  enum: z.array(EnumValueSchema).optional(),
  ui: ColumnUiSchema,
});

const SortKeySchema = z.object({
  column: z.string(),
  order: z.enum(['asc', 'desc']),
});

const NormalizeConfigSchema = z.object({
  sortKeys: z.array(SortKeySchema).optional(),
  quotePolicy: z.enum(['minimal', 'always', 'none']).default('minimal'),
  newline: z.enum(['lf', 'crlf']).default('lf'),
  encoding: z.literal('utf-8').default('utf-8'),
  bom: z.boolean().default(false),
});

const CsvConfigSchema = z.object({
  delimiter: z.string().default(','),
  header: z.boolean().default(true),
  primaryKey: z.string(),
  normalize: NormalizeConfigSchema.default({}),
});

const ListColumnSchema = z.object({
  key: z.string(),
  width: z.number().optional(),
  pinned: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
});

const FormSectionSchema = z.object({
  title: z.string(),
  columns: z.number().optional(),
  fields: z.array(z.string()),
});

const FormLayoutSchema = z.object({
  type: z.enum(['sections', 'flat']).default('flat'),
  columns: z.number().optional(),
  sections: z.array(FormSectionSchema).optional(),
});

const RowRuleSchema = z.object({
  id: z.string(),
  message: z.string(),
  expr: z.string(),
});

const DataSchemaSchema = z.object({
  schemaVersion: z.number().default(1),
  id: z.string(),
  title: z.string(),
  csv: CsvConfigSchema,
  columns: z.array(ColumnSchema),
  ui: z
    .object({
      list: z
        .object({
          columns: z.array(ListColumnSchema).optional(),
          quickSearch: z.object({ columns: z.array(z.string()) }).optional(),
        })
        .default({}),
      form: z
        .object({
          layout: FormLayoutSchema.optional(),
        })
        .default({}),
    })
    .default({}),
  validation: z
    .object({
      rowRules: z.array(RowRuleSchema).optional(),
    })
    .optional(),
});

export class SchemaService {
  /**
   * スキーマファイルを読み込み・パース
   */
  async load(schemaPath: string): Promise<Schema> {
    const content = await fs.readFile(schemaPath, 'utf-8');
    const rawSchema = YAML.parse(content);
    return this.validate(rawSchema);
  }

  /**
   * スキーマの検証
   */
  validate(schema: unknown): Schema {
    const result = DataSchemaSchema.safeParse(schema);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Invalid schema: ${errors}`);
    }
    return result.data as Schema;
  }

  /**
   * デフォルト値を持つ空行を生成
   */
  createEmptyRow(schema: Schema, rowIndex: number = 0): Row {
    const row: Row = { _rowIndex: rowIndex };
    for (const column of schema.columns) {
      row[column.key] = this.getDefaultValue(column);
    }
    return row;
  }

  /**
   * 列のデフォルト値を取得
   */
  private getDefaultValue(column: Column): unknown {
    if (column.default !== undefined) {
      return column.default;
    }
    switch (column.type) {
      case 'integer':
      case 'number':
        return null;
      case 'boolean':
        return false;
      case 'enum':
        return column.enum?.[0]?.value ?? '';
      default:
        return '';
    }
  }

  /**
   * スキーマファイルが存在するかチェック
   */
  async exists(schemaPath: string): Promise<boolean> {
    try {
      await fs.access(schemaPath);
      return true;
    } catch {
      return false;
    }
  }
}

