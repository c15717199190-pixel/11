const STORAGE_KEY = "life-archive-demo-v1";

const palette = {
  "体魄": { symbol: "体", color: "#788467", soft: "#e4e8dd" },
  "学识": { symbol: "知", color: "#6d7f8c", soft: "#e0e7e9" },
  "创造": { symbol: "创", color: "#9a7565", soft: "#eee1da" },
  "秩序": { symbol: "序", color: "#8a826d", soft: "#e9e5d9" },
  "联结": { symbol: "联", color: "#9b727a", soft: "#eee0e3" },
  "探索": { symbol: "行", color: "#6a837b", soft: "#dde8e4" },
};

const defaultState = {
  userName: "岚",
  theme: "mist",
  lifeLevel: 12,
  totalXp: 2480,
  mood: "平静",
  narrative: "今天的重点落在创造与体魄上。你不需要把计划填满，只要完成一个起步，今天就不是空白。",
  attributes: {
    "体魄": { level: 8, xp: 310, next: 500 },
    "学识": { level: 11, xp: 420, next: 600 },
    "创造": { level: 14, xp: 515, next: 650 },
    "秩序": { level: 6, xp: 190, next: 400 },
    "联结": { level: 7, xp: 235, next: 450 },
    "探索": { level: 5, xp: 140, next: 350 },
  },
  tasks: [
    { id: 1, title: "推进软件原型", attribute: "创造", duration: 45, completed: false },
    { id: 2, title: "活动一下身体", attribute: "体魄", duration: 30, completed: false },
    { id: 3, title: "阅读二十分钟", attribute: "学识", duration: 20, completed: false },
  ],
  capsules: [
    { id: 101, title: "开始制作人生档案", date: "2026-07-18", type: "重新开始", note: "第一次把这个模糊的想法，认真地写成了一个可以看见的界面。" },
    { id: 102, title: "重新拾起阅读", date: "2026-07-08", type: "个人纪念", note: "没有读很多，但我又开始愿意把时间交给一本书。" },
  ],
  records: [
    { id: 201, date: "2026-07-29", mood: "平静", title: "今天不必面面俱到。", text: "你为软件原型留出了时间，也准备照顾自己的身体。还没有完成的事，可以停在这里，明天再继续。", tags: ["创造 +0", "体魄 +0"] },
    { id: 202, date: "2026-07-28", mood: "有些疲惫", title: "读完了二十页。", text: "计划没有全部完成，但阅读让一天安静地向前移动了一点。", tags: ["学识 +18", "节律 · 稳定"] },
  ],
  lifeItems: [
    { id: 301, symbol: "⌘", title: "第一行代码", note: "开始创造", unlocked: true },
    { id: 302, symbol: "▱", title: "旧书签", note: "重新阅读", unlocked: true },
    { id: 303, symbol: "⌁", title: "远方车票", note: "等待获得", unlocked: false },
  ],
  roomMode: "create",
  recent: [],
};

