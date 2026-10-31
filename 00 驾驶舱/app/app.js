/**
 * 个人工作台 — 主应用逻辑
 * 页面路由 + 各模块渲染
 */

// ===== 初始化 =====
DB.init();

// ===== 页面路由 =====
const pages = {
  dashboard: { title: '总仪表盘', render: renderDashboard },
  tasks: { title: '任务管理', render: renderTasks },
  habits: { title: '习惯打卡', render: renderHabits },
  finance: { title: '记账管理', render: renderFinance },
  journal: { title: '日志复盘', render: renderJournal },
};

let currentPage = 'dashboard';

// ===== 导航切换 =====
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    if (page === currentPage) return;
    document.querySelector('.nav-item.active').classList.remove('active');
    item.classList.add('active');
    currentPage = page;
    document.getElementById('page-title').textContent = pages[page].title;
    renderPage();
  });
});

function renderPage() {
  const container = document.getElementById('page-container');
  container.innerHTML = pages[currentPage].render();
  // 绑定页面内事件
  if (currentPage === 'tasks') bindTaskEvents();
  if (currentPage === 'habits') bindHabitEvents();
  if (currentPage === 'finance') bindFinanceEvents();
  if (currentPage === 'journal') bindJournalEvents();
}

// ===== 日期显示 =====
function updateDate() {
  const now = new Date();
  const weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
  const str = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
  document.getElementById('current-date').textContent = str;
}

// ===== 更新连续天数 =====
function updateStreak() {
  document.getElementById('streak-days').textContent = DB.getStreak();
}

// ===== 仪表盘 =====
function renderDashboard() {
  const tasks = DB.getTasks();
  const habits = DB.getHabits();
  const finance = DB.getFinanceSummary();
  const journals = DB.getJournals();

  const todayTasks = tasks.filter(t => t.createdAt === DB.today());
  const doneTasks = todayTasks.filter(t => t.done);
  const taskRate = todayTasks.length > 0 ? Math.round(doneTasks.length / todayTasks.length * 100) : 0;

  const doneHabits = habits.filter(h => h.done);
  const habitRate = habits.length > 0 ? Math.round(doneHabits.length / habits.length * 100) : 0;

  const weekDays = ['一','二','三','四','五','六','日'];
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  let weekHtml = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    const diff = i - todayIdx;
    d.setDate(d.getDate() + diff);
    const isToday = diff === 0;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dayTasks = tasks.filter(t => t.createdAt === dateStr && t.done).length;
    const dayHabits = habits.filter(h => h.history && h.history[dateStr]).length;
    let dots = '';
    if (dayTasks > 0) dots += `<span class="day-dot" style="background:var(--accent)"></span>`;
    if (dayHabits > 0) dots += `<span class="day-dot" style="background:var(--success)"></span>`;
    weekHtml += `
      <div class="day-cell ${isToday ? 'today' : ''}">
        <span class="day-name">${weekDays[i]}</span>
        <span class="day-num">${d.getDate()}</span>
        <div class="day-dots">${dots}</div>
      </div>`;
  }

  let recentTasks = todayTasks.slice(0, 5).map(t => `
    <div class="task-item">
      <div class="task-checkbox ${t.done ? 'checked' : ''}" onclick="DB.toggleTask(${t.id});renderPage();updateStreak();"></div>
      <div class="task-info">
        <div class="task-name ${t.done ? 'done' : ''}">${t.name}</div>
        <div class="task-meta">${t.createdAt}</div>
      </div>
      <span class="task-priority ${t.priority}">${t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'}</span>
    </div>`).join('');

  if (!recentTasks) {
    recentTasks = `<div class="empty-state"><div class="icon">📋</div><div class="text">今日暂无任务</div></div>`;
  }

  let recentJournal = journals.length > 0 ? `
    <div class="journal-entry">
      <div class="journal-date">${journals[0].date}</div>
      <div class="journal-mood">${journals[0].mood}</div>
      <div class="journal-content">${journals[0].content}</div>
    </div>` : `<div class="empty-state"><div class="icon">📝</div><div class="text">还没有日志记录</div></div>`;

  return `
    <!-- 统计卡片 -->
    <div class="dashboard-grid">
      <div class="stat-card purple">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${doneTasks.length}/${todayTasks.length}</div>
        <div class="stat-label">今日任务完成</div>
        <div class="stat-change up">完成率 ${taskRate}%</div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">${doneHabits.length}/${habits.length}</div>
        <div class="stat-label">习惯打卡</div>
        <div class="stat-change up">完成率 ${habitRate}%</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon">💰</div>
        <div class="stat-value">¥${finance.balance.toFixed(0)}</div>
        <div class="stat-label">本月结余</div>
        <div class="stat-change ${finance.balance >= 0 ? 'up' : 'down'}">收入 ¥${finance.income.toFixed(0)} / 支出 ¥${finance.expense.toFixed(0)}</div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">🔥</div>
        <div class="stat-value">${DB.getStreak()}</div>
        <div class="stat-label">连续活跃天数</div>
        <div class="stat-change up">继续保持！</div>
      </div>
    </div>

    <!-- 周历 -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-title">📅 本周概览</div>
      <div class="week-calendar">${weekHtml}</div>
    </div>

    <!-- 任务 + 日志 -->
    <div class="dashboard-row">
      <div class="card">
        <div class="card-title">📌 今日任务</div>
        <div class="task-list">${recentTasks}</div>
      </div>
      <div class="card">
        <div class="card-title">📖 最新日志</div>
        ${recentJournal}
      </div>
    </div>
  `;
}

