// js/components-loader.js

// 加载组件
fetch('components/nav.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('nav-container').innerHTML = html;

    // 页面加载完成后初始化 Firebase 状态监听
    initFirebaseAuth();
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
    if (user) {
      // 用户已登录
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

      // 绑定退出登录事件
      document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        firebase.auth().signOut()
          .then(() => {
            // alert('已退出登录');
            window.location.href = '../index.html';
          })
          .catch(error => {
            console.error("退出失败: ", error);
          });
      });
    } else {
      // 用户未登录
      userNavContainer.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="../views/login.html">登录 / 注册</a>
        </li>
      `;
    }
  });
}