import { UserContext } from '../contexts/UserContext';
import { useContext, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { TitleText, } from '../components/StyledElements';
import type {JoinRoomEventDataToClientType, LeaveRoomEventDataType, LeaveRoomEventDataToClientType, ReadyUpEventDataType, ReadyUpEventDataToClientType, RequestPostEventDataType, UserReadyStateType } from '../types';
import { EventType } from '../types';
import MainPage from './MainPage';
import IconPicker from '../components/IconPicker';
import { icons, buildUIIconImg } from '../util/UIUtil';
import usePostFetcher from '../usePostFetcher';
import {
  useNavigate,
} from 'react-router-dom';

import Theme from '../styles/theme/Theme';

type Props = {
  className?: string;
}

export const ReadyUp : React.FC<Props> = ({className}: Props) => {
  /**
   * Server-driven user values
   */
  const {userID, username, roomID, readyStates, owner, setOwner, setReadyStates, leaveRoomCleanup, connectionManager} = useContext(UserContext);
  const { currentPost, update } = usePostFetcher(connectionManager, roomID);
  const navigate = useNavigate();
  
  useEffect(() => {
    const onNewUserJoin = (data: JoinRoomEventDataToClientType) => {
      setReadyStates(data.room.readyStates);
    }
    
    const onNewReadyStates = (data: ReadyUpEventDataToClientType) => {
      const readyStates = data.room.readyStates;
      // populate new ready states
      setReadyStates(readyStates);
    }

    const onUserLeftRoom = (data: LeaveRoomEventDataToClientType) => {
      const newReadyStates = data.room.readyStates;
      const newOwner = data.room.owner;
      if(!owner) {
        setOwner(newOwner);
      } else {
        if(owner.id !== newOwner.id) {
          setOwner(newOwner);
        }
      }
      setReadyStates(newReadyStates);

    }

    // orchestrate game start
    const unsubscribers = [
        connectionManager.listen<ReadyUpEventDataToClientType>(EventType.enum.READY_UP, onNewReadyStates),
        connectionManager.listen<JoinRoomEventDataToClientType>(EventType.enum.JOIN_ROOM, onNewUserJoin),
        connectionManager.listen<LeaveRoomEventDataToClientType>(EventType.enum.LEAVE_ROOM, onUserLeftRoom),
    ];

    return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
    }
}, [connectionManager, owner, readyStates, setOwner, setReadyStates])

  const readyUp = useCallback((ready: boolean) => {
    if(userID != null && roomID != null) {
      const data: ReadyUpEventDataType = {type: EventType.enum.READY_UP, userID, roomID, ready};
      connectionManager.send(data);
    } else {
      console.error('user readied up before room or user was created')
    }
  }, [connectionManager, userID, roomID]);

  const canStartGame = useMemo(() => readyStates.every(readyState => readyState.ready && readyState.icon), [readyStates]);

  const startGame = useCallback(() => {
    if(roomID && userID && userID === owner?.id && canStartGame) {
      const data: RequestPostEventDataType = {type: EventType.enum.REQUEST_POST, roomID, userID};
      connectionManager.send(data);
    }
  }, [roomID, userID, owner?.id, canStartGame, connectionManager]);

  const leaveRoom = useCallback(() => {
    if(roomID && userID) {
      const data: LeaveRoomEventDataType = {type: EventType.enum.LEAVE_ROOM, userID, roomID};
      connectionManager.send(data);
      leaveRoomCleanup();
    }
    navigate("/");
  }, [connectionManager, leaveRoomCleanup, navigate, roomID, userID, username]);

  const renderLobbyUserIcon = useCallback((userIcon?: string) => {
    if(userIcon) {
      return (
        <div style={{gridArea: 'icon'}} className='icon-chosen'>
          {buildUIIconImg('./profile_icons/', userIcon)}
        </div>
      )
    }
    return (
      <div style={{gridArea: 'icon'}} className='icon-unchosen'>
        <p>?</p>
      </div>
    )
  }, [])

  // TODO: make pretty
  const renderReadyState = useCallback((readyState: UserReadyStateType) => {
    const readyUpOnClick = () => readyUp(!readyState.ready);
    const readyUpButtonClassName = readyState.ready ? 'ready-down' : 'ready-up';
    const readyUpButtonText = readyState.ready ? 'Ready Down' : 'Ready Up';
    const readyUpButton = <ReadyUpButton onClick={readyUpOnClick} className={readyUpButtonClassName}>{readyUpButtonText}</ReadyUpButton>
    return(
      <li>
        {
          renderLobbyUserIcon(readyState.icon)
        }
        <div style={{gridArea: 'username'}} className='username-container'>
          <p>
              {readyState.user.username}
          </p>
        </div>
        <div style={{gridArea: 'ready-up-button'}}>
          {
            userID === readyState.user.id ? readyUpButton : <ReadyStatus className={readyState.ready ? 'ready' : 'not-ready'}>{readyState.ready ? 'Ready!' : 'Waiting'}</ReadyStatus>
          }
        </div>
      </li>
    );
  }, [readyUp, renderLobbyUserIcon, userID]);

  const roomName = `${owner?.username ?? 'Uknown User'}'s Room`;
  return currentPost ? <MainPage currentPost={currentPost} update={update}/> : (
    <ReadyUpView>
      <UsersInLobbyContainer style={{gridArea: 'ready-up'}}>
        <ReadyUpContainer style={{width: '50%'}}>
            <TitleText>
                {roomName}
            </TitleText>
            <ReadyUpList>
                {
                    readyStates.map(readyState => renderReadyState(readyState))
                }  
            </ReadyUpList>
        </ReadyUpContainer>
      </UsersInLobbyContainer>
      <ReadyUpContainer style={{gridArea: 'icons'}}>
        <IconPicker allIcons={icons}/>
      </ReadyUpContainer>
      {
        <StartGameContainer style={{gridArea:'start-game'}}>
          {
            roomID && userID && <RoomUpdateButton color={Theme.cTagSpecies} onClick={leaveRoom}>Leave Room</RoomUpdateButton>
          }
          {
            owner && userID === owner.id && <RoomUpdateButton color={Theme.cPrimaryText} onClick={startGame}>Start Game</RoomUpdateButton>
          }
      </StartGameContainer>
      }
    </ReadyUpView> 
    );
}

