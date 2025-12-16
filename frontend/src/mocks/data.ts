// モックデータ - サンプルAPIレスポンス

import type { Config, DatasetMeta, Row, DatasetSummary } from '@/types';

// ========================================
// Config レスポンス
// ========================================
export const mockConfig: Config = {
  version: 1,
  workspace: {
    root: '/workspace/data',
    allowWrite: true,
  },
  datasets: [
    { id: 'products', title: '商品マスタ', rowCount: 150, errorCount: 0 },
    { id: 'categories', title: 'カテゴリ', rowCount: 25, errorCount: 2 },
    { id: 'users', title: 'ユーザー', rowCount: 500, errorCount: 0 },
  ],
  configYaml: `version: 1
workspace:
  root: "."
  allowWrite: true

datasets:
  - id: products
    title: 商品マスタ
    csvPath: ./data/products.csv
    schema:
      columns:
        - key: product_id
          type: string
          label: 商品ID
          required: true
          unique: true
          primaryKey: true
        - key: name
          type: string
          label: 商品名
          required: true
        - key: category_id
          type: string
          label: カテゴリID
          required: true
        - key: price
          type: integer
          label: 価格
          required: true
          min: 0
        - key: status
          type: enum
          label: ステータス
          required: true
          enum:
            - value: draft
              label: 下書き
            - value: published
              label: 公開中
            - value: archived
              label: アーカイブ
        - key: description
          type: string
          label: 説明
          ui:
            widget: markdown

  - id: categories
    title: カテゴリ
    csvPath: ./data/categories.csv

  - id: users
    title: ユーザー
    csvPath: ./data/users.csv
`,
};

// ========================================
// Dataset: 商品マスタ
// ========================================
export const productsMeta: DatasetMeta = {
  id: 'products',
  fileHash: 'abc123def456',
  rowCount: 150,
  lastModified: '2024-12-15T10:30:00Z',
  schema: {
    id: 'products',
    title: '商品マスタ',
    description: '販売商品の管理用データセット',
    csvPath: './data/products.csv',
    columns: [
      {
        key: 'product_id',
        type: 'string',
        label: '商品ID',
        required: true,
        unique: true,
        primaryKey: true,
        pattern: '^PROD-\\d{4}$',
        ui: { placeholder: 'PROD-0001', helpText: 'PROD-XXXX形式で入力' },
      },
      {
        key: 'name',
        type: 'string',
        label: '商品名',
        required: true,
        ui: { placeholder: '商品名を入力' },
      },
      {
        key: 'category_id',
        type: 'string',
        label: 'カテゴリID',
        required: true,
        ui: { placeholder: 'CAT-XXX' },
      },
      {
        key: 'price',
        type: 'integer',
        label: '価格',
        required: true,
        min: 0,
        max: 9999999,
        ui: { widget: 'number' },
      },
      {
        key: 'stock',
        type: 'integer',
        label: '在庫数',
        required: false,
        min: 0,
        defaultValue: 0,
        ui: { widget: 'number' },
      },
      {
        key: 'status',
        type: 'enum',
        label: 'ステータス',
        required: true,
        enum: [
          { value: 'draft', label: '下書き' },
          { value: 'published', label: '公開中' },
          { value: 'archived', label: 'アーカイブ' },
        ],
        ui: { widget: 'select' },
      },
      {
        key: 'is_featured',
        type: 'boolean',
        label: 'おすすめ',
        required: false,
        defaultValue: false,
        ui: { widget: 'switch' },
      },
      {
        key: 'release_date',
        type: 'date',
        label: '発売日',
        required: false,
        ui: { widget: 'date' },
      },
      {
        key: 'description',
        type: 'string',
        label: '説明',
        required: false,
        ui: { widget: 'markdown', helpText: 'Markdown形式で記述できます' },
      },
    ],
    ui: {
      list: {
        viewMode: 'both',
        columns: [
          { key: 'product_id', width: 120, pinned: true },
          { key: 'name', width: 200 },
          { key: 'category_id', width: 100 },
          { key: 'price', width: 100 },
          { key: 'status', width: 100 },
          { key: 'stock', width: 80 },
        ],
        tile: {
          columns: 3,
          titleField: 'name',
          subtitleField: 'status',
        },
      },
      form: {
        layout: {
          type: 'sections',
          columns: 2,
          sections: [
            { title: '基本情報', fields: ['product_id', 'name', 'category_id', 'status'] },
            { title: '販売情報', fields: ['price', 'stock', 'is_featured', 'release_date'] },
            { title: '詳細', fields: ['description'] },
          ],
        },
      },
    },
    normalize: {
      sort: [{ column: 'product_id', order: 'asc' }],
      quote: 'minimal',
      newline: 'LF',
    },
    validation: {
      rowRules: [
        {
          expression: 'status === "published" ? price > 0 : true',
          message: '公開中の商品は価格が1以上である必要があります',
        },
      ],
    },
  },
};

