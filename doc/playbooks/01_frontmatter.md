目的:
- 対象Markdownの frontmatter を Astro用スキーマに合わせて設定する
- 本文は一切変更しない（frontmatter 以外に触らない）

対象:
- {{FILES}} に列挙された .md / .mdx のみ編集
- 対象以外のファイルは読み取り専用

作業方針:
- 最小差分で編集。空白や改行、本文・脚注・表は変更禁止
- 推論・想像で値を作らない。不明は null か欠落のまま
- 単位・数値は原文のものをそのまま使う（換算禁止）
- 既に値が入っている場合は上書きせず、明らかなtypo/重複のみ修正

出力スキーマ（YAML frontmatter）:
---
locale(必須): ja
translationKey(必須): {slug}
title(必須): "{製品名} レビュー：{内容に合わせた最適なタイトル}"
description(必須): "{内容に合わせた最適な説明}"
date(必須): "{現在日時(東京時間) 例:2025-09-22T00:00:00+09:00}"
brand(必須): "{ブランド名}"
model(必須): "{製品名}"
category(必須): "{カテゴリ名}" 
tags(必須): [{タグのリスト}]
heroImage(必須): "@assets/images/hero/{slug}.jpg"
relatedArticles(必須): []
---

ルール:
1) title/brand/model を本文の先頭見出し・導入の明示箇所から抽出（なければファイル名を分割して推定）
2) slug は brand と model から生成（例: "Focal Bathys" → "focal-bathys"）。既存 slug (md / mdxファイル名)があれば維持
3) category が本文やfrontmatterにあれば尊重。
4) lang は 'ja' を設定（既存が ja 以外なら ja に修正）
5) relatedArticlesは一旦空で
6) categoryは以下のリストから選択
'Speakers',
'Headphones',
'Earphones',
'Digital Player',
'DAC',
'Power Amplifier',
'Preamplifier',
'Integrated Amplifier',
'Headphone Amplifier',
'Analog',
'Cables',
'Accessories'

検査:
- frontmatter 以外に差分が無いこと
- 必須キーが揃っていること
- categoryはリストに存在するものか
- slug は半角の小文字kebab-caseであること（英数とハイフンのみ）
- YAML が正しくパース可能であること

出力:
- 対象各ファイルに frontmatter を設定して保存