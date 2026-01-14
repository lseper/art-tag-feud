import { useEffect, useMemo, useContext, useCallback } from 'react';
import styled from 'styled-components';
import type { UserReadyStateType, GuessTagEventDataToClientType } from '../types';
import { EventType } from '../types';
import { UserContext } from '../contexts/UserContext';
import { buildUIIconImg } from '../util/UIUtil';
import { media } from '../styles/theme/breakpoints';

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
        return <InRoundLeaderboardEntry className={className} style={{order: order, zIndex: zIndex}} key={readyState.user.id}>
            {
                readyState.icon && buildUIIconImg(true, 'profile_icons/', readyState.icon, isRanked ? 'ranked' : '')
            }
            <InRoundLeaderboardName className={isFirst && !readyState.ready ? 'dark' : ''}>{readyState.user.username}</InRoundLeaderboardName>
            <InRoundLeaderboardScore className={isFirst && !readyState.ready ? 'dark' : ''}>{readyState.user.score}</InRoundLeaderboardScore>
        </InRoundLeaderboardEntry>;
    }, [leaderBoardOrder, readyStates])

    const Container = isMobile ? MobileInRoundLeaderboardContainer : InRoundLeaderboardContainer;

    return <Container className={className}>
        {
            readyStates.map(readyState => renderLeaderboardEntry(readyState))
        }
    </Container>;
}


// cRankFirst: "#ffda38",
//   cRankSecond: "#a3a3a3",
//   cRankThird: "#e28c1c",

const InRoundLeaderboardContainer = styled.ul`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 60px;
    background-color: transparent;

    ${media.xl} {
        height: 50px;
    }

    ${media.lg} {
        height: 45px;
    }
`;

/**
 * Mobile overlay container - floats above input bar with 50% opacity
 */
const MobileInRoundLeaderboardContainer = styled.ul`
    position: fixed;
    bottom: 68px;
    left: 0;
    right: 0;
    height: auto;
    padding: 8px;
    background: rgba(31, 60, 103, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 15;
    
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
`;

const InRoundLeaderboardName = styled.p`
    color: ${p => p.theme.cPrimaryText};
    transition: color .2s;
    font-size: 1em;
    font-weight: bold;
    padding-right: 8px;

    &.dark {
        color: ${p => p.theme.cLobbyBackground};
    }

    ${media.xl} {
        font-size: 0.9em;
        padding-right: 6px;
    }

    ${media.lg} {
        font-size: 0.8em;
        padding-right: 4px;
    }

    ${media.md} {
        font-size: 0.75em;
    }

    ${media.sm} {
        font-size: 0.7em;
    }
`

const InRoundLeaderboardScore = styled.p`
    color: ${p => p.theme.cTagSpecies};
    padding-right: 8px;
    
    &.dark {
        color: #c03a00;
    }

    ${media.xl} {
        font-size: 0.9em;
        padding-right: 6px;
    }

    ${media.lg} {
        font-size: 0.8em;
        padding-right: 4px;
    }

    ${media.md} {
        font-size: 0.75em;
    }

    ${media.sm} {
        font-size: 0.7em;
    }
`

const InRoundLeaderboardEntry = styled.li`
    padding: 2px 0;
    border-radius: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${p => p.theme.cBodyLight};
    color: ${p => p.theme.cPrimaryText};
    margin-right: 12px;

    transition: background-color .2s, order 1s;

    &.finished {
        background-color: #125512;
    }
    
    &.first {
        background-color: #f5d85a;
    }
    
    &.second {
        background-color: #5e5e5e;
    }
    
    &.third {
        background-color: #6e4209;
    }

    img {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid ${p => p.theme.cPrimaryText};
        
        margin-right: 8px;

        transition: border-color .2s;
        &.ranked{
            border-color: ${p => p.theme.cLobbyBackground};
        }
    }

    ${media.xl} {
        margin-right: 8px;
        
        img {
            width: 26px;
            height: 26px;
            margin-right: 6px;
        }
    }

    ${media.lg} {
        margin-right: 6px;
        
        img {
            width: 22px;
            height: 22px;
            margin-right: 4px;
        }
    }

    ${media.md} {
        margin-right: 4px;
        
        img {
            width: 20px;
            height: 20px;
            margin-right: 4px;
        }
    }

    ${media.sm} {
        img {
            width: 18px;
            height: 18px;
        }
    }
`;

export default InRoundLeaderboard;
