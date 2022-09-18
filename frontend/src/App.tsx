import ReadyUp from './pages/ReadyUp';
import { UserContext } from './contexts/UserContext';
import { User, UserReadyState } from './types';
import { useState } from 'react';
import { ConnectionManager } from './util/ConnectionManager';
import { Routes, Route } from 'react-router-dom';
import { Lobby } from './pages/Lobby';
import { ThemeProvider } from 'styled-components';
import theme from './styles/theme/Theme';
import GlobalStyles from './styles/theme/GlobalTheme';

const connectionManager = ConnectionManager.getInstance();

function App(): JSX.Element {
  const [username, setUsername] = useState<string | undefined>();
  const [userID, setUserID] = useState<string | undefined>();
  const [score, setScore] = useState(0);
  const [roomID, setRoomID] = useState<string | undefined>();
  const [readyStates, setReadyStates] = useState<UserReadyState[]>([]);
  const [icon, setIcon] = useState<string | undefined>();
  const [owner, setOwner] = useState<User | undefined>();

  const leaveRoomCleanup = () => {
    setRoomID(undefined);
    setScore(0);
    setReadyStates([]);
    setIcon(undefined);
    setOwner(undefined);
  }

  const value = {
    username, 
    userID, 
    score, 
    roomID, 
    icon, 
    readyStates, 
    owner, 
    setUsername, 
    setUserID, 
    setScore, 
    setRoomID, 
    setIcon, 
    setReadyStates, 
    setOwner, 
    leaveRoomCleanup, 
    connectionManager
  };

  return (
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={value}>
        <GlobalStyles />
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/play" element={<ReadyUp />} />
        </Routes>
      </UserContext.Provider>
    </ThemeProvider>
  )
}
// comment
export default App;
