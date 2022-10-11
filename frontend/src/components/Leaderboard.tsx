import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { useContext } from 'react';
import { buildUIIconImg } from '../util/UIUtil';


const BASE_LEADERBOARD_WIDTH = 20;
const MAX_LEADERBOARD_WIDTH = 350;

const RANK_BAR_CLASS_NAMES = ['first', 'second', 'third'];

const DEBUG_DATA = [
    {
        user: {
            score: 589,
            username: "Rory",
            icon: 'krystal.jpg'
        }
    },
    {
        user: {
            score: 504,
            username: "Zaverose",
            icon: 'anubis.jpg'
        }
    },
    {
        user: {
            score: 399,
            username: "Daitarou",
            icon: 'falco.jpg'
        }
    },
    {
        user: {
            score: 250,
            username: "Hawk",
            icon: 'legosi.png'
        }
    },
    {
        user: {
            score: 82,
            username: "Mason",
            icon: 'bowser.jpg'
        }
    },
]

function LeaderBoard(): JSX.Element {
  /**
   * Server-driven user values
   */
  const { readyStates } = useContext(UserContext);
  readyStates.sort((readyStateA, readyStateB) => readyStateB.user.score- readyStateA.user.score);
  const highestScore = (readyStates[0] ?? DEBUG_DATA[0]).user.score + 1;
  return (
    <LeaderBoardOuterContainer>
        <LeaderBoardInnerContainer>
            {
                (readyStates.length > 0 ? readyStates : DEBUG_DATA).map((readyState, rank) => {
                    const score = readyState.user.score;
                    const username = readyState.user.username;
                    const icon = readyState.user.icon;
                    const rankBarWidth = (Math.floor((score / highestScore) * (MAX_LEADERBOARD_WIDTH - BASE_LEADERBOARD_WIDTH))) + BASE_LEADERBOARD_WIDTH;
                    console.log(`highest score: ${highestScore}`);
                    let rankBarClassName : string = '';
                    if(rank <= 2) {
                        rankBarClassName = RANK_BAR_CLASS_NAMES[rank];
                    }
                    return <LeaderBoardRank>
                        <p style={{marginRight: 16}}>{rank + 1}</p>
                        <LeaderBoardRankBar style={{width: rankBarWidth}} className={rankBarClassName}/>
                        <LeaderBoardRankScore>{readyState.user.score}</LeaderBoardRankScore>
                        <p>{username}</p>
                        {
                            icon && 
                            <LeaderBoardUserIconContainer>
                                {
                                    buildUIIconImg('./profile_icons/', icon)
                                }
                            </LeaderBoardUserIconContainer>
                        }
                    </LeaderBoardRank>
                })
            }
        </LeaderBoardInnerContainer>
    </LeaderBoardOuterContainer>
  )
}

const LeaderBoardUserIconContainer = styled.div`
    border-radius: 50%;
    border: 2px solid ${p => p.theme.cPrimaryText};
    width: 1.5em;
    height: 1.5em;
    img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
    }
`

const LeaderBoardRankScore = styled.p`
    color: ${p => p.theme.cTagSpecies};
`

const LeaderBoardOuterContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
`;

const LeaderBoardInnerContainer = styled.ul`
    margin: 10px;
    padding: 16px;
    max-width: 98vw;
    border-radius: 5px;
    box-shadow: 0 0 5px #000;
`;

const LeaderBoardRank = styled.li`
    padding: 0 6 0 6;
    font-size: 2em;
    color: ${p => p.theme.cPrimaryText};
    
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    p {
        margin-right: 8px;
    }
`

const LeaderBoardRankBar = styled.div`
    background-color: ${p => p.theme.cBodyLight};
    height: 1.35em;
    border-radius: 4px;
    margin-right: 8px;
    
    &.first {
        background-color: ${p => p.theme.cRankFirst};
    }
    &.second {
        background-color: ${p => p.theme.cRankSecond};
    }
    &.third {
        background-color: ${p => p.theme.cRankThird};
    }
`

export default LeaderBoard;
