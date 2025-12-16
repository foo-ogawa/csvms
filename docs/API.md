# CSV CMS API仕様書

## 1. 技術スタック

### 1.1 サーバサイド

| カテゴリ | ライブラリ | バージョン | 用途 |
|---------|-----------|-----------|------|
| ランタイム | Node.js | ^20.x | 実行環境 |
| フレームワーク | Express.js | ^4.x | HTTPサーバ |
| 言語 | TypeScript | ^5.x | 型安全性 |
| CSVパーサ | papaparse | ^5.x | CSV読み書き |
| YAMLパーサ | yaml | ^2.x | 設定・スキーマ読み込み |
| バリデーション | Zod | ^3.x | スキーマバリデーション |
| 式評価 | expr-eval | ^2.x | rowRules式の安全な評価 |
| ファイルハッシュ | crypto (組み込み) | - | 競合検知用 |
| ログ | pino | ^8.x | 構造化ログ |
| CLI引数 | commander | ^12.x | CLIオプション解析 |
| ブラウザ起動 | open | ^10.x | 既定ブラウザ起動 |
| ポート検出 | get-port | ^7.x | 空きポート自動取得 |
| glob | fast-glob | ^3.x | ファイルパターンマッチ |

### 1.2 開発用

| ライブラリ | 用途 |
|-----------|------|
| tsx | TypeScript実行（開発時） |
| vitest | ユニットテスト |
| supertest | APIテスト |

---

## 2. ディレクトリ構成

```
server/
├── index.ts                    # サーバエントリポイント
├── app.ts                      # Expressアプリ設定
├── cli.ts                      # CLIエントリ（bin）
├── config/
│   ├── loader.ts               # 設定ファイル読み込み
│   ├── schema.ts               # 設定スキーマ（Zod）
│   └── types.ts                # 設定型定義
├── routes/
│   ├── index.ts                # ルーター統合
│   ├── health.ts               # GET /api/health
│   ├── config.ts               # GET /api/config
│   └── datasets.ts             # /api/datasets/*
├── services/
│   ├── DatasetService.ts       # Dataset操作
│   ├── CsvService.ts           # CSV読み書き・正規化
│   ├── SchemaService.ts        # スキーマ読み込み・変換
│   └── ValidationService.ts    # バリデーション実行
├── middleware/
│   ├── errorHandler.ts         # エラーハンドリング
│   ├── pathGuard.ts            # パストラバーサル防止
│   └── readOnlyGuard.ts        # 読み取り専用チェック
├── lib/
│   ├── csv/
│   │   ├── parser.ts           # CSVパース
│   │   ├── serializer.ts       # CSV出力
│   │   └── normalizer.ts       # 正規化処理
│   ├── validation/
│   │   ├── fieldValidator.ts   # フィールドバリデーション
│   │   ├── uniqueValidator.ts  # unique制約
│   │   └── exprEvaluator.ts    # 式評価（rowRules）
│   └── utils/
│       ├── hash.ts             # ファイルハッシュ計算
│       ├── path.ts             # パス操作・検証
│       └── logger.ts           # ロガー設定
└── types/
    ├── schema.ts               # スキーマ型
    ├── dataset.ts              # Dataset型
    ├── api.ts                  # APIリクエスト/レスポンス型
    └── validation.ts           # バリデーション型
```

---

## 3. API エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/config` | 設定情報取得 |
| GET | `/api/datasets` | Dataset一覧取得 |
| GET | `/api/datasets/:id/meta` | Datasetメタ情報取得 |
| GET | `/api/datasets/:id/rows` | 行データ取得 |
| POST | `/api/datasets/:id/validate` | バリデーション実行 |
| POST | `/api/datasets/:id/save` | 保存（正規化→書き込み） |
| POST | `/api/datasets/:id/diff` | 差分プレビュー（任意） |

---

## 4. API詳細仕様

### 4.1 共通仕様

#### リクエストヘッダ

```
Content-Type: application/json
```

#### レスポンス形式

**成功時**:
```json
{
  "ok": true,
  "data": { ... }
}
```

