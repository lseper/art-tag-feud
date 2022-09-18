import React, { useContext, useCallback, useState, useEffect} from 'react';
import { UserContext } from '../contexts/UserContext';
import styled from 'styled-components';
import type { ClientRoom, SetUsernameEventDataToClient, JoinRoomEventDataToClient, AllRoomsEventDataToClient, SetUsernameEventData, CreateRoomEventData, AllRoomsEventData, JoinRoomEventData } from '../types';
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
    const [rooms, setRooms] = useState<ClientRoom[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const onJoinRoom = (data: JoinRoomEventDataToClient) => {
          console.log(`user: ${data.user.id} has joined room: ${data.room.roomID}`);
          setRooms([data.room, ...rooms]);
          // if the update was for this room that we are in, then update the owner
          if(userID === data.user.id) {
              setRoomID(data.room.roomID);
              setReadyStates(data.room.readyStates);
              setOwner(data.room.owner)
              console.log(`set owner to ${data.room.owner.username}`);
            }
            
            if(userID === data.user.id) {
                navigate("/play");
                document.body.style.backgroundImage = 'none';
            }
        }
        const onAllRooms = (data: AllRoomsEventDataToClient) => {
            setRooms(data.rooms);
        }

        const onSetUsername = (data: SetUsernameEventDataToClient) => {
            if(!userID) {
                console.log(`Setting username to: ${data.user.id}`);
                setUserID(data.user.id);
            }
            setUsername(data.user.username);
        }
        // orchestrate game start
        const unsubscribers = [
            connectionManager.listen<JoinRoomEventDataToClient>(EventType.enum.JOIN_ROOM, onJoinRoom),
            connectionManager.listen<AllRoomsEventDataToClient>(EventType.enum.ALL_ROOMS, onAllRooms),
            connectionManager.listen<SetUsernameEventDataToClient>(EventType.enum.SET_USERNAME, onSetUsername)
        ];

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        }
    }, [connectionManager, navigate, roomID, rooms, setOwner, setReadyStates, setRoomID, setUserID, setUsername, userID]);

    
    const createUsername = useCallback((username: string) => {
        const data: SetUsernameEventData = {type: EventType.enum.SET_USERNAME, userID, username};
        connectionManager.send(data);
        console.log("setting username to ", username);
    }, [connectionManager, userID]);

    const createRoom = useCallback(() => {
        console.log(userID);
        if(userID) {
            const data: CreateRoomEventData = {type: EventType.enum.CREATE_ROOM, userID: userID};
            connectionManager.send(data);
            console.log("creating room");
        }
    }, [connectionManager, userID]);

    const joinRoom = useCallback((roomID: string) => {
        console.log(`JOINING ROOM ${roomID} FUCKING HELL`);
        console.log(`userId: ${userID}`);
        if(userID) {
            const data: JoinRoomEventData = {type: EventType.enum.JOIN_ROOM, roomID, userID};
            connectionManager.send(data);
        }
    }, [connectionManager, userID]);

    const getAllRooms = useCallback(() => {
        const data : AllRoomsEventData = {type: EventType.enum.ALL_ROOMS};
        connectionManager.send(data);
    }, [connectionManager])
    
    useEffect(() => {
        getAllRooms();
    }, [getAllRooms])

    const renderRoom = useCallback((room: ClientRoom) => {
        const {roomID, readyStates, owner} = room;
        return (
            <li key={roomID}>
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
                        <a href="google.com">contribute</a>
                        <a href="https://twitter.com/zaverose_nsfw">twitter</a>
                        <a href="google.com">website</a>
                        <a href="google.com">:3</a>
                    </InfoBar>
                    <label form="roomIDForm">
                            Log in wtih a username
                    </label>
                    <form id="roomIDForm" style={{paddingTop: 8}}onSubmit={(e) => {
                    e.preventDefault();
                    createUsername(usernameInput);
                }}>
                    <Input 
                    type="text" 
                    placeholder="enter a username here"
                    size={30}
                    value={usernameInput} 
                    onChange={(e) => setUsernameInput(e.target.value)}/>
                    </form>
                    <form id="roomIDForm" style={{paddingTop: 4, marginBottom: 4}}onSubmit={(e) => {
                    e.preventDefault();
                    createUsername(usernameInput);
                }}>
            </form>
            <input type="submit" style={{marginRight: 8}} value="Set Username" form="roomIDForm"/>
            </BlurredImage>
        </Container>
        }
        return <Container>
            <BlurredImage style={{gridArea: 'e6-join', paddingBottom: 12}}>
        <TitleText>
            e621 Tag Feud
        </TitleText>
        <h1 style={{marginTop: 0}}>Create a Room!</h1>
        <button onClick={createRoom}>
        Create Room
        </button>
        <InfoBar style={{paddingTop: 8}}>
            <p>Art by <a href="https://twitter.com/zaverose_nsfw/status/1462674512017723395">Zaverose</a></p>
        </InfoBar>
    </BlurredImage>
    <BlurredImage style={{gridArea: 'e6-create', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <InfoBar>
            <a href="google.com">contribute</a>
            <a href="https://twitter.com/zaverose_nsfw">twitter</a>
            <a href="google.com">website</a>
            <a href="google.com">:3</a>
        </InfoBar>
    </BlurredImage>
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
    
`;

// const RoomsView = styled(TitleView)`
//     /* height: 28rem; */
//     /* width: calc(100% - 10rem); */
//     /* margin-right: 80px; */
//     /* margin-left: 20px; */
// `;

const BlurredImage = styled(TitleContainer)`
    background-color: ${p => p.theme.cLobbyBackground};
    background-image: url('${p => p.theme.bgImageBlur}');
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-position: 50% 0%;
    background-size: 30%;
    backdrop-filter: blur(8px);
`