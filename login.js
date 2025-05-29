// 表单切换逻辑
document.getElementById('switchToRegister').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('registerSection').style.display = 'block';
  document.getElementById('status').textContent = '';
});

document.getElementById('switchToLogin').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('registerSection').style.display = 'none';
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('status').textContent = '';
});

// 登录逻辑
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      status.textContent = "登录成功！";
      status.className = "mt-3 text-success";
      console.log("用户信息：", userCredential.user);
      // 可以在这里跳转页面，如 window.location.href = "dashboard.html";
    })
    .catch((error) => {
      status.textContent = "登录失败：" + error.message;
      console.error(error);
    });
});

// 注册逻辑
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const status = document.getElementById('status');
    
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
            status.textContent = '注册成功！';
            status.className = 'mt-3 text-success';
            console.log('新用户信息：', userCredential.user);
        })
      .catch((error) => {
            status.textContent = '注册失败：' + error.message;
            console.error(error);
        });
});