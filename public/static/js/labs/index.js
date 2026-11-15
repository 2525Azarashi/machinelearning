import * as c1 from './ch1.js'
import * as c2 from './ch2.js'
import * as c3 from './ch3.js'
import * as c4 from './ch4.js'
import * as c5 from './ch5.js'
import * as c6 from './ch6.js'
import * as c7 from './ch7.js'
import * as c8 from './ch8.js'
import * as c9 from './ch9.js'
import * as c10 from './ch10.js'
import * as c11 from './ch11.js'
import * as c12 from './ch12.js'
import * as c13 from './ch13.js'
import * as c14 from './ch14.js'

export const LABS = {
  supervised: c1.supervised, lsq: c1.lsq, poly: c1.polyLab, curse: c1.curse,
  urn: c2.urn, gauss1d: c2.gauss1d, gauss2d: c2.gauss2d, lln: c2.lln, clt: c2.clt,
  generative: c3.generative, likelihood: c3.likelihood, coin: c3.coinBayes, mapreg: c3.mapReg, conjugate: c3.conjugate,
  loss: c4.lossShapes, empirical: c4.empirical,
  bayesBoundary: c5.bayesBoundary, condMean: c5.condMean,
  roc: c6.rocLab, imbalance: c6.imbalance,
  quadGrad: c7.quadGrad, matTransform: c7.matTransform,
  gaussMle2d: c8.gaussMle2d, gammaPrecision: c8.gammaPrecision,
  basisLab: c9.basisLab, bayesRegLab: c9.bayesRegLab,
  occamsRazor: c10.occamsRazor,
  evidenceLab: c11.evidenceLab,
  linearBoundaryLab: c12.linearBoundaryLab, logisticSoftmaxLab: c12.logisticSoftmaxLab,
  mlpPlayground: c13.mlpPlayground, backpropFlow: c13.backpropFlow,
  convLab: c14.convLab, shiftInvarianceLab: c14.shiftInvarianceLab,
}
