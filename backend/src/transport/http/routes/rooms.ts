import { Router } from 'express';
import { getAllRooms, getRoom } from '../../../services/roomService';
import { convertServerRoomToClientRoom } from '../../../domain/roomUtils';
import { users } from '../../../state/store';

const createRoomsRouter = () => {
    const router = Router();

    router.get('/', (_req, res) => {
        const rooms = getAllRooms();
        res.json({ rooms });
    });

    router.get('/:roomID', (req, res) => {
        const room = getRoom(req.params.roomID);
        if (!room) {
            res.status(404).json({ error: 'Room not found' });
            return;
        }
        const roomToClient = convertServerRoomToClientRoom(room, users);
        res.json({ room: roomToClient });
    });

    return router;
};

export { createRoomsRouter };