**エラー時**:
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人間が読めるエラーメッセージ",
    "details": { ... }  // 任意
  }
}
```

#### HTTPステータスコード

| コード | 意味 | 使用場面 |
|--------|------|---------|
| 200 | 成功 | 正常完了 |
| 400 | Bad Request | バリデーションエラー、不正なリクエスト |
| 404 | Not Found | Dataset/リソース不存在 |
| 409 | Conflict | ファイル競合（hash不一致） |
| 500 | Internal Server Error | サーバ内部エラー |

---

### 4.2 GET /api/health

**説明**: サーバの死活監視用

**レスポンス**:
```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime": 12345
  }
}
```

---

### 4.3 GET /api/config

**説明**: 読み込んだ設定を返却（機密情報は除外）

**レスポンス**:
```json
{
  "ok": true,
  "data": {
    "version": 1,
    "workspace": {
      "root": "/path/to/workspace",
      "allowWrite": true
    },
    "datasets": [
      {
        "id": "product_master",
        "title": "商品マスタ"
      }
    ]
  }
}
```

**除外される情報**:
- `allowGlobs`, `denyGlobs`（セキュリティ上）
- サーバ内部設定

---

### 4.4 GET /api/datasets

**説明**: Dataset一覧を取得

**レスポンス**:
```json
{
  "ok": true,
  "data": {
    "datasets": [
      {
        "id": "product_master",
        "title": "商品マスタ",
        "csvPath": "data/products.csv",
        "rowCount": 150,
        "lastModified": "2024-01-15T10:30:00Z"
      },
      {
        "id": "category_master",
        "title": "カテゴリマスタ",
        "csvPath": "data/categories.csv",
        "rowCount": 25,
        "lastModified": "2024-01-10T08:00:00Z"
      }
    ]
  }
}
```

---

### 4.5 GET /api/datasets/:id/meta

**説明**: 指定DatasetのCSVメタ情報とスキーマを取得

**パラメータ**:
| 名前 | 位置 | 型 | 必須 | 説明 |
|------|------|---|------|------|
| id | path | string | ✅ | Dataset ID |

**レスポンス**:
```json
{
  "ok": true,
  "data": {
    "id": "product_master",
    "title": "商品マスタ",
    "csvPath": "data/products.csv",
    "fileHash": "sha256:abc123...",
    "rowCount": 150,
    "lastModified": "2024-01-15T10:30:00Z",
    "schema": {
      "schemaVersion": 1,
      "id": "product_master",
      "title": "商品マスタ",
      "csv": {
        "delimiter": ",",
        "header": true,
        "primaryKey": "product_id",
        "normalize": {
          "sortKeys": [{"column": "product_id", "order": "asc"}],
          "quotePolicy": "minimal",
          "newline": "lf",
          "encoding": "utf-8",
          "bom": false
        }
      },
      "columns": [
        {
          "key": "product_id",
          "label": "商品ID",
          "type": "string",
          "required": true,
          "unique": true,
          "pattern": "^[A-Z0-9_-]{3,32}$",
          "ui": {"widget": "text", "readonlyOnEdit": true}
        },
        {
          "key": "name",
          "label": "商品名",
          "type": "string",
          "required": true,
          "default": "",
          "ui": {"widget": "text"}
        },
        {
          "key": "status",
          "label": "状態",
          "type": "enum",
          "required": true,
          "default": "draft",
          "enum": [
            {"value": "active", "label": "公開"},
            {"value": "draft", "label": "下書き"}
          ],
          "ui": {"widget": "select"}
        },
        {
          "key": "price",
          "label": "価格",
          "type": "integer",
          "required": true,
          "default": 0,
          "min": 0,
          "ui": {"widget": "number", "step": 1}
        }
      ],
      "ui": {
        "list": {
          "columns": [
            {"key": "product_id", "width": 160, "pinned": true},
            {"key": "name", "width": 280},
            {"key": "status", "width": 120},
            {"key": "price", "width": 120, "align": "right"}
          ],
          "quickSearch": {"columns": ["product_id", "name"]}
        },
        "form": {
          "layout": {
            "type": "sections",
            "sections": [
              {"title": "基本", "columns": 2, "fields": ["product_id", "name", "status"]},
              {"title": "価格", "columns": 2, "fields": ["price"]}
            ]
          }
        }
      },
      "validation": {
        "rowRules": [
          {
            "id": "active_price_positive",
            "message": "公開中は価格が1以上である必要があります",
            "expr": "status != 'active' || price >= 1"
          }
        ]
      }
    }
  }
}
```

**エラー**:
| コード | 説明 |
|--------|------|
| `DATASET_NOT_FOUND` | 指定IDのDatasetが存在しない |
| `CSV_NOT_FOUND` | CSVファイルが存在しない |
| `SCHEMA_NOT_FOUND` | スキーマファイルが存在しない |
| `SCHEMA_INVALID` | スキーマの形式が不正 |

---

### 4.6 GET /api/datasets/:id/rows

**説明**: Dataset の行データを取得

**パラメータ**:
| 名前 | 位置 | 型 | 必須 | 説明 |
|------|------|---|------|------|
| id | path | string | ✅ | Dataset ID |
| offset | query | integer | - | 取得開始位置（デフォルト: 0） |
| limit | query | integer | - | 取得件数（デフォルト: 全件） |

**レスポンス**:
```json
{
  "ok": true,
  "data": {
    "fileHash": "sha256:abc123...",
    "totalCount": 150,
    "rows": [
      {
        "_rowIndex": 0,
        "product_id": "PROD-001",
        "name": "商品A",
        "status": "active",
        "price": 1000
      },
      {
        "_rowIndex": 1,
        "product_id": "PROD-002",
        "name": "商品B",
        "status": "draft",
        "price": 2000
      }
    ]
  }
}
```

**備考**:
- `_rowIndex` は内部管理用の行番号（0始まり、ヘッダ除く）
- 型変換済み（integer→number, boolean→boolean等）

**エラー**:
| コード | 説明 |
|--------|------|
| `DATASET_NOT_FOUND` | 指定IDのDatasetが存在しない |
| `CSV_PARSE_ERROR` | CSVのパースに失敗 |
| `CSV_HEADER_INVALID` | ヘッダ行が不正（列名重複等） |

---

### 4.7 POST /api/datasets/:id/validate

**説明**: 行データのバリデーションを実行

**パラメータ**:
| 名前 | 位置 | 型 | 必須 | 説明 |
|------|------|---|------|------|
| id | path | string | ✅ | Dataset ID |

**リクエストボディ**:
```json
{
  "rows": [
    {
      "_rowIndex": 0,
      "product_id": "PROD-001",
      "name": "商品A",
      "status": "active",
      "price": 1000
    },
    {
      "_rowIndex": 1,
      "product_id": "PROD-001",
      "name": "",
      "status": "active",
      "price": 0
    }
  ]
}
```

**レスポンス**:
```json
{
  "ok": true,
  "data": {
    "valid": false,
    "errorCount": 3,
    "errors": [
      {
        "rowIndex": 1,
        "columnKey": "product_id",
        "code": "UNIQUE",
        "message": "商品IDが重複しています"
      },
      {
        "rowIndex": 1,
        "columnKey": "name",
        "code": "REQUIRED",
        "message": "商品名は必須です"
      },
      {
        "rowIndex": 1,
        "columnKey": null,
        "code": "ROW_RULE",
        "ruleId": "active_price_positive",
        "message": "公開中は価格が1以上である必要があります"
      }
    ]
  }
}
```

**バリデーション順序**:
1. フィールド制約（required, min, max, pattern, enum）
2. unique制約（全行に対してチェック）
3. rowRules（式評価）

---

### 4.8 POST /api/datasets/:id/save

**説明**: 行データを正規化して保存

**パラメータ**:
| 名前 | 位置 | 型 | 必須 | 説明 |
|------|------|---|------|------|
| id | path | string | ✅ | Dataset ID |

**リクエストボディ**:
```json
{
  "rows": [
    {
      "product_id": "PROD-001",
      "name": "商品A",
      "status": "active",
      "price": 1000
    },
    {
      "product_id": "PROD-002",
      "name": "商品B",
      "status": "draft",
      "price": 2000
    }
  ],
  "expectedFileHash": "sha256:abc123..."
}
```

**レスポンス（成功時）**:
```json
{
  "ok": true,
  "data": {
    "saved": true,
    "fileHash": "sha256:def456...",
    "rowCount": 2,
    "normalizedPath": "data/products.csv"
  }
}
```

**レスポンス（競合時 - 409）**:
```json
{
  "ok": false,
  "error": {
    "code": "FILE_CONFLICT",
    "message": "ファイルが外部で変更されています",
    "details": {
      "expectedHash": "sha256:abc123...",
      "currentHash": "sha256:xyz789..."
    }
  }
}
```

**レスポンス（バリデーションエラー時 - 400）**:
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラーがあります",
    "details": {
      "errorCount": 2,
      "errors": [...]
    }
  }
}
```

