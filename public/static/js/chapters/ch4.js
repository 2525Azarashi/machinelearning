const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 4, slug: 'loss', en: 'LOSS & ERROR', color: '#FFD66B',
  title: '損失と誤差関数',
  sub: '「どれくらいダメか」を数にする。',
  lead: '損失・期待損失・経験損失・誤差関数。そして「汎化」こそが機械学習の本質。',
  src: 'ML01_4_loss_error_function',
  goals: ['損失関数とは', '期待損失と経験損失', '誤差関数', 'いろいろな損失', '汎化'],
  icon: 'valley',
  sections: [
    {
      id: 'loss', title: '損失関数：1回の予測の「痛さ」',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`誤差、損失、誤差関数……似た言葉がいっぱいで混乱してきました。`],
          [S, 'happy', r`今回はそこを整理する回。まず**損失**は、==1つのデータに対して、予測 $y(\mathbf x)$ が正解 $t$ からどれだけ外れて“痛い”か==を表す関数だよ。`],
        ] },
        { t: 'formula', title: '2乗誤差損失', tex: r`L\big(t, y(\mathbf x)\big) = \{y(\mathbf x) - t\}^2`, note: '損失は $t$ と $y(\\mathbf x)$ を独立変数とする関数。回帰でよく使う。でも目的に応じていろいろな損失がある。' },
        { t: 'lab', id: 'loss', title: 'いろいろな損失のかたち', foot: '横軸は「マージン」$t\\cdot y$（$t\\in\\{-1,+1\\}$ の2クラス分類で、正解の側に自信をもつほど右）。チップで線を表示／非表示。' },
        { t: 'compare', items: [
          { em: '📐', title: '2乗誤差損失', items: ['回帰の定番', '大きなズレを強く罰する', 'ガウスノイズの最尤推定と対応（3章）'] },
          { em: '🚦', title: '0-1 損失', items: ['正しく分類 → 0、誤り → 1', '期待値は**誤分類率**（5章）', '段差があって最適化しにくい'] },
          { em: '🧪', title: '交差エントロピー損失', items: ['確率を出力する分類器向け', '自信満々で間違えると大きく罰する', 'ロジスティック回帰・ニューラルネット'] },
          { em: '🔩', title: 'ヒンジ損失', items: ['マージン 1 未満を罰する', 'サポートベクターマシンで使う'] },
        ] },
      ],
    },
    {
      id: 'expected', title: '期待損失と経験損失',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`1個のデータの損失だけじゃモデルの良し悪しはわからない。**あらゆるデータについての平均**を考えたい。データ $(\mathbf x,t)$ が同時分布 $p(\mathbf x,t)$ にしたがうとして……`],
        ] },
        { t: 'formula', title: '期待損失（期待2乗誤差損失）', tex: r`\mathbb E[L] = \iint \{y(\mathbf x) - t\}^2\, \htmlClass{fp-p}{p(\mathbf x, t)}\; d\mathbf x\, dt`,
          parts: [['fp-p', '同時分布 $p(\\mathbf x,t)$', '**一般にはわからない**！ だから期待損失は直接計算できない。']], note: '期待損失が小さいモデルほど良いモデル。期待損失が最小のモデルが**最適モデル**。$\\mathbf x$ の積分は $D$ 重積分。' },
        { t: 'talk', lines: [
          [R, 'think', r`でも $p(\mathbf x,t)$ がわからないなら、期待損失も計算できないじゃないですか。`],
          [S, 'wink', r`そこで2章の**大数の法則**の出番。期待値はデータの平均で近似できたよね。`],
        ] },
        { t: 'formula', title: '経験損失（経験2乗誤差損失）', tex: r`\widehat{L} = \frac1N\sum_{n=1}^{N} \{y(\mathbf x_n) - t_n\}^2 \;\approx\; \mathbb E[L]`, note: '1つひとつのデータに対する損失の平均。一般にはわからない期待損失の近似。' },
        { t: 'lab', id: 'empirical', title: '経験損失は期待損失に近づく？', foot: '赤い直線は固定したモデル。データ数 $N$ を変えたり取り直したりして、経験損失のブレを観察しよう。' },
        { t: 'kinetic', words: ['本当に', ['小さくしたい', 'pop3'], 'のは', ['期待損失。', 'pop'], 'でも', ['見えるのは', 'pop2'], '経験損失だけ。'] },
      ],
    },
    {
      id: 'error', title: '誤差関数：パラメータの関数として',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`モデルがパラメータ $\mathbf w$ をもつとき、出力を $y(\mathbf x,\mathbf w)$ と書いて、$\mathbf w$ の関数であることをはっきりさせる。`],
        ] },
        { t: 'formula', title: '誤差関数（2乗和誤差関数）', tex: r`E(\mathbf w) = \frac12\sum_{n=1}^{N}\{y(\mathbf x_n,\mathbf w) - t_n\}^2 \;\;=\;\; \frac N2\,\widehat L`, note: '経験損失の $N$ 倍（の $\\frac12$）。最小化する $\\mathbf w$ は同じ。誤差関数は**損失関数**とも呼ばれ、$L(\\mathbf w)$ や $L$ と書かれることもある（1個のデータの損失と混同注意！）。' },
        { t: 'point', title: '言葉の整理', items: ['**損失** $L(t,y)$：1つのデータに対する予測の痛さ。', '**期待損失** $\\mathbb E[L]$：真の分布での平均。理想だけど計算できない。', '**経験損失** $\\widehat L$：手元のデータでの平均。期待損失の近似。', '**誤差関数** $E(\\mathbf w)$：経験損失を $\\mathbf w$ の関数として見たもの（定数倍）。これを最小化するのが学習。'] },
        { t: 'quiz', q: '「データ数を増やすほど、経験損失が期待損失のよい近似になる」の根拠は？', options: ['中心極限定理', '大数の法則', 'ベイズの定理'], answer: 1, explain: r`大数の法則：$\frac1N\sum_n f(x_n)\to\mathbb E[f(X)]$。損失 $L$ を $f$ だと思えば、経験損失 → 期待損失。` },
      ],
    },
    {
      id: 'gen', title: '汎化：機械学習の本質',
      blocks: [
        { t: 'talk', lines: [
          [R, 'happy', r`なんか全体像が見えてきました！`],
          [S, 'happy', r`まとめるとこう。同時分布 $p(\mathbf x,t)$ は未知だから、最適なモデルはわからない。そこで、==有限個のデータから $p(\mathbf x,t)$ を推定し、期待損失を近似して、最適モデルの近似を定める==。これが機械学習の本質。`],
          [S, 'normal', r`学習データから $p(\mathbf x,t)$ の近似を求めることを**汎化**（あるいは**推論**）っていうよ。`],
        ] },
        { t: 'flow', nodes: [
          { em: '🌫', t: '未知の p(x, t)', s: '神のみぞ知る' },
          { em: '📒', t: '有限個のデータ', s: '$(\\mathbf x_n, t_n)$', bg: '#FFF4CC' },
          { em: '🔮', t: '汎化（推論）', s: 'p(x,t) を近似／経験損失で期待損失を近似', bg: '#ECE6FF' },
          { em: '🏆', t: '最適モデルの近似', bg: '#D7F5EC' },
        ] },
        { t: 'point', tone: 'mint', title: '第4章のまとめ', items: ['損失 → 期待損失（真の分布で平均）→ 経験損失（データで平均）→ 誤差関数（$\\mathbf w$ の関数）。', '期待損失は計算できないので、大数の法則を根拠に経験損失で近似する。', '目的に応じて 2乗・0-1・交差エントロピー・ヒンジなどの損失を使い分ける。', '有限データから未知の分布を推し量る＝**汎化**が機械学習の本質。'] },
      ],
    },
  ],
  notes: [
    { h: '2乗誤差損失', f: r`L(t,y(\mathbf x))=\{y(\mathbf x)-t\}^2` },
    { h: '期待損失', f: r`\mathbb E[L]=\iint\{y(\mathbf x)-t\}^2p(\mathbf x,t)\,d\mathbf x\,dt` },
    { h: '経験損失', f: r`\widehat L=\frac1N\sum_n\{y(\mathbf x_n)-t_n\}^2` },
    { h: '誤差関数', f: r`E(\mathbf w)=\frac12\sum_n\{y(\mathbf x_n,\mathbf w)-t_n\}^2` },
    { h: '0-1 損失', f: r`L=\begin{cases}0 & y(\mathbf x)=t\\ 1 & y(\mathbf x)\ne t\end{cases}` },
  ],
}
