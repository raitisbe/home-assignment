import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import querystring from 'node:querystring';

const HTTP_PORT = 8080;

//https://github.com/websockets/ws

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
const activeClients = new Map();
const clientUsers = new Map();

wss.on('connection', function connection(ws, request, client) {
  ws.on('message', function message(data) {
    const user = clientUsers.get(client);
    const dec = new TextDecoder("utf-8");
    const wrapper = {sender: user, text: dec.decode(data)};
    console.log(`Received message ${data} from user ${user}`);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(wrapper), { binary: false });
      }
    });
  });
});

function authenticate(request, cb){
  const params = querystring.parse(request.url.substr(request.url.indexOf('?') + 1));
  const username = params.username;
  if(!username) {
    return cb('Username missing');
  }
  if(activeClients.get(username)) {
    return cb('Username taken');
  }
  activeClients.set(username, {username, client: request.client});
  clientUsers.set(request.client, username);
  cb(null, request.client)
}

server.on('upgrade', function upgrade(request, socket, head) {
  // This function is not defined on purpose. Implement it with your own logic.
  authenticate(request, function next(err, client) {
    if (err || !client) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request, client);
    });
  });
});

server.listen(HTTP_PORT);
console.log(`HTTP Server listening on ${HTTP_PORT}. Connect to ws://localhost:8080/websocket/wsserver`)