// ===== 任务管理 =====
function renderTasks() {
  const tasks = DB.getTasks();
  const today = DB.today();
  const todayTasks = tasks.filter(t => t.createdAt === today);
  const otherTasks = tasks.filter(t => t.createdAt !== today);

  const renderTaskList = (list) => {
    if (list.length === 0) return `<div class="empty-state"><div class="icon">📋</div><div class="text">暂无任务</div></div>`;
    return list.map(t => `
      <div class="task-item">
        <div class="task-checkbox ${t.done ? 'checked' : ''}" data-action="toggle" data-id="${t.id}"></div>
        <div class="task-info">
          <div class="task-name ${t.done ? 'done' : ''}">${t.name}</div>
          <div class="task-meta">${t.createdAt}</div>
        </div>
        <span class="task-priority ${t.priority}">${t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'}</span>
        <span class="task-delete" data-action="delete" data-id="${t.id}">✕</span>
      </div>`).join('');
  };

  return `
    <div class="add-task-bar">
      <input type="text" id="task-input" placeholder="输入任务名称..." maxlength="100">
      <select id="task-priority">
        <option value="low">低</option>
        <option value="medium" selected>中</option>
        <option value="high">高</option>
      </select>
      <button class="btn btn-primary" id="add-task-btn">添加任务</button>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">📌 今日任务 (${todayTasks.length})</div>
      <div class="task-list">${renderTaskList(todayTasks)}</div>
    </div>
    <div class="card">
      <div class="card-title">📂 历史任务 (${otherTasks.length})</div>
      <div class="task-list">${renderTaskList(otherTasks)}</div>
    </div>
  `;
}

