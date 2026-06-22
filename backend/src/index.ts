import 'dotenv/config';
import { createHttpApp } from './transport/http/app';
import { startWsServer } from './transport/ws/wsServer';
import { HTTP_PORT } from './config/constants';

const app = createHttpApp();

app.listen(HTTP_PORT, () => {
    console.log(`HTTP server listening on http://localhost:${HTTP_PORT}`);
});

startWsServer();
