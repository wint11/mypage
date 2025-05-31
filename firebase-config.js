// 替换为你的 Firebase 项目配置信息
const firebaseConfig = {
  apiKey: window.myAppConfig.apiKey,
  authDomain: "login.firebaseapp.com"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// 暴露 auth 变量给 login.js 使用
window.auth = auth;