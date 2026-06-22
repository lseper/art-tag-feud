import { UserContext } from '../contexts/UserContext';
import { useContext } from 'react';
import { buildUIIconImg } from '../util/UIUtil';
import styles from '@/styles/components/leaderboard.module.css';


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
    <div className={styles.outer}>
        <ul className={styles.inner}>
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
                    const rankClass = rankBarClassName ? styles[rankBarClassName as 'first' | 'second' | 'third'] : '';
                    return <li className={styles.rank} key={`rank-${rank}`}>
                        <p style={{marginRight: 16}}>{rank + 1}</p>
                        <div style={{width: rankBarWidth}} className={`${styles.rankBar} ${rankClass}`.trim()}/>
                        <p className={styles.rankScore}>{readyState.user.score}</p>
                        <p>{username}</p>
                        {
                            icon && 
                            <div className={styles.userIcon}>
                                {
                                    buildUIIconImg(true, 'profile_icons/', icon)
                                }
                            </div>
                        }
                    </li>
                })
            }
        </ul>
    </div>
  )
}
export default LeaderBoard;
