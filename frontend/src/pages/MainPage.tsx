import { DisplayedPost } from '../components/DisplayedPost';
import { TagListContainer } from '../components/TagListContainer';
import { UserContext } from '../contexts/UserContext';
import { useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import type { BotActionSequenceType, GameModeType, GuessedTagEntryType, PostTagType, PostType, ShowLeaderboardEventDataToClientType, EndGameEventDataToClientType, RequestPostEventDataToClientType } from '../types';
import { EventType } from '../types';
import LeaderBoard from '../components/Leaderboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import styles from '@/styles/pages/main-page.module.css';
import { PuzzleCanvas } from '../components/puzzle/PuzzleCanvas';
import { usePuzzleState } from '../hooks/usePuzzleState';
// TODO: ^ use this lol

const emptyTagList : PostTagType[] = [];

function PuzzleTimerOverlay({ timerEnd }: { timerEnd: number }) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [timerEnd]);

  const isUrgent = secondsLeft <= 10;
  return (
    <div style={{
      position: 'absolute', top: 8, right: 12, zIndex: 10,
      color: isUrgent ? '#ff4444' : '#ffffff',
      fontSize: '1.1rem', fontFamily: 'monospace',
      fontWeight: isUrgent ? 'bold' : 'normal',
    }}>
      {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
    </div>
  );
}

type Props = {
  currentPost: PostType,
  update: () => void,
  gameMode: GameModeType,
  botActionSequence: BotActionSequenceType | null,
  roundGuesses: GuessedTagEntryType[],
}

function MainPage({currentPost, update, gameMode, botActionSequence, roundGuesses} : Props): JSX.Element {
  /**
   * Server-driven user values
   */
  const {roomID, readyStates, connectionManager, userID, owner } = useContext(UserContext);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [postOrientation, setPostOrientation] = useState<'portrait' | 'landscape' | 'unknown'>('unknown');

  // Puzzle mode state
  const puzzle = usePuzzleState(connectionManager, roomID ?? undefined, userID ?? undefined);

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
    if (gameMode === 'Roulette') return null;
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
  }, [gameMode, owner, userID, canStartNewRound, startNewRound])

  const shouldShowLeaderboard = roomID != null && (gameMode === 'Roulette' || !showLeaderboard);

  // Puzzle mode countdown timer display
  const puzzleTimeLeft = useMemo(() => {
    if (!puzzle.isActive || puzzle.timerEnd === 0) return null;
    return puzzle.timerEnd;
  }, [puzzle.isActive, puzzle.timerEnd]);

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
        {gameMode === 'Puzzle' ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Timer overlay */}
            {puzzle.isActive && puzzleTimeLeft && (
              <PuzzleTimerOverlay timerEnd={puzzleTimeLeft} />
            )}
            {/* Round indicator */}
            {puzzle.roundNumber > 0 && (
              <div style={{
                position: 'absolute', top: 8, left: 12, zIndex: 10,
                color: '#ccc', fontSize: '0.85rem', fontFamily: 'monospace',
              }}>
                Round {puzzle.roundNumber}/{puzzle.totalRounds}
              </div>
            )}
            {/* Round end status */}
            {puzzle.roundComplete && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', zIndex: 20,
                background: 'rgba(0,0,0,0.85)', padding: '2rem',
                borderRadius: '8px', color: puzzle.roundCompleted ? '#00ff88' : '#ff6666',
                fontSize: '1.5rem', textAlign: 'center',
              }}>
                {puzzle.roundCompleted ? 'Puzzle Complete!' : 'Time Up!'}
                {userID === owner?.id && (
                  <div style={{ marginTop: '1rem' }}>
                    <Button variant="outline" onClick={update}>Next Round</Button>
                  </div>
                )}
              </div>
            )}
            {puzzle.isActive && puzzle.postUrl ? (
              <PuzzleCanvas
                pieces={puzzle.pieces}
                myPieceIndices={puzzle.myPieceIndices}
                placedPieces={puzzle.placedPieces}
                postUrl={puzzle.postUrl}
                onPlacePiece={puzzle.onPlacePiece}
                timerEnd={puzzle.timerEnd}
              />
            ) : (
              !puzzle.roundComplete && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
                  Waiting for puzzle round to start...
                </div>
              )
            )}
          </div>
        ) : shouldShowLeaderboard ? (
          <div className={styles.contentGrid}>
            <TagListContainer
              tags={currentPost ? currentPost.tags : emptyTagList}
              nextRoundButton={nextRoundButton}
              postOrientation={postOrientation}
              gameMode={gameMode}
              botActionSequence={botActionSequence}
              roundGuesses={roundGuesses}
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
