import { Router } from 'express';
import { getBotModeBehaviors } from '../../../data/repos/botBehaviorsRepo';

const createBotsRouter = () => {
    const router = Router();

    router.get('/behaviors', async (_req, res) => {
        const behaviors = await getBotModeBehaviors();
        res.json({ behaviors });
    });

    return router;
};

export { createBotsRouter };
