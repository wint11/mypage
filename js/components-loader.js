// 加载组件
fetch('components/nav.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('nav-container').innerHTML = html;
    initFirebaseAuth(); // 👈 确保 auth 初始化在 HTML 插入之后
  });

fetch('components/footer.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('footer-container').innerHTML = html;
  });

// 初始化 Firebase 认证监听
function initFirebaseAuth() {
  const userNavContainer = document.getElementById('user-nav');
  if (!userNavContainer) return;

  firebase.auth().onAuthStateChanged(user => {
    const protectedLinkSelectors = [
      'a[href="../views/my-courses.html"]',
      'a[href="../views/discover.html"]',
      'a[href="../views/feedback.html"]'
    ];

    if (user) {
      // 已登录，显示用户菜单
      userNavContainer.innerHTML = `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            个人中心
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="../views/profile.html">我的资料</a></li>
            <li><a class="dropdown-item" href="../views/settings.html">设置</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="logout-btn">退出登录</a></li>
          </ul>
        </li>
      `;

      // 退出登录
      document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        firebase.auth().signOut()
          .then(() => {
            alert('已退出登录');
            window.location.href = '../views/login.html';
          })
          .catch(error => {
            console.error("退出失败: ", error);
          });
      });

    } else {
      // 未登录，显示登录按钮
      userNavContainer.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="../views/login.html">登录 / 注册</a>
        </li>
      `;

      // ❗延迟绑定点击事件，确保 DOM 元素已存在
      setTimeout(() => {
        protectedLinkSelectors.forEach(selector => {
          const link = document.querySelector(selector);
          if (link) {
            link.addEventListener('click', function(e) {
              e.preventDefault();
              // alert('请先登录后再访问该功能！');
              window.location.href = '../views/login.html';
            });
          }
        });
      }, 100); // 延迟绑定事件，确保 nav 渲染完毕
    }
  });
}
