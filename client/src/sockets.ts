import { Subject } from "rxjs";
import { WEBSOCKET_SERVER_URL } from "./config";

export class SocketService {
  ws: WebSocket | null = null;

  onConnect = new Subject<void>();
  onError = new Subject<void>();
  onClose = new Subject<void>();
  onMessage = new Subject<{ sender: string; text: string; date: string }>();

  connect(sessionId: string) {
    if (this.ws) {
      this.ws.onerror = this.ws.onopen = this.ws.onclose = null;
      this.ws.close();
    }

    this.ws = new WebSocket(
      (WEBSOCKET_SERVER_URL ?? `ws://${window.location.hostname}:8080/websocket/wsserver`) + `?sessionId=${sessionId}`
    );
    this.ws.onerror = (e) => {
      this.onError.next();
    };

    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.sender && data.text) {
          this.onMessage.next(data);
        }
        if (data.system) {
          this.onMessage.next({ sender: "SYSTEM", text: data.system, date: data.date });
        }
      } catch (ex) {
        console.log(
          "Invalid message received or some other error occurred",
          ex
        );
      }
    };

    this.ws.onopen = () => {
      this.onConnect.next();
    };
    this.ws.onclose = (e) => {
      this.onClose.next();
      this.ws = null;
    };
  }

  send(draft: string) {
    this.ws?.send(draft);
  }

  disconnect() {
    this.ws?.close();
  }
}

export const socketService = new SocketService();
