# program fitness

筋トレプログラムの作成・販売・購入・トレーニング記録 Web アプリ（開発中）。
要件は [program_fitness_ユーザー運営機能仕様書.pdf](program_fitness_ユーザー運営機能仕様書.pdf) を参照。

> 実装済み：**ユーザーアカウントの土台**（新規登録・メール確認・ログイン/ログアウト・パスワード再設定/変更・プロフィール）、
> **トレーニングプログラムの作成・下書き保存・プレビュー**、**公開プログラムの検索・お気に入り**。
> **運営画面のユーザー管理**（運営者ログイン・ユーザー一覧/検索/詳細・アカウント停止/解除・操作履歴）、
> **筋トレニュース**（運営画面での作成・編集・公開/非公開、ユーザー画面のホーム・一覧・詳細）。
> 未実装：プログラムの販売開始（公開する操作）・購入・決済・レビュー・トレーニングメモ・ニュース・おすすめ・人気順、運営画面の問い合わせ/返金/ニュース/決済管理など。

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

ブラウザで http://localhost:5173 を開きます。接続確認は http://localhost:5173/health（「バックエンド」「データベース」が **OK** なら接続できています）。

初回やマイグレーション追加後は、起動前に `cd backend; ruby bin/rails db:prepare` を実行してください。

- スマホ実機で確認する場合：`npm run dev -- --host` で起動し、同じ Wi-Fi のスマホから表示された `Network:` の URL を開く
- API を直接確認：http://localhost:3000/api/health

### 停止

- 各ターミナルで `Ctrl + C`
- DB コンテナ：`docker compose stop`（データは残る） / `docker compose down -v`（データも削除）

## ユーザーアカウント機能

### 画面

| URL | 画面 |
|---|---|
| `/signup` | 新規登録（メールアドレス・パスワード・生年月日・トレーニング開始年月） |
| `/login` | ログイン |
| `/verify-email?token=…` | メールアドレス確認（確認メールのリンク先） |
| `/forgot-password` | パスワード再設定メールの送信 |
| `/reset-password?token=…` | 新しいパスワードの設定（再設定メールのリンク先） |
| `/profile` | マイページ（プロフィール・販売条件の確認状態・アカウント） |
| `/profile/edit` | プロフィール編集（ニックネーム・自己紹介・生年月日・トレーニング開始年月） |
| `/profile/password` | パスワード変更（現在のパスワード確認＋登録メールアドレスへ通知） |

### 開発中のメールの確認方法

開発環境では 2 つの方法を `backend/.env` で切り替えます（本番のメール送信サービスは未選定）。

| `SMTP_ADDRESS` | 動作 |
|---|---|
| 未設定（初期状態） | 送信せず `backend/tmp/mails/<宛先>` にファイル保存 |
| 設定あり | SMTP で実際に送信（Gmail / Outlook などの受信箱に届く） |

#### ファイル保存のとき

確認メールや再設定メールのリンクは、次のコマンドで最新メールの本文を表示して開きます。

```powershell
cd backend
ruby bin/rails dev:last_mail
```

#### iCloud メールから実際に送るとき

1. Apple アカウントで **2ファクタ認証** を有効にする
2. https://account.apple.com にサインイン →「サインインとセキュリティ」→「App用パスワード」で作成する
   （`xxxx-xxxx-xxxx-xxxx` 形式。Apple アカウントのパスワードは使えません）
3. `backend/.env` の SMTP の行のコメント（`#`）を外して値を入れる

   ```
   SMTP_ADDRESS=smtp.mail.me.com
   SMTP_PORT=587
   SMTP_DOMAIN=icloud.com
   SMTP_USERNAME=あなたのアドレス@icloud.com
   SMTP_PASSWORD=App用パスワード
   SMTP_AUTHENTICATION=plain
   MAIL_FROM="program fitness <あなたのアドレス@icloud.com>"
   ```

4. **Rails サーバーを再起動**し、`ruby bin/rails dev:test_mail TO=届けたいアドレス` でテスト送信する

