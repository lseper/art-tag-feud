import { UserContext } from '../contexts/UserContext';
import { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import type { JoinRoomEventDataToClientType, CreateRoomEventDataType } from '../types';
import { EventType } from '../types';
import {
  useNavigate,
} from 'react-router-dom';

import NumberPicker from '../components/NumberPicker';
import { Title } from '../components/NumberPicker'; 
import Theme from '../styles/theme/Theme';

type Props = {
  className?: string;
}

const POSTS_PER_ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ROUNDS_PER_GAME_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const DEFAULT_OWNER_TEXT = "Zaverose's Room";

export const Create : React.FC<Props> = ({className}: Props) => {
  /**
   * Server-driven user values
   */
  const {userID, roomID, username, setRoomID, setRoomName, setOwner, setReadyStates, connectionManager} = useContext(UserContext);
  const [roomNameInput, setRoomNameInput] = useState('');
  const [postsPerRound, setPostsPerRound] = useState<number[]>([]);
  const [roundsPerGame, setRoundsPerGame] = useState<number[]>([]);

  const navigate = useNavigate();

  const inputsAreValid = useMemo(() => {
    return roomNameInput.length !== 0 &&
    postsPerRound.length > 0 && postsPerRound[0] > 0 && postsPerRound[0] <= 10 &&
    roundsPerGame.length > 0 && roundsPerGame[0] > 0 && roundsPerGame[0] <= 10;
  }, [roomNameInput, postsPerRound, roundsPerGame])
  
  useEffect(() => {
    const onJoinRoom = (data: JoinRoomEventDataToClientType) => {
        // if the update was for this room that we are in, then update the owner
        if(userID === data.user.id) {
            setRoomID(data.room.roomID);
            setReadyStates(data.room.readyStates);
            setOwner(data.room.owner);
            setRoomName(data.room.roomName);
            document.body.style.backgroundImage = 'none';
            navigate("/play");
          }
      }

    // orchestrate game start
    const unsubscribers = [
        connectionManager.listen<JoinRoomEventDataToClientType>(EventType.enum.JOIN_ROOM, onJoinRoom),
    ];

    return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
    }
}, [connectionManager, navigate, setOwner, setReadyStates, setRoomID, setRoomName, userID])

    const createGame = useCallback(() => {
        if (inputsAreValid && userID) {
            // send the create game data to the server
            const data: CreateRoomEventDataType = {
                roomID,
                type: EventType.enum.CREATE_ROOM, 
                userID: userID,
                postsPerRound: postsPerRound[0],
                roundsPerGame: roundsPerGame[0],
                roomName: roomNameInput
            };
            connectionManager.send(data);
        }
    }, [connectionManager, inputsAreValid, postsPerRound, roomID, roomNameInput, roundsPerGame, userID]);

    return <CreateWrapper>
        <CreateContent>
            <Title style={{alignSelf: 'center', fontSize: '3rem'}}>
                {
                    username ? `${username}'s Room` : DEFAULT_OWNER_TEXT
                }
            </Title>
            <RoomNameInputContainer>
                <Title>
                    Room Name
                </Title>
                <RoomNameIput type="text" placeholder='e.g "My Room"' value={roomNameInput} onChange={e => setRoomNameInput(e.target.value)}/>
            </RoomNameInputContainer>
            <NumberPicker 
            title={'Posts Per Round'}
            options={POSTS_PER_ROUND_OPTIONS} 
            selected={postsPerRound} 
            setSelected={setPostsPerRound}
            color={Theme.cTagSpecies} 
            backgroundColor={Theme.cLobbyBackground} 
            singleSelect={true}
            />
            <NumberPicker 
            title={'Rounds Per Game'}
            options={ROUNDS_PER_GAME_OPTIONS} 
            selected={roundsPerGame} 
            setSelected={setRoundsPerGame} 
            color={Theme.cTagSpecies} 
            backgroundColor={Theme.cLobbyBackground}
            singleSelect={true}
            />
            <div style={{display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "flex-start"}}>
                <BackButton onClick={() => navigate('/')}>
                    Back
                </BackButton>
                <CreateRoomButton disabled={!inputsAreValid} className={inputsAreValid ? '' : 'disabled'} onClick={() => createGame()}>
                    Create Room
                </CreateRoomButton>
            </div>
        </CreateContent>
    </CreateWrapper>;
}

const CreateWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`

const CreateContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;

    padding: 0 16px 0 16px;

    box-shadow: 0 0 5px #000;
    border-radius: 5px;
`

const RoomNameInputContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;

    margin-top: 16px;
    width: 100%;
`

const RoomNameIput = styled.input`
    padding: 12px 20px;
    margin-left: 32px;
    
    border: 4px solid ${p => p.theme.cTagSpecies};
    border-radius: 4px;
    background-color: transparent;

    color: ${p => p.theme.cTagSpecies};
    caret-color: ${p => p.theme.cTagSpecies};
    transition: background-color 0.2s, transform 0.2s, color 0.2s, caret-color 0.2s;

    ::placeholder {
        color: ${p => p.theme.cTagSpecies};
        opacity: 0.5;
    }

    &:hover {
        outline: none;
        transform: scale(115%);
    }

    &:focus {
        outline: none;
        background-color: ${p => p.theme.cTagSpecies};
        color: ${p => p.theme.cLobbyBackground};
        caret-color: ${p => p.theme.cLobbyBackground};

        ::placeholder {
            color: ${p => p.theme.cLobbyBackground};
        }
    }
`

const Button = styled.button`
    padding: 12px;
    margin: 0 24px 16px 24px;

    color: ${p => p.theme.cLobbyBackground};
    opacity: 1;
    border-radius: 12px;
    border-style: none;

    transition: transform .2s, opacity .2s;

    font-size: 1.5rem;
    font-weight: bold;

    &:hover {
        transform: scale(115%);
    }

    &.disabled {
        opacity: 0.5;
        &:hover {
            transform: scale(100%);
        }
    }
`

const BackButton = styled(Button)`
    background-color: ${p => p.theme.cPrimaryText}
`

const CreateRoomButton = styled(Button)`
    background-color: ${p => p.theme.cTagCharacter};
`

export default Create;
