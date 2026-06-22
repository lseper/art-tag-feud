"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEventType = void 0;
var SocketEventType;
(function (SocketEventType) {
    SocketEventType[SocketEventType["default"] = 0] = "default";
    SocketEventType[SocketEventType["create_user"] = 1] = "create_user";
    SocketEventType[SocketEventType["create_room"] = 2] = "create_room";
    SocketEventType[SocketEventType["guess_tag"] = 3] = "guess_tag";
    SocketEventType[SocketEventType["set_username"] = 4] = "set_username";
    SocketEventType[SocketEventType["join_room"] = 5] = "join_room";
})(SocketEventType = exports.SocketEventType || (exports.SocketEventType = {}));
//# sourceMappingURL=ServerEventTypes.js.map