const ReadyStatus = styled.p`
  transition: color .2s;
  &.ready {
    color: ${p => p.theme.cTagCharacter};
  }

  &.not-ready {
    color: ${p => p.theme.cTagSpecies};
  }
`

const ReadyUpButton = styled.button`
  width: 120px;
  height: 40px;
  &.ready-up {
    color: ${p => p.theme.cTagCharacter};
    background-color: ${p => p.theme.cTagCharacter};
    border:2px solid ${p => p.theme.cTagCharacter};
    background-color: transparent;
    
    &:hover {
      background-color: ${p => p.theme.cTagCharacter};
    }
  }

  &.ready-down {
    color: ${p => p.theme.cTagSpecies};
    background-color: ${p => p.theme.cTagSpecies};
    border:2px solid ${p => p.theme.cTagSpecies};
    background-color: transparent;

    &:hover {
      background-color: ${p => p.theme.cTagSpecies};
    }
  }
`

type RoomUpdateButtonProps = {
  color: string
}

export const RoomUpdateButton = styled.button<RoomUpdateButtonProps>`
  width: 140px;
  min-height: 40px;
  border:2px solid ${p => p.color};
  background-color: transparent;
  
  font-size: 1em;
  font-weight: bold;
  color: ${p => p.color};
  border-radius: 10%;
  font-size: 1em;
  font-weight: bold;
  
  transition: background-color .2s, transform .2s, color .2s, border .2s;

  &:hover {
    background-color: ${p => p.color};
    color: ${p => p.theme.cLobbyBackground};
    transform: scale(125%);
  }
`

const StartGameContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  margin-top: 12px;
`

const UsersInLobbyContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`

const ReadyUpList = styled.ul`

    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: left;

    li {
        display: grid;
        grid-template-columns: 1fr 2fr 1fr;
        grid-template-areas: 'icon username ready-up-button';
        column-gap: 1rem;
        border-radius: 4px;
        width: calc(100% - 4rem);
        padding: 0 1rem 0.25rem 1rem;

        font-size: 1em;
        font-weight: bold;

        div {
          transition: border 0.2s;

          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;

          &.icon-unchosen {
            border-radius: 50%;
            width: 40px;
            height: 40px;
            border: 2px dashed ${p => p.theme.cPrimaryText};
            background-color: transparent;

            color: ${p => p.theme.cPrimaryText};

            text-shadow: none;
          }

          &.icon-chosen {
            border-radius: 50%;
            border: 2px solid ${p => p.theme.cPrimaryText};
            width: 40px;
            height: 40px;
            img {
              width: 40px;
              height: 40px;
              border-radius: 50%;
            }
          }
        }
    }
`;

const ReadyUpContainer = styled.div`
    margin: 10px;
    padding: 2px 0 16px 0;
    max-width: 98vw;
    border-radius: 5px;
    box-shadow: 0 0 5px #000;
    text-shadow: 0 0 2px black, 0 0 6px black;
    z-index: 2;
`

const ReadyUpView = styled.div`
  text-align: center;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 1fr 2fr 2fr 1fr;
  grid-template-areas: 
  '. . .'
  '. ready-up .'
  '. icons .'
  '. start-game .';
  column-gap: 1rem;

  button {
    transition: background-color .2s, transform .2s, color .2s, border .2s;
    border-radius: 10%;
    font-size: 1em;
    font-weight: bold;
  }

  button:hover {
    transform: scale(125%);
    color:  ${p => p.theme.cLobbyBackground};
  }
`

export default ReadyUp;
