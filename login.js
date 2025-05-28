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