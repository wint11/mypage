import { Raven3DConfig } from './Config.js';
import { ImageCacheR3D, Raven3DFilter, Raven3DManager } from './core.js';

export default class Raven3DTest {
  constructor() {
    this.config = new Raven3DConfig();
    this.cache = new ImageCacheR3D();
    this.filter = new Raven3DFilter(this.config);
    this.manager = new Raven3DManager(this.config, this.filter, this.cache);
  }
  async init() {
    await this.manager.init();
    await this.manager.preloadAround();
    return this.manager.all;
  }
  applyFilter(t) { return this.manager.applyFilter(t); }
  next() { return this.manager.next(); }
  prev() { return this.manager.prev(); }
  jump(n) { return this.manager.jump(n); }
  current() { return this.manager.current(); }
}
