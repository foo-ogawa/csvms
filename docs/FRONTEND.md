# CSVMS フロントエンド仕様書

## 1. 技術スタック

### 1.1 コアライブラリ

| カテゴリ | ライブラリ | バージョン | 用途 |
|---------|-----------|-----------|------|
| フレームワーク | React | ^18.x | UI構築 |
| ビルドツール | Vite | ^5.x | 開発・ビルド |
| 言語 | TypeScript | ^5.x | 型安全性 |
| UIライブラリ | Ant Design | ^5.x | UIコンポーネント |
| フォーム | React Hook Form | ^7.x | フォーム状態管理 |
| バリデーション | Zod | ^3.x | スキーマバリデーション |
| Markdownエディタ | MDXEditor | ^3.x | text型フィールド用リッチエディタ |
| 仮想スクロール | @tanstack/react-virtual | ^3.x | 大量行の描画最適化 |
| HTTP通信 | ky | ^1.x | APIクライアント |
| ルーティング | React Router | ^6.x | SPA内ルーティング |
| 状態管理 | Zustand | ^4.x | グローバル状態（軽量） |
| アイコン | @ant-design/icons | ^5.x | アイコンセット |

### 1.2 開発用ライブラリ

| ライブラリ | 用途 |
|-----------|------|
| ESLint | コード品質 |
| Prettier | コードフォーマット |
| Vitest | ユニットテスト |
| @testing-library/react | コンポーネントテスト |

---

## 2. ディレクトリ構成

```
src/
├── main.tsx                    # エントリポイント
├── App.tsx                     # ルートコンポーネント
├── routes.tsx                  # ルーティング定義
├── api/                        # API通信層
│   ├── client.ts               # kyインスタンス設定
│   ├── datasets.ts             # Dataset API
│   └── types.ts                # API型定義
├── components/                 # 共通コンポーネント
│   ├── Layout/
│   │   ├── AppLayout.tsx       # 全体レイアウト（3カラム）
│   │   ├── Navbar.tsx          # ナビゲーションバー
│   │   ├── Sidebar.tsx         # サイドバー（Dataset一覧）
│   │   └── DetailPanel.tsx     # 右パネル（編集フォーム/スキーマ表示）
│   ├── DataList/
│   │   ├── DataList.tsx        # データ表示切替（テーブル/タイル）
│   │   ├── DataTable.tsx       # テーブル表示
│   │   ├── DataTileGrid.tsx    # タイル表示
│   │   ├── DataTile.tsx        # タイルアイテム
│   │   ├── QuickSearch.tsx     # クイック検索
│   │   ├── ColumnFilter.tsx    # 列フィルタ
│   │   └── InsertMenu.tsx      # 新規追加メニュー
│   ├── Form/
│   │   ├── DynamicForm.tsx     # スキーマからフォーム生成
│   │   ├── FormSection.tsx     # セクション
│   │   └── widgets/            # フィールドウィジェット
│   │       ├── TextField.tsx
│   │       ├── NumberField.tsx
│   │       ├── SelectField.tsx
│   │       ├── CheckboxField.tsx
│   │       ├── DateField.tsx
│   │       ├── DateTimeField.tsx
│   │       └── MarkdownField.tsx   # MDXEditor使用
│   ├── SchemaViewer/
│   │   └── SchemaViewer.tsx    # スキーマ仕様表示
│   ├── ErrorBoundary.tsx       # エラー境界
│   └── Toast/                  # 通知コンポーネント
├── features/                   # 機能別モジュール
│   ├── home/
│   │   ├── HomePage.tsx        # Home画面
│   │   ├── ConfigPreview.tsx   # 設定ファイルプレビュー
│   │   └── DatasetCard.tsx     # Datasetカード
│   └── dataset/
│       ├── DatasetPage.tsx     # Dataset編集画面（3カラム）
│       ├── EditPanel.tsx       # 編集パネル（右側）
│       ├── SaveConfirmModal.tsx # 保存確認モーダル
│       ├── DiffPreviewModal.tsx # 差分プレビュー
│       └── hooks/
│           ├── useDataset.ts   # Dataset操作Hook
│           ├── useRows.ts      # 行データ管理
│           └── useValidation.ts # バリデーション
├── hooks/                      # 共通Hooks
│   ├── useConfig.ts            # 設定取得
│   ├── useUnsavedWarning.ts    # 未保存警告
│   └── useDebounce.ts          # デバウンス
├── stores/                     # Zustand stores
│   ├── appStore.ts             # アプリ全体状態
│   └── datasetStore.ts         # Dataset編集状態
├── lib/                        # ユーティリティ
│   ├── schema/
│   │   ├── parser.ts           # スキーマパース
│   │   └── zodBuilder.ts       # スキーマ→Zod変換
│   └── utils/
│       ├── format.ts           # フォーマット関数
│       └── csv.ts              # CSV関連ユーティリティ
├── types/                      # 型定義
│   ├── schema.ts               # スキーマ型
│   ├── dataset.ts              # Dataset型
│   └── validation.ts           # バリデーション型
└── styles/
    ├── global.css              # グローバルスタイル
    └── theme.ts                # Ant Design テーマ設定
```

