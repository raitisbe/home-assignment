import { broadcastSysMsg } from "./messaging.js";
import { log } from "./logging.js";
import { globals } from "./global.js";

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
export function cleanUpClient(ws, notify) {
  const session = socketSessions.get(ws);
  const username = session?.username;
  if (username) {
    activeClients.delete(username);
    log(`Free up ${username} username`);
    socketSessions.delete(ws);
    if (notify) {
      broadcastSysMsg(`${username} left the chat, connection lost`);
    }
  }
  if (session?.sessionId) {
    globals.sessionStore.destroy(session.sessionId);
  }
}
