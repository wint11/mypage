// 课程筛选功能
class CourseFilter {
  constructor() {
    this.courses = [];
    this.filteredCourses = [];
    this.coursesData = null;
    this.filters = {
      category: 'all',
      difficulty: 'all',
      hours: 'all'
    };
    
    this.init();
  }

  async init() {
    console.log('=== 课程筛选器初始化开始 ===');
    try {
      console.log('开始加载课程数据...');
      await this.loadCoursesData();
      console.log('课程数据加载完成，开始渲染课程...');
      this.renderCourses();
      console.log('课程渲染完成，开始收集课程数据...');
      this.collectCourses();
      console.log('课程数据收集完成，开始绑定事件...');
      this.bindEvents();
      console.log('事件绑定完成，开始应用筛选...');
      this.updateDisplay();
      console.log('=== 课程筛选器初始化完成 ===');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  }

   async loadCoursesData() {
     console.log('正在从 data/courses.json 加载课程数据...');
     try {
       const response = await fetch('data/courses.json');
       console.log('HTTP响应状态:', response.status, response.statusText);
       
       if (!response.ok) {
         throw new Error(`HTTP错误: ${response.status}`);
       }
       
       this.coursesData = await response.json();
       console.log('原始JSON数据:', this.coursesData);
       console.log('课程数量:', this.coursesData?.courses?.length || 0);
     } catch (error) {
       console.error('加载课程数据失败:', error);
       // 如果加载失败，使用现有的HTML数据
       this.collectCoursesFromHTML();
       return;
     }
   }

   renderCourses() {
     console.log('=== 开始渲染课程 ===');
     if (!this.coursesData) {
       console.log('没有课程数据，无法渲染');
       return;
     }
     
     const coursesContainer = document.querySelector('#courses-list');
     console.log('课程容器:', coursesContainer);
     if (!coursesContainer) {
       console.log('找不到课程容器');
       return;
     }
     
     // 清空现有课程
     coursesContainer.innerHTML = '';
     console.log('已清空课程容器');
     
     // 渲染课程卡片
     this.coursesData.courses.forEach((course, index) => {
       console.log(`渲染第${index + 1}个课程:`, course.title);
       const courseCard = this.createCourseCard(course);
       coursesContainer.appendChild(courseCard);
     });
     
     console.log('=== 课程渲染完成 ===');
   }

  createCourseCard(course) {
    const col = document.createElement('div');
    col.className = 'col-xl-4 col-lg-6 col-md-6 mb-4';
    
    const stars = this.generateStars(course.difficulty);
    
    col.innerHTML = `
      <div class="course-card" data-category="${course.category}" data-difficulty="${course.difficulty}" data-hours="${course.hours}">
        <div class="card-content">
          <h5 class="card-title">${course.title}</h5>
          <p class="card-text">${course.description}</p>
          <div class="course-meta">
            <span class="difficulty">${stars}</span>
            <span class="course-hours">${course.hours}课时</span>
          </div>
          <a href="javascript:void(0);" onclick="startLearning('${course.id}')"
            class="btn btn-primary btn-enroll">开始学习</a>
        </div>
      </div>
    `;
    
    return col;
  }

  generateStars(difficulty) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= difficulty) {
        stars += '<i class="fas fa-star"></i>';
      } else if (i - 0.5 <= difficulty) {
        stars += '<i class="fas fa-star-half-alt"></i>';
      } else {
        stars += '<i class="far fa-star"></i>';
      }
    }
    return stars;
  }

  // 收集课程数据（从动态生成的HTML中）
  collectCourses() {
    console.log('开始收集课程数据...');
    const courseCards = document.querySelectorAll('.course-card');
    console.log('找到的课程卡片数量:', courseCards.length);
    
    this.courses = Array.from(courseCards).map((card, index) => {
      console.log(`处理第${index + 1}个课程卡片:`, card);
      const course = {
        element: card.closest('.col-xl-4, .col-lg-6, .col-md-6'),
        category: card.dataset.category || 'other',
        difficulty: parseInt(card.dataset.difficulty) || 1,
        hours: parseInt(card.dataset.hours) || 0,
        title: card.querySelector('.card-title').textContent.trim()
      };
      console.log(`课程${index + 1}数据:`, course);
      return course;
    });
    
    console.log('从HTML收集到的课程数量:', this.courses.length);
    console.log('收集到的课程数据:', this.courses);
    this.filteredCourses = [...this.courses];
    console.log('初始筛选课程数量:', this.filteredCourses.length);
  }

  // 从现有HTML收集课程数据（备用方法）
  collectCoursesFromHTML() {
    const courseCards = document.querySelectorAll('.course-card');
    this.courses = Array.from(courseCards).map(card => {
      return {
        element: card.closest('.col-xl-4, .col-lg-6, .col-md-6'),
        category: card.dataset.category || 'other',
        difficulty: parseInt(card.dataset.difficulty) || 1,
        hours: parseInt(card.dataset.hours) || 0,
        title: card.querySelector('.card-title').textContent.trim()
      };
    });
    this.filteredCourses = [...this.courses];
  }

  // 更新显示
  updateDisplay() {
    this.updateCourseDisplay();
    this.updateResultsCount();
  }

  // 绑定事件
  bindEvents() {
    console.log('开始绑定事件...');
    
    // 筛选按钮
    const applyBtn = document.querySelector('.btn-apply-filter');
    console.log('筛选按钮:', applyBtn);
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        console.log('筛选按钮被点击');
        this.applyFilters();
      });
      console.log('筛选按钮事件已绑定');
    } else {
      console.warn('找不到筛选按钮 .btn-apply-filter');
    }

    // 重置按钮
    const resetBtn = document.querySelector('.btn-reset-filter');
    console.log('重置按钮:', resetBtn);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        console.log('重置按钮被点击');
        this.resetFilters();
      });
      console.log('重置按钮事件已绑定');
    } else {
      console.warn('找不到重置按钮 .btn-reset-filter');
    }
    
    console.log('事件绑定完成');
  }

  // 应用筛选
  applyFilters() {
    console.log('\n=== 开始应用筛选 ===');
    console.log('当前课程总数:', this.courses.length);
    
    // 获取选中的分类
    const selectedCategories = [];
    const categoryCheckboxes = document.querySelectorAll('input[type="checkbox"][value="all"], input[type="checkbox"][value="math"], input[type="checkbox"][value="computer"]');
    console.log('找到分类checkbox数量:', categoryCheckboxes.length);
    categoryCheckboxes.forEach(checkbox => {
      console.log(`分类checkbox [${checkbox.value}]:`, checkbox.checked ? '选中' : '未选中');
      if (checkbox.checked) {
        selectedCategories.push(checkbox.value);
      }
    });
    console.log('选中的分类:', selectedCategories);

    // 获取选中的难度
    const selectedDifficulties = [];
    const difficultyCheckboxes = document.querySelectorAll('input[type="checkbox"][value="easy"], input[type="checkbox"][value="medium"], input[type="checkbox"][value="hard"]');
    console.log('找到难度checkbox数量:', difficultyCheckboxes.length);
    difficultyCheckboxes.forEach(checkbox => {
      console.log(`难度checkbox [${checkbox.value}]:`, checkbox.checked ? '选中' : '未选中');
      if (checkbox.checked) {
        selectedDifficulties.push(checkbox.value);
      }
    });
    console.log('选中的难度:', selectedDifficulties);

    // 获取选中的课时范围
    const selectedHours = [];
    const hoursCheckboxes = document.querySelectorAll('input[type="checkbox"][value="short"], input[type="checkbox"][value="medium"], input[type="checkbox"][value="long"]');
    console.log('找到课时checkbox数量:', hoursCheckboxes.length);
    hoursCheckboxes.forEach(checkbox => {
      console.log(`课时checkbox [${checkbox.value}]:`, checkbox.checked ? '选中' : '未选中');
      if (checkbox.checked) {
        selectedHours.push(checkbox.value);
      }
    });
    console.log('选中的课时:', selectedHours);

    // 如果没有选择任何筛选条件，显示所有课程
    if (selectedCategories.length === 0 && selectedDifficulties.length === 0 && selectedHours.length === 0) {
      console.log('没有选择任何筛选条件，显示所有课程');
      this.filteredCourses = [...this.courses];
    } else {
      console.log('开始根据筛选条件过滤课程...');
      this.filteredCourses = this.courses.filter(course => {
        console.log(`\n检查课程: ${course.title}`);
        console.log('课程数据:', course);
        
        // 分类筛选 - 如果选择了"全部"或没有选择分类，则匹配所有分类
        const categoryMatch = selectedCategories.length === 0 || 
                             selectedCategories.includes('all') || 
                             selectedCategories.includes(course.category);
        console.log(`分类匹配 (${course.category}):`, categoryMatch);
        
        // 难度筛选 - 如果没有选择难度，则匹配所有难度
        let difficultyMatch = selectedDifficulties.length === 0;
        if (!difficultyMatch) {
          for (const diff of selectedDifficulties) {
            if (diff === 'easy' && course.difficulty <= 2) {
              difficultyMatch = true;
              break;
            }
            if (diff === 'medium' && course.difficulty === 3) {
              difficultyMatch = true;
              break;
            }
            if (diff === 'hard' && course.difficulty >= 4) {
              difficultyMatch = true;
              break;
            }
          }
        }
        console.log(`难度匹配 (${course.difficulty}):`, difficultyMatch);
        
        // 课时筛选 - 如果没有选择课时，则匹配所有课时
        let hoursMatch = selectedHours.length === 0;
        if (!hoursMatch) {
          for (const hours of selectedHours) {
            if (hours === 'short' && course.hours <= 35) {
              hoursMatch = true;
              break;
            }
            if (hours === 'medium' && course.hours >= 36 && course.hours <= 45) {
              hoursMatch = true;
              break;
            }
            if (hours === 'long' && course.hours >= 46) {
              hoursMatch = true;
              break;
            }
          }
        }
        console.log(`课时匹配 (${course.hours}):`, hoursMatch);
        
        const finalMatch = categoryMatch && difficultyMatch && hoursMatch;
        console.log('最终匹配结果:', finalMatch);
        return finalMatch;
      });
    }

    console.log('筛选完成，结果数量:', this.filteredCourses.length);
    console.log('筛选结果:', this.filteredCourses);
    
    this.updateCourseDisplay();
    this.updateResultsCount();
    console.log('=== 筛选应用完成 ===\n');
  }

  // 更新课程显示
  updateCourseDisplay() {
    console.log('\n=== 开始更新课程显示 ===');
    console.log('要显示的课程数量:', this.filteredCourses.length);
    
    // 隐藏所有课程
    this.courses.forEach(course => {
      if (course.element) {
        course.element.style.display = 'none';
        course.element.style.opacity = '0';
        course.element.style.transform = 'translateY(20px)';
      }
    });

    // 显示筛选后的课程
    this.filteredCourses.forEach((course, index) => {
      if (course.element) {
        course.element.style.display = 'block';
        
        // 添加动画延迟
        setTimeout(() => {
          course.element.style.opacity = '1';
          course.element.style.transform = 'translateY(0)';
          course.element.style.transition = 'all 0.3s ease';
        }, index * 100);
      }
    });

    // 如果没有结果，显示提示
    this.showNoResultsMessage();
    console.log('=== 课程显示更新完成 ===\n');
  }

  // 显示无结果提示
  showNoResultsMessage() {
    console.log('检查是否需要显示无结果消息...');
    const courseContainer = document.querySelector('#courses-list');
    console.log('课程容器:', courseContainer);
    let noResultsMsg = document.getElementById('noResultsMessage');
    console.log('现有无结果消息元素:', noResultsMsg);
    
    console.log('当前筛选结果数量:', this.filteredCourses.length);
    
    if (this.filteredCourses.length === 0) {
      console.log('没有筛选结果，显示无结果消息');
      if (!noResultsMsg) {
        console.log('创建新的无结果消息元素');
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'noResultsMessage';
        noResultsMsg.className = 'col-12 text-center';
        noResultsMsg.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">
              <i class="fas fa-search" style="font-size: 3rem; color: rgba(255,255,255,0.3); margin-bottom: 1rem;"></i>
            </div>
            <h4 style="color: rgba(255,255,255,0.8); margin-bottom: 0.5rem;">未找到匹配的课程</h4>
            <p style="color: rgba(255,255,255,0.6);">请尝试调整筛选条件或重置筛选器</p>
          </div>
        `;
        courseContainer.appendChild(noResultsMsg);
        console.log('无结果消息已添加到容器');
      }
      noResultsMsg.style.display = 'block';
    } else {
      if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
      }
    }
  }

  // 更新结果数量
  updateResultsCount() {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
      countElement.textContent = `共找到 ${this.filteredCourses.length} 门课程`;
    }
  }

  // 重置筛选
  resetFilters() {
    // 重置所有checkbox为未选中状态
    const allCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    // 默认选中"全部课程"
    const allCategoryCheckbox = document.querySelector('input[type="checkbox"][value="all"]');
    if (allCategoryCheckbox) {
      allCategoryCheckbox.checked = true;
    }

    // 重新应用筛选（显示所有课程）
    this.filteredCourses = [...this.courses];
    this.updateCourseDisplay();
    this.updateResultsCount();

    // 添加重置动画效果
    const resetBtn = document.querySelector('.btn-reset-filter');
    if (resetBtn) {
      resetBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        resetBtn.style.transform = 'scale(1)';
      }, 150);
    }
  }

  // 添加课程（动态添加新课程时使用）
  addCourse(courseElement) {
    const card = courseElement.querySelector('.course-card');
    const courseData = {
      element: courseElement,
      category: card.dataset.category || 'other',
      difficulty: parseInt(card.dataset.difficulty) || 1,
      hours: parseInt(card.dataset.hours) || 0,
      title: card.querySelector('.card-title').textContent.trim()
    };
    
    this.courses.push(courseData);
    this.applyFilters();
  }

  // 移除课程
  removeCourse(courseElement) {
    this.courses = this.courses.filter(course => course.element !== courseElement);
    this.applyFilters();
  }
}

// 页面加载完成后初始化筛选器
document.addEventListener('DOMContentLoaded', function() {
  // 确保DOM完全加载后再初始化
  setTimeout(() => {
    window.courseFilter = new CourseFilter();
  }, 100);
});

// 导出供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CourseFilter;
}