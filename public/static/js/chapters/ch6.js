const r = String.raw
const S = 'S', R = 'R'

export default {
  no: 6, slug: 'evaluation', en: 'EVALUATION', color: '#FF9EAE',
  title: '評価指標',
  sub: '「正解率 99%」は、本当にすごいのか？',
  lead: 'RMSE・MAE、混同行列、適合率・再現率・F値、ROC曲線とAUC。',
  src: 'ML01_6_evaluation_index',
  goals: ['回帰の指標', '混同行列', '適合率・再現率・F値', '不均衡データのワナ', 'ROC と AUC'],
  icon: 'roc',
  sections: [
    {
      id: 'reg', title: '回帰モデルの指標',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`学習でできたモデルの性能を測る**評価指標**。最終モデルの評価にも、確認用集合でハイパーパラメータを決めるのにも使うよ。まず回帰から。`],
        ] },
        { t: 'formula', title: '平均2乗平方根誤差 (RMSE) と平均絶対値誤差 (MAE)', tex: r`\mathrm{RMSE} = \sqrt{\frac{1}{|\mathcal T|}\sum_{(\mathbf x,t)\in\mathcal T}\{y(\mathbf x)-t\}^2}, \qquad \mathrm{MAE} = \frac{1}{|\mathcal T|}\sum_{(\mathbf x,t)\in\mathcal T}\big|y(\mathbf x)-t\big|`, note: '$\\mathcal T$：テストデータあるいは確認用集合。RMSE は大きな外れに敏感、MAE は外れ値に強い。' },
        { t: 'quiz', q: '誤差が $(1, 1, 1, 5)$ のとき、RMSE と MAE の大小は？', options: ['RMSE > MAE', 'RMSE = MAE', 'RMSE < MAE'], answer: 0, explain: r`MAE $=8/4=2$、RMSE $=\sqrt{(1+1+1+25)/4}=\sqrt7\approx2.65$。2乗するぶん、大きな外れ（5）が効いて RMSE が大きくなる。` },
      ],
    },
    {
      id: 'cm', title: '混同行列：4つのマス',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`分類器の予測と真のラベルの組み合わせは4通り。この表を**混同行列**っていう。`],
          [R, 'think', r`名前がややこしい……「偽陽性」って？`],
          [S, 'wink', r`後ろの「陽性/陰性」が**予測**、前の「真/偽」が**その予測が当たったか**。偽陽性＝「陽性と予測したけどハズレ（本当は陰性）」＝誤警報だね。`],
        ] },
        { t: 'html', html: `<div class="formula" style="margin:30px 0"><div class="f-head"><span>混同行列</span><span class="chip">CONFUSION MATRIX</span></div><div style="padding:22px;max-width:520px;margin:auto"><div class="cm" style="font-size:14px"><div class="hd"></div><div class="hd">真のラベル 1</div><div class="hd">真のラベル 0</div><div class="hd">予測 1</div><div class="cell tp"><span class="v">TP</span>真陽性<br><small>当たり</small></div><div class="cell fp"><span class="v">FP</span>偽陽性<br><small>誤警報</small></div><div class="hd">予測 0</div><div class="cell fn"><span class="v">FN</span>偽陰性<br><small>見逃し</small></div><div class="cell tn"><span class="v">TN</span>真陰性<br><small>当たり</small></div></div></div></div>` },
        { t: 'formula', title: '分類器の評価指標', tex: r`\underbrace{\frac{TP+TN}{TP+FP+FN+TN}}_{\text{正解率 accuracy}} \quad \underbrace{\frac{TP}{TP+FP}}_{\text{適合率 precision}} \quad \underbrace{\frac{TP}{TP+FN}}_{\text{再現率 recall}} \quad \underbrace{\frac{2PR}{P+R}}_{\text{F値}}`, note: '適合率＝「陽性と言ったうち本当に陽性」の割合。再現率（真陽性率・検出率・感度）＝「本当の陽性のうち見つけられた」割合。F値は両者の調和平均。' },
      ],
    },
    {
      id: 'trap', title: '正解率 99% のワナ',
      blocks: [
        { t: 'talk', lines: [
          [S, 'think', r`癌の診断を考えよう。テストデータ 1000 件のうち、陽性（ラベル1）は**たった 10 件**。入力に関係なく**つねに 0（陰性）と答える**分類器の正解率は？`],
          [R, 'wow', r`990/1000 で……**99%**！？ 何もしてないのに！`],
          [S, 'normal', r`でも癌を1件も見つけられてない。こういう**不均衡データ**では正解率は無意味なの。下で確かめてみて。`],
        ] },
        { t: 'lab', id: 'imbalance', title: '1000人の検査：3つの分類器を比べる', foot: '大きな丸＝本当の陽性（10人）。赤＝見逃し、ミント＝発見、黄色＝誤警報。' },
        { t: 'talk', lines: [
          [R, 'think', r`「つねに0」は再現率 0 で、ちゃんとダメってわかる。でも「つねに1」は再現率 1 になっちゃう……`],
          [S, 'happy', r`だから**適合率と再現率をセット**で見る。「つねに1」は適合率が 0.01 で正しく低評価。一般に、==適合率と再現率はトレードオフ==の関係にあるよ。`],
          [S, 'think', r`逆に、ツベルクリン反応みたいに陽性が圧倒的に多い場合は、「つねに1」で適合率も再現率も正解率も高くなっちゃう。そのときは珍しい陰性を見つけるのが大事だから、**偽陽性率** $\mathrm{FPR}=\frac{FP}{FP+TN}$（低いほど良い）を見る。`],
        ] },
        { t: 'point', title: '評価指標の選択指針', items: ['どの指標を使うかは、データの生成分布と分類の**目的**しだい。', '目的に応じた指標を使う。', '分布も目的もわからないとき：モデル選択には **F値**（あるいは正解率）。', '最終評価では **適合率と再現率を併記**し、**ROC-AUC** を総合評価値にする。'] },
      ],
    },
    {
      id: 'roc', title: 'ROC曲線とAUC',
      blocks: [
        { t: 'talk', lines: [
          [S, 'normal', r`分類器の出力が「ラベル1である確率」のとき、**いき値**を決めて「それより大きければ 1」と予測する。いき値を変えると TP も FP も変わるよね。`],
          [S, 'happy', r`いき値を 1 から 0 まで動かしながら、横軸に**偽陽性率 FPR**、縦軸に**真陽性率 TPR（再現率）**をプロットしたのが **ROC曲線**。`],
        ] },
        { t: 'lab', id: 'roc', title: 'いき値を動かして ROC 曲線をなぞる', foot: '左：分類器の出力（×＝誤分類）。左側のエリアをドラッグしてもいき値を動かせる。右：ROC曲線。黄色い点が今のいき値。' },
        { t: 'flow', nodes: [
          { em: '⬛', t: 'いき値 = 1', s: '全部 0 と予測<br>(FPR, TPR) = (0, 0)', bg: '#DDEBFF' },
          { em: '↗️', t: 'いき値を下げる', s: 'ラベル1の予測が増え<br>右肩あがり', bg: '#FFF4CC' },
          { em: '⬜', t: 'いき値 = 0', s: '全部 1 と予測<br>(FPR, TPR) = (1, 1)', bg: '#FFE3D6' },
        ] },
        { t: 'talk', lines: [
          [R, 'happy', r`分離度を上げると、曲線が左上にぐいっと張りついて AUC が 1 に近づく！`],
          [S, 'happy', r`FPR を小さく保ったまま TPR を上げられる分類器は、**いき値の選び方に頑健**。その曲線の下の面積が **ROC-AUC**。ランダムな分類器（対角線）なら 0.5、完璧なら 1 だよ。`],
        ] },
        { t: 'quiz', q: 'ROC-AUC = 0.5 の分類器は？', options: ['完璧な分類器', 'ランダムに答えるのと同じ', 'つねに逆を答える分類器'], answer: 1, explain: r`対角線（FPR = TPR）の下の面積が 0.5。陽性も陰性も同じ割合で「1」と言っているので、何も区別できていない。ちなみに、つねに逆を答えると AUC は 0 に近づく。` },
        { t: 'point', tone: 'mint', title: '第6章のまとめ', items: ['回帰：RMSE（外れに敏感）、MAE（外れに強い）。', '混同行列 TP/FP/FN/TN から 正解率・適合率・再現率・F値。', '不均衡データでは正解率は無意味。適合率と再現率はトレードオフ。', '陽性が多いときは偽陽性率 FPR を見る。', 'ROC曲線（FPR vs TPR）と AUC で、いき値に依存しない総合評価。'] },
      ],
    },
  ],
  notes: [
    { h: 'RMSE / MAE', f: r`\sqrt{\tfrac1{|\mathcal T|}\sum\{y-t\}^2},\quad\tfrac1{|\mathcal T|}\sum|y-t|` },
    { h: '正解率', f: r`\frac{TP+TN}{TP+FP+FN+TN}` },
    { h: '適合率 (precision)', f: r`P=\frac{TP}{TP+FP}` },
    { h: '再現率 (recall, TPR)', f: r`R=\frac{TP}{TP+FN}` },
    { h: 'F値', f: r`F=\frac{2PR}{P+R}` },
    { h: '偽陽性率 (FPR)', f: r`\mathrm{FPR}=\frac{FP}{FP+TN}` },
    { h: 'ROC-AUC', f: r`\mathrm{AUC}=\int_0^1\mathrm{TPR}\;d(\mathrm{FPR})`, p: 'ランダム 0.5、完璧 1。' },
  ],
}
