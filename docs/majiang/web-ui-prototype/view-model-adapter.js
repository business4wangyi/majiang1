(function initMajiangViewModelAdapter(global) {
  const ACTION_ORDER = ["hu", "gang", "peng", "pass", "discard", "confirm", "cancel"];
  const PHASE_ACTION_SCOPE = {
    response_window: ["hu", "gang", "peng", "pass"],
    player_turn: ["discard", "confirm", "cancel"],
    waiting_ai: [],
    ended: [],
    table_loading: [],
  };

  function normalizeSeat(seat) {
    return {
      id: seat.id,
      name: seat.name || seat.id,
      windLabel: seat.windLabel || "",
      score: Number.isFinite(seat.score) ? seat.score : 0,
      handCount: Number.isFinite(seat.handCount) ? seat.handCount : 0,
      meldGroups: Array.isArray(seat.meldGroups) ? seat.meldGroups : [],
      latestAction: seat.latestAction || "等待中",
    };
  }

  function normalizeAction(action) {
    return {
      id: action.id,
      label: action.label || action.id,
      available: Boolean(action.available),
      reasonText: action.reasonText || "核心状态未提供原因",
      isPrimaryPath: Boolean(action.isPrimaryPath),
    };
  }

  function createTableViewModelFromSnapshot(snapshot) {
    const source = snapshot || {};
    const seats = (source.seats || []).map(normalizeSeat);
    const rawActions = (source.availableActions || []).map(normalizeAction).sort((a, b) => ACTION_ORDER.indexOf(a.id) - ACTION_ORDER.indexOf(b.id));
    const responseContext = source.responseContext || {};
    const eventTimeline = Array.isArray(source.eventTimeline) ? source.eventTimeline : [];

    const phase = source.phase || "table_loading";
    const scopedActionIds = PHASE_ACTION_SCOPE[phase] || [];
    const actions = rawActions.filter((action) => scopedActionIds.includes(action.id));
    const scopedActionMap = new Map(actions.map((action) => [action.id, action]));
    scopedActionIds.forEach((id) => {
      if (scopedActionMap.has(id)) return;
      actions.push({
        id,
        label: id,
        available: false,
        reasonText: "当前阶段不可操作",
        isPrimaryPath: false,
      });
    });

    const modelError = source.globalError || null;
    const recoverable = Boolean(
      source.recoverable ||
        (source.inlineError && source.inlineError.recoverable) ||
        (modelError && modelError.recoverable)
    );
    const retryAction =
      source.retryAction ||
      (source.inlineError && source.inlineError.retryAction) ||
      (modelError && modelError.retryAction) ||
      null;
    const diagnosticContext =
      source.diagnosticContext ||
      (source.inlineError && source.inlineError.diagnosticContext) ||
      (modelError && modelError.diagnosticContext) ||
      null;

    return {
      gameId: source.gameId || "demo-round-001",
      phase,
      currentPlayerId: source.currentPlayerId || "south",
      wallCount: Number.isFinite(source.wallCount) ? source.wallCount : 0,
      roundInfo: source.roundInfo || "东一局",
      turnHint: source.turnHint || "等待状态更新",
      seats,
      selfHand: Array.isArray(source.selfHand) ? source.selfHand : [],
      discardRiver: source.discardRiver || { north: [], west: [], east: [], south: [] },
      availableActions: actions,
      latestEvent: source.latestEvent || { actor: "系统", verb: "等待", tile: "", target: "你", responseHint: "" },
      responseContext: {
        sourcePlayerId: responseContext.sourcePlayerId || "",
        tile: responseContext.tile || "",
        highlightedRiverSeatId: responseContext.highlightedRiverSeatId || "",
        remainingMs: Number.isFinite(responseContext.remainingMs) ? responseContext.remainingMs : null,
      },
      eventTimeline,
      scoreDeltaTimeline: Array.isArray(source.scoreDeltaTimeline) ? source.scoreDeltaTimeline : [],
      resultSummary: source.resultSummary || null,
      diagnostics: source.diagnostics || {},
      replay: source.replay || { timeline: [] },
      globalError: modelError,
      submitting: Boolean(source.submitting),
      recoverable,
      retryAction,
      diagnosticContext,
    };
  }

  function createDefaultLobbyState() {
    return {
      players: 4,
      aiType: "RuleBased + AlphaZero Adapter",
      ruleSet: "国标麻将（MVP固定）",
      baseScore: 100,
      editable: false,
      recentGames: [],
    };
  }

  function createDefaultTableSnapshot() {
    return {
      gameId: "demo-round-001",
      phase: "response_window",
      currentPlayerId: "south",
      wallCount: 36,
      roundInfo: "东风局",
      turnHint: "右家打出三万，你可胡",
      seats: [
        { id: "north", name: "玩家3", windLabel: "北", score: 24200, handCount: 13, meldGroups: [], latestAction: "等待" },
        { id: "west", name: "玩家2", windLabel: "西", score: 21800, handCount: 13, meldGroups: [], latestAction: "已出牌" },
        { id: "east", name: "玩家4", windLabel: "东", score: 25600, handCount: 13, meldGroups: [], latestAction: "当前出牌" },
        { id: "south", name: "玩家1", windLabel: "南", score: 28400, handCount: 14, meldGroups: [], latestAction: "可胡" },
      ],
      selfHand: ["一万", "二万", "三万", "五万", "五万", "一筒", "二筒", "三筒", "一条", "二条", "三条", "四条", "发", "中"],
      discardRiver: {
        north: ["一万", "六万", "三万", "五万", "六万", "七万"],
        west: ["九筒", "白", "三条", "八条", "七筒", "一万"],
        east: ["二筒", "五筒", "三筒", "九筒", "六筒", "三万"],
        south: ["八万", "东", "四条", "九条", "五条", "二条"],
      },
      latestEvent: { actor: "玩家4", verb: "打出", tile: "三万", target: "你", responseHint: "右家打出三万，可胡" },
      responseContext: { sourcePlayerId: "east", tile: "三万", highlightedRiverSeatId: "east", remainingMs: 6200 },
      availableActions: [
        { id: "hu", label: "胡", available: true, reasonText: "右家打出三万，满足可胡条件", isPrimaryPath: true },
        { id: "gang", label: "杠", available: true, reasonText: "可杠当前目标组" },
        { id: "peng", label: "碰", available: true, reasonText: "你已有两张三万" },
        { id: "pass", label: "过", available: true, reasonText: "放弃本次响应" },
        { id: "discard", label: "出牌", available: true, reasonText: "请选择一张手牌后出牌" },
        { id: "confirm", label: "确认", available: true, reasonText: "确认当前出牌选择" },
        { id: "cancel", label: "取消", available: true, reasonText: "取消当前选择" },
      ],
      eventTimeline: [
        { id: "e1", text: "玩家4 打出 三万（你可胡）", scoreDelta: "", marker: "first_response", seats: "你可胡" },
      ],
      scoreDeltaTimeline: [{ text: "当前无分数变化", delta: "+0", trend: "up" }],
      resultSummary: null,
      diagnostics: { message: "系统已就绪" },
      replay: { timeline: [] },
      globalError: null,
      submitting: false,
      recoverable: false,
      retryAction: null,
      diagnosticContext: null,
    };
  }

  function createResultSummary(type) {
    if (type === "ron") {
      return {
        type,
        title: "点炮胡",
        reason: "你胡了玩家4打出的五万",
        rows: [
          { player: "玩家1", delta: "+3900", total: 32300, role: "胡牌者", reason: "点炮胡" },
          { player: "玩家4", delta: "-3900", total: 21700, role: "点炮方", reason: "放炮支付" },
          { player: "玩家2", delta: "0", total: 21800, role: "旁家", reason: "无支付" },
          { player: "玩家3", delta: "0", total: 24200, role: "旁家", reason: "无支付" },
        ],
      };
    }
    if (type === "draw") {
      return {
        type,
        title: "流局",
        reason: "牌山耗尽，按流局规则结算",
        rows: [
          { player: "玩家1", delta: "0", total: 28400, role: "流局", reason: "未发生胡牌" },
          { player: "玩家2", delta: "0", total: 21800, role: "流局", reason: "未发生胡牌" },
          { player: "玩家3", delta: "0", total: 24200, role: "流局", reason: "未发生胡牌" },
          { player: "玩家4", delta: "0", total: 25600, role: "流局", reason: "未发生胡牌" },
        ],
      };
    }
    if (type === "abort") {
      return {
        type,
        title: "异常终止",
        reason: "状态同步失败，已中止本局",
        rows: [
          { player: "玩家1", delta: "0", total: 28400, role: "中止", reason: "未结算" },
          { player: "玩家2", delta: "0", total: 21800, role: "中止", reason: "未结算" },
          { player: "玩家3", delta: "0", total: 24200, role: "中止", reason: "未结算" },
          { player: "玩家4", delta: "0", total: 25600, role: "中止", reason: "未结算" },
        ],
      };
    }
    return {
      type: "tsumo",
      title: "自摸胡牌",
      reason: "你自摸胡牌：平胡",
      rows: [
        { player: "玩家1", delta: "+2400", total: 30800, role: "胡牌者", reason: "自摸" },
        { player: "玩家2", delta: "-800", total: 21000, role: "支付方", reason: "自摸支付" },
        { player: "玩家3", delta: "-800", total: 23400, role: "支付方", reason: "自摸支付" },
        { player: "玩家4", delta: "-800", total: 24800, role: "支付方", reason: "自摸支付" },
      ],
    };
  }

  global.MajiangViewModelAdapter = {
    ACTION_ORDER,
    PHASE_ACTION_SCOPE,
    createTableViewModelFromSnapshot,
    createDefaultLobbyState,
    createDefaultTableSnapshot,
    createResultSummary,
  };
})(window);
