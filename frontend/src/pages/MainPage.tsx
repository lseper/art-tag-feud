import { DisplayedPost } from '../components/DisplayedPost';
import { TagListContainer } from '../components/TagListContainer';
import usePostFetcher from '../usePostFetcher';
import styled from 'styled-components';
import { UserContext } from '../contexts/UserContext';
import { useContext, useEffect, useState } from 'react';
import { Tag, Post, ShowLeaderboardEventDataToClient, EventType, RequestPostEventDataToClient } from '../types';
import LeaderBoard from '../components/Leaderboard';
// TODO: ^ use this lol

const emptyTagList : Tag[] = [];

type Props = {
  currentPost: Post,
  update: () => void,
}

function MainPage({currentPost, update} : Props): JSX.Element {
  /**
   * Server-driven user values
   */
  const {roomID, readyStates, connectionManager, userID, owner } = useContext(UserContext);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const canStartNewRound = readyStates.every(readyState => readyState.ready);

  useEffect(() => {
    const onShowLeaderboard = (data: ShowLeaderboardEventDataToClient) => {
      setShowLeaderboard(true);
    }

    const onStartNewRound = (data: RequestPostEventDataToClient) => {
      setShowLeaderboard(false);
    }

    const unsubscribers = [
      connectionManager.listen<ShowLeaderboardEventDataToClient>(EventType.enum.SHOW_LEADERBOARD, onShowLeaderboard),
      connectionManager.listen<RequestPostEventDataToClient>(EventType.enum.REQUEST_POST, onStartNewRound),
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    }
  }, [connectionManager])

  const startNewRound = () => {
    if(canStartNewRound) {
      update();
    }
  }

  const shouldShowLeaderboard = roomID != null && !showLeaderboard;

  const nextPostButton = <NextRoundButton onClick={startNewRound}>Next Post</NextRoundButton>;

  return (
    <div>
      {
        shouldShowLeaderboard ? <MediaContainer>
        {
          currentPost && <>
            {/* Delete this wrapper div once done. Only here so that Next Post is under it */}
            <DisplayedPost post={currentPost} />
            {/* pass in an empty TagList placeholder if there's no post */}
            <TagListContainer tags={currentPost ? currentPost.tags : emptyTagList} />
          </> 
        }
        <button onClick={startNewRound}>
          next round
        </button>
      </MediaContainer> : <LeaderBoardPageView>
          <LeaderBoard />
          {
            userID === owner?.id && <NextRoundButton onClick={startNewRound}>Start Next Round</NextRoundButton>
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
  border: 4px solid ${p => p.theme.cTagCharacter};
  border-radius: 12px;
  background-color: transparent;

  font-size: 1.25em;
  font-weight: bold;
  padding: 12px;
  transition: background-color .2s, color .2s, transform .2s;

  &:hover {
    transform: scale(125%);
    background-color: ${p => p.theme.cTagCharacter};
    color: ${p => p.theme.cLobbyBackground};
  }

  &:focus {
    transform: scale(105%);
  }
`

const MediaContainer = styled.div`
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  grid-template-rows: 1fr; 
  gap: 30px 0px; 
  grid-template-areas: 
      ". .";
`;

export default MainPage;
