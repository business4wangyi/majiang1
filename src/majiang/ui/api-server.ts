import { randomUUID } from 'crypto';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import {
  GameSession,
  SessionActionError,
  SessionActionInput,
} from '../session/game-session';

export type MajiangGameStore = Map<string, GameSession>;

export interface CreateMajiangApiAppOptions {
  store?: MajiangGameStore;
}

export interface MajiangApiApp {
  app: Express;
  store: MajiangGameStore;
}

/**
 * CAP-API-GAME：本机对局 API。
 * 状态权威在服务端 Session；浏览器只提交动作、消费快照。
 */
export function createMajiangApiApp(
  options: CreateMajiangApiAppOptions = {}
): MajiangApiApp {
  const store: MajiangGameStore = options.store ?? new Map();
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/games', (_req: Request, res: Response) => {
    const id = randomUUID();
    const session = GameSession.create({ mode: 'api', gameId: id });
    session.start();
    store.set(id, session);
    res.status(201).json({
      id,
      snapshot: session.getTableSnapshot(),
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

  app.post('/games/:id/actions', (req: Request, res: Response) => {
    const id = req.params.id;
    const session = store.get(id);
    if (!session) {
      res.status(404).json({ error: 'game not found' });
      return;
    }

    const before = session.fingerprint();
    const body = (req.body || {}) as SessionActionInput;
    try {
      const snapshot = session.applyAction(body);
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

  return { app, store };
}
