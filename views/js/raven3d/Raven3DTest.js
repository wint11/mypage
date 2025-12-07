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
    this.isPreloading = false;
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
    this.stopPreload(); // Stop previous task's preload
    const success = await this.questionManager.switchTask(taskName);
    if (success) {
      this.navigationManager.setTotal(this.questionManager.getQuestionCount());
      this.navigationManager.jump(0); // Reset to first question
      this.preloadAround();
      this.startBackgroundPreload(); // Start sequential preload
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

  stopPreload() {
    this.isPreloading = false;
  }

  async startBackgroundPreload() {
    this.isPreloading = true;
    const questions = this.questionManager.getAllQuestions();
    
    // Sequentially preload all images
    for (let i = 0; i < questions.length; i++) {
      if (!this.isPreloading) break;
      
      const q = questions[i];
      if (q && q.image_path) {
        try {
            // Await to ensure sequential loading
            await this.cache.preload(q.image_path);
        } catch (e) {
            console.warn(`Failed to preload image for question ${i}`, e);
        }
      }
      
      // Small yield to allow UI responsiveness and priority requests
      await new Promise(r => setTimeout(r, 20));
    }
    this.isPreloading = false;
  }
}