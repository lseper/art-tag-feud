import { UserContext } from './contexts/UserContext';
import type { PreferlistTagType, UserType, UserReadyStateType } from './types';
import { useState } from 'react';
import { ConnectionManager } from './util/ConnectionManager';
import { Routes, Route } from 'react-router-dom';
import { Lobby } from './pages/Lobby';
import Finish from './pages/Finish';
import GameSetup from './pages/GameSetup';

const connectionManager = ConnectionManager.getInstance();

function App(): JSX.Element {
  const [username, setUsername] = useState<string | undefined>();
  const [userID, setUserID] = useState<string | undefined>();
  const [score, setScore] = useState(0);
  const [roomID, setRoomID] = useState<string | undefined>();
  const [roomName, setRoomName] = useState<string | undefined>();
  const [readyStates, setReadyStates] = useState<UserReadyStateType[]>([]);
  const [icon, setIcon] = useState<string | undefined>();
  const [owner, setOwner] = useState<UserType | undefined>();
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [preferlist, setPreferlist] = useState<PreferlistTagType[]>([]);

  const leaveRoomCleanup = () => {
    setRoomID(undefined);
    setScore(0);
    setReadyStates([]);
    setIcon(undefined);
    setOwner(undefined);
    setBlacklist([]);
    setPreferlist([]);
  }

  const value = {
    username, 
    userID, 
    score, 
    roomID, 
    roomName,
    icon, 
    readyStates, 
    owner, 
    blacklist,
    preferlist,
    setUsername, 
    setUserID, 
    setScore, 
    setRoomID, 
    setRoomName,
    setIcon, 
    setReadyStates, 
    setOwner, 
    setBlacklist,
    setPreferlist,
    leaveRoomCleanup, 
    connectionManager
  };

  return (
    <UserContext.Provider value={value}>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/play" element={<GameSetup />} />
        <Route path="/create" element={<GameSetup />} />
        <Route path="/finish" element={<Finish />} />
      </Routes>
    </UserContext.Provider>
  )
}
// comment
export default App;