**レスポンス（Read-onlyモード時 - 400）**:
```json
{
  "ok": false,
  "error": {
    "code": "READ_ONLY",
    "message": "読み取り専用モードです。保存は許可されていません。"
  }
}
```

**正規化処理**:
1. 列順をスキーマ順に並べ替え
2. ソートキーに従って行をソート
3. クォートポリシーに従ってクォート
4. 改行コードをLFに統一
5. 末尾に改行を追加
6. UTF-8（BOM設定に従う）で出力

---

### 4.9 POST /api/datasets/:id/diff

**説明**: 保存前の差分プレビュー（任意機能）

**パラメータ**:
| 名前 | 位置 | 型 | 必須 | 説明 |
|------|------|---|------|------|
| id | path | string | ✅ | Dataset ID |

**リクエストボディ**:
```json
{
  "rows": [...]
}
```

**レスポンス**:
```json
{
  "ok": true,
  "data": {
    "hasDiff": true,
    "diff": "--- a/data/products.csv\n+++ b/data/products.csv\n@@ -1,3 +1,3 @@\n product_id,name,status,price\n-PROD-001,商品A,active,1000\n+PROD-001,商品A改,active,1500\n PROD-002,商品B,draft,2000",
    "stats": {
      "added": 0,
      "removed": 0,
      "modified": 1
    }
  }
}
```

