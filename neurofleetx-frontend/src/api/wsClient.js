import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;

export const connectWebSocket = (onMessageReceived) => {
  const socket = new SockJS("http://localhost:8080/ws-telemetry");
  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    debug: (str) => console.log(str),
  });

  stompClient.onConnect = () => {
    stompClient.subscribe("/topic/telemetry", (msg) => {
      const vehicle = JSON.parse(msg.body);
      onMessageReceived(vehicle);
    });
  };

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient) stompClient.deactivate();
};
