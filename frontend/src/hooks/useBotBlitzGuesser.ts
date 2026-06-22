import { useEffect, useMemo, useRef } from 'react';
import type { GameModeType, GuessedTagEntryType, PostTagType, UserReadyStateType } from '../types';
import type { ConnectionManager } from '../util/ConnectionManager';
import { EventType } from '../types';
import { BotActor } from '../actors/BotActor';
import { fetchBotBehaviors, getBehaviorFor, type BotModeBehavior } from '../util/botBehaviors';

type PaceRange = { minMs: number; maxMs: number };

const ROUND_DURATION_MS = 30000;
const READY_DELAY_MIN_MS = 24000;
const READY_DELAY_MAX_MS = 30000;

const randomBetween = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
};

const useBotBlitzGuesser = (
    tags: PostTagType[],
    guessedTags: GuessedTagEntryType[],
    readyStates: UserReadyStateType[],
    roomID: string | undefined,
    userID: string | undefined,
    ownerID: string | undefined,
    connectionManager: ConnectionManager,
    gameMode: GameModeType,
) => {
    const isOwner = Boolean(userID && ownerID && userID === ownerID);
    const botStates = useMemo(() => readyStates.filter(state => state.user.isBot), [readyStates]);

    const tagsRef = useRef<PostTagType[]>(tags);
    const guessedRef = useRef<Set<string>>(new Set());
    const readyStatesRef = useRef<UserReadyStateType[]>(readyStates);
    const behaviorRef = useRef<BotModeBehavior[]>([]);
    const guessTimeoutsRef = useRef<Map<string, number>>(new Map());
    const readyTimeoutsRef = useRef<Map<string, number>>(new Map());
    const paceRef = useRef<Map<string, PaceRange>>(new Map());

    useEffect(() => {
        tagsRef.current = tags;
    }, [tags]);

    useEffect(() => {
        guessedRef.current = new Set(guessedTags.map(entry => entry.tag.name));
    }, [guessedTags]);

    useEffect(() => {
        readyStatesRef.current = readyStates;
    }, [readyStates]);

    useEffect(() => {
        fetchBotBehaviors().then(behaviors => {
            behaviorRef.current = behaviors;
        });
    }, []);

    useEffect(() => {
        if (!isOwner || !roomID || gameMode !== 'Blitz') {
            return;
        }

        guessTimeoutsRef.current.forEach(timeout => window.clearTimeout(timeout));
        guessTimeoutsRef.current.clear();
        readyTimeoutsRef.current.forEach(timeout => window.clearTimeout(timeout));
        readyTimeoutsRef.current.clear();
        paceRef.current.clear();

        botStates.forEach(state => {
            const bot = new BotActor(
                state.user.id,
                state.user.username,
                connectionManager,
                state.user.botProfileId,
            );

            const behavior = getBehaviorFor(
                behaviorRef.current,
                state.user.botProfileId,
                gameMode,
            );
            const baseMin = behavior?.guessIntervalMinMs ?? 2000;
            const baseMax = behavior?.guessIntervalMaxMs ?? 10000;
            const roundMin = clamp(randomBetween(baseMin, baseMax), 2000, 10000);
            const roundMax = clamp(randomBetween(roundMin, baseMax), 2000, 10000);
            paceRef.current.set(bot.id, { minMs: roundMin, maxMs: roundMax });

            const scheduleGuess = () => {
                const pace = paceRef.current.get(bot.id);
                if (!pace) return;
                const currentReadyState = readyStatesRef.current.find(entry => entry.user.id === bot.id);
                if (currentReadyState?.ready) {
                    return;
                }
                const hiddenTags = tagsRef.current.filter(tag => !guessedRef.current.has(tag.name));
                if (hiddenTags.length === 0) {
                    return;
                }
                const nextTag = hiddenTags[Math.floor(Math.random() * hiddenTags.length)];
                bot.guessTag(roomID, nextTag);
                const delay = randomBetween(pace.minMs, pace.maxMs);
                const timeoutId = window.setTimeout(scheduleGuess, delay);
                guessTimeoutsRef.current.set(bot.id, timeoutId);
            };

            const initialDelay = randomBetween(roundMin, roundMax);
            const timeoutId = window.setTimeout(scheduleGuess, initialDelay);
            guessTimeoutsRef.current.set(bot.id, timeoutId);

            const readyDelay = randomBetween(READY_DELAY_MIN_MS, READY_DELAY_MAX_MS);
            const readyTimeoutId = window.setTimeout(() => {
                const currentReadyState = readyStatesRef.current.find(entry => entry.user.id === bot.id);
                if (!currentReadyState?.ready) {
                    const data = {
                        type: EventType.enum.READY_UP,
                        userID: bot.id,
                        roomID,
                        ready: true,
                    };
                    connectionManager.send(data);
                }
            }, readyDelay);
            readyTimeoutsRef.current.set(bot.id, readyTimeoutId);
        });

        return () => {
            guessTimeoutsRef.current.forEach(timeout => window.clearTimeout(timeout));
            guessTimeoutsRef.current.clear();
            readyTimeoutsRef.current.forEach(timeout => window.clearTimeout(timeout));
            readyTimeoutsRef.current.clear();
            paceRef.current.clear();
        };
    }, [botStates, connectionManager, gameMode, isOwner, roomID, tags]);
};

export default useBotBlitzGuesser;
