import { Server } from "http";
import express from "express";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";
import querystring from "node:querystring";
import session from "express-session";
import { MemoryStore } from "express-session";
import cors from "cors";

import { trackActivity } from "./activity-tracking.js";
import { HTTP_PORT, LOG_MESSAGES, serverUrl, SESSION_SECRET } from "./config.js";
import { broadcastSysMsg, distributeMessage } from "./messaging.js";
import { log } from "./logging.js";
import {
  activeClients,
  cleanUpClient,
  socketSessions,
} from "./socket-sessions.js";
import { globals } from "./global.js";

//https://github.com/websockets/ws

const app = express();
const server = Server(app);
export const wss = new WebSocketServer({ noServer: true });

globals.wss = wss;

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (serverUrl == origin) {
        callback(null, true);
      } else if (
        !origin ||
        (origin && origin.indexOf("http://localhost") > -1)
      ) {
        callback(null, true);
      } else {
        callback(new Error(origin + " Not allowed by CORS"));
      }
    },
  })
);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

//Memory store is not for production - doesn't scale well and does not persist
const sessionStore = new MemoryStore();
globals.sessionStore = sessionStore;
const sessionParser = session({
  secret: SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
});
app.use(sessionParser);

function authenticate(req, res) {
  const username = req.body.username;
  if (!username) {
    return res.status(403).json({
      success: false,
      message: "Username missing",
    });
  }
  if (activeClients.get(username)) {
    return res.status(403).json({
      success: false,
      message: "Failed to connect. Nickname already taken.",
    });
  }
  req.session.username = username;
  return res.status(200).json({
    success: true,
    sessionId: req.session.id,
  });
}

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
    const session = socketSessions.get(client);
    const username = session.username;
    const dec = new TextDecoder("utf-8");
    //TODO validate
    const wrapper = { sender: username, text: dec.decode(data) };
    if (LOG_MESSAGES) {
      log(`Received message ${data} from user ${username}`);
    }
    session.lastActive = new Date();
    distributeMessage(wrapper);
  });

  ws.on("close", function close(code, reason) {
    log("Client disconnected");
    cleanUpClient(ws, true);
  });
});

trackActivity(wss);

function authenticateWs(username, cb) {
  if (!username) {
    return cb("Username missing");
  }
  log(`Socket for ${username} authenticated`);
  cb(null); //null error
}

server.on("upgrade", function upgrade(request, socket, head) {
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
        socketSessions.set(ws, { lastActive: new Date(), username, sessionId });
        wss.emit("connection", ws, request, ws);
      });
    });
  });
});

server.listen(HTTP_PORT);
log(`HTTP Server listening on ${HTTP_PORT}. Open: `);
log(`http://localhost:${HTTP_PORT}`);
log(`Connect to ws://localhost:${HTTP_PORT}/websocket/wsserver?sessionId=***`);

['SIGINT', 'SIGTERM', 'SIGQUIT']
  .forEach(signal => process.on(signal, () => {
    console.log(`Server is terminating due to ${signal}`);
    broadcastSysMsg('Server has terminated');
    process.exit();
  }));