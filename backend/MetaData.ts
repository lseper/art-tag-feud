import { WebSocket } from "ws";
import { SocketEventType } from "./util/ServerEventTypes";

export enum TagType {
    General = "general",
    Species = "species",
    Character = "character",
    Artist = "artist"
}

export interface Post {
    id: number;
    url: string;
    tags: ITag[]
}

export interface ITag {
    name: string;
    type: TagType;
    score: number
}

export interface User {
    username: string,
    id: string,
    score: number,
    socket: WebSocket,
}

export interface Room {
    id: string,
    members: User[]
}

export interface ServerData {
    type: SocketEventType,
    data: any
}

export enum ServerEvent {
    'default',
    'create_user',
    'create_room',
    'guess_tag',
    'set_username',
    'join_room'
}