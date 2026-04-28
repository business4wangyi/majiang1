const { ACTION_ORDER, createTableViewModelFromSnapshot, createDefaultLobbyState, createDefaultTableSnapshot, createResultSummary } = window.MajiangViewModelAdapter;

const appState = {
  lobby: createDefaultLobbyState(),
  route: "lobby", // lobby | table
  phase: "lobby_idle", // lobby_idle | creating_game | lobby_error | table_loading | table
  tableSnapshot: createDefaultTableSnapshot(),
  selectedTileIndex: null,
  selectedActionId: null,
  submitting: false,
  inlineError: null,
  toastTimer: null,
  countdownTimer: null,
  actionHandler: null,
  gameCreationHandler: null,
  contextExpanded: false,
  diagnosticsExpanded: false,
  sideTab: "events",
  showMoreActions: false,
  lastActionScope: "none",
  disabledReasonExpanded: false,
  actionExplainDrawerOpen: false,
  lastLatestActionKey: "",
};

function nowTag() {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function showToast(message, type) {
  const node = document.getElementById("toast");
  node.textContent = message;
  node.classList.remove("hidden", "error");
  if (type === "error") node.classList.add("error");
  if (appState.toastTimer) clearTimeout(appState.toastTimer);
  appState.toastTimer = setTimeout(() => node.classList.add("hidden"), 2200);
}

function setInlineError(err) {
  const node = document.getElementById("inlineError");
  if (!err) {
    node.classList.add("hidden");
    node.textContent = "";
    return;
  }
  node.classList.remove("hidden");
  node.textContent = err.message;
}

function setGlobalSyncError(err) {
  const bar = document.getElementById("globalSyncError");
  if (!err) {
    bar.classList.add("hidden");
    document.getElementById("globalSyncErrorText").textContent = "";
    return;
  }
  bar.classList.remove("hidden");
  document.getElementById("globalSyncErrorText").textContent = err.message;
}

function getCurrentViewModel() {
  return createTableViewModelFromSnapshot(appState.tableSnapshot);
}

function renderRoute() {
  const lobby = document.getElementById("lobbyPage");
  const table = document.getElementById("tablePage");
  lobby.classList.toggle("hidden", appState.route !== "lobby");
  table.classList.toggle("hidden", appState.route !== "table");

  const loading = document.getElementById("tableLoadingPanel");
  const lock = appState.phase === "table_loading";
  loading.classList.toggle("hidden", !lock);
  table.querySelectorAll(".topbar, .table-layout, .hand-panel, .action-bar, .action-reason-list-panel, .action-reason-panel, #inlineError, #interactionFeedback").forEach((node) => {
    node.classList.toggle("hidden", lock);
  });
}

function renderLobby() {
  document.getElementById("cfgPlayers").textContent = String(appState.lobby.players);
  document.getElementById("cfgAiType").textContent = appState.lobby.aiType;
  document.getElementById("cfgRuleSet").textContent = appState.lobby.ruleSet;
  document.getElementById("cfgBaseScore").textContent = String(appState.lobby.baseScore);

  const startBtn = document.getElementById("startGameBtn");
  const errorNode = document.getElementById("lobbyError");
  if (appState.phase === "creating_game") {
    startBtn.disabled = true;
    startBtn.textContent = "创建中...";
  } else {
    startBtn.disabled = false;
    startBtn.textContent = appState.phase === "lobby_error" ? "重试创建" : "开始对局";
  }
  if (appState.phase === "lobby_error") {
    errorNode.classList.remove("hidden");
    errorNode.textContent = "创建失败：请重试或查看诊断";
  } else {
    errorNode.classList.add("hidden");
  }

  const recentEmpty = document.getElementById("recentGamesEmpty");
  const recentList = document.getElementById("recentGamesList");
  if (!appState.lobby.recentGames.length) {
    recentEmpty.classList.remove("hidden");
    recentList.classList.add("hidden");
  } else {
    recentEmpty.classList.add("hidden");
    recentList.classList.remove("hidden");
    recentList.innerHTML = "";
    appState.lobby.recentGames.forEach((g) => {
      const li = document.createElement("li");
      li.textContent = `${g.id} ${g.result}`;
      recentList.appendChild(li);
    });
  }

  document.getElementById("lobbyDiagOutput").textContent = JSON.stringify({ phase: appState.phase, lobby: appState.lobby }, null, 2);
}

function renderStatus(model) {
  document.getElementById("turnHint").textContent = model.turnHint;
  document.getElementById("wallCount").textContent = String(model.wallCount);
  document.getElementById("roundInfo").textContent = model.roundInfo;
  document.getElementById("centerRoundInfo").textContent = model.roundInfo;
  document.getElementById("centerWallCount").textContent = String(model.wallCount);

  const latestMain = `${model.latestEvent.actor} ${model.latestEvent.verb} ${model.latestEvent.tile}`.trim();
  const latestSub = `${model.latestEvent.target}：${model.latestEvent.responseHint}`;
  const latestActionMainNode = document.getElementById("latestActionMain");
  latestActionMainNode.textContent = latestMain;
  const latestActionKey = `${model.latestEvent.actor}|${model.latestEvent.verb}|${model.latestEvent.tile}|${model.latestEvent.target}`;
  if (appState.lastLatestActionKey && latestActionKey !== appState.lastLatestActionKey) {
    latestActionMainNode.classList.remove("recent-hit");
    void latestActionMainNode.offsetWidth;
    latestActionMainNode.classList.add("recent-hit");
  }
  appState.lastLatestActionKey = latestActionKey;
  document.getElementById("latestActionSub").textContent = latestSub;
  const primaryFocus = document.getElementById("primaryFocusHint");
  if (model.phase === "response_window") {
    primaryFocus.textContent = `响应窗口：${model.latestEvent.responseHint || "请选择响应动作或过"}`;
  } else if (model.phase === "player_turn") {
    primaryFocus.textContent = "你的回合：先选牌，再执行出牌/确认";
  } else if (model.phase === "waiting_ai") {
    primaryFocus.textContent = "等待 AI 行动，请关注最近动作";
  } else if (model.phase === "ended") {
    primaryFocus.textContent = "本局结束：请查看结算和复盘";
  } else {
    primaryFocus.textContent = model.turnHint;
  }

  const countdown = document.getElementById("responseCountdown");
  if (model.responseContext.remainingMs === null || model.phase !== "response_window") {
    countdown.textContent = "当前无响应倒计时";
    countdown.classList.remove("warning");
  } else {
    countdown.textContent = `响应剩余 ${(model.responseContext.remainingMs / 1000).toFixed(1)}s`;
    countdown.classList.toggle("warning", model.responseContext.remainingMs <= 5000);
  }
}

function renderFeedback(model) {
  const feedback = document.getElementById("interactionFeedback");
  const text = document.getElementById("feedbackText");
  feedback.classList.remove("interaction-feedback--normal", "interaction-feedback--submitting", "interaction-feedback--error", "interaction-feedback--waiting");
  if (appState.phase === "table_loading") {
    feedback.classList.add("interaction-feedback--waiting");
    text.textContent = "牌桌加载中，请稍候...";
    return;
  }
  if (model.phase === "ended") {
    feedback.classList.add("interaction-feedback--waiting");
    text.textContent = "本局已结束，请查看结算/复盘";
    return;
  }
  if (appState.submitting) {
    feedback.classList.add("interaction-feedback--submitting");
    text.textContent = "操作提交中，请稍候...";
    return;
  }
  if (appState.inlineError) {
    feedback.classList.add("interaction-feedback--error");
    text.textContent = "操作失败：请点击【过】继续，或重新选牌后再点主操作";
    return;
  }
  if (model.phase === "waiting_ai") {
    feedback.classList.add("interaction-feedback--waiting");
    text.textContent = "AI 思考中";
    return;
  }
  feedback.classList.add("interaction-feedback--normal");
  text.textContent = model.turnHint;
}

function renderSeats(model) {
  model.seats.forEach((seat) => {
    const target = document.getElementById(`seat-${seat.id}`);
    if (!target) return;
    target.querySelector(".name").textContent = seat.name;
    target.querySelector(".score").textContent = String(seat.score);
    target.querySelector(".seat-meta").textContent = `手牌 ${seat.handCount} · 副露 ${seat.meldGroups.length}`;
    target.classList.toggle("is-active", seat.id === model.currentPlayerId);

    const meldList = target.querySelector(".meld-list");
    meldList.innerHTML = "";
    seat.meldGroups.forEach((group) => {
      const node = document.createElement("div");
      node.className = "meld-zone";
      const tag = document.createElement("span");
      tag.className = "meld-tag";
      tag.textContent = group.type === "chi" ? "吃" : group.type === "peng" ? "碰" : "杠";
      node.appendChild(tag);
      group.tiles.forEach((tile) => {
        const t = document.createElement("span");
        t.className = "tile-mini";
        t.textContent = tile;
        node.appendChild(t);
      });
      meldList.appendChild(node);
    });
  });
}

function renderRiver(model) {
  ["north", "west", "east", "south"].forEach((seatId) => {
    const container = document.getElementById(`river-${seatId}`);
    container.innerHTML = "";
    (model.discardRiver[seatId] || []).forEach((tile) => {
      const node = document.createElement("span");
      node.className = "tile-mini";
      if (seatId === model.responseContext.highlightedRiverSeatId && tile === model.responseContext.tile) {
        node.classList.add("tile-mini--response-target");
      }
      node.textContent = tile;
      container.appendChild(node);
    });
  });
}

function renderHand(model) {
  const hand = document.getElementById("handTiles");
  hand.innerHTML = "";
  const lockHand = model.phase === "ended" || appState.phase === "table_loading";
  model.selfHand.forEach((tile, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile";
    if (appState.selectedTileIndex === idx) btn.classList.add("selected");
    btn.textContent = tile;
    btn.disabled = lockHand;
    btn.addEventListener("click", () => {
      appState.selectedTileIndex = idx;
      appState.inlineError = null;
      rerender();
    });
    hand.appendChild(btn);
  });
}

function renderActionBar(model) {
  const sortedActions = [...model.availableActions].sort((a, b) => ACTION_ORDER.indexOf(a.id) - ACTION_ORDER.indexOf(b.id));
  const actionMap = new Map(sortedActions.map((a) => [a.id, a]));
  const availableReasonList = document.getElementById("availableActionReasons");
  const actionStageSummary = document.getElementById("actionStageSummary");
  const toggleMoreBtn = document.getElementById("toggleMoreActionsBtn");
  const disabledReasons = [];
  availableReasonList.innerHTML = "";

  const lockAllActions = model.phase === "ended" || appState.phase === "table_loading";
  const scope = model.phase === "response_window" ? "response" : model.phase === "player_turn" ? "turn" : "none";
  if (scope !== appState.lastActionScope) {
    appState.showMoreActions = false;
    appState.lastActionScope = scope;
  }

  let primaryResponseActionId = null;
  if (scope === "response") {
    const availableResponseActions = sortedActions.filter((action) => ["hu", "gang", "peng", "chi"].includes(action.id) && action.available);
    const taggedPrimaryAction = availableResponseActions.find((action) => action.isPrimaryPath);
    primaryResponseActionId = (taggedPrimaryAction && taggedPrimaryAction.id) || (availableResponseActions[0] && availableResponseActions[0].id) || null;
  }

  const shouldShowByPriority = (actionId) => {
    if (scope === "none") return false;
    if (appState.showMoreActions) return true;
    if (scope === "response") {
      if (actionId === "pass") return true;
      return actionId === primaryResponseActionId;
    }
    if (scope === "turn") return ["discard", "confirm", "cancel"].includes(actionId);
    return true;
  };

  let hasSecondaryActions = false;
  document.getElementById("availableActionTitle").textContent = scope === "response" ? "当前可响应动作说明：" : scope === "turn" ? "当前可出牌动作说明：" : "当前可用动作说明：";
  document.querySelectorAll("[data-action-id]").forEach((btn) => {
    const actionId = btn.getAttribute("data-action-id");
    const action = actionMap.get(actionId) || { label: btn.textContent, available: false, reasonText: "当前不可用" };
    btn.textContent = action.label;
    btn.classList.remove("action-primary", "action-main-path", "action-available", "action-disabled", "hidden-by-phase");
    const phaseScope = (btn.getAttribute("data-phase-scope") || "").split(",");
    const hiddenByPhase = scope === "none" || !phaseScope.includes(scope);
    if (hiddenByPhase) {
      btn.classList.add("hidden-by-phase");
      btn.disabled = true;
      return;
    }

    const shouldShow = shouldShowByPriority(actionId);
    if (!shouldShow) {
      hasSecondaryActions = true;
      btn.classList.add("hidden-by-phase");
      btn.disabled = true;
      return;
    }

    const disabled = lockAllActions || appState.submitting || !action.available;
    btn.disabled = disabled;
    if (disabled) {
      btn.classList.add("action-disabled");
      disabledReasons.push(`${action.label}：${action.reasonText}`);
    } else {
      btn.classList.add("action-available");
    }
    if (action.isPrimaryPath && action.available) {
      btn.classList.add("action-primary", "action-main-path");
    }

    if (action.available && ["hu", "gang", "peng", "chi"].includes(actionId)) {
      const li = document.createElement("li");
      li.textContent = `${action.label}：${action.reasonText}`;
      availableReasonList.appendChild(li);
    }
  });

  if (scope === "response") {
    actionStageSummary.textContent = "响应阶段：优先主响应与“过”，其余动作可展开查看。";
  } else if (scope === "turn") {
    actionStageSummary.textContent = "出牌阶段：先选牌，再执行出牌/确认。";
  } else {
    actionStageSummary.textContent = "当前不可操作：请等待系统推进到可行动阶段。";
  }

  const canShowMoreToggle = scope !== "none" && hasSecondaryActions;
  toggleMoreBtn.classList.toggle("hidden-by-phase", !canShowMoreToggle);
  toggleMoreBtn.disabled = appState.submitting || lockAllActions;
  toggleMoreBtn.textContent = appState.showMoreActions ? "收起次要动作" : "更多动作";

  if (!availableReasonList.childElementCount) {
    const li = document.createElement("li");
    li.textContent = "当前无可响应动作";
    availableReasonList.appendChild(li);
  }

  const phaseHint = scope === "response" ? "当前为响应阶段，仅显示响应动作。" : scope === "turn" ? "当前为出牌阶段，仅显示出牌动作。" : "当前不可操作。";
  const disabledReasonText = `${phaseHint} ${disabledReasons.join("；") || "当前无禁用动作"}`;
  document.getElementById("disabledActionReason").textContent = disabledReasonText;
  document.getElementById("mobileDisabledActionReason").textContent = disabledReasonText;
  document.getElementById("actionExplainStageText").textContent = actionStageSummary.textContent;
  document.getElementById("mobileAvailableActionTitle").textContent = document.getElementById("availableActionTitle").textContent;
  const mobileList = document.getElementById("mobileAvailableActionReasons");
  mobileList.innerHTML = availableReasonList.innerHTML;
  document.getElementById("actionReason").textContent = appState.selectedTileIndex === null ? model.latestEvent.responseHint : `已选中：${model.selfHand[appState.selectedTileIndex]}`;
}

function renderTimeline(model) {
  const eventList = document.getElementById("eventTimeline");
  const scoreList = document.getElementById("scoreDeltaTimeline");
  eventList.innerHTML = "";
  scoreList.innerHTML = "";

  model.eventTimeline.slice(0, 8).forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.ts || nowTag()} ${entry.text}`;
    eventList.appendChild(li);
  });

  model.scoreDeltaTimeline.forEach((entry) => {
    const li = document.createElement("li");
    li.innerHTML = `${entry.text} <span class="${entry.trend === "down" ? "score-down" : "score-up"}">${entry.delta}</span>`;
    scoreList.appendChild(li);
  });

  const bridge = model.scoreDeltaTimeline[0];
  document.getElementById("scoreBridge").textContent = bridge ? `本手变化：${bridge.text}（${bridge.delta}） -> 结算见弹窗` : "本手过程变化暂无";
}

function renderDiagnostics(model) {
  document.getElementById("diagnosticsOutput").textContent = JSON.stringify(
    {
      roundId: model.gameId,
      phase: model.phase,
      currentPlayer: model.currentPlayerId,
      wallCount: model.wallCount,
      latestEvent: model.latestEvent,
      globalError: model.globalError,
      inlineError: appState.inlineError,
    },
    null,
    2
  );
}

function renderResult(model) {
  const summary = model.resultSummary;
  if (!summary) return;
  document.getElementById("resultTitle").textContent = summary.title;
  document.getElementById("resultReason").textContent = summary.reason;
  const tbody = document.getElementById("resultTableBody");
  tbody.innerHTML = "";
  summary.rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.player}</td><td>${row.delta}</td><td>${row.total}</td><td>${row.role}</td><td>${row.reason}</td>`;
    tbody.appendChild(tr);
  });

  const diag = document.getElementById("resultDiag");
  if (summary.type === "abort") {
    diag.classList.remove("hidden");
    diag.textContent = "异常终止：请通过诊断入口查看错误上下文并重试同步。";
  } else {
    diag.classList.add("hidden");
    diag.textContent = "";
  }
}

