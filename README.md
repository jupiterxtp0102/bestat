# Bestat 3Dモデル処理システム

3Dモデル（GLB形式）をアップロード、処理、管理するためのフルスタックWebアプリケーション。STL変換とプレビュー画像生成のための自動バックグラウンド処理を含みます。

## 📋 提出物について

- **GitHubリポジトリ**: https://github.com/jupiterxtp0102/bestat
- **作成日**: 2025年12月19日
- **開発環境**: Node.js 18+, Docker, PostgreSQL

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

## ⏱️ 作業時間

| 作業項目 | 所要時間 | 詳細 |
|---------|---------|------|
| **1. プロジェクト設計・セットアップ** | 0.5時間 | - プロジェクト構成の設計<br>- Docker環境のセットアップ<br>- TypeScript設定 |
| **2. バックエンドAPI開発** | 1.5時間 | - Express APIサーバー構築<br>- PostgreSQLスキーマ設計・マイグレーション<br>- ファイルアップロード実装<br>- エンドポイント実装（CRUD操作） |
| **3. バックグラウンドワーカー** | 1.5時間 | - ジョブプロセッサ実装<br>- GLB→STL変換ロジック<br>- プレビュー画像生成<br>- ジョブ再実行機能 |
| **4. フロントエンド開発** | 1.5時間 | - React + TypeScript + Vite環境構築<br>- UIコンポーネント実装<br>- APIインテグレーション<br>- リアルタイムポーリング実装<br>- レスポンシブデザイン |
| **5. テスト実装** | 0.5時間 | - バックエンドテスト（Jest）<br>- フロントエンドテスト（Vitest）<br>- テストカバレッジ確認 |
| **6. CI/CDパイプライン** | 0.3時間 | - GitHub Actionsワークフロー作成<br>- 自動テスト設定<br>- ビルド検証 |
| **7. ドキュメント作成** | 0.3時間 | - README作成（日本語）<br>- セキュリティドキュメント<br>- CI/CDドキュメント<br>- コードコメント |
| **8. デバッグ・最適化** | 0.5時間 | - エラーハンドリング改善<br>- パフォーマンス最適化<br>- CI/CDエラー修正 |
| **合計** | **約6.6時間** | |

## 📝 注意事項

### セキュリティ

- **`.env`ファイルは絶対にGitにコミットしないでください**
- `.env.example`をテンプレートとして使用してください
- 本番環境では強力なパスワードを設定してください
- `DATABASE_URL`に含まれる認証情報を安全に管理してください

### ファイルストレージ

- アップロードされたファイルは`backend/uploads/`配下に保存されます
  - `glb/` - 元のGLBファイル
  - `stl/` - 変換されたSTLファイル
  - `png/` - 生成されたプレビュー画像
- 本番環境ではS3などのオブジェクトストレージの使用を推奨

### GLB→STL変換について

現在の実装はプレースホルダーです。実際の変換には以下のいずれかを推奨：
- **Blender CLI** - `bpy`モジュールを使用した変換スクリプト
- **gltf-transform** - JavaScriptベースのGLTF処理ライブラリ
- **Three.js** - クライアントサイドでの変換

### プレビュー画像生成について

現在の実装はプレースホルダーです。実際の生成には以下を推奨：
- **Three.js + Canvas** - サーバーサイドレンダリング（`canvas`パッケージ使用）
- **Puppeteer** - ヘッドレスブラウザでのレンダリング
- **Blender CLI** - コマンドラインでのレンダリング

### CI/CD

- GitHub Actionsは`main`と`develop`ブランチへのプッシュ、およびプルリクエストで自動実行されます
- テストが失敗するとマージがブロックされます
- ワークフローログは GitHub Actionsタブで確認できます

### 開発ツール

- **VSCode拡張機能推奨**:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Docker

### トラブルシューティング

**データベース接続エラー**
```bash
# Dockerコンテナの状態を確認
docker-compose ps

# PostgreSQLログを確認
docker-compose logs postgres

# コンテナを再起動
docker-compose restart
```

**ポート競合エラー**
- バックエンド（3000）、フロントエンド（5173）、PostgreSQL（5432）が使用中でないか確認
- `.env`ファイルでポート番号を変更可能

**アップロードエラー**
```bash
# アップロードディレクトリのパーミッションを確認
ls -la backend/uploads/
chmod -R 755 backend/uploads/
```

## 🚀 今後の改善案

1. **認証・認可** - JWTベースのユーザー認証
2. **リアルWebSocket** - ポーリングをWebSocketに置き換え
3. **ファイル検証強化** - GLBファイルの詳細バリデーション
4. **実際の変換実装** - Blender/Three.jsを使った実変換
5. **ストレージ最適化** - S3互換ストレージへの移行
6. **キューシステム** - RabbitMQやBullMQの導入
7. **監視・ロギング** - Prometheus + Grafanaでのモニタリング
8. **API ドキュメント** - OpenAPI/Swaggerの追加

## 📞 サポート

問題が発生した場合は、以下を確認してください：
1. Node.js 18以上がインストールされているか
2. Dockerが起動しているか
3. `.env`ファイルが正しく設定されているか
4. 必要なポートが空いているか

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
