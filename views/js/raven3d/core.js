export class ImageCacheR3D {
  constructor() {
    this.c = new Map();
    this.o = [];
    this.m = 100;
  }
  a(p, s) {
    if (this.c.size >= this.m) this.e();
    this.c.set(p, s);
    const i = this.o.indexOf(p);
    if (i > -1) this.o.splice(i, 1);
    this.o.push(p);
  }
  e() {
    if (this.o.length === 0) return;
    const p = this.o.shift();
    this.c.delete(p);
  }
  preload(u) {
    return new Promise((r) => {
      if (this.c.has(u)) {
        r(this.c.get(u));
        return;
      }
      const img = new Image();
      img.onload = () => { this.a(u, img.src); r(img.src); };
      img.onerror = () => { r(null); };
      img.src = u;
    });
  }
}

export class Raven3DFilter {
  constructor(config) {
    this.config = config;
    this.sets = [];
    this.idx = 0;
    this.q = [];
    this.f = 'all';
  }
  async initialize() {
    const s = this.loadStored();
    if (s) {
      this.sets = s.sets || [];
      this.idx = s.idx || 0;
      this.q = s.q || [];
      return this.q;
    }
    const res = await fetch(this.config.getQuestionSetsPath());
    const data = res.ok ? await res.json() : [];
    this.sets = Array.isArray(data) ? data.map(x => x.questions) : [];
    if (this.sets.length > 0) this.select(0);
    return this.q;
  }
  select(i) {
    if (i < 0 || i >= this.sets.length) return [];
    this.idx = i;
    const base = this.config.getImageBase();
    const s = this.sets[i];
    this.q = s.map((x, j) => ({ id: `raven3d_set${i + 1}_${j + 1}`, image_path: base + x.image, answer: x.answer, meta: x.meta || {} }));
    this.saveStored();
    return this.q;
  }
  apply(filter) {
    this.f = filter;
    if (filter === 'easy' || filter === 'hard') return this.q.filter(q => (q.image_path.includes('/easy/') && filter === 'easy') || (q.image_path.includes('/hard/') && filter === 'hard'));
    return this.q;
  }
  getFilteredQuestions() { return this.apply(this.f); }
  saveStored() {
    const d = { q: this.q, sets: this.sets, idx: this.idx, ts: Date.now() };
    try { localStorage.setItem(this.config.getStorageKey('questions'), JSON.stringify(d)); } catch (_) {}
  }
  loadStored() {
    try {
      const s = localStorage.getItem(this.config.getStorageKey('questions'));
      if (!s) return null;
      const d = JSON.parse(s);
      if (!d || !d.ts) return null;
      const age = Date.now() - d.ts;
      if (age > 24 * 60 * 60 * 1000) return null;
      return d;
    } catch (_) { return null; }
  }
}

export class Raven3DManager {
  constructor(config, filter, cache) {
    this.config = config;
    this.filter = filter;
    this.cache = cache;
    this.all = [];
    this.idx = 0;
  }
  async init() {
    await this.filter.initialize();
    this.all = this.filter.getFilteredQuestions();
    this.idx = 0;
    return this.all;
  }
  applyFilter(t) {
    this.all = this.filter.apply(t);
    this.idx = Math.min(this.idx, Math.max(0, this.all.length - 1));
    return this.all;
  }
  next() { if (this.idx < this.all.length - 1) this.idx++; return this.current(); }
  prev() { if (this.idx > 0) this.idx--; return this.current(); }
  jump(n) { const i = Math.max(0, Math.min(n - 1, this.all.length - 1)); this.idx = i; return this.current(); }
  current() { return this.all[this.idx] || null; }
  preloadAround() {
    const arr = [];
    const start = Math.max(0, this.idx - 3);
    const end = Math.min(this.all.length, this.idx + 4);
    for (let i = start; i < end; i++) if (i !== this.idx) arr.push(this.all[i].image_path);
    return Promise.all(arr.map(u => this.cache.preload(u)));
  }
}