function renderReplay(model) {
  const list = document.getElementById("replayTimeline");
  const detail = document.getElementById("replayStateDetail");
  list.innerHTML = "";
  const timeline = (model.replay && model.replay.timeline) || [];
  timeline.forEach((entry, idx) => {
    const li = document.createElement("li");
    li.textContent = `${entry.ts} ${entry.text}`;
    if (entry.marker) li.classList.add("key");
    li.addEventListener("click", () => {
      detail.textContent = JSON.stringify(entry.seatSummary, null, 2);
    });
    if (idx === 0) {
      detail.textContent = JSON.stringify(entry.seatSummary, null, 2);
    }
    list.appendChild(li);
  });
}

function rerender() {
  renderRoute();
  renderLobby();
  if (appState.route !== "table") return;
  const model = getCurrentViewModel();
  setGlobalSyncError(model.globalError);
  setInlineError(appState.inlineError);
  renderStatus(model);
  renderFeedback(model);
  renderSeats(model);
  renderRiver(model);
  renderHand(model);
  renderActionBar(model);
  renderTimeline(model);
  renderDiagnostics(model);
  renderResult(model);
  renderReplay(model);
  const secondary = document.getElementById("secondaryContext");
  secondary.classList.toggle("hidden", !appState.contextExpanded);
  document.getElementById("toggleContextBtn").textContent = appState.contextExpanded ? "收起局势细节" : "展开局势细节";
  const diagnosticsContent = document.getElementById("diagnosticsContent");
  diagnosticsContent.classList.toggle("hidden", !appState.diagnosticsExpanded);
  document.getElementById("toggleDiagnosticsBtn").textContent = appState.diagnosticsExpanded ? "收起诊断内容" : "展开诊断内容";
  document.getElementById("eventsPanelBody").classList.toggle("hidden", appState.sideTab !== "events");
  document.getElementById("scoresPanelBody").classList.toggle("hidden", appState.sideTab !== "scores");
  document.getElementById("tabEvents").classList.toggle("is-active", appState.sideTab === "events");
  document.getElementById("tabScores").classList.toggle("is-active", appState.sideTab === "scores");
  document.getElementById("disabledReasonPanel").classList.toggle("hidden", !appState.disabledReasonExpanded);
  document.getElementById("toggleDisabledReasonBtn").textContent = appState.disabledReasonExpanded ? "收起不可用说明" : "为什么不能做？";
  document.getElementById("actionExplainDrawer").classList.toggle("hidden", !appState.actionExplainDrawerOpen);
}

