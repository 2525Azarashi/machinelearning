import * as c1 from './ch1.js'
import * as c2 from './ch2.js'
import * as c3 from './ch3.js'
import * as c4 from './ch4.js'
import * as c5 from './ch5.js'
import * as c6 from './ch6.js'

export const LABS = {
  supervised: c1.supervised, lsq: c1.lsq, poly: c1.polyLab, curse: c1.curse,
  urn: c2.urn, gauss1d: c2.gauss1d, gauss2d: c2.gauss2d, lln: c2.lln, clt: c2.clt,
  generative: c3.generative, likelihood: c3.likelihood, coin: c3.coinBayes, mapreg: c3.mapReg, conjugate: c3.conjugate,
  loss: c4.lossShapes, empirical: c4.empirical,
  bayesBoundary: c5.bayesBoundary, condMean: c5.condMean,
  roc: c6.rocLab, imbalance: c6.imbalance,
}
