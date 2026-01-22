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
  const [postOrientation, setPostOrientation] = useState<'portrait' | 'landscape' | 'unknown'>('unknown');

  const navigate = useNavigate();
  
  const canStartNewRound = readyStates.every(readyState => readyState.ready);

  useEffect(() => {
    const onShowLeaderboard = (_data: ShowLeaderboardEventDataToClientType) => {
      setShowLeaderboard(true);
    }

    const onStartNewRound = (_data: RequestPostEventDataToClientType) => {
      setShowLeaderboard(false);
    }

    const onEndGame = (_data: EndGameEventDataToClientType) => {
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

  useEffect(() => {
    setPostOrientation('unknown');
  }, [currentPost?.id]);

  const startNewRound = useCallback(() => {
    if(canStartNewRound) {
      update();
    }
  }, [canStartNewRound, update])

  const handlePostImageLoad = useCallback((width: number, height: number) => {
    setPostOrientation(height >= width ? 'portrait' : 'landscape');
  }, []);

  const nextRoundButton = useMemo(() => {
    if (!(owner && owner.id === userID && canStartNewRound)) {
      return null;
    }

    return (
      <Button
        className={`${styles.nextRoundButton} ${styles.nextRoundButtonEnabled}`.trim()}
        onClick={startNewRound}
        variant="outline"
      >
        Next Round
      </Button>
    );
  }, [owner, userID, canStartNewRound, startNewRound])

  const shouldShowLeaderboard = roomID != null && !showLeaderboard;
  return (
    <div className={styles.page}>
      <header className={styles.topNav}>
        <div className={styles.topNavLogo}>e</div>
        <ul className={styles.topNavList}>
          <li className={styles.topNavItem}>Artists</li>
          <li className={`${styles.topNavItem} ${styles.topNavItemActive}`.trim()}>Posts</li>
          <li className={styles.topNavItem}>Pools</li>
          <li className={styles.topNavItem}>Sets</li>
          <li className={styles.topNavItem}>Tags</li>
          <li className={styles.topNavItem}>Blips</li>
          <li className={styles.topNavItem}>Comments</li>
          <li className={styles.topNavItem}>Forum</li>
          <li className={styles.topNavItem}>Wiki</li>
          <li className={styles.topNavItem}>Help</li>
          <li className={styles.topNavItem}>Discord</li>
          <li className={styles.topNavItem}>More</li>
        </ul>
        <div className={styles.topNavRight}>
          <span>{owner?.username ?? 'user'}</span>
          <div className={styles.topNavAvatar} />
        </div>
      </header>
      <nav className={styles.subNav}>
        <ul className={styles.subNavList}>
          <li className={styles.subNavItem}>Listing</li>
          <li className={styles.subNavItem}>Upload</li>
          <li className={styles.subNavItem}>Hot</li>
          <li className={styles.subNavItem}>Popular</li>
          <li className={styles.subNavItem}>Favorites</li>
          <li className={styles.subNavItem}>Changes</li>
          <li className={styles.subNavItem}>Blacklist</li>
          <li className={styles.subNavItem}>Help</li>
        </ul>
      </nav>
      <main className={styles.pageBody}>
        {shouldShowLeaderboard ? (
          <div className={styles.contentGrid}>
            <TagListContainer
              tags={currentPost ? currentPost.tags : emptyTagList}
              nextRoundButton={nextRoundButton}
              postOrientation={postOrientation}
            >
              <DisplayedPost post={currentPost} onImageLoad={handlePostImageLoad} />
            </TagListContainer>
          </div>
        ) : (
          <div className={styles.leaderboardPage}>
            <LeaderBoard />
            {userID === owner?.id && (
              <Button
                className={`${styles.nextRoundButton} ${styles.nextRoundButtonEnabled}`}
                onClick={startNewRound}
                variant="outline"
              >
                Start Next Round
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default MainPage;
