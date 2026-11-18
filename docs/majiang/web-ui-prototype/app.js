const { ACTION_ORDER, createTableViewModelFromSnapshot, createDefaultLobbyState, createDefaultTableSnapshot, createResultSummary } = window.MajiangViewModelAdapter;
const PAGE_PARAMS = new URLSearchParams(window.location.search);
const IS_ACCEPTANCE_MODE = PAGE_PARAMS.get("acceptance") === "1";
const TILE_SPRITE_HREF = "assets/mahjong-tiles.svg";
const USE_SVG_TILES = PAGE_PARAMS.get("svgTiles") === "1";
/** Path A：自研 PNG 图集（整牌含陶瓷壳）；?svgTiles=1 回退 SVG 印花 */
const TILE_ATLAS = {
  href: "assets/mahjong-tiles-atlas.png",
  cols: 9,
  rows: 4,
};
const TILE_ATLAS_INDEX = (() => {
  const index = {};
  const list = [
    ...Array.from({ length: 9 }, (_, i) => `face-dots-${i + 1}`),
    ...Array.from({ length: 9 }, (_, i) => `face-bamboo-${i + 1}`),
    ...Array.from({ length: 9 }, (_, i) => `face-chars-${i + 1}`),
    "face-wind-东",
    "face-wind-南",
    "face-wind-西",
    "face-wind-北",
    "face-dragon-中",
    "face-dragon-发",
    "face-dragon-白",
  ];
  list.forEach((symbol, i) => {
    index[symbol] = { col: i % TILE_ATLAS.cols, row: Math.floor(i / TILE_ATLAS.cols) };
  });
  return index;
})();
document.body.classList.toggle("acceptance-mode", IS_ACCEPTANCE_MODE);

const appState = {
  lobby: createDefaultLobbyState(),
  route: "lobby", // lobby | table
  phase: "lobby_idle", // lobby_idle | creating_game | lobby_error | table_loading | table
  tableSnapshot: createDefaultTableSnapshot(),
  selectedTileIndex: null,
  selectedActionId: null,
  submitting: false,
  inlineError: null,
  lastLobbyError: null,
  toastTimer: null,
  countdownTimer: null,
  actionHandler: null,
  gameCreationHandler: null,
  contextExpanded: false,
  diagnosticsExpanded: false,
  lobbyDiagnosticsExpanded: false,
  sideTab: "events",
  sidePanelExpanded: false,
  showMoreActions: false,
  lastActionScope: "none",
  disabledReasonExpanded: false,
  actionExplainDrawerOpen: false,
  lastLatestActionKey: "",
  lastHighlightedTile: null,
  lastFocusedElement: null,
  lastAnnouncedText: "",
  lastPhaseForA11y: "",
  debugTextTiles: false,
  pendingFocusTargetId: null,
};

