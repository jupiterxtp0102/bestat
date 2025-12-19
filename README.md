# Bestat 3Dモデル処理システム

3Dモデル（GLB形式）をアップロード、処理、管理するためのフルスタックWebアプリケーション。STL変換とプレビュー画像生成のための自動バックグラウンド処理を含みます。

## アーキテクチャ

- **フロントエンド**: React + TypeScript + Vite
- **バックエンドAPI**: Node.js + Express + TypeScript
- **データベース**: PostgreSQL (Docker)
- **バックグラウンドジョブ**: Node.jsワーカープロセス

## 機能

### 必須機能 ✅

1. **Webアプリケーション**
   - アップロードされた3Dモデルのリストをメタデータと共に表示
   - モデルを選択して詳細情報と処理状況を表示
   - GLBファイルをサーバーにアップロード
   - リアルタイムステータス更新（3秒ごとにポーリング）

2. **バックエンドAPI**
   - `GET /api/models` - 全モデルを取得
   - `GET /api/models/:id` - ジョブ情報を含むモデル詳細を取得
   - `POST /api/models/upload` - 新しい3Dモデルをアップロード
   - モデルメタデータ: id、name、fileUri、status、タイムスタンプを含む

3. **バックグラウンド処理**
   - モデルアップロード時の自動STL変換
   - 自動プレビュー画像生成
   - ジョブステータス追跡（pending → processing → completed/failed）
   - Webアプリにステータス更新を反映

### 任意機能 ✅

1. **ジョブ再実行** - `POST /api/models/:id/reprocess` エンドポイントで全ジョブを再実行
2. **プレビュー生成** - バックグラウンドジョブでプレビュー画像を作成
3. **テスト** - バックエンドとフロントエンドの両方にテストスイート実装

## 前提条件

- Node.js 18+ 
- Docker & Docker Compose
- npm または yarn

## セットアップ手順

### 1. データベースの起動

```bash
# ルートディレクトリから実行
docker-compose up -d
```

これによりPostgreSQLがポート5432で起動します。

### 2. バックエンドのセットアップ

```bash
cd backend
npm install

# データベースマイグレーションを実行
npm run migrate

# APIサーバーを起動（開発モード）
npm run dev
```

バックエンドAPIは `http://localhost:3000` で利用可能になります。

### 3. バックグラウンドワーカーの起動

新しいターミナルで：

```bash
cd backend
npm run worker
```

### 4. フロントエンドのセットアップ

新しいターミナルで：

```bash
cd frontend
npm install

# 開発サーバーを起動
npm run dev
```

フロントエンドは `http://localhost:5173` で利用可能になります。

## テスト

### バックエンドテスト

```bash
cd backend
npm test
```

### フロントエンドテスト

```bash
cd frontend
npm test
```

### CI/CDパイプライン

プルリクエスト作成時やmain/developブランチへのプッシュ時に自動的にテストが実行されます。

**実行内容:**
- バックエンドのテストとビルド
- フロントエンドのテストとビルド
- PostgreSQLを使用したデータベーステスト

## APIエンドポイント

| メソッド | エンドポイント | 説明 |
|--------|----------|-------------|
| GET | `/api/models` | 全モデルを取得 |
| GET | `/api/models/:id` | IDでモデルとジョブを取得 |
| POST | `/api/models/upload` | 新しいGLBファイルをアップロード |
| POST | `/api/models/:id/reprocess` | 処理ジョブを再実行 |
| GET | `/health` | ヘルスチェック |

## データベーススキーマ

### modelsテーブル
```sql
id                UUID PRIMARY KEY
name              VARCHAR(255)
file_uri          VARCHAR(500)      -- GLBファイルパス
stl_file_uri      VARCHAR(500)      -- STLファイルパス
preview_image_uri VARCHAR(500)      -- プレビュー画像パス
status            VARCHAR(50)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### jobsテーブル
```sql
id              UUID PRIMARY KEY
model_id        UUID (FK to models)
job_type        VARCHAR(50)
status          VARCHAR(50)
error_message   TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## プロジェクト構成

```
bestat/
├── docker-compose.yml          # PostgreSQLコンテナ
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express APIサーバー
│   │   ├── worker.ts          # バックグラウンドジョブプロセッサ
│   │   ├── models.ts          # データベース操作
│   │   ├── jobProcessor.ts    # ジョブ処理ロジック
│   │   ├── converter.ts       # GLB→STL変換 & プレビュー生成
│   │   ├── db.ts              # PostgreSQL接続
│   │   ├── migrate.ts         # データベースマイグレーション
│   │   ├── types.ts           # TypeScript型定義
│   │   └── index.test.ts      # APIテスト
│   ├── uploads/
│   │   ├── glb/              # GLBファイル保存ディレクトリ
│   │   ├── stl/              # STLファイル保存ディレクトリ
│   │   └── png/              # プレビュー画像保存ディレクトリ
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── App.tsx            # メインReactコンポーネント
    │   ├── App.css            # スタイル
    │   ├── App.test.tsx       # コンポーネントテスト
    │   └── main.tsx           # エントリーポイント
    ├── package.json
    └── vite.config.ts
```

## 環境変数

### Backend (.env)

⚠️ **重要:** `.env`ファイルは絶対にGitにコミットしないでください。

**セットアップ方法:**
```bash
# .env.exampleをコピー
cd backend
cp .env.example .env

# 必要に応じて値を編集
# DATABASE_URLのパスワードなどを変更
```

## 開発

### データベース管理

```bash
# データベースログを表示
docker-compose logs postgres

# データベースに接続
docker exec -it bestat-postgres psql -U bestat -d bestat

# データベースを停止
docker-compose down

# データベースをリセット（警告：全データが削除されます）
docker-compose down -v
docker-compose up -d
cd backend && npm run migrate
```

### 本番環境用ビルド

```bash
# バックエンド
cd backend
npm run build
npm start

# フロントエンド
cd frontend
npm run build
# dist/フォルダを静的サーバーで配信
```
