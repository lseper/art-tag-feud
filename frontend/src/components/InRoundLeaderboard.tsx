import { useEffect, useMemo, useContext, useCallback } from 'react';
import type { UserReadyStateType, GuessTagEventDataToClientType } from '../types';
import { EventType } from '../types';
import { UserContext } from '../contexts/UserContext';
import { buildUIIconImg } from '../util/UIUtil';
import styles from '@/styles/components/in-round-leaderboard.module.css';

interface Props {
    className?: string;
    isMobile?: boolean;
};

const IN_GAME_LEADERBOARD_CLASS_NAMES = ['first', 'second', 'third'];

const InRoundLeaderboard: React.FC<Props> = ({className, isMobile = false} : Props) => {
    const {readyStates, setReadyStates, connectionManager} = useContext(UserContext);

    useEffect(() => {
        const onSuccessfulGuess = (data: GuessTagEventDataToClientType) => {
            const {user} = data;
            const newReadyStates = readyStates.filter(readyState => readyState.user.id !== user.id);
            setReadyStates(newReadyStates);
        };

        const unsubscribers = [
            connectionManager.listen<GuessTagEventDataToClientType>(EventType.enum.GUESS_TAG, onSuccessfulGuess)
        ]

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        }
    }, [connectionManager, readyStates, setReadyStates]);

    const leaderBoardOrder = useMemo(() => {
        const order = new Map<string, number>();
        readyStates.sort((readyStateA, readyStateB) => readyStateB.user.score - readyStateA.user.score);
        readyStates.forEach((readyState, i) => {
            order.set(readyState.user.id, i);
        });
        return order;
    }, [readyStates]);

    const renderLeaderboardEntry = useCallback((readyState: UserReadyStateType) => {
        const order = leaderBoardOrder.get(readyState.user.id);
        const zIndex = order ? readyStates.length - order : readyStates.length;
        const isRanked = (order ?? 0) <= 2;
        const isFirst = (order ?? 1) === 0;
        let className: string = '';
        if(readyState.ready) {
            className = 'finished';
        } else {
            if(isRanked) {
                className = IN_GAME_LEADERBOARD_CLASS_NAMES[(order ?? 0)];
            }
        }
        const entryClassName = `${styles.entry} ${className ? styles[className as 'first' | 'second' | 'third' | 'finished'] : ''}`.trim();
        return <li className={entryClassName} style={{order: order, zIndex: zIndex}} key={readyState.user.id}>
            {
                readyState.icon && buildUIIconImg(true, 'profile_icons/', readyState.icon, isRanked ? 'ranked' : '')
            }
            <p className={`${styles.name} ${isFirst && !readyState.ready ? styles.darkName : ''}`.trim()}>
              {readyState.user.username}
            </p>
            <p className={`${styles.score} ${isFirst && !readyState.ready ? styles.darkScore : ''}`.trim()}>
              {readyState.user.score}
            </p>
        </li>;
    }, [leaderBoardOrder, readyStates])

    const containerClassName = isMobile ? styles.mobileContainer : styles.container;

    return <ul className={`${containerClassName} ${className ?? ''}`.trim()}>
        {
            readyStates.map(readyState => renderLeaderboardEntry(readyState))
        }
    </ul>;
}
export default InRoundLeaderboard;
