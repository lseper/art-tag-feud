import { DisplayedPost } from '../components/DisplayedPost';
import { TagListContainer } from '../components/TagListContainer';
import { UserContext } from '../contexts/UserContext';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PostTagType, PostType, ShowLeaderboardEventDataToClientType, EndGameEventDataToClientType, RequestPostEventDataToClientType } from '../types';
import { EventType } from '../types';
import LeaderBoard from '../components/Leaderboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import styles from '@/styles/pages/main-page.module.css';
// TODO: ^ use this lol

const emptyTagList : PostTagType[] = [];

type Props = {
  currentPost: PostType,
  update: () => void,
}

function MainPage({currentPost, update} : Props): JSX.Element {
  /**
   * Server-driven user values
   */
  const {roomID, readyStates, connectionManager, userID, owner } = useContext(UserContext);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const navigate = useNavigate();
  
  const canStartNewRound = readyStates.every(readyState => readyState.ready);

  useEffect(() => {
    const onShowLeaderboard = (data: ShowLeaderboardEventDataToClientType) => {
      setShowLeaderboard(true);
    }

    const onStartNewRound = (data: RequestPostEventDataToClientType) => {
      setShowLeaderboard(false);
    }

    const onEndGame = (data: EndGameEventDataToClientType) => {
      navigate("/finish");
    }

    const unsubscribers = [
      connectionManager.listen<ShowLeaderboardEventDataToClientType>(EventType.enum.SHOW_LEADERBOARD, onShowLeaderboard),
      connectionManager.listen<RequestPostEventDataToClientType>(EventType.enum.REQUEST_POST, onStartNewRound),
      connectionManager.listen<EndGameEventDataToClientType>(EventType.enum.END_GAME, onEndGame)
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    }
  }, [connectionManager, navigate])

  const startNewRound = useCallback(() => {
    if(canStartNewRound) {
      update();
    }
  }, [canStartNewRound, update])

  const nextRoundButton = useMemo(() => {
    return (owner && owner.id === userID) ? (
      <Button
        className={`${styles.nextRoundButton} ${canStartNewRound ? styles.nextRoundButtonEnabled : ''}`.trim()}
        onClick={startNewRound}
        variant="outline"
      >
        Next Round
      </Button>
    ) : null
  }, [owner, userID, canStartNewRound, startNewRound])

  const shouldShowLeaderboard = roomID != null && !showLeaderboard;

  return (
    <div>
      {
        shouldShowLeaderboard ? <div className={styles.mediaContainer}>
        {
          currentPost && <>
            {/* Delete this wrapper div once done. Only here so that Next Post is under it */}
            <DisplayedPost post={currentPost} />
            {/* pass in an empty TagList placeholder if there's no post */}
            <TagListContainer tags={currentPost ? currentPost.tags : emptyTagList} nextRoundButton={nextRoundButton}/>
          </> 
        }
      </div> : <div className={styles.leaderboardPage}>
          <LeaderBoard />
          {
            userID === owner?.id && (
              <Button className={`${styles.nextRoundButton} ${styles.nextRoundButtonEnabled}`} onClick={startNewRound} variant="outline">
                Start Next Round
              </Button>
            )
          }
      </div>
      }
    </div>
  )
}

export default MainPage;
