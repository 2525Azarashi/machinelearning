const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 7, slug: 'matrix', en: 'MATRIX & CALCULUS', color: '#FFB86B',
  title: '行列と微分（Advanced）',
  sub: '何百個もの偏微分を、たった1行で書く魔法。',
  lead: '転置・逆行列・トレースの裏技から、1次形式・2次形式・行列式・ヘッセ行列の微分まで。Part II の計算を一気にラクにする道具箱。',
  src: 'ML02_1/2_matrix_advanced_summary',
  goals: ['転置・逆行列・トレースの性質', 'ベクトルと行列による微分（勾配∇）', '1次形式と2次形式の微分', 'トレースと行列式の微分公式', 'ガウス分布の共分散微分とヘッセ行列'],
  icon: 'grid',
  sections: [
    {
      id: 'props', title: '転置・逆行列・トレースの重要性質',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`先輩、Part II に入ったら急に行列だらけになりました……！ 逆行列とかトレースとか、どこを見ればいいんですか？`],
          [S, 'happy', r`大丈夫、使う性質はほんの数本だけ！ 特に**共分散行列** $\Sigma$ は**対称行列**（$\Sigma^{\mathsf T}=\Sigma$）だから、逆行列 $\Sigma^{-1}$ も対称になるっていう性質が毎回出てくるよ。`],
        ] },
        { t: 'compare', items: [
          { em: '🔄', title: '逆行列と転置の性質', items: [
            r`I1) $(AB)^{-1} = B^{-1}A^{-1}$（順番が逆になる！）`,
            r`I2) $A$ が**対称行列**なら $A^{-1}$ も対称行列`,
            r`T1) $(A^{\mathsf T})^{\mathsf T} = A$`,
            r`T2) $(AB)^{\mathsf T} = B^{\mathsf T}A^{\mathsf T}$（転置も順番が逆！）`,
          ] },
          { em: '➕', title: 'トレース $\\mathrm{Tr}(A)$ の性質', items: [
            r`正方行列の**対角成分の和** $\mathrm{Tr}(A)=\sum_i a_{ii}$`,
            r`Tb1) $\mathrm{Tr}(kA)=k\,\mathrm{Tr}(A)$（$k$ はスカラー）`,
            r`Tb2) $\mathrm{Tr}(A+B)=\mathrm{Tr}(A)+\mathrm{Tr}(B)$`,
            r`Tb3) $\mathrm{Tr}(A^{\mathsf T})=\mathrm{Tr}(A)$、巡回性 $\mathrm{Tr}(AB)=\mathrm{Tr}(BA)$`,
          ] },
        ] },
        { t: 'talk', lines: [
          [R, 'wow', r`積の転置も逆行列も、カッコを外すと順番がひっくり返るんですね。靴下を履いて靴を履いたら、脱ぐときは靴が先、みたいな！`],
          [S, 'wink', r`いい覚え方！ そしてもうひとつ超頻出の裏技がこれ。2次形式 $\mathbf x^{\mathsf T}A^{-1}\mathbf x$ は**スカラー**（ただの1個の数）だから、1×1 行列だと思って $\mathrm{Tr}$ をかぶせても値が変わらないの。`],
        ] },
        { t: 'formula', title: '2次形式をトレースに書き換える裏技', tag: 'TRICK',
          tex: r`\htmlClass{fp-q}{\mathbf x^{\mathsf T}A^{-1}\mathbf x} \;=\; \mathrm{Tr}\!\big(\mathbf x^{\mathsf T}A^{-1}\mathbf x\big) \;=\; \htmlClass{fp-tr}{\mathrm{Tr}\!\big(A^{-1}\mathbf x\mathbf x^{\mathsf T}\big)}`,
          parts: [
            ['fp-q', '2次形式 $\\mathbf x^{\\mathsf T}A^{-1}\\mathbf x$', '結果はスカラー（1×1行列）なので、そのまま $\\mathrm{Tr}$ に入れてOK。'],
            ['fp-tr', '$\\mathrm{Tr}(A^{-1}\\mathbf x\\mathbf x^{\\mathsf T})$', '巡回性 $\\mathrm{Tr}(BC)=\\mathrm{Tr}(CB)$ で $\\mathbf x^{\\mathsf T}$ を右へ回した形。$A$ とデータ $\\mathbf x\\mathbf x^{\\mathsf T}$ が分離できて微分しやすくなる！'],
          ],
          note: '多次元ガウス分布の共分散行列 $\\Sigma$ で微分するときに大活躍する変形。' },
      ],
    },
    {
      id: 'why', title: 'なんで行列の微分が必要なのか？',
      blocks: [
        { t: 'talk', lines: [
          [R, 'think', r`そもそも、1変数ずつ偏微分すればいいのに、なんでわざわざベクトルや行列で微分するんですか？`],
          [S, 'normal', r`たとえば $f(x,y,z) = 2x^2 + y^2 + z^2 - 4x - 2y - 2z + 4$ の極値を求めたいとしよう。変数が3個なら $\frac{\partial f}{\partial x}=0, \frac{\partial f}{\partial y}=0, \frac{\partial f}{\partial z}=0$ と3本書けばいいけど、変数が1000個や10億個になったら？`],
          [R, 'wow', r`ノートが埋まって死にますね……。`],
          [S, 'happy', r`そこで $\mathbf x=(x\ y\ z)^{\mathsf T}$, $\boldsymbol\mu=(1\ 1\ 1)^{\mathsf T}$, $A=\mathrm{diag}(2,1,1)$ とおくと、さっきの式はたった一言 $f(\mathbf x) = (\mathbf x-\boldsymbol\mu)^{\mathsf T}A(\mathbf x-\boldsymbol\mu)$ と書ける！`],
        ] },
        { t: 'formula', title: 'ベクトルによる微分（勾配ベクトル ∇f）', tag: 'GRADIENT',
          tex: r`\frac{df(\mathbf x)}{d\mathbf x} = \nabla f(\mathbf x) \equiv \begin{pmatrix}\dfrac{\partial f}{\partial x_1}\\\vdots\\\dfrac{\partial f}{\partial x_D}\end{pmatrix} \quad\Longrightarrow\quad \frac{df(\mathbf x)}{d\mathbf x} = 2A(\mathbf x-\boldsymbol\mu) = \mathbf 0 \;\Rightarrow\; \mathbf x = \boldsymbol\mu`,
          note: '何次元になっても式の形は同じ！ 簡潔で見通しが抜群によくなる。' },
        { t: 'lab', id: 'quadGrad', title: '2次形式の等高線と勾配ベクトル 2Ax', foot: 'キャンバス上をドラッグして点 $\\mathbf x$ を動かそう。矢印が勾配 $\\nabla f(\\mathbf x)=2A(\\mathbf x-\\boldsymbol\\mu)$。つねに等高線と直交し、谷底 $\\boldsymbol\\mu$ でゼロになる！' },
      ],
    },
    {
      id: 'vec-calc', title: '1次形式と2次形式の微分（公式 B1・B2）',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`機械学習で一番よく使うのが「スカラーをベクトルで微分する」公式。1変数の微分の感覚とそっくりだから比べてみて！`],
          [R, 'happy', r`1変数なら $(ax)' = a$ で、$(ax^2)' = 2ax$ ですよね！`],
          [S, 'wink', r`まさにそれ！ ベクトルになってもほぼ同じ形になるよ。`],
        ] },
        { t: 'formula', title: '1次形式と2次形式の微分（A は対称行列）', tag: 'B1 / B2',
          tex: r`\htmlClass{fp-b1}{\frac{d}{d\mathbf x}(\mathbf x^{\mathsf T}\mathbf a) = \frac{d}{d\mathbf x}(\mathbf a^{\mathsf T}\mathbf x) = \mathbf a}, \qquad \htmlClass{fp-b2}{\frac{d}{d\mathbf x}(\mathbf x^{\mathsf T}A\mathbf x) = 2A\mathbf x} \;\;\left(\frac12\frac{d}{d\mathbf x}(\mathbf x^{\mathsf T}A\mathbf x) = A\mathbf x\right)`,
          parts: [
            ['fp-b1', '公式 B1（1次形式）', '$\\mathbf x^{\\mathsf T}\\mathbf a = \\sum_j a_j x_j$ を $x_i$ で偏微分すると $a_i$ だけ残るので、並べると $\\mathbf a$。'],
            ['fp-b2', '公式 B2\'（2次形式）', '対称行列 $A$（$a_{ij}=a_{ji}$）のとき、$x_i^2$ の項から $2a_{ii}x_i$、交差項 $a_{ij}x_ix_j+a_{ji}x_jx_i$ から $2a_{ij}x_j$ が出て $2A\\mathbf x$ になる！（非対称なら $(A+A^{\\mathsf T})\\mathbf x$）'],
          ] },
        { t: 'quiz', q: '$\\mathbf x=(x_1,x_2)^{\\mathsf T}$、対称行列 $A=\\begin{pmatrix}3&1\\\\1&2\\end{pmatrix}$ のとき、$f(\\mathbf x)=\\frac12\\mathbf x^{\\mathsf T}A\\mathbf x$ の勾配 $\\nabla f(\\mathbf x)$ は？',
          options: [
            r`$\begin{pmatrix}3x_1+x_2\\ x_1+2x_2\end{pmatrix}$`,
            r`$\begin{pmatrix}6x_1+2x_2\\ 2x_1+4x_2\end{pmatrix}$`,
            r`$3x_1^2+2x_1x_2+2x_2^2$`,
          ],
          answer: 0,
          explain: r`公式 B2' より $\frac12\frac{d}{d\mathbf x}(\mathbf x^{\mathsf T}A\mathbf x)=A\mathbf x=\begin{pmatrix}3x_1+x_2\\x_1+2x_2\end{pmatrix}$。前に $\frac12$ がついているので 2 が打ち消えるのが気持ちいいポイント！` },
      ],
    },
    {
      id: 'mat-calc', title: '行列の微分3パターン（A・B・C）とガウス分布への応用',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`講義プリントでは行列の微分を **A・B・C の3種類**に整理しているよ。全体マップを押さえておこう。`],
        ] },
        { t: 'compare', items: [
          { em: '🅰️', title: 'A) 行列をスカラー $x$ で微分', items: [
            r`各成分 $a_{ij}(x)$ を $x$ で微分した行列`,
            r`A1) $\frac{d(AB)}{dx}=\frac{dA}{dx}B+A\frac{dB}{dx}$（積の微分）`,
            r`A2) $\frac{dA^{-1}}{dx}=-A^{-1}\frac{dA}{dx}A^{-1}$`,
            r`A4) $\frac{d}{dx}\ln|A|=\mathrm{Tr}\!\left(A^{-1}\frac{dA}{dx}\right)$`,
          ] },
          { em: '🅱️', title: 'B) スカラーを行列 $A$ で微分', items: [
            r`$(i,j)$ 成分が $\frac{\partial x}{\partial a_{ij}}$ の行列 $\frac{dx}{dA}$`,
            r`B3a') $\frac{d}{dA}\mathrm{Tr}(AB)=B^{\mathsf T}$、B3b') $\frac{d}{dA}\mathrm{Tr}(A^{\mathsf T}B)=B$`,
            r`B4') $\frac{d}{dA}\mathrm{Tr}(A^{-1}B)=-(A^{-1}BA^{-1})^{\mathsf T}$`,
            r`B8') $\frac{d}{dX}\mathbf a^{\mathsf T}X^{-1}\mathbf b=-(X^{-1})^{\mathsf T}\mathbf a\mathbf b^{\mathsf T}(X^{-1})^{\mathsf T}$`,
            r`B9) $\frac{d}{dA}\ln|A|=(A^{-1})^{\mathsf T}$`,
          ] },
          { em: '©️', title: 'C) ベクトルをベクトルで微分', items: [
            r`$\frac{d\mathbf a}{d\mathbf b^{\mathsf T}}$ は $(i,j)$ 成分が $\frac{\partial a_i}{\partial b_j}$ のヤコビ行列`,
            r`C1) $\frac{d}{d\mathbf x^{\mathsf T}}(A\mathbf x)=A$、C1') $\frac{d}{d\mathbf x}(A\mathbf x)^{\mathsf T}=A^{\mathsf T}$`,
            r`C2) $\frac{d\mathbf x}{d\mathbf x^{\mathsf T}}=I$`,
            r`2階微分 $\nabla\nabla f(\mathbf x)=\frac{d^2f}{d\mathbf x d\mathbf x^{\mathsf T}}$ が**ヘッセ行列**！`,
          ] },
        ] },
        { t: 'lab', id: 'matTransform', title: '行列 A が空間をどう変えるか（固有値・行列式・トレース）', foot: '単位円（点線）が行列 $A$ で楕円に変形される。面積の倍率が $|A|=\\lambda_1\\lambda_2$、固有値の和が $\\mathrm{Tr}(A)=\\lambda_1+\\lambda_2$。対称行列なら固有ベクトルが直交！' },
        { t: 'exer', title: '適用例：多次元ガウス分布の対数尤度を共分散 Σ で微分',
          q: r`データが1点 $\mathbf x$ だけの $D$ 次元ガウス分布の対数尤度は $\ln \mathcal N(\mathbf x\mid\boldsymbol\mu,\Sigma)=-\frac D2\ln(2\pi)-\frac12\ln|\Sigma|-\frac12(\mathbf x-\boldsymbol\mu)^{\mathsf T}\Sigma^{-1}(\mathbf x-\boldsymbol\mu)$ である。公式 B8', B9 を用いて $\Sigma$ で微分し $=O$ とおくことで $\Sigma=(\mathbf x-\boldsymbol\mu)(\mathbf x-\boldsymbol\mu)^{\mathsf T}$ を導け。`,
          hint: r`$\Sigma$（および $\Sigma^{-1}$）は対称行列なので $(\Sigma^{-1})^{\mathsf T}=\Sigma^{-1}$。`,
          steps: [
            r`$\Sigma$ に依存する項は $L(\Sigma)=-\frac12\ln|\Sigma|-\frac12(\mathbf x-\boldsymbol\mu)^{\mathsf T}\Sigma^{-1}(\mathbf x-\boldsymbol\mu)$。`,
            r`公式 B9 より $\dfrac{d}{d\Sigma}\ln|\Sigma|=(\Sigma^{-1})^{\mathsf T}$。`,
            r`公式 B8'（$\mathbf a=\mathbf b=\mathbf x-\boldsymbol\mu$）より $\dfrac{d}{d\Sigma}(\mathbf x-\boldsymbol\mu)^{\mathsf T}\Sigma^{-1}(\mathbf x-\boldsymbol\mu)=-(\Sigma^{-1})^{\mathsf T}(\mathbf x-\boldsymbol\mu)(\mathbf x-\boldsymbol\mu)^{\mathsf T}(\Sigma^{-1})^{\mathsf T}$。`,
            r`$\Sigma$ は対称なので $(\Sigma^{-1})^{\mathsf T}=\Sigma^{-1}$（厳密には対称制約下で公式はそのまま成り立たないが、結果が対称行列になるので「結果オーライ」で一致する）。`,
            r`よって $\dfrac{dL}{d\Sigma}=-\frac12\Sigma^{-1}+\frac12\Sigma^{-1}(\mathbf x-\boldsymbol\mu)(\mathbf x-\boldsymbol\mu)^{\mathsf T}\Sigma^{-1}=O$。`,
            r`両辺に左と右から $\Sigma$ をかけると $\Sigma=(\mathbf x-\boldsymbol\mu)(\mathbf x-\boldsymbol\mu)^{\mathsf T}$！ $N$ 個のデータなら平均をとって標本共分散行列になる。■`,
          ] },
        { t: 'point', tone: 'lav', title: '第7章のまとめ', items: [
          r`$(AB)^{-1}=B^{-1}A^{-1}$、$(AB)^{\mathsf T}=B^{\mathsf T}A^{\mathsf T}$。対称行列の逆行列も対称。`,
          r`スカラーの2次形式は $\mathbf x^{\mathsf T}A^{-1}\mathbf x = \mathrm{Tr}(A^{-1}\mathbf x\mathbf x^{\mathsf T})$ と書き換えられる。`,
          r`1次式の微分 $\frac{d}{d\mathbf x}(\mathbf a^{\mathsf T}\mathbf x)=\mathbf a$、2次形式の微分 $\frac{d}{d\mathbf x}(\mathbf x^{\mathsf T}A\mathbf x)=2A\mathbf x$（$A$ 対称）。`,
          r`行列式の対数の微分 $\frac{d}{dA}\ln|A|=(A^{-1})^{\mathsf T}$、スカラーでの微分は $\mathrm{Tr}(A^{-1}\frac{dA}{dx})$。`,
          r`勾配をさらに $\mathbf x^{\mathsf T}$ で微分した2階微分行列 $\nabla\nabla f(\mathbf x)$ が**ヘッセ行列**。`,
        ] },
      ],
    },
  ],
  notes: [
    { h: '逆行列と転置の積', f: r`(AB)^{-1}=B^{-1}A^{-1},\quad (AB)^{\mathsf T}=B^{\mathsf T}A^{\mathsf T}` },
    { h: '2次形式とトレース', f: r`\mathbf x^{\mathsf T}A^{-1}\mathbf x = \mathrm{Tr}(A^{-1}\mathbf x\mathbf x^{\mathsf T})`, p: 'スカラーなのでトレースをかぶせて巡回移動できる。' },
    { h: '1次形式の微分 (B1)', f: r`\frac{d}{d\mathbf x}(\mathbf x^{\mathsf T}\mathbf a)=\frac{d}{d\mathbf x}(\mathbf a^{\mathsf T}\mathbf x)=\mathbf a` },
    { h: '2次形式の微分 (B2\')', f: r`\frac{d}{d\mathbf x}(\mathbf x^{\mathsf T}A\mathbf x)=2A\mathbf x\quad(A^{\mathsf T}=A)` },
    { h: '逆行列・対数行列式のスカラー微分 (A2, A4)', f: r`\frac{dA^{-1}}{dx}=-A^{-1}\frac{dA}{dx}A^{-1},\quad \frac{d}{dx}\ln|A|=\mathrm{Tr}\!\left(A^{-1}\frac{dA}{dx}\right)` },
    { h: '対数行列式と逆行列2次形式の行列微分 (B8\', B9)', f: r`\frac{d}{dA}\ln|A|=(A^{-1})^{\mathsf T},\quad \frac{d}{dX}\mathbf a^{\mathsf T}X^{-1}\mathbf b=-(X^{-1})^{\mathsf T}\mathbf a\mathbf b^{\mathsf T}(X^{-1})^{\mathsf T}` },
    { h: 'ヘッセ行列', f: r`H=\nabla\nabla f(\mathbf x)=\frac{d^2 f}{d\mathbf x\,d\mathbf x^{\mathsf T}},\quad H_{ij}=\frac{\partial^2 f}{\partial x_i\partial x_j}` },
  ],
}
