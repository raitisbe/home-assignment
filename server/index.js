import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import querystring from 'node:querystring';

const HTTP_PORT = 8080;

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
const activeClients = new Map();

wss.on('connection', function connection(ws, request, client) {
  ws.on('message', function message(data) {
    console.log(`Received message ${data} from user ${client}`);
  });
});

function authenticate(request, cb){
  const params = querystring.parse(request.url.substr(request.url.indexOf('?') + 1));
  if(!params.username) {
    return cb('Username missing');
  }
  if(activeClients.get(params.username)) {
    return cb('Username taken');
  }
  activeClients.set(params.username, {username: params.username});
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
