const viewModel = {
  gameId: "demo-round-001",
  phase: "response_window",
  uiState: "normal",
  currentPlayerId: "north",
  wallCount: 56,
  roundInfo: "东一局",
  turnHint: "AI-北 刚打出 三万，你可碰或过",
  latestAction: "AI-北 打出 三万，你可碰：你已有两张三万",
  actionReason: "响应窗口：可碰或过",
  availableActions: [
    { id: "hu", label: "胡", available: false, reasonText: "当前牌型不满足可胡条件", level: "secondary" },
    { id: "gang", label: "杠", available: false, reasonText: "当前无可杠牌组", level: "secondary" },
    { id: "peng", label: "碰", available: true, reasonText: "你已有两张三万", level: "primary" },
    { id: "chi", label: "吃", available: false, reasonText: "本次不是上家弃牌，不能吃", level: "secondary" },
    { id: "pass", label: "过", available: true, reasonText: "放弃本次响应", level: "secondary" },
  ],
  seats: [
    { id: "north", name: "AI-北", score: 96, handCount: 13, meldCount: 1 },
    { id: "west", name: "AI-西", score: 88, handCount: 12, meldCount: 0 },
    { id: "east", name: "AI-东", score: 104, handCount: 13, meldCount: 2 },
    { id: "south", name: "你", score: 112, handCount: 14, meldCount: 0 },
  ],
  selfHand: ["一万", "二万", "三万", "三万", "四万", "五万", "六筒", "六筒", "七筒", "八条", "九条", "东", "红中", "白板"],
  river: {
    north: ["三万", "九条", "二筒", "北", "五万", "八万"],
    west: ["六万", "七万", "一筒", "白板", "三条", "六筒"],
    east: ["九万", "四条", "二万", "发", "一条", "七筒"],
    south: ["三筒", "四万", "东", "九筒", "五条", "二条"],
  },
  eventTimeline: [
    "AI-东 碰了 AI-西 的 六万",
    "AI-北 打出 三万",
    "你 可碰，等待响应中",
    "牌山余量 56",
  ],
  scoreDeltaTimeline: [
    { text: "AI-东 碰牌成功", delta: "+2", trend: "up" },
    { text: "AI-西 被碰，失去机会", delta: "-2", trend: "down" },
  ],
  resultSummary: {
    title: "你自摸胡牌",
    reason: "胡牌原因：平胡 + 自摸，触发牌：三万",
    scoreChanges: [
      { player: "你", delta: "+24", total: 124, reason: "自摸 / 平胡" },
      { player: "AI-北", delta: "-8", total: 88, reason: "自摸支付" },
      { player: "AI-西", delta: "-8", total: 80, reason: "自摸支付" },
      { player: "AI-东", delta: "-8", total: 96, reason: "自摸支付" },
    ],
  },
};

function renderStatus(model) {
  document.getElementById("turnHint").textContent = model.turnHint;
  document.getElementById("wallCount").textContent = String(model.wallCount);
  document.getElementById("roundInfo").textContent = model.roundInfo;
  document.getElementById("latestAction").textContent = model.latestAction;
  document.getElementById("actionReason").textContent = model.actionReason;
}

function renderFeedback(model) {
  const feedback = document.getElementById("interactionFeedback");
  const text = document.getElementById("feedbackText");
  feedback.classList.remove("interaction-feedback--normal", "interaction-feedback--submitting", "interaction-feedback--error");
  if (model.uiState === "submitting") {
    feedback.classList.add("interaction-feedback--submitting");
    text.textContent = "操作提交中，请稍候...";
    return;
  }
  if (model.uiState === "error") {
    feedback.classList.add("interaction-feedback--error");
    text.textContent = "操作失败：状态已变化，请重新选择可用动作";
    return;
  }
  feedback.classList.add("interaction-feedback--normal");
  text.textContent = "等待你选择动作";
}

function renderSeats(model) {
  for (const seat of model.seats) {
    const target = document.getElementById(`seat-${seat.id}`);
    if (!target) continue;
    target.querySelector(".name").textContent = seat.name;
    target.querySelector(".score").textContent = String(seat.score);
    target.querySelector(".seat-meta").textContent = `手牌 ${seat.handCount} · 副露 ${seat.meldCount}`;
    target.classList.toggle("is-active", seat.id === model.currentPlayerId);
  }
}