---

## 3. 画面仕様

### 3.1 全体レイアウト

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Navbar                                        [未保存] [Read-only] [保存]  │
├─────────┬───────────────────────────────────────────┬───────────────────────┤
│         │                                           │                       │
│ Sidebar │           Main Content                    │    Detail Panel       │
│ (折畳)  │     (DataList: Table / Tile)              │   (Edit Form /        │
│         │                                           │    Schema Viewer)     │
│ Dataset │  ┌─────────────────────────────────────┐ │                       │
│ List    │  │ [検索] [フィルタ] [+ 追加 ▼]        │ │  ┌─────────────────┐ │
│         │  ├─────────────────────────────────────┤ │  │                 │ │
│ ・商品  │  │                                     │ │  │  Edit Form      │ │
│ ・カテゴリ │                                     │ │  │  (選択時)       │ │
│ ・...   │  │      Table View / Tile View         │ │  │                 │ │
│         │  │                                     │ │  │  または         │ │
│         │  │                                     │ │  │                 │ │
│         │  │                                     │ │  │  Schema Viewer  │ │
│         │  │                                     │ │  │  (未選択時)     │ │
│         │  │                                     │ │  │                 │ │
│         │  └─────────────────────────────────────┘ │  └─────────────────┘ │
└─────────┴───────────────────────────────────────────┴───────────────────────┘
```

### 3.2 レイアウト構成

| 領域 | 幅 | 説明 |
|------|-----|------|
| Navbar | 100% | 上部固定。アプリ名、状態バッジ、保存ボタン |
| Sidebar | 200px（折りたたみ時: 60px） | Dataset一覧、折りたたみ可能 |
| Main Content | flex: 1 | データ一覧（テーブル/タイル切替） |
| Detail Panel | 400px | 編集フォーム または スキーマ仕様表示 |

### 3.3 ルーティング

| パス | コンポーネント | 説明 |
|------|---------------|------|
| `/` | `HomePage` | Config プレビュー、Dataset一覧表示 |
| `/datasets/:id` | `DatasetPage` | Dataset編集（3カラムレイアウト） |

---

## 4. コンポーネント詳細仕様

### 4.1 Navbar

**責務**: アプリ全体のナビゲーション、保存ボタン配置

```tsx
interface NavbarProps {
  appName: string;
  isDirty: boolean;
  isReadOnly: boolean;
  isSaving: boolean;
  onSave: () => void;
  onShowDiff: () => void;
}
```

**UI構成**:

```
┌────────────────────────────────────────────────────────────────────────┐
│  📊 CSVMS      [Home]                    [⚠ 未保存] [🔒 Read-only] [保存] │
└────────────────────────────────────────────────────────────────────────┘
```

**要素**:
- 左側: アプリロゴ/名前、Homeリンク
- 右側:
  - 未保存バッジ（黄色、isDirty時のみ表示）
  - Read-onlyバッジ（グレー、isReadOnly時のみ表示）
  - 「差分確認」ボタン（isDirty時のみ有効）
  - 「保存」ボタン（Primary、isReadOnly時はdisabled）

**実装**:
```tsx
<Layout.Header>
  <div className="navbar">
    <div className="navbar-left">
      <Logo />
      <Link to="/">Home</Link>
    </div>
    <div className="navbar-right">
      {isDirty && <Tag color="warning">未保存の変更があります</Tag>}
      {isReadOnly && <Tag color="default">読み取り専用</Tag>}
      <Button onClick={onShowDiff} disabled={!isDirty}>差分確認</Button>
      <Button type="primary" onClick={onSave} disabled={isReadOnly || !isDirty} loading={isSaving}>
        保存
      </Button>
    </div>
  </div>