// 商品データ（150行のサンプル）
function generateProductRows(): Row[] {
  const statuses = ['draft', 'published', 'archived'];
  const categoryIds = ['CAT-001', 'CAT-002', 'CAT-003', 'CAT-004', 'CAT-005'];
  const names = [
    'プレミアムヘッドフォン', 'ワイヤレスマウス', 'メカニカルキーボード',
    'USBハブ 7ポート', '4Kモニター 27インチ', 'ノートPCスタンド',
    'ウェブカメラ HD', 'デスクライト LED', 'マウスパッド XL',
    'イヤホン Bluetooth', 'スピーカー ポータブル', 'USB-Cケーブル 2m',
    'SDカードリーダー', 'ポータブルSSD 1TB', 'ドッキングステーション',
  ];
  
  const rows: Row[] = [];
  for (let i = 1; i <= 150; i++) {
    const id = String(i).padStart(4, '0');
    rows.push({
      _rowIndex: i,
      _isNew: false,
      _isDirty: false,
      product_id: `PROD-${id}`,
      name: names[(i - 1) % names.length] + (i > 15 ? ` v${Math.floor(i / 15)}` : ''),
      category_id: categoryIds[(i - 1) % categoryIds.length],
      price: Math.floor(Math.random() * 50000) + 1000,
      stock: Math.floor(Math.random() * 200),
      status: statuses[(i - 1) % statuses.length],
      is_featured: i % 7 === 0,
      release_date: `2024-${String(((i - 1) % 12) + 1).padStart(2, '0')}-${String(((i - 1) % 28) + 1).padStart(2, '0')}`,
      description: i % 5 === 0 ? `## ${names[(i - 1) % names.length]}\n\n高品質な製品です。\n\n### 特徴\n- 高耐久性\n- 洗練されたデザイン` : '',
    });
  }
  return rows;
}

export const productsRows: Row[] = generateProductRows();

// ========================================
// Dataset: カテゴリ
// ========================================
export const categoriesMeta: DatasetMeta = {
  id: 'categories',
  fileHash: 'cat789xyz',
  rowCount: 25,
  lastModified: '2024-12-14T08:00:00Z',
  schema: {
    id: 'categories',
    title: 'カテゴリ',
    description: '商品カテゴリの管理',
    csvPath: './data/categories.csv',
    columns: [
      {
        key: 'category_id',
        type: 'string',
        label: 'カテゴリID',
        required: true,
        unique: true,
        primaryKey: true,
        pattern: '^CAT-\\d{3}$',
      },
      {
        key: 'name',
        type: 'string',
        label: 'カテゴリ名',
        required: true,
      },
      {
        key: 'parent_id',
        type: 'string',
        label: '親カテゴリID',
        required: false,
      },
      {
        key: 'sort_order',
        type: 'integer',
        label: '表示順',
        required: true,
        min: 0,
      },
      {
        key: 'is_active',
        type: 'boolean',
        label: '有効',
        required: true,
        defaultValue: true,
      },
    ],
    ui: {
      list: {
        viewMode: 'table',
        columns: [
          { key: 'category_id', width: 120 },
          { key: 'name', width: 200 },
          { key: 'parent_id', width: 120 },
          { key: 'sort_order', width: 80 },
          { key: 'is_active', width: 80 },
        ],
      },
      form: {
        layout: { type: 'flat', columns: 1 },
      },
    },
    normalize: {
      sort: [{ column: 'sort_order', order: 'asc' }],
      quote: 'minimal',
      newline: 'LF',
    },
  },
};