- `SMTP_USERNAME` は `@icloud.com` まで含めたアドレス全体
- `MAIL_FROM` は iCloud のアドレス（またはその iCloud メールのエイリアス）にする。別のアドレスだと拒否される

#### Gmail から実際に送るとき

1. 送信元にする Google アカウントで **2段階認証** を有効にする
2. https://myaccount.google.com/apppasswords で **アプリパスワード**（16文字）を作成する
   （通常のログインパスワードは使えません）
3. `backend/.env` の SMTP の行のコメント（`#`）を外して値を入れる

   ```
   SMTP_ADDRESS=smtp.gmail.com
   SMTP_PORT=587
   SMTP_DOMAIN=gmail.com
   SMTP_USERNAME=あなたのアドレス@gmail.com
   SMTP_PASSWORD=アプリパスワード16文字（スペースなし）
   SMTP_AUTHENTICATION=plain
   MAIL_FROM="program fitness <あなたのアドレス@gmail.com>"
   ```

4. **Rails サーバーを再起動**（`.env` は起動時に読み込まれる）
5. テスト送信で確認

   ```powershell
   cd backend
   ruby bin/rails dev:test_mail TO=届けたいアドレス@outlook.com
   ```

注意：
- `MAIL_FROM` は `SMTP_USERNAME` と同じ Gmail アドレスにする（違うと Gmail が送信元を書き換える／迷惑メール扱いされやすい）
- Outlook / Hotmail 宛ては最初「迷惑メール」フォルダに入ることがある
- 送信元に個人の Outlook.com アカウントを使う方法は、Microsoft がパスワード認証の SMTP を廃止する方針のため推奨しない（受信先としては問題なし）
- Gmail の送信数には 1 日あたりの上限がある。開発・動作確認用であり、本番の送信サービスは別途選定する
- アプリパスワードは `.env`（Git 管理外）にだけ書き、コードやチャットに貼らない

### API（すべて JSON、`/api` 配下）

| メソッド・パス | 内容 | ログイン |
|---|---|---|
| `POST /api/registration` | 新規登録（成功するとログイン状態になり確認メールを送信） | 不要 |
| `GET /api/session` | ログイン中のユーザー情報（未ログインは 401） | 必要 |
| `POST /api/session` | ログイン | 不要 |
| `DELETE /api/session` | ログアウト | 必要 |
| `POST /api/email_verification` | 確認トークンでメールアドレスを確認 | 不要 |
| `POST /api/email_verification/resend` | 確認メールの再送 | 必要 |
| `POST /api/password_reset` | 再設定メールの送信依頼 | 不要 |
| `PATCH /api/password_reset` | トークンで新しいパスワードを設定（全端末ログアウト） | 不要 |
| `GET /api/profile` / `PATCH /api/profile` | プロフィールの取得・編集 | 必要 |
| `PATCH /api/password` | パスワード変更（他の端末はログアウト・通知メール送信） | 必要 |

### セキュリティ上の基本設定

- パスワードは bcrypt でハッシュ化して保存（`has_secure_password`）。平文は保存しない
- ログイン状態は **HttpOnly・SameSite=Lax の署名付き Cookie**（本番では Secure も付与）。JavaScript からは読めない
- ログインセッションは DB に保存し、ログアウト・パスワード変更/再設定でサーバー側から無効化
- データを変更するリクエストには `X-Requested-With: XMLHttpRequest` ヘッダーを必須にして CSRF を防止（フロントエンドの `src/lib/api.ts` が自動付与）
- ログイン・登録・再設定・確認メール再送に回数制限（超えると 429）
- 再設定依頼は、メールアドレスが登録済みかどうかに関わらず同じ応答（アカウントの有無を推測させない）
- パスワード・メールアドレス・トークン・生年月日はログに `[FILTERED]` と出力
- 権限の確認は必ずサーバー側で行う（画面の表示制御だけに頼らない）