function bindTaskEvents() {
  const addBtn = document.getElementById('add-task-btn');
  const input = document.getElementById('task-input');
  const prioritySel = document.getElementById('task-priority');

  const doAdd = () => {
    const name = input.value.trim();
    if (!name) return;
    DB.addTask(name, prioritySel.value);
    input.value = '';
    renderPage();
  };

  addBtn.addEventListener('click', doAdd);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });

  document.querySelectorAll('[data-action="toggle"]').forEach(el => {
    el.addEventListener('click', () => {
      DB.toggleTask(parseInt(el.dataset.id));
      renderPage();
      updateStreak();
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach(el => {
    el.addEventListener('click', () => {
      DB.deleteTask(parseInt(el.dataset.id));
      renderPage();
    });
  });
}

// ===== 习惯打卡 =====
function renderHabits() {
  const habits = DB.getHabits();
  const doneCount = habits.filter(h => h.done).length;
  const rate = habits.length > 0 ? Math.round(doneCount / habits.length * 100) : 0;

  const cards = habits.map(h => `
    <div class="habit-card ${h.done ? 'done' : ''}" data-id="${h.id}">
      <div class="habit-icon">${h.icon}</div>
      <div class="habit-name">${h.name}</div>
      <div class="habit-streak">连续 <strong>${h.streak}</strong> 天</div>
      <div class="habit-check"></div>
    </div>`).join('');

  return `
    <div class="card" style="margin-bottom:20px">
      <div class="card-title">📊 今日打卡进度</div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:28px;font-weight:700">${doneCount}/${habits.length}</div>
        <div style="flex:1">
          <div class="progress-bar">
            <div class="progress-fill green" style="width:${rate}%"></div>
          </div>
        </div>
        <div style="font-size:14px;color:var(--text-secondary)">${rate}%</div>
      </div>
    </div>
    <div class="habits-grid">${cards || '<div class="empty-state"><div class="icon">🎯</div><div class="text">还没有习惯，添加一个吧！</div></div>'}</div>
    <div class="add-task-bar" style="margin-top:20px">
      <input type="text" id="habit-name-input" placeholder="习惯名称..." maxlength="20">
      <input type="text" id="habit-icon-input" placeholder="emoji图标" maxlength="4" style="max-width:80px">
      <button class="btn btn-primary" id="add-habit-btn">添加习惯</button>
    </div>
  `;
}

function bindHabitEvents() {
  document.querySelectorAll('.habit-card').forEach(card => {
    card.addEventListener('click', () => {
      DB.toggleHabit(parseInt(card.dataset.id));
      renderPage();
      updateStreak();
    });
  });

  const addBtn = document.getElementById('add-habit-btn');
  const nameInput = document.getElementById('habit-name-input');
  const iconInput = document.getElementById('habit-icon-input');

  const doAdd = () => {
    const name = nameInput.value.trim();
    const icon = iconInput.value.trim() || '⭐';
    if (!name) return;
    DB.addHabit(name, icon);
    renderPage();
  };

  addBtn.addEventListener('click', doAdd);
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
}

// ===== 记账管理 =====
function renderFinance() {
  const records = DB.getFinance();
  const summary = DB.getFinanceSummary();
  const monthRecords = records.filter(f => f.date.startsWith(DB.today().slice(0,7))).reverse();

  const list = monthRecords.map(f => `
    <div class="finance-item">
      <div class="cat-icon">${f.icon}</div>
      <div class="info">
        <div class="cat-name">${f.category}</div>
        <div class="note">${f.note || ''} · ${f.date}</div>
      </div>
      <div class="amount ${f.type}">${f.type === 'income' ? '+' : '-'}¥${f.amount.toFixed(0)}</div>
      <span class="task-delete" data-action="del-fin" data-id="${f.id}">✕</span>
    </div>`).join('');

  const categories = [
    { type: 'expense', cat: '餐饮', icon: '🍜' },
    { type: 'expense', cat: '交通', icon: '🚇' },
    { type: 'expense', cat: '购物', icon: '🛍️' },
    { type: 'expense', cat: '咖啡', icon: '☕' },
    { type: 'expense', cat: '娱乐', icon: '🎬' },
    { type: 'expense', cat: '住房', icon: '🏠' },
    { type: 'income', cat: '工资', icon: '💵' },
    { type: 'income', cat: '其他', icon: '📦' },
  ];

  const catOptions = categories.map(c =>
    `<option value="${c.cat}|${c.icon}|${c.type}">${c.icon} ${c.cat}</option>`
  ).join('');

  return `
    <div class="finance-summary">
      <div class="finance-stat income">
        <div class="label">本月收入</div>
        <div class="amount">¥${summary.income.toFixed(0)}</div>
      </div>
      <div class="finance-stat expense">
        <div class="label">本月支出</div>
        <div class="amount">¥${summary.expense.toFixed(0)}</div>
      </div>
      <div class="finance-stat balance">
        <div class="label">本月结余</div>
        <div class="amount">¥${summary.balance.toFixed(0)}</div>
      </div>
    </div>

    <div class="add-task-bar">
      <select id="fin-category">${catOptions}</select>
      <input type="number" id="fin-amount" placeholder="金额" min="0" step="0.01" style="max-width:120px">
      <input type="text" id="fin-note" placeholder="备注（可选）" maxlength="50">
      <button class="btn btn-primary" id="add-fin-btn">记一笔</button>
    </div>

    <div class="card">
      <div class="card-title">📋 本月记录 (${monthRecords.length})</div>
      <div class="finance-list">${list || '<div class="empty-state"><div class="icon">💰</div><div class="text">暂无记录</div></div>'}</div>
    </div>
  `;
}

function bindFinanceEvents() {
  const addBtn = document.getElementById('add-fin-btn');
  const catSel = document.getElementById('fin-category');
  const amountInput = document.getElementById('fin-amount');
  const noteInput = document.getElementById('fin-note');

  const doAdd = () => {
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) return;
    const [cat, icon, type] = catSel.value.split('|');
    DB.addFinance(type, cat, icon, amount, noteInput.value.trim());
    amountInput.value = '';
    noteInput.value = '';
    renderPage();
  };

  addBtn.addEventListener('click', doAdd);
  amountInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });

  document.querySelectorAll('[data-action="del-fin"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      DB.deleteFinance(parseInt(el.dataset.id));
      renderPage();
    });
  });
}

