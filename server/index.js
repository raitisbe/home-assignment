import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import querystring from 'node:querystring';
import { ENABLE_LOG } from './config.js';
const HTTP_PORT = 8080;

//https://github.com/websockets/ws

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
/** Store which sockets are mapped to which usernames */
const activeClients = new Map();
/** Store which usernames are mapped to which sockets */
const clientUsers = new Map();

function log() {
  if (ENABLE_LOG) {
    for (let i = 0; i < arguments.length; i++) {
      console.log(new Array(i + 1).join('\t') + arguments[i]);
    }
  }
}

wss.on('connection', function connection(ws, request, client) {
  log('Client connected');
  ws.on('message', function message(data) {
    const user = clientUsers.get(client);
    const dec = new TextDecoder("utf-8");
    const wrapper = {sender: user, text: dec.decode(data)};
    log(`Received message ${data} from user ${user}`);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(wrapper), { binary: false });
      }
    });
  });

  ws.on('close', function close(code, reason) {
    log('Client disconnected');
    const user = clientUsers.get(ws);
    if (user) {
      activeClients.delete(user);
      log(`Free up ${user} username`);
      clientUsers.delete(ws);
    }
  });
});



function authenticate(username, cb){
  if(!username) {
    return cb('Username missing');
  }
  if(activeClients.get(username)) {
    return cb('Username taken');
  }
  
  log(`${username} authenticated`);
  cb(null) //null error
}

server.on('upgrade', function upgrade(request, socket, head) {
  
  const params = querystring.parse(request.url.substr(request.url.indexOf('?') + 1));
  const username = params.username;

  authenticate(username, function next(err) {
    if (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      log(`Closing socket due to missing authentication: `, err);
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, function done(ws) {
      activeClients.set(username, {username, client: ws});
      clientUsers.set(ws, username);
      wss.emit('connection', ws, request, ws);
    });
  });
});

server.listen(HTTP_PORT);
log(`HTTP Server listening on ${HTTP_PORT}. Connect to ws://localhost:${HTTP_PORT}/websocket/wsserver`)
