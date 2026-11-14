import 'dotenv/config';
import http from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils';
import { LeveldbPersistence } from 'y-leveldb';
import * as Y from 'yjs';

const port = Number(process.env.PORT || 1234);
const persistence = new LeveldbPersistence(process.env.DATA_DIR || './data');

// Load and persist Yjs documents in LevelDB. Each room is keyed by page ID.
setPersistence({
  bindState: async (docName, ydoc) => {
    const persisted = await persistence.getYDoc(docName);
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persisted));
    ydoc.on('update', update => persistence.storeUpdate(docName, update));
  },
  writeState: async () => {}
});

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'content-type':'application/json'});
    res.end(JSON.stringify({ok:true, service:'collaboration'}));
    return;
  }
  res.writeHead(404); res.end('Not found');
});
const wss = new WebSocketServer({ noServer:true });

server.on('upgrade', (req, socket, head) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== 'collab') throw new Error('Invalid token purpose');
    const room = decodeURIComponent(url.pathname.slice(1));
    if (!room || room.includes('..')) throw new Error('Invalid room');
    req.url = `/${room}`;
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n');
    socket.destroy();
  }
});

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { docName: decodeURIComponent(req.url.slice(1)) });
});
server.listen(port, () => console.log(`Collaboration WebSocket listening on ws://localhost:${port}`));
