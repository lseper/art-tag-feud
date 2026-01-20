import express from 'express';
import { createRoomsRouter } from './routes/rooms';

const createHttpApp = () => {
    const app = express();
    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.json({ ok: true });
    });

    app.use('/rooms', createRoomsRouter());

    return app;
};

export { createHttpApp };