</Layout.Header>
```

---

### 4.2 Sidebar

**責務**: Dataset一覧表示・選択（折りたたみ可能）

```tsx
interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  datasets: DatasetSummary[];
  currentId?: string;
  onSelect: (id: string) => void;
}

interface DatasetSummary {
  id: string;
  title: string;
  rowCount: number;
  errorCount: number;
}
```

**UI要素**:
- Ant Design `Layout.Sider` with `collapsible`
- 折りたたみ時: アイコンのみ表示
- 各Datasetに件数バッジ、エラー件数バッジ（赤）
- 選択中のDatasetはハイライト

**実装**:
```tsx
<Layout.Sider
  collapsible
  collapsed={collapsed}
  onCollapse={onCollapse}
  width={200}
  collapsedWidth={60}
>
  <Menu
    mode="inline"
    selectedKeys={currentId ? [currentId] : []}
    onClick={({ key }) => onSelect(key)}
  >
    {datasets.map(ds => (
      <Menu.Item key={ds.id} icon={<TableOutlined />}>
        <span>{ds.title}</span>
        <Badge count={ds.rowCount} size="small" />
        {ds.errorCount > 0 && <Badge count={ds.errorCount} color="red" size="small" />}
      </Menu.Item>
    ))}
  </Menu>
</Layout.Sider>
```

---

### 4.3 HomePage

**責務**: Config設定のプレビュー表示、Dataset一覧

```tsx
interface HomePageProps {}
```

**UI構成**:

```
┌─────────────────────────────────────────────────────────────┐
│  📊 CSVMS - Home                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Configuration                                       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Workspace: /path/to/workspace                       │   │
│  │  Allow Write: ✓ Yes                                  │   │
│  │  Datasets: 3                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Datasets                                            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │ 📄 商品マスタ │ │ 📄 カテゴリ  │ │ 📄 ユーザー  │    │   │
│  │  │  150 rows   │ │  25 rows    │ │  500 rows   │    │   │
│  │  │  0 errors   │ │  2 errors   │ │  0 errors   │    │   │
│  │  │  [開く →]   │ │  [開く →]   │ │  [開く →]   │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Config File (csvms.config.yaml)                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  version: 1                                          │   │
│  │  workspace:                                          │   │
│  │    root: "."                                         │   │
│  │    allowWrite: true                                  │   │
│  │  ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**セクション**:
1. **Configuration Summary**: 設定概要（Workspace, allowWrite, Dataset数）
2. **Datasets**: Datasetカード一覧（クリックで編集画面へ遷移）
3. **Config File Preview**: YAMLファイルのプレビュー（読み取り専用、シンタックスハイライト）

---

### 4.4 DataList

**責務**: データ一覧表示（テーブル/タイル切替）

```tsx
interface DataListProps {
  schema: Schema;
  rows: Row[];
  viewMode: 'table' | 'tile';  // スキーマ ui.list.viewMode で指定
  selectedRowIndex: number | null;
  errors: ValidationError[];
  onRowSelect: (index: number | null) => void;
  onInsert: (position: InsertPosition) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onSort: (columnKey: string, order: 'asc' | 'desc') => void;
  onFilter: (filters: Filter[]) => void;
  onQuickSearch: (query: string) => void;
}

type InsertPosition = 
  | { type: 'head' }
  | { type: 'last' }
  | { type: 'before'; index: number }
  | { type: 'after'; index: number };

interface Row {
  _rowIndex: number;        // 元のCSV行番号
  _isNew: boolean;          // 新規追加行
  _isDirty: boolean;        // 変更あり
  [columnKey: string]: unknown;
}
```

