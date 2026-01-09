import { io } from "socket.io-client";

const socket = io("https://pyrexxbook-kurah-backend.onrender.com", {
  transports: ["websocket"],
  withCredentials: true
});

export default socket;
