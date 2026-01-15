import { UserContext } from '../contexts/UserContext';
import { useContext, useMemo, useEffect, useCallback, useState } from 'react';
import { TitleText, } from '../components/StyledElements';
import type {JoinRoomEventDataToClientType, LeaveRoomEventDataType, LeaveRoomEventDataToClientType, PreferlistFrequencyType, ReadyUpEventDataType, ReadyUpEventDataToClientType, RequestPostEventDataType, UpdateBlacklistEventDataToClientType, UpdateBlacklistEventDataType, UpdatePreferlistEventDataToClientType, UpdatePreferlistEventDataType, UserReadyStateType } from '../types';
import { EventType } from '../types';
import MainPage from './MainPage';
import IconPicker from '../components/IconPicker';
import { icons, buildUIIconImg } from '../util/UIUtil';
import usePostFetcher from '../usePostFetcher';
import {
  useNavigate,
} from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import styles from '@/styles/pages/ready-up.module.css';

// https://e621.net/help/api

export const ReadyUp : React.FC = () => {
  /**
   * Server-driven user values
   */
  const {userID, roomID, readyStates, owner, roomName, blacklist, preferlist, setOwner, setReadyStates, setBlacklist, setPreferlist, leaveRoomCleanup, connectionManager} = useContext(UserContext);
  const { currentPost, update } = usePostFetcher(connectionManager, roomID);
  const navigate = useNavigate();
  const [blacklistInput, setBlacklistInput] = useState('');
  const [preferlistInput, setPreferlistInput] = useState('');
  const [preferlistFrequency, setPreferlistFrequency] = useState<PreferlistFrequencyType>('most');
  
  useEffect(() => {
    const onNewUserJoin = (data: JoinRoomEventDataToClientType) => {
      setReadyStates(data.room.readyStates);
      setBlacklist(data.room.blacklist);
      setPreferlist(data.room.preferlist ?? []);
    }
    
    const onNewReadyStates = (data: ReadyUpEventDataToClientType) => {
      const readyStates = data.room.readyStates;
      // populate new ready states
      setReadyStates(readyStates);
      setBlacklist(data.room.blacklist);
      setPreferlist(data.room.preferlist ?? []);
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
      setBlacklist(data.room.blacklist);
      setPreferlist(data.room.preferlist ?? []);

    }

    const onBlacklistUpdate = (data: UpdateBlacklistEventDataToClientType) => {
      if(data.roomID === roomID) {
        setBlacklist(data.blacklist);
      }
    }
    const onPreferlistUpdate = (data: UpdatePreferlistEventDataToClientType) => {
      if(data.roomID === roomID) {
        setPreferlist(data.preferlist ?? []);
      }
    }

    // orchestrate game start
    const unsubscribers = [
        connectionManager.listen<ReadyUpEventDataToClientType>(EventType.enum.READY_UP, onNewReadyStates),
        connectionManager.listen<JoinRoomEventDataToClientType>(EventType.enum.JOIN_ROOM, onNewUserJoin),
        connectionManager.listen<LeaveRoomEventDataToClientType>(EventType.enum.LEAVE_ROOM, onUserLeftRoom),
        connectionManager.listen<UpdateBlacklistEventDataToClientType>(EventType.enum.UPDATE_BLACKLIST, onBlacklistUpdate),
        connectionManager.listen<UpdatePreferlistEventDataToClientType>(EventType.enum.UPDATE_PREFERLIST, onPreferlistUpdate),
    ];

    return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
    }
}, [connectionManager, owner, readyStates, roomID, setBlacklist, setOwner, setPreferlist, setReadyStates])

  const readyUp = useCallback((ready: boolean) => {
    if(userID != null && roomID != null) {
      const data: ReadyUpEventDataType = {type: EventType.enum.READY_UP, userID, roomID, ready};
      connectionManager.send(data);
    } else {
      console.error('user readied up before room or user was created')
    }
  }, [connectionManager, userID, roomID]);

  const canStartGame = useMemo(() => readyStates.every(readyState => readyState.ready && readyState.icon), [readyStates]);

  const normalizeBlacklistTag = useCallback((tag: string) => {
    return tag.trim().toLowerCase().replace(/\s+/g, '_');
  }, []);
  const normalizePreferlistTag = useCallback((tag: string) => {
    return normalizeBlacklistTag(tag);
  }, [normalizeBlacklistTag]);

  const addBlacklistTag = useCallback((tag: string) => {
    if(!roomID) {
      return;
    }
    const normalizedTag = normalizeBlacklistTag(tag);
    if(!normalizedTag) {
      return;
    }
    const data: UpdateBlacklistEventDataType = {type: EventType.enum.UPDATE_BLACKLIST, roomID, tag: normalizedTag, action: 'add'};
    connectionManager.send(data);
  }, [connectionManager, normalizeBlacklistTag, roomID]);

  const addPreferlistTag = useCallback((tag: string, frequency: PreferlistFrequencyType) => {
    if(!roomID) {
      return;
    }
    const normalizedTag = normalizePreferlistTag(tag);
    if(!normalizedTag) {
      return;
    }
    const data: UpdatePreferlistEventDataType = {type: EventType.enum.UPDATE_PREFERLIST, roomID, tag: normalizedTag, action: 'add', frequency};
    connectionManager.send(data);
  }, [connectionManager, normalizePreferlistTag, roomID]);

  const removeBlacklistTag = useCallback((tag: string) => {
    if(!roomID) {
      return;
    }
    const normalizedTag = normalizeBlacklistTag(tag);
    if(!normalizedTag) {
      return;
    }
    const data: UpdateBlacklistEventDataType = {type: EventType.enum.UPDATE_BLACKLIST, roomID, tag: normalizedTag, action: 'remove'};
    connectionManager.send(data);
  }, [connectionManager, normalizeBlacklistTag, roomID]);

  const removePreferlistTag = useCallback((tag: string) => {
    if(!roomID) {
      return;
    }
    const normalizedTag = normalizePreferlistTag(tag);
    if(!normalizedTag) {
      return;
    }
    const data: UpdatePreferlistEventDataType = {type: EventType.enum.UPDATE_PREFERLIST, roomID, tag: normalizedTag, action: 'remove'};
    connectionManager.send(data);
  }, [connectionManager, normalizePreferlistTag, roomID]);

  const updatePreferlistFrequency = useCallback((tag: string, frequency: PreferlistFrequencyType) => {
    if(!roomID) {
      return;
    }
    const normalizedTag = normalizePreferlistTag(tag);
    if(!normalizedTag) {
      return;
    }
    const data: UpdatePreferlistEventDataType = {type: EventType.enum.UPDATE_PREFERLIST, roomID, tag: normalizedTag, action: 'set_frequency', frequency};
    connectionManager.send(data);
  }, [connectionManager, normalizePreferlistTag, roomID]);

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
  }, [connectionManager, leaveRoomCleanup, navigate, roomID, userID]);

  const renderLobbyUserIcon = useCallback((userIcon?: string) => {
    if(userIcon) {
      return (
        <div style={{gridArea: 'icon'}} className={styles.iconChosen}>
          {buildUIIconImg(true, 'profile_icons/', userIcon)}
        </div>
      )
    }
    return (
      <div style={{gridArea: 'icon'}} className={styles.iconUnchosen}>
        <p>?</p>
      </div>
    )
  }, [])

  // TODO: make pretty
  const renderReadyState = useCallback((readyState: UserReadyStateType) => {
    const readyUpOnClick = () => readyUp(!readyState.ready);
    const readyUpButtonClassName = readyState.ready ? 'ready-down' : 'ready-up';
    const readyUpButtonText = readyState.ready ? 'Ready Down' : 'Ready Up';
    const readyUpButton = (
      <Button
        onClick={readyUpOnClick}
        className={cn(
          styles.readyUpButton,
          readyUpButtonClassName === 'ready-up' ? styles.readyUp : styles.readyDown,
        )}
        variant="outline"
      >
        {readyUpButtonText}
      </Button>
    );
    return(
      <li>
        {
          renderLobbyUserIcon(readyState.icon)
        }
        <div style={{gridArea: 'username'}} className={styles.usernameContainer}>
          <p>
              {readyState.user.username}
          </p>
        </div>
        <div style={{gridArea: 'ready-up-button'}}>
          {
            userID === readyState.user.id ? readyUpButton : (
              <p
                className={cn(
                  styles.readyStatus,
                  readyState.ready ? styles.readyStatusReady : styles.readyStatusNotReady,
                )}
              >
                {readyState.ready ? 'Ready!' : 'Waiting'}
              </p>
            )
          }
        </div>
      </li>
    );
  }, [readyUp, renderLobbyUserIcon, userID]);

  return currentPost ? <MainPage currentPost={currentPost} update={update}/> : (
    <div className={styles.readyUpView}>
      <div className={styles.readyUpContainer}>
          <TitleText>
              {roomName ?? "Unnamed Room"}
          </TitleText>
          <ul className={styles.readyUpList}>
              {
                  readyStates.map(readyState => renderReadyState(readyState))
              }  
          </ul>
      </div>
      <div className={styles.readyUpContainer} style={{gridArea: 'icons'}}>
        <IconPicker allIcons={icons.sfw}/>
      </div>
      <div className={styles.readyUpContainer} style={{gridArea: 'blacklist'}}>
        <TitleText>Blacklist</TitleText>
        <form className={styles.blacklistForm} onSubmit={(event) => {
          event.preventDefault();
          addBlacklistTag(blacklistInput);
          setBlacklistInput('');
        }}>
          <Input
            className={styles.blacklistInput}
            type="text"
            placeholder="Add a tag to blacklist"
            value={blacklistInput}
            onChange={(event) => setBlacklistInput(event.target.value)}
          />
          <Button className={styles.blacklistAddButton} type="submit" variant="outline">
            Add
          </Button>
        </form>
        <ul className={styles.blacklistList}>
          {
            blacklist.length === 0 && <p className={styles.blacklistEmptyText}>No tags blacklisted</p>
          }
          {
            blacklist.map((tag) => (
              <li className={styles.blacklistTag} key={tag}>
                <span>{tag}</span>
                <Button
                  className={styles.blacklistRemoveButton}
                  onClick={() => removeBlacklistTag(tag)}
                  aria-label={`Remove ${tag} from blacklist`}
                  size="icon"
                  variant="ghost"
                >
                  x
                </Button>
              </li>
            ))
          }
        </ul>
      </div>
      <div className={styles.readyUpContainer} style={{gridArea: 'preferlist'}}>
        <TitleText>Preferlist</TitleText>
        <form className={styles.blacklistForm} onSubmit={(event) => {
          event.preventDefault();
          addPreferlistTag(preferlistInput, preferlistFrequency);
          setPreferlistInput('');
        }}>
          <Input
            className={styles.blacklistInput}
            type="text"
            placeholder="Add a tag to prefer"
            value={preferlistInput}
            onChange={(event) => setPreferlistInput(event.target.value)}
          />
          <Select
            value={preferlistFrequency}
            onChange={(event) => setPreferlistFrequency(event.target.value as PreferlistFrequencyType)}
            aria-label="Preferlist tag frequency"
          >
            <option value="most">most of the time</option>
            <option value="all">all the time</option>
          </Select>
          <Button className={styles.blacklistAddButton} type="submit" variant="outline">
            Add
          </Button>
        </form>
        <ul className={styles.blacklistList}>
          {
            preferlist.length === 0 && <p className={styles.blacklistEmptyText}>No tags preferred</p>
          }
          {
            preferlist.map((entry) => (
              <li className={styles.blacklistTag} key={entry.tag}>
                <span>{entry.tag}</span>
                <div className={styles.preferlistFrequencyControl}>
                  <span className={styles.preferlistFrequencyLabel}>frequency?</span>
                  <Select
                    value={entry.frequency}
                    onChange={(event) => updatePreferlistFrequency(entry.tag, event.target.value as PreferlistFrequencyType)}
                  >
                    <option value="most">most of the time</option>
                    <option value="all">all the time</option>
                  </Select>
                </div>
                <Button
                  className={styles.blacklistRemoveButton}
                  onClick={() => removePreferlistTag(entry.tag)}
                  aria-label={`Remove ${entry.tag} from preferlist`}
                  size="icon"
                  variant="ghost"
                >
                  x
                </Button>
              </li>
            ))
          }
        </ul>
      </div>
      {
        <div className={styles.startGameContainer} style={{gridArea:'start-game'}}>
          {
            roomID && userID && (
              <RoomUpdateButton marginRight={owner && userID === owner.id} color="var(--c-tag-species)" onClick={leaveRoom}>
                Leave Room
              </RoomUpdateButton>
            )
          }
          {
            owner && userID === owner.id && (
              <RoomUpdateButton color="var(--c-tag-general)" onClick={startGame}>
                Start Game
              </RoomUpdateButton>
            )
          }
      </div>
      }
    </div> 
    );
}

type RoomUpdateButtonProps = {
  color: string,
  marginRight?: boolean,
} & React.ComponentProps<typeof Button>;

export const RoomUpdateButton: React.FC<RoomUpdateButtonProps> = ({
  color,
  marginRight,
  className,
  ...props
}) => (
  <Button
    {...props}
    className={cn(styles.roomUpdateButton, marginRight ? styles.hasMargin : '', className)}
    style={{ ['--room-update-color' as string]: color }}
    variant="outline"
  />
);

export default ReadyUp;