**ツールバー**:
```
┌───────────────────────────────────────────────────────────┐
│ [🔍 検索...        ] [フィルタ ▼] [+ 追加 ▼]  [🔲/☰]   │
└───────────────────────────────────────────────────────────┘
```

- クイック検索入力
- フィルタドロップダウン
- 追加ボタン（InsertMenu）
- 表示切替ボタン（テーブル/タイル）※スキーマで両方有効な場合のみ

---

### 4.5 InsertMenu（新規追加メニュー）

**責務**: 新規レコード追加位置の選択

```tsx
interface InsertMenuProps {
  selectedRowIndex: number | null;
  onInsert: (position: InsertPosition) => void;
  disabled?: boolean;
}
```

**メニュー内容**:

| 選択状態 | メニュー項目 |
|---------|-------------|
| **行/タイル選択時** | 「前に挿入」「後に挿入」 |
| **未選択時** | 「先頭に追加」「末尾に追加」 |

**実装**:
```tsx
const menuItems = selectedRowIndex !== null
  ? [
      { key: 'before', label: '前に挿入', icon: <ArrowUpOutlined /> },
      { key: 'after', label: '後に挿入', icon: <ArrowDownOutlined /> },
    ]
  : [
      { key: 'head', label: '先頭に追加', icon: <VerticalAlignTopOutlined /> },
      { key: 'last', label: '末尾に追加', icon: <VerticalAlignBottomOutlined /> },
    ];

<Dropdown menu={{ items: menuItems, onClick: handleInsert }}>
  <Button icon={<PlusOutlined />}>
    追加 <DownOutlined />
  </Button>
</Dropdown>
```

---

### 4.6 DataTable

**責務**: テーブル形式でのデータ表示

```tsx
interface DataTableProps {
  schema: Schema;
  rows: Row[];
  selectedRowIndex: number | null;
  errors: ValidationError[];
  onRowSelect: (index: number | null) => void;
  onRowContextMenu: (index: number, event: React.MouseEvent) => void;
  onSort: (columnKey: string, order: 'asc' | 'desc') => void;
}
```

**機能**:

| 機能 | 実装方法 |
|------|---------|
| 仮想スクロール | `@tanstack/react-virtual` |
| ソート | 列ヘッダークリック（単一列） |
| 行選択 | 行クリック → 右パネルに編集フォーム表示 |
| 選択解除 | 選択行を再度クリック または 背景クリック |
| 右クリック | コンテキストメニュー（複製、削除、挿入） |

**列幅**:
- スキーマ `ui.list.columns[].width` を使用
- 未指定の場合: デフォルト150px
- `pinned: true` の列は左固定

**行スタイル**:
- 選択行: 青背景（`ant-table-row-selected`）
- エラー行: 薄赤背景
- 変更行: 薄黄背景
- 新規行: 薄緑背景

---

### 4.7 DataTileGrid

**責務**: タイル形式でのデータ表示

```tsx
interface DataTileGridProps {
  schema: Schema;
  rows: Row[];
  selectedRowIndex: number | null;
  errors: ValidationError[];
  onRowSelect: (index: number | null) => void;
  onRowContextMenu: (index: number, event: React.MouseEvent) => void;
}
```

**タイル表示設定**（スキーマ `ui.list.tile`）:
```yaml
ui:
  list:
    viewMode: tile  # または 'table' または 'both'
    tile:
      columns: 3              # グリッド列数
      titleField: name        # タイトルに表示するフィールド
      subtitleField: status   # サブタイトルに表示するフィールド
      imageField: thumbnail   # 画像フィールド（任意）
```

**タイルカード**:
```
┌─────────────────┐
│  [画像]         │
│                 │
│  商品名         │
│  ステータス     │
│  ───────────── │
│  ID: PROD-001  │
└─────────────────┘
```

---

