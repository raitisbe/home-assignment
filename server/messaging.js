import { WebSocket } from "ws";
import { globals } from "./global.js";

/**
 * @param {string} message
 */
export function broadcastSysMsg(message) {
  globals.wss.clients.forEach(function each(client) {
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
 * @param {{sender: string, text: string}} wrapper
 */
export function distributeMessage(wrapper) {
  globals.wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(wrapper), { binary: false });
    }
  });
}
