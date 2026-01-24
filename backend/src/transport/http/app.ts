import express from 'express';
import { createRoomsRouter } from './routes/rooms';
import { createBotsRouter } from './routes/bots';

const createHttpApp = () => {
    const app = express();
    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.json({ ok: true });
    });

    app.use('/rooms', createRoomsRouter());
    app.use('/bots', createBotsRouter());

    return app;
};

export { createHttpApp };
