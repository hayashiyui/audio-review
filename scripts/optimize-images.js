#!/usr/bin/env node

/**
 * 画像最適化スクリプト
 * 使用方法: node scripts/optimize-images.js [input-dir] [output-dir]
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const INPUT_DIR = process.argv[2] || './public/images/temp'
const OUTPUT_DIR = process.argv[3] || './public/images/optimized'

// 対応画像形式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif']

// 最適化設定
const OPTIMIZATION_CONFIG = {
  hero: { width: 1200, height: 630, quality: 90 },
  product: { width: 800, height: 600, quality: 85 },
  thumbnail: { width: 400, height: 300, quality: 80 },
  gallery: { width: 1024, height: 768, quality: 90 },
}

/**
 * ディレクトリが存在しない場合は作成
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 画像を最適化
 */
function optimizeImage(inputPath, outputPath, config) {
  const { width, height, quality } = config

  try {
    // ImageMagickを使用した最適化（要インストール）
    const command = `magick "${inputPath}" -resize ${width}x${height}^ -gravity center -extent ${width}x${height} -quality ${quality} "${outputPath}"`
    
    console.log(`Optimizing: ${path.basename(inputPath)}`)
    execSync(command, { stdio: 'pipe' })
    
    // WebP版も生成
    const webpPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    const webpCommand = `magick "${outputPath}" -quality ${quality - 5} "${webpPath}"`
    execSync(webpCommand, { stdio: 'pipe' })
    
    console.log(`✓ Generated: ${path.basename(outputPath)} and ${path.basename(webpPath)}`)
  } catch (error) {
    console.error(`❌ Failed to optimize ${inputPath}:`, error.message)
  }
}

/**
 * ディレクトリ内の画像を処理
 */
function processDirectory(inputDir, outputDir) {
  if (!fs.existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`)
    return
  }

  ensureDir(outputDir)

  const files = fs.readdirSync(inputDir)
  
  files.forEach(file => {
    const inputPath = path.join(inputDir, file)
    const ext = path.extname(file).toLowerCase()
    
    if (fs.statSync(inputPath).isDirectory()) {
      // サブディレクトリを再帰処理
      const subOutputDir = path.join(outputDir, file)
      processDirectory(inputPath, subOutputDir)
      return
    }
    
    if (!SUPPORTED_FORMATS.includes(ext)) {
      return
    }
    
    // ファイル名から画像タイプを推測
    let imageType = 'product' // デフォルト
    
    if (file.includes('hero') || file.includes('banner')) {
      imageType = 'hero'
    } else if (file.includes('thumb')) {
      imageType = 'thumbnail'
    } else if (file.includes('gallery')) {
      imageType = 'gallery'
    }
    
    const config = OPTIMIZATION_CONFIG[imageType]
    const outputPath = path.join(outputDir, file)
    
    optimizeImage(inputPath, outputPath, config)
  })
}

/**
 * 使用方法を表示
 */
function showUsage() {
  console.log(`
画像最適化スクリプト

使用方法:
  node scripts/optimize-images.js [input-dir] [output-dir]

例:
  node scripts/optimize-images.js ./temp-images ./public/images/products

要件:
  - ImageMagick がインストールされている必要があります
  - Windows: https://imagemagick.org/script/download.php#windows
  - macOS: brew install imagemagick
  - Linux: sudo apt install imagemagick

サポート形式: ${SUPPORTED_FORMATS.join(', ')}

最適化設定:
${Object.entries(OPTIMIZATION_CONFIG)
  .map(([type, config]) => `  ${type}: ${config.width}×${config.height}, 品質${config.quality}`)
  .join('\n')}
`)
}

// メイン処理
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage()
  process.exit(0)
}

console.log('🖼️  画像最適化を開始します...')
console.log(`入力ディレクトリ: ${INPUT_DIR}`)
console.log(`出力ディレクトリ: ${OUTPUT_DIR}`)
console.log('')

processDirectory(INPUT_DIR, OUTPUT_DIR)

console.log('')
console.log('✅ 画像最適化が完了しました！')
console.log('')
console.log('💡 Tip: 生成されたWebP画像をAstroの<Image>コンポーネントで使用できます')
console.log('例: <Image src="/images/products/speakers/product.webp" alt="製品名" />')