---

## 5. エラーコード一覧

| コード | HTTP | 説明 |
|--------|------|------|
| `DATASET_NOT_FOUND` | 404 | 指定IDのDatasetが存在しない |
| `CSV_NOT_FOUND` | 404 | CSVファイルが存在しない |
| `SCHEMA_NOT_FOUND` | 404 | スキーマファイルが存在しない |
| `SCHEMA_INVALID` | 400 | スキーマの形式が不正 |
| `CSV_PARSE_ERROR` | 400 | CSVのパースに失敗 |
| `CSV_HEADER_INVALID` | 400 | ヘッダ行が不正 |
| `VALIDATION_ERROR` | 400 | バリデーションエラー |
| `FILE_CONFLICT` | 409 | ファイル競合（外部変更検知） |
| `READ_ONLY` | 400 | 読み取り専用モードで保存試行 |
| `PATH_TRAVERSAL` | 400 | パストラバーサル検出 |
| `PATH_NOT_ALLOWED` | 400 | 許可されていないパスへのアクセス |
| `INTERNAL_ERROR` | 500 | サーバ内部エラー |

---

## 6. バリデーションエラーコード

| コード | 説明 |
|--------|------|
| `REQUIRED` | 必須フィールドが空 |
| `MIN_VALUE` | 最小値未満 |
| `MAX_VALUE` | 最大値超過 |
| `PATTERN` | 正規表現パターン不一致 |
| `ENUM` | 列挙値以外の値 |
| `UNIQUE` | 重複値 |
| `TYPE_INVALID` | 型変換エラー |
| `ROW_RULE` | 行ルール（expr）違反 |

---

## 7. サービス層詳細

### 7.1 DatasetService

```typescript
// services/DatasetService.ts

export class DatasetService {
  constructor(
    private config: Config,
    private csvService: CsvService,
    private schemaService: SchemaService,
    private validationService: ValidationService,
  ) {}

  async listDatasets(): Promise<DatasetSummary[]>;
  async getMeta(id: string): Promise<DatasetMeta>;
  async getRows(id: string, offset?: number, limit?: number): Promise<RowsResult>;
  async validate(id: string, rows: Row[]): Promise<ValidationResult>;
  async save(id: string, rows: Row[], expectedHash: string): Promise<SaveResult>;
  async getDiff(id: string, rows: Row[]): Promise<DiffResult>;
}
```

