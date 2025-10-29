import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

let stompClient = null;

export const connectBookingSocket = (onMessage) => {
  const socket = new SockJS(
    `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/ws`
  );
  stompClient = Stomp.over(socket);
  stompClient.connect({}, () => {
    stompClient.subscribe("/topic/bookings", (msg) => {
      const data = JSON.parse(msg.body);
      onMessage(data);
    });
  });
};

export const disconnectBookingSocket = () => {
  if (stompClient) stompClient.disconnect();
};
