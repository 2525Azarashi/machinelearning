# まるっと機械学習 — Marutto ML

「機械学習 I（Part I 基礎）」を、**サカイ先輩とリョウガくんの対話** と **さわって動かすラボ** で直感的に理解するための学習サイト。
講義プリントが届くたびに章を追加していく前提の構成。

## 現在の収録内容（第1〜6回）
| 回 | slug | 内容 | ラボ |
|---|---|---|---|
| 1 | `/ch/intro` | 機械学習入門：教師あり/なし・最小2乗法・過学習・モデル選択・正則化・次元の呪い | 6 |
| 2 | `/ch/probability` | 確率・統計の要点：公理・同時/周辺/条件つき・ベイズの定理・ガウス分布・大数の法則・中心極限定理 | 5 |
| 3 | `/ch/probabilistic-model` | 確率モデル（＋古典的な学習）：尤度・最尤推定・MAP・共役事前分布・演習3問の解答 | 5 |
| 4 | `/ch/loss` | 損失と誤差関数：期待損失・経験損失・汎化 | 2 |
| 5 | `/ch/decision` | 決定理論：回帰/分類のベイズ決定則・誤分類率 | 2 |
| 6 | `/ch/evaluation` | 評価指標：RMSE/MAE・混同行列・適合率/再現率/F値・ROC-AUC | 2 |

- `/` ホーム（キネティックタイポグラフィのヒーロー、学び方インフォグラフィック、講義一覧）
- `/notes` 公式ノート（全章の公式を検索可能）

## 機能
- 対話バブルが順番に出てくる演出、式の部品ハイライト（チップにホバー）
- Canvas ラボ 22 個（スライダー／ドラッグ／アニメーション）
- 確認クイズ（正解で紙吹雪）、ステップ解答つき演習
- 文字単位のキネティックタイポグラフィ、スクロール連動の文言、ページ遷移ワイプ、カスタムカーソル、マグネティックボタン、3D チルトカード
- 読了状況を localStorage に保存（目次の進捗バー・カードの「読了」）
- `prefers-reduced-motion` 対応、レスポンシブ（390px〜）

## UI パターン（学習導線に組み込み済み）
| パターン | 場所 | 使い方 |
|---|---|---|
| Auto Complete | ヘッダー検索（`⌘K` / `Ctrl K` / `/`）、公式ノートの検索欄 | 用語・講義・セクション・ラボ・公式・演習を横断。ひらがな/英語でもヒット、↑↓/Enter/Tab補完、最近の検索 |
| Bottom Sheet | 本文の太字用語をタップ → 用語解説／スマホの「目次」ボタン／公式カードのタップ | ドラッグで半分⇄全画面・下に払って閉じる、Esc・フォーカストラップ対応 |
| Swipe Action | 公式ノートのカード | 右スワイプ＝★保存、左スワイプ＝✓覚えた（PCはクリック or `S`/`L`）。暗記率リングとフィルタタブ |
| Toast | クイズ正誤・保存・ラボの到達 | アイコン・残り時間バー・「元に戻す」・ホバーで一時停止・スワイプで消去・最大3件 |
| Skeleton Screen | ページ遷移時／各ラボの読み込み時 | 紙色シマー＋対話バブルの骨組み、ラボは3色ドット |
| Pull to Refresh | スマホでページ最上部から下に引く | ホーム：「今日の1問」を入れ替え／章ページ：ラボをリセット |

保存データ（単語帳・覚えた・最近の検索・読了）はすべて localStorage。用語集は `chapters/glossary.js`（約70語）。

## 章の追加方法
1. `public/static/js/chapters/chN.js` を作る（既存章と同じ構造：`sections[].blocks[]`）
   - ブロック型：`talk` `formula` `lab` `point` `quiz` `exer` `compare` `flow` `kinetic` `html`
2. 新しいラボが必要なら `public/static/js/labs/` に関数を追加し、`labs/index.js` に登録
3. `chapters/index.js` の `CHAPTERS` に追加
4. 新出用語を `chapters/glossary.js` に追加（本文の太字が自動で用語リンクになる）

## 技術構成
- Hono（Cloudflare Pages）で SPA シェルを返し、フロントは素の ES Modules
- CDN：GSAP + ScrollTrigger、KaTeX、Google Fonts（Zen Maru Gothic / Fredoka / Yomogi / DM Mono）
- データ保存なし（進捗のみ localStorage）

## 開発
```bash
npm run build
pm2 start ecosystem.config.cjs   # http://localhost:3000
```

## 未実装 / 次のステップ
- 第7回以降の講義プリントの反映
- 章末の総合ミニテスト、用語集ページ
- デプロイ（Cloudflare Pages）

講義資料 © OkadomeLab。本サイトは学習用の非公式ノートです。
