let backdoorUsers = [];

// 加载后门账号配置
async function loadBackdoorUsers() {
  try {
    const response = await fetch('../backdoor_users.json');
    if (!response.ok) throw new Error('无法加载后门用户配置文件');
    backdoorUsers = await response.json();
    console.log('后门账号配置已加载：', backdoorUsers);
  } catch (error) {
    console.error('加载后门账号失败：', error);
  }
}

// SHA256 加密
function strToUint8Array(str) {
  return new TextEncoder().encode(str);
}

async function sha256Hash(str) {
  const buffer = await crypto.subtle.digest('SHA-256', strToUint8Array(str));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 主函数 - 保证先加载配置再绑定事件
(async function main() {
  await loadBackdoorUsers();

  // 登录逻辑
  document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const emailInput = document.getElementById("email").value.trim().toLowerCase();
    const passwordInput = document.getElementById("password").value;
    const status = document.getElementById("status");

    const inputPasswordHash = await sha256Hash(passwordInput);

    const isBackdoorUser = backdoorUsers.some(user =>
      user.email === emailInput && user.passwordHash === inputPasswordHash
    );

    if (isBackdoorUser) {
      status.textContent = "后门账号登录成功，正在跳转首页...";
      status.className = "mt-3 text-success";
      console.log("后门账号登录成功:", emailInput);
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
      return;
    }

    // Firebase 正常登录
    auth.signInWithEmailAndPassword(emailInput, passwordInput)
      .then((userCredential) => {
        status.textContent = "登录成功，正在跳转首页...";
        status.className = "mt-3 text-success";
        console.log("用户信息：", userCredential.user);
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 1000);
      })
      .catch((error) => {
        status.textContent = "登录失败：" + error.message;
        status.className = "mt-3 text-danger";
        console.error(error);
      });
  });

  // 注册逻辑
  document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const status = document.getElementById('status');

    const passwordHash = await sha256Hash(password);

    const isBackdoorEmail = backdoorUsers.some(user =>
      user.email === email && user.passwordHash === passwordHash
    );

    if (isBackdoorEmail) {
      status.textContent = '注册失败：该账号已被管理员保留。';
      status.className = 'mt-3 text-danger';
      console.warn("尝试注册后门账号:", email);
      return;
    }

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        status.textContent = '注册成功，正在跳转首页...';
        status.className = 'mt-3 text-success';
        console.log('新用户信息：', userCredential.user);
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 1000);
      })
      .catch((error) => {
        status.textContent = '注册失败：' + error.message;
        status.className = 'mt-3 text-danger';
        console.error(error);
      });
  });

})();