export const categoriesRows: Row[] = [
  { _rowIndex: 1, _isNew: false, _isDirty: false, category_id: 'CAT-001', name: 'オーディオ', parent_id: '', sort_order: 1, is_active: true },
  { _rowIndex: 2, _isNew: false, _isDirty: false, category_id: 'CAT-002', name: '入力デバイス', parent_id: '', sort_order: 2, is_active: true },
  { _rowIndex: 3, _isNew: false, _isDirty: false, category_id: 'CAT-003', name: 'ディスプレイ', parent_id: '', sort_order: 3, is_active: true },
  { _rowIndex: 4, _isNew: false, _isDirty: false, category_id: 'CAT-004', name: 'アクセサリ', parent_id: '', sort_order: 4, is_active: true },
  { _rowIndex: 5, _isNew: false, _isDirty: false, category_id: 'CAT-005', name: 'ストレージ', parent_id: '', sort_order: 5, is_active: true },
  { _rowIndex: 6, _isNew: false, _isDirty: false, category_id: 'CAT-011', name: 'ヘッドフォン', parent_id: 'CAT-001', sort_order: 11, is_active: true },
  { _rowIndex: 7, _isNew: false, _isDirty: false, category_id: 'CAT-012', name: 'イヤホン', parent_id: 'CAT-001', sort_order: 12, is_active: true },
  { _rowIndex: 8, _isNew: false, _isDirty: false, category_id: 'CAT-013', name: 'スピーカー', parent_id: 'CAT-001', sort_order: 13, is_active: true },
  { _rowIndex: 9, _isNew: false, _isDirty: false, category_id: 'CAT-021', name: 'キーボード', parent_id: 'CAT-002', sort_order: 21, is_active: true },
  { _rowIndex: 10, _isNew: false, _isDirty: false, category_id: 'CAT-022', name: 'マウス', parent_id: 'CAT-002', sort_order: 22, is_active: true },
  { _rowIndex: 11, _isNew: false, _isDirty: false, category_id: 'CAT-023', name: 'ウェブカメラ', parent_id: 'CAT-002', sort_order: 23, is_active: false },
  { _rowIndex: 12, _isNew: false, _isDirty: false, category_id: 'CAT-031', name: 'モニター', parent_id: 'CAT-003', sort_order: 31, is_active: true },
  { _rowIndex: 13, _isNew: false, _isDirty: false, category_id: 'CAT-032', name: 'モニターアーム', parent_id: 'CAT-003', sort_order: 32, is_active: true },
  { _rowIndex: 14, _isNew: false, _isDirty: false, category_id: 'CAT-041', name: 'ケーブル', parent_id: 'CAT-004', sort_order: 41, is_active: true },
  { _rowIndex: 15, _isNew: false, _isDirty: false, category_id: 'CAT-042', name: 'ハブ・ドック', parent_id: 'CAT-004', sort_order: 42, is_active: true },
  { _rowIndex: 16, _isNew: false, _isDirty: false, category_id: 'CAT-043', name: 'スタンド', parent_id: 'CAT-004', sort_order: 43, is_active: true },
  { _rowIndex: 17, _isNew: false, _isDirty: false, category_id: 'CAT-044', name: 'デスクアクセサリ', parent_id: 'CAT-004', sort_order: 44, is_active: true },
  { _rowIndex: 18, _isNew: false, _isDirty: false, category_id: 'CAT-051', name: 'SSD', parent_id: 'CAT-005', sort_order: 51, is_active: true },
  { _rowIndex: 19, _isNew: false, _isDirty: false, category_id: 'CAT-052', name: 'SDカード', parent_id: 'CAT-005', sort_order: 52, is_active: true },
  { _rowIndex: 20, _isNew: false, _isDirty: false, category_id: 'CAT-053', name: 'USBメモリ', parent_id: 'CAT-005', sort_order: 53, is_active: true },
  { _rowIndex: 21, _isNew: false, _isDirty: false, category_id: 'CAT-100', name: '廃盤', parent_id: '', sort_order: 100, is_active: false },
  { _rowIndex: 22, _isNew: false, _isDirty: true, category_id: 'CAT-101', name: 'レガシー製品', parent_id: 'CAT-100', sort_order: 101, is_active: false },
  { _rowIndex: 23, _isNew: false, _isDirty: false, category_id: 'CAT-006', name: 'ゲーミング', parent_id: '', sort_order: 6, is_active: true },
  { _rowIndex: 24, _isNew: false, _isDirty: false, category_id: 'CAT-061', name: 'ゲーミングマウス', parent_id: 'CAT-006', sort_order: 61, is_active: true },
  { _rowIndex: 25, _isNew: false, _isDirty: false, category_id: 'CAT-062', name: 'ゲーミングキーボード', parent_id: 'CAT-006', sort_order: 62, is_active: true },
];