### 仮で決めている値（仕様書に記載なし・変更可能）

| 項目 | 値 | 変更場所 |
|---|---|---|
| パスワードの最小文字数 | 8文字 | `User::PASSWORD_MIN_LENGTH` |
| ログイン状態の保持期間 | 30日 | `Session::LIFETIME` |
| メール確認リンクの有効期限 | 24時間 | `User::EMAIL_VERIFICATION_EXPIRES_IN` |
| 再設定リンクの有効期限 | 1時間 | `User::PASSWORD_RESET_EXPIRES_IN` |
| ニックネーム / 自己紹介の最大文字数 | 30 / 1000文字 | `User::NICKNAME_MAX_LENGTH` / `BIO_MAX_LENGTH` |
| 回数制限 | ログイン 3分10回、再設定依頼 15分5回 など | 各 `app/controllers/api/*_controller.rb` の `rate_limit` |
| タイムゾーン | 日本時間（年齢計算の「今日」に使用） | `config/application.rb` |

## トレーニングプログラム（下書き）

### 画面（ログインが必要）

| URL | 画面 |
|---|---|
| `/my/programs` | マイプログラム一覧（自分の下書き） |
| `/my/programs/new` | プログラム作成 |
| `/my/programs/:id` | プレビュー（購入者に表示される内容のイメージ・作成者情報・販売者条件の確認状態・未入力項目） |
| `/my/programs/:id/edit` | 下書きの編集 |

### 登録できる内容

- 基本情報：タイトル（必須）、区分（パワー / 筋肥大 / バランス）、期間（1〜12週 または 1〜3ヶ月）、分割法（自由入力）、販売価格（100〜100,000円）
- 説明：プログラムの内容、対象者、必要な器具
- トレーニング日（最大14日）と種目（1日最大30種目）：種目名、セット数（1〜20）、回数、重量、休憩、メモ。順番の入れ替え可

下書きはタイトルだけで保存できます。プレビューに「販売に向けて未入力の項目」を表示します。

### API（`/api/my/programs`、ログインが必要）

| メソッド・パス | 内容 |
|---|---|
| `GET /api/my/programs` | 自分のプログラム一覧 |
| `POST /api/my/programs` | 下書き作成 |
| `GET /api/my/programs/:id` | 詳細（プレビュー用） |
| `PATCH /api/my/programs/:id` | 下書き編集（`days` を送るとトレーニング日・種目を送った内容で置き換え） |
| `DELETE /api/my/programs/:id` | 下書き削除 |

- すべて `current_user` のプログラムだけを検索するため、他人のプログラムは表示・編集・削除とも **404**（サーバー側で権限を確認）
- 入力エラーは `{"errors": {"title": [...], "days.0.exercises.1.sets": [...]}}` の形で項目ごとに返す
- 作成者情報にはメールアドレス・生年月日・年齢を含めない（販売者条件を満たすかどうかのみ）

### 仮で決めている点（仕様書に記載なし・確認待ち）

| 項目 | 現在の実装 |
|---|---|
| 期間の単位 | 「週（1〜12）」または「ヶ月（1〜3）」を選択。3ヶ月を何週とみなすかは決めていない |
| プログラムの構成 | 「トレーニング日 → 種目」の2階層。週ごとに内容が変わる構成（週 → 日 → 種目）は未対応で、説明文に記載する |
| 回数・重量の形式 | 文字入力（「8〜10」「AMRAP」「80kg」「1RMの75%」など）。セット数のみ整数 |
| 上限 | トレーニング日14日、1日30種目、各文字数（`app/models/program*.rb` の定数） |

## プログラム検索・お気に入り

### 画面

| URL | 画面 | ログイン |
|---|---|---|
| `/programs` | プログラムを探す（キーワード・区分・期間・価格帯、新着順、20件ずつ） | 不要 |
| `/programs/:id` | 公開プログラムの詳細（購入前の表示） | 不要 |
| `/my/favorites` | お気に入り一覧 | 必要 |

