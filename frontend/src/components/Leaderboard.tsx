import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { useContext } from 'react';
import { buildUIIconImg } from '../util/UIUtil';
import { media } from '../styles/theme/breakpoints';


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
                    let rankBarClassName : string = '';
                    if(rank <= 2) {
                        rankBarClassName = RANK_BAR_CLASS_NAMES[rank];
                    }
                    return <LeaderBoardRank key={`rank-${rank}`}>
                        <p style={{marginRight: 16}}>{rank + 1}</p>
                        <LeaderBoardRankBar style={{width: rankBarWidth}} className={rankBarClassName}/>
                        <LeaderBoardRankScore>{readyState.user.score}</LeaderBoardRankScore>
                        <p>{username}</p>
                        {
                            icon && 
                            <LeaderBoardUserIconContainer>
                                {
                                    buildUIIconImg(true, 'profile_icons/', icon)
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

    ${media.xl} {
        width: 1.3em;
        height: 1.3em;
    }

    ${media.lg} {
        width: 1.2em;
        height: 1.2em;
    }

    ${media.md} {
        width: 1.1em;
        height: 1.1em;
        border-width: 1px;
    }

    ${media.sm} {
        width: 1em;
        height: 1em;
    }

    ${media.xs} {
        width: 0.9em;
        height: 0.9em;
    }
`;

const LeaderBoardRankScore = styled.p`
    color: ${p => p.theme.cTagSpecies};
`;

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

    ${media.xl} {
        margin: 8px;
        padding: 12px;
    }

    ${media.lg} {
        padding: 10px;
    }

    ${media.md} {
        margin: 6px;
        padding: 8px;
    }

    ${media.sm} {
        padding: 6px;
    }

    ${media.xs} {
        margin: 4px;
        padding: 4px;
    }
`;

const LeaderBoardRank = styled.li`
    padding: 0 6px 0 6px;
    font-size: 2em;
    color: ${p => p.theme.cPrimaryText};
    
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    p {
        margin-right: 8px;
    }

    ${media.xl} {
        font-size: 1.6em;
        padding: 0 5px 0 5px;
        
        p {
            margin-right: 6px;
        }
    }

    ${media.lg} {
        font-size: 1.4em;
        
        p {
            margin-right: 5px;
        }
    }

    ${media.md} {
        font-size: 1.2em;
        padding: 0 4px 0 4px;
        
        p {
            margin-right: 4px;
        }
    }

    ${media.sm} {
        font-size: 1.1em;
        
        p {
            margin-right: 3px;
        }
    }

    ${media.xs} {
        font-size: 1em;
        padding: 0 2px 0 2px;
        
        p {
            margin-right: 2px;
        }
    }
`;

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

    ${media.xl} {
        height: 1.2em;
        margin-right: 6px;
    }

    ${media.lg} {
        height: 1.1em;
        margin-right: 5px;
    }

    ${media.md} {
        height: 1em;
        margin-right: 4px;
        border-radius: 3px;
    }

    ${media.sm} {
        height: 0.9em;
        margin-right: 3px;
    }

    ${media.xs} {
        height: 0.8em;
        margin-right: 2px;
        border-radius: 2px;
    }
`;

export default LeaderBoard;