### 4.8 EditPanel（右パネル）

**責務**: 選択行の編集フォーム または スキーマ仕様表示

```tsx
interface EditPanelProps {
  schema: Schema;
  row: Row | null;
  isNew: boolean;
  errors: ValidationError[];
  onChange: (values: Partial<Row>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}
```

**表示内容**:

| 状態 | 表示内容 |
|------|---------|
| 行選択時 | DynamicForm（編集フォーム） |
| 未選択時 | SchemaViewer（スキーマ仕様表示） |

**EditPanel ヘッダー**（選択時）:
```
┌─────────────────────────────────────────────┐
│  編集: PROD-001            [複製] [削除]    │
├─────────────────────────────────────────────┤
│                                             │
│  (DynamicForm)                              │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 4.9 SchemaViewer

**責務**: スキーマ仕様のビジュアル表示（未選択時）

```tsx
interface SchemaViewerProps {
  schema: Schema;
}
```

**表示内容**:
```
┌─────────────────────────────────────────────┐
│  📋 スキーマ: 商品マスタ                     │
├─────────────────────────────────────────────┤
│                                             │
│  ■ 基本情報                                 │
│    Primary Key: product_id                  │
│    行数: 150                                │
│                                             │
│  ■ カラム定義                               │
│  ┌─────────────────────────────────────┐   │
│  │ product_id   string   必須 ユニーク │   │
│  │ name         string   必須          │   │
│  │ status       enum     必須          │   │
│  │ price        integer  必須 min:0    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ■ バリデーションルール                      │
│    • 公開中は価格が1以上である必要があります │
│                                             │
│  ■ 正規化設定                               │
│    ソート: product_id (asc)                 │
│    クォート: minimal                        │
│    改行: LF                                 │
│                                             │
└─────────────────────────────────────────────┘
```

**セクション**:
1. 基本情報（ID, Primary Key, 行数）
2. カラム定義テーブル
3. バリデーションルール一覧
4. 正規化設定

---

### 4.10 DynamicForm

**責務**: スキーマ定義からフォームを動的生成

```tsx
interface DynamicFormProps {
  schema: Schema;
  row: Row;
  isNew: boolean;
  errors: ValidationError[];
  onChange: (values: Partial<Row>) => void;
  readOnly?: boolean;
}
```

**React Hook Form統合**:

```tsx
// zodBuilder.ts でスキーマからZodスキーマを生成
const zodSchema = buildZodSchema(schema.columns);

// DynamicForm内部
const form = useForm({
  resolver: zodResolver(zodSchema),
  defaultValues: row,
  mode: 'onChange',  // 即時バリデーション
});
```

**レイアウト**:
- スキーマ `ui.form.layout` に従ってセクション分け
- `type: sections` の場合: Ant Design `Card` でセクション区切り
- `columns: 2` の場合: 2列グリッドレイアウト

---

### 4.11 フィールドウィジェット

#### TextField

```tsx
interface TextFieldProps {
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  pattern?: string;
  control: Control;
}
```

**実装**: Ant Design `Input`

#### NumberField

```tsx
interface NumberFieldProps {
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  control: Control;
}
```

**実装**: Ant Design `InputNumber`

#### SelectField (enum用)

```tsx
interface SelectFieldProps {
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  options: { value: string; label: string }[];
  control: Control;
}
```

**実装**: Ant Design `Select`

#### CheckboxField (boolean用)

```tsx
interface CheckboxFieldProps {
  name: string;
  label: string;
  readOnly?: boolean;
  control: Control;
}
```

**実装**: Ant Design `Checkbox`

#### DateField

```tsx
interface DateFieldProps {
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  control: Control;
}
```

**実装**: Ant Design `DatePicker`
**フォーマット**: `YYYY-MM-DD`

#### DateTimeField

```tsx
interface DateTimeFieldProps {
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  control: Control;
}
```

**実装**: Ant Design `DatePicker` with `showTime`
**フォーマット**: `YYYY-MM-DDTHH:mm:ss`

#### MarkdownField

```tsx
interface MarkdownFieldProps {
  name: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  control: Control;
}
```

**実装**: MDXEditor

```tsx
import { MDXEditor, headingsPlugin, listsPlugin, ... } from '@mdxeditor/editor';

