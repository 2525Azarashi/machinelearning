// 単語帳／公式の「保存」「覚えた」状態
const KEY = 'marutto-ml-saved-v1'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
const save = (o) => localStorage.setItem(KEY, JSON.stringify(o))
const listeners = new Set()
export const saved = {
  all: () => load(),
  has: (k) => !!load()[k]?.star,
  learned: (k) => !!load()[k]?.learned,
  toggle(k, meta = {}) { const o = load(); o[k] = { ...meta, ...(o[k] || {}), star: !o[k]?.star }; save(o); listeners.forEach(f => f()); return o[k].star },
  setLearned(k, v, meta = {}) { const o = load(); o[k] = { ...meta, ...(o[k] || {}), learned: v }; save(o); listeners.forEach(f => f()) },
  count: () => { const o = load(); return { star: Object.values(o).filter(x => x.star).length, learned: Object.values(o).filter(x => x.learned).length } },
  on: (f) => { listeners.add(f); return () => listeners.delete(f) },
}
