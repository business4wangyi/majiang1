import { randomUUID } from 'crypto';
import { MajiangGameSession } from '../application/game-session';
import { PlayerAction } from '../core/rule-types';

export interface MajiangWebResponse {
  statusCode: number;
  contentType: string;
  body: string | Buffer;
}

const sessions = new Map<string, MajiangGameSession>();

function json(statusCode: number, payload: unknown): MajiangWebResponse {
  return {
    statusCode,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(payload)
  };
}

function text(statusCode: number, content: string, contentType: string): MajiangWebResponse {
  return {
    statusCode,
    contentType,
    body: content
  };
}

function createSession(): { sessionId: string; session: MajiangGameSession } {
  const sessionId = randomUUID();
  const session = new MajiangGameSession();
  sessions.set(sessionId, session);
  return { sessionId, session };
}

function getSessionOrThrow(sessionId: string | undefined): MajiangGameSession {
  if (!sessionId) {
    throw new Error('缺少 sessionId');
  }

  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('未找到对应的对局会话');
  }

  return session;
}

export function resolveMajiangApiRequest(
  method: string,
  pathname: string,
  body: Record<string, unknown> = {}
): MajiangWebResponse | null {
  if (method === 'GET' && pathname === '/api/majiang/health') {
    return json(200, { ok: true });
  }

  if (method === 'POST' && pathname === '/api/majiang/session') {
    const { sessionId, session } = createSession();
    return json(200, { sessionId, state: session.getState() });
  }

  const sessionMatch = pathname.match(/^\/api\/majiang\/session\/([^/]+)$/);
  if (method === 'GET' && sessionMatch) {
    const sessionId = decodeURIComponent(sessionMatch[1]);
    const session = getSessionOrThrow(sessionId);
    return json(200, { sessionId, state: session.getState() });
  }

  const discardMatch = pathname.match(/^\/api\/majiang\/session\/([^/]+)\/discard$/);
  if (method === 'POST' && discardMatch) {
    const sessionId = decodeURIComponent(discardMatch[1]);
    const session = getSessionOrThrow(sessionId);
    const tileIndex = Number(body.tileIndex);

    if (!Number.isInteger(tileIndex)) {
      return json(400, { error: 'tileIndex 必须是整数' });
    }

    return json(200, { sessionId, state: session.discard(tileIndex) });
  }

  const actionMatch = pathname.match(/^\/api\/majiang\/session\/([^/]+)\/respond$/);
  if (method === 'POST' && actionMatch) {
    const sessionId = decodeURIComponent(actionMatch[1]);
    const session = getSessionOrThrow(sessionId);
    const action = String(body.action || '') as PlayerAction;

    if (!Object.values(PlayerAction).includes(action)) {
      return json(400, { error: 'action 不是有效的麻将动作' });
    }

    return json(200, { sessionId, state: session.respond(action) });
  }

  const restartMatch = pathname.match(/^\/api\/majiang\/session\/([^/]+)\/restart$/);
  if (method === 'POST' && restartMatch) {
    const sessionId = decodeURIComponent(restartMatch[1]);
    const session = getSessionOrThrow(sessionId);
    return json(200, { sessionId, state: session.restart() });
  }

  return null;
}

export function resolveStaticPage(pathname: string): MajiangWebResponse | null {
  if (pathname === '/majiang-web' || pathname === '/majiang-web/') {
    return text(200, 'index.html', 'text/x-majiang-static');
  }

  if (pathname.startsWith('/majiang-web/')) {
    return text(200, pathname.replace('/majiang-web/', ''), 'text/x-majiang-static');
  }

  return null;
}
