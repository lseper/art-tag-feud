import { useEffect, useMemo, useContext, useCallback } from 'react';
import type { GameModeType, UserReadyStateType, GuessTagEventDataToClientType } from '../types';
import { EventType } from '../types';
import { UserContext } from '../contexts/UserContext';
import { buildUIIconImg } from '../util/UIUtil';
import styles from '@/styles/components/in-round-leaderboard.module.css';

interface Props {
    className?: string;
    isMobile?: boolean;
    gameMode?: GameModeType;
    activePlayerID?: string | null;
    playerLives?: Record<string, number>;
};

const IN_GAME_LEADERBOARD_CLASS_NAMES = ['first', 'second', 'third'];

const HeartIcon = () => (
    <span style={{ color: 'var(--c-tag-character, #e74c3c)', fontSize: '12px' }}>♥</span>
);

const InRoundLeaderboard: React.FC<Props> = ({className, isMobile = false, gameMode = 'Blitz', activePlayerID = null, playerLives = {}} : Props) => {
    const {readyStates, setReadyStates, connectionManager} = useContext(UserContext);

    useEffect(() => {
        if (gameMode === 'Roulette') return;

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
    }, [connectionManager, gameMode, readyStates, setReadyStates]);

    const leaderBoardOrder = useMemo(() => {
        const order = new Map<string, number>();
        if (gameMode === 'Roulette') {
            // In Roulette, sort by lives remaining (desc), then by player name
            const sorted = [...readyStates].sort((a, b) => {
                const livesA = playerLives[a.user.id] ?? 0;
                const livesB = playerLives[b.user.id] ?? 0;
                return livesB - livesA;
            });
            sorted.forEach((readyState, i) => {
                order.set(readyState.user.id, i);
            });
        } else {
            readyStates.sort((readyStateA, readyStateB) => readyStateB.user.score - readyStateA.user.score);
            readyStates.forEach((readyState, i) => {
                order.set(readyState.user.id, i);
            });
        }
        return order;
    }, [gameMode, playerLives, readyStates]);

    const renderLeaderboardEntry = useCallback((readyState: UserReadyStateType) => {
        const order = leaderBoardOrder.get(readyState.user.id);
        const zIndex = order ? readyStates.length - order : readyStates.length;

        if (gameMode === 'Roulette') {
            const lives = playerLives[readyState.user.id] ?? 0;
            const isEliminated = lives <= 0;
            const isActive = readyState.user.id === activePlayerID;
            const entryStyle: React.CSSProperties = {
                opacity: isEliminated ? 0.4 : 1,
                outline: isActive ? '2px solid var(--c-tag-general, #2ecc71)' : undefined,
                borderRadius: isActive ? '4px' : undefined,
            };
            return (
                <li
                    className={styles.entry}
                    style={{ order: order, zIndex: zIndex, ...entryStyle }}
                    key={readyState.user.id}
                >
                    {readyState.icon && buildUIIconImg(true, 'profile_icons/', readyState.icon, isActive ? 'ranked' : '')}
                    <p className={styles.name}>{readyState.user.username}</p>
                    <p className={styles.score}>
                        {Array.from({ length: lives }, (_, i) => <HeartIcon key={i} />)}
                        {isEliminated && <span style={{ fontSize: '12px', color: 'var(--c-text-secondary)' }}>OUT</span>}
                    </p>
                </li>
            );
        }

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
    }, [activePlayerID, gameMode, leaderBoardOrder, playerLives, readyStates])

    const containerClassName = isMobile ? styles.mobileContainer : styles.container;

    return <ul className={`${containerClassName} ${className ?? ''}`.trim()}>
        {
            readyStates.map(readyState => renderLeaderboardEntry(readyState))
        }
    </ul>;
}
export default InRoundLeaderboard;
