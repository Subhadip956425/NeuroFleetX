import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { config } from "../config/config";

let stompClient = null;

export const connectWebSocket = (onMessage) => {
  if (!config.ENABLE_WEBSOCKET) {
    console.log("ℹ️ WebSocket disabled in config");
    return;
  }

  try {
    const socket = new SockJS(config.WS_TELEMETRY_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = () => {};

    stompClient.connect({}, () => {
      console.log("✅ Telemetry WebSocket connected");
      stompClient.subscribe("/topic/telemetry", (message) => {
        onMessage(JSON.parse(message.body));
      });
    });
  } catch (error) {
    console.warn(
      "WebSocket connection failed, continuing without real-time updates"
    );
  }
};

export const disconnectWebSocket = () => {
  if (stompClient?.connected) {
    stompClient.disconnect();
  }
};
