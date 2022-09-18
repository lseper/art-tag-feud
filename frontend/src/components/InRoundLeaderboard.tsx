import { useEffect, useMemo, useContext, useCallback } from 'react';
import styled from 'styled-components';
import { GuessTagEventDataToClient } from '../types';
import { EventType, UserReadyState } from '../types';
import { UserContext } from '../contexts/UserContext';
import { buildUIIconImg } from '../util/UIUtil';

interface Props {
    className?: string;
};

const IN_GAME_LEADERBOARD_CLASS_NAMES = ['first', 'second', 'third'];

const InRoundLeaderboard: React.FC<Props> = ({className} : Props) => {
    const {readyStates, setReadyStates, connectionManager} = useContext(UserContext);

    useEffect(() => {
        const onSuccessfulGuess = (data: GuessTagEventDataToClient) => {
            const {user} = data;
            const newReadyStates = readyStates.filter(readyState => readyState.user.id !== user.id);
            setReadyStates(newReadyStates);
        };

        const unsubscribers = [
            connectionManager.listen<GuessTagEventDataToClient>(EventType.enum.GUESS_TAG, onSuccessfulGuess)
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

    const renderLeaderboardEntry = useCallback((readyState: UserReadyState) => {
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
        return <InRoundLeaderboardEntry className={className} style={{order: order, zIndex: zIndex}}>
            {
                readyState.icon && buildUIIconImg('./profile_icons/', readyState.icon, isRanked ? 'ranked' : '')
            }
            <InRoundLeaderboardName  className={isFirst && !readyState.ready ? 'dark' : ''}>{readyState.user.username}</InRoundLeaderboardName>
            <InRoundLeaderboardScore className={isFirst && !readyState.ready ? 'dark' : ''}>{readyState.user.score}</InRoundLeaderboardScore>
        </InRoundLeaderboardEntry>;
    }, [leaderBoardOrder, readyStates])

    return <InRoundLeaderboardContainer>
        {
            readyStates.map(readyState => renderLeaderboardEntry(readyState))
        }
    </InRoundLeaderboardContainer>;
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
    `;

const InRoundLeaderboardName = styled.p`
    color: ${p => p.theme.cPrimaryText};
    transition: color .2s;
    font-size: 1em;
    padding-right: 8px;

    &.dark {
        color: ${p => p.theme.cLobbyBackground};
    }
`

const InRoundLeaderboardScore = styled.p`
    color: ${p => p.theme.cTagSpecies};
    padding-right: 8px;
    
    &.dark {
        color: #c03a00;
    }
`

const InRoundLeaderboardEntry = styled.li`
    padding: 2 0 2 0;
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
`;

export default InRoundLeaderboard;