import { broadcastSysMsg } from "./messaging.js";
import { log } from "./logging.js";

/** Store which sockets are mapped to which usernames */
export const activeClients = new Map();
/** Store which usernames are mapped to which sockets */
export const socketSessions = new Map();

/**
 * Find session for socket, delete it and distribute disconnection 
 * message to all connected clients. Since hard-disconnect message 
 * is sent somewhere else we might want to suppress notification here 
 * (sidefects)
 * @param {WebSocket} ws
 * @param {boolean} notify 
 */
export function cleanUpClient(wss, ws, notify) {
  const session = socketSessions.get(ws);
  const username = session?.username;
  if (username) {
    activeClients.delete(username);
    log(`Free up ${username} username`);
    socketSessions.delete(ws);
    if (notify) {
      broadcastSysMsg(wss, `${username} left the chat, connection lost`);
    }
  }
}
