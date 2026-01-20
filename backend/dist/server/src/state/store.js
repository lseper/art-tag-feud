"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNumUsers = exports.decrementUsers = exports.incrementUsers = exports.activeGames = exports.userSockets = exports.users = exports.rooms = void 0;
let numUsers = 0;
const rooms = new Map();
exports.rooms = rooms;
const users = new Map();
exports.users = users;
const userSockets = new Map();
exports.userSockets = userSockets;
const activeGames = new Map();
exports.activeGames = activeGames;
const incrementUsers = () => {
    numUsers += 1;
};
exports.incrementUsers = incrementUsers;
const decrementUsers = () => {
    numUsers -= 1;
};
exports.decrementUsers = decrementUsers;
const getNumUsers = () => numUsers;
exports.getNumUsers = getNumUsers;
//# sourceMappingURL=store.js.map