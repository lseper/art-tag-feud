import React, { useContext, useCallback, useState, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import type { ClientRoomType, SetUsernameEventDataToClientType, JoinRoomEventDataToClientType, AllRoomsEventDataToClientType, SetUsernameEventDataType, AllRoomsEventDataType, JoinRoomEventDataType } from '../types';
import { EventType } from '../types';
import {
    useNavigate,
    useSearchParams,
} from 'react-router-dom';
import { TitleText, TitleContainer } from '../components/StyledElements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import styles from '@/styles/pages/lobby.module.css';


const PENDING_ROOM_CODE_KEY = 'artFeudPendingRoomCode';

export const Lobby: React.FC = () => {
    const { roomID, setRoomID, setRoomName, setRoomCode, setIsPrivate, setScore, userID, setUserID, setUsername, setReadyStates, setOwner, setBlacklist, setPreferlist, username, connectionManager } = useContext(UserContext);
    const [usernameInput, setUsernameInput] = useState<string>('');
    const [roomCodeInput, setRoomCodeInput] = useState('');
    const [rooms, setRooms] = useState<ClientRoomType[]>([]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const navItems = [
        'Gallery',
        'Feed',
        'Collections',
        'Sets',
        'Tags',
        'Updates',
        'Discuss',
        'Forums',
        'Guides',
        'Help',
        'More'
    ];

    useEffect(() => {
        const onJoinRoom = (data: JoinRoomEventDataToClientType) => {
          setRooms((prevRooms) => {
            const existingIndex = prevRooms.findIndex(room => room.roomID === data.room.roomID);
            if (existingIndex === -1) {
              return [data.room, ...prevRooms];
            }
            const nextRooms = [...prevRooms];
            nextRooms[existingIndex] = data.room;
            return nextRooms;
          });
          // if the update was for this room that we are in, then update the owner
          if(userID === data.user.id) {
              setRoomID(data.room.roomID);
              setReadyStates(data.room.readyStates);
              setRoomName(data.room.roomName);
              setRoomCode(data.room.roomCode);
              setIsPrivate(data.room.isPrivate);
              setOwner(data.room.owner);
              setBlacklist(data.room.blacklist);
              setPreferlist(data.room.preferlist ?? []);
              setScore(data.user.score);
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
    }, [connectionManager, navigate, roomID, setBlacklist, setIsPrivate, setOwner, setPreferlist, setReadyStates, setRoomCode, setRoomID, setRoomName, setScore, setUserID, setUsername, userID]);

    
    const createUsername = useCallback((username: string) => {
        const data: SetUsernameEventDataType = {type: EventType.enum.SET_USERNAME, userID, username};
        connectionManager.send(data);
    }, [connectionManager, userID]);

    const createRoom = useCallback(() => {
        if(userID) {
            navigate("/play");
        }
    }, [navigate, userID]);

    const joinRoom = useCallback((roomID: string) => {
        if(userID) {
            const data: JoinRoomEventDataType = {type: EventType.enum.JOIN_ROOM, roomID, userID};
            connectionManager.send(data);
        }
    }, [connectionManager, userID]);

    const joinRoomByCode = useCallback((roomCode: string) => {
        if(userID) {
            const data: JoinRoomEventDataType = {type: EventType.enum.JOIN_ROOM, roomCode, userID};
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

    useEffect(() => {
        const codeFromQuery = searchParams.get('room');
        const pendingCode = codeFromQuery ?? window.sessionStorage.getItem(PENDING_ROOM_CODE_KEY);
        if (!pendingCode || !username || !userID) {
            return;
        }
        joinRoomByCode(pendingCode);
        window.sessionStorage.removeItem(PENDING_ROOM_CODE_KEY);
    }, [joinRoomByCode, searchParams, userID, username]);

    const renderRoom = useCallback((room: ClientRoomType) => {
        const {roomName, readyStates} = room;
        return (
            <li key={room.roomID} style={{paddingTop: 4}}>
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
            return (
                <main className={styles.homeLayout}>
                    <section className={styles.panelStack}>
                        <TitleContainer className={`${styles.panel} ${styles.searchPanel} ${styles.blurredImage}`} style={{gridArea: 'e6-join'}}>
                            <TitleText className={styles.heroTitle}>
                                Art Feud
                            </TitleText>
                            <p className={styles.heroSubtitle}>
                                Log in with a username to start playing.
                            </p>
                            <form
                                className={styles.searchForm}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    createUsername(usernameInput);
                                    document.body.style.backgroundImage = 'none';
                                }}
                            >
                                <Input
                                    className={`${styles.input} ${styles.searchInput}`}
                                    type="text"
                                    placeholder="Enter a username to start playing!"
                                    size={30}
                                    value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.target.value)}
                                />
                                <Button type="submit" className={styles.searchButton}>
                                    Start
                                </Button>
                            </form>
                            <div className={styles.quickButtons}>
                                <Button type="button" className={styles.secondaryButton} variant="secondary">
                                    Quick Play
                                </Button>
                                <Button type="button" className={styles.secondaryButton} variant="secondary">
                                    How to Play
                                </Button>
                            </div>
                        </TitleContainer>
                        <Card className={`${styles.panel} ${styles.newsPanel}`}>
                            <p className={styles.panelTitle}>
                                News
                            </p>
                            <p>
                                Welcome to Art Feud! Invite friends, create a room, and race to tag your favorite art.
                            </p>
                            <a className={styles.panelLink} href="https://github.com/lseper/art-tag-feud">
                                Learn more about the project
                            </a>
                        </Card>
                        <Card className={`${styles.panel} ${styles.footerPanel}`}>
                            <div className={styles.footerRow}>
                                <span>Mascot by community artists</span>
                                <Button type="button" className={styles.secondaryButton} variant="secondary">
                                    Swap Mascot
                                </Button>
                            </div>
                            <div className={styles.footerLinks}>
                                <a href="https://github.com/lseper/art-tag-feud">Contribute</a>
                                <span>•</span>
                                <a href="https://github.com/lseper/art-tag-feud/issues">Issues</a>
                                <span>•</span>
                                <a href="https://github.com/lseper/art-tag-feud#readme">About</a>
                            </div>
                        </Card>
                    </section>
                </main>
            );
        }
        return (
            <main className={styles.homeLayout}>
                <section className={styles.panelStack}>
                    <Card className={`${styles.panel} ${styles.heroPanel}`}>
                        <h1 className={styles.cardTitle}>
                            Art Feud
                        </h1>
                        <h2 className={styles.cardSubtitle}>
                            Create a Room
                        </h2>
                        <Button className={styles.createRoomButton} onClick={createRoom}>
                            Create Room
                        </Button>
                    </Card>
                    <Card className={`${styles.panel} ${styles.privateJoinPanel}`}>
                        <form
                            className={styles.privateJoinForm}
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!roomCodeInput) {
                                    return;
                                }
                                joinRoomByCode(roomCodeInput);
                                setRoomCodeInput('');
                            }}
                        >
                            <label className={styles.privateJoinLabel} htmlFor="private-room-code">
                                Enter Room Code
                            </label>
                            <div className={styles.privateJoinRow}>
                                <Input
                                    id="private-room-code"
                                    className={`${styles.input} ${styles.privateJoinInput}`}
                                    type="text"
                                    placeholder="Enter a private room code"
                                    value={roomCodeInput}
                                    onChange={(event) => setRoomCodeInput(event.target.value)}
                                />
                                <Button type="submit" className={styles.joinRoomButton}>
                                    Join
                                </Button>
                            </div>
                        </form>
                    </Card>
                    <Card className={`${styles.panel} ${styles.cardCentered}`}>
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
                </section>
            </main>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.topBar}>
                <div className={styles.logoArea}>
                    <div className={styles.logoMark} aria-hidden />
                    <span className={styles.logoText}>Art Feud</span>
                </div>
                <nav className={styles.topNav}>
                    {navItems.map(item => (
                        <button key={item} type="button" className={styles.topNavItem}>
                            {item}
                        </button>
                    ))}
                </nav>
                <div className={styles.topActions}>
                    <span className={styles.usernamePill}>{username ?? 'Guest'}</span>
                    <button type="button" className={styles.menuButton}>
                        Menu
                    </button>
                </div>
            </header>
            {renderSignUp()}
        </div>
    );
}
