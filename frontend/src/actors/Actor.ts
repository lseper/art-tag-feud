import type { PostTagType } from '../types';

export interface Actor {
    id: string;
    isBot: boolean;
    selectIcon: (roomID: string, icon: string) => void;
    readyUp: (roomID: string, ready: boolean) => void;
    guessTag: (roomID: string, tag: PostTagType) => void;
}
