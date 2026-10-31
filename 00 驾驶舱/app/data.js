/**
 * 数据管理模块 — 使用 localStorage 持久化
 * 所有数据的增删改查都经过这里
 */

const DB = {
  // ===== 初始化默认数据 =====
  init() {
    if (!localStorage.getItem('workbench_data')) {
      const defaultData = {
        tasks: [
          { id: 1, name: '完成工作台搭建教程学习', priority: 'high', done: false, createdAt: this.today() },
          { id: 2, name: '整理本周读书笔记', priority: 'medium', done: false, createdAt: this.today() },
          { id: 3, name: '回复重要邮件', priority: 'high', done: true, createdAt: this.today() },
          { id: 4, name: '准备下周会议PPT', priority: 'medium', done: false, createdAt: this.today() },
        ],
        habits: [
          { id: 1, name: '读书30分钟', icon: '📚', done: false, streak: 5, history: {} },
          { id: 2, name: '运动健身', icon: '💪', done: false, streak: 12, history: {} },
          { id: 3, name: '早起打卡', icon: '🌅', done: true, streak: 30, history: {} },
          { id: 4, name: '喝水8杯', icon: '💧', done: false, streak: 3, history: {} },
          { id: 5, name: '背单词', icon: '🔤', done: false, streak: 7, history: {} },
          { id: 6, name: '冥想10分钟', icon: '🧘', done: true, streak: 2, history: {} },
        ],
        finance: [
          { id: 1, type: 'expense', category: '餐饮', icon: '🍜', amount: 35, note: '午餐', date: this.today() },
          { id: 2, type: 'income', category: '工资', icon: '💵', amount: 8000, note: '月工资', date: this.today() },
          { id: 3, type: 'expense', category: '交通', icon: '🚇', amount: 12, note: '地铁', date: this.today() },
          { id: 4, type: 'expense', category: '咖啡', icon: '☕', amount: 28, note: '下午茶', date: this.today() },
        ],
        journals: [
          { id: 1, mood: '😊', content: '今天开始搭建个人工作台，感觉效率提升了不少！继续加油！', date: this.today() },
        ],
        streak: 1,
        lastActiveDate: this.today(),
      };
      localStorage.setItem('workbench_data', JSON.stringify(defaultData));
    }
    this.checkStreak();
  },

  // ===== 获取所有数据 =====
  getAll() {
    return JSON.parse(localStorage.getItem('workbench_data'));
  },

  // ===== 保存所有数据 =====
  save(data) {
    localStorage.setItem('workbench_data', JSON.stringify(data));
  },

  // ===== 今日日期 =====
  today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  // ===== 连续打卡天数检查 =====
  checkStreak() {
    const data = this.getAll();
    const today = this.today();
    if (data.lastActiveDate !== today) {
      // 检查昨天是否活跃
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      if (data.lastActiveDate === yStr) {
        data.streak += 1;
      } else {
        data.streak = 1;
      }
      data.lastActiveDate = today;
      // 重置今日习惯打卡状态
      data.habits.forEach(h => { h.done = false; });
      this.save(data);
    }
  },

  // ===== 任务 CRUD =====
  getTasks() { return this.getAll().tasks; },

  addTask(name, priority) {
    const data = this.getAll();
    data.tasks.push({
      id: Date.now(),
      name, priority,
      done: false,
      createdAt: this.today()
    });
    this.save(data);
  },

  toggleTask(id) {
    const data = this.getAll();
    const task = data.tasks.find(t => t.id === id);
    if (task) { task.done = !task.done; this.save(data); }
  },

  deleteTask(id) {
    const data = this.getAll();
    data.tasks = data.tasks.filter(t => t.id !== id);
    this.save(data);
  },

  // ===== 习惯 CRUD =====
  getHabits() { return this.getAll().habits; },

  addHabit(name, icon) {
    const data = this.getAll();
    data.habits.push({ id: Date.now(), name, icon, done: false, streak: 0, history: {} });
    this.save(data);
  },

  toggleHabit(id) {
    const data = this.getAll();
    const habit = data.habits.find(h => h.id === id);
    if (habit) {
      habit.done = !habit.done;
      if (habit.done) {
        habit.streak += 1;
        habit.history[this.today()] = true;
      } else {
        habit.streak = Math.max(0, habit.streak - 1);
        delete habit.history[this.today()];
      }
      this.save(data);
    }
  },

  deleteHabit(id) {
    const data = this.getAll();
    data.habits = data.habits.filter(h => h.id !== id);
    this.save(data);
  },

  // ===== 记账 CRUD =====
  getFinance() { return this.getAll().finance; },

  addFinance(type, category, icon, amount, note) {
    const data = this.getAll();
    data.finance.push({
      id: Date.now(), type, category, icon,
      amount: parseFloat(amount), note,
      date: this.today()
    });
    this.save(data);
  },

  deleteFinance(id) {
    const data = this.getAll();
    data.finance = data.finance.filter(f => f.id !== id);
    this.save(data);
  },

  getFinanceSummary() {
    const records = this.getFinance().filter(f => f.date.startsWith(this.today().slice(0,7)));
    const income = records.filter(f => f.type === 'income').reduce((s,f) => s + f.amount, 0);
    const expense = records.filter(f => f.type === 'expense').reduce((s,f) => s + f.amount, 0);
    return { income, expense, balance: income - expense };
  },

  // ===== 日志 CRUD =====
  getJournals() { return this.getAll().journals; },

  addJournal(mood, content) {
    const data = this.getAll();
    data.journals.unshift({
      id: Date.now(), mood, content, date: this.today()
    });
    this.save(data);
  },

  deleteJournal(id) {
    const data = this.getAll();
    data.journals = data.journals.filter(j => j.id !== id);
    this.save(data);
  },

  // ===== 连续天数 =====
  getStreak() { return this.getAll().streak; },
};
