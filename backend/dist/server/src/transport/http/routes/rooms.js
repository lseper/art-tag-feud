"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomsRouter = void 0;
const express_1 = require("express");
const roomService_1 = require("../../../services/roomService");
const roomUtils_1 = require("../../../domain/roomUtils");
const store_1 = require("../../../state/store");
const createRoomsRouter = () => {
    const router = (0, express_1.Router)();
    router.get('/', (_req, res) => {
        const rooms = (0, roomService_1.getAllRooms)();
        res.json({ rooms });
    });
    router.get('/:roomID', (req, res) => {
        const room = (0, roomService_1.getRoom)(req.params.roomID);
        if (!room) {
            res.status(404).json({ error: 'Room not found' });
            return;
        }
        const roomToClient = (0, roomUtils_1.convertServerRoomToClientRoom)(room, store_1.users);
        res.json({ room: roomToClient });
    });
    return router;
};
exports.createRoomsRouter = createRoomsRouter;
//# sourceMappingURL=rooms.js.map