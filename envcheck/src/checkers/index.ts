export interface Checker {
  /** パッケージマネージャー名 (例: "nix", "apt") */
  name: string;
  /** パッケージマネージャーが利用可能か確認する */
  isAvailable(): Promise<boolean>;
  /** 指定パッケージがインストール済みか確認する */
  check(pkg: string): Promise<boolean>;
}