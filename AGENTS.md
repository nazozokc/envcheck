# AGENTS.md — envcheck

## プロジェクト概要

`envcheck` は、システムに特定のパッケージ（Node.js, npm, git など）が
各種パッケージマネージャー経由でインストールされているかを確認する CLI ツール。

- **言語**: TypeScript
- **ランタイム**: Bun
- **出力形式**: シンプルな OK / NG 表示

---

## ディレクトリ構成

```
envcheck/
├── src/
│   ├── index.ts          # エントリポイント・CLI引数パース
│   ├── checkers/         # パッケージマネージャーごとのチェッカー
│   │   ├── index.ts      # チェッカーの共通インターフェース定義・エクスポート
│   │   ├── nix.ts
│   │   ├── pacman.ts
│   │   ├── apt.ts
│   │   ├── scoop.ts
│   │   ├── brew.ts
│   │   └── ...           # 追加マネージャーはここに追加
│   └── utils.ts          # 共通ユーティリティ
├── AGENTS.md
├── package.json
├── tsconfig.json
└── README.md
```

---

## 技術スタック・バージョン制約

- **Bun**: 最新安定版を使う
- **TypeScript**: strict モード必須（`tsconfig.json` の `strict: true`）
- **依存ライブラリ**: 最小限に抑える。Commander.js / Consola / Clack は使ってよい
- `bun run` でビルド・実行すること。`npm run` は使わない

---

## チェッカーの実装ルール

### 共通インターフェース

`src/checkers/index.ts` に以下を定義し、全チェッカーはこれに従う：

```typescript
export interface Checker {
  /** パッケージマネージャー名 (例: "nix", "apt") */
  name: string;
  /** パッケージマネージャーが利用可能か確認する */
  isAvailable(): Promise<boolean>;
  /** 指定パッケージがインストール済みか確認する */
  check(pkg: string): Promise<boolean>;
}
```

### 新しいチェッカーを追加するとき

1. `src/checkers/{name}.ts` を作成し `Checker` を実装する
2. `src/checkers/index.ts` に export を追加する
3. `src/index.ts` のチェッカー一覧に登録する
4. README.md の対応マネージャー一覧を更新する

### 対応パッケージマネージャー（実装対象）

| マネージャー | 確認コマンド例 |
|-------------|---------------|
| nix         | `nix-env -q` / `nix profile list` |
| pacman      | `pacman -Q {pkg}` |
| apt         | `dpkg -l {pkg}` |
| scoop       | `scoop list {pkg}` |
| homebrew    | `brew list {pkg}` |
| winget      | `winget list {pkg}` |
| dnf         | `dnf list installed {pkg}` |
| zypper      | `zypper se --installed-only {pkg}` |
| apk         | `apk info {pkg}` |
| cargo       | `cargo install --list` |
| pip         | `pip show {pkg}` |

追加は自由。上記が基本対象。

---

## CLI 仕様

### 基本構文

```
envcheck <manager> <package> [package...]
```

### 使用例

```sh
# nix に nodejs と npm が入っているか確認
envcheck nix nodejs npm

# apt に git が入っているか確認
envcheck apt git
```

### 出力フォーマット

```
[nix] nodejs ... OK
[nix] npm    ... NG
```

- OK は緑、NG は赤で表示する（ターミナルカラー）
- 終了コード: 全て OK なら `0`、1 つでも NG なら `1`

### エラーケース

- 指定したマネージャーが存在しない（未対応）→ エラーメッセージを出して終了コード `2`
- マネージャーがシステムに入っていない → 「{manager} is not available on this system」と表示して終了コード `2`

---

## コーディング規約

- `async/await` を使う。コールバックは使わない
- エラーは絶対に握りつぶさない。`try/catch` で明示的に処理する
- 型は明示的に書く。`any` は禁止
- `console.log` は使わない。Consola か Clack を使う
- 外部コマンドの実行は `Bun.spawnSync` か `execa` を使う

---

## テスト

- テストファイルは `src/__tests__/` に置く
- `bun test` で実行できるようにする
- 各チェッカーの `isAvailable()` と `check()` には必ずユニットテストを書く
- 外部コマンドはモックする（実際のシステムに依存しないこと）

---

## コミット規約

Conventional Commits に従う：

```
feat: add homebrew checker
fix: fix pacman check command for meta packages
refactor: extract common spawn logic to utils
test: add unit tests for apt checker
docs: update supported managers in README
```

1 チェッカー追加 = 1 コミットを基本とする。

---

## やってはいけないこと

- `any` 型の使用
- `console.log` の直接使用
- チェッカーのインターフェースを変更する場合は、全チェッカーへの影響を必ず確認してから変更する
- ルートに直接ファイルを増やさない（`src/` 配下に置く）
- `npm install` / `npm run` の使用（Bun を使う）
