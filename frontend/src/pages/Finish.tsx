import { UserContext } from '../contexts/UserContext';
import { useContext, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { RoomUpdateButton } from './ReadyUp';
import type {LeaveRoomEventDataType, LeaveRoomEventDataToClientType } from '../types';
import { EventType } from '../types';
import LeaderBoard from '../components/Leaderboard';
import {
  useNavigate,
} from 'react-router-dom';
import Theme from '../styles/theme/Theme';

type Props = {
  className?: string;
}

export const Finish : React.FC<Props> = ({className}: Props) => {

    // TODO: test with multiple users at end of game
  /**
   * Server-driven user values
   */
  const {userID, roomID, readyStates, owner, setOwner, setReadyStates, leaveRoomCleanup, connectionManager} = useContext(UserContext);
  const navigate = useNavigate();
  
  useEffect(() => {

    // transfer ownership of room if owner leaves, lets people leave room
    const onUserLeftRoom = (data: LeaveRoomEventDataToClientType) => {
      console.log('Someone left the room...')
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
        connectionManager.listen<LeaveRoomEventDataToClientType>(EventType.enum.LEAVE_ROOM, onUserLeftRoom),
    ];
    
    return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
    }
}, [connectionManager, owner, readyStates, setOwner, setReadyStates])

    const winner = useMemo(() => {
        readyStates.sort((a, b) => b.user.score - a.user.score);
        return readyStates[0];
    }, [readyStates]);

    const leaveRoom = useCallback(() => {
        if(roomID && userID) {
          const data: LeaveRoomEventDataType = {type: EventType.enum.LEAVE_ROOM, userID, roomID};
          connectionManager.send(data);
          leaveRoomCleanup();
        }
        navigate("/");
      }, [connectionManager, leaveRoomCleanup, navigate, roomID, userID]);

    const playAgain = useCallback(() => {
        // TODO: test this lol
        if(owner?.id === userID) {
            navigate("/create");
        } else {
            navigate("/play");
        }
    }, [navigate, owner?.id, userID]);

  return <FinishContainer>
    <span>
        <WinnerText className='username'>{winner ? winner.user.username : 'Rory'}</WinnerText>
        <WinnerText> is the winner!</WinnerText>
    </span>
    <LeaderBoard />
    <ButtonContainer>
        <RoomUpdateButton color={Theme.cTagSpecies} onClick={() => leaveRoom()}>
            Leave Room
        </RoomUpdateButton>
        <RoomUpdateButton color={Theme.cTagCharacter} onClick={() => playAgain()}>
            Play Again
        </RoomUpdateButton>
    </ButtonContainer>
  </FinishContainer>;
}

const WinnerText = styled.h1`
    color: ${p => p.theme.cPrimaryText};
    display: inline;

    &.username {
        color: ${p => p.theme.cRankFirst};
    }
`

const FinishContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding-top: 10rem;
`

const ButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: cener;

    width: 100%;

    @media (min-width: 650px) {
        width: 80%;
    }
    @media (min-width: 850px) {
        width: 60%;
    }
    @media (min-width: 1200px) {
        width: 40%;
    }
    @media (min-width: 2200px) {
        width: 30%;
    }
`

export default Finish;
