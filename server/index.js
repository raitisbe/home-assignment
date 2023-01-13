import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import querystring from "node:querystring";
import { ENABLE_LOG, HTTP_PORT, INACTIVITY_PERIOD } from "./config.js";

//https://github.com/websockets/ws

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
/** Store which sockets are mapped to which usernames */
const activeClients = new Map();
/** Store which usernames are mapped to which sockets */
const socketSessions = new Map();

function log() {
  if (ENABLE_LOG) {
    for (let i = 0; i < arguments.length; i++) {
      console.log(new Array(i + 1).join("\t") + arguments[i]);
    }
  }
}

wss.on("connection", function connection(ws, request, client) {
  log("Client connected");
  ws.on("message", function message(data) {
    const session = socketSessions.get(client);
    const username = session.username;
    const dec = new TextDecoder("utf-8");
    const wrapper = { sender: username, text: dec.decode(data) };
    log(`Received message ${data} from user ${username}`);
    session.lastActive = new Date();
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(wrapper), { binary: false });
      }
    });
  });

  ws.on("close", function close(code, reason) {
    log("Client disconnected");
    cleanUpClient(ws, true);
  });
});

/**
 * This is different than inactivity and can happen due to power failure etc.,
 * but lets treat it the same as inactivity, just check less often.
 */
const keepAliveInterval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      const session = socketSessions.get(ws);
      if (session) {
        cleanUpClient(ws, false);
        broadcastSysMsg(
          `${session.username} was disconnected due to inactivity`
        );
      }
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

const inactivityInterval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    const session = socketSessions.get(ws);
    const now = new Date();
    if (session) {
      const inactiveFor = (now - session.lastActive) / 1000;
      if (inactiveFor > INACTIVITY_PERIOD) {
        broadcastSysMsg(
          `${session.username} was disconnected due to inactivity`
        );
        cleanUpClient(ws, false);
        ws.close();
      }
    }
  });
}, 1000);

wss.on("close", function close() {
  clearInterval(keepAliveInterval);
  clearInterval(inactivityInterval);
});

function cleanUpClient(ws, notify) {
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
}

function broadcastSysMsg(message) {
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
