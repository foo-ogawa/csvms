
# CSV CMS 要求仕様

## 1. 目的

* ローカルのCSVを **CMS風UI（一覧 + 詳細フォーム）**で編集できるようにする
* UI定義（入力フォーム / 一覧表示 / バリデーション / 正規化）を **YAML/JSONのスキーマ**で外部定義し、複数CSVに使い回す
* **Git差分が見やすく安定**するよう、保存時にCSVを正規化（列順・改行・クォート・ソート等）
* 配布は **npmパッケージとして提供**し、利用者は `npx` 一発で起動できる（リポジトリclone不要）

---

## 2. 想定利用形態

### 2.1 起動

* 利用者が編集したいリポジトリ/ディレクトリで以下を実行

  * `npx @your-scope/csv-cms`
* アプリは **CWD（実行ディレクトリ）をWorkspace root**として扱う
* CWD配下の設定ファイルを読み込み、対象CSV/スキーマを自動的に認識する

### 2.2 編集対象

* 典型例：

  * `data/*.csv`
  * `schemas/*.yaml`
  * `csvcms.config.yaml`

---

## 3. 非機能要件

* クロスプラットフォーム：Windows / macOS / Linux
* 依存：Node.jsのみ（`npx`実行の前提）
* UI：ブラウザ（既定ブラウザ起動 or URL表示）
* セキュリティ：

  * **Workspace root（CWD）外へのアクセス禁止**
  * 書き込みは明示許可（設定 or CLIフラグ）
  * パス・トラバーサル対策必須
  * **認証・認可：なし**（ローカル実行前提。127.0.0.1バインドで外部アクセスを防止）
* ログ出力：

  * 出力先：標準出力（stdout）
  * フォーマット：`[LEVEL] [timestamp] message`
  * ログレベル：debug < info < warn < error
* 性能（MVP目標）：

  * 数千行×数十列程度のCSVを快適に編集
  * 大規模（数万行以上）はフェーズ2で最適化

---

## 4. 全体アーキテクチャ

### 4.1 構成

* `npx`で起動する **Node CLI（ローカルサーバ）**

  * 設定読込（CWD）
  * SPA（Reactビルド済みdist）を配信
  * ローカルファイルI/O API（CSV/スキーマ読込、保存、検証）
  * express.jsで構築

* React SPA（ブラウザ）

  * 一覧、詳細フォーム、エラー表示、差分プレビュー（任意）
  * API経由でデータ取得/保存

### 4.2 方式選定理由

* ブラウザだけ（file://起動）だと「上書き保存」等が不安定になりやすい
* `npx`ならNodeがあるので、**ローカルサーバ + APIで確実に読み書き**できる
* Git運用に必要な「安定化（正規化）」「差分プレビュー」「保存制御」を実装しやすい

---

## 5. CLI仕様

### 5.1 コマンド

* `npx @your-scope/csv-cms [options]`

### 5.2 オプション（案）

* `--config <path>`：設定ファイルパス（デフォルト：CWD探索）
* `--port <number>`：ポート指定（デフォルト：自動採番）
* `--host <host>`：デフォルト `127.0.0.1`
* `--no-open`：ブラウザ自動起動しない
* `--read-only`：読み取り専用モード（保存禁止）
* `--allow-write`：書き込み許可（設定より強い/弱い優先順位は後述）
* `--workspace <path>`：workspace rootの明示指定（デフォルト：CWD）
* `--log-level <debug|info|warn|error>`

### 5.3 終了

* Ctrl+Cで正常終了
* 終了時、未保存変更がある場合はSPA側で警告（サーバ側は状態保持しない）

---

## 6. 設定ファイル仕様（Workspace設定）

### 6.1 探索ルール

* デフォルトで以下を順に探索（CWD基準）

  1. `csvcms.config.yaml`
  2. `csvcms.config.yml`
  3. `csvcms.config.json`
* 見つからない場合：起動はするが「手動でCSV/スキーマを選択」モード（MVPでは推奨しないが可）

### 6.2 設定フォーマット（例：YAML）

```yaml
version: 1
workspace:
  root: "."              # 通常は "." 固定。CLI --workspace があればそちら優先
  allowWrite: false      # 既定はfalse（安全側）
  allowGlobs:
    - "data/**/*.csv"
    - "schemas/**/*.{yml,yaml,json}"
  denyGlobs:
    - "**/node_modules/**"
    - "**/.git/**"

server:
  host: "127.0.0.1"
  port: 0                # 0=自動
  openBrowser: true

datasets:
  - id: "product_master"
    title: "商品マスタ"
    csvPath: "data/products.csv"
    schemaPath: "schemas/product.schema.yaml"

```

