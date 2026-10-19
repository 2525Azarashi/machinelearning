const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 5, slug: 'decision', en: 'DECISION THEORY', color: '#8CC8FF',
  title: '決定理論',
  sub: '確率がわかったら、どう行動するのが最適？',
  lead: '回帰なら条件つき期待値、分類なら事後確率最大のクラス。ベイズ決定則。',
  src: 'ML01_5_decision_theory',
  goals: ['決定理論の役割', '回帰のベイズ決定則', '0-1損失と誤分類率', '分類のベイズ決定則'],
  icon: 'split',
  sections: [
    {
      id: 'intro', title: '確率から行動へ',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`血液データ $\mathbf x$ から、ある生活習慣病にかかっている確率 $p(t=1\mid\mathbf x)$ がわかったとする。さて、食事を変えるべき？`],
          [R, 'think', r`確率が 0.5 を超えたら変える……とか？`],
          [S, 'happy', r`その「どこで線を引くか」に答えるのが**決定理論**。==確率 $p(\mathbf x,t)$ をもとに、期待損失を最小にする最適な行動==を教えてくれる。回帰と分類、それぞれで最適な予測モデルの形を求めよう。`],
        ] },
      ],
    },
    {
      id: 'reg', title: '回帰のベイズ決定則',
      blocks: [
        { t: 'formula', title: '回帰：期待2乗誤差損失を最小にする関数', tag: 'BAYES RULE', tex: r`\mathbb E[L] = \iint\{y(\mathbf x)-t\}^2p(\mathbf x,t)\,d\mathbf x\,dt \;\;\Longrightarrow\;\; y^{*}(\mathbf x) = \int t\,p(t\mid\mathbf x)\,dt = \mathbb E[t\mid\mathbf x]`, note: '最適な回帰関数は、$t$ の事後確率 $p(t\\mid\\mathbf x)$ に関する**期待値（条件つき平均）**。' },
        { t: 'talk', lines: [
          [R, 'think', r`各 $\mathbf x$ で、$t$ の分布の「平均」を答えればいいってことですか？`],
          [S, 'happy', r`そう！ 下のラボで、ある $x$ における $t$ のばらつき（黄色い山）に対して、どこを予測すると損失が一番小さいか試してみて。`],
        ] },
        { t: 'lab', id: 'condMean', title: '各 x で「どこを答える」と損失最小？', foot: '紫の点＝$p(\\mathbf x,t)$ からのサンプル、緑の線＝条件つき期待値 $\\mathbb E[t\\mid x]$。' },
        { t: 'exer', title: '証明：回帰のベイズ決定則', q: r`期待2乗誤差損失 $\mathbb E[L]=\iint\{y(\mathbf x)-t\}^2p(\mathbf x,t)\,d\mathbf x\,dt$ を最小にする $y(\mathbf x)$ が $\mathbb E[t\mid\mathbf x]$ であることを示せ。`,
          hint: r`$\{y-t\}^2 = \{y-\mathbb E[t|\mathbf x]+\mathbb E[t|\mathbf x]-t\}^2$ と分解し、$p(\mathbf x,t)=p(t|\mathbf x)p(\mathbf x)$ を使う。`,
          steps: [
            r`$\{y(\mathbf x)-t\}^2 = \{y(\mathbf x)-\mathbb E[t|\mathbf x]\}^2 + 2\{y(\mathbf x)-\mathbb E[t|\mathbf x]\}\{\mathbb E[t|\mathbf x]-t\} + \{\mathbb E[t|\mathbf x]-t\}^2$`,
            r`$p(\mathbf x,t)=p(t|\mathbf x)p(\mathbf x)$ をかけて $t$ で積分。交差項は $\int\{\mathbb E[t|\mathbf x]-t\}p(t|\mathbf x)dt = \mathbb E[t|\mathbf x]-\mathbb E[t|\mathbf x] = 0$ で消える。`,
            r`$\mathbb E[L] = \int\{y(\mathbf x)-\mathbb E[t|\mathbf x]\}^2p(\mathbf x)\,d\mathbf x + \int\mathrm{var}[t|\mathbf x]\,p(\mathbf x)\,d\mathbf x$`,
            r`第2項は $y$ に無関係（ノイズ由来の消せない誤差）。第1項は $\ge 0$ で、$y(\mathbf x)=\mathbb E[t|\mathbf x]$ のときに限り 0。`,
            r`よって $y^*(\mathbf x)=\mathbb E[t\mid\mathbf x]$ で $\mathbb E[L]$ は最小。■`,
          ] },
      ],
    },
    {
      id: 'cls', title: '2クラス分類と誤分類率',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`次は分類。$\mathbf x$ はクラス $C_1$ か $C_2$ のどちらかに属する。2クラス分類は、$\mathbf x$ を $C_1$ と判定する**領域 $\mathcal R_1$** と、$C_2$ と判定する**領域 $\mathcal R_2$** を決める問題なんだ。`],
          [S, 'think', r`分類器は必ずしも正しいとは限らない。そこで損失として**0-1損失**（正解なら 0、誤りなら 1）を使うと、期待損失は……`],
        ] },
        { t: 'formula', title: '期待0-1損失 ＝ 誤分類率', tex: r`p(\text{error}) = \htmlClass{fp-a}{\int_{\mathcal R_2} p(\mathbf x, C_1)\,d\mathbf x} + \htmlClass{fp-b}{\int_{\mathcal R_1} p(\mathbf x, C_2)\,d\mathbf x}`,
          parts: [['fp-a', '第1項', '本当は $C_1$ なのに $\\mathcal R_2$（$C_2$ と判定）に入ってしまう確率。'], ['fp-b', '第2項', '本当は $C_2$ なのに $C_1$ と判定してしまう確率。']], note: '領域 $\\mathcal R_1, \\mathcal R_2$ の決め方しだいで $p(\\text{error})$ は変わる。' },
        { t: 'lab', id: 'bayesBoundary', title: '境界をドラッグして誤分類率を最小に', foot: '赤の塗り＝$C_1$ なのに $C_2$ と判定された部分、緑の塗り＝その逆。黄色＝境界の置き方が悪いせいで増えた誤り。' },
        { t: 'talk', lines: [
          [R, 'wow', r`2つの山の**交点**に境界を置くと、黄色が完全に消えた！`],
          [S, 'happy', r`各 $\mathbf x$ で、積分値が小さくなる方に割り当てればいいの。つまり $p(\mathbf x,C_1) > p(\mathbf x,C_2)$ なら $C_1$。両辺を $p(\mathbf x)$ で割れば==事後確率 $p(C_k\mid\mathbf x)$ が最大のクラスを選ぶ==ってこと。`],
        ] },
        { t: 'formula', title: '分類のベイズ決定則', tag: 'BAYES RULE', tex: r`\mathbf x \in \mathcal R_k \iff k = \arg\max_{j}\; p(C_j\mid\mathbf x) \qquad\big(\Leftrightarrow\ \arg\max_j\, p(\mathbf x, C_j)\big)`, note: '決定境界 $x^*$ は $p(\\mathbf x,C_1)=p(\\mathbf x,C_2)$ となる点。多クラス分類でも、事後確率最大のクラスを選べば誤分類率が最小。' },
        { t: 'kinetic', words: ['迷ったら', ['事後確率が', 'pop3'], ['いちばん大きい', 'pop'], 'クラスへ。'] },
        { t: 'quiz', q: '事前確率 $p(C_1)$ を大きくすると、最適な決定境界はどう動く？（$C_1$ の山が左、$C_2$ が右）', options: ['左（$C_1$ の領域が狭くなる）', '右（$C_1$ の領域が広くなる）', '動かない'], answer: 1, explain: r`$p(\mathbf x,C_1)=p(\mathbf x|C_1)p(C_1)$ の山が高くなるので、交点は右へ。もともと $C_1$ が多いなら、迷う領域では $C_1$ と答えるのが得。ラボのスライダーで確かめてみて。` },
      ],
    },
    {
      id: 'caution', title: '注意：神のみぞ知る確率',
      blocks: [
        { t: 'talk', lines: [
          [R, 'happy', r`じゃあ事後確率さえわかれば、もう最強ですね！`],
          [S, 'wink', r`それが問題で、事後確率 $p(C_k\mid\mathbf x)$ も $p(t\mid\mathbf x)$ も、一般には**神のみぞ知る**。だから機械学習では==これらの確率をデータから推論する==。決定理論は「確率がわかれば最適な答えはこれ」というゴールを示してくれるんだ。`],
        ] },
        { t: 'point', tone: 'lav', title: '第5章のまとめ', items: ['決定理論：確率 $p(\\mathbf x,t)$ から期待損失最小の行動（予測）を導く。', '回帰（2乗損失）：$y^*(\\mathbf x)=\\mathbb E[t\\mid\\mathbf x]$。$\\mathrm{var}[t|\\mathbf x]$ ぶんの誤差は消せない。', '分類（0-1損失）：期待損失＝誤分類率。**事後確率最大のクラス**を選ぶと最小。', 'ただし真の確率は未知 → データから推論するのが機械学習。'] },
      ],
    },
  ],
  notes: [
    { h: '回帰のベイズ決定則', f: r`y^*(\mathbf x)=\mathbb E[t|\mathbf x]=\int t\,p(t|\mathbf x)\,dt` },
    { h: '期待2乗損失の分解', f: r`\mathbb E[L]=\int\{y(\mathbf x)-\mathbb E[t|\mathbf x]\}^2p(\mathbf x)d\mathbf x+\int\mathrm{var}[t|\mathbf x]p(\mathbf x)d\mathbf x` },
    { h: '誤分類率', f: r`p(\text{error})=\int_{\mathcal R_2}p(\mathbf x,C_1)d\mathbf x+\int_{\mathcal R_1}p(\mathbf x,C_2)d\mathbf x` },
    { h: '分類のベイズ決定則', f: r`k^*=\arg\max_k p(C_k|\mathbf x)` },
  ],
}