const MarkdownField: React.FC<MarkdownFieldProps> = ({ name, label, control, readOnly }) => {
  const { field } = useController({ name, control });
  
  return (
    <Form.Item label={label}>
      <MDXEditor
        markdown={field.value || ''}
        onChange={field.onChange}
        readOnly={readOnly}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          tablePlugin(),
        ]}
      />
    </Form.Item>
  );
};
```

---

### 4.12 SaveConfirmModal

**責務**: 保存確認ダイアログ

```tsx
interface SaveConfirmModalProps {
  open: boolean;
  changeCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  onShowDiff: () => void;
}
```

**UI要素**:
- 変更件数表示
- 「差分を確認」リンク（DiffPreviewModal起動）
- 「保存」「キャンセル」ボタン

---

### 4.13 DiffPreviewModal

**責務**: 保存前の差分表示（任意機能）

```tsx
interface DiffPreviewModalProps {
  open: boolean;
  diff: string;  // unified diff形式
  onClose: () => void;
}
```

**実装**: シンプルなdiff表示（色分け: 追加=緑、削除=赤）

---

## 5. 状態管理

### 5.1 Zustand Store設計

#### appStore

```tsx
interface AppState {
  config: Config | null;
  isReadOnly: boolean;
  isLoading: boolean;
  error: Error | null;
  sidebarCollapsed: boolean;
  
  // Actions
  loadConfig: () => Promise<void>;
  setSidebarCollapsed: (collapsed: boolean) => void;
}
```

#### datasetStore

```tsx
interface DatasetState {
  currentDatasetId: string | null;
  meta: DatasetMeta | null;
  originalRows: Row[];          // サーバから取得した元データ
  rows: Row[];                  // 編集中データ
  selectedRowIndex: number | null;
  validationErrors: ValidationError[];
  isDirty: boolean;
  fileHash: string | null;
  isSaving: boolean;
  
  // Actions
  loadDataset: (id: string) => Promise<void>;
  updateRow: (index: number, values: Partial<Row>) => void;
  insertRow: (position: InsertPosition) => void;  // 挿入位置指定
  duplicateRow: (index: number) => void;
  deleteRow: (index: number) => void;
  selectRow: (index: number | null) => void;
  validate: () => Promise<ValidationError[]>;
  save: () => Promise<SaveResult>;
  reload: () => Promise<void>;
  resetChanges: () => void;
}

type InsertPosition = 
  | { type: 'head' }
  | { type: 'last' }
  | { type: 'before'; index: number }
  | { type: 'after'; index: number };
```

### 5.2 変更追跡

```tsx
// 変更検知ロジック
const isDirty = useMemo(() => {
  if (rows.length !== originalRows.length) return true;
  return rows.some((row, i) => {
    const original = originalRows[i];
    return schema.columns.some(col => row[col.key] !== original[col.key]);
  });
}, [rows, originalRows, schema]);
```

---

## 6. バリデーション

### 6.1 Zodスキーマ生成

```tsx
// lib/schema/zodBuilder.ts

import { z } from 'zod';
import type { Column } from '@/types/schema';

export function buildZodSchema(columns: Column[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const col of columns) {
    let fieldSchema = buildFieldSchema(col);
    
    if (!col.required) {
      fieldSchema = fieldSchema.optional();
    }
    
    shape[col.key] = fieldSchema;
  }
  
  return z.object(shape);
}