function renderRiver(model) {
  for (const seatId of Object.keys(model.river)) {
    const container = document.getElementById(`river-${seatId}`);
    if (!container) continue;
    container.innerHTML = "";
    for (const tile of model.river[seatId]) {
      const cell = document.createElement("span");
      cell.className = "tile-mini";
      cell.textContent = tile;
      container.appendChild(cell);
    }
  }
}

function renderHand(model) {
  const handContainer = document.getElementById("handTiles");
  handContainer.innerHTML = "";
  model.selfHand.forEach((tile, index) => {
    const tileNode = document.createElement("button");
    tileNode.type = "button";
    tileNode.className = "tile";
    tileNode.textContent = tile;
    tileNode.setAttribute("aria-label", `手牌 ${tile}`);
    tileNode.addEventListener("click", () => {
      const currentSelected = handContainer.querySelector(".tile.selected");
      if (currentSelected) currentSelected.classList.remove("selected");
      tileNode.classList.add("selected");
      document.getElementById("actionReason").textContent = `已选中第 ${index + 1} 张：${tile}`;
    });
    handContainer.appendChild(tileNode);
  });
}

function renderEventTimeline(model) {
  const list = document.getElementById("eventTimeline");
  list.innerHTML = "";
  model.eventTimeline.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    list.appendChild(item);
  });
}

function renderScoreDeltaTimeline(model) {
  const list = document.getElementById("scoreDeltaTimeline");
  list.innerHTML = "";
  model.scoreDeltaTimeline.forEach((entry) => {
    const item = document.createElement("li");
    const deltaClass = entry.trend === "up" ? "score-up" : "score-down";
    item.innerHTML = `${entry.text} <span class="${deltaClass}">${entry.delta}</span>`;
    list.appendChild(item);
  });
}

function renderActionBar(model) {
  const actionButtons = document.querySelectorAll("[data-action-id]");
  actionButtons.forEach((btn) => {
    const actionId = btn.getAttribute("data-action-id");
    const action = model.availableActions.find((item) => item.id === actionId);
    if (!action) return;

    btn.textContent = action.label;
    btn.classList.remove("action-primary", "action-available", "action-disabled", "action-submitting");
    btn.disabled = false;
    btn.title = action.reasonText;

    if (!action.available || model.uiState === "submitting") {
      btn.disabled = true;
      btn.classList.add("action-disabled");
    } else {
      btn.classList.add("action-available");
    }

    if (action.level === "primary" && action.available) {
      btn.classList.add("action-primary");
    }

    if (model.uiState === "submitting" && action.available) {
      btn.classList.add("action-submitting");
    }
  });
}

function renderResult(model) {
  document.getElementById("resultTitle").textContent = model.resultSummary.title;
  document.getElementById("resultReason").textContent = model.resultSummary.reason;
  const body = document.getElementById("resultTableBody");
  body.innerHTML = "";
  model.resultSummary.scoreChanges.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.player}</td><td>${row.delta}</td><td>${row.total}</td><td>${row.reason}</td>`;
    body.appendChild(tr);
  });
}

function bindModalEvents() {
  const modal = document.getElementById("resultModal");
  const openBtn = document.getElementById("openResult");
  const closeBtn = document.getElementById("closeResult");

  openBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });
}

function bindActionEvents(model) {
  const actionButtons = document.querySelectorAll("[data-action-id]");
  actionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      model.uiState = "submitting";
      render(model);
      setTimeout(() => {
        if (btn.getAttribute("data-action-id") === "peng") {
          model.uiState = "normal";
          model.actionReason = "已执行碰，等待下一位动作";
          model.latestAction = "你 碰了 AI-北 的 三万";
          model.eventTimeline.unshift("你 碰了 AI-北 的 三万");
          model.scoreDeltaTimeline.unshift({ text: "你 碰牌得势", delta: "+1", trend: "up" });
        } else {
          model.uiState = "error";
        }
        render(model);
      }, 850);
    });
  });
}

function render(model) {
  renderStatus(model);
  renderFeedback(model);
  renderSeats(model);
  renderRiver(model);
  renderHand(model);
  renderActionBar(model);
  renderEventTimeline(model);
  renderScoreDeltaTimeline(model);
  renderResult(model);
}

render(viewModel);
bindModalEvents();
bindActionEvents(viewModel);