function withTableUpdate(nextSnapshotPartial) {
  appState.tableSnapshot = { ...appState.tableSnapshot, ...nextSnapshotPartial };
  rerender();
}

function makeRecoverableError(message) {
  return {
    recoverable: true,
    retryAction: "retry_last_action",
    message,
    diagnosticContext: { at: nowTag(), lastAction: appState.selectedActionId },
  };
}

async function defaultGameCreationHandler() {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    ok: true,
    tableSnapshot: {
      ...createDefaultTableSnapshot(),
      phase: "player_turn",
      turnHint: "轮到你出牌",
      eventTimeline: [{ id: "g0", ts: nowTag(), text: "对局创建成功，进入牌桌", marker: "start", seatSummary: { south: { score: 100 } } }],
      replay: {
        timeline: [
          { id: "r0", ts: nowTag(), text: "开局发牌", marker: "start", seatSummary: { south: { score: 100, handCount: 14 }, north: { score: 100 }, west: { score: 100 }, east: { score: 100 } } },
        ],
      },
    },
  };
}

async function defaultActionHandler({ actionId, model }) {
  await new Promise((resolve) => setTimeout(resolve, 420));
  const next = structuredClone(model);
  const ts = nowTag();

  const addEvent = (text, marker, scoreDelta, seatSummary) => {
    next.eventTimeline.unshift({ id: `e-${Date.now()}`, ts, text, marker, scoreDelta, seatSummary });
    next.replay.timeline.unshift({ id: `r-${Date.now()}`, ts, text, marker, seatSummary: seatSummary || {} });
  };

  if (actionId === "cancel") {
    addEvent("你 取消当前选择", "", "", { south: { selected: false } });
    next.phase = "player_turn";
    return { ok: true, nextModel: next };
  }

  if (actionId === "confirm") {
    addEvent("你 确认本次动作", "", "", { south: { confirmed: true } });
    return { ok: true, nextModel: next };
  }

  if (actionId === "pass") {
    addEvent("你 选择过，放弃本次响应", "first_response", "", { south: { action: "pass" } });
    next.phase = "waiting_ai";
    next.turnHint = "等待 AI 出牌";
    next.availableActions = next.availableActions.map((a) => ({ ...a, available: false }));
    return { ok: true, nextModel: next };
  }

  if (actionId === "peng") {
    addEvent("你 碰了 AI-北 的 三万", "first_response", "+1", { south: { action: "peng", score: 113 } });
    next.scoreDeltaTimeline.unshift({ text: "你 碰牌得势", delta: "+1", trend: "up" });
    next.phase = "waiting_ai";
    next.turnHint = "你已碰，等待 AI-西";
    return { ok: true, nextModel: next };
  }

  if (actionId === "discard") {
    if (appState.selectedTileIndex === null) {
      return { ok: false, error: makeRecoverableError("请先选择一张手牌再出牌") };
    }
    const tile = next.selfHand[appState.selectedTileIndex];
    next.selfHand.splice(appState.selectedTileIndex, 1);
    next.discardRiver.south = [...next.discardRiver.south, tile];
    addEvent(`你 打出 ${tile}`, "", "", { south: { action: "discard", tile } });
    next.phase = "waiting_ai";
    next.turnHint = "出牌完成，等待 AI";
    return { ok: true, nextModel: next };
  }

  if (actionId === "gang") {
    addEvent("你 杠牌成功，摸补牌", "", "+4", { south: { action: "gang", score: 116 } });
    next.scoreDeltaTimeline.unshift({ text: "你 杠牌加分", delta: "+4", trend: "up" });
    next.phase = "player_turn";
    next.turnHint = "杠后继续出牌";
    return { ok: true, nextModel: next };
  }

  if (actionId === "chi") {
    return { ok: false, error: makeRecoverableError("当前不是上家弃牌，不能吃") };
  }

  if (actionId === "hu") {
    addEvent("你 自摸胡牌", "hu", "+24", { south: { action: "hu", score: 124 } });
    next.phase = "ended";
    next.resultSummary = createResultSummary("tsumo");
    return { ok: true, nextModel: next, openResult: true };
  }

  return { ok: false, error: makeRecoverableError(`未支持动作：${actionId}`) };
}

