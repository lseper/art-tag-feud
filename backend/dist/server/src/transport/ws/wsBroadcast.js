"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastToRoom = exports.reply = exports.broadcast = void 0;
const ws_1 = require("ws");
const store_1 = require("../../state/store");
const broadcast = (server, data) => {
    const dataToString = JSON.stringify(data);
    server.clients.forEach(client => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(dataToString);
        }
    });
};
exports.broadcast = broadcast;
const reply = (client, data) => {
    const dataToString = JSON.stringify(data);
    if (client.readyState === ws_1.WebSocket.OPEN) {
        client.send(dataToString);
    }
};
exports.reply = reply;
const broadcastToRoom = (room, data) => {
    const dataToString = JSON.stringify(data);
    const userSocketsToSend = room.members.map(user => store_1.userSockets.get(user.id));
    userSocketsToSend.forEach(socket => {
        if (socket != null && socket.readyState === ws_1.WebSocket.OPEN) {
            socket.send(dataToString);
        }
    });
};
exports.broadcastToRoom = broadcastToRoom;
//# sourceMappingURL=wsBroadcast.js.map