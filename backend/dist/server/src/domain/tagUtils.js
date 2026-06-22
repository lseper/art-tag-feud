"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTag = void 0;
const normalizeTag = (tag) => {
    return tag.trim().toLowerCase().replace(/\s+/g, "_");
};
exports.normalizeTag = normalizeTag;
//# sourceMappingURL=tagUtils.js.map