### 6.3 優先順位（安全設計）

* 書き込み許可は以下の優先順位で決定（上ほど強い）

  1. CLI `--read-only`（常に禁止）
  2. CLI `--allow-write`（許可）
  3. config `workspace.allowWrite`
  4. デフォルト（禁止）

---

## 7. スキーマ仕様（CSVごとの定義）

### 7.1 目的

* CSV列の型・制約・表示名
* 一覧画面の列構成
* フォームのレイアウトとウィジェット
* 行ルール（条件付き制約）
* 保存時の正規化ルール（configで上書き可能）

### 7.2 スキーマ構造（案）

```yaml
schemaVersion: 1
id: product_master
title: 商品マスタ

csv:
  delimiter: ","
  header: true
  primaryKey: "product_id"
  normalize:
    sortKeys:
    - { column: "product_id", order: "asc" }
    quotePolicy: "minimal"
    newline: "lf"
    encoding: "utf-8"
    bom: false

columns:
  - key: product_id
    label: 商品ID
    type: string
    required: true
    unique: true
    pattern: "^[A-Z0-9_-]{3,32}$"
    ui: { widget: text, readonlyOnEdit: true }

  - key: name
    label: 商品名
    type: string
    required: true
    default: ""
    ui: { widget: text }

  - key: status
    label: 状態
    type: enum
    required: true
    default: "draft"
    enum:
      - { value: active, label: 公開 }
      - { value: draft, label: 下書き }
    ui: { widget: select }

  - key: price
    label: 価格
    type: integer
    required: true
    default: 0
    min: 0
    ui: { widget: number, step: 1 }

ui:
  list:
    viewMode: table           # 'table' | 'tile' | 'both'（デフォルト: table）
    columns:
      - { key: product_id, width: 160, pinned: true }
      - { key: name, width: 280 }
      - { key: status, width: 120 }
      - { key: price, width: 120, align: right }
    quickSearch:
      columns: [product_id, name]
    tile:                     # viewMode が 'tile' または 'both' の場合に使用
      columns: 3              # グリッド列数
      titleField: name        # タイトル表示フィールド
      subtitleField: status   # サブタイトル表示フィールド
      # imageField: thumbnail # 画像フィールド（任意）

  form:
    layout:
      type: sections
      sections:
        - title: 基本
          columns: 2
          fields: [product_id, name, status]
        - title: 価格
          columns: 2
          fields: [price]

validation:
  rowRules:
    - id: active_price_positive
      message: "公開中は価格が1以上である必要があります"
      expr: "status != 'active' || price >= 1"
```

### 7.3 型（MVP）

- JSONスキーマの基本形をサポート

| 型 | 説明 | CSVでの表現 |
|---|---|---|
| `string` | 文字列 | そのまま |
| `integer` | 整数 | 数字のみ（小数点不可） |
| `number` | 浮動小数点 | 数字（小数点可） |
| `boolean` | 真偽値 | `true`/`false`（大文字小文字区別しない） |
| `date` | 日付 | `YYYY-MM-DD`形式 |
| `datetime` | 日時 | `YYYY-MM-DDTHH:mm:ss`形式（ISO 8601） |
| `enum` | 列挙 | 定義されたvalueのいずれか |

### 7.4 式評価（expr）

* 行ルール `validation.rowRules[].expr` の評価には安全な式評価ライブラリを使用
* 使用可能な演算子：`==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`
* 使用可能な関数：`isEmpty()`, `isNotEmpty()`, `length()`, `startsWith()`, `endsWith()`
* 任意のJavaScript実行は**禁止**（eval等は使用しない）

---

## 8. 画面仕様

### 8.1 画面一覧・レイアウト

**レイアウト構成（3カラム）**:
```
┌──────────────────────────────────────────────────────────────────┐
│  Navbar                               [未保存] [Read-only] [保存] │
├────────┬────────────────────────────────┬────────────────────────┤
│Sidebar │     Main (Table/Tile)          │   Detail Panel         │
│(折畳)  │                                │   (Form/Schema)        │
└────────┴────────────────────────────────┴────────────────────────┘
```

| 画面 | パス | 説明 |
|------|-----|------|
| Home | `/` | Config設定プレビュー、Dataset一覧カード |
| Dataset編集 | `/datasets/:id` | 3カラム（サイドバー・データ一覧・詳細パネル） |

