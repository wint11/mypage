// 设置管理
class SettingsManager {
  constructor() {
    this.settings = this.loadSettings();
    this.initializeUI();
    this.bindEvents();
  }

  // 加载设置
  loadSettings() {
    const defaultSettings = {
      theme: 'light',
      fontSize: 'medium',
      animation: true,
      compact: false,
      masterVolume: 80,
      soundEffects: true,
      voice: false,
      voiceSpeed: 1.0,
      autoSave: true,
      reminder: false,
      adaptive: true,
      wrongQuestions: true,
      analytics: true,
      sync: true,
      offline: false
    };

    const saved = localStorage.getItem('userSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  }

  // 保存设置
  saveSettings() {
    localStorage.setItem('userSettings', JSON.stringify(this.settings));
    this.showToast('设置已保存成功！');
    this.applySettings();
  }

  // 应用设置
  applySettings() {
    // 应用主题
    document.documentElement.setAttribute('data-theme', this.settings.theme);
    
    // 应用字体大小
    document.documentElement.setAttribute('data-font-size', this.settings.fontSize);
    
    // 应用动画设置
    if (!this.settings.animation) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
    }
    
    // 应用紧凑模式
    if (this.settings.compact) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }

  // 初始化UI
  initializeUI() {
    // 设置所有控件的值
    document.getElementById('themeSelect').value = this.settings.theme;
    document.getElementById('fontSizeSelect').value = this.settings.fontSize;
    document.getElementById('animationSwitch').checked = this.settings.animation;
    document.getElementById('compactSwitch').checked = this.settings.compact;
    document.getElementById('masterVolume').value = this.settings.masterVolume;
    document.getElementById('masterVolumeDisplay').textContent = this.settings.masterVolume + '%';
    document.getElementById('soundEffectsSwitch').checked = this.settings.soundEffects;
    document.getElementById('voiceSwitch').checked = this.settings.voice;
    document.getElementById('voiceSpeed').value = this.settings.voiceSpeed;
    document.getElementById('voiceSpeedDisplay').textContent = this.settings.voiceSpeed + 'x';
    document.getElementById('autoSaveSwitch').checked = this.settings.autoSave;
    document.getElementById('reminderSwitch').checked = this.settings.reminder;
    document.getElementById('adaptiveSwitch').checked = this.settings.adaptive;
    document.getElementById('wrongQuestionsSwitch').checked = this.settings.wrongQuestions;
    document.getElementById('analyticsSwitch').checked = this.settings.analytics;
    document.getElementById('syncSwitch').checked = this.settings.sync;
    document.getElementById('offlineSwitch').checked = this.settings.offline;

    this.applySettings();
  }

  // 绑定事件
  bindEvents() {
    // 主题选择
    document.getElementById('themeSelect').addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
    });

    // 字体大小
    document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
      this.settings.fontSize = e.target.value;
    });

    // 开关控件
    const switches = [
      'animation', 'compact', 'soundEffects', 'voice', 'autoSave',
      'reminder', 'adaptive', 'wrongQuestions', 'analytics', 'sync', 'offline'
    ];
    
    switches.forEach(setting => {
      const element = document.getElementById(setting + 'Switch');
      if (element) {
        element.addEventListener('change', (e) => {
          this.settings[setting] = e.target.checked;
        });
      }
    });

    // 音量控制
    document.getElementById('masterVolume').addEventListener('input', (e) => {
      this.settings.masterVolume = parseInt(e.target.value);
      document.getElementById('masterVolumeDisplay').textContent = e.target.value + '%';
    });

    // 语音速度
    document.getElementById('voiceSpeed').addEventListener('input', (e) => {
      this.settings.voiceSpeed = parseFloat(e.target.value);
      document.getElementById('voiceSpeedDisplay').textContent = e.target.value + 'x';
    });
  }

  // 重置设置
  resetSettings() {
    if (confirm('确定要恢复所有设置到默认值吗？')) {
      localStorage.removeItem('userSettings');
      this.settings = this.loadSettings();
      this.initializeUI();
      this.showToast('设置已恢复到默认值！');
    }
  }

  // 显示提示
  showToast(message) {
    const toastElement = document.getElementById('settingsToast');
    const toastBody = toastElement.querySelector('.toast-body');
    toastBody.textContent = message;
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
  }
}

// 全局函数
let settingsManager;

function saveSettings() {
  settingsManager.saveSettings();
}

function resetSettings() {
  settingsManager.resetSettings();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  settingsManager = new SettingsManager();
});