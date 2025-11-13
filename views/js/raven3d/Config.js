export class Raven3DConfig {
  constructor() {
    this.baseDir = '/ICML 2026';
  }
  getBaseDir() {
    return this.baseDir;
  }
  getQuestionSetsPath() {
    return `${this.baseDir}/raven3d/all_question_sets.json`;
  }
  getImageBase() {
    return `${this.baseDir}/raven3d/images/`;
  }
  getStorageKey(k) {
    const m = { questions: 'raven3d_questions', answers: 'raven3d_answers', selection: 'raven3d_selection' };
    return m[k] || k;
  }
}
