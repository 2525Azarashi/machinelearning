const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 12, slug: 'glm-classification', en: 'GENERALIZED LINEAR MODEL', color: '#FF8E6E',
  title: '一般化線形モデルによる分類',
  sub: '線を引いて分ける、確率で分ける、分布を作って分ける——分類の3大流儀。',
  lead: '特徴空間と線形識別関数、パーセプトロン、ロジスティック回帰と交差エントロピー・IRLS、確率的生成モデル、ソフトマックス多クラス分類まで完全収録。',
  src: 'ML02_4/6_classification_gnrzd_lnr_mdl (+rec)',
  goals: ['識別関数・識別モデル・生成モデルの3分類', '線形識別関数の幾何（直交する w と距離）', '一般化線形モデルとパーセプトロン', 'ロジスティック回帰・交差エントロピー・IRLS', '確率的生成モデルと多クラス（ソフトマックス）'],
  icon: 'split',
  sections: [
    {
      id: 'approaches', title: '分類問題の3つのアプローチと特徴空間',
      blocks: [
        { t: 'talk', lines: [
          [S, 'happy', r`ここからは**分類問題**の本格編！ 入力空間の点 $\mathbf x$ を $K$ 個の離散クラス $\mathcal C_1,\dots,\mathcal C_K$ のどれかに割り当てるよ。ラベルの表現は、2クラスなら $t\in\{0,1\}$（パーセプトロンでは $\{-1,+1\}$）、$K$ クラスなら第 $k$ 成分だけ 1 の **one-hot 表現**（1-of-$K$ 符号化）をよく使うよ。`],
          [R, 'think', r`分類器を作るには、どんな作戦があるんですか？`],
          [S, 'normal', r`大きく分けて**3つのアプローチ**がある！ この違いは機械学習全体の地図になるからしっかり押さえよう。`],
        ] },
        { t: 'compare', items: [
          { em: '📏', title: '① 識別関数（非確率的）', items: [
            r`確率を介さず、入力 $\mathbf x$ を直接クラスに割り当てる関数 $y(\mathbf x)$ を学習する`,
            r`例：最小2乗分類、**パーセプトロン**、SVM`,
          ] },
          { em: '🎯', title: '② 確率的識別モデル', items: [
            r`クラスの事後確率 $p(\mathcal C_k\mid\mathbf x)$ を**直接**パラメトリックな関数でモデル化する`,
            r`パラメータが少なくて済む！`,
            r`例：**ロジスティック回帰**`,
          ] },
          { em: '🌱', title: '③ 確率的生成モデル', items: [
            r`クラスごとのデータ生成密度 $p(\mathbf x\mid\mathcal C_k)$ と事前確率 $p(\mathcal C_k)$ をモデル化し、**ベイズの定理**で $p(\mathcal C_k\mid\mathbf x)$ を計算する`,
            r`人工データの生成（サンプリング）もできる！`,
          ] },
        ] },
        { t: 'talk', lines: [
          [R, 'think', r`もしデータがドーナツ状みたいに混ざっていて、直線（超平面）で分けられない（**線形分離不可能**な）ときはどうするんですか？`],
          [S, 'wink', r`入力 $\mathbf x$ をそのまま使う代わりに、非線形な**特徴写像** $\boldsymbol\phi(\mathbf x)$ で**特徴空間**へ移すんだ！ たとえばガウス基底で盛り上げると、元の空間では分けられなかった点が、特徴空間ではスパッと超平面で線形分離できるようになるよ。`],
        ] },
      ],
    },
    {
      id: 'geom', title: '線形識別関数の幾何と一般化線形モデル・パーセプトロン',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`線形識別関数 $y(\mathbf x) = \mathbf w^{\mathsf T}\mathbf x + w_0$（$y(\mathbf x)\ge 0$ なら $\mathcal C_1$、$<0$ なら $\mathcal C_2$）の**幾何学的な意味**を見てみよう。決定境界 $y(\mathbf x)=0$ に対して、重み $\mathbf w$ とバイアス $w_0$ は何を表していると思う？`],
        ] },
        { t: 'formula', title: '決定面 y(x) = 0 の3つの幾何学的性質', tag: 'GEOMETRY',
          tex: r`\htmlClass{fp-orth}{\mathbf w^{\mathsf T}(\mathbf x_A - \mathbf x_B) = 0}, \qquad \htmlClass{fp-orig}{\text{原点からの距離} = \frac{-w_0}{\|\mathbf w\|}}, \qquad \htmlClass{fp-dist}{r = \frac{|y(\mathbf x)|}{\|\mathbf w\|}}`,
          parts: [
            ['fp-orth', '重み $\\mathbf w$ は決定面に直交！', '決定面上の任意の2点 $\\mathbf x_A,\\mathbf x_B$ で $y(\\mathbf x_A)=y(\\mathbf x_B)=0$ なので差をとると内積 0。つまり $\\mathbf w$ が**決定面の向き（法線）**を決める！'],
            ['fp-orig', 'バイアス $w_0$ は位置を決める', '原点から決定面までの符号つき直交距離が $-w_0/\\|\\mathbf w\\|$。$w_0$ を変えると決定面が平行移動する。'],
            ['fp-dist', '任意の点 $\\mathbf x$ からの直交距離 $r$', '線形識別関数の値 $y(\\mathbf x)$ は、決定面からの直交距離に比例する！（ダミー入力 $x_0=1$ を入れれば $y(\\mathbf x)=\\tilde{\\mathbf w}^{\\mathsf T}\\tilde{\\mathbf x}$ と書ける）'],
          ] },
        { t: 'point', title: '一般化線形モデル（GLM）とは', items: [
          r`線形結合 $a = \mathbf w^{\mathsf T}\boldsymbol\phi(\mathbf x) + w_0$ は $(-\infty,+\infty)$ の値をとるが、非線形な**活性化関数** $f$ をかぶせて $y(\mathbf x)=f(\mathbf w^{\mathsf T}\boldsymbol\phi(\mathbf x)+w_0)$ としたものを**一般化線形モデル**という（逆関数 $f^{-1}$ を**連結関数 / リンク関数**とよぶ）。`,
          r`$f$ が非線形でも、$y(\mathbf x)=\text{定数}$ となる決定境界は $\mathbf w^{\mathsf T}\boldsymbol\phi(\mathbf x)+w_0=\text{定数}$ なので（特徴空間において）**決定境界は線形**！`,
          r`例①：$f$ がステップ関数 $\Rightarrow$ **パーセプトロン**。例②：$f$ がロジスティックシグモイド関数 $\sigma$（リンク関数はロジット $\ln\frac{y}{1-y}$）$\Rightarrow$ **ロジスティック回帰**。`,
        ] },
        { t: 'formula', title: 'パーセプトロンの誤分類損失と確率的勾配降下法', tag: 'PERCEPTRON',
          tex: r`E_P(\mathbf w) = -\sum_{n\in\mathcal M}\mathbf w^{\mathsf T}\boldsymbol\phi(\mathbf x_n)\,t_n \quad(t_n\in\{-1,+1\}), \qquad \mathbf w^{(\tau+1)} = \mathbf w^{(\tau)} + \eta\,\boldsymbol\phi(\mathbf x_n)\,t_n`,
          note: '$\\mathcal M$ は誤分類されたデータの集合（誤分類時は $\\mathbf w^{\\mathsf T}\\boldsymbol\\phi(\\mathbf x_n)$ と $t_n$ が異符号なので損失は正）。誤分類データを1つ選んで $\\eta\\boldsymbol\\phi(\\mathbf x_n)t_n$ を足す更新を繰り返すと、**線形分離可能なデータなら必ず有限回で収束する**（分離不可能だと収束しない）。' },
        { t: 'lab', id: 'linearBoundaryLab', title: '決定面の幾何とパーセプトロン vs 最小2乗（外れ値のワナ）', foot: '重みベクトル $\\mathbf w$ が決定境界と直交する様子を確認しよう！「外れ値を追加」すると、最小2乗分類は2乗誤差を嫌って境界が大きく歪むが、パーセプトロンやロジスティック回帰は動じない！' },
      ],
    },
    {
      id: 'logistic', title: 'ロジスティック回帰・交差エントロピー・IRLS（ニュートン法）',
      blocks: [
        { t: 'talk', lines: [
          [S, 'happy', r`いよいよ確率的識別モデルの主役、**ロジスティック回帰**！ 名前は「回帰」だけど**分類器**だから気をつけてね。線形式 $a=\mathbf w^{\mathsf T}\boldsymbol\phi(\mathbf x)$ をロジスティックシグモイド関数 $\sigma(a)=\frac{1}{1+e^{-a}}$ に通して、クラス $\mathcal C_1$ の事後確率を直接モデル化するよ。`],
          [R, 'wow', r`$\sigma(0)=0.5$ だから、$p(\mathcal C_1\mid\mathbf x)=p(\mathcal C_2\mid\mathbf x)=0.5$ になる決定境界は $\mathbf w^{\mathsf T}\boldsymbol\phi(\mathbf x)=0$ ですね！ しかも微分が $\sigma'(a)=\sigma(a)\{1-\sigma(a)\}$ できれい！`],
        ] },
        { t: 'formula', title: 'ロジスティック回帰の交差エントロピー誤差関数と勾配・ヘッセ行列', tag: 'LOGISTIC',
          tex: r`E(\mathbf w) = -\ln p(\mathbf t\mid\mathbf w) = -\sum_{n=1}^{N}\big\{t_n\ln y_n + (1-t_n)\ln(1-y_n)\big\}, \qquad \htmlClass{fp-g}{\nabla E(\mathbf w) = \sum_{n=1}^{N}(y_n - t_n)\boldsymbol\phi_n = \Phi^{\mathsf T}(\mathbf y - \mathbf t)}, \qquad \htmlClass{fp-h}{H = \nabla\nabla E(\mathbf w) = \Phi^{\mathsf T}R\Phi}`,
          parts: [
            ['fp-g', '勾配 $\\nabla E(\\mathbf w)$', '出力 $y_n=\\sigma(\\mathbf w^{\\mathsf T}\\boldsymbol\\phi_n)$ と正解 $t_n\\in\\{0,1\\}$ の誤差 $(y_n-t_n)$ に特徴ベクトルを掛けた和！ 線形回帰の2乗和誤差の勾配とまったく同じ形になる（正準連結関数の奇跡！）。'],
            ['fp-h', 'ヘッセ行列 $H = \\Phi^{\\mathsf T}R\\Phi$', '$R$ は第 $n$ 対角成分が $R_{nn}=y_n(1-y_n)>0$ の対角行列。正定値なので $E(\\mathbf w)$ は下に凸で、大域的最小解がただ1つ！'],
          ] },
        { t: 'talk', lines: [
          [R, 'think', r`じゃあ $\nabla E(\mathbf w)=\mathbf 0$ を解けば一発ですか？`],
          [S, 'normal', r`$y_n=\sigma(\mathbf w^{\mathsf T}\boldsymbol\phi_n)$ の中に非線形な $\sigma$ が入っているから、線形回帰みたいに一発の逆行列では解けないんだ。そこで**勾配法** $\mathbf w^{(\tau+1)}=\mathbf w^{(\tau)}-\eta\nabla E$ か、ヘッセ行列 $H$ を使って高速に収束する**ニュートン法（反復重みつき最小2乗法：IRLS）**を使うよ！`],
        ] },
        { t: 'formula', title: '反復重みつき最小2乗法（IRLS：ニュートン・ラフソン法）', tag: 'IRLS',
          tex: r`\mathbf w^{(\mathrm{new})} = \mathbf w^{(\mathrm{old})} - H^{-1}\nabla E(\mathbf w^{(\mathrm{old})}) = \mathbf w^{(\mathrm{old})} - (\Phi^{\mathsf T}R\Phi)^{-1}\Phi^{\mathsf T}(\mathbf y - \mathbf t)`,
          note: '$R$ が $y_n$（つまり現在の $\\mathbf w$）に依存して毎回変わるので、「重みつき最小2乗」を反復（Iterative）する。ただしデータが**完全に線形分離可能**なときは、$\\|\\mathbf w\\|\\to\\infty$ となって尤度が 1（誤差 0）に近づき、境界付近のグレーゾーンが消えてステップ関数化する**過学習**が起きる点に注意！（正則化やベイズ化で防げる）' },
        { t: 'exer', title: '確認演習：ロジスティックシグモイド関数の微分と勾配導出',
          q: r`(1) $\sigma(a)=\dfrac{1}{1+e^{-a}}$ に対し $\dfrac{d\sigma}{da}=\sigma(a)\{1-\sigma(a)\}$ を示せ。<br>(2) 1データ分の交差エントロピー $E_n = -\{t_n\ln y_n + (1-t_n)\ln(1-y_n)\}$（$y_n=\sigma(a_n),\ a_n=\mathbf w^{\mathsf T}\boldsymbol\phi_n$）を $\mathbf w$ で微分し、$\nabla E_n = (y_n-t_n)\boldsymbol\phi_n$ を導け。`,
          hint: r`合成関数の微分 $\nabla E_n = \frac{dE_n}{dy_n}\frac{dy_n}{da_n}\nabla a_n$ を使うと3行で終わる！`,
          steps: [
            r`(1) $\dfrac{d\sigma}{da} = \dfrac{e^{-a}}{(1+e^{-a})^2} = \dfrac{1}{1+e^{-a}}\cdot\dfrac{e^{-a}}{1+e^{-a}} = \sigma(a)\{1-\sigma(a)\}$。`,
            r`(2) $\dfrac{dE_n}{dy_n} = -\dfrac{t_n}{y_n} + \dfrac{1-t_n}{1-y_n} = \dfrac{y_n - t_n}{y_n(1-y_n)}$。`,
            r`これに $\dfrac{dy_n}{da_n} = y_n(1-y_n)$ を掛けると、分母の $y_n(1-y_n)$ がきれいに約分されて $\dfrac{dE_n}{da_n} = y_n - t_n$！`,
            r`最後に $\nabla a_n = \boldsymbol\phi_n$ を掛けて $\nabla E_n = (y_n - t_n)\boldsymbol\phi_n$。全データで足せば $\nabla E = \sum_n(y_n-t_n)\boldsymbol\phi_n$。■`,
          ] },
      ],
    },
    {
      id: 'gen-multi', title: '確率的生成モデルと多クラスロジスティック回帰（ソフトマックス）',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`今度は3番目の流儀、**確率的生成モデル**！ 2クラスの各データ生成分布が「**共通の共分散行列** $\Sigma$ をもつガウス分布」$p(\mathbf x\mid\mathcal C_k)=\mathcal N(\mathbf x\mid\boldsymbol\mu_k,\Sigma)$ だと仮定して、ベイズの定理で事後確率 $p(\mathcal C_1\mid\mathbf x)$ を計算してみよう。`],
          [R, 'wow', r`指数の中を展開すると、$\mathbf x^{\mathsf T}\Sigma^{-1}\mathbf x$ の2次の項が両方のクラスで同じだから**引き算で消える**んですか！？`],
          [S, 'happy', r`大正解！！ 対数オッズ $a = \ln\frac{p(\mathbf x\mid\mathcal C_1)p(\mathcal C_1)}{p(\mathbf x\mid\mathcal C_2)p(\mathcal C_2)}$ が $\mathbf x$ の1次式になるから、事後確率はまたしても**ロジスティックシグモイド関数** $\sigma(\mathbf w^{\mathsf T}\mathbf x+w_0)$ になるんだ！`],
        ] },
        { t: 'formula', title: '共通共分散ガウスの生成モデルと最尤推定解', tag: 'GENERATIVE',
          tex: r`p(\mathcal C_1\mid\mathbf x) = \sigma(\mathbf w^{\mathsf T}\mathbf x + w_0), \quad \mathbf w = \Sigma^{-1}(\boldsymbol\mu_1-\boldsymbol\mu_2), \qquad \pi_{\mathrm{ML}}=\frac{N_1}{N}, \quad \boldsymbol\mu_{k,\mathrm{ML}}=\frac{1}{N_k}\sum_{n\in\mathcal C_k}\mathbf x_n, \quad \Sigma_{\mathrm{ML}} = \frac{N_1}{N}S_1 + \frac{N_2}{N}S_2`,
          note: '$w_0 = -\\frac12\\boldsymbol\\mu_1^{\\mathsf T}\\Sigma^{-1}\\boldsymbol\\mu_1 + \\frac12\\boldsymbol\\mu_2^{\\mathsf T}\\Sigma^{-1}\\boldsymbol\\mu_2 + \\ln\\frac{p(\\mathcal C_1)}{p(\\mathcal C_2)}$。クラスの事前確率の比を変えると $w_0$ だけが変わり、決定境界は**平行移動**する！ パラメータ数は識別モデルが $M$ 個なのに対し、生成モデルは $\\boldsymbol\\mu_1,\\boldsymbol\\mu_2,\\Sigma,\\pi$ で $M(M+5)/2+1$ 個（2乗オーダー）と多いが、データの人工生成ができる利点がある。' },
        { t: 'formula', title: 'K クラス分類：ソフトマックス関数と多クラス交差エントロピー', tag: 'SOFTMAX',
          tex: r`p(\mathcal C_k\mid\boldsymbol\phi) = y_k(\boldsymbol\phi) = \frac{\exp(a_k)}{\sum_{j=1}^{K}\exp(a_j)} \quad(a_k=\mathbf w_k^{\mathsf T}\boldsymbol\phi), \qquad E(\mathbf w_1,\dots,\mathbf w_K) = -\sum_{n=1}^{N}\sum_{k=1}^{K} t_{nk}\ln y_{nk}, \qquad \nabla_{\mathbf w_j}E = \sum_{n=1}^{N}(y_{nj}-t_{nj})\boldsymbol\phi_n`,
          note: '**ソフトマックス関数**はすべての $k$ で $0<y_k<1$ かつ $\\sum_k y_k=1$ を満たす $\\max$ の滑らかな近似。共通共分散ガウスの $K$ クラス生成モデルでも同じくソフトマックス関数が導かれる！' },
        { t: 'lab', id: 'logisticSoftmaxLab', title: 'ロジスティック回帰・IRLS収束と3クラス・ソフトマックス境界', foot: '2クラスモードでは IRLS（ニュートン法）がたった数ステップで収束する様子や線形分離可能データでの過学習を確認！ 3クラスモードではソフトマックス関数が描く美しい決定領域を動かせるよ。' },
        { t: 'quiz', q: '$M$ 次元の入力に対して2クラス分類を行うとき、パラメータ数が少ないのは「確率的識別モデル（ロジスティック回帰）」と「共通共分散ガウスの確率的生成モデル」のどちら？',
          options: ['確率的識別モデル（$M$ に比例して少ない）', '確率的生成モデル（つねに少ない）', 'どちらも同じ個数'],
          answer: 0,
          explain: r`識別モデル（ロジスティック回帰）は重みベクトル分の約 $M$（バイアス込みで $M+1$）個ですが、生成モデルは平均 $\boldsymbol\mu_1,\boldsymbol\mu_2$ と共分散行列 $\Sigma$（$M(M+1)/2$ 個）を推定するため $M$ の2乗オーダーのパラメータが必要になります。` },
        { t: 'point', tone: 'mint', title: '第12章のまとめ', items: [
          '分類には①**識別関数**（パーセプトロン等）、②**確率的識別モデル**（ロジスティック回帰）、③**確率的生成モデル**の3アプローチがある。',
          '線形識別関数 $y(\\mathbf x)=\\mathbf w^{\\mathsf T}\\mathbf x+w_0$ では、$\\mathbf w$ が決定面に直交し、点からの距離は $|y(\\mathbf x)|/\\|\\mathbf w\\|$。',
          'ロジスティック回帰は交差エントロピー誤差を最小化し、勾配は $\\Phi^{\\mathsf T}(\\mathbf y-\\mathbf t)$、ヘッセ行列は $\\Phi^{\\mathsf T}R\\Phi$。ニュートン法が**反復重みつき最小2乗法（IRLS）**になる。',
          '共通共分散ガウスの生成モデルの事後確率もロジスティック回帰（多クラスでは**ソフトマックス関数**）の形になり、事前確率の違いは決定境界の平行移動として現れる。',
        ] },
      ],
    },
  ],
  notes: [
    { h: '決定面までの直交距離', f: r`y(\mathbf x)=\mathbf w^{\mathsf T}\mathbf x+w_0,\quad r=\frac{|y(\mathbf x)|}{\|\mathbf w\|}` },
    { h: 'パーセプトロン学習則', f: r`\mathbf w^{(\tau+1)}=\mathbf w^{(\tau)}+\eta\,\boldsymbol\phi(\mathbf x_n)\,t_n\quad(t_n\in\{-1,+1\})` },
    { h: 'ロジスティックシグモイドとロジット', f: r`\sigma(a)=\frac{1}{1+e^{-a}},\quad \sigma'(a)=\sigma(a)\{1-\sigma(a)\},\quad a=\ln\frac{\sigma}{1-\sigma}` },
    { h: '交差エントロピーの勾配とヘッセ行列', f: r`E=-\sum_n\{t_n\ln y_n+(1-t_n)\ln(1-y_n)\},\quad \nabla E=\Phi^{\mathsf T}(\mathbf y-\mathbf t),\quad H=\Phi^{\mathsf T}R\Phi` },
    { h: 'IRLS（反復重みつき最小2乗法）', f: r`\mathbf w^{(\mathrm{new})}=\mathbf w^{(\mathrm{old})}-(\Phi^{\mathsf T}R\Phi)^{-1}\Phi^{\mathsf T}(\mathbf y-\mathbf t),\quad R_{nn}=y_n(1-y_n)` },
    { h: '生成モデルの最尤推定解', f: r`\pi=\frac{N_1}{N},\quad \boldsymbol\mu_k=\frac{1}{N_k}\sum_{n\in\mathcal C_k}\mathbf x_n,\quad \Sigma=\frac{N_1}{N}S_1+\frac{N_2}{N}S_2` },
    { h: 'ソフトマックス関数（多クラス）', f: r`y_k=\frac{\exp(a_k)}{\sum_j\exp(a_j)},\quad E=-\sum_n\sum_k t_{nk}\ln y_{nk},\quad \nabla_{\mathbf w_j}E=\sum_n(y_{nj}-t_{nj})\boldsymbol\phi_n` },
  ],
}
