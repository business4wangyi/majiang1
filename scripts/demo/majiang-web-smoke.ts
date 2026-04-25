import { resolveMajiangApiRequest, resolveStaticPage } from '../../src/majiang/web/app';

function parseJsonBody(response: { body: string | Buffer }): any {
  return JSON.parse(String(response.body));
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main(): void {
  const health = resolveMajiangApiRequest('GET', '/api/majiang/health');
  assert(health?.statusCode === 200, 'health 路由未返回 200');
  assert(parseJsonBody(health!).ok === true, 'health 路由未返回 ok=true');

  const unsupportedMode = resolveMajiangApiRequest('POST', '/api/majiang/session', { mode: 'auto-demo' });
  assert(unsupportedMode?.statusCode === 400, 'auto-demo 模式应被识别并返回未开放');

  const invalidMode = resolveMajiangApiRequest('POST', '/api/majiang/session', { mode: 'invalid' });
  assert(invalidMode?.statusCode === 400, '非法模式应返回 400');

  const create = resolveMajiangApiRequest('POST', '/api/majiang/session', { mode: 'manual' });
  assert(create?.statusCode === 200, 'create session 未返回 200');
  const createdPayload = parseJsonBody(create!);
  assert(typeof createdPayload.sessionId === 'string' && createdPayload.sessionId.length > 0, 'sessionId 缺失');
  assert(createdPayload.mode === 'manual', '建局结果未返回 manual 模式');
  assert(Array.isArray(createdPayload.state.seats) && createdPayload.state.seats.length === 4, '建局后座位数不正确');
  assert(createdPayload.state.availableActions.includes('DISCARD'), '建局后人类未进入可出牌状态');

  const sessionId = createdPayload.sessionId;
  const getState = resolveMajiangApiRequest('GET', `/api/majiang/session/${sessionId}`);
  assert(getState?.statusCode === 200, 'get session 未返回 200');

  const discard = resolveMajiangApiRequest('POST', `/api/majiang/session/${sessionId}/discard`, { tileIndex: 0 });
  assert(discard?.statusCode === 200, 'discard 未返回 200');
  const discardPayload = parseJsonBody(discard!);
  assert(Array.isArray(discardPayload.state.seats) && discardPayload.state.seats.length === 4, 'discard 后状态缺失');

  const restart = resolveMajiangApiRequest('POST', `/api/majiang/session/${sessionId}/restart`, {});
  assert(restart?.statusCode === 200, 'restart 未返回 200');
  const restartPayload = parseJsonBody(restart!);
  assert(restartPayload.state.availableActions.includes('DISCARD'), 'restart 后人类未进入可出牌状态');

  const page = resolveStaticPage('/majiang-web/');
  assert(page?.statusCode === 200 && String(page.body) === 'index.html', '首页静态路由未命中');

  const appJs = resolveStaticPage('/majiang-web/app.js');
  assert(appJs?.statusCode === 200 && String(appJs.body) === 'app.js', 'app.js 静态路由未命中');

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'health',
      'reject-auto-demo-mode',
      'reject-invalid-mode',
      'create-session',
      'get-session',
      'discard',
      'restart',
      'static-index',
      'static-app-js'
    ]
  }, null, 2));
}

main();
