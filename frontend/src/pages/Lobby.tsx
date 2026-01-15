import React, { useContext, useCallback, useState, useEffect} from 'react';
import { UserContext } from '../contexts/UserContext';
import type { ClientRoomType, SetUsernameEventDataToClientType, JoinRoomEventDataToClientType, AllRoomsEventDataToClientType, SetUsernameEventDataType, AllRoomsEventDataType, JoinRoomEventDataType } from '../types';
import { EventType } from '../types';
import {
    useNavigate,
} from 'react-router-dom';
import { Container, TitleText, TitleContainer } from '../components/StyledElements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import styles from '@/styles/pages/lobby.module.css';


export const Lobby: React.FC = () => {
    const {roomID, setRoomID, setRoomName, userID, setUserID, setUsername, setReadyStates, setOwner, setBlacklist, setPreferlist, username, connectionManager} = useContext(UserContext);
    const [usernameInput, setUsernameInput] = useState<string>('');
    const [rooms, setRooms] = useState<ClientRoomType[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const onJoinRoom = (data: JoinRoomEventDataToClientType) => {
          setRooms([data.room, ...rooms]);
          // if the update was for this room that we are in, then update the owner
          if(userID === data.user.id) {
              setRoomID(data.room.roomID);
              setReadyStates(data.room.readyStates);
              setRoomName(data.room.roomName);
              setOwner(data.room.owner);
              setBlacklist(data.room.blacklist);
              setPreferlist(data.room.preferlist ?? []);
              navigate("/play");
              document.body.style.backgroundImage = 'none';
            }
        }

        const onAllRooms = (data: AllRoomsEventDataToClientType) => {
            setRooms(data.rooms);
        }

        const onSetUsername = (data: SetUsernameEventDataToClientType) => {
            if(!userID) {
                setUserID(data.user.id);
            }
            setUsername(data.user.username);
            document.body.style.backgroundImage = 'none';
        }
        // orchestrate game start
        const unsubscribers = [
            connectionManager.listen<JoinRoomEventDataToClientType>(EventType.enum.JOIN_ROOM, onJoinRoom),
            connectionManager.listen<AllRoomsEventDataToClientType>(EventType.enum.ALL_ROOMS, onAllRooms),
            connectionManager.listen<SetUsernameEventDataToClientType>(EventType.enum.SET_USERNAME, onSetUsername)
        ];

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        }
    }, [connectionManager, navigate, roomID, rooms, setBlacklist, setOwner, setPreferlist, setReadyStates, setRoomID, setRoomName, setUserID, setUsername, userID]);

    
    const createUsername = useCallback((username: string) => {
        const data: SetUsernameEventDataType = {type: EventType.enum.SET_USERNAME, userID, username};
        connectionManager.send(data);
    }, [connectionManager, userID]);

    const createRoom = useCallback(() => {
        if(userID) {
            navigate("/create");
        }
    }, [navigate, userID]);

    const joinRoom = useCallback((roomID: string) => {
        if(userID) {
            const data: JoinRoomEventDataType = {type: EventType.enum.JOIN_ROOM, roomID, userID};
            connectionManager.send(data);
        }
    }, [connectionManager, userID]);

    const getAllRooms = useCallback(() => {
        const data : AllRoomsEventDataType = {type: EventType.enum.ALL_ROOMS};
        connectionManager.send(data);
    }, [connectionManager])
    
    useEffect(() => {
        getAllRooms();
    }, [getAllRooms])

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            getAllRooms();
        }, 8000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [getAllRooms]);

    const renderRoom = useCallback((room: ClientRoomType) => {
        const {roomName, readyStates} = room;
        return (
            <li key={roomID} style={{paddingTop: 4}}>
                <div className={styles.roomName}>
                    <p>
                        {roomName}
                    </p>
                </div>
                <Button onClick={() => joinRoom(room.roomID)} className={`${styles.joinRoomButton} ${styles.joinable}`} variant="outline">
                    Join!
                </Button>
                <div className={styles.readyUpStates}>
                    {
                        readyStates.map(readyState => {
                            return (
                              <div
                                className={`${styles.readyUpState} ${readyState.ready ? styles.readyUpStateReady : ''}`.trim()}
                              />
                            );
                        })
                    }
                </div>
            </li>
        )
    }, [joinRoom, roomID]);

    const renderSignUp = () => {
        if(!username) {
            return <Container>
                <TitleContainer className={styles.blurredImage} style={{gridArea: 'e6-join', paddingBottom: 12}}>
                    <TitleText>
                        Art Feud
                    </TitleText>
                    <div className={styles.infoBar}>
                        <a href="https://github.com/lseper/art-tag-feud">contribute</a>
                    </div>
                    <label form="roomIDForm">
                            Log in wtih a username
                    </label>
                    <form id="roomIDForm" style={{paddingTop: 8}}onSubmit={(e) => {
                    e.preventDefault();
                    createUsername(usernameInput);
                    document.body.style.backgroundImage = 'none';
                }}>
                    <Input
                    className={styles.input}
                    type="text" 
                    placeholder="Enter a username to start playing!"
                    size={30}
                    value={usernameInput} 
                    onChange={(e) => setUsernameInput(e.target.value)}/>
                    </form>
                    <form id="roomIDForm" style={{paddingTop: 4, marginBottom: 4}}onSubmit={(e) => {
                    e.preventDefault();
                    createUsername(usernameInput);
                }}>
            </form>
            <Button type="submit" form="roomIDForm" style={{marginRight: 8}}>
              Start
            </Button>
            </TitleContainer>
        </Container>
        } else {
            return (
                <div className={styles.lobbyContainer}>
                    <Card className={`${styles.card} ${styles.cardCentered}`}>
                        <h1 className={styles.cardTitle}>
                            Art Feud
                        </h1>
                        <h2 className={styles.cardSubtitle}>
                            Create a Room!
                        </h2>
                        <Button className={styles.createRoomButton} onClick={createRoom}>
                            Create Room
                        </Button>
                    </Card>
                    <Card className={`${styles.card} ${styles.cardInline}`}>
                        <a className={styles.creditLink} href={'https://github.com/lseper/art-tag-feud'}>
                            contribute
                        </a>
                    </Card>
                    <Card className={`${styles.card} ${styles.cardCentered}`}>
                        <h1 className={styles.cardTitle}>
                            Joinable Rooms
                        </h1>
                        {
                            rooms.length === 0 && <p>No Rooms available to join</p>
                        }
                        <ul className={styles.roomsList}>
                            {
                                rooms.map(room => renderRoom(room))
                            }
                        </ul>
                    </Card>
                </div>
            )
        }
    }

    return renderSignUp();
}
