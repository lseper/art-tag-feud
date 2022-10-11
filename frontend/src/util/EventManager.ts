import { SocketCallBack } from "./ConnectionManager";
import type { EventTypeType } from '../types'

export default class EventManager {
    private events: Map<EventTypeType, Set<(...args: any[]) => void | Promise<void>>>;

    public constructor() {
        this.events = new Map();
    }

    public listen<T>(event_name: EventTypeType, callback: SocketCallBack<T>) {
        if(!this.events.get(event_name)) {
            // setup dummy function
            this.events.set(event_name, new Set<(...args: any[]) => void>());
        }
        this.events.get(event_name)!.add(callback);
        return () => {
            this.events.get(event_name)?.delete(callback);
        }
    }

    public dispatch<T>(event_name: EventTypeType, data: T) {
        if(this.events.has(event_name)) {
            this.events.get(event_name)!.forEach((handler) => handler(data));
        }
    }
}