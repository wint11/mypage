// 确保 DOM 加载完成后再执行
document.addEventListener('DOMContentLoaded', function() {
  // 加载导航栏和页脚
  fetch('../components/nav.html')
    .then(res => res.text())
    .then(html => {
      const navContainer = document.getElementById('nav-container');
      if (navContainer) {
        navContainer.innerHTML = html;
        initFirebaseAuth(); // 👈 确保 auth 初始化在 HTML 插入之后
      }
    });

  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    fetch('../components/footer.html')
      .then(res => res.text())
      .then(html => {
        footerContainer.innerHTML = html;
      });
  }
});



// Firebase 连接状态检测
let firebaseAvailable = false;
let authCheckTimeout = null;

// 检测 Firebase 是否可用
function checkFirebaseAvailability() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('Firebase 连接超时，使用本地存储模式');
      resolve(false);
    }, 3000); // 3秒超时

    try {
      firebase.auth().onAuthStateChanged(() => {
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

// 初始化认证系统（Firebase + 本地存储备用）
function initFirebaseAuth() {
  const userNavContainer = document.getElementById('user-nav');
  if (!userNavContainer) return;

  // 检测 Firebase 可用性
  checkFirebaseAvailability().then(available => {
    firebaseAvailable = available;
    
    if (firebaseAvailable) {
      // Firebase 可用，使用 Firebase 认证
      firebase.auth().onAuthStateChanged(handleAuthStateChange);
    } else {
      // Firebase 不可用，直接使用本地存储
      handleAuthStateChange(null);
    }
  });
}

// 处理认证状态变化
function handleAuthStateChange(user) {
  const userNavContainer = document.getElementById('user-nav');
  if (!userNavContainer) return;

  const protectedLinkSelectors = [
    'a[href="../views/my-courses.html"]',
    'a[href="../views/discover.html"]',
    'a[href="../views/feedback.html"]'
  ];

  // 检查登录状态：Firebase用户 或 本地存储标记
  const isLoggedIn = user || localStorage.getItem('isLoggedIn') === 'true';
  
  if (isLoggedIn) {
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
        
        // 清除本地存储
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        
        // 如果 Firebase 可用，也退出 Firebase
        if (firebaseAvailable) {
          firebase.auth().signOut()
            .then(() => {
              alert('已退出登录');
              window.location.reload();
            })
            .catch(error => {
              console.error("Firebase 退出失败: ", error);
              alert('已退出登录');
              window.location.reload();
            });
        } else {
          alert('已退出登录');
          window.location.reload();
        }
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
  }