async function createGame() {
  appState.phase = "creating_game";
  appState.inlineError = null;
  rerender();
  const handler = appState.gameCreationHandler || defaultGameCreationHandler;

  try {
    const result = await handler({ lobby: appState.lobby });
    if (!result.ok) throw new Error(result.message || "创建失败");
    appState.route = "table";
    appState.phase = "table_loading";
    rerender();
    await new Promise((resolve) => setTimeout(resolve, 350));

    appState.tableSnapshot = result.tableSnapshot;
    appState.phase = "table";
    appState.lobby.recentGames = [{ id: appState.tableSnapshot.gameId, result: "进行中" }];
    appState.selectedTileIndex = null;
    appState.inlineError = null;
    rerender();
  } catch (err) {
    appState.phase = "lobby_error";
    showToast("创建对局失败", "error");
    document.getElementById("lobbyDiagOutput").textContent = JSON.stringify({ error: String(err && err.message ? err.message : err), phase: appState.phase }, null, 2);
    rerender();
  }
}

async function submitAction(actionId) {
  if (appState.phase === "table_loading" || appState.tableSnapshot.phase === "ended") {
    appState.inlineError = makeRecoverableError("本局已结束或仍在加载，当前不可提交动作");
    showToast("当前不可操作", "error");
    rerender();
    return;
  }
  appState.selectedActionId = actionId;
  appState.submitting = true;
  appState.inlineError = null;
  rerender();

  const handler = appState.actionHandler || defaultActionHandler;
  try {
    const model = getCurrentViewModel();
    const payload = {
      selectedTileIndex: appState.selectedTileIndex,
      selectedTile: appState.selectedTileIndex === null ? null : model.selfHand[appState.selectedTileIndex],
    };
    const result = await handler({ actionId, payload, model });

    if (!result.ok) {
      appState.inlineError = result.error || makeRecoverableError("操作失败");
      withTableUpdate({ diagnostics: { ...appState.tableSnapshot.diagnostics, lastError: appState.inlineError } });
      showToast(appState.inlineError.message, "error");
      return;
    }

    appState.inlineError = null;
    appState.selectedTileIndex = null;
    appState.tableSnapshot = result.nextModel;
    showToast("操作成功", "normal");

    if (result.openResult) {
      document.getElementById("resultModal").classList.remove("hidden");
    }
  } catch (err) {
    appState.inlineError = makeRecoverableError("状态同步失败，请重试");
    withTableUpdate({
      globalError: {
        recoverable: true,
        retryAction: "sync",
        message: "状态同步失败，请重试同步",
        diagnosticContext: { detail: String(err && err.message ? err.message : err) },
      },
      diagnostics: { ...appState.tableSnapshot.diagnostics, syncError: String(err && err.message ? err.message : err) },
    });
    showToast("状态同步失败", "error");
  } finally {
    appState.submitting = false;
    rerender();
  }
}

