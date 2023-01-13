import { INACTIVITY_PERIOD, INACTIVITY_POLL_PERIOD } from "./config.js";
import { log } from "./logging.js";
import { broadcastSysMsg } from "./messaging.js";
import { cleanUpClient, socketSessions } from "./socket-sessions.js";

/**
 * 
 * @param {WebSocketServer} wss 
 */
export function trackActivity(wss) {

  /**
   * This is different than inactivity and can happen due to power failure etc.,
   * but lets treat it the same as inactivity, just check less often.
   */
  const keepAliveInterval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) {
        const session = socketSessions.get(ws);
        if (session) {
          cleanUpClient(wss, ws, false);
          log('Socket is not alive anymore');
          broadcastSysMsg(
            wss,
            `${session.username} was disconnected due to inactivity`
          );
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  /**
   * Count time since last message and disconnect if over
   */
  const inactivityInterval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      const session = socketSessions.get(ws);
      const now = new Date();
      if (session) {
        const inactiveFor = (now - session.lastActive) / 1000;
        if (inactiveFor > INACTIVITY_PERIOD) {
          log(`Message not received for ${inactiveFor} seconds so closing.`);
          broadcastSysMsg(
            wss,
            `${session.username} was disconnected due to inactivity`
          );
          cleanUpClient(wss, ws, false);
          ws.close();
        }
      }
    });
  }, INACTIVITY_POLL_PERIOD * 1000);

  wss.on("close", function close() {
    clearInterval(keepAliveInterval);
    clearInterval(inactivityInterval);
  });
}
