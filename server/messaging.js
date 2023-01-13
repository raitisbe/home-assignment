import { WebSocket } from "ws";

/**
 * @param {WebSocketServer} wss
 * @param {string} message
 */
export function broadcastSysMsg(wss, message) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          system: message,
        }),
        { binary: false }
      );
    }
  });
}

/**
 * Use this for ordinary chat messages
 * @param {WebSocketServer} wss
 * @param {{sender: string, text: string}} wrapper
 */
export function distributeMessage(wss, wrapper) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(wrapper), { binary: false });
    }
  });
}