function bindEvents() {
  document.getElementById("startGameBtn").addEventListener("click", createGame);
  document.getElementById("lobbyDiagBtn").addEventListener("click", () => {
    document.getElementById("lobbyDiagOutput").textContent = JSON.stringify({ lobby: appState.lobby, phase: appState.phase }, null, 2);
  });

  document.querySelectorAll("[data-action-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      submitAction(btn.getAttribute("data-action-id"));
    });
  });

  document.getElementById("openSnapshot").addEventListener("click", () => {
    appState.diagnosticsExpanded = true;
    document.getElementById("diagnosticsOutput").textContent = JSON.stringify(getCurrentViewModel(), null, 2);
    rerender();
  });
  document.getElementById("toggleContextBtn").addEventListener("click", () => {
    appState.contextExpanded = !appState.contextExpanded;
    rerender();
  });
  document.getElementById("toggleDiagnosticsBtn").addEventListener("click", () => {
    appState.diagnosticsExpanded = !appState.diagnosticsExpanded;
    rerender();
  });
  document.getElementById("tabEvents").addEventListener("click", () => {
    appState.sideTab = "events";
    rerender();
  });
  document.getElementById("tabScores").addEventListener("click", () => {
    appState.sideTab = "scores";
    rerender();
  });
  document.getElementById("toggleMoreActionsBtn").addEventListener("click", () => {
    if (appState.submitting || appState.phase === "table_loading") return;
    appState.showMoreActions = !appState.showMoreActions;
    rerender();
  });
  document.getElementById("toggleDisabledReasonBtn").addEventListener("click", () => {
    appState.disabledReasonExpanded = !appState.disabledReasonExpanded;
    rerender();
  });
  document.getElementById("openActionExplainDrawerBtn").addEventListener("click", () => {
    appState.actionExplainDrawerOpen = true;
    rerender();
  });
  document.getElementById("closeActionExplainDrawerBtn").addEventListener("click", () => {
    appState.actionExplainDrawerOpen = false;
    rerender();
  });
  document.getElementById("actionExplainDrawer").addEventListener("click", (event) => {
    if (event.target.id !== "actionExplainDrawer") return;
    appState.actionExplainDrawerOpen = false;
    rerender();
  });

  document.getElementById("copyLogs").addEventListener("click", async () => {
    const text = getCurrentViewModel().eventTimeline.map((e) => `${e.ts || ""} ${e.text}`).join("\n");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
      showToast("日志已复制", "normal");
      document.getElementById("diagnosticsOutput").textContent = text;
    } catch (_err) {
      document.getElementById("diagnosticsOutput").textContent = text;
      showToast("复制失败，请手动复制", "error");
    }
  });

  document.getElementById("globalRetryBtn").addEventListener("click", () => {
    withTableUpdate({ globalError: null });
    showToast("已重试同步", "normal");
  });
  document.getElementById("globalDiagBtn").addEventListener("click", () => {
    appState.diagnosticsExpanded = true;
    document.getElementById("diagnosticsOutput").textContent = JSON.stringify(getCurrentViewModel().globalError, null, 2);
    rerender();
  });

  const resultModal = document.getElementById("resultModal");
  const replayModal = document.getElementById("replayModal");
  document.getElementById("openResult").addEventListener("click", () => resultModal.classList.remove("hidden"));
  document.getElementById("closeResult").addEventListener("click", () => resultModal.classList.add("hidden"));
  document.getElementById("openReplay").addEventListener("click", () => replayModal.classList.remove("hidden"));
  document.getElementById("closeReplay").addEventListener("click", () => replayModal.classList.add("hidden"));

  document.getElementById("backLobbyBtn").addEventListener("click", () => {
    resultModal.classList.add("hidden");
    appState.route = "lobby";
    appState.phase = "lobby_idle";
    rerender();
  });

  document.getElementById("restartBtn").addEventListener("click", async () => {
    resultModal.classList.add("hidden");
    await createGame();
  });

  resultModal.addEventListener("click", (event) => {
    if (event.target === resultModal) resultModal.classList.add("hidden");
  });
  replayModal.addEventListener("click", (event) => {
    if (event.target === replayModal) replayModal.classList.add("hidden");
  });
}