検索条件は URL（`/programs?q=ベンチ&category=power`）に入るので、戻るボタンや共有でも同じ結果になります。

### API

| メソッド・パス | 内容 | ログイン |
|---|---|---|
| `GET /api/programs` | 公開中プログラムの検索（`q` `category` `duration_unit` `duration_min` `duration_max` `price_min` `price_max` `page`） | 不要 |
| `GET /api/programs/:id` | 公開中プログラムの詳細（下書きは 404） | 不要 |
| `GET /api/my/favorites` | 自分のお気に入り一覧（公開中のみ） | 必要 |
| `POST /api/my/favorites` | お気に入り追加 `{ "program_id": 1 }`（公開中のみ・重複しない） | 必要 |
| `DELETE /api/my/favorites/:program_id` | お気に入り解除 | 必要 |

- 検索・公開詳細は **状態が「公開中」のプログラムだけ** を DB クエリの段階で抽出（下書きは表示されない）
- キーワードはタイトル・内容・対象者・分割法・必要な器具・種目名を部分一致で検索（スペース区切りで AND、`%` `_` は文字として扱う）
- お気に入りは `current_user.favorites` だけを操作するため、他のユーザーのお気に入りは見えず、操作もできない
- 公開詳細では、各種目のセット数・回数・重量は表示しない（日数と種目数のみ）

### 公開中プログラムの作り方（開発環境のみ）

画面から「公開」する機能はまだありません（仕様上、公開＝販売開始には販売者条件と本人確認が必要で、本人確認サービスが未選定のため）。
検索やお気に入りを試すときは、開発環境用のコマンドで下書きを公開状態にします。

```powershell
cd backend
ruby bin/rails dev:publish_program ID=プログラムID     # 未入力の項目があると公開しない
ruby bin/rails dev:unpublish_program ID=プログラムID   # 下書きに戻す
```

プログラム ID はマイプログラムのプレビュー画面の URL（`/my/programs/ID`）で確認できます。

### 仮で決めている点（仕様書に記載なし・確認待ち）

| 項目 | 現在の実装 |
|---|---|
| 公開（販売開始）の方法 | 未実装。開発用コマンドのみ |
| 期間の絞り込み | 単位（週 / ヶ月）を選んで範囲指定。週と月は換算しない |
| 購入前の詳細表示 | 種目の詳細（セット・回数・重量）は非表示、日数と種目数のみ |
| 未ログインでの閲覧 | 検索・公開詳細はログイン不要。お気に入りはログイン必須 |
| 公開中プログラムの編集 | 作成者も編集・削除不可（公開後の改訂ルールが未決定のため） |

## 運営画面（ユーザー管理）

### フォルダー構成

| 場所 | 内容 |
|---|---|
| `frontend/src/pages` `src/components` `src/auth` など（既存） | ユーザー画面 |
| `frontend/src/admin/` | 運営画面（`/admin` 以下。別レイアウト・別ログイン。別ファイルに分割して読み込み） |
| `backend/app/controllers/api/admin/` | 管理用 API（`/api/admin/*`） |

### 運営者アカウントの作り方（サーバーのコマンドのみ）

運営者は一般ユーザーとは **別のテーブル（`admin_users`）** で管理します。`users` に運営者フラグはなく、新規登録画面・API から運営者を作ることはできません。
作成はサーバー上でコマンドを実行できる人だけが行えます。

