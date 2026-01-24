import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { GameModeType, RequestBotFillEventDataType, UserReadyStateType } from '../types';
import { EventType } from '../types';
import { icons } from '../util/UIUtil';
import speciesDataUntyped from '../data/tag-data-species.json';
import type { ConnectionManager } from '../util/ConnectionManager';

type SpeciesEntry = { name: string };
const speciesData = speciesDataUntyped as SpeciesEntry[];

const randomBetween = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const normalizeSpeciesName = (name: string) => {
    return name
        .replace(/\(.*?\)/g, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const calculateMaxBots = (humanCount: number) => {
    const scaledCap = Math.min(humanCount * 3, 9);
    if (humanCount > 4) {
        return Math.min(scaledCap, 3);
    }
    return scaledCap;
};

const generateBotNames = (count: number, existingNames: Set<string>) => {
    const names: string[] = [];
    let attempts = 0;
    while (names.length < count && attempts < count * 10) {
        attempts += 1;
        const species = speciesData[Math.floor(Math.random() * speciesData.length)];
        const base = normalizeSpeciesName(species?.name ?? 'Species');
        const suffix = randomBetween(1, 999);
        const candidate = `${base} ${suffix}`.trim();
        if (!existingNames.has(candidate)) {
            existingNames.add(candidate);
            names.push(candidate);
        }
    }
    return names;
};

const pickRandomIcon = (usedIcons: Set<string>) => {
    const availableIcons = icons.sfw.filter(icon => !usedIcons.has(icon));
    if (availableIcons.length === 0) {
        return icons.sfw[Math.floor(Math.random() * icons.sfw.length)];
    }
    return availableIcons[Math.floor(Math.random() * availableIcons.length)];
};

type BotTimeouts = {
    icon?: number;
    ready?: number;
};

const useBotManager = (
    connectionManager: ConnectionManager,
    roomID: string | undefined,
    userID: string | undefined,
    ownerID: string | undefined,
    readyStates: UserReadyStateType[],
    gameMode: GameModeType,
) => {
    const isOwner = Boolean(userID && ownerID && userID === ownerID);
    const pendingTimeoutsRef = useRef<Map<string, BotTimeouts>>(new Map());
    const initialFillTimerRef = useRef<number | null>(null);
    const initialFillTriggeredRef = useRef(false);

    const { humanCount, botCount, existingNames, usedIcons, botReadyStates } = useMemo(() => {
        const existingNames = new Set<string>();
        const usedIcons = new Set<string>();
        let humanCount = 0;
        let botCount = 0;
        const botReadyStates: UserReadyStateType[] = [];
        readyStates.forEach(state => {
            existingNames.add(state.user.username);
            if (state.icon) {
                usedIcons.add(state.icon);
            }
            if (state.user.isBot) {
                botCount += 1;
                botReadyStates.push(state);
            } else {
                humanCount += 1;
            }
        });
        return { humanCount, botCount, existingNames, usedIcons, botReadyStates };
    }, [readyStates]);

    const requestBots = useCallback((count: number) => {
        if (!roomID || !userID || count <= 0) return;
        const botNames = generateBotNames(count, new Set(existingNames));
        if (botNames.length === 0) return;
        const data: RequestBotFillEventDataType = {
            type: EventType.enum.REQUEST_BOT_FILL,
            roomID,
            userID,
            botNames,
        };
        connectionManager.send(data);
    }, [connectionManager, existingNames, roomID, userID]);

    useEffect(() => {
        if (!isOwner || !roomID || gameMode !== 'Blitz') {
            if (initialFillTimerRef.current) {
                window.clearTimeout(initialFillTimerRef.current);
                initialFillTimerRef.current = null;
            }
            return;
        }
        if (initialFillTriggeredRef.current) {
            return;
        }
        if (initialFillTimerRef.current) {
            return;
        }
        initialFillTimerRef.current = window.setTimeout(() => {
            initialFillTimerRef.current = null;
            if (humanCount === 1 && botCount === 0) {
                const desiredBots = calculateMaxBots(humanCount);
                requestBots(desiredBots);
                initialFillTriggeredRef.current = true;
            }
        }, 60000);
        return () => {
            if (initialFillTimerRef.current) {
                window.clearTimeout(initialFillTimerRef.current);
                initialFillTimerRef.current = null;
            }
        };
    }, [botCount, gameMode, humanCount, isOwner, requestBots, roomID]);

    useEffect(() => {
        if (!isOwner || !roomID || gameMode !== 'Blitz') {
            return;
        }
        if (!initialFillTriggeredRef.current || botCount === 0) {
            return;
        }
        const desiredBots = calculateMaxBots(humanCount);
        const botsToAdd = Math.max(0, desiredBots - botCount);
        if (botsToAdd > 0) {
            requestBots(botsToAdd);
        }
    }, [botCount, gameMode, humanCount, isOwner, requestBots, roomID]);

    useEffect(() => {
        if (!isOwner || !roomID || gameMode !== 'Blitz') {
            return;
        }
        const activeBotIds = new Set(botReadyStates.map(state => state.user.id));
        pendingTimeoutsRef.current.forEach((timeouts, botId) => {
            if (!activeBotIds.has(botId)) {
                if (timeouts.icon) window.clearTimeout(timeouts.icon);
                if (timeouts.ready) window.clearTimeout(timeouts.ready);
                pendingTimeoutsRef.current.delete(botId);
            }
        });
        botReadyStates.forEach(state => {
            const botId = state.user.id;
            const existing = pendingTimeoutsRef.current.get(botId) ?? {};

            if (!state.icon && existing.icon == null) {
                const iconDelay = randomBetween(5000, 10000);
                const timeoutId = window.setTimeout(() => {
                    const icon = pickRandomIcon(usedIcons);
                    const data = {
                        type: EventType.enum.SET_ICON,
                        userID: botId,
                        roomID,
                        icon,
                    };
                    connectionManager.send(data);
                }, iconDelay);
                existing.icon = timeoutId;
            }

            if (state.icon && existing.icon != null) {
                window.clearTimeout(existing.icon);
                delete existing.icon;
            }

            if (state.icon && !state.ready && existing.ready == null) {
                const readyDelay = randomBetween(2000, 5000);
                const timeoutId = window.setTimeout(() => {
                    const data = {
                        type: EventType.enum.READY_UP,
                        userID: botId,
                        roomID,
                        ready: true,
                    };
                    connectionManager.send(data);
                }, readyDelay);
                existing.ready = timeoutId;
            }

            if (state.ready && existing.ready != null) {
                window.clearTimeout(existing.ready);
                delete existing.ready;
            }

            pendingTimeoutsRef.current.set(botId, existing);
        });
    }, [botReadyStates, connectionManager, gameMode, isOwner, roomID, usedIcons]);

    useEffect(() => {
        return () => {
            pendingTimeoutsRef.current.forEach(timeout => {
                if (timeout.icon) window.clearTimeout(timeout.icon);
                if (timeout.ready) window.clearTimeout(timeout.ready);
            });
            pendingTimeoutsRef.current.clear();
            if (initialFillTimerRef.current) {
                window.clearTimeout(initialFillTimerRef.current);
                initialFillTimerRef.current = null;
            }
        };
    }, []);
};

export default useBotManager;
