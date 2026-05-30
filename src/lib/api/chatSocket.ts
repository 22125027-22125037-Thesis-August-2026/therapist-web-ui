import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { CHAT_WS_URL } from "./config";
import { getStoredToken } from "./http";
import type { ChannelMessage } from "./social";

const USER_QUEUE_DESTINATION = "/user/queue/messages";
const SEND_DESTINATION = "/app/chat.send";
const READ_DESTINATION = "/app/chat.read";

export interface ChatSocketHandlers {
  /** Fired whenever a message arrives on /user/queue/messages. */
  onMessage?: (msg: ChannelMessage) => void;
  /** Fired when the underlying socket connects (initial + reconnect). */
  onConnect?: () => void;
  /** Fired when the underlying socket disconnects. */
  onDisconnect?: () => void;
  /** Fired when STOMP reports an error frame or the WebSocket errors. */
  onError?: (err: unknown) => void;
}

/**
 * Long-lived chat WebSocket client. One instance per logged-in session.
 *
 * The social service exposes STOMP directly (not behind the nginx gateway),
 * so we hit it on its own host:port via `VITE_CHAT_WS_URL`.
 */
export class ChatSocket {
  private client: Client;
  private subscription: StompSubscription | null = null;
  private handlers: ChatSocketHandlers = {};

  constructor(token?: string | null) {
    const jwt = token ?? getStoredToken();

    this.client = new Client({
      brokerURL: CHAT_WS_URL,
      connectHeaders: jwt ? { Authorization: `Bearer ${jwt}` } : undefined,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {
        // silenced; flip to console.log when debugging
      },
      onConnect: () => {
        this.subscription = this.client.subscribe(USER_QUEUE_DESTINATION, (frame: IMessage) => {
          try {
            const parsed = JSON.parse(frame.body) as ChannelMessage;
            this.handlers.onMessage?.(parsed);
          } catch (err) {
            this.handlers.onError?.(err);
          }
        });
        this.handlers.onConnect?.();
      },
      onDisconnect: () => {
        this.subscription = null;
        this.handlers.onDisconnect?.();
      },
      onStompError: (frame) => {
        this.handlers.onError?.(new Error(frame.headers["message"] ?? "STOMP error"));
      },
      onWebSocketError: (event) => {
        this.handlers.onError?.(event);
      },
    });
  }

  setHandlers(handlers: ChatSocketHandlers) {
    this.handlers = handlers;
  }

  activate() {
    if (!this.client.active) this.client.activate();
  }

  async deactivate() {
    if (this.client.active) await this.client.deactivate();
  }

  /** True once CONNECTED frame has been received. */
  get connected() {
    return this.client.connected;
  }

  send(channelId: string, content: string) {
    if (!this.client.connected) {
      throw new Error("chat socket not connected");
    }
    this.client.publish({
      destination: SEND_DESTINATION,
      body: JSON.stringify({ channelId, content }),
      headers: { "content-type": "application/json" },
    });
  }

  markRead(channelId: string, messageId: string) {
    if (!this.client.connected) return;
    this.client.publish({
      destination: READ_DESTINATION,
      body: JSON.stringify({ channelId, messageId }),
      headers: { "content-type": "application/json" },
    });
  }
}
