"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpApp = void 0;
const express_1 = __importDefault(require("express"));
const rooms_1 = require("./routes/rooms");
const bots_1 = require("./routes/bots");
const createHttpApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.get('/health', (_req, res) => {
        res.json({ ok: true });
    });
    app.use('/rooms', (0, rooms_1.createRoomsRouter)());
    app.use('/bots', (0, bots_1.createBotsRouter)());
    return app;
};
exports.createHttpApp = createHttpApp;
//# sourceMappingURL=app.js.map