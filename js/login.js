// 后门账号
const backdoorUser = {
  email: '1902246441@qq.com',
  passwordHash: '343fcb40497549085c98ae137c137116a5c2442eb8dc0bf0cac3a3419ce05b9f'
};

function strToUint8Array(str) {
  return new TextEncoder().encode(str);
}

async function sha256Hash(str) {
  const buffer = await crypto.subtle.digest('SHA-256', strToUint8Array(str));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 登录逻辑
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const emailInput = document.getElementById("email").value.trim().toLowerCase();
  const passwordInput = document.getElementById("password").value;
  const status = document.getElementById("status");

  const inputPasswordHash = await sha256Hash(passwordInput);

  if (emailInput === backdoorUser.email && inputPasswordHash === backdoorUser.passwordHash) {
    status.textContent = "后门账号登录成功，正在跳转首页...";
    status.className = "mt-3 text-success";
    console.log("后门账号登录成功:", emailInput);
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1000);
    return;
  }

  // 正常登录
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

  // 防止尝试注册后门账号
  const passwordHash = await sha256Hash(password);
  if (email === backdoorUser.email && passwordHash === backdoorUser.passwordHash) {
    status.textContent = '注册失败：该账号已被管理员保留。';
    status.className = 'mt-3 text-danger';
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