### 8.2 Home画面

* Config設定のプレビュー表示（YAMLシンタックスハイライト）
* Dataset一覧（カード形式）
  * 各Datasetの件数・エラー数表示
  * クリックでDataset編集画面へ遷移

### 8.3 Datasetリスト表示一覧（Main Content）

* 表示形式：**テーブル / タイル**（スキーマ `ui.list.viewMode` で選択）
* 検索：クイック検索（部分一致）
* フィルタ：列型に応じてUI生成（text/enum/number range/date）
* ソート：列ヘッダクリック（複合ソートはフェーズ2）
* 表示方式（MVP）：
  * 全行をメモリに保持（数千行まで対応）
  * 仮想スクロール（react-window等）で描画パフォーマンス確保
  * ページネーションはMVPでは非対応（フェーズ2で部分ロード対応）
* 行操作：

  * **追加**（挿入位置選択）：
    * 行/タイル選択時：「前に挿入」「後に挿入」
    * 未選択時：「先頭に追加」「末尾に追加」
  * 複製
  * 削除（物理削除。論理削除はスキーマで別途列を用意）
* エラー表示：

  * エラー行ハイライト
  * エラー件数バッジ

### 8.4 詳細パネル（Detail Panel）

| 状態 | 表示内容 |
|------|---------|
| 行/タイル選択時 | 編集フォーム（DynamicForm） |
| 未選択時 | スキーマ仕様表示（SchemaViewer） |

* スキーマ定義からフォーム自動生成
* 変更時の即時バリデーション（軽量）
* 保存時の全体バリデーション（完全）

### 8.5 Navbar・保存ボタン

* 保存ボタンは**ナビゲーションバー右側**に配置
* 表示要素：
  * 未保存バッジ（変更がある場合）
  * Read-onlyバッジ（読み取り専用時）
  * 「差分確認」ボタン
  * 「保存」ボタン（Primary）

### 8.6 サイドバー

* Dataset一覧を表示
* **折りたたみ可能**（アイコンのみ表示に切替）
* 各Datasetに件数・エラー数バッジ

### 8.8 保存フロー

* 保存単位：**CSV全体の一括保存**（行単位保存ではない）
* 保存トリガー：ユーザーの明示的な「保存」ボタン押下（ナビバー右側）
* 保存前に全体バリデーションを実行、エラーがあれば保存不可
* 競合検知：
  * 保存時に `expectedFileHash` をサーバに送信
  * ファイルが外部で変更されていた場合（hash不一致）：
    * 保存を拒否し、競合エラーを表示
    * ユーザーに「再読み込み」を促す（ローカル変更は失われる旨を警告）
* 未保存変更がある状態でブラウザを閉じる/リロードしようとした場合：確認ダイアログを表示

### 8.9 エラーハンドリング（UI）

* ネットワークエラー：トースト通知で警告、リトライボタン表示
* サーバエラー（500）：エラーダイアログ表示、詳細ログをコンソールに出力
* バリデーションエラー：該当フィールド/行をハイライト、エラーメッセージ表示

---

## 9. ローカルファイルI/O API仕様（Nodeサーバ）

### 9.1 方針

* ブラウザから直接ファイルパスを扱わない
* Nodeサーバが **Workspace root配下のみ**読み書き
* globs allow/denyで対象ファイルを制限

### 9.2 API（案）

* `GET /api/health`
* `GET /api/config`：読み込んだ設定返却（機密は除外）
* `GET /api/datasets`：dataset一覧
* `GET /api/datasets/:id/meta`：CSV + schemaのメタ情報（fileHash含む）
* `GET /api/datasets/:id/rows`：行データ（複数レコード配列。クエリパラメータで取得範囲を指定）
* `POST /api/datasets/:id/validate`：全体検証（結果返却）
* `POST /api/datasets/:id/save`：一括保存（正規化→書き込み）

  * リクエストに `expectedFileHash` を持たせ、競合（外部編集）を検知して防ぐ
  * リクエストボディに全行データを含める（差分ではなく全量置換）
* （任意）`POST /api/datasets/:id/diff`：保存前後の差分プレビュー（git or 内部diff）

### 9.3 レスポンス形式

