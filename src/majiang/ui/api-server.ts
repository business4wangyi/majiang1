import { randomUUID } from 'crypto';
import path from 'path';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import {
  GameSession,
  SessionActionError,
  SessionActionInput,
  parseMeldFixture,
} from '../session/game-session';

export type MajiangGameStore = Map<string, GameSession>;

export interface CreateMajiangApiAppOptions {
  store?: MajiangGameStore;
  /** 是否挂载 web-ui-prototype 静态资源与 bridge 配置（CAP-WEB-BRIDGE） */
  servePrototype?: boolean;
}

export interface MajiangApiApp {
  app: Express;
  store: MajiangGameStore;
}

/**
 * CAP-API-GAME + CAP-WEB-BRIDGE：本机对局 API。
 * 状态权威在服务端 Session；浏览器只提交动作、消费快照。
 */
export function createMajiangApiApp(
  options: CreateMajiangApiAppOptions = {}
): MajiangApiApp {
  const store: MajiangGameStore = options.store ?? new Map();
  const servePrototype = options.servePrototype !== false;
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/bridge-config', (_req: Request, res: Response) => {
    res.json({ enabled: true, apiBase: '' });
  });

  app.post('/games', (req: Request, res: Response) => {
    const id = randomUUID();
    let fixture;
    try {
      fixture = parseMeldFixture((req.body || {}).fixture);
    } catch (err) {
      if (err instanceof SessionActionError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
    const session = GameSession.create({ mode: 'api', gameId: id, fixture });
    session.start();
    store.set(id, session);
    res.status(201).json({
      id,
      snapshot: session.getTableSnapshot(),
      ...(fixture ? { fixture } : {}),
    });
  });

  app.get('/games/:id', (req: Request, res: Response) => {
    const session = store.get(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'game not found' });
      return;
    }
    res.json({
      id: req.params.id,
      snapshot: session.getTableSnapshot(),
    });
  });

  app.post('/games/:id/actions', async (req: Request, res: Response) => {
    const id = req.params.id;
    const session = store.get(id);
    if (!session) {
      res.status(404).json({ error: 'game not found' });
      return;
    }

    const before = session.fingerprint();
    const body = (req.body || {}) as SessionActionInput;
    try {
      const snapshot = await session.applyAction(body);
      res.json({ id, snapshot });
    } catch (err) {
      if (err instanceof SessionActionError) {
        // 非法动作：拒绝且不脏写
        if (session.fingerprint() !== before) {
          res.status(500).json({ error: 'illegal action mutated state' });
          return;
        }
        res.status(400).json({
          error: err.message,
          snapshot: session.getTableSnapshot(),
        });
        return;
      }
      throw err;
    }
  });

  if (servePrototype) {
    const protoDir = path.resolve(
      __dirname,
      '../../../docs/majiang/web-ui-prototype'
    );
    app.use(express.static(protoDir));
  }

  return { app, store };
}
