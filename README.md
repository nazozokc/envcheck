# envcheck

`envcheck` は、システムに特定のパッケージ（Node.js, npm, git など）が
各種パッケージマネージャー経由でインストールされているかを確認する CLI ツール。

## インストール

```bash
bun install
```

## 使用方法

```sh
# nix に nodejs と npm が入っているか確認
envcheck nix nodejs npm

# apt に git が入っているか確認
envcheck apt git

# 複数のパッケージを一度にチェック
envcheck brew git python node
```

## 出力フォーマット

```
[nix] nodejs         ... OK
[nix] npm            ... NG
[apt] git            ... OK
```

- OK は緑、NG は赤で表示される
- 終了コード: 全て OK なら `0`、1 つでも NG なら `1`

## エラーケース

- 指定したマネージャーが存在しない（未対応）→ エラーメッセージを出して終了コード `2`
- マネージャーがシステムに入っていない → 「{manager} is not available on this system」と表示して終了コード `2`

## サポートされているパッケージマネージャー

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

## 開発

### 必要なもの

- Bun (最新安定版)
- TypeScript (strict モード)

### チェッカーの追加方法

1. `src/checkers/{name}.ts` を作成し `Checker` インターフェースを実装する
2. `src/checkers/index.ts` に export を追加する
3. `src/index.ts` のチェッカー一覧に登録する
4. この README のサポートされているパッケージマネージャーテーブルを更新する

### テスト

```bash
bun test
```

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