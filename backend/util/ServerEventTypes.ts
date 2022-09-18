import { ITag } from "../MetaData";

export type SocketCallBack<T> = (data: T) => void | Promise<void>;

export enum SocketEventType {
    'default',
    'create_user',
    'create_room',
    'guess_tag',
    'set_username',
    'join_room'
}

// Old
// export enum ServerEvent {
//     'default',
//     'create_user',
//     'create_room',
//     'guess_tag',
//     'set_username',
//     'join_room'
// }

export type EventData = {
    type: SocketEventType
}

export type CreateUserEventData = {
    id: string,
    username: string,
    score: number,
} & EventData

// TODO: Make this
export type CreateRoomEventData = {
    
} & EventData

export type GuessTagEventData = {
    tag: ITag
} & EventData

export type SetUsernameEventData = {
    username: string
} & EventData

// TODO: make this
export type JoinRoomEventData = {

}