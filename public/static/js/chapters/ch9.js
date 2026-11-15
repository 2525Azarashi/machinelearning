const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 9, slug: 'linear-regression', en: 'LINEAR REGRESSION', color: '#B9A7FF',
  title: '線形回帰（基底関数とベイズ）',
  sub: '「入力には非線形、重みには線形」——それがいちばんおいしい設計。',
  lead: '基底関数と計画行列 Φ、ムーア・ペンローズの一般逆行列、そして事後分布から予測分布までを導くベイズ線形回帰。',
  src: 'ML02_3_linear_regression (+classic)',
  goals: ['基底関数による非線形拡張', '計画行列 Φ と最尤推定解（正規方程式）', 'ムーア・ペンローズの一般逆行列と w₀ の役割', 'ベイズ線形回帰の事後分布', '予測分布の不確実性バンド'],
  icon: 'curve',
  sections: [
    {
      id: 'basis', title: '単純線形回帰の2大拡張：多次元化と基底関数',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`3章でやった $t = wx + \varepsilon$ はシンプルでしたけど、現実のデータって身長も体重も年齢も入るし、直線じゃ曲がれないですよね？`],
          [S, 'happy', r`そこで2段階のパワーアップをするよ！ ①入力を $D$ 次元ベクトル $\mathbf x$ に拡張し、②さらに非線形な**基底関数** $\phi_j(\mathbf x)$ で変換してから重み $\mathbf w$ を掛けるんだ。`],
        ] },
        { t: 'formula', title: '拡張された線形回帰モデル', tag: 'MODEL',
          tex: r`t = y(\mathbf x,\mathbf w) + \varepsilon = \htmlClass{fp-w0}{w_0} + \sum_{j=1}^{M-1}\htmlClass{fp-w}{w_j}\htmlClass{fp-phi}{\phi_j(\mathbf x)} + \varepsilon = \htmlClass{fp-vec}{\mathbf w^{\mathsf T}\boldsymbol\phi(\mathbf x)} + \varepsilon, \qquad \varepsilon\sim\mathcal N(0,\sigma^2)`,
          parts: [
            ['fp-w0', 'バイアス $w_0$', '$\\phi_0(\\mathbf x)=1$（ダミー基底関数）とおけば、他の重みと一緒に $\\mathbf w=(w_0,\\dots,w_{M-1})^{\\mathsf T}$ にまとめられる！'],
            ['fp-phi', '基底関数 $\\phi_j(\\mathbf x)$', '入力 $\\mathbf x$ に対して**非線形**なので、曲線や複雑な地形を自在に表現できる。'],
            ['fp-w', '重み $w_j$', '重みパラメータ $\\mathbf w$ に対しては**線形**！ だから「線形回帰」と呼び、解析的にスパッと解ける。'],
            ['fp-vec', '内積表現 $\\mathbf w^{\\mathsf T}\\boldsymbol\\phi(\\mathbf x)$', '$\\boldsymbol\\phi(\\mathbf x)=(\\phi_0(\\mathbf x),\\dots,\\phi_{M-1}(\\mathbf x))^{\\mathsf T}$ は $M$ 次元ベクトル。'],
          ] },
        { t: 'compare', items: [
          { em: '📈', title: '多項式基底関数', items: [
            r`$\phi_j(x) = x^j$`,
            r`大域的（1か所変えると全体の形が変わる）`,
            r`1章の多項式フィッティングはこれ！`,
          ] },
          { em: '🔔', title: 'ガウス基底関数', items: [
            r`$\phi_j(x) = \exp\!\left\{-\dfrac{(x-\mu_j)^2}{2s^2}\right\}$`,
            r`$\mu_j$ が中心位置、$s$ が広がり（局所的）`,
            r`山の高さ $w_j$ を足し合わせて曲線を作る`,
          ] },
          { em: '〰️', title: 'シグモイド基底関数', items: [
            r`$\phi_j(x) = \sigma\!\left(\dfrac{x-\mu_j}{s}\right),\ \sigma(a)=\dfrac{1}{1+e^{-a}}$`,
            r`滑らかな階段関数を足し合わせるイメージ`,
            r`ニューラルネットワークの中間層と親戚！`,
          ] },
        ] },
        { t: 'lab', id: 'basisLab', title: '基底関数を切り替えて曲線を組み立てよう', foot: '多項式・ガウス・シグモイドを切り替えて基底の数 $M$ を動かそう。下の薄色の線がそれぞれの基底 $w_j\\phi_j(x)$、太い線がその合計！' },
      ],
    },
    {
      id: 'mle', title: '計画行列 Φ と最尤推定解（一般逆行列）',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`$N$ 個のデータ $\{(\mathbf x_n,t_n)\}_{n=1}^N$ の和を行列で一気に書くために、$N\times M$ の**計画行列**（デザイン行列） $\Phi$ を導入しよう！`],
          [R, 'wow', r`第 $n$ 行が $n$ 番目のデータの基底ベクトル $\boldsymbol\phi(\mathbf x_n)^{\mathsf T}$ になってる行列ですね！`],
        ] },
        { t: 'formula', title: '計画行列 Φ と最尤推定解（正規方程式）', tag: 'MLE',
          tex: r`\Phi = \begin{pmatrix}\phi_0(\mathbf x_1) & \cdots & \phi_{M-1}(\mathbf x_1)\\ \vdots & \ddots & \vdots \\ \phi_0(\mathbf x_N) & \cdots & \phi_{M-1}(\mathbf x_N)\end{pmatrix}, \qquad \htmlClass{fp-wml}{\mathbf w_{\mathrm{ML}} = (\Phi^{\mathsf T}\Phi)^{-1}\Phi^{\mathsf T}\mathbf t = \Phi^{\dagger}\mathbf t}, \qquad \htmlClass{fp-sml}{\sigma^2_{\mathrm{ML}} = \frac{1}{N}\sum_{n=1}^{N}\big(t_n - \mathbf w_{\mathrm{ML}}^{\mathsf T}\boldsymbol\phi(\mathbf x_n)\big)^2}`,
          parts: [
            ['fp-wml', '重みの最尤解 $\\mathbf w_{\\mathrm{ML}}$', 'ノイズ分散 $\\sigma^2$ の値に**無関係**に決まる！ $\\Phi^{\\dagger}=(\\Phi^{\\mathsf T}\\Phi)^{-1}\\Phi^{\\mathsf T}$ を**ムーア・ペンローズの一般逆行列**と呼ぶ。'],
            ['fp-sml', '分散の最尤解 $\\sigma^2_{\\mathrm{ML}}$', 'まず $\\mathbf w_{\\mathrm{ML}}$ を求めてから、予測残差の2乗平均を計算すれば一発で求まる。'],
          ],
          note: 'データ数 $N > M$ のとき方程式 $\\Phi\\mathbf w = \\mathbf t$ は式が多すぎて厳密解がない（不定方程式）が、$\\|\\mathbf t-\\Phi\\mathbf w\\|_2^2$ を最小にする最小2乗解が $\\Phi^\\dagger\\mathbf t$ になる。' },
        { t: 'point', title: 'バイアスパラメータ $w_0$ の役割', items: [
          r`対数尤度を $w_0$ だけで偏微分して 0 とおくと、$w_0 = \bar t - \sum_{j=1}^{M-1} w_j \bar\phi_j$（ただし $\bar t = \frac1N\sum_n t_n,\ \bar\phi_j = \frac1N\sum_n\phi_j(\mathbf x_n)$）。`,
          r`つまり $w_0$ は、**目標値のデータ平均と、基底関数値の平均の重みつき和との差（オフセット）を埋める役割**をもっている！`,
        ] },
        { t: 'exer', title: '導出：計画行列による最尤推定解',
          q: r`対数尤度 $\ln p(\mathbf t\mid X,\mathbf w,\sigma^2)=-\frac{1}{2\sigma^2}\|\mathbf t-\Phi\mathbf w\|^2 - \frac N2\ln(2\pi\sigma^2)$ を $\mathbf w$ で微分して $\mathbf 0$ とおき、$\mathbf w_{\mathrm{ML}}=(\Phi^{\mathsf T}\Phi)^{-1}\Phi^{\mathsf T}\mathbf t$ を導け。`,
          hint: r`$\|\mathbf t-\Phi\mathbf w\|^2 = (\mathbf t-\Phi\mathbf w)^{\mathsf T}(\mathbf t-\Phi\mathbf w) = \mathbf t^{\mathsf T}\mathbf t - 2\mathbf w^{\mathsf T}\Phi^{\mathsf T}\mathbf t + \mathbf w^{\mathsf T}\Phi^{\mathsf T}\Phi\mathbf w$ と展開して公式 B1, B2' を使う。`,
          steps: [
            r`$E(\mathbf w)=\frac12(\mathbf t-\Phi\mathbf w)^{\mathsf T}(\mathbf t-\Phi\mathbf w)=\frac12\mathbf t^{\mathsf T}\mathbf t - \mathbf w^{\mathsf T}(\Phi^{\mathsf T}\mathbf t) + \frac12\mathbf w^{\mathsf T}(\Phi^{\mathsf T}\Phi)\mathbf w$ と展開する。`,
            r`$\Phi^{\mathsf T}\Phi$ は対称行列なので、第7回の公式 B1・B2' より $\dfrac{\partial E}{\partial\mathbf w} = -\Phi^{\mathsf T}\mathbf t + \Phi^{\mathsf T}\Phi\mathbf w$。`,
            r`$= \mathbf 0$ とおくと正規方程式 $\Phi^{\mathsf T}\Phi\mathbf w = \Phi^{\mathsf T}\mathbf t$。`,
            r`$\Phi^{\mathsf T}\Phi$ が正則（ランク $M$）ならば左から $(\Phi^{\mathsf T}\Phi)^{-1}$ を掛けて $\mathbf w_{\mathrm{ML}}=(\Phi^{\mathsf T}\Phi)^{-1}\Phi^{\mathsf T}\mathbf t$。■`,
          ] },
      ],
    },
    {
      id: 'bayes', title: 'ベイズ線形回帰：重みの事後分布とサンプル直線',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`最尤推定だと、やっぱりデータが少ないときに過学習しちゃうし、次数 $M$ も選べないんですよね？`],
          [S, 'happy', r`そこで**ベイズ線形回帰**！ ノイズ精度 $\beta=1/\sigma^2$ を既知として、重み $\mathbf w$ に等方的なガウス事前分布 $p(\mathbf w)=\mathcal N(\mathbf w\mid\mathbf 0,\alpha^{-1}I)$ を置こう。すると事後分布もガウス分布になるよ！`],
        ] },
        { t: 'formula', title: 'ベイズ線形回帰：重み w の事後分布', tag: 'POSTERIOR',
          tex: r`p(\mathbf w\mid\mathbf t) = \mathcal N(\mathbf w\mid \mathbf m_N, S_N), \qquad \htmlClass{fp-mn}{\mathbf m_N = \beta S_N\Phi^{\mathsf T}\mathbf t}, \qquad \htmlClass{fp-sn}{S_N^{-1} = \alpha I + \beta\Phi^{\mathsf T}\Phi}`,
          parts: [
            ['fp-mn', '事後平均 $\\mathbf m_N$', 'ガウスの山がいちばん高い場所なので MAP 推定解 $\\mathbf w_{\\mathrm{MAP}}$ と一致！ 正則化係数 $\\lambda=\\alpha/\\beta$ のリッジ回帰と同じ式。'],
            ['fp-sn', '事後精度行列 $S_N^{-1}$', '事前の精度 $\\alpha I$ に、データがもたらす精度 $\\beta\\Phi^{\\mathsf T}\\Phi$ が足し算される！ データが増えるほど $S_N$ は小さくなり確信度が増す。'],
          ] },
        { t: 'kinetic', words: ['1本の線を', ['決めるのではなく、', 'pop3'], 'ありうる線の', ['分布をもつ。', 'pop']], sub: '— データが増えるたび、候補の線の束がキュッと絞られていく。' },
      ],
    },
    {
      id: 'pred', title: '予測分布：知らない場所では「自信がない」と言える',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`ベイズの真骨頂はここ！ パラメータ $\mathbf w$ を1つに決め打ちせず、事後分布 $p(\mathbf w\mid\mathbf t)$ で重みづけ平均（周辺化積分）をとって、新しい入力 $\mathbf x$ に対する目標値 $t$ の**予測分布**を作るよ。`],
          [R, 'wow', r`ガウス分布とガウス分布の積分だから……もしかして予測分布もガウス分布ですか！？`],
          [S, 'happy', r`大正解！ 分割多次元ガウス分布の公式を使うと、平均も分散もきれいに閉じた式で書けるんだ。`],
        ] },
        { t: 'formula', title: 'ベイズ線形回帰の予測分布', tag: 'PREDICTIVE',
          tex: r`p(t\mid\mathbf x,\mathbf t,\alpha,\beta) = \int \mathcal N\big(t\mid\mathbf w^{\mathsf T}\boldsymbol\phi(\mathbf x),\beta^{-1}\big)\,\mathcal N(\mathbf w\mid\mathbf m_N,S_N)\,d\mathbf w = \mathcal N\!\big(t\mid \htmlClass{fp-pm}{\mathbf m_N^{\mathsf T}\boldsymbol\phi(\mathbf x)},\; \htmlClass{fp-pv}{\sigma_N^2(\mathbf x)}\big), \qquad \sigma_N^2(\mathbf x) = \htmlClass{fp-n1}{\frac{1}{\beta}} + \htmlClass{fp-n2}{\boldsymbol\phi(\mathbf x)^{\mathsf T}S_N\boldsymbol\phi(\mathbf x)}`,
          parts: [
            ['fp-pm', '予測平均 $\\mathbf m_N^{\\mathsf T}\\boldsymbol\\phi(\\mathbf x)$', '事後平均パラメータ $\\mathbf m_N$ を使った予測曲線。'],
            ['fp-pv', '予測分散 $\\sigma_N^2(\\mathbf x)$', '入力の位置 $\\mathbf x$ によって予測の不確実さが変わる！'],
            ['fp-n1', '第1項 $1/\\beta$', 'データ自体にのっている**本質的なノイズ分散**（データを無限に集めても消えない）。'],
            ['fp-n2', '第2項 $\\boldsymbol\\phi(\\mathbf x)^{\\mathsf T}S_N\\boldsymbol\\phi(\\mathbf x)$', 'パラメータ $\\mathbf w$ の**不確実さ**に由来する分散！ データがある場所では小さく、データがない場所では大きく広がる。'],
          ] },
        { t: 'lab', id: 'bayesRegLab', title: 'ベイズ線形回帰：クリックで点を足して予測分布を絞ろう', foot: 'キャンバスをクリックして観測点を1個ずつ追加しよう！ 点がある場所ではピンクの $\\pm1\\sigma_N$ 帯がキュッと細くなり、点がない領域では「ここは自信がないよ」と帯が広がる。薄紫の線は事後分布からサンプリングした関数たち！' },
        { t: 'quiz', q: 'ベイズ線形回帰の予測分散 $\\sigma_N^2(\\mathbf x) = \\beta^{-1} + \\boldsymbol\\phi(\\mathbf x)^{\\mathsf T}S_N\\boldsymbol\\phi(\\mathbf x)$ について、データ数 $N\\to\\infty$ に増やしたときの極限はどうなる？',
          options: ['0 に収束する', 'ノイズ分散 $\\beta^{-1}$（$=\\sigma^2$）に収束する', '事前分散 $\\alpha^{-1}$ に収束する'],
          answer: 1,
          explain: r`データが増えると $S_N \to O$ となり第2項（パラメータの不確実さ）は 0 に消えますが、データそのもののノイズに由来する第1項 $\beta^{-1}$ は残ります。` },
        { t: 'point', tone: 'lav', title: '第9章のまとめ', items: [
          '基底関数 $\\boldsymbol\\phi(\\mathbf x)$ を使うと、入力 $\\mathbf x$ には非線形でありながら重み $\\mathbf w$ には線形なモデルが作れる。',
          '計画行列 $\\Phi$ を使うと最尤解は $\\mathbf w_{\\mathrm{ML}}=(\\Phi^{\\mathsf T}\\Phi)^{-1}\\Phi^{\\mathsf T}\\mathbf t = \\Phi^{\\dagger}\\mathbf t$（ムーア・ペンローズの一般逆行列）。',
          'ベイズ線形回帰の事後分布はガウス $\\mathcal N(\\mathbf m_N, S_N)$、ただし $S_N^{-1}=\\alpha I+\\beta\\Phi^{\\mathsf T}\\Phi,\\ \\mathbf m_N=\\beta S_N\\Phi^{\\mathsf T}\\mathbf t$。',
          '予測分布の分散 $\\sigma_N^2(\\mathbf x)=\\beta^{-1}+\\boldsymbol\\phi(\\mathbf x)^{\\mathsf T}S_N\\boldsymbol\\phi(\\mathbf x)$ は、「ノイズ」＋「重みの不確実さ」の和で表され、データが少ない領域で自然に広がる。',
        ] },
      ],
    },
  ],
  notes: [
    { h: '線形回帰モデル（基底関数）', f: r`y(\mathbf x,\mathbf w)=\mathbf w^{\mathsf T}\boldsymbol\phi(\mathbf x)=\sum_{j=0}^{M-1}w_j\phi_j(\mathbf x),\quad \phi_0(\mathbf x)=1` },
    { h: 'ガウス基底 / シグモイド基底', f: r`\phi_j(x)=\exp\!\left(-\frac{(x-\mu_j)^2}{2s^2}\right),\quad \phi_j(x)=\frac{1}{1+\exp(-(x-\mu_j)/s)}` },
    { h: '最尤推定解と一般逆行列', f: r`\mathbf w_{\mathrm{ML}}=(\Phi^{\mathsf T}\Phi)^{-1}\Phi^{\mathsf T}\mathbf t=\Phi^{\dagger}\mathbf t,\quad \sigma^2_{\mathrm{ML}}=\frac1N\|\mathbf t-\Phi\mathbf w_{\mathrm{ML}}\|^2` },
    { h: 'バイアス w₀ の最尤解', f: r`w_0=\bar t-\sum_{j=1}^{M-1}w_j\bar\phi_j` },
    { h: 'ベイズ線形回帰の事後分布', f: r`p(\mathbf w\mid\mathbf t)=\mathcal N(\mathbf w\mid\mathbf m_N,S_N),\quad S_N^{-1}=\alpha I+\beta\Phi^{\mathsf T}\Phi,\quad \mathbf m_N=\beta S_N\Phi^{\mathsf T}\mathbf t` },
    { h: 'ベイズ線形回帰の予測分布', f: r`p(t\mid\mathbf x,\mathbf t)=\mathcal N\!\left(t\;\middle|\;\mathbf m_N^{\mathsf T}\boldsymbol\phi(\mathbf x),\ \frac1\beta+\boldsymbol\phi(\mathbf x)^{\mathsf T}S_N\boldsymbol\phi(\mathbf x)\right)` },
  ],
}