function nowTag() {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function parseTileLabel(label) {
  const value = String(label || "").trim();
  const suitMatch = value.match(/^([一二三四五六七八九])([万筒条])$/);
  if (suitMatch) {
    const rankMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    return {
      raw: value,
      kind: "suit",
      rankText: suitMatch[1],
      rankValue: rankMap[suitMatch[1]],
      suit: suitMatch[2],
    };
  }
  const honorMap = {
    东: { kind: "wind", short: "东", display: "东" },
    南: { kind: "wind", short: "南", display: "南" },
    西: { kind: "wind", short: "西", display: "西" },
    北: { kind: "wind", short: "北", display: "北" },
    中: { kind: "dragon", short: "中", display: "中" },
    发: { kind: "dragon", short: "发", display: "发" },
    白: { kind: "dragon", short: "白", display: "白" },
    红中: { kind: "dragon", short: "中", display: "中" },
    白板: { kind: "dragon", short: "白", display: "白" },
  };
  if (honorMap[value]) {
    return {
      raw: value,
      kind: honorMap[value].kind,
      honorShort: honorMap[value].short,
      honorDisplay: honorMap[value].display,
    };
  }
  return { raw: value, kind: "fallback" };
}

/** 经典 3×3 印花格位（1=左上 … 9=右下），贴竞品图案主语言而非点数堆叠 */
const TILE_FACE_CELLS = {
  dots: {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
    7: [1, 3, 4, 5, 6, 7, 9],
    8: [1, 2, 3, 4, 6, 7, 8, 9],
    9: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  bamboo: {
    1: [5],
    2: [2, 8],
    3: [2, 5, 8],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
    7: [1, 3, 4, 5, 6, 7, 9],
    8: [1, 2, 3, 4, 6, 7, 8, 9],
    9: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
};

function tileSpriteSymbolId(parsed) {
  if (parsed.kind === "suit") {
    if (parsed.suit === "筒") return `face-dots-${parsed.rankValue}`;
    if (parsed.suit === "条") return `face-bamboo-${parsed.rankValue}`;
    if (parsed.suit === "万") return `face-chars-${parsed.rankValue}`;
  }
  if (parsed.kind === "wind") return `face-wind-${parsed.honorShort}`;
  if (parsed.kind === "dragon") return `face-dragon-${parsed.honorShort}`;
  return null;
}

function createTileSpriteHtml(symbolId) {
  // ponytail: 外链 sprite；file:// 下 <use> 可能失败 → 用 ?debugTiles=1 降级；升级=内联 symbol 或 data-URI
  return `<svg class="tile-sprite" viewBox="0 0 36 48" focusable="false"><use href="${TILE_SPRITE_HREF}#${symbolId}" xlink:href="${TILE_SPRITE_HREF}#${symbolId}"></use></svg>`;
}

function createTileAtlasHtml(symbolId) {
  const pos = TILE_ATLAS_INDEX[symbolId];
  if (!pos) return createTileSpriteHtml(symbolId);
  return `<span class="tile-atlas" style="--atlas-col:${pos.col};--atlas-row:${pos.row}" role="presentation"></span>`;
}

// ponytail: 布局表是硬编码；?selfcheck=1 校验 1–9 点/条数与格位数一致，升级路径=抽到独立 fixture
if (PAGE_PARAMS.has("selfcheck")) {
  Object.entries(TILE_FACE_CELLS).forEach(([kind, map]) => {
    for (let rank = 1; rank <= 9; rank += 1) {
      const cells = map[rank];
      if (!cells || cells.length !== rank) {
        throw new Error(`tile-face selfcheck failed: ${kind}/${rank}`);
      }
    }
  });
  console.info("tile-face selfcheck ok");
}

function createTileAssetNode(label, className) {
  const parsed = parseTileLabel(label);
  const node = document.createElement("span");
  node.className = className;
  node.setAttribute("data-tile-kind", parsed.kind);
  node.setAttribute("aria-hidden", "true");
  const symbolId = tileSpriteSymbolId(parsed);
  if (symbolId) {
    if (parsed.kind === "suit") {
      node.setAttribute("data-tile-suit", parsed.suit);
      node.setAttribute("data-tile-rank", String(parsed.rankValue));
    } else {
      node.setAttribute("data-tile-honor", parsed.honorShort);
    }
    const useAtlas = !USE_SVG_TILES && TILE_ATLAS_INDEX[symbolId];
    node.setAttribute("data-tile-source", useAtlas ? "png-atlas" : "svg-sprite");
    node.setAttribute("data-tile-symbol", symbolId);
    node.innerHTML = useAtlas ? createTileAtlasHtml(symbolId) : createTileSpriteHtml(symbolId);
    return node;
  }
  node.setAttribute("data-tile-fallback", "true");
  node.setAttribute("data-tile-source", "text-fallback");
  node.innerHTML = `<span class="tile-asset-fallback">${parsed.raw || "?"}</span>`;
  return node;
}

function applyTileVisual(container, label, options = {}) {
  const fallback = options.forceText || appState.debugTextTiles;
  container.innerHTML = "";
  container.classList.remove("has-tile-atlas");
  if (!fallback) {
    const asset = createTileAssetNode(label, options.assetClassName || "tile-asset");
    container.appendChild(asset);
    if (asset.getAttribute("data-tile-source") === "png-atlas") {
      container.classList.add("has-tile-atlas");
    }
  }
  const text = document.createElement("span");
  text.className = fallback ? "tile-text-fallback" : "tile-text-sr";
  text.textContent = String(label || "");
  container.appendChild(text);
}

function getResponseActionLabel(model) {
  const hint = String((model && model.latestEvent && model.latestEvent.responseHint) || "");
  if (hint.includes("可胡")) return "胡";
  if (hint.includes("可杠")) return "杠";
  if (hint.includes("可碰")) return "碰";
  return "可";
}

function renderSeatActionSignal(node, seat, model) {
  if (!node) return;
  node.innerHTML = "";
  node.classList.remove("is-source-action", "is-self-response", "hidden");
  // 角区稀疏：默认不渲染多座位标签墙；仅南位响应窗口保留轻量「可胡」
  const isResponse = model.phase === "response_window";
  const selfSeatId = model.selfSeatId || "south";
  const isSelfOpportunity = isResponse && seat.id === selfSeatId;
  if (!isSelfOpportunity) {
    node.classList.add("hidden");
    return;
  }
  const badge = document.createElement("span");
  badge.className = "seat-win-badge";
  badge.textContent = getResponseActionLabel(model) === "胡" ? "可胡" : getResponseActionLabel(model);
  node.appendChild(badge);
  node.classList.add("is-self-response");
}

function getPhasePrimaryActionId(model, actionMap) {
  if (!model) return null;
  if (model.phase === "player_turn") {
    const discard = actionMap.get("discard");
    if (discard && discard.available && appState.selectedTileIndex !== null) return "discard";
    const confirm = actionMap.get("confirm");
    if (confirm && confirm.available && appState.selectedTileIndex !== null) return "confirm";
    const cancel = actionMap.get("cancel");
    if (cancel && cancel.available && appState.selectedTileIndex !== null) return "cancel";
    return "discard";
  }
  if (model.phase === "response_window") {
    const hu = actionMap.get("hu");
    if (hu && hu.available) return "hu";
    const pass = actionMap.get("pass");
    if (pass && pass.available) return "pass";
    const peng = actionMap.get("peng");
    if (peng && peng.available) return "peng";
    const gang = actionMap.get("gang");
    if (gang && gang.available) return "gang";
    return "hu";
  }
  return null;
}

function getResponseVisibleActionIds(actionMap) {
  /* W8-A 合同：胡 > 过 > 碰/杠/吃 */
  const order = ["hu", "pass", "peng", "gang", "chi"];
  return order.filter((actionId) => {
    const action = actionMap.get(actionId);
    return action && action.available;
  });
}

function showToast(message, type) {
  const node = document.getElementById("toast");
  node.textContent = message;
  node.classList.remove("hidden", "error");
  if (type === "error") node.classList.add("error");
  if (appState.toastTimer) clearTimeout(appState.toastTimer);
  appState.toastTimer = setTimeout(() => node.classList.add("hidden"), 2200);
  announceForScreenReader(message);
}

function announceForScreenReader(message) {
  if (!message || message === appState.lastAnnouncedText) return;
  appState.lastAnnouncedText = message;
  const sr = document.getElementById("screenReaderAnnouncements");
  sr.textContent = message;
}

function closeOverlay(overlayId, focusTargetId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay || overlay.classList.contains("hidden")) return false;
  overlay.classList.add("hidden");
  if (overlayId === "actionExplainDrawer") appState.actionExplainDrawerOpen = false;
  appState.suppressOverlayAutofocus = true;
  if (focusTargetId) appState.pendingFocusTargetId = focusTargetId;
  if (focusTargetId) {
    const focusTarget = document.getElementById(focusTargetId);
    if (focusTarget) focusTarget.focus();
  } else if (appState.lastFocusedElement && typeof appState.lastFocusedElement.focus === "function") {
    appState.lastFocusedElement.focus();
  }
  // 焦点恢复可能需要时间，确保在移动设备上也正确执行
  return true;
}

function hasOpenOverlay() {
  return !document.getElementById("actionExplainDrawer").classList.contains("hidden") || !document.getElementById("replayModal").classList.contains("hidden") || !document.getElementById("resultModal").classList.contains("hidden");
}

function getVisibleActionButtons() {
  return Array.from(document.querySelectorAll(".action-bar [data-action-id]")).filter((btn) => !btn.classList.contains("hidden-by-phase"));
}

function getVisibleAvailableActionButtons() {
  return getVisibleActionButtons().filter((btn) => !btn.disabled);
}

function getPrimaryActionForPhase(model) {
  const visibleAvailable = getVisibleAvailableActionButtons();
  if (!visibleAvailable.length) return null;
  const explicitPrimary = visibleAvailable.find((btn) => btn.classList.contains("action-main-path"));
  if (explicitPrimary) return explicitPrimary;
  if (model.phase === "player_turn" && appState.selectedTileIndex === null) return null;
  return visibleAvailable[0];
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
  return createTableViewModelFromSnapshot({
    ...appState.tableSnapshot,
    submitting: appState.submitting,
    recoverable:
      Boolean(appState.tableSnapshot.recoverable) ||
      Boolean(appState.inlineError && appState.inlineError.recoverable) ||
      Boolean(appState.tableSnapshot.globalError && appState.tableSnapshot.globalError.recoverable),
    retryAction:
      appState.tableSnapshot.retryAction ||
      (appState.inlineError && appState.inlineError.retryAction) ||
      (appState.tableSnapshot.globalError && appState.tableSnapshot.globalError.retryAction) ||
      null,
    diagnosticContext:
      appState.tableSnapshot.diagnosticContext ||
      (appState.inlineError && appState.inlineError.diagnosticContext) ||
      (appState.tableSnapshot.globalError && appState.tableSnapshot.globalError.diagnosticContext) ||
      null,
  });
}

function renderRoute() {
  const lobby = document.getElementById("lobbyPage");
  const table = document.getElementById("tablePage");
  lobby.classList.toggle("hidden", appState.route !== "lobby");
  table.classList.toggle("hidden", appState.route !== "table");

  const loading = document.getElementById("tableLoadingPanel");
  const lock = appState.phase === "table_loading";
  document.getElementById("tablePage").setAttribute("aria-busy", lock ? "true" : "false");
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
    errorNode.textContent = appState.lastLobbyError || "创建失败：请重试或查看诊断";
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

  const diagDetails = document.getElementById("lobbyDiagDetails");
  const diagOutput = document.getElementById("lobbyDiagOutput");
  if (diagDetails) {
    diagDetails.open = !!appState.lobbyDiagnosticsExpanded;
  }
  if (appState.lobbyDiagnosticsExpanded) {
    diagOutput.classList.remove("hidden");
    diagOutput.textContent = JSON.stringify(
      {
        phase: appState.phase,
        error: appState.lastLobbyError,
        lobby: appState.lobby,
      },
      null,
      2
    );
  } else {
    diagOutput.classList.add("hidden");
  }
}

function renderStatus(model) {
  document.getElementById("turnHint").textContent = model.turnHint;
  document.getElementById("wallCount").textContent = String(model.wallCount);
  document.getElementById("roundInfo").textContent = model.roundInfo;
  document.getElementById("centerRoundInfo").textContent = model.roundInfo;
  document.getElementById("centerWallCount").textContent = String(model.wallCount);
  document.getElementById("scoreCoreWall").textContent = String(model.wallCount);

  const latestMain = `${model.latestEvent.actor} ${model.latestEvent.verb} ${model.latestEvent.tile}`.trim();
  const latestSub = `${model.latestEvent.target}：${model.latestEvent.responseHint}`;
  const latestActionMainNode = document.getElementById("latestActionMain");
  latestActionMainNode.textContent = latestMain;
  const latestActionKey = `${model.latestEvent.actor}|${model.latestEvent.verb}|${model.latestEvent.tile}|${model.latestEvent.target}`;
  if (appState.lastLatestActionKey && latestActionKey !== appState.lastLatestActionKey) {
    latestActionMainNode.classList.remove("recent-hit");
    latestActionMainNode.classList.remove("recent-hit-strong");
    void latestActionMainNode.offsetWidth;
    const isStrong = ["胡", "自摸", "杠", "碰"].some((keyword) => latestMain.includes(keyword) || String(model.latestEvent.responseHint || "").includes(keyword));
    latestActionMainNode.classList.add(isStrong ? "recent-hit-strong" : "recent-hit");
  }
  appState.lastLatestActionKey = latestActionKey;
  document.getElementById("latestActionSub").textContent =
    model.phase === "response_window" ? "响应窗口" : latestSub;
  document.getElementById("responseLinkHint").textContent =
    model.phase === "response_window" ? `右家目标牌：${model.responseContext.tile || "未知"}，当前你可胡` : "";
  document.getElementById("stageActor").textContent = model.latestEvent.actor || "系统";
  document.getElementById("stageVerb").textContent = model.phase === "response_window" ? "打" : (model.latestEvent.verb || "等待");
  const targetTileNode = document.getElementById("responseTargetTile");
  applyTileVisual(targetTileNode, model.responseContext.tile || model.latestEvent.tile || "—", { assetClassName: "tile-asset tile-asset--target" });
  document.getElementById("stageToYou").textContent = model.phase === "response_window" ? "可胡" : model.phase === "player_turn" ? "你" : "待";
  const priorityTag = document.getElementById("stagePriorityTag");
  const stageMainPath = document.getElementById("stageMainPath");
  if (model.phase === "response_window") {
    const secondsLeft = Number.isFinite(model.responseContext.remainingMs) ? Math.ceil(model.responseContext.remainingMs / 1000) : null;
    priorityTag.textContent = "主动作：胡";
    stageMainPath.textContent = `右家打出${model.responseContext.tile || "目标牌"}，可胡${secondsLeft === null ? "" : `（剩余 ${secondsLeft}s）`}`;
  } else if (model.phase === "player_turn") {
    priorityTag.textContent = "主路径：选牌→出牌";
    stageMainPath.textContent = appState.selectedTileIndex === null ? "主路径：先选一张手牌。" : "主路径：点主动作完成出牌。";
  } else if (model.phase === "waiting_ai") {
    priorityTag.textContent = "主路径：等待";
    stageMainPath.textContent = "主路径：观察最近动作，等待系统推进。";
  } else if (model.phase === "ended") {
    priorityTag.textContent = "主路径：结算";
    stageMainPath.textContent = "主路径：查看结算与复盘解释。";
  } else {
    priorityTag.textContent = "主路径：等待";
    stageMainPath.textContent = "主路径：等待状态同步。";
  }
  const centerNode = document.querySelector(".table-center");
  centerNode.classList.toggle("is-response-window", model.phase === "response_window");
  const primaryFocus = document.getElementById("primaryFocusHint");
  if (model.phase === "response_window") {
    primaryFocus.textContent = `右家打出${model.responseContext.tile || model.latestEvent.tile || "目标牌"}，可胡`;
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
    countdown.textContent = `响应倒计时 ${(model.responseContext.remainingMs / 1000).toFixed(1)}s`;
    countdown.classList.toggle("warning", model.responseContext.remainingMs <= 5000);
  }

  const seatScoreMap = {
    north: "scoreNorth",
    east: "scoreEast",
    south: "scoreSouth",
    west: "scoreWest",
  };
  model.seats.forEach((seat) => {
    const nodeId = seatScoreMap[seat.id];
    if (!nodeId) return;
    const node = document.getElementById(nodeId);
    if (node) node.textContent = String(seat.score);
  });
}

function renderFeedback(model) {
  const feedback = document.getElementById("interactionFeedback");
  const text = document.getElementById("feedbackText");
  feedback.classList.remove("interaction-feedback--normal", "interaction-feedback--submitting", "interaction-feedback--error", "interaction-feedback--waiting");
  if (appState.phase === "table_loading") {
    feedback.classList.add("interaction-feedback--waiting");
    text.textContent = "牌桌加载中，请稍候...";
    announceForScreenReader("牌桌加载中，请稍候");
    return;
  }
  if (model.phase === "ended") {
    feedback.classList.add("interaction-feedback--waiting");
    text.textContent = "本局已结束，请查看结算/复盘";
    announceForScreenReader("本局已结束，请查看结算或复盘");
    return;
  }
  if (model.submitting) {
    feedback.classList.add("interaction-feedback--submitting");
    text.textContent = "操作提交中，请稍候...";
    announceForScreenReader("操作提交中，请稍候");
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
    announceForScreenReader("AI 思考中");
    return;
  }
  feedback.classList.add("interaction-feedback--normal");
  text.textContent = model.turnHint;
}

function renderSeats(model) {
  const sourceSeatId = model.responseContext.sourcePlayerId || "";
  const selfSeatId = model.selfSeatId || "south";
  model.seats.forEach((seat) => {
    const target = document.getElementById(`seat-${seat.id}`);
    if (!target) return;
    const isSelfSeat = seat.id === selfSeatId;
    target.querySelector(".name").textContent = seat.name;
    target.querySelector(".score").textContent = String(seat.score);
    const seatMeta = target.querySelector(".seat-meta");
    seatMeta.textContent = "";
    seatMeta.classList.add("hidden");
    const latestActionNode = target.querySelector(".seat-latest-action");
    renderSeatActionSignal(latestActionNode, seat, model);
    const windChip = target.querySelector(".seat-wind");
    if (windChip && seat.windLabel) windChip.textContent = seat.windLabel;
    target.querySelector(".seat-hand-back")?.remove();
    if (!isSelfSeat) {
      const backRow = document.createElement("div");
      backRow.className = "seat-hand-back";
      const visibleBacks = Math.max(4, Math.min(8, seat.handCount || 0));
      for (let i = 0; i < visibleBacks; i += 1) {
        const backTile = document.createElement("span");
        backTile.className = "tile-back";
        backRow.appendChild(backTile);
      }
      target.insertBefore(backRow, target.querySelector(".meld-list"));
    }
    target.classList.toggle("is-active", seat.id === model.currentPlayerId);
    target.classList.toggle("is-opportunity", isSelfSeat && model.phase === "response_window");
    target.classList.toggle("is-risk", seat.id === sourceSeatId && model.phase === "response_window");

    const meldList = target.querySelector(".meld-list");
    meldList.innerHTML = "";
    const meldGroups = Array.isArray(seat.meldGroups) ? seat.meldGroups : [];
    meldGroups.forEach((group) => {
      // 引擎快照为 string[][]；演示模型可能为 { type, tiles }[]
      const tiles = Array.isArray(group) ? group : (group && group.tiles) || [];
      const type = Array.isArray(group)
        ? tiles.length >= 4
          ? "gang"
          : "peng"
        : (group && group.type) || "peng";
      const node = document.createElement("div");
      node.className = "meld-zone";
      const tag = document.createElement("span");
      tag.className = "meld-tag";
      tag.textContent = type === "peng" ? "碰" : type === "chi" ? "吃" : "杠";
      node.appendChild(tag);
      tiles.forEach((tile) => {
        const t = document.createElement("span");
        t.className = "tile-mini";
        applyTileVisual(t, tile, { assetClassName: "tile-asset tile-asset--mini" });
        node.appendChild(t);
      });
      meldList.appendChild(node);
    });
    if (isSelfSeat) {
      meldList.classList.remove("hidden");
    } else {
      meldList.classList.toggle("hidden", meldGroups.length === 0);
    }
  });
}

function renderRiver(model) {
  ["north", "west", "east", "south"].forEach((seatId) => {
    const container = document.getElementById(`river-${seatId}`);
    const lane = container.parentElement;
    if (lane) {
      lane.classList.add("river-lane", `river-lane--${seatId}`);
    }
    container.innerHTML = "";
    (model.discardRiver[seatId] || []).forEach((tile, index) => {
      const node = document.createElement("span");
      node.className = "tile-mini";
      if (index === (model.discardRiver[seatId] || []).length - 1) {
        node.classList.add("tile-mini--latest");
      }
      if (seatId === model.responseContext.highlightedRiverSeatId && tile === model.responseContext.tile) {
        node.classList.add("tile-mini--response-target");
      }
      applyTileVisual(node, tile, { assetClassName: "tile-asset tile-asset--mini" });
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
    if (model.phase === "response_window" && tile === model.responseContext.tile) btn.classList.add("tile--response-match");
    if (appState.selectedTileIndex === idx && model.phase === "response_window") btn.classList.add("tile--response-focus");
    if (appState.selectedTileIndex === idx) btn.classList.add("selected");
    applyTileVisual(btn, tile, { assetClassName: "tile-asset tile-asset--hand" });
    btn.setAttribute("aria-label", `手牌 ${tile}${appState.selectedTileIndex === idx ? "，已选中" : ""}`);
    btn.setAttribute("aria-pressed", appState.selectedTileIndex === idx ? "true" : "false");
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

  const primaryActionId = getPhasePrimaryActionId(model, actionMap);
  const responseVisibleActionIds = scope === "response" ? getResponseVisibleActionIds(actionMap) : [];

  const shouldShowByPriority = (actionId) => {
    if (scope === "none") return false;
    if (scope === "response") {
      return responseVisibleActionIds.includes(actionId);
    }
    if (appState.showMoreActions) return true;
    if (scope === "turn") return actionId === primaryActionId;
    return true;
  };

  let hasSecondaryActions = false;
  document.getElementById("availableActionTitle").textContent = scope === "response" ? "可响应：" : scope === "turn" ? "可操作：" : "当前动作：";
  document.querySelectorAll("[data-action-id]").forEach((btn) => {
    const actionId = btn.getAttribute("data-action-id");
    const action = actionMap.get(actionId) || { label: btn.textContent, available: false, reasonText: "当前不可用" };
    btn.textContent = action.label;
    btn.classList.remove("action-primary", "action-main-path", "action-available", "action-disabled", "hidden-by-phase");
    btn.removeAttribute("data-primary");
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

    let disabled = lockAllActions || model.submitting || !action.available;
    let reasonText = action.reasonText;
    if (scope === "turn" && actionId === "discard" && appState.selectedTileIndex === null) {
      disabled = true;
      reasonText = "请先选择一张手牌再出牌";
    }
    btn.disabled = disabled;
    if (disabled) {
      btn.classList.add("action-disabled");
      disabledReasons.push(`${action.label}：${reasonText}`);
    } else {
      btn.classList.add("action-available");
    }
    if (actionId === primaryActionId) {
      btn.classList.add("action-main-path");
      btn.setAttribute("data-primary", "true");
      if (!disabled) btn.classList.add("action-primary");
    }
    if (scope === "response" && actionId !== primaryActionId && actionId !== "pass") {
      btn.classList.add("action-secondary-choice");
    }

    if (action.available && ["hu", "gang", "peng"].includes(actionId)) {
      const li = document.createElement("li");
      li.textContent = action.label;
      availableReasonList.appendChild(li);
    }
  });

  if (scope === "response") {
    const targetTile = model.responseContext.tile || model.latestEvent.tile || "目标牌";
    actionStageSummary.textContent = `右家打出${targetTile}，可胡。主动作【胡】；次动作【过】。`;
  } else if (scope === "turn") {
    const primaryLabel = (actionMap.get(primaryActionId) && actionMap.get(primaryActionId).label) || "出牌";
    actionStageSummary.textContent = `出牌阶段：主动作【${primaryLabel}】；确认/取消收进更多动作。`;
  } else {
    actionStageSummary.textContent = "当前不可操作：请等待系统推进到可行动阶段。";
  }

  const canShowMoreToggle = scope === "turn" && hasSecondaryActions;
  toggleMoreBtn.classList.toggle("hidden-by-phase", !canShowMoreToggle);
  toggleMoreBtn.disabled = model.submitting || lockAllActions;
  toggleMoreBtn.textContent = appState.showMoreActions ? "收起次要动作" : "更多动作";

  const resultButton = document.getElementById("openResult");
  resultButton.classList.remove("hidden-by-phase");

  if (!availableReasonList.childElementCount) {
    const li = document.createElement("li");
    li.textContent = scope === "response" ? "无" : scope === "turn" ? "无" : "无";
    availableReasonList.appendChild(li);
  }

  const phaseHint = scope === "response" ? "响应阶段" : scope === "turn" ? "出牌阶段" : "不可操作";
  const disabledReasonText = `${phaseHint} ${disabledReasons.join("；") || "当前无禁用动作"}`;
  document.getElementById("disabledActionReason").textContent = disabledReasonText;
  document.getElementById("mobileDisabledActionReason").textContent = disabledReasonText;
  document.getElementById("actionExplainStageText").textContent = actionStageSummary.textContent;
  document.getElementById("mobileAvailableActionTitle").textContent = document.getElementById("availableActionTitle").textContent;
  const mobileList = document.getElementById("mobileAvailableActionReasons");
  mobileList.innerHTML = availableReasonList.innerHTML;
  // 响应窗让胶囊动作条自解释；出牌阶段仅在已选牌时显示，避免「等待操作」类 Web 副文案抢视线
  const actionReason = document.getElementById("actionReason");
  if (model.phase === "response_window") {
    actionReason.textContent = "";
  } else if (appState.selectedTileIndex !== null) {
    actionReason.textContent = `已选：${model.selfHand[appState.selectedTileIndex]}`;
  } else {
    actionReason.textContent = "";
  }
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
  const sidePanelPeek = document.getElementById("sidePanelPeek");
  if (sidePanelPeek) {
    const latest = model.eventTimeline[0];
    sidePanelPeek.textContent = latest ? `最近事件：${latest.text}` : "最近事件：暂无";
  }

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
      submitting: model.submitting,
      recoverable: model.recoverable,
      retryAction: model.retryAction,
      diagnosticContext: model.diagnosticContext,
    },
    null,
    2
  );
}

function renderResult(model) {
  const summary = model.resultSummary;
  if (!summary) return;
  // hero 已承载类型语气；此处用分区标签，避免标题叠字
  document.getElementById("resultTitle").textContent = "分数变化与角色";
  document.getElementById("resultReason").textContent = summary.reason;
  const hero = document.getElementById("resultHero");
  const badge = document.getElementById("resultTypeBadge");
  const headline = document.getElementById("resultHeadline");
  const subline = document.getElementById("resultSubline");
  const roleChips = document.getElementById("resultRoleChips");
  hero.classList.remove("is-tsumo", "is-ron", "is-draw", "is-abort");
  const typeClass = summary.type === "ron" ? "is-ron" : summary.type === "draw" ? "is-draw" : summary.type === "abort" ? "is-abort" : "is-tsumo";
  hero.classList.add(typeClass);
  badge.textContent = summary.type === "ron" ? "点炮胡" : summary.type === "draw" ? "流局" : summary.type === "abort" ? "异常终止" : "自摸";
  headline.textContent = summary.title;
  const winnerRow = summary.rows[0];
  const payerRows = summary.rows.filter((row) => row.delta.startsWith("-"));
  const payers = payerRows.map((row) => row.player).join("、");
  const discarderRow = summary.rows.find((row) => row.role === "点炮方");
  const bystanderRows = summary.rows.filter((row) => row.role === "旁家");
  if (summary.type === "draw") {
    subline.textContent = `${summary.reason} · 各家分数见下表（本例微调为 0）。`;
  } else if (summary.type === "abort") {
    subline.textContent = "本局不计分 · 建议「再来一局」或「回到大厅」后重开。";
  } else if (summary.type === "ron") {
    subline.textContent = `赢家：${winnerRow.player} · 放炮：${discarderRow?.player || "未知"} · 旁家：${bystanderRows.map((r) => r.player).join("、") || "无"}`;
  } else {
    subline.textContent = `赢家：${winnerRow.player} · 三家共同支付：${payers || "无"}`;
  }
  roleChips.innerHTML = "";
  const addChip = (text, className) => {
    const chip = document.createElement("span");
    chip.className = className ? `result-role-chip ${className}` : "result-role-chip";
    chip.textContent = text;
    roleChips.appendChild(chip);
  };
  if (summary.type === "abort") {
    addChip("异常终止", "abort");
    addChip("本局不计分", "abort");
    addChip("建议重开", "abort");
  } else if (summary.type === "draw") {
    addChip("流局：无人胡牌");
    summary.rows.forEach((row) => addChip(`${row.player} ${row.delta}`));
  } else {
    addChip(`赢家：${winnerRow.player}`, "winner");
    if (summary.type === "ron") {
      addChip(`放炮：${discarderRow ? discarderRow.player : "未知"}`, "discarder");
      bystanderRows.forEach((row) => addChip(`旁家：${row.player}`));
    } else {
      payerRows.forEach((row) => addChip(`支付：${row.player}`, "payer"));
    }
  }
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
    diag.textContent = "终止原因：状态同步失败 · 本局是否计分：否 · 重开建议：点「再来一局」或「回到大厅」，并经诊断入口查看上下文。";
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

function renderResponseBeam(model) {
  // R2：禁止大斜向箭头/光柱教学层；链路改由目标牌光效 + 中心盘右缘脉冲表达
  const beam = document.getElementById("responseBeam");
  if (beam) beam.classList.add("hidden");
}

function renderResponseCallout(model) {
  // R2：禁止「右家打出」气泡/说明条
  const callout = document.getElementById("responseCallout");
  if (callout) callout.classList.add("hidden");
}

function rerender() {
  renderRoute();
  renderLobby();
  if (appState.route !== "table") return;
  const model = getCurrentViewModel();
  const tablePage = document.getElementById("tablePage");
  tablePage.classList.toggle("is-response-window", model.phase === "response_window");
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
  renderResponseBeam(model);
  renderResponseCallout(model);
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
  const sidePanel = document.getElementById("sidePanel");
  sidePanel.classList.toggle("side-panel--collapsed", !appState.sidePanelExpanded);
  document.getElementById("sidePanelBody").classList.toggle("hidden", !appState.sidePanelExpanded);
  document.getElementById("sidePanelPeek").classList.toggle("hidden", appState.sidePanelExpanded);
  document.getElementById("toggleSidePanelBtn").textContent = appState.sidePanelExpanded ? "收起" : "展开";
  document.getElementById("disabledReasonPanel").classList.toggle("hidden", !appState.disabledReasonExpanded);
  document.getElementById("toggleDisabledReasonBtn").textContent = appState.disabledReasonExpanded ? "收起不可用说明" : "为什么不能做？";
  document.getElementById("actionExplainDrawer").classList.toggle("hidden", !appState.actionExplainDrawerOpen);
  document.getElementById("openActionExplainDrawerBtn").classList.toggle("hidden", window.innerWidth > 820);
  if (appState.lastPhaseForA11y !== model.phase) {
    appState.lastPhaseForA11y = model.phase;
    announceForScreenReader(`轮次状态更新：${model.phase}`);
  }
  if (appState.suppressOverlayAutofocus) {
    appState.suppressOverlayAutofocus = false;
  } else {
    if (!document.getElementById("resultModal").classList.contains("hidden")) {
      document.querySelector("#resultModal .modal-content").focus();
    }
    if (!document.getElementById("replayModal").classList.contains("hidden")) {
      document.querySelector("#replayModal .modal-content").focus();
    }
    if (!document.getElementById("actionExplainDrawer").classList.contains("hidden")) {
      document.querySelector("#actionExplainDrawer .action-explain-sheet").focus();
    }
  }
  if (appState.pendingFocusTargetId) {
    const node = document.getElementById(appState.pendingFocusTargetId);
    if (node) node.focus();
    appState.pendingFocusTargetId = null;
  }
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
  const base = createDefaultTableSnapshot();
  return {
    ok: true,
    tableSnapshot: {
      ...base,
      phase: "player_turn",
      turnHint: "轮到你出牌",
      availableActions: (base.availableActions || []).map((action) => {
        if (["discard", "confirm", "cancel"].includes(action.id)) {
          return { ...action, available: true };
        }
        if (["hu", "gang", "peng", "pass"].includes(action.id)) {
          return { ...action, available: false };
        }
        return action;
      }),
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
  appState.lastLobbyError = null;
  rerender();
  const handler = appState.gameCreationHandler || defaultGameCreationHandler;

  try {
    // 先在大厅等 API 结果，避免未就绪时渲染默认演示快照导致误操作
    const result = await handler({ lobby: appState.lobby });
    if (!result.ok) throw new Error(result.message || "创建失败");

    appState.route = "table";
    appState.tableSnapshot = result.tableSnapshot;
    appState.phase = "table";
    appState.lobby.recentGames = [{ id: appState.tableSnapshot.gameId, result: "进行中" }];
    appState.selectedTileIndex = null;
    appState.inlineError = null;
    appState.lastLobbyError = null;
    rerender();
  } catch (err) {
    appState.phase = "lobby_error";
    appState.route = "lobby";
    appState.lobbyDiagnosticsExpanded = true;
    appState.lastLobbyError = String(err && err.message ? err.message : err);
    showToast("创建对局失败", "error");
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
  const lobbyDiagDetails = document.getElementById("lobbyDiagDetails");
  if (lobbyDiagDetails) {
    lobbyDiagDetails.addEventListener("toggle", () => {
      appState.lobbyDiagnosticsExpanded = lobbyDiagDetails.open;
      if (!lobbyDiagDetails.open) {
        document.getElementById("lobbyDiagOutput").classList.add("hidden");
      }
      rerender();
    });
  }
  document.getElementById("lobbyDiagBtn").addEventListener("click", () => {
    appState.lobbyDiagnosticsExpanded = true;
    const out = document.getElementById("lobbyDiagOutput");
    out.classList.remove("hidden");
    out.textContent = JSON.stringify({ lobby: appState.lobby, phase: appState.phase }, null, 2);
    if (lobbyDiagDetails) lobbyDiagDetails.open = true;
    rerender();
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
  document.getElementById("toggleSidePanelBtn").addEventListener("click", () => {
    appState.sidePanelExpanded = !appState.sidePanelExpanded;
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
    appState.lastFocusedElement = document.activeElement;
    appState.actionExplainDrawerOpen = true;
    rerender();
  });
  document.getElementById("closeActionExplainDrawerBtn").addEventListener("click", () => {
    closeOverlay("actionExplainDrawer", "openActionExplainDrawerBtn");
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
  document.getElementById("openResult").addEventListener("click", () => {
    appState.lastFocusedElement = document.activeElement;
    resultModal.classList.remove("hidden");
    rerender();
  });
  document.getElementById("closeResult").addEventListener("click", () => {
    closeOverlay("resultModal", "openResult");
    rerender();
  });
  document.getElementById("openReplay").addEventListener("click", () => {
    appState.lastFocusedElement = document.activeElement;
    replayModal.classList.remove("hidden");
    rerender();
  });
  document.getElementById("closeReplay").addEventListener("click", () => {
    closeOverlay("replayModal", "openReplay");
    rerender();
  });

  document.getElementById("backLobbyBtn").addEventListener("click", () => {
    closeOverlay("resultModal", "startGameBtn");
    appState.route = "lobby";
    appState.phase = "lobby_idle";
    rerender();
  });

  document.getElementById("restartBtn").addEventListener("click", async () => {
    closeOverlay("resultModal", "startGameBtn");
    await createGame();
  });

  resultModal.addEventListener("click", (event) => {
    if (event.target === resultModal) {
      closeOverlay("resultModal", "openResult");
      rerender();
    }
  });
  replayModal.addEventListener("click", (event) => {
    if (event.target === replayModal) {
      closeOverlay("replayModal", "openReplay");
      rerender();
    }
  });

  const handleKeyboardShortcut = (event) => {
    const model = getCurrentViewModel();
    if (event.key === "Escape") {
      const closed =
        closeOverlay("actionExplainDrawer", "openActionExplainDrawerBtn") ||
        closeOverlay("replayModal", "openReplay") ||
        closeOverlay("resultModal", "openResult");
      if (closed) {
        event.preventDefault();
        rerender();
        return;
      }
      if (appState.selectedTileIndex !== null) {
        appState.selectedTileIndex = null;
        announceForScreenReader("已取消当前选牌");
        event.preventDefault();
        rerender();
        return;
      }
      if (appState.showMoreActions || appState.disabledReasonExpanded || appState.contextExpanded) {
        appState.showMoreActions = false;
        appState.disabledReasonExpanded = false;
        appState.contextExpanded = false;
        announceForScreenReader("已收起二级说明");
        event.preventDefault();
        rerender();
      }
      return;
    }

    if (hasOpenOverlay() || appState.route !== "table" || appState.phase === "table_loading" || model.phase === "ended") return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      if (!model.selfHand.length) return;
      const step = event.key === "ArrowRight" ? 1 : -1;
      const currentIndex = appState.selectedTileIndex === null ? (step > 0 ? -1 : 0) : appState.selectedTileIndex;
      const nextIndex = (currentIndex + step + model.selfHand.length) % model.selfHand.length;
      appState.selectedTileIndex = nextIndex;
      announceForScreenReader(`已选中手牌 ${model.selfHand[nextIndex]}`);
      event.preventDefault();
      rerender();
      return;
    }

    if (event.key === "Enter") {
      const primaryBtn = getPrimaryActionForPhase(model);
      if (!primaryBtn) {
        announceForScreenReader("当前阶段没有可执行主动作");
        return;
      }
      primaryBtn.click();
      event.preventDefault();
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      const index = Number(event.key) - 1;
      const visibleButtons = getVisibleActionButtons();
      const target = visibleButtons[index];
      if (!target) return;
      if (target.disabled) {
        announceForScreenReader(`${target.textContent} 当前不可用`);
        event.preventDefault();
        return;
      }
      target.click();
      event.preventDefault();
    }
  };

  // Bind on both document and window (capture phase) to reduce focus-dependent misses in modal/overlay contexts.
  document.addEventListener("keydown", handleKeyboardShortcut, true);
  window.addEventListener("keydown", handleKeyboardShortcut, true);
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
  roundInfo: "东风局",
  wallCount: 36,
  latestEvent: { actor: "玩家4", verb: "打出", tile: "三万", target: "你", responseHint: "右家打出三万，可胡" },
  responseContext: { sourcePlayerId: "east", tile: "三万", highlightedRiverSeatId: "east", remainingMs: 6200 },
  seats: [
    { id: "north", name: "玩家3", windLabel: "北", score: 24200, handCount: 13, meldGroups: [], latestAction: "等待" },
    { id: "west", name: "玩家2", windLabel: "西", score: 21800, handCount: 13, meldGroups: [], latestAction: "已出牌" },
    { id: "east", name: "玩家4", windLabel: "东", score: 25600, handCount: 13, meldGroups: [], latestAction: "当前出牌" },
    { id: "south", name: "玩家1", windLabel: "南", score: 28400, handCount: 14, meldGroups: [], latestAction: "可胡" },
  ],
  availableActions: [
    { id: "hu", label: "胡", available: true, reasonText: "右家打出三万，满足可胡条件", isPrimaryPath: true },
    { id: "gang", label: "杠", available: true, reasonText: "可杠当前目标组" },
    { id: "peng", label: "碰", available: true, reasonText: "你已有两张三万" },
    { id: "pass", label: "过", available: true, reasonText: "放弃本次响应" },
    { id: "discard", label: "出牌", available: false, reasonText: "当前为响应阶段，不能直接出牌" },
    { id: "confirm", label: "确认", available: false, reasonText: "当前为响应阶段，无需确认出牌" },
    { id: "cancel", label: "取消", available: false, reasonText: "当前为响应阶段，无需取消出牌" },
  ],
  replay: {
    timeline: [
      {
        id: "k1",
        ts: "T-12s",
        text: "右家打出三万，触发响应窗口",
        marker: "first_response",
        seatSummary: {
          north: { score: 24200, handCount: 13, latestAction: "等待" },
          west: { score: 21800, handCount: 13, latestAction: "已出牌" },
          east: { score: 25600, handCount: 13, latestAction: "当前出牌" },
          south: { score: 28400, handCount: 14, latestAction: "可胡" },
        },
      },
      {
        id: "k2",
        ts: "T-2s",
        text: "出现错误并恢复",
        marker: "error",
        seatSummary: {
          north: { score: 24200, handCount: 13, latestAction: "等待" },
          west: { score: 21800, handCount: 13, latestAction: "等待" },
          east: { score: 25600, handCount: 13, latestAction: "等待" },
          south: { score: 28400, handCount: 14, latestAction: "重试中" },
          system: { error: "recoverable" },
        },
      },
      {
        id: "k3",
        ts: "T+0s",
        text: "胡牌结算",
        marker: "hu",
        seatSummary: {
          north: { score: 23400, handCount: 13, latestAction: "支付" },
          west: { score: 21000, handCount: 13, latestAction: "支付" },
          east: { score: 24800, handCount: 13, latestAction: "支付" },
          south: { score: 30800, handCount: 13, latestAction: "胡牌" },
        },
      },
    ],
  },
};

window.majiangWinningModelExample = {
  ...window.majiangNextModelExample,
  latestEvent: { actor: "玩家4", verb: "打出", tile: "三万", target: "你", responseHint: "可胡：右家三万进张，满足平胡" },
  availableActions: [
    { id: "hu", label: "胡", available: true, reasonText: "满足平胡，可胡", isPrimaryPath: true },
    { id: "gang", label: "杠", available: true, reasonText: "可杠当前目标组" },
    { id: "peng", label: "碰", available: true, reasonText: "你有两张三万" },
    { id: "pass", label: "过", available: true, reasonText: "放弃响应" },
    { id: "discard", label: "出牌", available: false, reasonText: "当前为响应阶段，不能直接出牌" },
    { id: "confirm", label: "确认", available: false, reasonText: "当前为响应阶段，无需确认出牌" },
    { id: "cancel", label: "取消", available: false, reasonText: "当前为响应阶段，无需取消出牌" },
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
  window.requestAnimationFrame(() => {
    document.getElementById("resultHero").scrollIntoView({ block: "start", behavior: "smooth" });
  });
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
    next.eventTimeline.unshift({ id: `ext-${Date.now()}`, ts: nowTag(), text: "外部 handler：点炮胡结算", marker: "hu", seatSummary: { east: { score: 21700 } } });
    return { ok: true, nextModel: next, openResult: true };
  }
  if (actionId === "pass") {
    if (model.phase === "response_window" && model.latestEvent.responseHint.includes("可胡")) {
      return { ok: false, error: makeRecoverableError("外部 handler：本次过牌失败，可重试") };
    }
    return defaultActionHandler({ actionId, payload, model });
  }
  return defaultActionHandler({ actionId, payload, model });
};

window.resetMajiangPrototype = function resetMajiangPrototype() {
  appState.lobby = createDefaultLobbyState();
  appState.route = "lobby";
  appState.phase = "lobby_idle";
  appState.tableSnapshot = createDefaultTableSnapshot();
  appState.selectedTileIndex = null;
  appState.selectedActionId = null;
  appState.submitting = false;
  appState.inlineError = null;
  appState.contextExpanded = false;
  appState.diagnosticsExpanded = false;
  appState.lobbyDiagnosticsExpanded = false;
  appState.sideTab = "events";
  appState.sidePanelExpanded = false;
  appState.showMoreActions = false;
  appState.lastActionScope = "none";
  appState.disabledReasonExpanded = false;
  appState.actionExplainDrawerOpen = false;
  appState.lastLatestActionKey = "";
  appState.lastHighlightedTile = null;
  appState.debugTextTiles = false;
  rerender();
};

window.runMajiangDemoFlow = async function runMajiangDemoFlow() {
  window.resetMajiangPrototype();
  appState.gameCreationHandler = null;
  appState.actionHandler = null;
  await createGame();
  const handLength = (appState.tableSnapshot.selfHand || []).length;
  if (handLength > 0) {
    appState.selectedTileIndex = handLength - 1;
  }
  await submitAction("discard");
  window.showMajiangResultExample("tsumo");
};

window.setMajiangTextTileFallback = function setMajiangTextTileFallback(enabled) {
  appState.debugTextTiles = Boolean(enabled);
  rerender();
};

/** Playwright e2e：经真实 handler 提交，避开牌面 atlas hit-test 抖动 */
window.__majiangE2e = {
  getPhase: () => (appState.tableSnapshot && appState.tableSnapshot.phase) || "",
  getHint: () => (appState.tableSnapshot && appState.tableSnapshot.turnHint) || "",
  getHandCount: () => ((appState.tableSnapshot && appState.tableSnapshot.selfHand) || []).length,
  getSelfHand: () => ((appState.tableSnapshot && appState.tableSnapshot.selfHand) || []).slice(),
  getInlineErrorMessage: () =>
    (appState.inlineError && appState.inlineError.message) ||
    (document.getElementById("inlineError")?.textContent || "").trim(),
  isSubmitting: () => Boolean(appState.submitting),
  getAvailableActionIds: () =>
    ((appState.tableSnapshot && appState.tableSnapshot.availableActions) || [])
      .filter((a) => a && a.available)
      .map((a) => a.id),
  async submit(actionId) {
    await submitAction(actionId);
  },
  async discardFirst() {
    if (!appState.tableSnapshot || !appState.tableSnapshot.selfHand.length) {
      throw new Error("no hand");
    }
    appState.selectedTileIndex = 0;
    await submitAction("discard");
  },
  async discardIllegal() {
    appState.selectedTileIndex = 9999;
    await submitAction("discard");
  },
  async pass() {
    await submitAction("pass");
  },
};

// W4 合同：?debugTiles=1 强制文字牌降级（调试/占位）
if (PAGE_PARAMS.get("debugTiles") === "1") {
  appState.debugTextTiles = true;
}

bindEvents();
startCountdown();
rerender();