```powershell
cd backend
# パスワードは画面に表示されない状態で 2 回入力（12 文字以上）
# 権限を指定しない場合は「閲覧のみ」（個人情報なし・停止/解除不可）
ruby bin/rails admin:create EMAIL=staff@example.com NAME="運営 太郎"
# ユーザー運営操作（停止・解除）の権限を付ける
ruby bin/rails admin:create EMAIL=ops@example.com NAME="運営 次郎" MANAGE_USERS=1
# 個人情報（メールアドレス・生年月日）の閲覧権限も付ける
ruby bin/rails admin:create EMAIL=lead@example.com NAME="運営 花子" MANAGE_USERS=1 PERSONAL_INFO=1

# ニュース管理の権限を付ける
ruby bin/rails admin:create EMAIL=editor@example.com NAME="運営 三郎" NEWS=1

# 権限の変更（指定した項目だけ変わる。0=なし / 1=あり）
ruby bin/rails admin:permissions EMAIL=staff@example.com MANAGE_USERS=1
ruby bin/rails admin:permissions EMAIL=staff@example.com NEWS=1
ruby bin/rails admin:permissions EMAIL=lead@example.com PERSONAL_INFO=0

ruby bin/rails admin:list                                   # 一覧（権限・状態・最終ログイン）
ruby bin/rails admin:disable EMAIL=staff@example.com        # 停止（即ログアウト）
ruby bin/rails admin:enable  EMAIL=staff@example.com        # 再開
ruby bin/rails admin:reset_password EMAIL=staff@example.com # パスワード再設定（即ログアウト）
```

作成後、http://localhost:5173/admin/login からログインします。

おすすめの運用：
- 運営者ごとに個別のアカウントを作り、共有しない（操作履歴で誰が操作したか分かるようにするため）
- 権限は必要な人に必要な分だけ付ける（新規作成時の初期値は権限なし）
- パスワードはパスワードマネージャーで生成した長いものを使う。`ADMIN_PASSWORD=...` でも指定できるが、シェルの履歴に残るため対話入力を推奨
- 退職・異動時は `admin:disable` で停止する（操作履歴を残すため削除はしない）
- 本番公開前に二段階認証の導入を検討する（未実装）

### 画面

| URL | 画面 |
|---|---|
| `/admin/login` | 運営者専用ログイン |
| `/admin` | ダッシュボード（ユーザー総数・停止中ユーザー数・直近7日の新規登録数） |
| `/admin/users` | ユーザー一覧・検索（ニックネーム／メールアドレス※、アカウント状態、登録日） |
| `/admin/users/:id` | ユーザー詳細・アカウント停止／停止解除・停止履歴 |

※ メールアドレスでの検索・表示は個人情報の閲覧権限がある運営者のみ。

### 運営者の権限

| 権限 | できること | コマンドの指定 |
|---|---|---|
| （全運営者） | ダッシュボード、ユーザー一覧・詳細の閲覧（個人情報を除く） | — |
| 個人情報の閲覧 | メールアドレス・生年月日の表示、メールアドレスでの検索 | `PERSONAL_INFO=1` |
| ユーザー運営操作 | アカウントの停止・停止解除 | `MANAGE_USERS=1` |
| ニュース管理 | ニュースの作成・編集・公開・非公開（閲覧は全運営者が可能） | `NEWS=1` |

権限の確認はすべて Rails 側で行います（画面でボタンを隠すだけではありません）。権限を変更する画面はなく、サーバーのコマンドでのみ変更できます。

### API（すべて運営者ログインが必要。一般ユーザーの Cookie では 401）

| メソッド・パス | 内容 |
|---|---|
| `GET/POST/DELETE /api/admin/session` | 運営者ログイン状態・ログイン・ログアウト |
| `GET /api/admin/dashboard` | ユーザー数の集計 |
| `GET /api/admin/users` | ユーザー一覧・検索（`q` `status` `registered_from` `registered_to` `page`） |
| `GET /api/admin/users/:id` | ユーザー詳細（閲覧を操作履歴に記録） |
| `POST /api/admin/users/:id/suspension` | アカウント停止 `{ user_reason, internal_note?, ends_at? }`（ユーザー運営操作の権限が必要） |
| `DELETE /api/admin/users/:id/suspension` | 停止解除 `{ reason }`（ユーザー運営操作の権限が必要） |

### 安全面