// ===== 日志复盘 =====
function renderJournal() {
  const journals = DB.getJournals();

  const moods = [
    { emoji: '😄', label: '开心' },
    { emoji: '😊', label: '不错' },
    { emoji: '😐', label: '一般' },
    { emoji: '😔', label: '低落' },
    { emoji: '😤', label: '烦躁' },
    { emoji: '🤒', label: '不舒服' },
  ];

  let selectedMood = '😊';

  const moodHtml = moods.map(m =>
    `<span class="mood-btn ${m.emoji === selectedMood ? 'selected' : ''}" data-mood="${m.emoji}">${m.emoji}</span>`
  ).join('');

  const listHtml = journals.map(j => `
    <div class="journal-entry">
      <div class="journal-date">${j.date}</div>
      <div class="journal-mood">${j.mood}</div>
      <div class="journal-content">${j.content}</div>
      <span class="task-delete" data-action="del-journal" data-id="${j.id}" style="margin-top:8px;display:inline-block">删除</span>
    </div>`).join('');

  return `
    <div class="card" style="margin-bottom:20px">
      <div class="card-title">✍️ 写日志</div>
      <div class="mood-selector" id="mood-selector">${moodHtml}</div>
      <textarea class="journal-textarea" id="journal-input" placeholder="今天怎么样？记录一下..." maxlength="2000"></textarea>
      <div style="margin-top:12px;text-align:right">
        <button class="btn btn-primary" id="submit-journal-btn">保存日志</button>
      </div>
    </div>
    <div>
      <div class="card-title" style="margin-bottom:14px">📖 历史日志</div>
      ${listHtml || '<div class="empty-state"><div class="icon">📝</div><div class="text">还没有日志，开始记录吧！</div></div>'}
    </div>
  `;
}

function bindJournalEvents() {
  let selectedMood = '😊';

  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMood = btn.dataset.mood;
    });
  });

  const submitBtn = document.getElementById('submit-journal-btn');
  const textarea = document.getElementById('journal-input');

  const doSubmit = () => {
    const content = textarea.value.trim();
    if (!content) return;
    DB.addJournal(selectedMood, content);
    renderPage();
  };

  submitBtn.addEventListener('click', doSubmit);

  document.querySelectorAll('[data-action="del-journal"]').forEach(el => {
    el.addEventListener('click', () => {
      DB.deleteJournal(parseInt(el.dataset.id));
      renderPage();
    });
  });
}

// ===== 启动 =====
updateDate();
updateStreak();
renderPage();

// 每分钟更新日期
setInterval(updateDate, 60000);
