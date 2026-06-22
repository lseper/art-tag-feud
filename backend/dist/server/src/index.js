"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./transport/http/app");
const wsServer_1 = require("./transport/ws/wsServer");
const constants_1 = require("./config/constants");
const app = (0, app_1.createHttpApp)();
app.listen(constants_1.HTTP_PORT, () => {
    console.log(`HTTP server listening on http://localhost:${constants_1.HTTP_PORT}`);
});
(0, wsServer_1.startWsServer)();
//# sourceMappingURL=index.js.map