- 運営者ログインは一般ユーザーと別の Cookie（`admin_session_id`、HttpOnly・SameSite=Strict、12時間で失効）
- `Api::Admin::BaseController` で全 API の運営者ログインを確認（画面の表示制御だけに頼らない）
- 運営画面に返さない情報：パスワード（ハッシュ含む）、セッション情報。メールアドレス・生年月日は個人情報の閲覧権限がある運営者のみ
- 停止すると対象ユーザーの全セッションを即削除。停止中はログイン不可（403）、ログインが必要な API も利用不可
- 停止・解除は `account_suspensions`（実施者・対象・日時・理由・期限・解除者・解除理由）と `admin_audit_logs`（操作履歴）に記録。運営者ログインとユーザー詳細の閲覧も記録。操作履歴はアプリから変更・削除できない
- 停止・解除は本人へメールで通知（下記の方針どおり）

### アカウント停止の方針（確定）

| 項目 | 方針 |
|---|---|
| 停止期間 | 停止期限を指定できる。指定しない場合は運営者が解除するまで継続。期限を過ぎたアカウントは自動的に利用可能に戻る |
| 停止理由 | 「利用者向けの停止理由」（必須・通知メールに記載）と「運営内部メモ」（任意・運営画面のみ。メールには含めない）を分けて記録 |
| 停止通知メール | 利用者向けの停止理由、停止期間（開始・期限）、問い合わせ先を記載 |
| 停止中の利用範囲 | ログインと会員向け機能（ログインが必要な機能、パスワード再設定、メールアドレス確認）は利用不可。ログイン不要の公開ページ（プログラム検索・公開詳細など）は閲覧可能 |
| 運営者の権限 | 個人情報の閲覧権限と、ユーザー運営操作（停止・解除）の権限を分ける。一般ユーザーは運営者権限を取得できない |
| 運営者ログインの有効時間 | 開発中は 12 時間（本番公開前に再確認） |

問い合わせ先は `backend/.env` の `SUPPORT_CONTACT`（メールアドレスまたは問い合わせページの URL）で設定します。未設定の場合、通知メールには「問い合わせ先が未設定」と表示されます。

※ 2026-11-25 の仕様変更前に記録した停止は、理由が「運営内部メモ」として保存されており、利用者向けの停止理由は空です。

## 筋トレニュース

### 画面

| URL | 画面 | 利用者 |
|---|---|---|
| `/` | ホーム（公開中の最新ニュース5件） | 誰でも |
| `/news` | ニュース一覧（種類・掲載月で絞り込み、10件ずつ） | 誰でも |
| `/news/:id` | ニュース詳細 | 誰でも |
| `/admin/news` | ニュース管理一覧（非公開も含む） | 運営者 |
| `/admin/news/new` | ニュース作成（非公開で保存） | 運営者 |
| `/admin/news/:id` | 詳細・公開前プレビュー・公開／非公開の切り替え | 運営者 |
| `/admin/news/:id/edit` | ニュース編集 | 運営者 |

### 登録できる内容

タイトル（100文字まで）、本文（10,000文字まで・プレーンテキスト。改行はそのまま表示、HTML/Markdown は使えない）、ニュースの種類（筋トレニュース／大会情報）、公開状態（非公開／公開中）。
掲載日時は、初めて公開したときに自動で記録されます（予約公開は未対応）。

### API

| メソッド・パス | 内容 | 利用者 |
|---|---|---|
| `GET /api/news` | 公開中のニュース一覧（`category` `month=YYYY-MM` `page` `limit`） | 誰でも |
| `GET /api/news/:id` | 公開中のニュース詳細（非公開は 404） | 誰でも |
| `GET /api/admin/news` `GET /api/admin/news/:id` | 管理一覧・詳細 | 運営者（全員） |
| `POST /api/admin/news` `PATCH /api/admin/news/:id` | 作成・編集 | ニュース管理権限のある運営者 |
| `POST/DELETE /api/admin/news/:id/publication` | 公開・非公開 | ニュース管理権限のある運営者 |

