import type { WebSocketServer as WebSocketServerType, WebSocket as WebSocketType } from 'ws';
import { WebSocket } from 'ws';
import type { ServerRoomType } from '../../domain/contracts';
import { userSockets } from '../../state/store';

const broadcast = <T>(server: WebSocketServerType, data: T) => {
    const dataToString = JSON.stringify(data);
    server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dataToString);
        }
    });
};

const reply = <T>(client: WebSocketType, data: T) => {
    const dataToString = JSON.stringify(data);
    if (client.readyState === WebSocket.OPEN) {
        client.send(dataToString);
    }
};

const broadcastToRoom = <T>(room: ServerRoomType, data: T) => {
    const dataToString = JSON.stringify(data);
    const userSocketsToSend = room.members.map(user => userSockets.get(user.id));
    userSocketsToSend.forEach(socket => {
        if (socket != null && socket.readyState === WebSocket.OPEN) {
            socket.send(dataToString);
        }
    });
};

export { broadcast, reply, broadcastToRoom };
