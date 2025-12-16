# CSV CMS 設定仕様

このドキュメントでは、CSV CMSの設定ファイル（`csvcms.config.yaml`）とスキーマファイルの詳細仕様を説明します。

---

## 目次

1. [設定ファイル（csvcms.config.yaml）](#1-設定ファイルcsvcmsconfigyaml)
2. [スキーマファイル](#2-スキーマファイル)
3. [CLIオプション](#3-cliオプション)
4. [サンプル](#4-サンプル)

---

## 1. 設定ファイル（csvcms.config.yaml）

### 1.1 概要

設定ファイルはワークスペースのルートに配置し、CSV CMSの動作とデータセットの定義を行います。

### 1.2 探索順序

以下の順序でファイルを探索します（CWD基準）：

1. `csvcms.config.yaml`
2. `csvcms.config.yml`
3. `csvcms.config.json`

### 1.3 構造

```yaml
version: 1                    # 必須: 設定バージョン（現在は1固定）

workspace:                    # 必須: ワークスペース設定
  root: "."                   # ワークスペースルート（通常は "."）
  allowWrite: false           # 書き込み許可（デフォルト: false）
  allowGlobs:                 # 許可するファイルパターン（オプション）
    - "data/**/*.csv"
  denyGlobs:                  # 拒否するファイルパターン（オプション）
    - "**/node_modules/**"
    - "**/.git/**"

datasets:                     # 必須: データセット定義の配列
  - id: "product_master"      # 一意のID（URLパスに使用）
    title: "商品マスタ"        # 表示名
    csvPath: "data/products.csv"          # CSVファイルパス
    schemaPath: "schemas/products.schema.yaml"  # スキーマファイルパス
```

### 1.4 workspace セクション

| プロパティ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `root` | string | Yes | `"."` | ワークスペースルートディレクトリ |
| `allowWrite` | boolean | No | `false` | 書き込み許可フラグ |
| `allowGlobs` | string[] | No | - | アクセス許可するファイルパターン |
| `denyGlobs` | string[] | No | - | アクセス拒否するファイルパターン |

#### 書き込み許可の優先順位

上から順に優先度が高い：

1. CLI `--read-only` → 常に禁止
2. CLI `--allow-write` → 許可
3. config `workspace.allowWrite` → 設定値
4. デフォルト → 禁止（安全側）

### 1.5 datasets セクション

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `id` | string | Yes | データセットの一意識別子（URLパスに使用） |
| `title` | string | Yes | UIに表示するタイトル |
| `csvPath` | string | Yes | CSVファイルへの相対パス |
| `schemaPath` | string | Yes | スキーマファイルへの相対パス |

---

## 2. スキーマファイル

### 2.1 概要

スキーマファイルはCSVの構造、バリデーション、UIレイアウトを定義します。

### 2.2 トップレベル構造

```yaml
schemaVersion: 1              # 必須: スキーマバージョン（現在は1固定）
id: product_master            # 必須: スキーマID
title: 商品マスタ              # 必須: 表示名

csv:                          # 必須: CSV設定
  # ...

columns:                      # 必須: 列定義の配列
  # ...

ui:                           # 必須: UI設定
  # ...

validation:                   # オプション: バリデーション設定
  # ...
```

### 2.3 csv セクション

CSV ファイルのフォーマットと正規化ルールを定義します。

```yaml
csv:
  delimiter: ","              # 区切り文字（デフォルト: ","）
  header: true                # ヘッダー行の有無（デフォルト: true）
  primaryKey: product_id      # 主キーとなる列（オプション）
  normalize:                  # 保存時の正規化設定
    sortKeys:                 # ソートキー（オプション、空配列で手動順序を維持）
      - column: product_id
        order: asc
    quotePolicy: minimal      # クォートポリシー
    newline: lf               # 改行コード
    encoding: utf-8           # 文字エンコーディング
    bom: false                # BOMの有無
```

#### csv プロパティ

| プロパティ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `delimiter` | string | No | `","` | フィールド区切り文字 |
| `header` | boolean | No | `true` | 1行目をヘッダーとして扱う |
| `primaryKey` | string | No | - | 主キー列のキー名 |
| `normalize` | object | Yes | - | 正規化設定 |

#### normalize プロパティ

| プロパティ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `sortKeys` | SortKey[] | No | `[]` | 保存時のソート順（空で手動順序維持） |
| `quotePolicy` | string | Yes | - | `minimal` / `always` / `none` |
| `newline` | string | Yes | - | `lf` / `crlf` |
| `encoding` | string | Yes | - | `utf-8`（現在は固定） |
| `bom` | boolean | Yes | - | BOMを付与するか |

#### SortKey オブジェクト

```yaml
sortKeys:
  - column: product_id    # ソート対象の列キー
    order: asc            # asc（昇順）/ desc（降順）
```

> **注意**: `sortKeys`を設定すると、保存時に自動的にソートされます。  
> ドラッグ＆ドロップでの手動並べ替えを維持したい場合は、`sortKeys: []`（空配列）または省略してください。

### 2.4 columns セクション

列定義の配列です。各列は以下のプロパティを持ちます。

```yaml
columns:
  - key: product_id           # 必須: 列キー（CSVヘッダー名と一致）
    label: 商品ID             # 必須: 表示ラベル
    type: string              # 必須: データ型
    required: true            # 必須制約
    unique: true              # 一意制約
    default: ""               # デフォルト値
    min: 0                    # 最小値（integer/number）
    max: 100                  # 最大値（integer/number）
    pattern: "^[A-Z0-9_-]+$"  # 正規表現パターン（string）
    enum:                     # 列挙値（type: enumの場合）
      - value: active
        label: 公開
    ui:                       # UI設定
      widget: text
```

#### 列プロパティ

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `key` | string | Yes | CSVの列名（ヘッダー名と一致） |
| `label` | string | Yes | UIに表示するラベル |
| `type` | string | Yes | データ型（下表参照） |
| `required` | boolean | No | 必須制約 |
| `unique` | boolean | No | 一意制約（保存時に検証） |
| `default` | any | No | 新規行のデフォルト値 |
| `min` | number | No | 最小値（integer/number型） |
| `max` | number | No | 最大値（integer/number型） |
| `pattern` | string | No | 正規表現パターン（string型） |
| `enum` | EnumValue[] | No | 列挙値（enum型で必須） |
| `ui` | ColumnUi | No | UI設定 |

#### データ型

| 型 | 説明 | CSVでの表現 |
|---|---|---|
| `string` | 文字列 | そのまま |
| `integer` | 整数 | 数字のみ（小数点不可） |
| `number` | 浮動小数点 | 数字（小数点可） |
| `boolean` | 真偽値 | `true` / `false` |
| `date` | 日付 | `YYYY-MM-DD` 形式 |
| `datetime` | 日時 | `YYYY-MM-DDTHH:mm:ss` 形式（ISO 8601） |
| `enum` | 列挙 | 定義された value のいずれか |

#### enum オブジェクト

```yaml
enum:
  - value: active       # 実際の値（CSVに保存される）
    label: 公開         # 表示ラベル
  - value: draft
    label: 下書き
```

#### ui（列UI設定）

```yaml
ui:
  widget: text              # ウィジェット種類
  readonlyOnEdit: true      # 編集時に読み取り専用
  step: 1                   # 数値の増減ステップ
  placeholder: "入力..."    # プレースホルダーテキスト
  helpText: "ヘルプ"        # ヘルプテキスト
```

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `widget` | string | ウィジェット種類（下表参照） |
| `readonlyOnEdit` | boolean | 既存行の編集時に読み取り専用にする |
| `step` | number | 数値入力の増減ステップ |
| `placeholder` | string | 入力欄のプレースホルダー |
| `helpText` | string | フィールド下に表示するヘルプ |

#### ウィジェット種類

| widget | 対応型 | 説明 |
|--------|--------|------|
| `text` | string | 1行テキスト入力 |
| `textarea` | string | 複数行テキスト入力 |
| `number` | integer, number | 数値入力 |
| `select` | enum | ドロップダウン選択 |
| `checkbox` | boolean | チェックボックス |
| `date` | date | 日付ピッカー |
| `datetime` | datetime | 日時ピッカー |

### 2.5 ui セクション

一覧表示とフォームのレイアウトを定義します。

```yaml
ui:
  list:                       # 一覧表示設定
    viewMode: table           # table / tile / both
    columns:                  # 表示列の配列
      - key: product_id
        width: 160
        pinned: true
        align: left
    quickSearch:              # クイック検索設定
      columns:
        - product_id
        - name
    tile:                     # タイル表示設定（viewModeがtile/bothの場合）
      columns: 3
      titleField: name
      subtitleField: status

  form:                       # フォーム設定
    layout:
      type: sections          # sections / flat
      columns: 2              # flatの場合の列数
      sections:               # sectionsの場合のセクション定義
        - title: 基本情報
          columns: 2
          fields:
            - product_id
            - name
```

#### list 設定

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `viewMode` | string | No | `table` / `tile` / `both`（デフォルト: table） |
| `columns` | ListColumn[] | Yes | 表示列の配列 |
| `quickSearch` | object | No | クイック検索設定 |
| `tile` | object | No | タイル表示設定 |

#### ListColumn

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `key` | string | Yes | 列キー |
| `width` | number | No | 列幅（ピクセル） |
| `pinned` | boolean | No | 左端に固定表示 |
| `align` | string | No | `left` / `center` / `right` |

#### tile 設定（viewModeがtile/bothの場合）

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `columns` | number | グリッド列数（デフォルト: 3） |
| `titleField` | string | タイトルに表示するフィールド |
| `subtitleField` | string | サブタイトルに表示するフィールド |
| `imageField` | string | 画像フィールド（将来対応） |

#### form 設定

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `layout.type` | string | Yes | `sections`（セクション分割） / `flat`（フラット） |
| `layout.columns` | number | No | フラットレイアウトの列数 |
| `layout.sections` | FormSection[] | No | セクション定義（type: sectionsの場合） |

#### FormSection

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | string | Yes | セクションタイトル |
| `columns` | number | No | セクション内の列数 |
| `fields` | string[] | Yes | 表示するフィールドのキー配列 |

### 2.6 validation セクション

行単位のバリデーションルールを定義します。

```yaml
validation:
  rowRules:
    - id: active_price_positive
      message: "公開中の商品は価格が1以上である必要があります"
      expr: "status != 'active' or price >= 1"
```

#### rowRules

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `id` | string | Yes | ルールの一意識別子 |
| `message` | string | Yes | エラーメッセージ |
| `expr` | string | Yes | 検証式（trueで有効） |

#### 式評価（expr）

安全な式評価ライブラリを使用し、任意のJavaScript実行は禁止されています。

**使用可能な演算子**:
- 比較: `==`, `!=`, `<`, `>`, `<=`, `>=`
- 論理: `and`, `or`, `not`（または `&&`, `||`, `!`）
- 算術: `+`, `-`, `*`, `/`

**使用可能な関数**:
- `isEmpty(value)` - 値が空かどうか
- `isNotEmpty(value)` - 値が空でないかどうか
- `length(value)` - 文字列の長さ
- `startsWith(str, prefix)` - 指定文字列で始まるか
- `endsWith(str, suffix)` - 指定文字列で終わるか

**例**:
```yaml
# 公開中は価格が必要
expr: "status != 'active' or price > 0"

# 終了日は開始日より後
expr: "isEmpty(end_date) or end_date > start_date"

# IDは特定のプレフィックスで始まる
expr: "startsWith(id, 'PRD-')"
```

---

## 3. CLIオプション

```bash
npx csv-cms [options]
```

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--config <path>` | 設定ファイルパス | 自動探索 |
| `--port <number>` | サーバーポート | 自動採番 |
| `--host <host>` | バインドホスト | `127.0.0.1` |
| `--no-open` | ブラウザ自動起動しない | - |
| `--read-only` | 読み取り専用モード | - |
| `--allow-write` | 書き込み許可 | - |
| `--workspace <path>` | ワークスペースルート | CWD |
| `--log-level <level>` | ログレベル | `info` |
| `--schema <path>` | 単独スキーマファイル | - |
| `--csv <path>` | 単独CSVファイル | - |

### 3.1 単独モード

`--schema`オプションで設定ファイル不要の単独データセット編集が可能です。

```bash
# スキーマファイルのみ指定（CSVは自動探索）
npx csv-cms --schema schemas/product.schema.yaml

# CSVファイルも明示指定
npx csv-cms --schema schemas/product.schema.yaml --csv data/products.csv

# 書き込み許可付き
npx csv-cms --schema schemas/product.schema.yaml --allow-write
```

**単独モードの特徴**:
- サイドバー非表示
- ナビゲーションバーにデータセット名を表示
- 直接データセット編集画面を表示（ホーム画面をスキップ）

---

## 4. サンプル

### 4.1 設定ファイル例

```yaml
# csvcms.config.yaml
version: 1

workspace:
  root: "."
  allowWrite: true
  denyGlobs:
    - "**/node_modules/**"
    - "**/.git/**"

datasets:
  - id: product_master
    title: 商品マスタ
    csvPath: data/products.csv
    schemaPath: schemas/products.schema.yaml

  - id: category_master
    title: カテゴリマスタ
    csvPath: data/categories.csv
    schemaPath: schemas/categories.schema.yaml
```

### 4.2 スキーマファイル例

```yaml
# schemas/products.schema.yaml
schemaVersion: 1
id: product_master
title: 商品マスタ

csv:
  delimiter: ","
  header: true
  primaryKey: product_id
  normalize:
    # sortKeys を省略または空配列で手動並べ替えを維持
    quotePolicy: minimal
    newline: lf
    encoding: utf-8
    bom: false

columns:
  - key: product_id
    label: 商品ID
    type: string
    required: true
    unique: true
    pattern: "^[A-Z0-9_-]{3,32}$"
    ui:
      widget: text
      readonlyOnEdit: true

  - key: name
    label: 商品名
    type: string
    required: true
    ui:
      widget: text

  - key: status
    label: 状態
    type: enum
    required: true
    default: draft
    enum:
      - value: active
        label: 公開
      - value: draft
        label: 下書き
    ui:
      widget: select

  - key: price
    label: 価格
    type: integer
    required: true
    default: 0
    min: 0
    ui:
      widget: number
      step: 100

ui:
  list:
    columns:
      - key: product_id
        width: 160
        pinned: true
      - key: name
        width: 280
      - key: status
        width: 100
      - key: price
        width: 120
        align: right
    quickSearch:
      columns:
        - product_id
        - name

  form:
    layout:
      type: sections
      sections:
        - title: 基本情報
          columns: 2
          fields:
            - product_id
            - name
        - title: ステータス
          columns: 2
          fields:
            - status
            - price

validation:
  rowRules:
    - id: active_price_positive
      message: "公開中の商品は価格が1以上である必要があります"
      expr: "status != 'active' or price >= 1"
```

### 4.3 ディレクトリ構成例

```
my-project/
├── csvcms.config.yaml      # 設定ファイル
├── data/                   # CSVファイル
│   ├── products.csv
│   └── categories.csv
└── schemas/                # スキーマファイル
    ├── products.schema.yaml
    └── categories.schema.yaml
```

---

## 関連ドキュメント

- [README.md](../README.md) - プロジェクト概要
- [docs/README.md](./README.md) - 要求仕様
- [docs/API.md](./API.md) - API仕様
- [docs/FRONTEND.md](./FRONTEND.md) - フロントエンド実装仕様

