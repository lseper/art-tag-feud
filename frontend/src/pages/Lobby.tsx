import React, { useContext, useCallback, useState, useEffect} from 'react';
import { UserContext } from '../contexts/UserContext';
import styled from 'styled-components';
import type { ClientRoomType, SetUsernameEventDataToClientType, JoinRoomEventDataToClientType, AllRoomsEventDataToClientType, SetUsernameEventDataType, AllRoomsEventDataType, JoinRoomEventDataType } from '../types';
import { EventType } from '../types';
import {
    useNavigate,
} from 'react-router-dom';
import { Container, List, Header, TitleText, TitleContainer } from '../components/StyledElements';


type Props = {
    className?: string
}

export const Lobby: React.FC<Props> = ({className}: Props) => {
    const {roomID, setRoomID, userID, setUserID, setUsername, setReadyStates, setOwner, username, connectionManager} = useContext(UserContext);
    const [usernameInput, setUsernameInput] = useState<string>('');
    const [rooms, setRooms] = useState<ClientRoomType[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // TODO: move this into Create.tsx
        const onJoinRoom = (data: JoinRoomEventDataToClientType) => {
          setRooms([data.room, ...rooms]);
          // if the update was for this room that we are in, then update the owner
          if(userID === data.user.id) {
              setRoomID(data.room.roomID);
              setReadyStates(data.room.readyStates);
              setOwner(data.room.owner)
            }
            
            if(userID === data.user.id) {
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
    }, [connectionManager, navigate, roomID, rooms, setOwner, setReadyStates, setRoomID, setUserID, setUsername, userID]);

    
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
        const {roomID, readyStates, owner} = room;
        return (
            <li key={roomID} style={{paddingTop: 4}}>
                <RoomNameContainer>
                    <p>
                        {`${owner.username}'s Room`}
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
    }, [joinRoom]);

    const renderSignUp = () => {
        if(!username) {
            return <Container>
                <BlurredImage style={{gridArea: 'e6-join', paddingBottom: 12}}>
                    <TitleText>
                        e621 Tag Feud
                    </TitleText>
                    <InfoBar>
                        <a href="https://github.com/Zaverose/e621-tag-feud">contribute</a>
                        <a href="https://twitter.com/zaverose_nsfw">twitter</a>
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
                    document.body.style.backgroundImage = 'none';
                }}>
            </form>
            <input type="submit" style={{marginRight: 8}} value="Start" form="roomIDForm"/>
            </BlurredImage>
        </Container>
        }
        return <Container>
            <TitleContainer style={{gridArea: 'e6-join', paddingBottom: 12}}>
        <TitleText>
            e621 Tag Feud
        </TitleText>
        <h1 style={{marginTop: 0}}>Create a Room!</h1>
        <button onClick={createRoom}>
        Create Room
        </button>
    </TitleContainer>
    <TitleContainer style={{gridArea: 'e6-create', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <InfoBar>
            <a href="https://github.com/Zaverose/e621-tag-feud">contribute</a>
            <a href="https://twitter.com/zaverose_nsfw">twitter</a>
        </InfoBar>
    </TitleContainer>
    <TitleContainer style={{gridArea: 'rooms', width: 'auto', marginLeft: '1rem', marginRight: '1rem'}}>
        <TitleText>
            Joinable Rooms
        </TitleText>
        <List>
            <Header>
                <p>room name</p>
                <p></p>
                <p>users</p>
            </Header>
            {
                rooms.map(room => renderRoom(room))
            }  
        </List>
    </TitleContainer>
    </Container>;
    }

    return renderSignUp();
}

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
    background-image: url('${p => p.theme.bgImageBlur}');
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-position: 50% 0%;
    background-size: 30%;
    backdrop-filter: blur(8px);
`