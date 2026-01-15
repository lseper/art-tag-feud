import { UserContext } from '../contexts/UserContext';
import { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { JoinRoomEventDataToClientType, CreateRoomEventDataType } from '../types';
import { EventType } from '../types';
import {
  useNavigate,
} from 'react-router-dom';

import NumberPicker from '../components/NumberPicker';
import { Title } from '../components/NumberPicker'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import styles from '@/styles/pages/create.module.css';

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

    return <div className={styles.wrapper}>
        <div className={styles.content}>
            <Title style={{alignSelf: 'center', fontSize: '3rem'}}>
                {
                    username ? `${username}'s Room` : DEFAULT_OWNER_TEXT
                }
            </Title>
            <div className={styles.roomNameInputContainer}>
                <Title>
                    Room Name
                </Title>
                <Input className={styles.roomNameInput} type="text" placeholder='e.g "My Room"' value={roomNameInput} onChange={e => setRoomNameInput(e.target.value)}/>
            </div>
            <NumberPicker 
            title={'Posts Per Round'}
            options={POSTS_PER_ROUND_OPTIONS} 
            selected={postsPerRound} 
            setSelected={setPostsPerRound}
            color="var(--c-tag-species)" 
            backgroundColor="var(--background)" 
            singleSelect={true}
            />
            <NumberPicker 
            title={'Rounds Per Game'}
            options={ROUNDS_PER_GAME_OPTIONS} 
            selected={roundsPerGame} 
            setSelected={setRoundsPerGame} 
            color="var(--c-tag-species)" 
            backgroundColor="var(--background)"
            singleSelect={true}
            />
            <div className={styles.buttonRow}>
                <Button className={`${styles.actionButton} ${styles.backButton}`} onClick={() => navigate('/')}>
                    Back
                </Button>
                <Button
                  className={`${styles.actionButton} ${styles.createButton} ${inputsAreValid ? '' : styles.disabled}`.trim()}
                  disabled={!inputsAreValid}
                  onClick={() => createGame()}
                >
                    Create Room
                </Button>
            </div>
        </div>
    </div>;
}

export default Create;
