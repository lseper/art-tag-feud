import { WebSocket } from 'ws';

const socket = new WebSocket('ws://localhost:8082');

  socket.addEventListener("open", () => {
    console.log("Connected to server, (from client)");
});

