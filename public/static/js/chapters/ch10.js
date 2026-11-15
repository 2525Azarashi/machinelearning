const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 10, slug: 'bayes-model-comparison', en: 'BAYES MODEL SELECTION', color: '#FFD66B',
  title: 'ベイズモデル比較',
  sub: '確認用データがなくても、複雑すぎるモデルは自然に負ける。',
  lead: '「モデル」と「モデル集合」、モデルエビデンス（周辺尤度）、そしてフィット度と複雑さペナルティの自動トレードオフ。',
  src: 'ML02_4_bayes_model_comparison',
  goals: ['「モデル」と「モデル集合」の違い', 'ベイズモデル選択とモデルエビデンス', 'ラプラス的な1次元近似（Δw_post / Δw_prior）', 'M パラメータへの拡張とペナルティ項', '確認用データが不要になる理由'],
  icon: 'peak',
  sections: [
    {
      id: 'terms', title: '「モデル」と「モデル集合」：言葉を正確に分ける',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`1章では「過学習を防ぐために確認用データを別に取っておいて次数 $M$ を選ぶ」って習いましたよね。でもデータがもったいないって言ってたような……`],
          [S, 'happy', r`よく覚えてる！ **ベイズ推論の枠組み**を使うと、実は確認用データを用意しなくても、学習データだけで過学習を防ぎながらモデル選択ができるんだ！`],
          [S, 'normal', r`その仕組みを見るために、まず「モデル」と「モデル集合」という言葉をきっちり区別しよう。`],
        ] },
        { t: 'compare', items: [
          { em: '🎯', title: 'モデル', items: [
            r`**特定のパラメータ値**で記述された1本の式`,
            r`例：$y = 2.1x^2 - 0.5x + 1.0$`,
          ] },
          { em: '🗂️', title: 'モデル集合 $\\mathcal M_i$', items: [
            r`パラメータを動かして作れる**式の集合**（モデル族）`,
            r`例：$\mathcal M_3 = \{w_2 x^2 + w_1 x + w_0 \mid \mathbf w\in\mathbb R^3\}$`,
            r`**モデル比較・モデル選択**とは、モデル集合どうしを比べて1つの $\mathcal M_i$ を選ぶこと！`,
          ] },
        ] },
      ],
    },
    {
      id: 'evidence', title: 'ベイズモデル選択とモデルエビデンス',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`$L$ 個のモデル集合 $\{\mathcal M_1,\dots,\mathcal M_L\}$（たとえばパラメータ数 $i$ のモデル集合）を比べるとしよう。観測データ $\mathcal D$ を見た後のモデル集合の事後確率はベイズの定理でこう書けるよ。`],
        ] },
        { t: 'formula', title: 'モデル集合の事後確率とモデルエビデンス', tag: 'EVIDENCE',
          tex: r`p(\mathcal M_i\mid\mathcal D) = \frac{\htmlClass{fp-ev}{p(\mathcal D\mid\mathcal M_i)}\;\htmlClass{fp-mp}{p(\mathcal M_i)}}{p(\mathcal D)}, \qquad \htmlClass{fp-ev}{p(\mathcal D\mid\mathcal M_i)} = \int p(\mathcal D\mid\mathbf w,\mathcal M_i)\,p(\mathbf w\mid\mathcal M_i)\,d\mathbf w`,
          parts: [
            ['fp-mp', 'モデル集合の事前確率 $p(\\mathcal M_i)$', 'どのモデル集合も事前にえこひいきしない（一様）と仮定すれば定数になる。'],
            ['fp-ev', 'モデルエビデンス $p(\\mathcal D\\mid\\mathcal M_i)$', 'パラメータ $\\mathbf w$ をすべて積分消去した**周辺尤度**。「モデル集合 $\\mathcal M_i$ 全体として、手元のデータ $\\mathcal D$ をどれくらい生成しやすいか」を表す！'],
          ],
          note: '$p(\\mathcal M_i)$ が一様なら、事後確率最大 $\\iff$ **モデルエビデンス $p(\\mathcal D\\mid\\mathcal M_i)$ 最大**のモデル集合を選べばよい！' },
        { t: 'talk', lines: [
          [R, 'think', r`あれ？ 最尤推定のときは「複雑なモデルほど尤度がいくらでも大きくなるからダメ」でしたよね。エビデンスだとどうして過学習しないんですか？`],
          [S, 'wink', r`秘密は「$\mathbf w$ で**積分（平均）**していること」！ 複雑なモデルはいろんなデータを作れるぶん、確率の合計は 1 に決まっているから、**1つひとつのデータに対する確率が薄まっちゃう**んだ（オッカムの剃刀）。式で確かめてみよう！`],
        ] },
      ],
    },
    {
      id: 'approx', title: 'エビデンスの近似：フィット度 vs 複雑さペナルティ',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`まずパラメータが1個だけのモデル集合 $\mathcal M_1$ で考えよう。事前分布 $p(w\mid\mathcal M_1)$ が幅 $\Delta w_{\mathrm{pri}}$ で平坦（高さ $1/\Delta w_{\mathrm{pri}}$）で、事後分布が $w_{\mathrm{MAP}}$ のまわりの狭い幅 $\Delta w_{\mathrm{post}}$ に集中していると仮定するよ。`],
          [R, 'wow', r`すると積分 $\int p(\mathcal D\mid w)p(w)dw$ は、「山の高さ × 幅」の長方形の面積で近似できますね！`],
        ] },
        { t: 'formula', title: 'モデルエビデンスの近似（M 個のパラメータ）', tag: 'KEY',
          tex: r`p(\mathcal D\mid\mathcal M_M) \approx p(\mathcal D\mid\mathbf w_{\mathrm{MAP}},\mathcal M_M)\!\left(\frac{\Delta w_{\mathrm{post}}}{\Delta w_{\mathrm{pri}}}\right)^{\!M} \;\;\Longrightarrow\;\; \ln p(\mathcal D\mid\mathcal M_M) \approx \htmlClass{fp-fit}{\ln p(\mathcal D\mid\mathbf w_{\mathrm{MAP}},\mathcal M_M)} \;+\; \htmlClass{fp-pen}{M\ln\!\left(\frac{\Delta w_{\mathrm{post}}}{\Delta w_{\mathrm{pri}}}\right)}`,
          parts: [
            ['fp-fit', '第1項：データへのフィット度', '$M$ を大きく（モデルを複雑に）するほど、MAP解がデータによく合って**大きくなる**。'],
            ['fp-pen', '第2項：複雑さのペナルティ（負！）', '事後の幅は事前の幅より狭い（$\\Delta w_{\\mathrm{post}} < \\Delta w_{\\mathrm{pri}}$）ので $\\ln(\\Delta w_{\\mathrm{post}}/\\Delta w_{\\mathrm{pri}}) < 0$！ パラメータ数 $M$ に比例して**マイナスが大きくなる**。'],
          ] },
        { t: 'lab', id: 'occamsRazor', title: 'モデルエビデンスのトレードオフを体験しよう', foot: 'パラメータ数 $M$ や事後/事前の幅の比 $\\Delta w_{\\mathrm{post}}/\\Delta w_{\\mathrm{pri}}$ を動かそう。第1項（フィット度・緑）と第2項（ペナルティ・赤）の和である対数エビデンス（黒線）が「ちょうどいい $M$」でピークをもつ！' },
        { t: 'kinetic', words: ['フィット度', ['＋', 'pop3'], ['複雑さペナルティ', 'pop'], '＝', ['自動でちょうどいい M。', 'pop2']], sub: '— 確認用データなしで過学習を防げる理由。' },
        { t: 'quiz', q: 'モデルエビデンスの近似式において、$\\Delta w_{\\mathrm{post}} < \\Delta w_{\\mathrm{pri}}$ のとき第2項 $M\\ln(\\Delta w_{\\mathrm{post}}/\\Delta w_{\\mathrm{pri}})$ の符号はどうなる？',
          options: ['つねに正（$+$）', 'つねに負（$-$）で、$M$ が増えるほどペナルティが強まる', '0 になる'],
          answer: 1,
          explain: r`$0 < \Delta w_{\mathrm{post}}/\Delta w_{\mathrm{pri}} < 1$ なのでその対数は負になります。これにパラメータ数 $M$ が掛かるため、複雑なモデルほど強いペナルティが自動的に課されます。` },
        { t: 'point', tone: 'mint', title: '第10章のまとめ', items: [
          '**モデル**は特定のパラメータ値の式、**モデル集合** $\\mathcal M_i$ はパラメータで張られる式の集合。モデル選択とはモデル集合を選ぶこと。',
          'ベイズモデル選択では、周辺尤度である**モデルエビデンス** $p(\\mathcal D\\mid\\mathcal M_i)=\\int p(\\mathcal D\\mid\\mathbf w,\\mathcal M_i)p(\\mathbf w\\mid\\mathcal M_i)d\\mathbf w$ が最大のモデル集合を選ぶ。',
          '対数エビデンスは「MAP解のフィット度」＋「負の複雑さペナルティ $M\\ln(\\Delta w_{\\mathrm{post}}/\\Delta w_{\\mathrm{pri}})$」に分解でき、両者のトレードオフで過学習が自然に防がれる。',
          'そのため、データを削って**確認用データを別に用意する必要がない**！',
        ] },
      ],
    },
  ],
  notes: [
    { h: 'ベイズモデル選択', f: r`p(\mathcal M_i\mid\mathcal D)\propto p(\mathcal D\mid\mathcal M_i)\,p(\mathcal M_i)` },
    { h: 'モデルエビデンス（周辺尤度）', f: r`p(\mathcal D\mid\mathcal M_i)=\int p(\mathcal D\mid\mathbf w,\mathcal M_i)\,p(\mathbf w\mid\mathcal M_i)\,d\mathbf w` },
    { h: '対数エビデンスの近似（オッカム因子）', f: r`\ln p(\mathcal D\mid\mathcal M_M)\approx \ln p(\mathcal D\mid\mathbf w_{\mathrm{MAP}},\mathcal M_M)+M\ln\!\left(\frac{\Delta w_{\mathrm{post}}}{\Delta w_{\mathrm{pri}}}\right)`, p: '$\\Delta w_{\\mathrm{post}}<\\Delta w_{\\mathrm{pri}}$ より第2項は負のペナルティ項。' },
  ],
}