### 7.2 CsvService

```typescript
// services/CsvService.ts

export class CsvService {
  /**
   * CSVファイルを読み込み、行配列に変換
   */
  async parse(filePath: string, schema: Schema): Promise<ParseResult>;
  
  /**
   * 行配列を正規化してCSV文字列に変換
   */
  serialize(rows: Row[], schema: Schema): string;
  
  /**
   * ファイルハッシュを計算
   */
  async calculateHash(filePath: string): Promise<string>;
  
  /**
   * 正規化してファイルに書き込み
   */
  async write(filePath: string, content: string): Promise<void>;
}
```

### 7.3 SchemaService

```typescript
// services/SchemaService.ts

export class SchemaService {
  /**
   * スキーマファイルを読み込み・パース
   */
  async load(schemaPath: string): Promise<Schema>;
  
  /**
   * スキーマの検証
   */
  validate(schema: unknown): schema is Schema;
  
  /**
   * デフォルト値を持つ空行を生成
   */
  createEmptyRow(schema: Schema): Row;
}
```

### 7.4 ValidationService

```typescript
// services/ValidationService.ts

export class ValidationService {
  /**
   * 全行のバリデーションを実行
   */
  validateAll(rows: Row[], schema: Schema): ValidationError[];
  
  /**
   * フィールドバリデーション
   */
  validateField(value: unknown, column: Column): ValidationError | null;
  
  /**
   * unique制約チェック
   */
  validateUnique(rows: Row[], column: Column): ValidationError[];
  
  /**
   * 行ルール（expr）評価
   */
  evaluateRowRule(row: Row, rule: RowRule): boolean;
}
```

---

## 8. CSV正規化仕様

### 8.1 正規化オプション

```typescript
interface NormalizeOptions {
  sortKeys?: { column: string; order: 'asc' | 'desc' }[];
  quotePolicy: 'minimal' | 'always' | 'none';
  newline: 'lf' | 'crlf';
  encoding: 'utf-8';
  bom: boolean;
}
```

### 8.2 クォートポリシー

| ポリシー | 説明 |
|---------|------|
| `minimal` | 必要な場合のみクォート（カンマ、改行、ダブルクォート含む） |
| `always` | 全フィールドをクォート |
| `none` | クォートしない（非推奨、データ破損リスク） |

### 8.3 正規化処理フロー

```
1. 入力行配列を受け取る
2. スキーマ順に列を並べ替え
   - スキーマにない列: 設定に従い削除 or 末尾に追加
   - スキーマにあって行にない列: 空文字で埋める
3. sortKeysに従って安定ソート
4. 各フィールドを文字列に変換
   - string: そのまま
   - integer/number: 数値文字列
   - boolean: "true" / "false"
   - date: YYYY-MM-DD
   - datetime: YYYY-MM-DDTHH:mm:ss
5. クォートポリシーに従ってクォート
6. 行を改行で結合
7. 末尾に改行を追加
8. UTF-8（BOM設定に従う）でエンコード
```

---

## 9. セキュリティ

### 9.1 パストラバーサル防止

```typescript
// middleware/pathGuard.ts

import path from 'path';

export function isPathSafe(basePath: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(basePath);
  const resolvedTarget = path.resolve(basePath, targetPath);
  
  // ベースパス配下であることを確認
  return resolvedTarget.startsWith(resolvedBase + path.sep);
}

export function pathGuardMiddleware(workspaceRoot: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // リクエストパスの検証
    const targetPath = extractTargetPath(req);
    if (targetPath && !isPathSafe(workspaceRoot, targetPath)) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'PATH_TRAVERSAL',
          message: 'パストラバーサルが検出されました',
        },
      });
    }
    next();
  };
}
```

### 9.2 Glob制限

