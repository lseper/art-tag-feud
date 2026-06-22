import type { WebSocket } from 'ws';
import { decrementUsers, rooms, userSockets, users } from '../state/store';
import { removeRoomMember } from '../data/repos/roomMembersRepo';
import { deleteRoom, upsertRoom } from '../data/repos/roomsRepo';
import { upsertRoomReadyStates } from '../data/repos/roomReadyStateRepo';

const purgeUserOnDisconnect = async (userSocket: WebSocket) => {
    decrementUsers();
    const userEntry = [...userSockets.entries()].find(entry => {
        const [, socket] = entry;
        return userSocket === socket;
    });
    if (!userEntry) {
        return;
    }
    const userID = userEntry[0];
    userSockets.delete(userID);
    users.delete(userID);

    const roomToUpdateEntry = [...rooms.entries()].find(entry => {
        const [, room] = entry;
        return room.members.some(member => member.id === userID);
    });
    if (!roomToUpdateEntry) {
        return;
    }
    const [roomToUpdateID, roomToUpdate] = roomToUpdateEntry;
    roomToUpdate.allUsersReady.delete(userID);
    roomToUpdate.members = roomToUpdate.members.filter(member => member.id !== userID);
    rooms.set(roomToUpdateID, roomToUpdate);
    await removeRoomMember(roomToUpdateID, userID);

    let shouldDeleteRoom = false;
    if (roomToUpdate.owner.id === userID) {
        if (roomToUpdate.members.length === 0) {
            rooms.delete(roomToUpdateID);
            shouldDeleteRoom = true;
        } else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomToUpdateID, roomToUpdate);
        }
    }

    if (shouldDeleteRoom) {
        await deleteRoom(roomToUpdateID);
        return;
    }

    await upsertRoom(roomToUpdate);
    await upsertRoomReadyStates(roomToUpdate);
};

export { purgeUserOnDisconnect };