let state = loadState();
let activeTaskId = null;
let showAllTasks = false;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultState);
    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      attributes: parsed.attributes || structuredClone(defaultState.attributes),
      tasks: parsed.tasks || structuredClone(defaultState.tasks),
      capsules: parsed.capsules || structuredClone(defaultState.capsules),
      records: parsed.records || structuredClone(defaultState.records),
      lifeItems: parsed.lifeItems || structuredClone(defaultState.lifeItems),
      recent: parsed.recent || [],
    };
  } catch {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderAll() {
  renderTheme();
  renderIdentity();
  renderArchive();
  renderRecords();
  renderTasks();
  renderAttributes();
  renderGrowth();
  renderLifeTree();
  renderLifeItems();
  renderRoom();
  renderSummaries();
  updateLevel();
  updateNarrative();
  updateMood();
  renderRecent();
}

function renderArchive() {
  if (!Array.isArray(state.capsules)) state.capsules = structuredClone(defaultState.capsules);
  const completedCount = state.tasks.filter(task => task.completed).length;
  document.getElementById("archiveLifeLevel").textContent = state.lifeLevel;
  document.getElementById("archiveActionCount").textContent = 19 + completedCount;
  document.getElementById("capsuleCount").textContent = `${state.capsules.length} 枚胶囊`;
  const list = document.getElementById("capsuleList");
  list.innerHTML = state.capsules.length ? state.capsules.map(capsule => {
    const [year, month, day] = capsule.date.split("-");
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthLabel = monthNames[Math.max(0, Number(month) - 1)] || "DAY";
    return `
      <article class="card capsule-card">
        <div class="capsule-date"><strong>${escapeHtml(day || "—")}</strong><span>${monthLabel} · ${escapeHtml(year || "")}</span></div>
        <div class="capsule-copy"><span class="eyebrow">MEMORY CAPSULE</span><h3>${escapeHtml(capsule.title)}</h3><p>${escapeHtml(capsule.note || "这一刻被安静地保存了下来。")}</p></div>
        <div class="capsule-actions">
          <span class="capsule-type">${escapeHtml(capsule.type)}</span>
          <button class="delete-control" data-delete-capsule="${capsule.id}" title="删除这枚回忆胶囊">删除</button>
        </div>
      </article>`;
  }).join("") : `<article class="card empty-capsule">这里还是空的。不是因为生活没有发生，而是还没有选择哪一刻值得留下。</article>`;
  list.querySelectorAll("[data-delete-capsule]").forEach(button => {
    button.addEventListener("click", () => deleteCapsule(Number(button.dataset.deleteCapsule)));
  });
  document.getElementById("observerText").textContent = completedCount
    ? `今天已经有 ${completedCount} 项行动被写入档案。你正在把计划变成真实发生过的生活。`
    : "最近的你正在从“准备”进入“创造”。与此同时，身体与恢复仍需要被留出位置。";
}

function renderRecords() {
  if (!Array.isArray(state.records)) state.records = structuredClone(defaultState.records);
  const list = document.getElementById("timelineList");
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  list.innerHTML = state.records.length ? state.records.map((record, index) => {
    const date = new Date(`${record.date}T00:00:00`);
    const day = String(date.getDate()).padStart(2, "0");
    const month = monthNames[date.getMonth()] || "DAY";
    const tags = (record.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
    return `
      <article class="card timeline-entry ${index === 0 ? "featured" : ""}">
        <time><strong>${day}</strong><span>${month}</span></time>
        <i></i>
        <div>
          <span class="eyebrow">${index === 0 ? "最近" : "生活记录"} · ${escapeHtml(record.mood || "平静")}</span>
          <h3>${escapeHtml(record.title)}</h3>
          <p ${index === 0 ? 'id="diaryTodayText"' : ""}>${escapeHtml(record.text)}</p>
          <div class="diary-tags">${tags}</div>
        </div>
        <button class="delete-control timeline-delete" data-delete-record="${record.id}" title="删除这条生活记录">删除</button>
      </article>`;
  }).join("") : `<article class="card empty-capsule">还没有生活记录。普通的一天也可以从一句话开始。</article>`;
  list.querySelectorAll("[data-delete-record]").forEach(button => {
    button.addEventListener("click", () => deleteRecord(Number(button.dataset.deleteRecord)));
  });
}

function renderLifeTree() {
  const completed = state.tasks.filter(task => task.completed);
  const leafPositions = [
    [48,12,-16],[37,18,18],[60,19,-24],[27,28,-9],[49,27,22],[70,29,-18],
    [20,40,16],[38,39,-22],[58,38,12],[78,42,-12],[29,51,-18],[49,49,15],
    [68,53,-9],[17,57,20],[37,62,-14],[58,61,18],[77,61,-20],[48,72,8],
  ];
  const leafCount = Math.min(leafPositions.length, 7 + completed.length * 2 + Math.min(5, state.capsules.length));
  const leaves = leafPositions.slice(0, leafCount).map(([left, top, rotate], index) =>
    `<span class="tree-leaf leaf-${index % 4}" style="left:${left}%;top:${top}%;transform:rotate(${rotate}deg)"></span>`
  ).join("");
  const fruits = completed.slice(0, 5).map((task, index) => {
    const positions = [[34,30],[58,25],[69,45],[42,49],[54,61]];
    return `<button class="tree-fruit" style="left:${positions[index][0]}%;top:${positions[index][1]}%" title="${escapeHtml(task.title)}">${palette[task.attribute]?.symbol || "果"}</button>`;
  }).join("");
  document.getElementById("lifeTreeVisual").innerHTML = `
    <div class="tree-canopy canopy-left"></div><div class="tree-canopy canopy-right"></div><div class="tree-canopy canopy-top"></div>
    <svg class="tree-silhouette" viewBox="0 0 500 430" aria-hidden="true">
      <path class="tree-ground-line" d="M70 398 C150 378 350 378 430 398" />
      <path class="tree-main-trunk" d="M246 390 C238 326 259 282 250 218 C247 177 249 139 252 92" />
      <path class="tree-limb" d="M249 272 C210 230 171 209 128 197" />
      <path class="tree-limb" d="M250 244 C290 205 331 185 378 172" />
      <path class="tree-limb thin" d="M248 202 C213 170 190 145 177 113" />
      <path class="tree-limb thin" d="M252 187 C286 151 310 122 319 91" />
      <path class="tree-root-line" d="M246 388 C215 398 189 405 159 414 M251 389 C286 397 314 405 344 414" />
    </svg>
    ${leaves}${fruits}
    <div class="tree-direction direction-create"><b>创造</b><small>作品与表达</small></div>
    <div class="tree-direction direction-knowledge"><b>学识</b><small>阅读与理解</small></div>
    <div class="tree-direction direction-body"><b>体魄</b><small>行动与恢复</small></div>
    <div class="tree-harvest"><strong>${completed.length}</strong><span>枚行动果实</span><small>${leafCount} 片成长叶</small></div>
  `;
  document.querySelectorAll(".tree-fruit").forEach(fruit => fruit.addEventListener("click", () => showToast("一枚行动果实", fruit.title)));
}

function renderLifeItems() {
  if (!Array.isArray(state.lifeItems)) state.lifeItems = structuredClone(defaultState.lifeItems);
  document.getElementById("lifeItemCount").textContent = `${state.lifeItems.length} 件`;
  const container = document.getElementById("lifeItems");
  container.innerHTML = state.lifeItems.length ? state.lifeItems.map(item => `
    <div class="life-item ${item.unlocked ? "" : "locked"}">
      <button class="life-item-main" data-life-item="${item.id}">
        <span>${escapeHtml(item.symbol)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note)}</small>
      </button>
      <button class="delete-control" data-delete-item="${item.id}" title="删除这件人生物品">删除</button>
    </div>
  `).join("") : `<div class="empty-life-items">人生物品已清空。新的经历仍会带来新的收藏。</div>`;
  container.querySelectorAll("[data-life-item]").forEach(button => button.addEventListener("click", () => {
    const item = state.lifeItems.find(entry => entry.id === Number(button.dataset.lifeItem));
    if (item) showToast(item.title, item.note);
  }));
  container.querySelectorAll("[data-delete-item]").forEach(button => {
    button.addEventListener("click", () => deleteLifeItem(Number(button.dataset.deleteItem)));
  });
}

function renderRoom() {
  const completed = state.tasks.filter(task => task.completed).length;
  const roomScore = completed + state.capsules.length + state.lifeItems.filter(item => item.unlocked).length;
  const level = Math.max(1, 1 + Math.floor(roomScore / 3));
  const progress = (roomScore % 3) / 3 * 100;
  const mode = state.roomMode || "create";
  document.getElementById("roomLevel").textContent = `Room Lv.${level}`;
  document.getElementById("roomProgressBar").style.width = `${Math.max(8, progress)}%`;
  document.getElementById("roomModeButtons").querySelectorAll("[data-room-mode]").forEach(button => {
    button.classList.toggle("selected", button.dataset.roomMode === mode);
  });
  const modeCopy = {
    create: "创造的积累让工作桌逐渐完整，这里适合把想法变成作品。",
    read: "阅读留下书架、灯光和翻过的纸页，这里适合安静理解世界。",
    rest: "恢复也会改变房间。柔和的灯与空椅子提醒你，可以暂时停下来。",
  };
  document.getElementById("roomNarrative").textContent = modeCopy[mode];
  document.getElementById("roomUnlocks").innerHTML = [
    `<span class="${state.attributes["学识"].level >= 8 ? "unlocked" : ""}">书架 · 学识 Lv.8</span>`,
    `<span class="${state.attributes["创造"].level >= 10 ? "unlocked" : ""}">工作桌 · 创造 Lv.10</span>`,
    `<span class="${state.attributes["探索"].level >= 6 ? "unlocked" : ""}">旅行照片 · 探索 Lv.6</span>`,
  ].join("");
  document.getElementById("roomScene").innerHTML = `
    <div class="room-back-wall"></div>
    <div class="room-window"><i></i><b></b></div>
    <div class="room-shelf ${state.attributes["学识"].level >= 8 ? "visible" : ""}"><i></i><i></i><i></i><i></i></div>
    <div class="room-desk visible"><span class="room-lamp"></span><span class="room-paper"></span></div>
    <div class="room-chair"></div>
    <div class="room-rug"></div>
    <div class="room-plant ${state.attributes["体魄"].level >= 7 ? "lush" : ""}"><i></i><i></i><i></i></div>
    <div class="room-frame ${state.attributes["探索"].level >= 6 ? "visible" : ""}">远方</div>
    <div class="room-light mode-${mode}"></div>
    <span class="room-caption">${escapeHtml(modeCopy[mode])}</span>
  `;
}

function renderSummaries() {
  const completed = state.tasks.filter(task => task.completed);
  const xpTotal = completed.reduce((sum, task) => sum + (task.earnedXp || 0), 0);
  const totals = completed.reduce((acc, task) => {
    acc[task.attribute] = (acc[task.attribute] || 0) + (task.earnedXp || 0);
    return acc;
  }, {});
  const topAttribute = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || "创造";
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const englishMonths = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
  document.getElementById("monthlyReportLabel").textContent = `MONTHLY REPORT · ${month}`;
  document.getElementById("monthlyReportDate").textContent = `${englishMonths[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById("monthlySummaryTitle").textContent = completed.length
    ? `这个月，${topAttribute}成为最清晰的方向。`
    : "这个月仍在等待第一笔真实行动。";
  document.getElementById("monthlySummaryText").textContent = completed.length
    ? `你完成了 ${completed.length} 项行动，获得 ${xpTotal} 点属性经验，并留下 ${state.records.length} 条生活记录。没有完成的部分不会抹去已经发生的积累。`
    : `目前保存了 ${state.records.length} 条生活记录与 ${state.capsules.length} 枚回忆胶囊。即使没有完成任务，这个月也不是空白。`;
  document.getElementById("monthlyMetrics").innerHTML = `
    <span><b>${completed.length}</b> 完成行动</span>
    <span><b>${xpTotal}</b> 属性经验</span>
    <span><b>${state.records.length}</b> 生活记录</span>`;
  document.getElementById("annualTopAttribute").textContent = topAttribute;
  document.getElementById("annualNarrative").textContent = completed.length
    ? `这一年，你把 ${topAttribute} 从计划变成了可以看见的积累。`
    : "这一年的档案已经建立，故事仍在继续书写。";
  document.getElementById("annualHighlights").innerHTML = `
    <span><b>${state.capsules.length}</b> 枚重要回忆</span>
    <span><b>${state.records.length}</b> 条生活记录</span>
    <span><b>${state.lifeItems.length}</b> 件人生物品</span>`;
}

function renderTheme() {
  const theme = state.theme || "mist";
  document.body.dataset.theme = theme;
  document.querySelectorAll("[data-theme-option]").forEach(option => {
    option.classList.toggle("selected", option.dataset.themeOption === theme);
  });
}

function renderIdentity() {
  const name = (state.userName || "岚").trim();
  const initial = Array.from(name)[0] || "岚";
  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = name);
  document.querySelectorAll("[data-user-initial]").forEach(el => el.textContent = initial);
  document.getElementById("userNameInput").value = name;
  document.getElementById("meLifeLevel").textContent = state.lifeLevel;
  document.getElementById("archiveLifeLevel").textContent = state.lifeLevel;
  document.getElementById("meActionCount").textContent = 19 + state.tasks.filter(task => task.completed).length;
}

function renderTasks() {
  const list = document.getElementById("taskList");
  const visibleTasks = showAllTasks ? state.tasks : state.tasks.slice(0, 3);
  list.innerHTML = visibleTasks.map(task => {
    const p = palette[task.attribute];
    return `
      <article class="task-card ${task.completed ? "completed" : ""}" style="--accent:${p.color};--accent-soft:${p.soft}">
        <span class="task-symbol">${task.completed ? "✓" : p.symbol}</span>
        <div class="task-body">
          <strong class="task-title">${escapeHtml(task.title)}</strong>
          <span class="task-meta"><span>${task.attribute}</span><i></i><span>标准 ${task.duration} 分钟</span><i></i><span>${task.completed ? `已获得 ${task.earnedXp} XP` : "可选择起步 / 完成 / 突破"}</span></span>
        </div>
        <button class="task-action" data-complete="${task.id}">${task.completed ? "已记录" : "去完成"}</button>
        <button class="delete-control task-delete" data-delete-task="${task.id}" title="删除这项行动">删除</button>
      </article>`;
  }).join("");
  list.querySelectorAll("[data-complete]").forEach(button => {
    button.addEventListener("click", () => openCompleteModal(Number(button.dataset.complete)));
  });
  list.querySelectorAll("[data-delete-task]").forEach(button => {
    button.addEventListener("click", () => deleteTask(Number(button.dataset.deleteTask)));
  });
  const showAllButton = document.getElementById("showAllButton");
  showAllButton.innerHTML = showAllTasks ? "收起行动 <span>↑</span>" : "查看全部 <span>→</span>";
}

function renderAttributes() {
  const list = document.getElementById("attributeList");
  list.innerHTML = Object.entries(state.attributes).map(([name, data]) => {
    const p = palette[name];
    const progress = Math.min(100, (data.xp / data.next) * 100);
    return `
      <div class="attribute-row" style="--color:${p.color};--soft:${p.soft};--progress:${progress}%">
        <span class="attribute-icon">${p.symbol}</span>
        <div class="attribute-main">
          <div class="attribute-label"><span>${name}</span><span>${data.xp} / ${data.next}</span></div>
          <div class="mini-track"><i></i></div>
        </div>
        <span class="attribute-level">Lv.${data.level}</span>
      </div>`;
  }).join("");
}

function renderGrowth() {
  const container = document.getElementById("growthCards");
  container.innerHTML = Object.entries(state.attributes).map(([name, data]) => {
    const p = palette[name];
    return `
      <article class="card growth-attribute" style="--color:${p.color}">
        <div><span class="big-icon">${p.symbol}</span><h3>${name}</h3><p>${attributeCopy(name)}</p></div>
        <footer><strong>Lv. ${data.level}</strong><span>${data.xp} / ${data.next} XP</span></footer>
      </article>`;
  }).join("");
}

function attributeCopy(name) {
  return {
    "体魄": "身体投入与恢复", "学识": "理解与知识积累", "创造": "把想法变成作品",
    "秩序": "生活管理与稳定", "联结": "关系与温暖回应", "探索": "走向新的经验"
  }[name];
}

function updateLevel() {
  const levelStart = (state.lifeLevel - 10) * 1000;
  const levelEnd = levelStart + 1000;
  while (state.totalXp >= levelEnd) {
    state.lifeLevel += 1;
    break;
  }
  const currentStart = (state.lifeLevel - 10) * 1000;
  const currentEnd = currentStart + 1000;
  const pct = Math.max(2, Math.min(100, ((state.totalXp - currentStart) / 1000) * 100));
  document.getElementById("lifeLevel").textContent = state.lifeLevel;
  document.getElementById("growthLifeLevel").textContent = state.lifeLevel;
  document.querySelector(".profile-button small").textContent = `人生等级 ${state.lifeLevel}`;
  document.getElementById("meLifeLevel").textContent = state.lifeLevel;
  document.getElementById("totalXp").textContent = state.totalXp.toLocaleString("zh-CN");
  document.getElementById("xpRemaining").textContent = Math.max(0, currentEnd - state.totalXp).toLocaleString("zh-CN");
  document.getElementById("levelProgress").textContent = `${state.totalXp.toLocaleString("zh-CN")} / ${currentEnd.toLocaleString("zh-CN")}`;
  document.getElementById("lifeXpBar").style.width = `${pct}%`;
}

function updateNarrative() {
  const completed = state.tasks.filter(task => task.completed);
  const todayXp = completed.reduce((sum, task) => sum + (task.earnedXp || 0), 0);
  const attributeTotals = completed.reduce((acc, task) => {
    acc[task.attribute] = (acc[task.attribute] || 0) + (task.earnedXp || 0);
    return acc;
  }, {});
  const topAttribute = Object.entries(attributeTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "等待开始";
  document.getElementById("todayCompleted").textContent = completed.length;
  document.getElementById("todayXp").textContent = todayXp;
  document.getElementById("todayTopAttribute").textContent = topAttribute;
  const text = completed.length
    ? `今天你已经留下 ${completed.length} 项真实行动。${completed.map(t => t.title).join("、")}让这一天有了可以看见的进展。`
    : state.narrative;
  document.getElementById("dailyNarrative").textContent = text;
  const diaryTodayText = document.getElementById("diaryTodayText");
  if (diaryTodayText) {
    diaryTodayText.textContent = completed.length
      ? `你完成了${completed.map(t => `「${t.title}」`).join("、")}。还没有完成的事，可以停在这里，明天再继续。`
      : diaryTodayText.textContent;
  }
  const totals = completed.reduce((acc, task) => {
    acc[task.attribute] = (acc[task.attribute] || 0) + (task.earnedXp || 0);
    return acc;
  }, {});
  const diaryTags = document.querySelector(".diary-tags");
  if (diaryTags && Object.keys(totals).length) {
    diaryTags.innerHTML = Object.entries(totals).map(([name, xp]) => `<span>${name} +${xp}</span>`).join("");
  }
}

function updateMood() {
  document.querySelectorAll("[data-mood]").forEach(button => button.classList.toggle("selected", button.dataset.mood === state.mood));
}

function renderRecent() {
  const recentRecord = document.getElementById("recentRecord");
  if (!recentRecord || !state.recent.length) return;
  recentRecord.innerHTML = state.recent.slice(0, 2).map(item => `
    <div class="record-line"><span class="record-symbol">✓</span><div><strong>${escapeHtml(item.title)}</strong><small>${item.attribute}经验 +${item.xp} · 刚刚</small></div></div>
  `).join("");
}

function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach(modal => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
}

function openCompleteModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || task.completed) return;
  activeTaskId = taskId;
  document.getElementById("completeTitle").textContent = `「${task.title}」做到哪一步？`;
  const tiers = [
    { name: "起步", copy: "状态不满，也做了一点", multiplier: .45, symbol: "一" },
    { name: "完成", copy: `完成了标准的 ${task.duration} 分钟`, multiplier: 1, symbol: "满" },
    { name: "突破", copy: "今天比原计划多走了一段", multiplier: 1.55, symbol: "上" },
  ];
  document.getElementById("completeOptions").innerHTML = tiers.map(tier => {
    const xp = Math.round(task.duration * tier.multiplier);
    return `<button class="complete-option" data-tier="${tier.name}" data-xp="${xp}"><span class="option-symbol">${tier.symbol}</span><span><strong>${tier.name}</strong><small>${tier.copy}</small></span><b>+${xp} XP</b></button>`;
  }).join("");
  document.querySelectorAll(".complete-option").forEach(button => button.addEventListener("click", () => completeTask(button.dataset.tier, Number(button.dataset.xp))));
  openModal("completeModal");
}

function completeTask(tier, xp) {
  const task = state.tasks.find(t => t.id === activeTaskId);
  if (!task) return;
  task.completed = true;
  task.earnedXp = xp;
  task.tier = tier;
  state.totalXp += Math.round(xp * .45);
  const attr = state.attributes[task.attribute];
  attr.xp += xp;
  if (attr.xp >= attr.next) {
    attr.xp -= attr.next;
    attr.level += 1;
    attr.next = Math.round(attr.next * 1.12);
  }
  state.recent.unshift({ title: `完成「${task.title}」· ${tier}`, attribute: task.attribute, xp });
  saveState();
  closeModals();
  renderAll();
  showToast(`${task.attribute}经验 +${xp}`, `以「${tier}」完成：${task.title}`);
}

function addTask() {
  const titleInput = document.getElementById("taskTitleInput");
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }
  state.tasks.unshift({
    id: Date.now(),
    title,
    attribute: document.getElementById("taskAttributeInput").value,
    duration: Number(document.getElementById("taskDurationInput").value),
    completed: false,
  });
  saveState();
  renderTasks();
  closeModals();
  titleInput.value = "";
  showToast("行动已加入今天", "可以从「起步」开始，不必等待完美状态。");
}

function addCapsule() {
  const titleInput = document.getElementById("capsuleTitleInput");
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }
  state.capsules.unshift({
    id: Date.now(),
    title,
    date: document.getElementById("capsuleDateInput").value || new Date().toISOString().slice(0, 10),
    type: document.getElementById("capsuleTypeInput").value,
    note: document.getElementById("capsuleNoteInput").value.trim(),
  });
  saveState();
  renderAll();
  closeModals();
  titleInput.value = "";
  document.getElementById("capsuleNoteInput").value = "";
  showToast("回忆胶囊已封存", "它不会只成为一个成就数字，而会保留当时的你。");
}

function deleteTask(taskId) {
  const task = state.tasks.find(entry => entry.id === taskId);
  if (!task || !confirm(`删除行动「${task.title}」？`)) return;
  if (task.completed && task.earnedXp) {
    state.totalXp = Math.max(0, state.totalXp - Math.round(task.earnedXp * .45));
    const attribute = state.attributes[task.attribute];
    if (attribute) attribute.xp = Math.max(0, attribute.xp - task.earnedXp);
  }
  state.tasks = state.tasks.filter(entry => entry.id !== taskId);
  saveState();
  renderAll();
  showToast("行动已删除", "相关的今日统计也已重新计算。");
}

function deleteRecord(recordId) {
  const record = state.records.find(entry => entry.id === recordId);
  if (!record || !confirm(`删除生活记录「${record.title}」？`)) return;
  state.records = state.records.filter(entry => entry.id !== recordId);
  saveState();
  renderAll();
  showToast("生活记录已删除", "其他成长与回忆仍然保留。");
}

function deleteCapsule(capsuleId) {
  const capsule = state.capsules.find(entry => entry.id === capsuleId);
  if (!capsule || !confirm(`删除回忆胶囊「${capsule.title}」？`)) return;
  state.capsules = state.capsules.filter(entry => entry.id !== capsuleId);
  saveState();
  renderAll();
  showToast("回忆胶囊已删除", "这次操作只影响选中的胶囊。");
}

function deleteLifeItem(itemId) {
  const item = state.lifeItems.find(entry => entry.id === itemId);
  if (!item || !confirm(`删除人生物品「${item.title}」？`)) return;
  state.lifeItems = state.lifeItems.filter(entry => entry.id !== itemId);
  saveState();
  renderAll();
  showToast("人生物品已删除", "成长房间已根据剩余收藏重新整理。");
}

function showToast(title, copy) {
  const toast = document.getElementById("toast");
  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastCopy").textContent = copy;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function replayIntro() {
  const current = document.getElementById("introSequence");
  const fresh = current.cloneNode(true);
  current.replaceWith(fresh);
}

function switchPage(pageName) {
  document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.page === pageName));
  document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === `page-${pageName}`));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHtml(value) {
  const el = document.createElement("div");
  el.textContent = value;
  return el.innerHTML;
}

document.querySelectorAll(".nav-item").forEach(item => item.addEventListener("click", () => switchPage(item.dataset.page)));
document.querySelectorAll("[data-page-link]").forEach(item => item.addEventListener("click", () => switchPage(item.dataset.pageLink)));
document.getElementById("addTaskButton").addEventListener("click", () => openModal("taskModal"));
document.getElementById("saveTaskButton").addEventListener("click", addTask);
document.getElementById("addCapsuleButton").addEventListener("click", () => openModal("capsuleModal"));
document.getElementById("saveCapsuleButton").addEventListener("click", addCapsule);
document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", closeModals));
document.querySelectorAll(".modal-backdrop").forEach(modal => modal.addEventListener("click", event => { if (event.target === modal) closeModals(); }));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModals(); });
document.getElementById("taskTitleInput").addEventListener("keydown", event => { if (event.key === "Enter") addTask(); });
document.getElementById("moodRow").addEventListener("click", event => {
  const button = event.target.closest("[data-mood]");
  if (!button) return;
  state.mood = button.dataset.mood;
  saveState();
  updateMood();
  showToast(`状态：${state.mood}`, "今天的建议会更贴近你此刻的状态。");
});
document.getElementById("focusButton").addEventListener("click", () => {
  document.body.classList.toggle("focus-mode");
  showToast(document.body.classList.contains("focus-mode") ? "已进入专注视图" : "已退出专注视图", "只留下今天真正重要的行动。");
});
document.getElementById("editNoteButton").addEventListener("click", () => {
  const note = prompt("为今天留下一句话：", state.narrative);
  if (note !== null && note.trim()) {
    state.narrative = note.trim();
    saveState();
    updateNarrative();
  }
});
document.getElementById("writeDiaryButton").addEventListener("click", () => {
  const note = prompt("今天最想记住什么？", "");
  if (note && note.trim()) {
    const now = new Date();
    state.records.unshift({
      id: Date.now(),
      date: now.toISOString().slice(0, 10),
      mood: state.mood,
      title: "今天想记住的一句话",
      text: note.trim(),
      tags: ["生活记录", `状态 · ${state.mood}`],
    });
    saveState();
    renderAll();
    showToast("这句话已留在今天", "普通的一天，也值得有一小块位置。");
  }
});
document.getElementById("newChapterButton").addEventListener("click", () => showToast("章节功能预览", "正式版本中可为一段生活命名并设置方向。"));
document.getElementById("showAllButton").addEventListener("click", () => {
  showAllTasks = !showAllTasks;
  renderTasks();
});
document.getElementById("archiveViewToggle").addEventListener("click", () => {
  const details = document.getElementById("archiveYearDetails");
  details.open = !details.open;
  document.getElementById("archiveViewToggle").innerHTML = details.open
    ? '收起年度档案 <span>↑</span>'
    : '展开年度档案 <span>↓</span>';
});
document.getElementById("profileButton").addEventListener("click", () => switchPage("me"));
document.getElementById("replayIntro").addEventListener("click", replayIntro);
document.getElementById("themeGrid").addEventListener("click", event => {
  const option = event.target.closest("[data-theme-option]");
  if (!option) return;
  const themeNames = { mist: "雾白", greenhouse: "植物玻璃", night: "深夜档案", clay: "陶土书房" };
  state.theme = option.dataset.themeOption;
  saveState();
  renderTheme();
  showToast(`已进入「${themeNames[state.theme]}」`, "背景、卡片与文字正在一起改变。");
});
document.getElementById("saveNameButton").addEventListener("click", () => {
  const input = document.getElementById("userNameInput");
  const name = input.value.trim();
  if (!name) {
    input.focus();
    showToast("还没有写下名字", "可以使用本名、昵称，或你喜欢的称呼。");
    return;
  }
  state.userName = name;
  saveState();
  renderIdentity();
  showToast(`你好，${name}`, "新的称呼已经写入你的人生档案。");
});
document.getElementById("userNameInput").addEventListener("keydown", event => {
  if (event.key === "Enter") document.getElementById("saveNameButton").click();
});
document.getElementById("capsuleTitleInput").addEventListener("keydown", event => {
  if (event.key === "Enter") addCapsule();
});
document.getElementById("reportPreviewButton").addEventListener("click", () => {
  renderSummaries();
  showToast("月度总结已重新生成", "行动、经验、记录和主要成长方向已经重新统计。");
});
document.getElementById("mapPreviewButton").addEventListener("click", () => showToast("人生地图", "每个节点将连接日期、照片、日记、技能与当时的状态。"));
document.querySelectorAll(".map-node").forEach(node => node.addEventListener("click", () => showToast(node.querySelector("small").textContent, "这处人生坐标会保存与它相关的真实记录。")));
document.getElementById("roomModeButtons").addEventListener("click", event => {
  const button = event.target.closest("[data-room-mode]");
  if (!button) return;
  state.roomMode = button.dataset.roomMode;
  saveState();
  renderRoom();
});
document.getElementById("resetDemo").addEventListener("click", () => {
  if (confirm("恢复到最初的演示数据？")) {
    state = JSON.parse(JSON.stringify(defaultState));
    saveState();
    renderAll();
    switchPage("today");
  }
});

const now = new Date();
const dayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
document.getElementById("todayDate").textContent = `${monthNames[now.getMonth()]}${now.getDate()}日 · ${dayNames[now.getDay()]}`;
document.getElementById("capsuleDateInput").value = now.toISOString().slice(0, 10);

renderAll();
