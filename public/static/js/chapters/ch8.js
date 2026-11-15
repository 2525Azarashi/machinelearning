const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 8, slug: 'density-estimation', en: 'DENSITY ESTIMATION', color: '#6FD6B8',
  title: '確率密度関数の推定',
  sub: '散らばった点から、データが生まれる「元の山」を復元する。',
  lead: '1次元・多次元ガウス分布の最尤推定とベイズ推論。ガンマ分布・ガウス-ガンマ分布・ウィッシャート分布まで一気見。',
  src: 'ML02_1/2_probability_denstity_estimation_param (+classic)',
  goals: ['パラメトリック vs ノンパラメトリック', '1次元・多次元ガウス分布の最尤推定', '平均 μ のベイズ推論（アンカー効果）', '精度 λ のベイズ推論とガンマ分布', 'ガウス-ガンマ分布とウィッシャート分布'],
  icon: 'bell',
  sections: [
    {
      id: 'intro', title: '確率密度推定：パラメトリック vs ノンパラメトリック',
      blocks: [
        { t: 'talk', lines: [
          [S, 'happy', r`ここから **Part II パラメトリックモデル** に入るよ！ 5章の決定理論で「同時確率 $p(\mathbf x,t)$ や事後確率 $p(C_k\mid\mathbf x)$ がわかれば最適な決定ができる」って学んだよね。`],
          [R, 'normal', r`はい！ でも「それらの確率は神のみぞ知るだから、データから推測する」って話でした！`],
          [S, 'normal', r`そう。与えられたデータ $X=(\mathbf x_1,\dots,\mathbf x_N)^{\mathsf T}$ に対して、それを生成した確率密度関数 $p(\mathbf x)$ を推定することを**確率密度推定**というよ。大きく2つの流儀があるんだ。`],
        ] },
        { t: 'compare', items: [
          { em: '🎛️', title: 'パラメトリックな手法', items: [
            r`ガウス分布やガンマ分布など、データが生成される**分布の族**をあらかじめ仮定する`,
            r`データに合うように少数の**パラメータ**（$\boldsymbol\mu,\Sigma$ など）を推定する`,
            r`Part II の主役！`,
          ] },
          { em: '🌊', title: 'ノンパラメトリックな手法', items: [
            r`特定の分布族を仮定しない`,
            r`与えられたデータそのものに合わせて柔軟に分布の形を作っていく`,
            r`ヒストグラム・カーネル密度推定・$k$近傍法など`,
          ] },
        ] },
        { t: 'point', title: 'Part II の記法（Notation）', items: [
          r`ベクトルは断りがない限り**列ベクトル**：$\mathbf x = (x_1,\dots,x_D)^{\mathsf T}$。`,
          r`$N$ 個の $D$ 次元観測データ $\mathbf x_1,\dots,\mathbf x_N$ を並べた $N\times D$ 行列を $X = (\mathbf x_1\ \cdots\ \mathbf x_N)^{\mathsf T}$（第 $n$ 行が $\mathbf x_n^{\mathsf T}$）と書く。`,
          r`$N$ 個のスカラー観測値を並べた列ベクトルは太字小文字 $\mathbf x = (x_1,\dots,x_N)^{\mathsf T}$ と書く（フォントに注意！）。`,
        ] },
      ],
    },
    {
      id: 'mle', title: 'ガウス分布の最尤推定（1次元 ＆ 多次元）',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`まずは最尤推定法！ データ $\mathbf x=(x_1,\dots,x_N)^{\mathsf T}$ が1次元ガウス分布 $\mathcal N(x\mid\mu,\sigma^2)$ から独立同分布（i.i.d.）で生成されたと仮定しよう。`],
          [R, 'happy', r`対数尤度 $\ln p(\mathbf x\mid\mu,\sigma^2)$ を作って、$\mu$ と $\sigma^2$ でそれぞれ偏微分して 0 とおけばいいんですね！`],
        ] },
        { t: 'formula', title: '1次元ガウス分布の対数尤度と最尤推定解', tag: '1D MLE',
          tex: r`\ln p(\mathbf x\mid\mu,\sigma^2) = -\frac{1}{2\sigma^2}\sum_{n=1}^{N}(x_n-\mu)^2 - \frac{N}{2}\ln\sigma^2 - \frac{N}{2}\ln(2\pi) \;\;\Longrightarrow\;\; \htmlClass{fp-m}{\mu_{\mathrm{ML}}=\frac{1}{N}\sum_{n=1}^{N}x_n}, \quad \htmlClass{fp-s}{\sigma^2_{\mathrm{ML}}=\frac{1}{N}\sum_{n=1}^{N}(x_n-\mu_{\mathrm{ML}})^2}`,
          parts: [
            ['fp-m', '標本平均 $\\mu_{\\mathrm{ML}}$', '$\\frac{\\partial}{\\partial\\mu}\\ln p = \\frac{1}{\\sigma^2}\\sum_n(x_n-\\mu)=0$ から、データの算術平均と一致！'],
            ['fp-s', '標本分散 $\\sigma^2_{\\mathrm{ML}}$', '$\\frac{\\partial}{\\partial(\\sigma^2)}\\ln p = \\frac{1}{2\\sigma^4}\\sum_n(x_n-\\mu)^2 - \\frac{N}{2\\sigma^2}=0$ から、データの分散と一致！'],
          ] },
        { t: 'talk', lines: [
          [S, 'wink', r`では $D$ 次元の多次元ガウス分布 $\mathcal N(\mathbf x\mid\boldsymbol\mu,\Sigma)$ だとどうなる？ ここで第7回の**行列の微分公式**が火を噴くよ！`],
        ] },
        { t: 'formula', title: '多次元ガウス分布の最尤推定解', tag: 'D-DIM MLE',
          tex: r`\ln p(X\mid\boldsymbol\mu,\Sigma) = -\frac{ND}{2}\ln(2\pi)-\frac{N}{2}\ln|\Sigma|-\frac12\sum_{n=1}^{N}(\mathbf x_n-\boldsymbol\mu)^{\mathsf T}\Sigma^{-1}(\mathbf x_n-\boldsymbol\mu) \;\;\Longrightarrow\;\; \htmlClass{fp-mv}{\boldsymbol\mu_{\mathrm{ML}}=\frac{1}{N}\sum_{n=1}^{N}\mathbf x_n}, \quad \htmlClass{fp-sv}{\Sigma_{\mathrm{ML}}=\frac{1}{N}\sum_{n=1}^{N}(\mathbf x_n-\boldsymbol\mu_{\mathrm{ML}})(\mathbf x_n-\boldsymbol\mu_{\mathrm{ML}})^{\mathsf T}}`,
          parts: [
            ['fp-mv', '平均ベクトル $\\boldsymbol\\mu_{\\mathrm{ML}}$', '公式 B1 より勾配 $\\sum_n\\Sigma^{-1}(\\mathbf x_n-\\boldsymbol\\mu)=\\mathbf 0$ を解いて標本平均ベクトル！'],
            ['fp-sv', '標本共分散行列 $\\Sigma_{\\mathrm{ML}}$', '公式 B8\', B9 より $\\Sigma$ で微分してゼロ行列とおくと、外積 $(\\mathbf x_n-\\boldsymbol\\mu_{\\mathrm{ML}})(\\mathbf x_n-\\boldsymbol\\mu_{\\mathrm{ML}})^{\\mathsf T}$ の平均！'],
          ] },
        { t: 'lab', id: 'gaussMle2d', title: '2次元データを打ってガウス分布を最尤推定しよう', foot: 'キャンバスをクリックしてデータ点を追加・移動してみて！ 標本平均 $\\boldsymbol\\mu_{\\mathrm{ML}}$（星印）と共分散楕円 $\\Sigma_{\\mathrm{ML}}$ がリアルタイムにフィットするよ。' },
      ],
    },
    {
      id: 'bayes-mean', title: 'ベイズ推論①：平均 μ の事後分布とアンカー効果',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`次はベイズ推定法！ パラメータを確率変数とみて事後分布 $p(\theta\mid\mathcal D)\propto p(\mathcal D\mid\theta)p(\theta)$ を求めるよ。`],
          [R, 'think', r`3章で「分母の正規化定数の積分が大変だから、**共役事前分布**を使う」ってやりましたね！`],
          [S, 'happy', r`バッチリ覚えてるね！ まずは分散 $\sigma^2$ が既知のとき、平均 $\mu$ の事前分布をガウス分布 $\mathcal N(\mu\mid\mu_0,\sigma_0^2)$ とおくと、事後分布もガウス分布 $\mathcal N(\mu\mid\hat\mu,\hat\sigma^2)$ になるんだ。`],
        ] },
        { t: 'formula', title: '1次元ガウス分布：平均 μ の事後分布', tag: 'BAYES MEAN',
          tex: r`p(\mu\mid\mathbf x) = \mathcal N(\mu\mid\hat\mu,\hat\sigma^2), \qquad \htmlClass{fp-mhat}{\hat\mu = \frac{\sigma^2}{N\sigma_0^2+\sigma^2}\mu_0 + \frac{N\sigma_0^2}{N\sigma_0^2+\sigma^2}\mu_{\mathrm{ML}}}, \qquad \htmlClass{fp-shat}{\frac{1}{\hat\sigma^2} = \frac{N}{\sigma^2} + \frac{1}{\sigma_0^2}}`,
          parts: [
            ['fp-mhat', '事後平均 $\\hat\\mu$', '事前平均 $\\mu_0$ と最尤推定値 $\\mu_{\\mathrm{ML}}$ の**内分点（重みつき平均）**！'],
            ['fp-shat', '事後精度 $1/\\hat\\sigma^2$', '分散の逆数（精度）で見ると、「事前の精度 + データ $N$ 個分の精度」の単純な足し算！'],
          ],
          note: '$N=0$ なら事前分布 $\\mathcal N(\\mu_0,\\sigma_0^2)$ そのもの。$N\\to\\infty$ なら $\\hat\\mu\\to\\mu_{\\mathrm{ML}},\\ \\hat\\sigma^2\\to 0$ となり最尤推定値に収束！ データが少ないとき、事前分布は極端な値に引っ張られない**アンカー（いかり）**の役割を果たす。' },
      ],
    },
    {
      id: 'bayes-prec', title: 'ベイズ推論②：精度 λ とガンマ分布・ウィッシャート分布',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`平均じゃなくて「ばらつき」の方をベイズ推論したいときは、何分布を使うんですか？`],
          [S, 'normal', r`計算をきれいにするコツは、分散 $\sigma^2$ ではなく逆数の**精度** $\lambda \equiv 1/\sigma^2$ を使うこと！ 尤度を $\lambda$ の関数として見ると $\lambda^{N/2}\exp\big(-\frac{\lambda}{2}\sum_n(x_n-\mu)^2\big)$ の形をしているから、共役事前分布は**ガンマ分布**になるよ。`],
        ] },
        { t: 'formula', title: 'ガンマ分布と精度 λ の事後分布', tag: 'GAMMA',
          tex: r`\mathrm{Gam}(\lambda\mid a,b) = \frac{1}{\Gamma(a)}b^a\lambda^{a-1}e^{-b\lambda} \quad\xrightarrow{\text{データ }N\text{ 個}}\quad \mathrm{Gam}(\lambda\mid a_N, b_N), \qquad \htmlClass{fp-an}{a_N = a_0 + \frac{N}{2}}, \quad \htmlClass{fp-bn}{b_N = b_0 + \frac{1}{2}\sum_{n=1}^{N}(x_n-\mu)^2}`,
          parts: [
            ['fp-an', '$a_N = a_0 + N/2$', 'データが1個増えるごとに $1/2$ 増える。つまり事前パラメータ $a_0$ は「仮想的な $2a_0$ 個の事前データ」と解釈できる！'],
            ['fp-bn', '$b_N = b_0 + \\frac{N}{2}\\sigma^2_{\\mathrm{ML}}$', '$b_0$ は分散 $b_0/a_0$ をもつ仮想データ $2a_0$ 個分の2乗和に対応する。ガンマ分布の期待値は $\\mathbb E[\\lambda]=a/b$、分散は $\\mathbb V[\\lambda]=a/b^2$。'],
          ] },
        { t: 'lab', id: 'gammaPrecision', title: 'ガンマ分布と精度 λ のベイズ更新ラボ', foot: '事前パラメータ $(a_0,b_0)$ を変えてガンマ分布の形を確かめよう。「データを追加」すると事後分布が真の精度 $\\lambda_{\\mathrm{true}}$ に鋭く集まっていく！' },
        { t: 'talk', lines: [
          [R, 'wow', r`じゃあ、平均 $\mu$ も精度 $\lambda$ も**両方わからない**ときや、**多次元**になったときはどうなるんですか？`],
          [S, 'happy', r`きれいな対応表になってるから並べて見てみよう！ 1次元と多次元で、共役事前分布がそっくりそのままスケールアップするんだよ。`],
        ] },
        { t: 'compare', items: [
          { em: '1️⃣', title: '1次元ガウス $\\mathcal N(x\\mid\\mu,\\lambda^{-1})$', items: [
            r`**平均 $\mu$ のみ未知**：ガウス分布 $\mathcal N(\mu\mid\mu_0,\sigma_0^2)$`,
            r`**精度 $\lambda$ のみ未知**：**ガンマ分布** $\mathrm{Gam}(\lambda\mid a_0,b_0)$`,
            r`**両方未知**：**ガウス-ガンマ分布** $\mathcal N(\mu\mid\mu_0,(\beta_0\lambda)^{-1})\,\mathrm{Gam}(\lambda\mid a_0,b_0)$（独立な積ではなく、ガウスの精度に $\lambda$ が入るのがミソ！）`,
          ] },
          { em: '🌐', title: '多次元ガウス $\\mathcal N(\\mathbf x\\mid\\boldsymbol\\mu,\\Lambda^{-1})$', items: [
            r`**平均 $\boldsymbol\mu$ のみ未知**：多次元ガウス分布`,
            r`**精度行列 $\Lambda=\Sigma^{-1}$ のみ未知**：**ウィッシャート分布** $\mathcal W(\Lambda\mid W_0,\nu_0)\propto |\Lambda|^{(\nu_0-D-1)/2}\exp(-\frac12\mathrm{Tr}(W_0^{-1}\Lambda))$`,
            r`**両方未知**：**ガウス-ウィッシャート分布** $\mathcal N(\boldsymbol\mu\mid\boldsymbol\mu_0,(\beta_0\Lambda)^{-1})\,\mathcal W(\Lambda\mid W_0,\nu_0)$`,
          ] },
        ] },
        { t: 'quiz', q: '1次元ガウス分布で平均 $\\mu$ が既知・精度 $\\lambda=1/\\sigma^2$ が未知のとき、事前分布 $\\mathrm{Gam}(\\lambda\\mid a_0,b_0)$ に $N=10$ 個のデータを与えると $a_N$ はどう更新される？',
          options: ['$a_N = a_0 + 10$', '$a_N = a_0 + 5$', '$a_N = 10a_0$'],
          answer: 1,
          explain: r`尤度に $\lambda^{N/2}$ が掛かるため、$a_N = a_0 + N/2 = a_0 + 5$ となります。データが1つ増えるごとに $1/2$ ずつ増えるのがガンマ共役の特徴です。` },
        { t: 'point', tone: 'mint', title: '第8章のまとめ', items: [
          '確率密度推定には、分布族を仮定する**パラメトリック手法**と仮定しない**ノンパラメトリック手法**がある。',
          'ガウス分布の最尤推定解は、1次元でも多次元でも**標本平均**と**標本分散（標本共分散行列）**になる。',
          '平均のベイズ事後平均は、事前平均 $\\mu_0$ と最尤解 $\\mu_{\\mathrm{ML}}$ の内分になり、少数データでの過学習を防ぐアンカーになる。',
          '精度 $\\lambda$ の共役事前分布は**ガンマ分布**（多次元の精度行列 $\\Lambda$ なら**ウィッシャート分布**）。平均と精度の同時共役事前分布は**ガウス-ガンマ分布**（多次元なら**ガウス-ウィッシャート分布**）。',
        ] },
      ],
    },
  ],
  notes: [
    { h: '1次元ガウス最尤推定', f: r`\mu_{\mathrm{ML}}=\frac1N\sum_{n=1}^N x_n,\quad \sigma^2_{\mathrm{ML}}=\frac1N\sum_{n=1}^N(x_n-\mu_{\mathrm{ML}})^2` },
    { h: '多次元ガウス最尤推定', f: r`\boldsymbol\mu_{\mathrm{ML}}=\frac1N\sum_{n=1}^N\mathbf x_n,\quad \Sigma_{\mathrm{ML}}=\frac1N\sum_{n=1}^N(\mathbf x_n-\boldsymbol\mu_{\mathrm{ML}})(\mathbf x_n-\boldsymbol\mu_{\mathrm{ML}})^{\mathsf T}` },
    { h: 'ガウス平均の事後分布', f: r`\hat\mu=\frac{\sigma^2\mu_0+N\sigma_0^2\mu_{\mathrm{ML}}}{N\sigma_0^2+\sigma^2},\quad \frac{1}{\hat\sigma^2}=\frac{N}{\sigma^2}+\frac{1}{\sigma_0^2}` },
    { h: 'ガンマ分布', f: r`\mathrm{Gam}(\lambda\mid a,b)=\frac{1}{\Gamma(a)}b^a\lambda^{a-1}e^{-b\lambda},\quad \mathbb E[\lambda]=\frac{a}{b},\ \mathbb V[\lambda]=\frac{a}{b^2}` },
    { h: 'ガウス精度の事後更新', f: r`a_N=a_0+\frac{N}{2},\quad b_N=b_0+\frac12\sum_{n=1}^N(x_n-\mu)^2` },
    { h: 'ガウス-ガンマ事後更新', f: r`\beta_N=\beta_0+N,\ \mu_N=\frac{\beta_0\mu_0+\sum x_n}{\beta_N},\ a_N=a_0+\frac{N}{2},\ b_N=b_0+\frac12\Big(\beta_0\mu_0^2-\beta_N\mu_N^2+\sum x_n^2\Big)` },
    { h: 'ウィッシャート分布', f: r`\mathcal W(\Lambda\mid W,\nu)=B(W,\nu)|\Lambda|^{(\nu-D-1)/2}\exp\!\left(-\frac12\mathrm{Tr}(W^{-1}\Lambda)\right)`, p: '多次元ガウス分布の精度行列 $\\Lambda=\\Sigma^{-1}$ の共役事前分布。' },
  ],
}
