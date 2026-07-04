# Source Files for Obfuscation

このディレクトリには、難読化前のソースファイルが格納されています。

## ディレクトリ構成

```
public/src/
├── css/
│   └── submit.source.css    # 投稿フォームのCSS（編集用）
└── js/
    └── submit.source.js     # 投稿フォームのJS（編集用）
```

## 編集方法

1. **ソースファイルを編集**
   - `public/src/js/submit.source.js` または `public/src/css/submit.source.css` を編集

2. **ローカルでビルド（任意）**
   ```bash
   npm run build
   ```
   これにより、以下が生成されます：
   - `public/js/submit.js` - 難読化されたJavaScript
   - `public/css/submit.css` - コピーされたCSS

3. **コミット & プッシュ**
   ```bash
   git add public/src/
   git commit -m "Update submit form"
   git push
   ```

4. **自動デプロイ**
   - GitHub Actionsが自動的にビルド（難読化）を実行
   - `public/` が GitHub Pages にデプロイされます

## 注意事項

- **編集するのはソースファイル（public/src/）のみ**
- `public/js/submit.js` と `public/css/submit.css` は直接編集しないでください
  （これらはビルド時に自動生成されます）
- これらのビルド済みファイルは `.gitignore` に追加されており、Gitで管理されません

## ビルドコマンド

```bash
# 全てビルド
npm run build

# JSのみ難読化
npm run build:obfuscate

# CSSのみコピー
npm run build:css
```

## 難読化設定

JavaScript の難読化設定（package.json）:
- `--compact true` - コードを圧縮
- `--control-flow-flattening true` - 制御フローを平坦化
- `--dead-code-injection false` - デッドコード挿入なし
- `--string-array true` - 文字列配列化
- `--string-array-threshold 0.75` - 文字列配列化の閾値75%