function buildFieldSchema(col: Column): z.ZodTypeAny {
  switch (col.type) {
    case 'string':
      let s = z.string();
      if (col.pattern) s = s.regex(new RegExp(col.pattern), `${col.label}の形式が不正です`);
      return s;
      
    case 'integer':
      let i = z.number().int();
      if (col.min !== undefined) i = i.min(col.min, `${col.label}は${col.min}以上である必要があります`);
      if (col.max !== undefined) i = i.max(col.max, `${col.label}は${col.max}以下である必要があります`);
      return i;
      
    case 'number':
      let n = z.number();
      if (col.min !== undefined) n = n.min(col.min);
      if (col.max !== undefined) n = n.max(col.max);
      return n;
      
    case 'boolean':
      return z.boolean();
      
    case 'date':
      return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください');
      
    case 'datetime':
      return z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, '日時はYYYY-MM-DDTHH:mm:ss形式で入力してください');
      
    case 'enum':
      const values = col.enum!.map(e => e.value);
      return z.enum(values as [string, ...string[]]);
      
    default:
      return z.unknown();
  }
}
```

### 6.2 バリデーションタイミング

| タイミング | 検証内容 | 実行場所 |
|-----------|---------|---------|
| 入力時（onChange） | required, min/max, pattern, enum | フロントエンド（Zod） |
| 行編集確定時 | 上記 + フィールド整合性 | フロントエンド |
| 保存前 | 上記 + unique, rowRules | サーバAPI |

---

## 7. API通信

### 7.1 APIクライアント設定

```tsx
// api/client.ts

import ky from 'ky';

export const api = ky.create({
  prefixUrl: '/api',
  timeout: 30000,
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          const body = await response.json();
          error.message = body.error?.message || error.message;
        }
        return error;
      },
    ],
  },
});
```

### 7.2 API関数

```tsx
// api/datasets.ts

import { api } from './client';
import type { Config, DatasetMeta, Row, ValidationError, SaveResult } from './types';

export const datasetsApi = {
  getConfig: () => 
    api.get('config').json<{ ok: true; data: Config }>(),
  
  getDatasets: () =>
    api.get('datasets').json<{ ok: true; data: DatasetSummary[] }>(),
  
  getMeta: (id: string) =>
    api.get(`datasets/${id}/meta`).json<{ ok: true; data: DatasetMeta }>(),
  
  getRows: (id: string) =>
    api.get(`datasets/${id}/rows`).json<{ ok: true; data: Row[] }>(),
  
  validate: (id: string, rows: Row[]) =>
    api.post(`datasets/${id}/validate`, { json: { rows } })
      .json<{ ok: true; data: { errors: ValidationError[] } }>(),
  
  save: (id: string, rows: Row[], expectedFileHash: string) =>
    api.post(`datasets/${id}/save`, { 
      json: { rows, expectedFileHash } 
    }).json<{ ok: true; data: SaveResult }>(),
  
  getDiff: (id: string, rows: Row[]) =>
    api.post(`datasets/${id}/diff`, { json: { rows } })
      .json<{ ok: true; data: { diff: string } }>(),
};
```

---

## 8. エラーハンドリング

### 8.1 エラー種別と対応

| エラー種別 | 検出方法 | UI対応 |
|-----------|---------|--------|
| ネットワークエラー | fetch失敗 | トースト警告 + リトライボタン |
| 400 Bad Request | バリデーションエラー | フォームにエラー表示 |
| 404 Not Found | Dataset不存在 | エラーページ表示 |
| 409 Conflict | fileHash不一致 | 競合モーダル表示 |
| 500 Server Error | サーバ内部エラー | エラーダイアログ |

### 8.2 競合解決フロー

```tsx
const handleConflict = () => {
  Modal.confirm({
    title: 'ファイルが変更されています',
    content: (
      <>
        <p>外部でファイルが編集されました。</p>
        <p>再読み込みすると、現在の変更は失われます。</p>
      </>
    ),
    okText: '再読み込み',
    cancelText: 'キャンセル',
    onOk: () => datasetStore.reload(),
  });
};
```

### 8.3 未保存警告

```tsx
// hooks/useUnsavedWarning.ts

import { useEffect } from 'react';
import { useDatasetStore } from '@/stores/datasetStore';

export function useUnsavedWarning() {
  const isDirty = useDatasetStore((s) => s.isDirty);
  
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
```

---

## 9. テーマ・スタイル

### 9.1 Ant Design テーマ設定

```tsx
// styles/theme.ts

import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#fff',
      headerHeight: 48,
    },
    Table: {
      headerBg: '#fafafa',
      rowHoverBg: '#f5f5f5',
    },
  },
};
```

### 9.2 カスタムスタイル

```css
/* styles/global.css */

