import React, { useContext, useCallback, useState, useEffect} from 'react';
import { UserContext } from '../contexts/UserContext';
import styled from 'styled-components';
import type { ClientRoomType, SetUsernameEventDataToClientType, JoinRoomEventDataToClientType, AllRoomsEventDataToClientType, SetUsernameEventDataType, AllRoomsEventDataType, JoinRoomEventDataType } from '../types';
import { EventType } from '../types';
import {
    useNavigate,
} from 'react-router-dom';
import { Container, TitleText, TitleContainer } from '../components/StyledElements';


type Props = {
    className?: string
}

export const Lobby: React.FC<Props> = ({className}: Props) => {
    const {roomID, setRoomID, setRoomName, userID, setUserID, setUsername, setReadyStates, setOwner, setBlacklist, username, connectionManager} = useContext(UserContext);
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
    }, [connectionManager, navigate, roomID, rooms, setBlacklist, setOwner, setReadyStates, setRoomID, setRoomName, setUserID, setUsername, userID]);

    
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

    const renderRoom = useCallback((room: ClientRoomType) => {
        const {roomName, readyStates} = room;
        return (
            <li key={roomID} style={{paddingTop: 4}}>
                <RoomNameContainer>
                    <p>
                        {roomName}
                    </p>
                </RoomNameContainer>
                <JoinRoomButton onClick={() => joinRoom(room.roomID)} className={'joinable'}>
                    Join!
                </JoinRoomButton>
                <ReadyUpStatesContainer>
                    {
                        readyStates.map(readyState => {
                            return <ReadyUpState className={readyState.ready ? 'ready' : ''}/>
                        })
                    }
                </ReadyUpStatesContainer>
            </li>
        )
    }, [joinRoom, roomID]);

    const renderSignUp = () => {
        if(!username) {
            return <Container>
                <BlurredImage style={{gridArea: 'e6-join', paddingBottom: 12}}>
                    <TitleText>
                        Art Feud
                    </TitleText>
                    <InfoBar>
                        <a href="https://github.com/lseper/art-tag-feud">contribute</a>
                    </InfoBar>
                    <label form="roomIDForm">
                            Log in wtih a username
                    </label>
                    <form id="roomIDForm" style={{paddingTop: 8}}onSubmit={(e) => {
                    e.preventDefault();
                    createUsername(usernameInput);
                    document.body.style.backgroundImage = 'none';
                }}>
                    <Input 
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
            <input type="submit" style={{marginRight: 8}} value="Start" form="roomIDForm"/>
            </BlurredImage>
        </Container>
        } else {
            return (
                <LobbyContainer>
                    <Card centered>
                        <CardTitle>
                            Art Feud
                        </CardTitle>
                        <CardSubtitle>
                            Create a Room!
                        </CardSubtitle>
                        <CreateRoomButton onClick={createRoom}>
                            Create Room
                        </CreateRoomButton>
                    </Card>
                    <Card inline>
                        <Credit href={'https://github.com/lseper/art-tag-feud'}>
                            contribute
                        </Credit>
                    </Card>
                    <Card centered>
                        <CardTitle>
                            Joinable Rooms
                        </CardTitle>
                        {
                            rooms.length === 0 && <p>No Rooms available to join</p>
                        }
                        <RoomsList>
                            {
                                rooms.map(room => renderRoom(room))
                            }
                        </RoomsList>
                    </Card>
                </LobbyContainer>
            )
        }
    }

    return renderSignUp();
}

const LobbyContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    padding: 24px 8px;

    @media (min-width: 600px) {
        padding: 64px 8px;
    }
`

type CardProps = {
    centered?: boolean,
    inline?: boolean,
    width?: number,
}

const Card = styled.div<CardProps>`
    display: flex;
    flex-direction: ${p => p.inline ? 'row' : 'column'};
    justify-content: center;
    align-items: ${p => p.centered ? 'center' : 'flex-start'};

    border-radius: 5px;
    box-shadow: 0 0 5px #000;
    text-shadow: 0 0 2px black, 0 0 6px black;
    text-align: center;

    width: ${p => p.width ? `${p.width}%` : 'auto'};

    padding: 8px 24px;
    margin-bottom: 24px;
`

const CardTitle = styled.h1`
    color: #b4c7d9;
    font-size: 2.5em;

    padding: 8px;
`

const CardSubtitle = styled.h2`
    font-size: 2em;
    margin-bottom: 8px;
`

const Credit = styled.a`
    color: #a3bcd3;
    text-decoration: none;
    padding: 0.25rem 0.5rem;
    border: 0;
    font-family: inherit;
    font-size: 100%;
    line-height: 1.25em;
    margin: 0;

    &:hover {
        color: #e9f2fa;
    }
`

const RoomsList = styled.ul`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: left;
    padding: 16px;

    li {
        display: grid;
        grid-template-columns: 3fr 1fr 4fr;
        column-gap: 2.5rem;
        background-color: ${p => p.theme.cBodyLight};
        border-radius: 4px;
        padding: 0 1rem 0.25rem 1rem;
    }
`

const CreateRoomButton = styled.button`
    min-width: 8rem;
    border-radius: 2px;
    padding: 1px 4px;
    line-height: normal;
    margin-bottom: 8px;
    vertical-align: middle;
    outline: none;
    cursor: pointer;
    border: none;
    
    &:focus {
        background: #ffc;
        color: #000;
        outline: none;
    }
`



const ReadyUpStatesContainer = styled.div`
    display: flex;
`

const RoomNameContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`

const ReadyUpState = styled.div`
    height: 25px;
    width: 25px;
    border: 2px solid ${p => p.theme.cTagCharacter};
    border-radius: 50%;
    background-color: transparent;
    transition: background-color .2s;
    &.ready {
        background-color: ${p => p.theme.cTagCharacter};
    }
`

const JoinRoomButton = styled.button`
    transition: color .2s, background-color .2s;
    border-radius: 25%;
  &.joinable {
    color: ${p => p.theme.cTagCharacter};
    background-color: ${p => p.theme.cTagCharacter};
    border:2px solid ${p => p.theme.cTagCharacter};
    background-color: transparent;
    
    &:hover {
      background-color: ${p => p.theme.cTagCharacter};
      color: ${p => p.theme.cBodyLight}
    }
  }

  &.unjoinable {
    color: ${p => p.theme.cTagSpecies};
    background-color: ${p => p.theme.cTagSpecies};
    border:2px solid ${p => p.theme.cTagSpecies};
    filter: brightness(50%);
  }
`

const Input = styled.input`
    border-radius: 4px;
    padding: 1px 2px;
    cursor: text;

    :focus {
        background: #ffc;
        color: #000;
        outline: none;
    }
`

const InfoBar = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
`;

const BlurredImage = styled(TitleContainer)`
    background-color: ${p => p.theme.cLobbyBackground};
    background-image: url('${p => p.theme.bgImageBlurNSFW}');
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-position: 50% 30%;
    background-size: 100%;
    backdrop-filter: blur(15px);
`
