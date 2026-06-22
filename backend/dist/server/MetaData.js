"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerEvent = exports.TagType = void 0;
var TagType;
(function (TagType) {
    TagType["General"] = "general";
    TagType["Species"] = "species";
    TagType["Character"] = "character";
    TagType["Artist"] = "artist";
})(TagType = exports.TagType || (exports.TagType = {}));
var ServerEvent;
(function (ServerEvent) {
    ServerEvent[ServerEvent["default"] = 0] = "default";
    ServerEvent[ServerEvent["create_user"] = 1] = "create_user";
    ServerEvent[ServerEvent["create_room"] = 2] = "create_room";
    ServerEvent[ServerEvent["guess_tag"] = 3] = "guess_tag";
    ServerEvent[ServerEvent["set_username"] = 4] = "set_username";
    ServerEvent[ServerEvent["join_room"] = 5] = "join_room";
})(ServerEvent = exports.ServerEvent || (exports.ServerEvent = {}));
//# sourceMappingURL=MetaData.js.map