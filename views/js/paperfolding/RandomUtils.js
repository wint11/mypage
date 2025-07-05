/**
 * 随机算法工具模块
 */
export class RandomUtils {
  /**
   * 生成随机种子
   */
  static generateRandomSeed() {
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * 基于种子的伪随机数生成器
   */
  static seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * 基于种子的数组打乱算法
   */
  static shuffleArrayWithSeed(array, seed) {
    const shuffled = [...array];
    let currentSeed = seed;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280; // 线性同余生成器
      const j = Math.floor((currentSeed / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }
}