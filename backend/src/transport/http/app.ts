import express from 'express';
import axios from 'axios';
import { createRoomsRouter } from './routes/rooms';
import { createBotsRouter } from './routes/bots';

const createHttpApp = () => {
    const app = express();
    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.json({ ok: true });
    });

    // Image proxy for puzzle mode - relays e621 images with CORS headers
    app.get('/api/proxy-image', async (req, res) => {
        const url = req.query.url as string;
        if (!url) {
            res.status(400).json({ error: 'url query param required' });
            return;
        }
        try {
            const upstream = await axios.get(url, {
                responseType: 'stream',
                headers: {
                    'User-Agent': `e621-tag-feud/1.1 - by ${process.env.E621_USERNAME ?? 'unknown'}`,
                },
            });
            res.set('Content-Type', upstream.headers['content-type'] ?? 'image/jpeg');
            res.set('Cache-Control', 'public, max-age=86400');
            res.set('Access-Control-Allow-Origin', '*');
            upstream.data.pipe(res);
        } catch (err: any) {
            console.error('proxy-image error:', err.message);
            res.status(502).json({ error: 'upstream fetch failed' });
        }
    });

    app.use('/rooms', createRoomsRouter());
    app.use('/bots', createBotsRouter());

    return app;
};

export { createHttpApp };
