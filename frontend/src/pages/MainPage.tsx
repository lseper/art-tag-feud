import { DisplayedPost } from '../components/DisplayedPost';
import { TagListContainer } from '../components/TagListContainer';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PostTagType, PostType, ShowLeaderboardEventDataToClientType, EndGameEventDataToClientType, RequestPostEventDataToClientType } from '../types';
import { EventType } from '../types';
import LeaderBoard from '../components/Leaderboard';
import { useNavigate } from 'react-router-dom';
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
    return (owner && owner.id === userID) ? <NextRoundButton className={canStartNewRound ? 'enabled' : ''} onClick={startNewRound}>
      Next Round
    </NextRoundButton> : null
  }, [owner, userID, canStartNewRound, startNewRound])

  const shouldShowLeaderboard = roomID != null && !showLeaderboard;

  return (
    <div>
      {
        shouldShowLeaderboard ? <MediaContainer>
        {
          currentPost && <>
            {/* Delete this wrapper div once done. Only here so that Next Post is under it */}
            <DisplayedPost post={currentPost} />
            {/* pass in an empty TagList placeholder if there's no post */}
            <TagListContainer tags={currentPost ? currentPost.tags : emptyTagList} nextRoundButton={nextRoundButton}/>
          </> 
        }
      </MediaContainer> : <LeaderBoardPageView>
          <LeaderBoard />
          {
            userID === owner?.id && <NextRoundButton className='enabled' onClick={startNewRound}>Start Next Round</NextRoundButton>
          }
      </LeaderBoardPageView>
      }
    </div>
  )
}

const LeaderBoardPageView = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const NextRoundButton = styled.button`
  color: ${p => p.theme.cTagCharacter};
  border: 2px solid ${p => p.theme.cTagCharacter};
  border-radius: 8px;
  background-color: transparent;

  margin-top: 8px;
  margin-bottom: 4px;

  font-size: 1em;
  font-weight: bold;
  padding: 12px;
  transition: background-color .2s, color .2s, transform .2s, opacity .2s;

  opacity: 0.25;

  &.enabled {

    opacity: 1;

    &:hover {
      transform: scale(125%);
      background-color: ${p => p.theme.cTagCharacter};
      color: ${p => p.theme.cLobbyBackground};
    }

    &:focus {
      transform: scale(105%);
    }

  }
`

const MediaContainer = styled.div`
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  grid-template-rows: 1fr; 
  gap: 30px 0px; 
  grid-template-areas: 
      ". .";

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    grid-template-areas: 
        "."
        ".";
  }
`;

export default MainPage;
