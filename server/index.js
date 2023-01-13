import { createServer } from "http";
import { WebSocketServer } from "ws";
import querystring from "node:querystring";
import { HTTP_PORT } from "./config.js";
import { distributeMessage } from "./messaging.js";
import { trackActivity } from "./activity-tracking.js";
import { log } from "./logging.js";
import { activeClients, cleanUpClient, socketSessions } from "./socket-sessions.js";

//https://github.com/websockets/ws

const server = createServer();
export const wss = new WebSocketServer({ noServer: true });

wss.on("connection", function connection(ws, request, client) {
  log("Client connected");
  ws.on("message", function message(data) {
    const session = socketSessions.get(client);
    const username = session.username;
    const dec = new TextDecoder("utf-8");
    //TODO validate
    const wrapper = { sender: username, text: dec.decode(data) };
    log(`Received message ${data} from user ${username}`);
    session.lastActive = new Date();
    distributeMessage(wss, wrapper);
  });

  ws.on("close", function close(code, reason) {
    log("Client disconnected");
    cleanUpClient(wss, ws, true);
  });
});

trackActivity(wss);

function authenticate(username, cb) {
  if (!username) {
    return cb("Username missing");
  }
  if (activeClients.get(username)) {
    return cb("Username taken");
  }

  log(`${username} authenticated`);
  cb(null); //null error
}

server.on("upgrade", function upgrade(request, socket, head) {
  /* If password protection is needed this would need to be rewritten 
  with a separate POST request which creates a session. This 
  request to get socket would be made afterwards */
  const params = querystring.parse(
    request.url.substr(request.url.indexOf("?") + 1)
  );
  const username = params.username;

  authenticate(username, function next(err) {
    if (err) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      log(`Closing socket due to missing authentication: `, err);
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, function done(ws) {
      activeClients.set(username, { username, client: ws });
      socketSessions.set(ws, { lastActive: new Date(), username });
      wss.emit("connection", ws, request, ws);
    });
  });
});

server.listen(HTTP_PORT);
log(
  `HTTP Server listening on ${HTTP_PORT}. Connect to ws://localhost:${HTTP_PORT}/websocket/wsserver`
);