* 全APIはJSON形式で応答
* 成功時：`{ "ok": true, "data": ... }`
* エラー時：`{ "ok": false, "error": { "code": "...", "message": "..." } }`
* HTTPステータスコード：
  * `200`：成功
  * `400`：リクエスト不正（バリデーションエラー含む）
  * `404`：リソース不存在
  * `409`：競合（expectedFileHash不一致）
  * `500`：サーバ内部エラー

---

## 10. CSV処理仕様（正規化が最重要）

### 10.1 読み込み

* CSV → 行配列（`{col: value}`）へ
* 型変換はUI側で行うのではなく、**core層で統一**（バリデーションも同じ型で）
* CSVパースエラー時の挙動：
  * ヘッダ行が不正（列名重複等）：エラー表示、編集不可
  * 行ごとの列数不一致：警告表示、不足列は空文字、余剰列は無視（または設定で選択）
  * 文字コードエラー：UTF-8として読み込み、不正バイトは置換文字（U+FFFD）に

### 10.2 保存時正規化（MVP必須）

* 列順：スキーマ順（不足列は空で埋める／余剰列の扱いは設定で選択）
* 改行：LF固定
* 末尾改行：必須
* 文字コード：UTF-8（BOM有無は設定）
* クォート：`minimal/always/none`
* ソート：指定があれば安定ソート（primaryKey推奨）
* これによりGit差分が「並び替え・改行・クォート」で荒れない

---

## 11. バリデーション仕様

### 11.1 制約種別

* フィールド制約：required/min/max/pattern/enum/unique
* 行ルール：`expr`（安全な式評価のみ。任意JSは不可）

### 11.2 検証タイミング

| 制約 | 即時検証（入力時） | 保存時検証 |
|---|---|---|
| required | ✅ | ✅ |
| min/max/pattern | ✅ | ✅ |
| enum | ✅ | ✅ |
| unique | ❌（重い） | ✅ |
| rowRules(expr) | ❌ | ✅ |

### 11.3 エラー形式（共通）

```json
{
  "rowIndex": 0,
  "columnKey": "price",
  "code": "MIN_VALUE",
  "message": "価格は0以上である必要があります"
}
```

* `rowIndex`：0始まりの行番号（ヘッダ除く）
* `columnKey`：対象列キー（行ルールエラーの場合はnull）
* `code`：エラーコード（REQUIRED, MIN_VALUE, MAX_VALUE, PATTERN, ENUM, UNIQUE, ROW_RULE）
* `message`：ユーザー向けメッセージ

---

## 12. Git差分支援（任意）

* **必須ではない**が、運用の体験が良いので推奨
* 提供機能（可能なら）：

  * 保存前に “正規化後の内容” を内部diff表示
  * Gitがある場合は `git diff -- <file>` 相当を表示（実装は任意）
* セキュリティ：Gitコマンド実行は workspace root に限定、引数固定（インジェクション禁止）

---

## 13. 配布（npmパッケージ）仕様

### 13.1 パッケージ構成（案）

* `bin`：CLIエントリ（Node）
* `dist/`：React SPAのビルド成果物を同梱（起動時ビルドしない）
* `server/`：APIサーバ実装（同梱）
* `core/`：スキーマ/CSV/検証/正規化ロジック

### 13.2 起動時の挙動

* CLIが `dist/` を静的配信
* APIは同一プロセスで起動（単体起動）
* ポートは空きポートを自動選択
* 既定ブラウザを開く（`--no-open`で抑止）

---

## 14. 受け入れ条件（MVP）

* `npx ...` 実行で、CWDの設定を読み込み、ブラウザでUIが開く
* 指定datasetのCSVが一覧で表示され、行追加/編集/削除できる
* バリデーションエラーはUIで特定でき、エラーがあると保存できない
* 保存すると、CSVが設定どおりに正規化され、Git差分が安定する
* workspace外へのファイルアクセスは拒否される
* 外部でCSVが変更された場合、保存時に競合エラーが発生し上書きを防止できる
* `--read-only` モードで起動した場合、保存ボタンが無効化される

---

## 15. 想定ディレクトリ例（利用側）

```
my-repo/
  csvcms.config.yaml
  data/
    products.csv
  schemas/
    product.schema.yaml
```

---

## 16. フェーズ2（拡張）候補

* 大容量CSV：WebWorkerパース、仮想スクロール、部分ロード
* 複数CSV間参照（外部マスタ参照、FK検証）
* 変更履歴ログ（監査ログをJSONLで出力）
* 一括編集（列の一括置換、インポート/マージ）
* プラグイン（カスタムフィールド、カスタムバリデータ）