```typescript
// lib/utils/path.ts

import fg from 'fast-glob';

export function isPathAllowed(
  filePath: string,
  allowGlobs: string[],
  denyGlobs: string[],
): boolean {
  // denyGlobsにマッチしたら拒否
  for (const pattern of denyGlobs) {
    if (fg.isDynamicPattern(pattern) ? 
        fg.sync(pattern, { cwd: '.' }).includes(filePath) :
        filePath.includes(pattern)) {
      return false;
    }
  }
  
  // allowGlobsのいずれかにマッチしたら許可
  for (const pattern of allowGlobs) {
    if (fg.sync(pattern, { cwd: '.' }).includes(filePath)) {
      return true;
    }
  }
  
  return false;
}
```

### 9.3 Read-onlyガード

```typescript
// middleware/readOnlyGuard.ts

export function readOnlyGuard(isReadOnly: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isReadOnly && req.method !== 'GET') {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'READ_ONLY',
          message: '読み取り専用モードです。保存は許可されていません。',
        },
      });
    }
    next();
  };
}
```

### 9.4 式評価の安全性

```typescript
// lib/validation/exprEvaluator.ts

import { Parser } from 'expr-eval';

// 安全な式評価器（外部コード実行を防止）
const parser = new Parser({
  operators: {
    // 許可する演算子のみ
    logical: true,
    comparison: true,
    // 代入等は禁止
    assignment: false,
  },
});

// 許可する関数のみ登録
parser.functions.isEmpty = (v: unknown) => v === '' || v === null || v === undefined;
parser.functions.isNotEmpty = (v: unknown) => !parser.functions.isEmpty(v);
parser.functions.length = (v: string) => (v || '').length;
parser.functions.startsWith = (v: string, prefix: string) => (v || '').startsWith(prefix);
parser.functions.endsWith = (v: string, suffix: string) => (v || '').endsWith(suffix);

export function evaluateExpr(expr: string, variables: Record<string, unknown>): boolean {
  try {
    const parsed = parser.parse(expr);
    return !!parsed.evaluate(variables);
  } catch {
    // 式のパースエラーは false として扱う（安全側）
    return false;
  }
}
```

---

## 10. ログ仕様

### 10.1 ログフォーマット

```typescript
// lib/utils/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
```

**出力例**:
```
{"level":"INFO","time":"2024-01-15T10:30:00.000Z","msg":"Server started","port":3000}
{"level":"DEBUG","time":"2024-01-15T10:30:01.000Z","msg":"Loading dataset","id":"product_master"}
{"level":"ERROR","time":"2024-01-15T10:30:02.000Z","msg":"CSV parse error","file":"data/products.csv","error":"..."}
```

### 10.2 ログレベル

| レベル | 用途 |
|--------|------|
| error | エラー（例外、致命的問題） |
| warn | 警告（非推奨、潜在的問題） |
| info | 情報（起動、リクエスト完了） |
| debug | デバッグ（詳細な内部動作） |

---

## 11. CLI仕様

### 11.1 エントリポイント

```typescript
// cli.ts

#!/usr/bin/env node

import { program } from 'commander';
import { startServer } from './index';

program
  .name('csv-cms')
  .description('CSV CMS - Edit CSV files with a CMS-like UI')
  .version('1.0.0')
  .option('--config <path>', 'Config file path')
  .option('--port <number>', 'Port number', parseInt)
  .option('--host <host>', 'Host to bind', '127.0.0.1')
  .option('--no-open', 'Do not open browser')
  .option('--read-only', 'Read-only mode')
  .option('--allow-write', 'Allow write operations')
  .option('--workspace <path>', 'Workspace root path')
  .option('--log-level <level>', 'Log level (debug|info|warn|error)', 'info')
  .action(async (options) => {
    await startServer(options);
  });

program.parse();
```

### 11.2 起動フロー

```
1. CLIオプションをパース
2. 設定ファイルを探索・読み込み
3. 設定をマージ（CLI > config > デフォルト）
4. 書き込み許可を決定
5. 空きポートを取得（port=0の場合）
6. Expressサーバ起動
7. SPA静的ファイル配信設定
8. APIルート登録
9. ブラウザ起動（--no-open でなければ）
10. 終了シグナル（SIGINT/SIGTERM）ハンドリング
```

---

## 12. 型定義

### 12.1 スキーマ型