function startCountdown() {
  if (appState.countdownTimer) clearInterval(appState.countdownTimer);
  appState.countdownTimer = setInterval(() => {
    if (appState.route !== "table") return;
    if (appState.tableSnapshot.phase !== "response_window") return;
    const rc = appState.tableSnapshot.responseContext;
    if (!rc || !Number.isFinite(rc.remainingMs)) return;
    appState.tableSnapshot.responseContext.remainingMs = Math.max(0, rc.remainingMs - 200);
    rerender();
  }, 200);
}

window.updateMajiangTableViewModel = function updateMajiangTableViewModel(nextModel) {
  appState.tableSnapshot = { ...appState.tableSnapshot, ...nextModel };
  appState.route = "table";
  appState.phase = "table";
  rerender();
};

window.setMajiangActionHandler = function setMajiangActionHandler(handler) {
  appState.actionHandler = handler;
};
window.setMajiangGameCreationHandler = function setMajiangGameCreationHandler(handler) {
  appState.gameCreationHandler = handler;
};

window.majiangNextModelExample = {
  ...createDefaultTableSnapshot(),
  phase: "response_window",
  roundInfo: "东二局",
  wallCount: 44,
  latestEvent: { actor: "AI-东", verb: "打出", tile: "六筒", target: "你", responseHint: "你可碰：你已有两张六筒" },
  responseContext: { sourcePlayerId: "east", tile: "六筒", highlightedRiverSeatId: "east", remainingMs: 4800 },
  seats: [
    { id: "north", name: "AI-北", score: 92, handCount: 12, meldGroups: [{ type: "chi", tiles: ["四万", "五万", "六万"] }], latestAction: "等待中" },
    { id: "west", name: "AI-西", score: 90, handCount: 13, meldGroups: [], latestAction: "等待中" },
    { id: "east", name: "AI-东", score: 106, handCount: 12, meldGroups: [{ type: "peng", tiles: ["六筒", "六筒", "六筒"] }], latestAction: "打出 六筒" },
    { id: "south", name: "你", score: 112, handCount: 14, meldGroups: [{ type: "gang", tiles: ["东", "东", "东", "东"] }], latestAction: "可响应" },
  ],
  availableActions: [
    { id: "hu", label: "胡", available: false, reasonText: "当前牌型不满足可胡条件" },
    { id: "gang", label: "杠", available: false, reasonText: "当前无可杠牌组" },
    { id: "peng", label: "碰", available: true, reasonText: "你已有两张六筒", isPrimaryPath: true },
    { id: "chi", label: "吃", available: false, reasonText: "本次不是上家弃牌，不能吃" },
    { id: "pass", label: "过", available: true, reasonText: "放弃本次响应" },
    { id: "discard", label: "出牌", available: true, reasonText: "可出牌" },
    { id: "confirm", label: "确认", available: true, reasonText: "确认当前选择" },
    { id: "cancel", label: "取消", available: true, reasonText: "取消当前选择" },
  ],
  replay: {
    timeline: [
      {
        id: "k1",
        ts: "T-12s",
        text: "首次响应窗口开启",
        marker: "first_response",
        seatSummary: {
          north: { score: 92, handCount: 12, latestAction: "打出 六筒" },
          west: { score: 90, handCount: 13, latestAction: "等待中" },
          east: { score: 106, handCount: 12, latestAction: "可被响应" },
          south: { score: 112, handCount: 14, latestAction: "可响应" },
        },
      },
      {
        id: "k2",
        ts: "T-2s",
        text: "出现错误并恢复",
        marker: "error",
        seatSummary: {
          north: { score: 92, handCount: 12, latestAction: "等待中" },
          west: { score: 90, handCount: 13, latestAction: "等待中" },
          east: { score: 106, handCount: 12, latestAction: "等待中" },
          south: { score: 112, handCount: 14, latestAction: "重试中" },
          system: { error: "recoverable" },
        },
      },
      {
        id: "k3",
        ts: "T+0s",
        text: "胡牌结算",
        marker: "hu",
        seatSummary: {
          north: { score: 84, handCount: 12, latestAction: "支付" },
          west: { score: 82, handCount: 13, latestAction: "支付" },
          east: { score: 98, handCount: 12, latestAction: "支付" },
          south: { score: 124, handCount: 13, latestAction: "胡牌" },
        },
      },
    ],
  },
};

