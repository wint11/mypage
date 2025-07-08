let backdoorUsers = [];
let firebaseAvailable = false;

// 检测 Firebase 是否可用
function checkFirebaseAvailability() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('Firebase 连接超时，使用本地存储模式');
      resolve(false);
    }, 3000); // 3秒超时

    try {
      auth.onAuthStateChanged(() => {
        clearTimeout(timeout);
        resolve(true);
      });
    } catch (error) {
      console.warn('Firebase 不可用，使用本地存储模式:', error);
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

// 加载后门账号配置
async function loadBackdoorUsers() {
  try {
    const response = await fetch('../backdoor_users.json');
    if (!response.ok) throw new Error('无法加载用户配置文件');
    backdoorUsers = await response.json();
    console.log('账号配置已加载：', backdoorUsers);
  } catch (error) {
    console.error('加载账号失败：', error);
  }
}

// 简单哈希函数（用于非HTTPS环境）
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString(16);
}

// 主函数 - 保证先加载配置再绑定事件
(async function main() {
  await loadBackdoorUsers();
  firebaseAvailable = await checkFirebaseAvailability();
  
  if (!firebaseAvailable) {
    console.warn('Firebase 不可用，将使用本地存储模式');
    document.getElementById('status').innerHTML = '<div class="alert alert-warning">网络连接受限，当前使用离线模式</div>';
  }

  // 登录逻辑
  document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const emailInput = document.getElementById("email").value.trim().toLowerCase();
    const passwordInput = document.getElementById("password").value;
    const status = document.getElementById("status");

    // 特殊处理：guest@guest.com 邮箱无论密码是什么都通过验证
    if (emailInput === 'guest@guest.com') {
      status.textContent = "登录成功，正在跳转首页...";
      status.className = "mt-3 text-success";
      console.log("Guest用户登录成功:", emailInput);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', emailInput);
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
      return;
    }

    const inputPasswordHash = simpleHash(passwordInput);

    const isBackdoorUser = backdoorUsers.some(user =>
      user.email === emailInput && user.passwordHash === inputPasswordHash
    );

    
    if (isBackdoorUser) {
      status.textContent = "登录成功，正在跳转首页...";
      status.className = "mt-3 text-success";
      console.log("登录成功:", emailInput);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', emailInput);
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
      return;
    }

    // Firebase 可用时使用 Firebase 登录
    if (firebaseAvailable) {
      auth.signInWithEmailAndPassword(emailInput, passwordInput)
        .then((userCredential) => {
          status.textContent = "登录成功，正在跳转首页...";
          status.className = "mt-3 text-success";
          console.log("用户信息：", userCredential.user);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', emailInput);
          setTimeout(() => {
            window.location.href = "../index.html";
          }, 1000);
        })
        .catch((error) => {
          status.textContent = "登录失败：" + error.message;
          status.className = "mt-3 text-danger";
          console.error(error);
          alert("请尝试使用代理或者使用公共账号访问。\n用户名：guest@guest.com 密码：guest");
        });
    } else {
      // Firebase 不可用时使用本地存储登录
      const storedUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const localUser = storedUsers.find(user => 
        user.email === emailInput && user.passwordHash === inputPasswordHash
      );
      
      if (localUser) {
        status.textContent = "登录成功，正在跳转首页...";
        status.className = "mt-3 text-success";
        console.log("本地登录成功:", emailInput);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', emailInput);
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 1000);
      } else {
        status.textContent = "登录失败：用户名或密码错误";
        status.className = "mt-3 text-danger";
        console.error("本地登录失败");
      }
    }

  });

  // 注册逻辑
  document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const status = document.getElementById('status');

    const passwordHash = simpleHash(password);

    const isBackdoorEmail = backdoorUsers.some(user =>
      user.email === email && user.passwordHash === passwordHash
    );

    if (isBackdoorEmail) {
      status.textContent = '注册失败：该账号已被管理员保留。';
      status.className = 'mt-3 text-danger';
      console.warn("尝试注册账号:", email);
      return;
    }

    // Firebase 可用时使用 Firebase 注册
    if (firebaseAvailable) {
      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          status.textContent = '注册成功，正在跳转首页...';
          status.className = 'mt-3 text-success';
          console.log('新用户信息：', userCredential.user);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', email);
          setTimeout(() => {
            window.location.href = "../index.html";
          }, 1000);
        })
        .catch((error) => {
          status.textContent = '注册失败：' + error.message;
          status.className = 'mt-3 text-danger';
          console.error(error);
          alert("请尝试使用代理或者使用公共账号访问。\n用户名：guest@guest.com 密码：guest");
        });
    } else {
      // Firebase 不可用时使用本地存储注册
      const storedUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
      const existingUser = storedUsers.find(user => user.email === email);
      
      if (existingUser) {
        status.textContent = '注册失败：该邮箱已被注册';
        status.className = 'mt-3 text-danger';
        console.error("邮箱已存在");
      } else {
        // 添加新用户到本地存储
        storedUsers.push({
          email: email,
          passwordHash: passwordHash,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('localUsers', JSON.stringify(storedUsers));
        
        status.textContent = '注册成功，正在跳转首页...';
        status.className = 'mt-3 text-success';
        console.log('本地注册成功：', email);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 1000);
      }
    }

  });

})();
