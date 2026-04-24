import http, { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { updateMajiangRuntimeOptions } from '../runtime/runtime-context';
import { resolveMajiangApiRequest, resolveStaticPage } from './app';

const publicDir = path.join(process.cwd(), 'src/majiang/web/public');

updateMajiangRuntimeOptions({
  fileLoggingEnabled: false
});

function json(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function text(res: ServerResponse, statusCode: number, content: string, contentType: string): void {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function serveStaticFile(res: ServerResponse, filePath: string): void {
  if (!fs.existsSync(filePath)) {
    text(res, 404, 'Not Found', 'text/plain; charset=utf-8');
    return;
  }

  const ext = path.extname(filePath);
  const typeMap: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8'
  };
  const contentType = typeMap[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const pathname = url.pathname;
    const method = req.method || 'GET';
    const apiResponse = resolveMajiangApiRequest(method, pathname, await readJsonBody(req));

    if (apiResponse) {
      res.writeHead(apiResponse.statusCode, { 'Content-Type': apiResponse.contentType });
      res.end(apiResponse.body);
      return;
    }

    const staticResponse = resolveStaticPage(pathname);
    if (staticResponse) {
      const staticPath = String(staticResponse.body);
      if (staticPath === 'index.html') {
        serveStaticFile(res, path.join(publicDir, 'index.html'));
        return;
      }

      const safePath = path.normalize(staticPath).replace(/^(\.\.[/\\])+/, '');
      serveStaticFile(res, path.join(publicDir, safePath));
      return;
    }

    text(res, 404, 'Not Found', 'text/plain; charset=utf-8');
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : String(error) });
  }
});

const port = Number(process.env.MAJIANG_WEB_PORT || 4010);
const host = process.env.MAJIANG_WEB_HOST || '127.0.0.1';
server.listen(port, host, () => {
  console.log(`麻将 Web UI 运行在 http://${host}:${port}/majiang-web`);
});
