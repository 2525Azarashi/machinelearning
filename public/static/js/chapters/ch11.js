const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 11, slug: 'evidence-approximation', en: 'EVIDENCE APPROXIMATION', color: '#8CC8FF',
  title: 'エビデンス近似（経験ベイズ）',
  sub: '超パラメータ α・β も、データ自身のエビデンス最大化で決めてしまう。',
  lead: '完全なベイズ予測分布の近似、対数モデルエビデンスの厳密計算、不動点反復と有効パラメータ数 γ の美しい意味。',
  src: 'ML02_5_evidence_approximation',
  goals: ['完全なベイズ予測とエビデンス近似の考え方', '線形回帰の対数モデルエビデンス', '超パラメータ α・β の自己無撞着な反復更新', 'βΦᵀΦ の固有値と有効パラメータ数 γ'],
  icon: 'valley',
  sections: [
    {
      id: 'idea', title: 'エビデンス近似（経験ベイズ）の基本アイデア',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`第9回のベイズ線形回帰では「事前の精度 $\alpha$ とノイズ精度 $\beta$ は既知定数とする」って言ってましたけど、実際には $\alpha$ も $\beta$ もわからないですよね？`],
          [S, 'happy', r`鋭い！ 本当の意味での「完全なベイズ予測分布」は、$\alpha,\beta$ にも事前分布を置いて全部を積分消去した $p(t\mid\mathbf x,\mathbf t)=\iiint p(t\mid\mathbf x,\mathbf w,\beta)p(\mathbf w\mid\mathbf t,\alpha,\beta)p(\alpha,\beta\mid\mathbf t)\,d\mathbf w\,d\alpha\,d\beta$ なんだけど、この3重積分は解析的には計算できないんだ。`],
          [S, 'normal', r`そこで！ 超パラメータの事後分布 $p(\alpha,\beta\mid\mathbf t)$ が最頻値 $(\hat\alpha,\hat\beta)$ のまわりに鋭く集中していると仮定して、**モデルエビデンス（周辺尤度） $p(\mathbf t\mid\alpha,\beta)$ を最大にする $(\hat\alpha,\hat\beta)$ を代入して近似**するよ！`],
        ] },
        { t: 'formula', title: 'エビデンス近似（経験ベイズ / 第2種の最尤推定）', tag: 'IDEA',
          tex: r`p(\mathbf t\mid\alpha,\beta) = \int p(\mathbf t\mid\mathbf w,\beta)\,p(\mathbf w\mid\alpha)\,d\mathbf w, \qquad p(t\mid\mathbf x,\mathbf t) \;\approx\; p(t\mid\mathbf x,\mathbf t,\hat\alpha,\hat\beta)`,
          note: '別名：**経験ベイズ**（empirical Bayes）、**第2種の最尤推定**（type-II ML）、**一般化最尤推定**。確認用データを使わず、学習データだけで正則化の強さ $\\alpha$ もノイズ精度 $\\beta$ も決められる！' },
      ],
    },
    {
      id: 'log-ev', title: '線形回帰における対数モデルエビデンス',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`ベイズ線形回帰では、尤度も事前分布もガウスだから、指数の肩を $\mathbf w$ について平方完成すると周辺尤度 $p(\mathbf t\mid\alpha,\beta)$ の積分が厳密に求まるよ！`],
        ] },
        { t: 'formula', title: '対数モデルエビデンス（線形回帰）', tag: 'LOG EVIDENCE',
          tex: r`\ln p(\mathbf t\mid\alpha,\beta) = \htmlClass{fp-p1}{\frac{M}{2}\ln\alpha + \frac{N}{2}\ln\beta} - \htmlClass{fp-em}{E(\mathbf m_N)} - \htmlClass{fp-det}{\frac12\ln|A|} - \frac{N}{2}\ln(2\pi)`,
          parts: [
            ['fp-em', '$E(\\mathbf m_N)$（正則化誤差の最小値）', '$E(\\mathbf m_N)\\equiv\\frac{\\beta}{2}\\|\\mathbf t-\\Phi\\mathbf m_N\\|^2 + \\frac{\\alpha}{2}\\mathbf m_N^{\\mathsf T}\\mathbf m_N$。MAP解 $\\mathbf m_N=\\beta A^{-1}\\Phi^{\\mathsf T}\\mathbf t$ での誤差。'],
            ['fp-det', '$\\frac12\\ln|A|$（精度行列の行列式）', '$A \\equiv S_N^{-1} = \\alpha I + \\beta\\Phi^{\\mathsf T}\\Phi$。事後分布の広がり（オッカム因子）に対応する項！'],
            ['fp-p1', '正規化定数由来の項', '$\\alpha$ や $\\beta$ を大きくしすぎると $E(\\mathbf m_N)$ や $\\ln|A|$ と競り合って最適値が決まる。'],
          ] },
      ],
    },
    {
      id: 'iter', title: 'エビデンス最大化と有効パラメータ数 γ',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`この $\ln p(\mathbf t\mid\alpha,\beta)$ を $\alpha$ と $\beta$ で微分して 0 とおけば $\hat\alpha,\hat\beta$ が出るんですね！`],
          [S, 'wink', r`やってみると面白いことが起きるよ。第7回の公式 $\frac{d}{d\alpha}\ln|A|=\mathrm{Tr}(A^{-1}\frac{dA}{d\alpha})=\mathrm{Tr}(A^{-1})$ を使って $\frac{d}{d\alpha}\ln p(\mathbf t\mid\alpha)=0$ を整理すると……`],
        ] },
        { t: 'formula', title: 'α の停留条件と不動点反復', tag: 'ITERATION',
          tex: r`\frac{d}{d\alpha}\ln p(\mathbf t\mid\alpha) = \frac{M}{2\alpha} - \frac12\mathbf m_N^{\mathsf T}\mathbf m_N - \frac12\mathrm{Tr}(A^{-1}) = 0 \;\;\Longleftrightarrow\;\; \alpha = \psi(\alpha) \equiv \frac{M}{\mathbf m_N^{\mathsf T}\mathbf m_N + \mathrm{Tr}(A^{-1})}`,
          note: '右辺の $\\mathbf m_N$ も $A$ も $\\alpha$ に依存するため**陽には解けていない**！ そこで適当な初期値 $\\alpha_0$ から $\\alpha_{k+1}=\\psi(\\alpha_k)$ を収束するまで繰り返す。' },
        { t: 'talk', lines: [
          [S, 'happy', r`さらに、対称正定値行列 $\beta\Phi^{\mathsf T}\Phi$ の固有値を $\lambda_1,\dots,\lambda_M$ とおくと、$A=\alpha I+\beta\Phi^{\mathsf T}\Phi$ の固有値は $\lambda_i+\alpha$ になるよね。すると $\mathrm{Tr}(A^{-1})=\sum_{i=1}^M \frac{1}{\lambda_i+\alpha}$ と書けて、**有効パラメータ数** $\gamma$ という超重要な量が現れるんだ！`],
        ] },
        { t: 'formula', title: '有効パラメータ数 γ を使った α・β の更新式', tag: 'KEY',
          tex: r`\htmlClass{fp-gam}{\gamma \equiv \sum_{i=1}^{M}\frac{\lambda_i}{\lambda_i + \alpha}}, \qquad \htmlClass{fp-alp}{\alpha = \frac{\gamma}{\mathbf m_N^{\mathsf T}\mathbf m_N}}, \qquad \htmlClass{fp-bet}{\frac{1}{\beta} = \frac{1}{N - \gamma}\sum_{n=1}^{N}\big\{t_n - \mathbf m_N^{\mathsf T}\boldsymbol\phi(\mathbf x_n)\big\}^2}`,
          parts: [
            ['fp-gam', '有効パラメータ数 $\\gamma$（$0\\le\\gamma\\le M$）', 'データの情報 $\\lambda_i$ が事前 $\\alpha$ より十分大きい方向（$\\lambda_i\\gg\\alpha$）では $\\frac{\\lambda_i}{\\lambda_i+\\alpha}\\approx 1$、逆（$\\lambda_i\\ll\\alpha$）では $\\approx 0$。つまり**データが実質的に決定しているパラメータの個数**！'],
            ['fp-alp', '$\\alpha$ の更新式', '重みの2乗和 $\\|\\mathbf m_N\\|^2$ を有効パラメータ数 $\\gamma$ で割ったものの逆数が事前の精度になる。'],
            ['fp-bet', '$\\beta^{-1}$（ノイズ分散）の更新式', '最尤推定では $N$ で割った残差2乗和を、ここでは自由度 **$N-\\gamma$** で割る！（不偏分散の $N-1$ の一般化！）'],
          ] },
        { t: 'compare', items: [
          { em: '💪', title: '$\\lambda_i \\gg \\alpha$ の方向（データ主導）', items: [
            r`$\dfrac{\lambda_i}{\lambda_i+\alpha} \approx 1$ として $\gamma$ にカウントされる`,
            r`事前分布の影響が小さく、$w_{\mathrm{MAP}}$ の成分は最尤解 $w_{\mathrm{ML}}$ に近い`,
            r`データによってしっかり決まる「有効な」パラメータ`,
          ] },
          { em: '💤', title: '$\\lambda_i \\ll \\alpha$ の方向（事前主導）', items: [
            r`$\dfrac{\lambda_i}{\lambda_i+\alpha} \approx 0$ となり $\gamma$ にほとんど寄与しない`,
            r`事前分布に強く引っ張られ、データに無関係に **0 付近に潰される**`,
            r`余分な基底があっても自動で無効化され、過学習しない！`,
          ] },
        ] },
        { t: 'lab', id: 'evidenceLab', title: 'エビデンス近似ラボ：α を自動推定して γ を見る', foot: '基底の数 $M$ を変えても、対数エビデンス $\\ln p(\\mathbf t\\mid\\alpha,\\beta)$ の山頂（黄色い丸）を選ぶと過学習しない！「α, β を自動反復」ボタンで不動点反復が山頂へ登る様子を見よう。' },
        { t: 'quiz', q: '$M=10$ 個のパラメータをもつ線形回帰モデルで、$\\beta\\Phi^{\\mathsf T}\\Phi$ の固有値のうち 4 個が $\\lambda_i \\gg \\alpha$、残り 6 個が $\\lambda_i \\ll \\alpha$ だった。有効パラメータ数 $\\gamma$ はおよそいくつ？',
          options: ['およそ 0', 'およそ 4', 'およそ 10'],
          answer: 1,
          explain: r`$\lambda_i\gg\alpha$ の4個が約 $1$、$\lambda_i\ll\alpha$ の6個が約 $0$ になるため、和である $\gamma=\sum_{i=1}^{10}\frac{\lambda_i}{\lambda_i+\alpha}$ はおよそ $4$ になります。` },
        { t: 'point', tone: 'lav', title: '第11章のまとめ', items: [
          '**エビデンス近似（経験ベイズ）**は、周辺尤度 $p(\\mathbf t\\mid\\alpha,\\beta)$ を最大にする $(\\hat\\alpha,\\hat\\beta)$ を用いて予測分布を近似する手法。',
          '対数エビデンス $\\ln p(\\mathbf t\\mid\\alpha,\\beta)=\\frac M2\\ln\\alpha+\\frac N2\\ln\\beta-E(\\mathbf m_N)-\\frac12\\ln|A|-\\frac N2\\ln(2\\pi)$ は閉じた式で書ける。',
          '$\\beta\\Phi^{\\mathsf T}\\Phi$ の固有値 $\\lambda_i$ を1回求めておけば、$\\gamma=\\sum_i\\frac{\\lambda_i}{\\lambda_i+\\alpha}$ を使って高速に反復更新できる。',
          '$\\gamma$ はデータによって決まる**有効パラメータ数**（$0\\le\\gamma\\le M$）を表し、残りの $M-\\gamma$ 個の成分は事前分布によって 0 近くに抑えられる。',
        ] },
      ],
    },
  ],
  notes: [
    { h: 'エビデンス（周辺尤度）', f: r`p(\mathbf t\mid\alpha,\beta)=\int p(\mathbf t\mid\mathbf w,\beta)\,p(\mathbf w\mid\alpha)\,d\mathbf w` },
    { h: '対数モデルエビデンス', f: r`\ln p(\mathbf t\mid\alpha,\beta)=\frac M2\ln\alpha+\frac N2\ln\beta-E(\mathbf m_N)-\frac12\ln|A|-\frac N2\ln(2\pi)` },
    { h: '有効パラメータ数 γ', f: r`\gamma=\sum_{i=1}^{M}\frac{\lambda_i}{\lambda_i+\alpha}\quad(\lambda_i\text{ は }\beta\Phi^{\mathsf T}\Phi\text{ の固有値})` },
    { h: 'エビデンス最大化の反復式', f: r`\alpha=\frac{\gamma}{\mathbf m_N^{\mathsf T}\mathbf m_N},\qquad \frac{1}{\beta}=\frac{1}{N-\gamma}\sum_{n=1}^{N}\{t_n-\mathbf m_N^{\mathsf T}\boldsymbol\phi(\mathbf x_n)\}^2` },
  ],
}
