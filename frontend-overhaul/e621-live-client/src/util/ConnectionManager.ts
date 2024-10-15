import EventManager from "./EventManager";
import type { EventTypeType } from "../types";
import config from '../components/config/constants';

export type SocketCallBack<T> = (data: T) => void | Promise<void>;

export class ConnectionManager {
    private static instance: ConnectionManager;
    private socket: WebSocket;
    private eventManager = new EventManager();

    private queue: string[];

    public connecting = true;

    /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() {
        this.socket = new WebSocket(config.url);
        this.queue = [];
        this.socket.onopen = () => {
            this.connecting = false;
            this.queue.forEach(data => this.socket.send(data));
            this.queue = [];
        }

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.eventManager.dispatch(data.type, data);
        }

        this.socket.onclose = (event) => {
            this.connecting = true;
        }
    }

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    public static getInstance(): ConnectionManager {
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
        }
        return ConnectionManager.instance;
    }

    public listen<T>(event_name: EventTypeType, callback: SocketCallBack<T>) {
        return this.eventManager.listen(event_name, callback);
    }

    public send<T>(data: T) {
        if(this.connecting) {
            this.queue.push(JSON.stringify({...data}))
        } else {
            this.socket.send(JSON.stringify({...data}));
        }
    }

    public cleanup() {
        this.socket.close();
    }
}