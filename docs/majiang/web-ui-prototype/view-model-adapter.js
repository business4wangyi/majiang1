(function initMajiangViewModelAdapter(global) {
  const ACTION_ORDER = ["hu", "gang", "peng", "chi", "pass", "discard", "confirm", "cancel"];
  const PHASE_ACTION_SCOPE = {
    response_window: ["hu", "gang", "peng", "chi", "pass"],
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
      currentPlayerId: "north",
      wallCount: 56,
      roundInfo: "东一局",
      turnHint: "AI-北 刚打出 三万，你可碰或过",
      seats: [
        { id: "north", name: "AI-北", windLabel: "北位", score: 96, handCount: 13, meldGroups: [{ type: "peng", tiles: ["六万", "六万", "六万"] }], latestAction: "打出 三万" },
        { id: "west", name: "AI-西", windLabel: "西位", score: 88, handCount: 12, meldGroups: [], latestAction: "等待中" },
        { id: "east", name: "AI-东", windLabel: "东位", score: 104, handCount: 13, meldGroups: [{ type: "chi", tiles: ["三条", "四条", "五条"] }], latestAction: "等待中" },
        { id: "south", name: "你", windLabel: "南位", score: 112, handCount: 14, meldGroups: [], latestAction: "可响应" },
      ],
      selfHand: ["一万", "二万", "三万", "三万", "四万", "五万", "六筒", "六筒", "七筒", "八条", "九条", "东", "红中", "白板"],
      discardRiver: {
        north: ["三万", "九条", "二筒", "北", "五万", "八万"],
        west: ["六万", "七万", "一筒", "白板", "三条", "六筒"],
        east: ["九万", "四条", "二万", "发", "一条", "七筒"],
        south: ["三筒", "四万", "东", "九筒", "五条", "二条"],
      },
      latestEvent: { actor: "AI-北", verb: "打出", tile: "三万", target: "你", responseHint: "你可碰：你已有两张三万" },
      responseContext: { sourcePlayerId: "north", tile: "三万", highlightedRiverSeatId: "north", remainingMs: 6000 },
      availableActions: [
        { id: "hu", label: "胡", available: false, reasonText: "当前牌型不满足可胡条件" },
        { id: "gang", label: "杠", available: false, reasonText: "当前无可杠牌组" },
        { id: "peng", label: "碰", available: true, reasonText: "你已有两张三万", isPrimaryPath: true },
        { id: "chi", label: "吃", available: false, reasonText: "本次不是上家弃牌，不能吃" },
        { id: "pass", label: "过", available: true, reasonText: "放弃本次响应" },
        { id: "discard", label: "出牌", available: true, reasonText: "请选择一张手牌后出牌" },
        { id: "confirm", label: "确认", available: true, reasonText: "确认当前出牌选择" },
        { id: "cancel", label: "取消", available: true, reasonText: "取消当前选择" },
      ],
      eventTimeline: [
        { id: "e1", text: "AI-北 打出 三万（可被响应）", scoreDelta: "", marker: "first_response", seats: "你可碰" },
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
        title: "荣和结束",
        reason: "AI-东 荣和 AI-北 打出的 五万",
        rows: [
          { player: "AI-东", delta: "+16", total: 120, role: "胡牌者", reason: "荣和" },
          { player: "AI-北", delta: "-16", total: 80, role: "点炮者", reason: "放铳" },
          { player: "AI-西", delta: "0", total: 90, role: "旁家", reason: "无支付" },
          { player: "你", delta: "0", total: 112, role: "旁家", reason: "无支付" },
        ],
      };
    }
    if (type === "draw") {
      return {
        type,
        title: "流局",
        reason: "牌山耗尽，按听牌罚则结算",
        rows: [
          { player: "你", delta: "+4", total: 116, role: "听牌", reason: "流局听牌奖励" },
          { player: "AI-北", delta: "-2", total: 94, role: "未听牌", reason: "流局罚分" },
          { player: "AI-西", delta: "-1", total: 87, role: "未听牌", reason: "流局罚分" },
          { player: "AI-东", delta: "-1", total: 103, role: "未听牌", reason: "流局罚分" },
        ],
      };
    }
    if (type === "abort") {
      return {
        type,
        title: "异常终止",
        reason: "状态同步失败，已中止本局",
        rows: [
          { player: "你", delta: "0", total: 112, role: "中止", reason: "未结算" },
          { player: "AI-北", delta: "0", total: 96, role: "中止", reason: "未结算" },
          { player: "AI-西", delta: "0", total: 88, role: "中止", reason: "未结算" },
          { player: "AI-东", delta: "0", total: 104, role: "中止", reason: "未结算" },
        ],
      };
    }
    return {
      type: "tsumo",
      title: "自摸结束",
      reason: "你自摸胡牌：平胡 + 自摸",
      rows: [
        { player: "你", delta: "+24", total: 124, role: "胡牌者", reason: "自摸" },
        { player: "AI-北", delta: "-8", total: 88, role: "支付方", reason: "自摸支付" },
        { player: "AI-西", delta: "-8", total: 80, role: "支付方", reason: "自摸支付" },
        { player: "AI-东", delta: "-8", total: 96, role: "支付方", reason: "自摸支付" },
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