window.majiangWinningModelExample = {
  ...window.majiangNextModelExample,
  latestEvent: { actor: "AI-北", verb: "打出", tile: "五万", target: "你", responseHint: "可胡：满足平胡，预计 +16" },
  availableActions: [
    { id: "hu", label: "胡", available: true, reasonText: "满足平胡，可胡", isPrimaryPath: true },
    { id: "gang", label: "杠", available: false, reasonText: "当前无可杠牌组" },
    { id: "peng", label: "碰", available: true, reasonText: "你有两张五万" },
    { id: "chi", label: "吃", available: false, reasonText: "本次不是上家弃牌，不能吃" },
    { id: "pass", label: "过", available: true, reasonText: "放弃响应" },
    { id: "discard", label: "出牌", available: true, reasonText: "可出牌" },
    { id: "confirm", label: "确认", available: true, reasonText: "确认选择" },
    { id: "cancel", label: "取消", available: true, reasonText: "取消选择" },
  ],
};

window.majiangResultExamples = {
  tsumo: createResultSummary("tsumo"),
  ron: createResultSummary("ron"),
  draw: createResultSummary("draw"),
  abort: createResultSummary("abort"),
};

window.showMajiangResultExample = function showMajiangResultExample(type) {
  const key = type || "tsumo";
  const summary = window.majiangResultExamples[key] || window.majiangResultExamples.tsumo;
  appState.tableSnapshot = { ...appState.tableSnapshot, phase: "ended", resultSummary: summary };
  if (key === "abort") {
    appState.tableSnapshot.globalError = {
      recoverable: true,
      retryAction: "sync",
      message: "状态同步失败，本局异常终止",
      diagnosticContext: { source: "showMajiangResultExample", type: "abort" },
    };
  }
  appState.route = "table";
  appState.phase = "table";
  rerender();
  document.getElementById("resultModal").classList.remove("hidden");
};

