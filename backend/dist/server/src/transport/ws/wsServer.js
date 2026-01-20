"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWsServer = void 0;
const ws_1 = require("ws");
const constants_1 = require("../../config/constants");
const wsRouter_1 = require("./wsRouter");
const store_1 = require("../../state/store");
const sessionService_1 = require("../../services/sessionService");
const startWsServer = () => {
    const server = new ws_1.WebSocketServer({ port: constants_1.WS_PORT });
    server.on('connection', response => {
        (0, store_1.incrementUsers)();
        const address = server.options.host;
        const port = server.options.port;
        console.log(`Server is running at ws://${address}:${port}`);
        response.on('message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, wsRouter_1.handleMessage)(server, response, data);
        }));
        response.on('close', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, sessionService_1.purgeUserOnDisconnect)(response);
        }));
    });
    return server;
};
exports.startWsServer = startWsServer;
//# sourceMappingURL=wsServer.js.map