// ========================================
// Dataset: ユーザー
// ========================================
export const usersMeta: DatasetMeta = {
  id: 'users',
  fileHash: 'user456abc',
  rowCount: 500,
  lastModified: '2024-12-15T14:00:00Z',
  schema: {
    id: 'users',
    title: 'ユーザー',
    description: 'ユーザー情報の管理',
    csvPath: './data/users.csv',
    columns: [
      {
        key: 'user_id',
        type: 'string',
        label: 'ユーザーID',
        required: true,
        unique: true,
        primaryKey: true,
      },
      {
        key: 'email',
        type: 'string',
        label: 'メールアドレス',
        required: true,
        unique: true,
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      },
      {
        key: 'name',
        type: 'string',
        label: '氏名',
        required: true,
      },
      {
        key: 'role',
        type: 'enum',
        label: 'ロール',
        required: true,
        enum: [
          { value: 'admin', label: '管理者' },
          { value: 'editor', label: '編集者' },
          { value: 'viewer', label: '閲覧者' },
        ],
      },
      {
        key: 'is_active',
        type: 'boolean',
        label: '有効',
        required: true,
        defaultValue: true,
      },
      {
        key: 'created_at',
        type: 'datetime',
        label: '作成日時',
        required: true,
      },
      {
        key: 'last_login',
        type: 'datetime',
        label: '最終ログイン',
        required: false,
      },
    ],
    ui: {
      list: {
        viewMode: 'table',
        columns: [
          { key: 'user_id', width: 100 },
          { key: 'email', width: 200 },
          { key: 'name', width: 150 },
          { key: 'role', width: 100 },
          { key: 'is_active', width: 80 },
          { key: 'created_at', width: 160 },
        ],
      },
      form: {
        layout: {
          type: 'sections',
          columns: 2,
          sections: [
            { title: 'アカウント情報', fields: ['user_id', 'email', 'name'] },
            { title: '権限・状態', fields: ['role', 'is_active'] },
            { title: 'アクティビティ', fields: ['created_at', 'last_login'] },
          ],
        },
      },
    },
    normalize: {
      sort: [{ column: 'user_id', order: 'asc' }],
      quote: 'minimal',
      newline: 'LF',
    },
  },
};

// ユーザーデータ（500行のサンプル）
function generateUserRows(): Row[] {
  const firstNames = ['田中', '佐藤', '鈴木', '高橋', '伊藤', '渡辺', '山本', '中村', '小林', '加藤'];
  const lastNames = ['太郎', '花子', '次郎', '美咲', '健', '愛', '翔', '結衣', '大輔', '綾'];
  const roles = ['admin', 'editor', 'viewer'];
  const domains = ['example.com', 'test.co.jp', 'sample.org'];
  
  const rows: Row[] = [];
  for (let i = 1; i <= 500; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[Math.floor((i - 1) / firstNames.length) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const emailName = `${firstName.toLowerCase()}${i}`;
    const domain = domains[(i - 1) % domains.length];
    
    rows.push({
      _rowIndex: i,
      _isNew: false,
      _isDirty: false,
      user_id: `U${String(i).padStart(5, '0')}`,
      email: `${emailName}@${domain}`,
      name: name,
      role: roles[(i - 1) % roles.length],
      is_active: i % 10 !== 0,
      created_at: `2024-${String(((i - 1) % 12) + 1).padStart(2, '0')}-${String(((i - 1) % 28) + 1).padStart(2, '0')}T${String((i % 24)).padStart(2, '0')}:00:00`,
      last_login: i % 5 !== 0 ? `2024-12-${String(((i - 1) % 15) + 1).padStart(2, '0')}T${String((i % 24)).padStart(2, '0')}:30:00` : '',
    });
  }
  return rows;
}

export const usersRows: Row[] = generateUserRows();

// ========================================
// データセット取得ヘルパー
// ========================================
export function getDatasetMeta(id: string): DatasetMeta | undefined {
  const metaMap: Record<string, DatasetMeta> = {
    products: productsMeta,
    categories: categoriesMeta,
    users: usersMeta,
  };
  return metaMap[id];
}

export function getDatasetRows(id: string): Row[] {
  const rowsMap: Record<string, Row[]> = {
    products: productsRows,
    categories: categoriesRows,
    users: usersRows,
  };
  return rowsMap[id] || [];
}

export function getDatasetSummaries(): DatasetSummary[] {
  return mockConfig.datasets;
}