window.majiangGameCreationFailureExample = async function majiangGameCreationFailureExample() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  throw new Error("模拟创建失败：服务暂不可用");
};

window.majiangSyncFailureActionHandlerExample = async function majiangSyncFailureActionHandlerExample() {
  throw new Error("模拟同步失败：网络中断");
};

window.triggerMajiangGlobalSyncErrorExample = function triggerMajiangGlobalSyncErrorExample() {
  appState.tableSnapshot = {
    ...appState.tableSnapshot,
    globalError: {
      recoverable: true,
      retryAction: "sync",
      message: "模拟同步失败：请点击重试或查看诊断",
      diagnosticContext: { source: "triggerMajiangGlobalSyncErrorExample", at: nowTag() },
    },
    diagnostics: {
      ...appState.tableSnapshot.diagnostics,
      syncError: "模拟同步失败：网络中断",
    },
  };
  appState.route = "table";
  appState.phase = "table";
  rerender();
};

window.majiangActionHandlerExample = async function majiangActionHandlerExample({ actionId, payload, model }) {
  if (actionId === "hu") {
    const next = structuredClone(model);
    next.phase = "ended";
    next.resultSummary = createResultSummary("ron");
    next.eventTimeline.unshift({ id: `ext-${Date.now()}`, ts: nowTag(), text: "外部 handler：荣和结算", marker: "hu", seatSummary: { east: { score: 120 } } });
    return { ok: true, nextModel: next, openResult: true };
  }
  if (actionId === "pass") {
    return { ok: false, error: makeRecoverableError("外部 handler：本次过牌失败，可重试") };
  }
  return defaultActionHandler({ actionId, payload, model });
};

bindEvents();
startCountdown();
rerender();
