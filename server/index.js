import { Server } from "http";
import express from "express";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";
import querystring from "node:querystring";

import { trackActivity } from "./activity-tracking.js";
import { HTTP_PORT, LOG_MESSAGES } from "./config.js";
import { broadcastSysMsg, distributeMessage } from "./messaging.js";
import { log } from "./logging.js";
import {
  activeClients,
  cleanUpClient,
  socketSessions,
} from "./socket-sessions.js";
import { globals } from "./global.js";
import {
  authenticate,
  authenticateWs,
  sessionStore,
  setupSecurity,
} from "./security.js";

//https://github.com/websockets/ws

export const app = express();
const server = Server(app);
export const wss = new WebSocketServer({ noServer: true });

globals.wss = wss;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
setupSecurity(app);
app.use(express.static("public-client"));
app.use(express.json());
app.post(`/auth`, authenticate);

wss.on("connection", function connection(ws, request, client) {
  log("Client connected");
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true; //See activity-tracking
  });
  ws.on("message", function message(data) {
    try {
      const session = socketSessions.get(client);
      const username = session.username;
      if (!username) return;
      const dec = new TextDecoder("utf-8");
      const wrapper = { sender: username, text: dec.decode(data) };
      if (LOG_MESSAGES) {
        log(`Received message ${data} from user ${username}`);
      }
      session.lastActive = new Date();
      distributeMessage(wrapper);
    } catch (ex) {
      log("Bad message was received and error occurred", ex);
    }
  });

  ws.on("close", function close(code, reason) {
    log("Client disconnected");
    cleanUpClient(ws, true);
  });
});

trackActivity(wss);

server.on("upgrade", function upgrade(request, socket, head) {
  try {
    const params = querystring.parse(
      request.url.substr(request.url.indexOf("?") + 1)
    );
    const sessionId = params.sessionId;
    sessionStore.get(sessionId, (error, session) => {
      const username = session?.username;

      authenticateWs(username, function next(err) {
        if (err) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          log(`Closing socket due to missing authentication: `, err);
          socket.destroy();
          return;
        }

        wss.handleUpgrade(request, socket, head, function done(ws) {
          activeClients.set(username, { username, client: ws });
          socketSessions.set(ws, {
            lastActive: new Date(),
            username,
            sessionId,
          });
          wss.emit("connection", ws, request, ws);
        });
      });
    });
  } catch (ex) {
    log("Some error occurred during upgrading connection");
  }
});

server.listen(HTTP_PORT);
log(`HTTP Server listening on ${HTTP_PORT}. Open: `);
log(`http://localhost:${HTTP_PORT}`);
log(`Connect to ws://localhost:${HTTP_PORT}/websocket/wsserver?sessionId=***`);

["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
  process.on(signal, () => {
    console.log(`Server is terminating due to ${signal}`);
    broadcastSysMsg("Server has terminated");
    process.exit();
  })
);
