import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3001);

function sendJson(payload: unknown) {
  return JSON.stringify(payload, null, 2);
}

const server = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (url.pathname === '/api/health') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(
      sendJson({
        ok: true,
        service: 'nightcord-api',
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  if (url.pathname === '/api/bootstrap') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(
      sendJson({
        theme: 'nebula',
        features: ['chat', 'media', 'profiles', 'events'],
        status: 'ready',
      }),
    );
    return;
  }

  response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(sendJson({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`Nightcord API listening on http://localhost:${port}`);
});