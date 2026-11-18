/**
 * CAP-WEB-BRIDGE：把原型 create/action handler 接到本机对局 API。
 * 不造规则；只提交动作、消费服务端 snapshot。
 */
(function initMajiangApiBridge(global) {
  let gameId = null;

  function apiBase() {
    return global.MAJIANG_API_BASE || "";
  }

  async function requestJson(method, route, body) {
    const res = await fetch(`${apiBase()}${route}`, {
      method,
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await res.json();
    } catch (_err) {
      json = { error: `HTTP ${res.status}` };
    }
    return { ok: res.ok, status: res.status, json };
  }

  function makeError(message, extra) {
    return {
      recoverable: true,
      message: message || "操作失败",
      retryAction: "retry_last_action",
      diagnosticContext: extra || null,
    };
  }

  async function apiGameCreationHandler() {
    // 可选 ?fixture=peng-ready|chi-ready：测试夹具；默认不传
    var body;
    try {
      var q = new URLSearchParams(global.location.search || "");
      var fixture = q.get("fixture");
      if (fixture) body = { fixture: fixture };
    } catch (_err) {
      body = undefined;
    }
    const result = await requestJson("POST", "/games", body);
    if (!result.ok || !result.json || !result.json.id || !result.json.snapshot) {
      return {
        ok: false,
        message: (result.json && result.json.error) || `创建对局失败 (${result.status})`,
      };
    }
    gameId = result.json.id;
    return { ok: true, tableSnapshot: result.json.snapshot };
  }

  async function apiActionHandler({ actionId, payload }) {
    if (!gameId) {
      return { ok: false, error: makeError("尚未创建对局") };
    }

    const body = { id: actionId };
    if (actionId === "discard") {
      if (payload == null || !Number.isInteger(payload.selectedTileIndex)) {
        return { ok: false, error: makeError("请先点选手牌再出牌") };
      }
      body.tileIndex = payload.selectedTileIndex;
    }

    const result = await requestJson("POST", `/games/${gameId}/actions`, body);
    if (!result.ok) {
      return {
        ok: false,
        error: makeError((result.json && result.json.error) || `动作被拒 (${result.status})`, {
          status: result.status,
          snapshot: result.json && result.json.snapshot,
        }),
      };
    }

    const snapshot = result.json.snapshot;
    // 禁止假 waiting_ai：服务端应直接回到 player_turn / response_window / ended
    if (snapshot.phase === "waiting_ai") {
      return {
        ok: false,
        error: makeError("服务端返回假 waiting_ai，桥接拒绝采纳"),
      };
    }

    return {
      ok: true,
      nextModel: snapshot,
      openResult: snapshot.phase === "ended",
    };
  }

  function installMajiangApiBridge(options) {
    if (options && typeof options.apiBase === "string") {
      global.MAJIANG_API_BASE = options.apiBase;
    }
    if (typeof global.setMajiangGameCreationHandler === "function") {
      global.setMajiangGameCreationHandler(apiGameCreationHandler);
    }
    if (typeof global.setMajiangActionHandler === "function") {
      global.setMajiangActionHandler(apiActionHandler);
    }
    global.__majiangApiBridgeInstalled = true;
    return {
      createGame: apiGameCreationHandler,
      submitAction: apiActionHandler,
      getGameId: function getGameId() {
        return gameId;
      },
    };
  }

  global.installMajiangApiBridge = installMajiangApiBridge;
  global.majiangApiBridge = {
    install: installMajiangApiBridge,
    createGame: apiGameCreationHandler,
    submitAction: apiActionHandler,
  };

  function allowPrototypeDemo() {
    try {
      var q = new URLSearchParams(global.location.search || "");
      // acceptance=1：旧视觉验收；prototypeDemo=1：显式允许本地假对局
      return q.get("acceptance") === "1" || q.get("prototypeDemo") === "1";
    } catch (_err) {
      return false;
    }
  }

  function installOfflineGuard() {
    // 纯静态 / 无 API：禁止落入 defaultActionHandler 的假 waiting_ai 死等
    if (typeof global.setMajiangGameCreationHandler === "function") {
      global.setMajiangGameCreationHandler(async function offlineCreateGuard() {
        return {
          ok: false,
          message:
            "未连接对局 API。请运行 npm run majiang:api-server，然后打开 http://localhost:4100/（视觉演示可加 ?prototypeDemo=1）",
        };
      });
    }
    global.__majiangApiBridgeInstalled = false;
    global.__majiangApiBridgeOffline = true;
  }

  // 仅当同源 API 暴露 bridge-config 时自动安装；否则默认 fail-closed（避免假 waiting_ai）
  if (typeof fetch === "function") {
    fetch(`${apiBase()}/api/bridge-config`)
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (cfg) {
        if (cfg && cfg.enabled) {
          installMajiangApiBridge({ apiBase: cfg.apiBase || apiBase() });
          return;
        }
        if (!allowPrototypeDemo()) {
          installOfflineGuard();
        }
      })
      .catch(function () {
        if (!allowPrototypeDemo()) {
          installOfflineGuard();
        }
      });
  }
})(window);
