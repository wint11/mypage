import { Raven3DConfig } from './Config.js';
import { QuestionManager } from './QuestionManager.js';
import { NavigationManager } from './NavigationManager.js';
import { ImageCacheR3D } from './core.js'; // Reuse existing cache or create new one

export default class Raven3DTest {
  constructor() {
    this.config = new Raven3DConfig();
    this.questionManager = new QuestionManager(this.config);
    this.navigationManager = new NavigationManager();
    this.cache = new ImageCacheR3D();
  }

  async init(inviteCode) {
    if (inviteCode) {
      this.questionManager.setInviteCode(inviteCode);
    }
    // 默认加载 task1
    await this.switchTask('task1');
    return this.getCurrentQuestion();
  }

  async switchTask(taskName) {
    const success = await this.questionManager.switchTask(taskName);
    if (success) {
      this.navigationManager.setTotal(this.questionManager.getQuestionCount());
      this.navigationManager.jump(0); // Reset to first question
      this.preloadAround();
    }
    return success;
  }

  getCurrentQuestion() {
    const questions = this.questionManager.getAllQuestions();
    const index = this.navigationManager.getCurrentIndex();
    return questions[index];
  }

  next() {
    if (this.navigationManager.next()) {
      this.preloadAround();
      return this.getCurrentQuestion();
    }
    return null;
  }

  prev() {
    if (this.navigationManager.prev()) {
      this.preloadAround();
      return this.getCurrentQuestion();
    }
    return null;
  }

  jump(n) {
    if (this.navigationManager.jump(n)) {
      this.preloadAround();
      return this.getCurrentQuestion();
    }
    return null;
  }

  current() {
    return this.getCurrentQuestion();
  }

  getTotal() {
    return this.questionManager.getQuestionCount();
  }

  getIndex() {
    return this.navigationManager.getCurrentIndex();
  }

  async checkAnswer(userAnswer) {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return false;
    const correct = await this.questionManager.getAnswer(currentQ);
    return correct === userAnswer;
  }

  preloadAround() {
    const questions = this.questionManager.getAllQuestions();
    const idx = this.navigationManager.getCurrentIndex();
    const range = 2;
    for (let i = idx - range; i <= idx + range; i++) {
      if (questions[i]) {
        this.cache.preload(questions[i].image_path);
      }
    }
  }
}