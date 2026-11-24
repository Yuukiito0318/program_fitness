# program fitness

筋トレプログラムの作成・販売・購入・トレーニング記録 Web アプリ（開発中）。
要件は [program_fitness_ユーザー運営機能仕様書.pdf](program_fitness_ユーザー運営機能仕様書.pdf) を参照。

> 現在は **開発環境の最小構成のみ**。ログイン・販売・決済・レビューなどのアプリ機能は未実装です。

## 構成

```
program_fitness/
├── frontend/            # React + Vite + TypeScript（スマホ/PC 両対応の SPA）
├── backend/             # Ruby on Rails 8（API モード、JSON のみ返す）
├── docker-compose.yml   # ローカル開発用 PostgreSQL 17
├── .env.example         # Docker の DB 設定サンプル
└── README.md
```

| 領域 | 採用 | バージョン |
|---|---|---|
| フロントエンド | React + Vite + TypeScript | React 19 / Vite 8 / TS 7 |
| バックエンド | Ruby on Rails（API モード） | Ruby 3.4 / Rails 8.1 |
| DB（ローカル） | PostgreSQL（Docker） | 17 |
| DB（将来） | Supabase の PostgreSQL | `DATABASE_URL` で切替 |

開発時は Vite（:5173）が `/api/*` を Rails（:3000）へ転送するため、ブラウザから見ると同一オリジンになり CORS 設定は不要です。

## 必要なツール（Windows）

| ツール | 確認コマンド | 入手方法 |
|---|---|---|
| Node.js 22 以上 | `node -v` | https://nodejs.org/ |
| Ruby 3.4（DevKit 付き） | `ruby -v` | `winget install RubyInstallerTeam.RubyWithDevKit.3.4` |
| Docker Desktop | `docker --version` | https://www.docker.com/products/docker-desktop/ |

Ruby をインストールした直後は、PowerShell を開き直して PATH を反映してください。

## 初回セットアップ

PowerShell でプロジェクト直下（`C:\program_fitness`）から実行します。

```powershell
# 1. 環境変数ファイルを作成（サンプルをコピー。値はローカル専用のダミー）
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env

# 2. Docker Desktop を起動してから DB コンテナを起動
docker compose up -d

# 3. バックエンドの依存関係と DB を準備
cd backend
bundle install
ruby bin/rails db:prepare
cd ..

# 4. フロントエンドの依存関係をインストール
cd frontend
npm install
cd ..
```

`.env` と `backend\.env` の DB ユーザー名・パスワード・ポートは一致させてください。
パスワードを変える場合は、DB を初めて起動する前に変更します（起動後に変えるなら `docker compose down -v` でデータごと作り直し）。

## 開発サーバーの起動

ターミナルを 2 つ開きます。

```powershell
# ターミナル 1：バックエンド（http://localhost:3000）
cd backend
ruby bin/rails server
```

```powershell
# ターミナル 2：フロントエンド（http://localhost:5173）
cd frontend
npm run dev
```

ブラウザで http://localhost:5173 を開き、「バックエンド」「データベース」が **OK** なら接続できています。

- スマホ実機で確認する場合：`npm run dev -- --host` で起動し、同じ Wi-Fi のスマホから表示された `Network:` の URL を開く
- API を直接確認：http://localhost:3000/api/health

### 停止

- 各ターミナルで `Ctrl + C`
- DB コンテナ：`docker compose stop`（データは残る） / `docker compose down -v`（データも削除）

## 環境変数

秘密情報はソースコードに書かず、`.env` ファイル（Git 管理外）で設定します。

| ファイル | 用途 | 主な変数 |
|---|---|---|
| `.env` | Docker の PostgreSQL | `POSTGRES_USER` `POSTGRES_PASSWORD` `POSTGRES_DB` `POSTGRES_PORT` |
| `backend/.env` | Rails の DB 接続 | `DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_NAME` `DATABASE_URL` |
| `frontend/.env.local`（任意） | Vite | `BACKEND_URL`（プロキシ先） `VITE_API_BASE_URL` |

`VITE_` で始まる変数はブラウザに配信されるため、API キーやパスワードを入れないでください。

## Supabase へ切り替えるとき

Supabase のプロジェクトはまだ作成していません。作成後に次の手順で切り替えます。

1. Supabase ダッシュボードでプロジェクトを作成
2. **Connect** → **Session pooler** の接続文字列をコピー（IPv4 環境でも接続できる）
3. `backend/.env` に設定（`DATABASE_URL` が `DB_*` より優先される）
   ```
   DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres?sslmode=require
   ```
4. `ruby bin/rails db:prepare` を実行し、http://localhost:5173 で接続を確認

ローカル DB に戻すときは `DATABASE_URL` の行をコメントアウトします。

## 未確定事項（仕様書で「今後選定」「要確認」）

以下は今回の環境構築では決めていません。

- API 方式：疎通確認用に `GET /api/health`（JSON）のみ仮置き。正式な方式は未決定
- ホスティング先：未決定のため、Rails のデプロイ用ファイル（Dockerfile / Kamal）や CI は生成していない
- 決済サービス・本人確認サービス：未契約・未設定

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `ruby` / `rails` が見つからない | PowerShell を開き直す。`C:\Ruby34-x64\bin` が PATH にあるか確認 |
| `docker compose up` で接続エラー | Docker Desktop が起動しているか確認 |
| 画面で「データベース NG」 | `docker compose ps` で `program_fitness_db` が `healthy` か確認。`.env` と `backend\.env` の値が一致しているか確認 |
| ポート 5432 が使用中 | `.env` の `POSTGRES_PORT` と `backend\.env` の `DB_PORT` を同じ別番号（例 5433）に変更 |
| gem のビルドで pacman の PGP 鍵エラー | `ridk exec bash -lc "pacman-key --init && pacman-key --populate msys2"` |
