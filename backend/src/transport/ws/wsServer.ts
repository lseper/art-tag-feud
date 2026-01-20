import { WebSocketServer } from 'ws';
import { WS_PORT } from '../../config/constants';
import { handleMessage } from './wsRouter';
import { incrementUsers } from '../../state/store';
import { purgeUserOnDisconnect } from '../../services/sessionService';

const startWsServer = () => {
    const server = new WebSocketServer({ port: WS_PORT });

    server.on('connection', response => {
        incrementUsers();
        const address = server.options.host;
        const port = server.options.port;
        console.log(`Server is running at ws://${address}:${port}`);

        response.on('message', async (data) => {
            await handleMessage(server, response, data);
        });

        response.on('close', async () => {
            await purgeUserOnDisconnect(response);
        });
    });

    return server;
};

export { startWsServer };
