import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { config } from "../config/config";

let stompClient = null;

export const connectMaintenanceSocket = (onMessage) => {
  if (!config.ENABLE_WEBSOCKET) {
    console.log("ℹ️ Maintenance WebSocket disabled in config");
    return;
  }

  try {
    const socket = new SockJS(config.WS_MAINTENANCE_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = () => {};

    stompClient.connect({}, () => {
      console.log("✅ Maintenance WebSocket connected");
      stompClient.subscribe("/topic/maintenance", (message) => {
        onMessage(JSON.parse(message.body));
      });
    });
  } catch (error) {
    console.warn(
      "Maintenance WebSocket failed, continuing without real-time updates"
    );
  }
};

export const disconnectMaintenanceSocket = () => {
  if (stompClient?.connected) {
    stompClient.disconnect();
  }
};
