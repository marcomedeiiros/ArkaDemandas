import { WebSocketServer, WebSocket } from 'ws';

let wssInstance: WebSocketServer | null = null;

export function setWebSocketServer(wss: WebSocketServer) {
  wssInstance = wss;
}

export function broadcastWs(type: string, data: any) {
  if (!wssInstance) return;
  const message = JSON.stringify({ type, data });
  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
