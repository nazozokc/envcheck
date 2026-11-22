# envcheck

`envcheck` は、システムに特定のパッケージ（Node.js, npm, git など）が
各種パッケージマネージャー経由でインストールされているかを確認する CLI ツール。

## インストール

```bash
pnpm dlx @nazozokc/envcheck <package-manager> <tools...>
```

## 使用方法

```sh
# nix に nodejs と npm が入っているか確認
envcheck nix nodejs npm

# apt に git が入っているか確認
envcheck apt git

# 複数のパッケージを一度にチェック
envcheck brew git python node

# 利用可能なマネージャーを一覧表示
envcheck list

# 利用可能なマネージャーを自動検出して横断チェック
envcheck auto nodejs git

# JSON で出力（パイプ処理向け）
envcheck nix nodejs --json

# 失敗した行だけを表示
envcheck nix nodejs git --quiet

# 色を無効化
envcheck nix nodejs --no-color
```

### 出力フォーマット

```
[nix] nodejs         ... OK
[nix] npm            ... NG
[apt] git            ... OK
```

- パッケージ名の幅は入力に応じて自動調整される
- OK は緑、NG は赤で表示される（`--no-color` で無効化）
- 終了コード: 全て OK なら `0`、1 つでも NG なら `1`、エラーなら `2`

`--json` を付けると以下の形式で出力される。

```json
{
  "results": [
    {
      "manager": "nix",
      "package": "nodejs",
      "installed": true,
      "version": "22.11.0",
      "reason": "installed"
    }
  ],
  "ok": true
}
```

`reason` は `installed` / `not-installed` / `command-failed` / `unavailable` のいずれか。

### エラーケース

- 指定したマネージャーが未対応 → エラーメッセージを出して終了コード `2`
- マネージャーがシステムに入っていない → 「{manager} is not available on this system」と表示して終了コード `2`

## 設定ファイル

カレントディレクトリに `envcheck.config.json` を置くと挙動をカスタマイズできる。

```json
{
  "defaultManager": "nix",
  "aliases": {
    "node": "nodejs"
  },
  "autoManagers": ["nix", "apt", "brew"]
}
```

| キー | 意味 |
|---|---|
| `defaultManager` | マネージャーを省略したときに使う。`envcheck node` が `envcheck nix nodejs` と解釈される |
| `aliases` | パッケージ名の別名。`auto` モードでも適用される |
| `autoManagers` | `auto` モードで走査するマネージャーを限定する。省略時は全マネージャー |

## サポートされているパッケージマネージャー

| マネージャー | 確認コマンド |
|---|---|
| nix         | `nix-env -q --exact {pkg}` → `nix profile list` |
| apt         | `dpkg-query -W '-f=${Status}' {pkg}` |
| pacman      | `pacman -Q {pkg}` |
| scoop       | `scoop list` |
| homebrew    | `brew list` |
| winget      | `winget list` |
| dnf         | `dnf -q list installed {pkg}` |
| zypper      | `zypper --quiet se --installed-only --exact {pkg}` |
| apk         | `apk info -e {pkg}` |
| cargo       | `cargo install --list` |
| pip         | `pip show {pkg}` |
| npm         | `npm ls -g --depth=0 {pkg}` |
| gem         | `gem list -i -e {pkg}` |
| flatpak     | `flatpak list --app --columns=application` |
| snap        | `snap list` |
| choco       | `choco list --local-only --exact {pkg}` |
| composer    | `composer global show {pkg}` |
| dotnet      | `dotnet tool list -g` |
| conda       | `conda list {pkg}` |

## 開発

### 必要なもの

- Node.js（最新 LTS）
- pnpm
- TypeScript（strict モード）

### 構成

| ファイル | 役割 |
|---|---|
| `src/index.ts` | エントリポイント。設定読み込みと出力のみ |
| `src/cli.ts` | `buildOutcome` / `printOutcome`。副作用のない CLI ロジック |
| `src/config.ts` | `envcheck.config.json` の読み込みと検証 |
| `src/checkers/index.ts` | `Checker` / `CheckResult` インターフェース |
| `src/checkers/baseChecker.ts` | `createSimpleChecker` / `createOutputChecker` / `createListChecker` |
| `src/checkers/registry.ts` | マネージャー名からチェッカーへのマッピング |

### チェッカーの追加方法

1. `src/checkers/{name}.ts` を作成し `Checker` を実装する（`baseChecker.ts` のファクトリを使う）
2. `src/checkers/registry.ts` に登録する
3. `src/__tests__/checkers.test.ts` に `isAvailable()` と `check()` のテストを追加する
4. この README のテーブルを更新する

### テスト

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

## コミット規約

Conventional Commits に従う。

```
feat: add homebrew checker
fix: fix pacman check command for meta packages
refactor: extract common spawn logic to utils
test: add unit tests for apt checker
docs: update supported managers in README
```

1 チェッカー追加 = 1 コミットを基本とする。
