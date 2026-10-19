const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 3, slug: 'probabilistic-model', en: 'PROBABILISTIC MODEL', color: '#B9A7FF',
  title: '確率モデル',
  sub: 'データは「確率変数の実現値」。だから学習は「分布の推定」になる。',
  lead: '尤度・最尤推定・ベイズ推論・MAP推定・共役事前分布。最小2乗と正則化の正体がわかる回。',
  src: 'ML01_3_probabilistic_model (+classic)',
  goals: ['確率モデルと i.i.d.', '尤度と最尤推定', '最尤 ＝ 最小2乗', 'MAP ＝ 正則化', '共役事前分布'],
  icon: 'peak',
  sections: [
    {
      id: 'model', title: '確率モデル：ノイズを式に入れる',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`1章では「誤差の2乗和を最小に」って決めましたけど、なんで2乗なんですか？ 絶対値じゃダメ？`],
          [S, 'happy', r`それに答えるのが今回。ポイントは、ノイズを**確率変数**として式に書き込むこと。`],
        ] },
        { t: 'formula', title: '1次元線形回帰の確率モデル', tex: r`\htmlClass{fp-t}{t} = \htmlClass{fp-w}{w}\,\htmlClass{fp-x}{x} + \htmlClass{fp-e}{\varepsilon}, \qquad \varepsilon \sim \mathcal N(0, \sigma^2)`,
          parts: [['fp-t', '目標変数 $t$', '確率変数（$\\varepsilon$ を含むので）。'], ['fp-w', 'モデルパラメータ $w$', '推定したい値。'], ['fp-x', '説明変数 $x$', '非確率変数（実験者が決める）。'], ['fp-e', '誤差項 $\\varepsilon$', 'ノイズ。確率変数。']], note: '確率変数を含む数式で表現されるモデルを**確率モデル**という。$t$ の分布は $p(t\\mid x,w,\\sigma^2)=\\mathcal N(t\\mid wx,\\sigma^2)$。' },
        { t: 'lab', id: 'generative', title: '同じモデルから、毎回ちがうデータが生まれる', foot: 'モデル（＝分布）が先にあって、データはそこから**生成された実現値**。学習はこの逆向き：データから分布を当てる。' },
        { t: 'talk', lines: [
          [S, 'normal', r`データについての大事な仮定が **i.i.d.（独立同分布）**。ノイズ $\varepsilon_1,\dots,\varepsilon_N$ がそれぞれ独立で、どれも同じ分布をもつってこと。`],
          [R, 'happy', r`独立なら、同時確率は1個ずつの確率の**掛け算**になりますね！`],
        ] },
        { t: 'formula', title: '独立同分布 (i.i.d.)', tex: r`p(x_1,\dots,x_m) = q(x_1)\,q(x_2)\cdots q(x_m) = \prod_{i=1}^{m} q(x_i)` },
        { t: 'compare', items: [
          { em: '🧮', title: '最尤推定法（頻度主義）', items: ['パラメータは**決まった値**をもつ', 'データが出る確率（尤度）を最大にする値を選ぶ', '推定値の誤差は実験の繰り返しで評価'] },
          { em: '🌈', title: 'ベイズ推論（ベイジアン）', items: ['パラメータも**確率変数**で分布をもつ', 'ベイズの定理で**事後確率**を求める', '1回こっきりの不確実さも扱える'] },
        ] },
      ],
    },
    {
      id: 'ml', title: '尤度と最尤推定',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`**尤度**（ゆうど）は、==モデルのもとで、手元のデータが独立に生成される確率==。データは固定された数値だから、尤度はパラメータ $w,\sigma^2$ の**関数**になる。`],
        ] },
        { t: 'formula', title: '尤度関数', tex: r`p(\mathbf t\mid \mathbf x, w, \sigma^2) = \prod_{n=1}^{N}\mathcal N(t_n \mid w x_n, \sigma^2)`, note: 'これを最大にする $w,\\sigma^2$ を求めることを**最尤推定**という。' },
        { t: 'lab', id: 'likelihood', title: '尤度の山を登る', foot: '各データ点の位置での密度（赤いバー）を全部かけ算したものが尤度。直線をデータに近づけるとバーがそろって長くなる。' },
        { t: 'talk', lines: [
          [R, 'think', r`かけ算だと数がすごく小さくなって扱いにくそう……`],
          [S, 'wink', r`だから**対数**をとる。対数は単調増加だから、最大になる $w$ の場所は変わらない。しかも積が和になって計算がラク。`],
        ] },
        { t: 'formula', title: '対数尤度', tag: 'KEY', tex: r`\ln p(\mathbf t\mid w) = \htmlClass{fp-se}{-\frac{1}{2\sigma^2}\sum_{n=1}^{N}(t_n - w x_n)^2} \;\htmlClass{fp-c}{-\;\frac N2\ln\sigma^2 - \frac N2\ln 2\pi}`,
          parts: [['fp-se', '$-\\frac{1}{\\sigma^2}\\times$ 2乗和誤差', '$w$ に関係するのはここだけ。マイナスがついているので「最大化」＝「2乗和誤差の最小化」。'], ['fp-c', '定数', '$\\sigma^2$ を既知とすれば $w$ に無関係な定数。']] },
        { t: 'kinetic', words: ['ガウスノイズの', ['最尤推定', 'pop3'], '＝', ['最小2乗法', 'pop']], sub: '— 2乗する理由は「ノイズがガウス分布だから」。' },
        { t: 'exer', title: '演習：最尤推定', q: r`モデル $t = wx + \varepsilon,\ \varepsilon\sim\mathcal N(0,\sigma^2)$ と $N$ 個の観測データ $\{(x_n,t_n)\}$ について、<br>(1) 対数尤度が $\ln p(\mathbf t\mid w) = -\frac{1}{2\sigma^2}\sum_n (t_n-wx_n)^2 - \frac N2\ln(2\pi\sigma^2)$ であることを示せ。<br>(2) 対数尤度を最大にする $w$ が $w_{ML}=\dfrac{\sum_n x_nt_n}{\sum_n x_n^2}$ であることを、$w$ で微分して 0 とおいて示せ。`,
          hint: r`$\ln\prod = \sum\ln$、$\ln \mathcal N(t\mid m,\sigma^2) = -\frac{(t-m)^2}{2\sigma^2} - \frac12\ln(2\pi\sigma^2)$。`,
          steps: [
            r`独立性より尤度は積：$p(\mathbf t\mid w)=\prod_{n}\frac{1}{\sqrt{2\pi\sigma^2}}\exp\!\left\{-\frac{(t_n-wx_n)^2}{2\sigma^2}\right\}$`,
            r`対数をとると積が和に：$\ln p = \sum_n\left\{-\frac{(t_n-wx_n)^2}{2\sigma^2} - \frac12\ln(2\pi\sigma^2)\right\}$`,
            r`$= -\frac{1}{2\sigma^2}\sum_n(t_n-wx_n)^2 - \frac N2\ln(2\pi\sigma^2)$。これで (1)。`,
            r`(2) $w$ で微分：$\dfrac{\partial}{\partial w}\ln p = -\frac{1}{2\sigma^2}\sum_n 2(t_n-wx_n)(-x_n) = \frac{1}{\sigma^2}\sum_n(t_n-wx_n)x_n$`,
            r`$=0$ とおくと $\sum_n x_nt_n - w\sum_n x_n^2 = 0$`,
            r`よって $w_{ML} = \dfrac{\sum_n x_nt_n}{\sum_n x_n^2}$。（2階微分 $=-\sum x_n^2/\sigma^2<0$ なので最大。）1章の最小2乗解と一致！`,
          ] },
      ],
    },
    {
      id: 'ml-problem', title: '最尤推定の弱点',
      blocks: [
        { t: 'talk', lines: [
          [S, 'think', r`最尤推定にも弱点がある。コインを3回投げて**3回とも表**だったとしよう。表の確率 $\theta$ の最尤推定値は？`],
          [R, 'think', r`尤度は $\theta^3$ だから……$\theta=1$ で最大。「このコインは絶対に表しか出ない」！？`],
          [S, 'normal', r`そう、データが少ないと**過学習**する。それから、複雑なモデルほど尤度はいくらでも大きくなるから、**モデル選択にも使えない**。`],
        ] },
        { t: 'point', title: '最尤推定の問題点', items: ['**過学習**：データが少ないと極端な値を出す（3回表 → $\\theta_{ML}=1$）。', '**モデル選択に使えない**：多項式の次数を上げるほど尤度は増え続ける。'] },
      ],
    },
    {
      id: 'bayes', title: 'ベイズ推論：パラメータにも分布を',
      blocks: [
        { t: 'talk', lines: [
          [S, 'happy', r`ベイズの立場では、パラメータ $w$ にも**不確実さ**があると考えて、確率変数として扱う。そしてデータを見た後の $w$ の分布＝**事後確率**を求めるのが目標。`],
        ] },
        { t: 'formula', title: 'パラメータの事後確率', tag: 'BAYES', tex: r`\htmlClass{fp-post}{p(w\mid \mathcal D)} = \frac{\htmlClass{fp-lik}{p(\mathcal D\mid w)}\;\htmlClass{fp-pri}{p(w)}}{\htmlClass{fp-z}{p(\mathcal D)}} \;\propto\; \text{尤度}\times\text{事前確率}`,
          parts: [['fp-post', '事後確率', 'データ $\\mathcal D$ を見た後の $w$ の分布。'], ['fp-lik', '尤度', 'さっきの最尤推定で最大化したもの。'], ['fp-pri', '事前確率', '$w$ についての事前知識。例：$p(w)=\\mathcal N(w\\mid0,\\alpha^2)$。$\\alpha$ は**超パラメータ**。'], ['fp-z', '正規化係数', '$\\int p(\\mathcal D|w)p(w)dw$。ベイズはこの計算との戦い。']] },
        { t: 'lab', id: 'coin', opts: { a: 2, b: 2 }, title: 'コイン投げ：最尤 vs ベイズ', foot: 'はじめに「表」を3回押してみて。最尤推定（赤線）は 1 に張りつくが、事後分布（緑）は事前分布のおかげで落ち着いている。' },
        { t: 'talk', lines: [
          [R, 'wow', r`事前分布がいかりみたいになって、極端な値に飛びつかない！`],
          [S, 'happy', r`それが**ベイズの利点**。過学習を起こしにくい（ただし超パラメータ次第）。さらに5章で見る**最適な決定**もできる。`],
          [S, 'think', r`ただし難点もある。事後確率の分母 $p(\mathcal D)=\int p(\mathcal D\mid w)p(w)\,dw$ の積分が、たいてい計算できないんだ。`],
        ] },
        { t: 'flow', nodes: [
          { em: '⛰', t: 'MAP推定', s: '分布はあきらめ、事後確率の最大点だけ', bg: '#FFE3D6' },
          { em: '🧩', t: '共役事前分布', s: '事後も同じ形になる事前を選ぶ', bg: '#ECE6FF' },
          { em: '🪄', t: '変分ベイズ', s: '近似分布を求める', bg: '#D7F5EC' },
          { em: '🎰', t: 'サンプリング', s: 'たくさん生成して形を見る', bg: '#FFF4CC' },
        ] },
      ],
    },
    {
      id: 'map', title: 'MAP推定 ＝ 正則化最小2乗',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`**MAP推定（最大事後確率推定）**は“半ベイズ”。分母は $w$ に関係ない定数だから、最大化には無関係。==尤度 × 事前確率を最大にする $w$ ==だけ求める。`],
        ] },
        { t: 'formula', title: '対数事後確率', tex: r`\ln p(w\mid\mathcal D) = \htmlClass{fp-se}{-\frac{1}{2\sigma^2}\sum_{n}(t_n - wx_n)^2} \;\htmlClass{fp-reg}{-\;\frac{1}{2\alpha^2}w^2} + \text{const.}`,
          parts: [['fp-se', '対数尤度', '$-\\frac{1}{\\sigma^2}\\times$ 2乗和誤差。'], ['fp-reg', '対数事前確率', '$p(w)=\\mathcal N(0,\\alpha^2)$ から。これがまさに**正則化項**！']], note: '$\\sigma^2$ 倍して符号を反転すると $\\frac12\\sum(t_n-wx_n)^2 + \\frac{\\lambda}{2}w^2,\\ \\lambda=\\sigma^2/\\alpha^2$ の最小化と同じ。' },
        { t: 'lab', id: 'mapreg', title: '事前分布の強さで w が引き戻される', foot: '赤＝尤度、点線紫＝事前分布、緑＝事後分布（それぞれ最大値を 1 にそろえて表示）。' },
        { t: 'kinetic', words: ['ガウス事前の', ['MAP推定', 'pop3'], '＝', ['正則化', 'pop'], ['最小2乗法', 'pop2']], sub: '— 1章の λ は「w は 0 の近くだろう」という事前の思い込みだった。' },
        { t: 'exer', title: '演習：最大事後確率推定', q: r`モデル $t=wx+\varepsilon,\ \varepsilon\sim\mathcal N(0,\sigma^2)$、データ $\{(x_n,t_n)\}_{n=1}^N$、$w$ の事前分布を $p(w)=\mathcal N(w\mid 0,\alpha^2)$（$\alpha$ は決まった超パラメータ）とする。$w$ の MAP 推定量を求めよ。`,
          hint: r`$\ln p(\mathbf t\mid w) + \ln p(w)$ を $w$ で微分して 0 とおく。`,
          steps: [
            r`事後 ∝ 尤度 × 事前 なので、最大化する関数は $F(w)=\ln p(\mathbf t\mid w)+\ln p(w)$`,
            r`$F(w) = -\frac{1}{2\sigma^2}\sum_n(t_n-wx_n)^2 - \frac{1}{2\alpha^2}w^2 + (\text{$w$ に無関係な定数})$`,
            r`微分：$F'(w) = \frac{1}{\sigma^2}\sum_n(t_n-wx_n)x_n - \frac{w}{\alpha^2}$`,
            r`$F'(w)=0$ の両辺に $\sigma^2$ をかけて：$\sum_n x_nt_n - w\sum_n x_n^2 - \frac{\sigma^2}{\alpha^2}w = 0$`,
            r`$w_{MAP} = \dfrac{\sum_n x_nt_n}{\sum_n x_n^2 + \sigma^2/\alpha^2}$`,
            r`分母に $\sigma^2/\alpha^2>0$ が足されるぶん、$|w_{MAP}|<|w_{ML}|$：0 側に縮む。$\alpha\to\infty$（事前が平ら）で $w_{ML}$ に一致。`,
          ] },
      ],
    },
    {
      id: 'conj', title: '共役事前分布',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`もう一つの分母回避テクニックが**共役事前分布**。事後分布が事前分布と**同じ形**になるような事前分布を選ぶの。`],
          [R, 'think', r`同じ形だと何がうれしいんですか？`],
          [S, 'happy', r`正規化係数が公式で一発で書ける！ 積分しなくていい。たとえばベルヌイ分布の尤度 $\theta^x(1-\theta)^{1-x}$ は、$\theta$ の関数として見ると**ベータ分布と同じ形**をしてる。`],
        ] },
        { t: 'formula', title: 'ベルヌイ × ベータ ＝ ベータ', tex: r`\underbrace{\theta^{x}(1-\theta)^{1-x}}_{\text{尤度}}\;\times\;\underbrace{\frac{\theta^{\alpha-1}(1-\theta)^{\beta-1}}{B(\alpha,\beta)}}_{\text{事前 Beta}(\alpha,\beta)} \;\propto\; \theta^{\alpha+x-1}(1-\theta)^{\beta+(1-x)-1}`, note: '事後は $\\mathrm{Beta}(\\alpha+x,\\ \\beta+1-x)$。正規化係数は計算するまでもなく $1/B(\\alpha+x,\\beta+1-x)$。' },
        { t: 'compare', items: [
          { em: '🪙', title: 'ベルヌイ ↔ ベータ', items: ['尤度：ベルヌイ分布', '事前・事後：ベータ分布', 'パラメータに「表の回数」「裏の回数」を足すだけ'] },
          { em: '🎲', title: 'カテゴリカル ↔ ディリクレ', items: ['尤度：カテゴリカル分布', '事前・事後：ディリクレ分布', '$\\alpha_k$ が小さいと偏りを好み、大きいと均等を好む'] },
          { em: '🔔', title: 'ガウス ↔ ガウス', items: ['尤度：ガウス分布（分散固定）', '平均パラメータの事前・事後：ガウス分布'] },
        ] },
        { t: 'lab', id: 'conjugate', title: 'ガウスの平均をデータで逐次更新', foot: '点線紫＝事前分布、緑＝事後分布、黄色の点＝データ。データを足すたびに山が真の μ に寄って細くなる。' },
        { t: 'exer', title: '演習：共役事前分布', q: r`(1) データ $\mathcal D=\{\mathbf x_1,\dots,\mathbf x_N\}$（one-hot）がカテゴリカル分布 $p(\mathbf x\mid\boldsymbol\theta)=\prod_k\theta_k^{x_k}$ から生成されるとし、事前分布をディリクレ分布 $\mathrm{Dir}(\boldsymbol\theta\mid\boldsymbol\alpha)\propto\prod_k\theta_k^{\alpha_k-1}$ とする。事後分布が $\mathrm{Dir}(\boldsymbol\theta\mid\alpha_1+m_1,\dots,\alpha_K+m_K)$（$m_k$ はクラス $k$ の出現回数）となることを示せ。<br>(2) データ $x_1,\dots,x_N$ が $\mathcal N(\mu,1)$ から生成され、$\mu$ の事前分布が $\mathcal N(\mu_0,\sigma_0^2)$ のとき、$\mu$ の事後分布を求めよ。`,
          hint: r`(1) 尤度は $\prod_n\prod_k\theta_k^{x_{nk}}=\prod_k\theta_k^{m_k}$。(2) 指数の中を $\mu$ について平方完成。`,
          steps: [
            r`(1) 尤度：$p(\mathcal D\mid\boldsymbol\theta)=\prod_{n}\prod_k\theta_k^{x_{nk}}=\prod_k\theta_k^{\sum_n x_{nk}}=\prod_k\theta_k^{m_k}$`,
            r`事後 ∝ 尤度 × 事前 $=\prod_k\theta_k^{m_k}\cdot\prod_k\theta_k^{\alpha_k-1}=\prod_k\theta_k^{(\alpha_k+m_k)-1}$`,
            r`これはパラメータ $\alpha_k+m_k$ のディリクレ分布の形。正規化係数も $\dfrac{\Gamma(\sum_k(\alpha_k+m_k))}{\prod_k\Gamma(\alpha_k+m_k)}$ と公式で決まる。■`,
            r`(2) 事後 ∝ $\exp\!\left\{-\frac12\sum_n(x_n-\mu)^2\right\}\exp\!\left\{-\frac{(\mu-\mu_0)^2}{2\sigma_0^2}\right\}$`,
            r`指数の中の $\mu$ の2次・1次の項を集める：$-\frac12\left(N+\frac{1}{\sigma_0^2}\right)\mu^2 + \left(\sum_n x_n + \frac{\mu_0}{\sigma_0^2}\right)\mu + \text{const.}$`,
            r`平方完成すると $\mathcal N(\mu\mid\mu_N,\sigma_N^2)$、ただし $\dfrac{1}{\sigma_N^2}=N+\dfrac{1}{\sigma_0^2}$、$\mu_N=\sigma_N^2\left(\dfrac{\mu_0}{\sigma_0^2}+\sum_n x_n\right)=\dfrac{\mu_0+\sigma_0^2\sum_n x_n}{1+N\sigma_0^2}$`,
            r`$N\to\infty$ で $\mu_N\to$ サンプル平均、$\sigma_N^2\to0$。ラボの挙動と一致。`,
          ] },
        { t: 'point', tone: 'lav', title: '第3章のまとめ', items: ['確率モデル：$t=wx+\\varepsilon$。データは確率変数の実現値（i.i.d.）。', '最尤推定：尤度 $\\prod_n p(t_n|w)$ を最大化。ガウスノイズなら**最小2乗法と等価**。', '最尤推定は少数データで過学習し、モデル選択にも使えない。', 'ベイズ：事後 ∝ 尤度 × 事前。分母（正規化係数）の計算が難所。', 'MAP推定：ガウス事前なら**正則化最小2乗法と等価**（$\\lambda=\\sigma^2/\\alpha^2$）。', '共役事前分布：事後が事前と同じ形 → 正規化係数が公式で求まる。'] },
      ],
    },
  ],
  notes: [
    { h: '確率モデル', f: r`t=wx+\varepsilon,\ \varepsilon\sim\mathcal N(0,\sigma^2)` },
    { h: 'i.i.d.', f: r`p(x_1,\dots,x_m)=\prod_i q(x_i)` },
    { h: '尤度', f: r`p(\mathbf t|w,\sigma^2)=\prod_n\mathcal N(t_n|wx_n,\sigma^2)` },
    { h: '対数尤度', f: r`\ln p=-\frac{1}{2\sigma^2}\sum_n(t_n-wx_n)^2-\frac N2\ln(2\pi\sigma^2)` },
    { h: '最尤推定量', f: r`w_{ML}=\frac{\sum_n x_nt_n}{\sum_n x_n^2}`, p: '最小2乗解と一致。' },
    { h: 'ベイズの定理（パラメータ）', f: r`p(w|\mathcal D)=\frac{p(\mathcal D|w)p(w)}{p(\mathcal D)}` },
    { h: 'MAP推定量', f: r`w_{MAP}=\frac{\sum_n x_nt_n}{\sum_n x_n^2+\sigma^2/\alpha^2}`, p: '事前 $\\mathcal N(0,\\alpha^2)$。正則化 $\\lambda=\\sigma^2/\\alpha^2$。' },
    { h: 'ベータ–ベルヌイ共役', f: r`\mathrm{Beta}(\alpha,\beta)\xrightarrow{x}\mathrm{Beta}(\alpha+x,\beta+1-x)` },
    { h: 'ディリクレ–カテゴリカル共役', f: r`\mathrm{Dir}(\boldsymbol\alpha)\xrightarrow{\mathcal D}\mathrm{Dir}(\boldsymbol\alpha+\mathbf m)` },
    { h: 'ガウス平均の事後', f: r`\frac1{\sigma_N^2}=N+\frac1{\sigma_0^2},\ \mu_N=\sigma_N^2\Big(\frac{\mu_0}{\sigma_0^2}+\sum_n x_n\Big)`, p: '観測ノイズ分散 1 のとき。' },
  ],
}