/* エラー行ハイライト */
.row-has-error {
  background-color: #fff2f0 !important;
}

/* 変更行ハイライト */
.row-is-dirty {
  background-color: #fffbe6 !important;
}

/* 新規行ハイライト */
.row-is-new {
  background-color: #f6ffed !important;
}

/* MDXEditor カスタマイズ */
.mdxeditor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
}

.mdxeditor:focus-within {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}
```

---

## 10. ウィジェットマッピング

スキーマの `ui.widget` からコンポーネントへのマッピング:

| widget値 | 型 | コンポーネント |
|----------|---|---------------|
| `text` | string | `TextField` |
| `textarea` | string | `TextField` (multiline) |
| `markdown` | string | `MarkdownField` (MDXEditor) |
| `number` | integer/number | `NumberField` |
| `select` | enum | `SelectField` |
| `radio` | enum | `RadioField` |
| `checkbox` | boolean | `CheckboxField` |
| `switch` | boolean | `SwitchField` |
| `date` | date | `DateField` |
| `datetime` | datetime | `DateTimeField` |

---

## 11. パフォーマンス考慮

### 11.1 仮想スクロール

- `@tanstack/react-virtual` を使用
- 表示領域 + 上下オーバースキャン20行のみDOM生成
- 行高さ: 固定40px（可変高は複雑になるためMVPでは非対応）

### 11.2 レンダリング最適化

```tsx
// 行コンポーネントのメモ化
const TableRow = React.memo(({ row, columns, errors, ... }) => {
  // ...
}, (prev, next) => {
  return prev.row === next.row && prev.errors === next.errors;
});
```

### 11.3 デバウンス

- クイック検索: 300ms デバウンス
- フォーム入力のバリデーション: 150ms デバウンス

---

## 12. アクセシビリティ

- Ant Design の標準アクセシビリティサポートを活用
- テーブルに適切な `aria-label`
- キーボードナビゲーション:
  - `Tab`: フォーカス移動
  - `Enter`: 行選択・編集確定
  - `Escape`: ドロワー閉じる
  - `Ctrl+S` / `Cmd+S`: 保存（要検討）

---

## 13. ビルド設定

### 13.1 Vite設定

```ts
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../dist',  // CLIパッケージから配信
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',  // 開発時のAPIプロキシ
    },
  },
});
```

---

## 14. 受け入れ条件（フロントエンド）

### レイアウト
- [ ] 3カラムレイアウト（サイドバー | データ一覧 | 詳細パネル）が表示される
- [ ] サイドバーが折りたたみ可能
- [ ] 保存ボタンがナビゲーションバー右側に表示される

### Home画面
- [ ] Config設定のプレビューが表示される
- [ ] Dataset一覧がカード形式で表示される
- [ ] 各Datasetの件数・エラー数が表示される

### データ一覧
- [ ] Dataset選択でCSV行が一覧表示される（テーブル/タイル）
- [ ] スキーマ設定でテーブル/タイル表示を切り替えられる
- [ ] 仮想スクロールで1000行以上でもスムーズに動作
- [ ] クイック検索・フィルタ・ソートが動作

### 行の選択・編集
- [ ] 行/タイルクリックで右パネルに編集フォームが表示される
- [ ] 未選択時は右パネルにスキーマ仕様が表示される
- [ ] フォームはスキーマ定義に従って自動生成される
- [ ] 入力時にバリデーションエラーが表示される
- [ ] Markdown型フィールドでMDXEditorが使用できる

### 行の追加
- [ ] 行選択時: 「前に挿入」「後に挿入」が選択できる
- [ ] 未選択時: 「先頭に追加」「末尾に追加」が選択できる
- [ ] 行の複製・削除ができる

### 保存
- [ ] 保存ボタンで全体保存される
- [ ] 競合時にエラーダイアログが表示される
- [ ] 未保存状態でのページ離脱時に警告が出る
- [ ] Read-onlyモードで編集が無効化される

