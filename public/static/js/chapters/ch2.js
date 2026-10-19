const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 2, slug: 'probability', en: 'PROBABILITY', color: '#6FD6B8',
  title: '確率・統計の要点',
  sub: '不確実さを、数で扱うための道具箱。',
  lead: 'ツボと玉で、同時・周辺・条件つき・ベイズの定理。ガウス分布と大数の法則まで。',
  src: 'ML01_2_probability_summary',
  goals: ['標本空間・事象・公理', '同時/周辺/条件つき確率', 'ベイズの定理', 'ガウス分布', '大数の法則・中心極限定理'],
  icon: 'bell',
  sections: [
    {
      id: 'space', title: '標本空間・事象・確率の公理',
      blocks: [
        { t: 'talk', lines: [
          [R, 'normal', r`確率って高校でもやりましたけど、機械学習ではなんで必要なんですか？`],
          [S, 'normal', r`1章で見たとおり、データにはノイズがのる。ノイズは毎回違う値をとる**不確実なもの**。それを厳密に扱う言葉が確率なんだ。まずは基本の3語から。`],
        ] },
        { t: 'compare', items: [
          { em: '🌌', title: '標本空間 $\\Omega$', items: [r`偶然を伴う実験の結果 $\omega_1,\omega_2,\dots$ を全部集めた集合`, r`例：2つのサイコロ → $\Omega = \{(1,1),(1,2),\dots,(6,6)\}$（36通り）`] },
          { em: '🎯', title: '事象 $E$', items: [r`標本空間の**部分集合** $E \subseteq \Omega$`, r`例：ゾロ目が出る事象 $\{(1,1),(2,2),\dots,(6,6)\}$`] },
        ] },
        { t: 'formula', title: '確率の公理', tag: 'AXIOMS', tex: r`\text{I. } 0 \le P(E) \le 1 \qquad \text{II. } P(\Omega) = 1 \qquad \text{III. } E_1\cap E_2=\emptyset \Rightarrow P(E_1\cup E_2)=P(E_1)+P(E_2)`, note: 'この3つをみたす実数値関数を「確率」とよぶ。ここから $P(\\emptyset)=0$、$P(E^c)=1-P(E)$ などがすぐ出てくる。' },
        { t: 'talk', lines: [
          [R, 'think', r`でも「関学にいま40度の熱がある学生がいる確率」とか、繰り返せない出来事の確率ってどう考えるんですか？`],
          [S, 'happy', r`いい質問！ そこで確率の**解釈**が2つに分かれるの。`],
        ] },
        { t: 'compare', items: [
          { em: '🔁', title: '頻度主義', items: ['繰り返し可能な事象の起こる回数の比の極限', 'どの事象も（仮想的に）無限回くり返せると考える', '$P(E)$ は**客観的**な数値'] },
          { em: '💭', title: 'ベイジアン', items: ['不確実な事象に対する人の**信念の度合い**', '1回こっきりの事象でもOK', '$P(E)$ は**主観的**な数値'] },
        ] },
      ],
    },
    {
      id: 'rv', title: '確率変数',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`次は**確率変数**。名前がややこしいけど、中身は「試行結果 $\omega$ ごとに値が決まる関数 $X(\omega)$」のこと。`],
          [S, 'wink', r`サイコロを振って、出た目が偶数なら 1、奇数なら 0 をとる変数 $Y$ を考えると、$Y$ は $\{0,1\}$ 上の変数で、その値の確率が決まるよね。`],
          [R, 'happy', r`つまり==とる値の確率が決まっている変数==ってことですね！`],
          [S, 'happy', r`それ！ 身長や株価みたいに連続の値をとるものは**連続確率変数**。こっちは「値がある区間に入る確率」が決まってる。`],
        ] },
        { t: 'formula', title: '確率密度関数（連続）', tex: r`P(x < X < x+\Delta x) \approx p(x)\,\Delta x, \qquad p(x)\ge 0,\quad \int_{-\infty}^{\infty} p(x)\,dx = 1`, note: '1点ぴったりの確率は 0。$p(x)$ は確率そのものではなく**確率の密度**。機械学習では離散の確率関数も連続の密度関数も、どちらも $p$ と書くことが多い。' },
      ],
    },
    {
      id: 'joint', title: '同時・周辺・条件つき確率',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`講義の定番、**ツボと玉**でいこう。ツボ1には白6・黒2、ツボ2には白1・黒3。ツボ1を 0.4、ツボ2を 0.6 の確率で選んで、玉を1つ取り出す。`],
          [S, 'normal', r`ツボの選択を $V$、取り出す玉を $B$ とすると、2つの確率変数が出てくるね。`],
        ] },
        { t: 'lab', id: 'urn', title: 'モザイク図でツボと玉を見る', foot: '長方形の面積＝同時確率 $P(V,B)$。縦に足すと周辺確率、ある列の中での割合が条件つき確率。ボタンで「観測」すると、その世界だけが残る。' },
        { t: 'formula', title: '3つの確率の関係', tex: r`\underbrace{p(X,Y)}_{\text{同時}} = \underbrace{p(Y\mid X)}_{\text{条件つき}}\;\underbrace{p(X)}_{\text{周辺}}, \qquad p(Y) = \sum_{X} p(X, Y)`, note: '左が**乗法定理**（条件つき確率の定義）、右が**周辺化**（加法定理）。機械学習の計算はほぼこの2本だけで回っている。' },
        { t: 'talk', lines: [
          [R, 'think', r`ツボ1を選びかつ白、の確率は $0.4 \times 6/8 = 0.3$ ……あ、モザイクの左上の面積だ！`],
          [S, 'happy', r`そう。そして白が出る確率（周辺確率）は、白の面積を全部足して $0.3 + 0.6\times 1/4 = 0.45$。他の変数について和をとって消すのを**周辺化**っていうよ。`],
        ] },
        { t: 'point', tone: 'mint', title: '独立', items: [r`任意の $x, y$ で $p(x,y) = p(x)\,p(y)$ のとき $X$ と $Y$ は**独立**。`, r`独立なら $p(x\mid y) = p(x)$：$Y$ の値を知っても $X$ の確率は変わらない。`, '例：2つのツボの白黒の割合が同じ（白4黒2 と 白2黒1）なら、どちらのツボかと玉の色は独立。モザイク図の横線が一直線にそろう。'] },
      ],
    },
    {
      id: 'bayes', title: 'ベイズの定理',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`さて逆向きの質問。==黒玉が出た。さて、どっちのツボから出した？==`],
          [R, 'think', r`えっと、ツボを選ぶ確率は 0.4 と 0.6 だから、ツボ1の確率は 0.4……？`],
          [S, 'wink', r`それは**観測する前**の確率（事前確率）。黒が出たという情報を手に入れたら、確率は更新されるべきだよね。ツボ2は黒が多いんだから。`],
        ] },
        { t: 'formula', title: 'ベイズの定理', tag: 'BAYES', tex: r`\htmlClass{fp-post}{p(X\mid Y)} = \frac{\htmlClass{fp-lik}{p(Y\mid X)}\;\htmlClass{fp-pri}{p(X)}}{\htmlClass{fp-z}{\sum_{X} p(Y\mid X)\,p(X)}}`,
          parts: [['fp-post', '事後確率', '観測 $Y$ を見た**後**の $X$ の確率。知りたいもの。'], ['fp-lik', '尤度', '$X$ だと仮定したとき、$Y$ が観測される確率。'], ['fp-pri', '事前確率', '観測する**前**の $X$ の確率。'], ['fp-z', '正規化定数', '分子を $X$ について足したもの＝$p(Y)$。事後確率の合計を 1 にするための割り算。']] },
        { t: 'exer', title: '例11：黒玉が出たときのツボの確率', q: r`ツボ1（白6黒2）、ツボ2（白1黒3）を 0.4, 0.6 で選んで1個取り出したら黒だった。(i) ツボ1 だった確率、(ii) ツボ2 だった確率を求めよ。`,
          hint: r`まず分母 $P(B=b) = P(b\mid 1)P(1) + P(b\mid 2)P(2)$ を計算。`,
          steps: [r`尤度：$P(B=b\mid V=1)=2/8=1/4$、$P(B=b\mid V=2)=3/4$`, r`分母（周辺化）：$P(B=b) = \tfrac14\cdot0.4 + \tfrac34\cdot0.6 = 0.1 + 0.45 = 0.55$`, r`(i) $P(V=1\mid B=b) = \dfrac{0.1}{0.55} = \dfrac{2}{11} \approx 0.18$`, r`(ii) $P(V=2\mid B=b) = \dfrac{0.45}{0.55} = \dfrac{9}{11} \approx 0.82$`, r`観測前は 0.4 : 0.6 だったのが、黒を見た後は 0.18 : 0.82 に。**データを見ると確率は大きく変わる**。`] },
        { t: 'kinetic', words: ['データを', ['見る前', 'pop3'], 'と', ['見た後', 'pop'], 'では、', ['確率がちがう。', 'pop2']], sub: '— ベイズの定理は「信念の更新ルール」。' },
      ],
    },
    {
      id: 'dist', title: '代表的な分布と期待値・分散',
      blocks: [
        { t: 'compare', items: [
          { em: '🪙', title: 'ベルヌイ分布', items: [r`コイン1回。表=1, 裏=0、表の確率 $\mu$`, r`$\mathrm{Bern}(x\mid\mu) = \mu^{x}(1-\mu)^{1-x}$`, r`$\mathbb E[X]=\mu,\ \mathrm{var}[X]=\mu(1-\mu)$`] },
          { em: '🎲', title: 'カテゴリカル分布', items: [r`サイコロ1回（ベルヌイの多値版）`, r`one-hot表現 $\mathbf x=(0,1,0,0,0,0)^{\mathsf T}$`, r`$p(\mathbf x\mid\boldsymbol\mu)=\prod_{k}\mu_k^{x_k}$`] },
          { em: '📏', title: '一様分布 $[0,1]$', items: [r`$p(x)=1\ (0\le x\le1)$`, r`$\mathbb E[X]=1/2,\ \mathrm{var}[X]=1/12$`] },
          { em: '🌙', title: 'ベータ分布', items: [r`$\mathrm{Beta}(x\mid\alpha,\beta)=\frac{x^{\alpha-1}(1-x)^{\beta-1}}{B(\alpha,\beta)}$`, r`コインの表の確率 $x$ についての「確信の形」`, '3章のベイズで大活躍'] },
        ] },
        { t: 'formula', title: '期待値と分散', tex: r`\mathbb E[X] = \sum_{x} x\,p(x) \;\;\Big(\!=\!\int x\,p(x)\,dx\Big), \qquad \mathrm{var}[X] = \mathbb E\big[(X-\mathbb E[X])^2\big] = \mathbb E[X^2] - \mathbb E[X]^2`, note: '期待値＝重みつき平均（重心）、分散＝ばらつきの大きさ。共分散 $\\mathrm{cov}[X,Y]=\\mathbb E[(X-\\mathbb E X)(Y-\\mathbb E Y)]$ は2変数の「相関」の強さ。' },
        { t: 'quiz', q: 'ベルヌイ分布（表の確率 $\\mu$）の分散が最大になるのは $\\mu$ がいくつのとき？', options: ['$\\mu = 0$', '$\\mu = 0.5$', '$\\mu = 1$'], answer: 1, explain: r`$\mathrm{var}=\mu(1-\mu)$ は $\mu=0.5$ で最大 $0.25$。表裏どっちが出るか一番読めないときに、ばらつきが最大になる。` },
        { t: 'point', tone: 'lav', title: '変数変換（確率は保存される）', items: [r`$Z=f(Y)$ のとき $p_Z(z) = p_Y(y)\left|\dfrac{dy}{dz}\right|$。`, r`例：$X\sim$ 一様 $[0,1]$、$Z=2X-1$ なら $X=(Z+1)/2$、$|dX/dZ|=1/2$ より $p_Z(z)=1/2$ … $[-1,1]$ 上の一様分布。`, '多次元ではヤコビアン（行列式）の絶対値をかける。'] },
      ],
    },
    {
      id: 'gauss', title: 'ガウス分布（正規分布）',
      blocks: [
        { t: 'talk', lines: [
          [S, 'happy', r`機械学習でいちばんよく出てくる分布、**ガウス分布**。ノイズのモデルとして大定番だよ。`],
        ] },
        { t: 'formula', title: 'ガウス分布', tex: r`\mathcal N(x\mid \htmlClass{fp-mu}{\mu}, \htmlClass{fp-s}{\sigma^2}) = \frac{1}{\sqrt{2\pi\htmlClass{fp-s}{\sigma^2}}}\exp\!\left\{-\frac{(x-\htmlClass{fp-mu}{\mu})^2}{2\htmlClass{fp-s}{\sigma^2}}\right\}`,
          parts: [['fp-mu', '平均 $\\mu$', '山の中心の位置。'], ['fp-s', '分散 $\\sigma^2$', '山の広がり。$\\sigma$ は標準偏差。']], note: 'ガウス分布は平均 $\\mu$ と分散 $\\sigma^2$ で**完全に**決まる。$X\\sim\\mathcal N(\\mu,\\sigma^2)$ と書く。' },
        { t: 'lab', id: 'gauss1d', title: 'μ と σ で山を動かす', foot: '黄色の面積が区間 $[a,b]$ に入る確率。点線はおなじみの標準正規分布 $\\mathcal N(0,1)$。' },
        { t: 'talk', lines: [
          [R, 'think', r`2つの変数を同時に扱うときはどうなるんですか？`],
          [S, 'normal', r`**多次元ガウス分布**。平均ベクトル $\boldsymbol\mu$ と**分散共分散行列** $\Sigma$ で完全に決まる。2次元なら等高線が楕円になるよ。`],
        ] },
        { t: 'formula', title: '多次元ガウス分布', tex: r`\mathcal N(\mathbf x\mid\boldsymbol\mu,\Sigma) = \frac{1}{(2\pi)^{D/2}|\Sigma|^{1/2}}\exp\!\left\{-\frac12(\mathbf x-\boldsymbol\mu)^{\mathsf T}\Sigma^{-1}(\mathbf x-\boldsymbol\mu)\right\}` },
        { t: 'lab', id: 'gauss2d', title: '共分散で楕円を傾ける', foot: '紫の点はこの分布からのサンプル。太い楕円が $1\\sigma$、点線が $2\\sigma$ の等高線。' },
        { t: 'point', title: '多次元ガウスのうれしい性質', items: ['$\\boldsymbol\\mu$ と $\\Sigma$ だけで完全に決まる。', '一部の変数で**条件づけた分布もガウス**、**周辺分布もガウス**。', 'ガウス × ガウスのベイズの定理の結果もガウス（3章の共役事前分布へ）。'] },
      ],
    },
    {
      id: 'sample', title: 'サンプルと2つの重要定理',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`全世界でテレビを2台持っている家庭の割合を知りたい。全家庭（**母集団**）は調べられないから、ランダムに 1000 家庭を選んで調べる。これが**サンプル（標本）**。`],
          [R, 'think', r`でも、1000 家庭の平均って、全世界の平均と同じと思っていいんですか？`],
          [S, 'happy', r`それを保証してくれるのが、これから見る2つの定理。ポイントは、大きさ $n$ のサンプルを==母集団と同じ分布をもつ $n$ 個の独立な確率変数の組 $(X_1,\dots,X_n)$== とみなすこと。`],
        ] },
        { t: 'formula', title: 'サンプル平均・サンプル分散（統計量）', tex: r`\bar X = \frac1n\sum_{i=1}^n X_i, \qquad S^2 = \frac1n\sum_{i=1}^n (X_i-\bar X)^2`, note: 'サンプルに計算を施したものを**統計量**、母集団の量を推定する統計量を**推定量**という。どちらも確率変数。具体的な値は推定値。' },
        { t: 'lab', id: 'lln', title: '大数の法則：コインを投げ続ける', foot: 'サンプル数を大きくとれば、サンプル平均は母集団平均 $\\mu$ の近くに落ちる確率がきわめて高くなる。' },
        { t: 'formula', title: '大数の法則からのよく使う帰結', tex: r`\mathbb E[f(X)] = \int f(x)\,p(x)\,dx \;\approx\; \frac1N\sum_{n=1}^{N} f(x_n)`, note: '分布 $p(x)$ がわからなくても、データの平均で期待値を近似できる。4章の「経験損失」の根拠。' },
        { t: 'lab', id: 'clt', title: '中心極限定理：どんな分布もガウスに', foot: '確率変数の列のサンプル平均は、$n\\to\\infty$ で平均 $\\mu$、分散 $\\sigma^2/n$ のガウス分布に収束する。' },
        { t: 'talk', lines: [
          [R, 'wow', r`指数分布みたいにグイっと偏った分布でも、平均をとるとちゃんと釣鐘型になる！`],
          [S, 'happy', r`だからノイズ（たくさんの小さな要因の合計）をガウス分布でモデル化するのは理にかなってるんだ。`],
        ] },
        { t: 'point', tone: 'mint', title: '第2章のまとめ', items: ['確率変数＝とる値の確率が決まっている変数。', '乗法定理 $p(X,Y)=p(Y|X)p(X)$ と 周辺化 $p(Y)=\\sum_X p(X,Y)$。', 'ベイズの定理：事後 ∝ 尤度 × 事前。観測で確率が更新される。', 'ガウス分布は平均と（共）分散で完全に決まる。', '大数の法則：サンプル平均 → 母平均。中心極限定理：サンプル平均の分布 → ガウス。'] },
      ],
    },
  ],
  notes: [
    { h: '確率の公理', f: r`0\le P(E)\le1,\ P(\Omega)=1,\ E_1\cap E_2=\emptyset\Rightarrow P(E_1\cup E_2)=P(E_1)+P(E_2)` },
    { h: '乗法定理・周辺化', f: r`p(X,Y)=p(Y|X)p(X),\quad p(Y)=\sum_X p(X,Y)` },
    { h: 'ベイズの定理', f: r`p(X|Y)=\frac{p(Y|X)p(X)}{\sum_X p(Y|X)p(X)}`, p: '分母は正規化定数。' },
    { h: '独立', f: r`p(x,y)=p(x)p(y)` },
    { h: '期待値・分散', f: r`\mathbb E[X]=\sum_x xp(x),\ \mathrm{var}[X]=\mathbb E[X^2]-\mathbb E[X]^2` },
    { h: 'ベルヌイ分布', f: r`\mathrm{Bern}(x|\mu)=\mu^x(1-\mu)^{1-x}`, p: '$\\mathbb E=\\mu$、$\\mathrm{var}=\\mu(1-\\mu)$' },
    { h: 'ベータ分布', f: r`\mathrm{Beta}(x|\alpha,\beta)=\frac{\Gamma(\alpha+\beta)}{\Gamma(\alpha)\Gamma(\beta)}x^{\alpha-1}(1-x)^{\beta-1}` },
    { h: 'ガウス分布', f: r`\mathcal N(x|\mu,\sigma^2)=\frac{1}{\sqrt{2\pi\sigma^2}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}` },
    { h: '多次元ガウス分布', f: r`\mathcal N(\mathbf x|\boldsymbol\mu,\Sigma)=\frac{1}{(2\pi)^{D/2}|\Sigma|^{1/2}}e^{-\frac12(\mathbf x-\boldsymbol\mu)^{\mathsf T}\Sigma^{-1}(\mathbf x-\boldsymbol\mu)}` },
    { h: '変数変換', f: r`p_Z(z)=p_Y(y)\left|\frac{dy}{dz}\right|` },
    { h: '大数の法則の帰結', f: r`\mathbb E[f(X)]\approx\frac1N\sum_n f(x_n)` },
    { h: '中心極限定理', f: r`\bar X_n \xrightarrow{n\to\infty} \mathcal N(\mu,\sigma^2/n)` },
    { h: 'ガンマ関数', f: r`\Gamma(x+1)=x\Gamma(x),\ \Gamma(1)=1,\ \Gamma(n+1)=n!` },
  ],
}
