# 画像管理ガイドライン

このディレクトリはオーディオ機器レビューサイトの画像を体系的に管理するためのものです。

## ディレクトリ構造

```
public/images/
├── products/              # 製品画像（全製品フラット配置）
├── hero/                 # ヒーロー画像（記事トップ）
├── thumbnails/           # サムネイル画像（一覧表示用）
├── gallery/              # ギャラリー画像（詳細画像）
└── brands/               # ブランドロゴ
```

## ファイル命名規則

### 製品画像
```
/products/{brand}-{model}-{type}.{ext}

例:
- /products/sennheiser-hd600-main.jpg
- /products/sennheiser-hd600-side.jpg
- /products/topping-d90se-front.jpg
- /products/kef-ls50meta-pair.jpg
- /products/taiko-olympus-main.jpg
```

### ヒーロー画像
```
/hero/{slug}.{ext}

例:
- /hero/sennheiser-hd600-review.jpg
- /hero/taiko-olympus.jpg
```

### サムネイル画像
```
/thumbnails/{brand}-{model}.{ext}

例:
- /thumbnails/sennheiser-hd600.jpg
- /thumbnails/topping-d90se.jpg
```

## 画像サイズ・形式ガイドライン

### ヒーロー画像
- **サイズ**: 1200×630px（OGP対応）
- **形式**: .jpg または .webp
- **最大ファイルサイズ**: 200KB以下

### 製品画像（メイン）
- **サイズ**: 800×600px
- **形式**: .jpg または .webp
- **最大ファイルサイズ**: 150KB以下

### サムネイル画像
- **サイズ**: 400×300px
- **形式**: .jpg または .webp
- **最大ファイルサイズ**: 50KB以下

### ブランドロゴ
- **サイズ**: 200×200px（正方形推奨）
- **形式**: .svg（ベクター）または .png（透明背景）
- **最大ファイルサイズ**: 20KB以下

## 最適化Tips

### 品質設定
- **JPEG**: 品質85-90%
- **WebP**: 品質80-85%
- **PNG**: OptiPNGまたは同等ツールで圧縮

### レスポンシブ対応
Astroの`<Image>`コンポーネントを使用：
```astro
---
import { Image } from 'astro:assets'
import heroImage from '/images/hero/product-name.jpg'
---

<Image
  src={heroImage}
  alt="製品名"
  width={800}
  height={600}
  loading="lazy"
/>
```

### WebP変換
```bash
# ImageMagick使用例
magick input.jpg -quality 85 output.webp

# cwebp使用例  
cwebp -q 85 input.jpg -o output.webp
```

## 著作権・ライセンス

- 製品画像: メーカー公式画像または自撮影画像のみ使用
- 引用画像: 適切な出典表記と許可を確認
- ブランドロゴ: 公式配布素材または許可取得済みのもの

## 更新履歴

- 2025-01-22: 初期ディレクトリ構造作成