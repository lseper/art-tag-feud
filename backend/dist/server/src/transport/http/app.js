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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpApp = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const rooms_1 = require("./routes/rooms");
const bots_1 = require("./routes/bots");
const createHttpApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.get('/health', (_req, res) => {
        res.json({ ok: true });
    });
    // Image proxy for puzzle mode - relays e621 images with CORS headers
    app.get('/api/proxy-image', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const url = req.query.url;
        if (!url) {
            res.status(400).json({ error: 'url query param required' });
            return;
        }
        try {
            const upstream = yield axios_1.default.get(url, {
                responseType: 'stream',
                headers: {
                    'User-Agent': `e621-tag-feud/1.1 - by ${(_a = process.env.E621_USERNAME) !== null && _a !== void 0 ? _a : 'unknown'}`,
                },
            });
            res.set('Content-Type', (_b = upstream.headers['content-type']) !== null && _b !== void 0 ? _b : 'image/jpeg');
            res.set('Cache-Control', 'public, max-age=86400');
            res.set('Access-Control-Allow-Origin', '*');
            upstream.data.pipe(res);
        }
        catch (err) {
            console.error('proxy-image error:', err.message);
            res.status(502).json({ error: 'upstream fetch failed' });
        }
    }));
    app.use('/rooms', (0, rooms_1.createRoomsRouter)());
    app.use('/bots', (0, bots_1.createBotsRouter)());
    return app;
};
exports.createHttpApp = createHttpApp;
//# sourceMappingURL=app.js.map