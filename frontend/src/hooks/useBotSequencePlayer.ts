import { useEffect, useRef } from 'react';
import type { BotActionSequenceType, PostTagType, UserReadyStateType } from '../types';

const useBotSequencePlayer = (
    botActionSequence: BotActionSequenceType | null | undefined,
    readyStates: UserReadyStateType[],
    setReadyStates: (readyStates: UserReadyStateType[]) => void,
    applyLocalGuess: (tag: PostTagType, user: UserReadyStateType['user']) => boolean,
) => {
    const readyStatesRef = useRef<UserReadyStateType[]>(readyStates);
    const applyLocalGuessRef = useRef(applyLocalGuess);
    const timeoutsRef = useRef<number[]>([]);

    useEffect(() => {
        readyStatesRef.current = readyStates;
    }, [readyStates]);

    useEffect(() => {
        applyLocalGuessRef.current = applyLocalGuess;
    }, [applyLocalGuess]);

    useEffect(() => {
        timeoutsRef.current.forEach(timeout => window.clearTimeout(timeout));
        timeoutsRef.current = [];
        if (!botActionSequence) {
            return;
        }
        botActionSequence.bots.forEach(bot => {
            bot.actions.forEach(action => {
                const timeoutId = window.setTimeout(() => {
                    const currentReadyStates = readyStatesRef.current;
                    const botReadyState = currentReadyStates.find(state => state.user.id === bot.botId);
                    if (!botReadyState) {
                        return;
                    }
                    if (action.type === 'guess_tag' && action.tag) {
                        applyLocalGuessRef.current(action.tag, botReadyState.user);
                        return;
                    }
                    if (action.type === 'ready_up') {
                        const nextStates = currentReadyStates.map(state => (
                            state.user.id === bot.botId ? { ...state, ready: true } : state
                        ));
                        setReadyStates(nextStates);
                    }
                }, action.delayMs);
                timeoutsRef.current.push(timeoutId);
            });
        });
        return () => {
            timeoutsRef.current.forEach(timeout => window.clearTimeout(timeout));
            timeoutsRef.current = [];
        };
    }, [botActionSequence, setReadyStates]);
};

export default useBotSequencePlayer;