- 一般ユーザー向け API は **公開中のニュースだけ** を DB クエリの段階で抽出（非公開の本文は返らない）
- 管理用 API は `Api::Admin::BaseController` で運営者ログインを確認（一般ユーザーの Cookie では 401）。作成・編集・公開・非公開はさらにニュース管理権限を Rails 側で確認（権限がなければ 403）
- 公開中のニュースを編集するとユーザー画面に即反映、非公開にすると即非表示（詳細も 404）
- 作成・編集・公開・非公開は操作履歴（`admin_audit_logs`）に記録
- ユーザー向け API には運営者名を含めない

### ニュースの方針（確定）

| 項目 | 方針 |
|---|---|
| ニュースの種類 | 「筋トレニュース」「大会情報」の 2 種類（`NewsArticle::CATEGORIES`） |
| 管理の権限 | 作成・編集・公開・非公開はニュース管理権限（`NEWS=1`）を持つ運営者だけ。閲覧は全運営者 |
| 掲載日時 | 最初に公開した日時。非公開にして再公開しても維持する |
| 削除 | 削除機能はない。不要なニュースは非公開にする |
| ユーザー画面の日付 | 掲載日を表示。公開後にタイトル・本文・種類を編集した場合は更新日も表示（公開・非公開の切り替えだけでは更新日は変わらない） |

## 本番公開前の確認事項

| 項目 | 現在の状態 | 確認すること |
|---|---|---|
| 運営者ログインの有効時間 | 12 時間（`AdminSession::LIFETIME`） | 本番運用に合った長さか再確認する |
| 問い合わせ先 | 未設定（`SUPPORT_CONTACT`） | 通知メールに記載する問い合わせ先を決めて設定する |
| 運営者の二段階認証 | 未実装 | 導入するか検討する |
| メール送信サービス | 開発中は iCloud の SMTP | 本番用の送信サービスを選定・設定する |
| Ruby のバージョン | 3.4.12（Brakeman が脆弱性を警告） | 3.4.13 以降に更新する |
| ホスティング・Cookie の Secure 属性 | 未選定（本番環境では Secure を付与する実装） | HTTPS で配信されることを確認する |

## 環境変数

秘密情報はソースコードに書かず、`.env` ファイル（Git 管理外）で設定します。

| ファイル | 用途 | 主な変数 |
|---|---|---|
| `.env` | Docker の PostgreSQL | `POSTGRES_USER` `POSTGRES_PASSWORD` `POSTGRES_DB` `POSTGRES_PORT` |
| `backend/.env` | Rails の DB 接続・メール | `DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_NAME` `DATABASE_URL` `FRONTEND_URL` `MAIL_FROM` |
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
- 決済サービス・本人確認サービス：未契約・未設定（マイページの「本人確認」は常に「未実施」表示）
- メール送信サービス：未選定（開発中はファイル出力。本番の送信設定は未設定）
- 購入者にも年齢・トレーニング歴の条件を課すか（仕様書 8章 要確認1）：未実装。販売条件はマイページで表示のみ
- 本人確認の詳細・年齢情報の保存期間（要確認5）：未決定
- 販売開始後の改訂と購入版のバージョン管理（要確認4）：未実装。プログラムは「下書き」状態のみで、販売開始・販売停止・公開終了は未実装

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `ruby` / `rails` が見つからない | PowerShell を開き直す。`C:\Ruby34-x64\bin` が PATH にあるか確認 |
| `docker compose up` で接続エラー | Docker Desktop が起動しているか確認 |
| 画面で「データベース NG」 | `docker compose ps` で `program_fitness_db` が `healthy` か確認。`.env` と `backend\.env` の値が一致しているか確認 |
| ポート 5432 が使用中 | `.env` の `POSTGRES_PORT` と `backend\.env` の `DB_PORT` を同じ別番号（例 5433）に変更 |
| gem のビルドで pacman の PGP 鍵エラー | `ridk exec bash -lc "pacman-key --init && pacman-key --populate msys2"` |