```typescript
// types/schema.ts

export interface Schema {
  schemaVersion: number;
  id: string;
  title: string;
  csv: CsvConfig;
  columns: Column[];
  ui: UiConfig;
  validation?: ValidationConfig;
}

export interface CsvConfig {
  delimiter: string;
  header: boolean;
  primaryKey: string;
  normalize: NormalizeConfig;
}

export interface NormalizeConfig {
  sortKeys?: SortKey[];
  quotePolicy: 'minimal' | 'always' | 'none';
  newline: 'lf' | 'crlf';
  encoding: 'utf-8';
  bom: boolean;
}

export interface SortKey {
  column: string;
  order: 'asc' | 'desc';
}

export interface Column {
  key: string;
  label: string;
  type: 'string' | 'integer' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
  required?: boolean;
  unique?: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: EnumValue[];
  ui?: ColumnUi;
}

export interface EnumValue {
  value: string;
  label: string;
}

export interface ColumnUi {
  widget: string;
  readonlyOnEdit?: boolean;
  step?: number;
}

export interface UiConfig {
  list: ListConfig;
  form: FormConfig;
}

export interface ListConfig {
  columns: ListColumn[];
  quickSearch?: { columns: string[] };
}

export interface ListColumn {
  key: string;
  width?: number;
  pinned?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface FormConfig {
  layout: FormLayout;
}

export interface FormLayout {
  type: 'sections';
  sections: FormSection[];
}

export interface FormSection {
  title: string;
  columns?: number;
  fields: string[];
}

export interface ValidationConfig {
  rowRules?: RowRule[];
}

export interface RowRule {
  id: string;
  message: string;
  expr: string;
}
```

### 12.2 API型

```typescript
// types/api.ts

export interface ApiResponse<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface DatasetSummary {
  id: string;
  title: string;
  csvPath: string;
  rowCount: number;
  lastModified: string;
}

export interface DatasetMeta extends DatasetSummary {
  fileHash: string;
  schema: Schema;
}

export interface Row {
  _rowIndex: number;
  [key: string]: unknown;
}

export interface RowsResult {
  fileHash: string;
  totalCount: number;
  rows: Row[];
}

export interface ValidationResult {
  valid: boolean;
  errorCount: number;
  errors: ValidationError[];
}

export interface ValidationError {
  rowIndex: number;
  columnKey: string | null;
  code: string;
  ruleId?: string;
  message: string;
}

export interface SaveResult {
  saved: boolean;
  fileHash: string;
  rowCount: number;
  normalizedPath: string;
}

export interface DiffResult {
  hasDiff: boolean;
  diff: string;
  stats: {
    added: number;
    removed: number;
    modified: number;
  };
}
```

---

## 13. テスト方針

### 13.1 ユニットテスト

| 対象 | テスト内容 |
|------|-----------|
| CsvService | パース、シリアライズ、正規化 |
| SchemaService | スキーマ読み込み、検証 |
| ValidationService | 各種バリデーション |
| exprEvaluator | 式評価の正確性・安全性 |
| pathGuard | パストラバーサル検出 |

### 13.2 統合テスト

| 対象 | テスト内容 |
|------|-----------|
| API | 各エンドポイントの正常系・異常系 |
| 保存フロー | 競合検知、正規化、書き込み |
| Read-onlyモード | 書き込み禁止の確認 |

---

## 14. 受け入れ条件（API）

- [ ] `GET /api/health` でサーバ稼働を確認できる
- [ ] `GET /api/config` で設定情報を取得できる
- [ ] `GET /api/datasets` でDataset一覧を取得できる
- [ ] `GET /api/datasets/:id/meta` でスキーマ含むメタ情報を取得できる
- [ ] `GET /api/datasets/:id/rows` で行データを取得できる
- [ ] `POST /api/datasets/:id/validate` でバリデーションを実行できる
- [ ] `POST /api/datasets/:id/save` で正規化保存できる
- [ ] 競合時（hash不一致）に409エラーが返る
- [ ] Read-onlyモードで保存リクエストが拒否される
- [ ] パストラバーサルが検出・拒否される
- [ ] 許可されていないパスへのアクセスが拒否される

