export class Raven3DConfig {
  constructor() {
    // Change absolute path to relative path to support GitHub Pages and subdirectories
    // From views/raven3d.html to ICML 2026 folder is one level up
    this.baseDir = '../ICML 2026'; 
    this.tasks = Array.from({ length: 22 }, (_, i) => `task${i + 1}`);
    this.taskMapping = {
      // Easy Tasks (1-11)
      'task1': 'test_easy/Single/Single-1-layer',
      'task2': 'test_easy/Single/Single-2-layer',
      'task3': 'test_easy/Single/Single-3-layer',
      'task4': 'test_easy/Double/Double-Left-Right-1-layer',
      'task5': 'test_easy/Double/Double-Left-Right-2-layer',
      'task6': 'test_easy/Double/Double-Up-doiwn-1-layer', // Note: typo in folder name
      'task7': 'test_easy/Double/Double-Up-doiwn-2-layer',
      'task8': 'test_easy/Triple/Triple-Fixed-1-layer',
      'task9': 'test_easy/Triple/Triple-Fixed-2-layer',
      'task10': 'test_easy/Triple/Triple-Shuffle-1-layer',
      'task11': 'test_easy/Triple/Triple-Shuffle-2-layer',
      // Hard Tasks (12-22)
      'task12': 'test_hard/Single/Single-1-layer',
      'task13': 'test_hard/Single/Single-2-layer',
      'task14': 'test_hard/Single/Single-3-layer',
      'task15': 'test_hard/Double/Double-Left-Right-1-layer',
      'task16': 'test_hard/Double/Double-Left-Right-2-layer',
      'task17': 'test_hard/Double/Double-Up-down-1-layer', // Correct spelling in hard
      'task18': 'test_hard/Double/Double-Up-down-2-layer',
      'task19': 'test_hard/Triple/Triple-Fixed-1-layer',
      'task20': 'test_hard/Triple/Triple-Fixed-2-layer',
      'task21': 'test_hard/Triple/Triple-Shuffle-1-layer',
      'task22': 'test_hard/Triple/Triple-Shuffle-2-layer'
    };
  }
  getBaseDir() {
    return this.baseDir;
  }
  getTaskPath(task) {
    return this.taskMapping[task] ? `${this.baseDir}/${this.taskMapping[task]}` : null;
  }
  getQuestionPath(task, index) {
    const taskPath = this.getTaskPath(task);
    if (!taskPath) return null;
    return `${taskPath}/RAVEN_${index}_test`;
  }
  getStorageKey(k) {
    const m = { questions: 'raven3d_questions', answers: 'raven3d_answers', selection: 'raven3d_selection' };
    return m[k] || k;
  }
}
