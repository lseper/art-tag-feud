import { UserContext } from '../contexts/UserContext';
import { useContext, useMemo, useEffect, useCallback, useState, useRef } from 'react';
import { TitleText } from '../components/StyledElements';
import type {
  JoinRoomEventDataToClientType,
  LeaveRoomEventDataType,
  LeaveRoomEventDataToClientType,
  GameModeType,
  PreferlistFrequencyType,
  ReadyUpEventDataType,
  ReadyUpEventDataToClientType,
  RequestPostEventDataType,
  RoomRatingType,
  UpdateRoomSettingsEventDataToClientType,
  UpdateRoomSettingsEventDataType,
  UpdateBlacklistEventDataToClientType,
  UpdateBlacklistEventDataType,
  UpdatePreferlistEventDataToClientType,
  UpdatePreferlistEventDataType,
  UserReadyStateType,
  CreateRoomEventDataType,
  JoinRoomEventDataType,
  BotDifficultyType,
} from '../types';
import { EventType } from '../types';
import MainPage from './MainPage';
import IconPicker from '../components/IconPicker';
import { icons, buildUIIconImg } from '../util/UIUtil';
import usePostFetcher from '../usePostFetcher';
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import NumberPicker from '../components/NumberPicker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import styles from '@/styles/pages/game-setup.module.css';
import lobbyStyles from '@/styles/pages/lobby.module.css';

const POSTS_PER_ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ROUNDS_PER_GAME_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const BOT_COUNT_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const GAME_MODE_OPTIONS = ['Blitz', 'Roulette', 'Imposter'] as const;
const BOT_DIFFICULTY_OPTIONS: { value: BotDifficultyType; label: string }[] = [
  { value: 'Saint', label: 'Saint (Easy)' },
  { value: 'Sinner', label: 'Sinner (Medium)' },
  { value: 'Succubus', label: 'Succubus (Hard)' },
];
const BOT_DIFFICULTY_VALUES = new Set(BOT_DIFFICULTY_OPTIONS.map(option => option.value));
type GameModeOption = GameModeType;
type GameModeSettings = {
  postsPerRound: number[];
  roundsPerGame: number[];
};
type RoomSettingsUpdate = {
  roomName?: string;
  postsPerRound?: number;
  roundsPerGame?: number;
  botCount?: number;
  botDifficulties?: BotDifficultyType[];
  gameMode?: GameModeOption;
  rating?: RoomRatingType;
  isPrivate?: boolean;
};
const RATING_OPTIONS = ['Safe', 'Questionable', 'Explicit'] as const;
const RATING_STYLE_MAP = {
  Safe: styles.ratingButtonSafe,
  Questionable: styles.ratingButtonQuestionable,
  Explicit: styles.ratingButtonExplicit,
} as const;

const navItems = [
  'Artists',
  'Posts',
  'Pools',
  'Sets',
  'Tags',
  'Blips',
  'Comments',
  'Forum',
  'Wiki',
  'Help',
  'Discord',
  'More',
];

const PENDING_ROOM_CODE_KEY = 'artFeudPendingRoomCode';

const createRoomCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 12; i += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
};

export const GameSetup: React.FC = () => {
  const {
    userID,
    roomID,
    username,
    readyStates,
    owner,
    roomName,
    roomCode,
    isPrivate,
    blacklist,
    preferlist,
    setRoomID,
    setRoomName,
    setRoomCode,
    setIsPrivate,
    setOwner,
    setReadyStates,
    setBlacklist,
    setPreferlist,
    setScore,
    leaveRoomCleanup,
    connectionManager,
  } = useContext(UserContext);

  const { currentPost, botActionSequence, roundGuesses, update } = usePostFetcher(connectionManager, roomID);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [roomNameInput, setRoomNameInput] = useState(() => (username ? `${username}'s Room` : ''));
  const [postsPerRound, setPostsPerRound] = useState<number[]>([3]);
  const [roundsPerGame, setRoundsPerGame] = useState<number[]>([3]);
  const [botCount, setBotCount] = useState<number[]>([0]);
  const [botDifficulties, setBotDifficulties] = useState<BotDifficultyType[]>([]);
  const [blacklistInput, setBlacklistInput] = useState('');
  const [preferlistInput, setPreferlistInput] = useState('');
  const [preferlistFrequency, setPreferlistFrequency] = useState<PreferlistFrequencyType>('most');
  const [gameMode, setGameMode] = useState<GameModeOption>('Blitz');
  const [rating, setRating] = useState<RoomRatingType>('Explicit');
  const [isGameModeExpanded, setIsGameModeExpanded] = useState(true);
  const [fallbackRoomCode] = useState(() => createRoomCode());
  const hasAutoCreatedRoom = useRef(false);
  const hasEditedRoomName = useRef(false);
  const hasDeepLinkedJoin = useRef(false);
  const pendingBotDifficultiesRef = useRef<BotDifficultyType[] | null>(null);
  const gameModeSettingsCache = useRef<Record<GameModeOption, GameModeSettings>>(
    GAME_MODE_OPTIONS.reduce((acc, option) => {
      acc[option] = {
        postsPerRound: [3],
        roundsPerGame: [3],
      };
      return acc;
    }, {} as Record<GameModeOption, GameModeSettings>),
  );

  const mergeBotScores = useCallback((incoming: UserReadyStateType[]) => {
    const botScoreMap = new Map(
      readyStates
        .filter(state => state.user.isBot)
        .map(state => [state.user.id, state.user.score]),
    );
    return incoming.map(state => {
      if (!state.user.isBot) {
        return state;
      }
      const cachedScore = botScoreMap.get(state.user.id);
      if (cachedScore == null) {
        return state;
      }
      return {
        ...state,
        user: {
          ...state.user,
          score: cachedScore,
        },
      };
    });
  }, [readyStates]);




  useEffect(() => {
    if (roomName && !hasEditedRoomName.current) {
      setRoomNameInput(roomName);
    }
  }, [roomName]);

  useEffect(() => {
    if (!hasEditedRoomName.current && username && !roomNameInput) {
      setRoomNameInput(`${username}'s Room`);
    }
  }, [roomNameInput, username]);

  useEffect(() => {
    const onNewUserJoin = (data: JoinRoomEventDataToClientType) => {
      setReadyStates(mergeBotScores(data.room.readyStates));
      setBlacklist(data.room.blacklist);
      setPreferlist(data.room.preferlist ?? []);
      setRoomName(data.room.roomName);
      setRoomCode(data.room.roomCode);
      setIsPrivate(data.room.isPrivate);
      setPostsPerRound([data.room.postsPerRound]);
      setRoundsPerGame([data.room.roundsPerGame]);
      setBotCount([data.room.botCount ?? 0]);
      applyIncomingBotDifficulties(data.room.botCount ?? 0, data.room.botDifficulties);
      setGameMode(data.room.gameMode);
      setRating(data.room.rating);
      if (userID === data.user.id) {
        setRoomID(data.room.roomID);
        setOwner(data.room.owner);
        setScore(data.user.score);
        document.body.style.backgroundImage = 'none';
        navigate('/play');
      }
    };

    const onNewReadyStates = (data: ReadyUpEventDataToClientType) => {
      setReadyStates(mergeBotScores(data.room.readyStates));
      setBlacklist(data.room.blacklist);
      setPreferlist(data.room.preferlist ?? []);
      setRoomName(data.room.roomName);
      setRoomCode(data.room.roomCode);
      setIsPrivate(data.room.isPrivate);
      setPostsPerRound([data.room.postsPerRound]);
      setRoundsPerGame([data.room.roundsPerGame]);
      setBotCount([data.room.botCount ?? 0]);
      applyIncomingBotDifficulties(data.room.botCount ?? 0, data.room.botDifficulties);
      setGameMode(data.room.gameMode);
      setRating(data.room.rating);
    };

    const onUserLeftRoom = (data: LeaveRoomEventDataToClientType) => {
      const newOwner = data.room.owner;
      if (!owner) {
        setOwner(newOwner);
      } else if (owner.id !== newOwner.id) {
        setOwner(newOwner);
      }
      setReadyStates(mergeBotScores(data.room.readyStates));
      setBlacklist(data.room.blacklist);
      setPreferlist(data.room.preferlist ?? []);
      setRoomName(data.room.roomName);
      setRoomCode(data.room.roomCode);
      setIsPrivate(data.room.isPrivate);
      setPostsPerRound([data.room.postsPerRound]);
      setRoundsPerGame([data.room.roundsPerGame]);
      setBotCount([data.room.botCount ?? 0]);
      applyIncomingBotDifficulties(data.room.botCount ?? 0, data.room.botDifficulties);
      setGameMode(data.room.gameMode);
      setRating(data.room.rating);
    };

    const onBlacklistUpdate = (data: UpdateBlacklistEventDataToClientType) => {
      if (data.roomID === roomID) {
        setBlacklist(data.blacklist);
      }
    };

    const onPreferlistUpdate = (data: UpdatePreferlistEventDataToClientType) => {
      if (data.roomID === roomID) {
        setPreferlist(data.preferlist ?? []);
      }
    };

    const onRoomSettingsUpdate = (data: UpdateRoomSettingsEventDataToClientType) => {
      if (data.roomID !== roomID) {
        return;
      }
      setRoomName(data.roomName);
      setRoomCode(data.roomCode);
      setIsPrivate(data.isPrivate);
      setPostsPerRound([data.postsPerRound]);
      setRoundsPerGame([data.roundsPerGame]);
      setBotCount([data.botCount ?? 0]);
      applyIncomingBotDifficulties(data.botCount ?? 0, data.botDifficulties);
      setGameMode(data.gameMode);
      setRating(data.rating);
      if (!hasEditedRoomName.current) {
        setRoomNameInput(data.roomName);
      }
    };

    const unsubscribers = [
      connectionManager.listen<ReadyUpEventDataToClientType>(EventType.enum.READY_UP, onNewReadyStates),
      connectionManager.listen<JoinRoomEventDataToClientType>(EventType.enum.JOIN_ROOM, onNewUserJoin),
      connectionManager.listen<LeaveRoomEventDataToClientType>(EventType.enum.LEAVE_ROOM, onUserLeftRoom),
      connectionManager.listen<UpdateBlacklistEventDataToClientType>(EventType.enum.UPDATE_BLACKLIST, onBlacklistUpdate),
      connectionManager.listen<UpdatePreferlistEventDataToClientType>(EventType.enum.UPDATE_PREFERLIST, onPreferlistUpdate),
      connectionManager.listen<UpdateRoomSettingsEventDataToClientType>(
        EventType.enum.UPDATE_ROOM_SETTINGS,
        onRoomSettingsUpdate,
      ),
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [
    applyIncomingBotDifficulties,
    connectionManager,
    mergeBotScores,
    navigate,
    owner,
    roomID,
    setBlacklist,
    setOwner,
    setPreferlist,
    setReadyStates,
    setRoomCode,
    setRoomID,
    setIsPrivate,
    setRoomName,
    setScore,
    userID,
  ]);

  const inputsAreValid = useMemo(() => {
    return roomNameInput.length !== 0
      && postsPerRound.length > 0
      && postsPerRound[0] > 0
      && postsPerRound[0] <= 10
      && roundsPerGame.length > 0
      && roundsPerGame[0] > 0
      && roundsPerGame[0] <= 10
      && botCount.length > 0
      && botCount[0] >= 0
      && botCount[0] <= 9;
  }, [botCount, roomNameInput, postsPerRound, roundsPerGame]);

  useEffect(() => {
    gameModeSettingsCache.current[gameMode] = {
      postsPerRound: [...postsPerRound],
      roundsPerGame: [...roundsPerGame],
    };
  }, [gameMode, postsPerRound, roundsPerGame]);

  useEffect(() => {
    if (!inputsAreValid && !isGameModeExpanded) {
      setIsGameModeExpanded(true);
    }
  }, [inputsAreValid, isGameModeExpanded]);

  const displayRoomCode = useMemo(() => {
    if (roomCode) {
      return roomCode;
    }
    if (!roomID) {
      return fallbackRoomCode;
    }
    const cleaned = roomID.replace(/[^a-zA-Z0-9]/g, '');
    if (cleaned.length >= 12) {
      return cleaned.slice(0, 12);
    }
    return `${cleaned}${fallbackRoomCode}`.slice(0, 12);
  }, [fallbackRoomCode, roomCode, roomID]);

  const roomCodeParam = searchParams.get('room');

  useEffect(() => {
    if (!roomCodeParam || roomID) {
      return;
    }
    if (!userID || !username) {
      window.sessionStorage.setItem(PENDING_ROOM_CODE_KEY, roomCodeParam);
      navigate('/');
      return;
    }
    if (hasDeepLinkedJoin.current) {
      return;
    }
    hasDeepLinkedJoin.current = true;
    const data: JoinRoomEventDataType = {
      type: EventType.enum.JOIN_ROOM,
      roomCode: roomCodeParam,
      userID,
    };
    connectionManager.send(data);
  }, [connectionManager, navigate, roomCodeParam, roomID, userID, username]);

  const canStartGame = useMemo(
    () => readyStates.every(readyState => (
      readyState.user.isBot ? readyState.ready : (readyState.ready && readyState.icon)
    )),
    [readyStates],
  );
  const isHost = userID != null && owner?.id === userID;



  const normalizeBlacklistTag = useCallback((tag: string) => {
    return tag.trim().toLowerCase().replace(/\s+/g, '_');
  }, []);

  const normalizePreferlistTag = useCallback((tag: string) => {
    return normalizeBlacklistTag(tag);
  }, [normalizeBlacklistTag]);

  const addBlacklistTag = useCallback((tag: string) => {
    if (!roomID) {
      return;
    }
    const normalizedTag = normalizeBlacklistTag(tag);
    if (!normalizedTag) {
      return;
    }
    const data: UpdateBlacklistEventDataType = {
      type: EventType.enum.UPDATE_BLACKLIST,
      roomID,
      tag: normalizedTag,
      action: 'add',
    };
    connectionManager.send(data);
  }, [connectionManager, normalizeBlacklistTag, roomID]);

  const addPreferlistTag = useCallback((tag: string, frequency: PreferlistFrequencyType) => {
    if (!roomID) {
      return;
    }
    const normalizedTag = normalizePreferlistTag(tag);
    if (!normalizedTag) {
      return;
    }
    const data: UpdatePreferlistEventDataType = {
      type: EventType.enum.UPDATE_PREFERLIST,
      roomID,
      tag: normalizedTag,
      action: 'add',
      frequency,
    };
    connectionManager.send(data);
  }, [connectionManager, normalizePreferlistTag, roomID]);

  const removeBlacklistTag = useCallback((tag: string) => {
    if (!roomID) {
      return;
    }
    const normalizedTag = normalizeBlacklistTag(tag);
    if (!normalizedTag) {
      return;
    }
    const data: UpdateBlacklistEventDataType = {
      type: EventType.enum.UPDATE_BLACKLIST,
      roomID,
      tag: normalizedTag,
      action: 'remove',
    };
    connectionManager.send(data);
  }, [connectionManager, normalizeBlacklistTag, roomID]);

  const removePreferlistTag = useCallback((tag: string) => {
    if (!roomID) {
      return;
    }
    const normalizedTag = normalizePreferlistTag(tag);
    if (!normalizedTag) {
      return;
    }
    const data: UpdatePreferlistEventDataType = {
      type: EventType.enum.UPDATE_PREFERLIST,
      roomID,
      tag: normalizedTag,
      action: 'remove',
    };
    connectionManager.send(data);
  }, [connectionManager, normalizePreferlistTag, roomID]);

  const updatePreferlistFrequency = useCallback((tag: string, frequency: PreferlistFrequencyType) => {
    if (!roomID) {
      return;
    }
    const normalizedTag = normalizePreferlistTag(tag);
    if (!normalizedTag) {
      return;
    }
    const data: UpdatePreferlistEventDataType = {
      type: EventType.enum.UPDATE_PREFERLIST,
      roomID,
      tag: normalizedTag,
      action: 'set_frequency',
      frequency,
    };
    connectionManager.send(data);
  }, [connectionManager, normalizePreferlistTag, roomID]);

  const readyUp = useCallback((ready: boolean) => {
    if (userID != null && roomID != null) {
      const data: ReadyUpEventDataType = { type: EventType.enum.READY_UP, userID, roomID, ready };
      connectionManager.send(data);
    } else {
      console.error('user readied up before room or user was created');
    }
  }, [connectionManager, userID, roomID]);

  function normalizeBotDifficulties(count: number, difficulties: BotDifficultyType[]) {
    return Array.from({ length: count }, (_value, index) => {
      const entry = difficulties[index];
      return BOT_DIFFICULTY_VALUES.has(entry) ? entry : 'Sinner';
    });
  }

  function botDifficultiesMatch(left: BotDifficultyType[], right: BotDifficultyType[]) {
    if (left.length !== right.length) {
      return false;
    }
    return left.every((value, index) => value === right[index]);
  }

  function applyIncomingBotDifficulties(incomingCount: number, incoming?: BotDifficultyType[]) {
    const normalizedIncoming = normalizeBotDifficulties(incomingCount, incoming ?? []);
    const pending = pendingBotDifficultiesRef.current;
    if (isHost && pending && !botDifficultiesMatch(pending, normalizedIncoming)) {
      setBotDifficulties(pending);
      return;
    }
    pendingBotDifficultiesRef.current = null;
    setBotDifficulties(normalizedIncoming);
  }


  const displayedBotDifficulties = useMemo(
    () => normalizeBotDifficulties(botCount[0] ?? 0, botDifficulties),
    [botCount, botDifficulties, normalizeBotDifficulties],
  );

  useEffect(() => {
    const normalized = normalizeBotDifficulties(botCount[0] ?? 0, botDifficulties);
    if (normalized.length !== botDifficulties.length || normalized.some((value, index) => value !== botDifficulties[index])) {
      setBotDifficulties(normalized);
    }
  }, [botCount, botDifficulties, normalizeBotDifficulties]);

  const createGame = useCallback(() => {
    if (inputsAreValid && userID) {
      const data: CreateRoomEventDataType = {
        roomID,
        type: EventType.enum.CREATE_ROOM,
        userID,
        postsPerRound: postsPerRound[0],
        roundsPerGame: roundsPerGame[0],
        botCount: botCount[0],
        botDifficulties: normalizeBotDifficulties(botCount[0], botDifficulties),
        roomName: roomNameInput,
        gameMode,
        rating,
        isPrivate,
      };
      connectionManager.send(data);
    }
  }, [
    botCount,
    botDifficulties,
    connectionManager,
    gameMode,
    inputsAreValid,
    normalizeBotDifficulties,
    postsPerRound,
    rating,
    roomID,
    roomNameInput,
    roundsPerGame,
    userID,
  ]);

  useEffect(() => {
    if (!roomID && !roomCodeParam && userID && inputsAreValid && !hasAutoCreatedRoom.current) {
      hasAutoCreatedRoom.current = true;
      createGame();
    }
  }, [createGame, inputsAreValid, roomCodeParam, roomID, userID]);

  const startGame = useCallback(() => {
    if (roomID && userID && userID === owner?.id && canStartGame) {
      const data: RequestPostEventDataType = { type: EventType.enum.REQUEST_POST, roomID, userID };
      connectionManager.send(data);
    }
  }, [roomID, userID, owner?.id, canStartGame, connectionManager]);

  const leaveRoom = useCallback(() => {
    if (roomID && userID) {
      const data: LeaveRoomEventDataType = { type: EventType.enum.LEAVE_ROOM, userID, roomID };
      connectionManager.send(data);
      leaveRoomCleanup();
    }
    navigate('/');
  }, [connectionManager, leaveRoomCleanup, navigate, roomID, userID]);

  const handleCopy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
    }
  }, []);

  const sendRoomSettingsUpdate = useCallback((overrides: RoomSettingsUpdate = {}) => {
    if (!roomID || !userID || !isHost) {
      return;
    }
    const nextRoomName = overrides.roomName ?? roomNameInput;
    const nextPostsPerRound = overrides.postsPerRound ?? postsPerRound[0];
    const nextRoundsPerGame = overrides.roundsPerGame ?? roundsPerGame[0];
    const nextBotCount = overrides.botCount ?? botCount[0];
    const nextBotDifficulties = normalizeBotDifficulties(
      nextBotCount,
      overrides.botDifficulties ?? botDifficulties,
    );
    const nextGameMode = overrides.gameMode ?? gameMode;
    const nextRating = overrides.rating ?? rating;
    const nextIsPrivate = overrides.isPrivate ?? isPrivate;
    if (!nextRoomName || nextPostsPerRound == null || nextRoundsPerGame == null || nextBotCount == null) {
      return;
    }
    const data: UpdateRoomSettingsEventDataType = {
      type: EventType.enum.UPDATE_ROOM_SETTINGS,
      roomID,
      userID,
      roomName: nextRoomName,
      postsPerRound: nextPostsPerRound,
      roundsPerGame: nextRoundsPerGame,
      botCount: nextBotCount,
      botDifficulties: nextBotDifficulties,
      gameMode: nextGameMode,
      rating: nextRating,
      isPrivate: nextIsPrivate,
    };
    pendingBotDifficultiesRef.current = nextBotDifficulties;
    connectionManager.send(data);
  }, [
    connectionManager,
    gameMode,
    isHost,
    rating,
    roomID,
    roomNameInput,
    roundsPerGame,
    postsPerRound,
    botCount,
    botDifficulties,
    isPrivate,
    userID,
  ]);


  const updatePostsPerRound = useCallback((nextPostsPerRound: number[]) => {
    setPostsPerRound(nextPostsPerRound);
    if (nextPostsPerRound[0] != null) {
      sendRoomSettingsUpdate({ postsPerRound: nextPostsPerRound[0] });
    }
  }, [sendRoomSettingsUpdate]);

  const updateRoundsPerGame = useCallback((nextRoundsPerGame: number[]) => {
    setRoundsPerGame(nextRoundsPerGame);
    if (nextRoundsPerGame[0] != null) {
      sendRoomSettingsUpdate({ roundsPerGame: nextRoundsPerGame[0] });
    }
  }, [sendRoomSettingsUpdate]);

  const updateBotCount = useCallback((nextBotCount: number[]) => {
    setBotCount(nextBotCount);
    if (nextBotCount[0] != null) {
      const nextDifficulties = normalizeBotDifficulties(nextBotCount[0], botDifficulties);
      setBotDifficulties(nextDifficulties);
      sendRoomSettingsUpdate({ botCount: nextBotCount[0], botDifficulties: nextDifficulties });
    }
  }, [botDifficulties, normalizeBotDifficulties, sendRoomSettingsUpdate]);

  const updateBotDifficulty = useCallback((index: number, nextDifficulty: BotDifficultyType) => {
    const base = normalizeBotDifficulties(botCount[0] ?? 0, botDifficulties);
    const next = [...base];
    next[index] = nextDifficulty;
    setBotDifficulties(next);
    sendRoomSettingsUpdate({ botDifficulties: next });
  }, [botCount, botDifficulties, normalizeBotDifficulties, sendRoomSettingsUpdate]);

  const saveGameSetup = useCallback(() => {
    if (inputsAreValid) {
      sendRoomSettingsUpdate();
    }
  }, [inputsAreValid, sendRoomSettingsUpdate]);

  const handleGameModeChange = useCallback((nextMode: GameModeOption) => {
    if (!isHost) {
      return;
    }
    gameModeSettingsCache.current[gameMode] = {
      postsPerRound: [...postsPerRound],
      roundsPerGame: [...roundsPerGame],
    };
    const cachedSettings = gameModeSettingsCache.current[nextMode];
    if (!isGameModeExpanded) {
      setIsGameModeExpanded(true);
    }
    setGameMode(nextMode);
    const nextPostsPerRound = cachedSettings?.postsPerRound ?? postsPerRound;
    const nextRoundsPerGame = cachedSettings?.roundsPerGame ?? roundsPerGame;
    setPostsPerRound([...nextPostsPerRound]);
    setRoundsPerGame([...nextRoundsPerGame]);
    if (nextPostsPerRound[0] != null && nextRoundsPerGame[0] != null) {
      sendRoomSettingsUpdate({
        gameMode: nextMode,
        postsPerRound: nextPostsPerRound[0],
        roundsPerGame: nextRoundsPerGame[0],
      });
    }
  }, [gameMode, isGameModeExpanded, isHost, postsPerRound, roundsPerGame, sendRoomSettingsUpdate]);

  const renderLobbyUserIcon = useCallback((userIcon?: string) => {
    if (userIcon) {
      return (
        <div className={styles.iconChosen}>
          {buildUIIconImg(true, 'profile_icons/', userIcon)}
        </div>
      );
    }
    return (
      <div className={styles.iconUnchosen}>
        <p>?</p>
      </div>
    );
  }, []);

  const renderReadyState = useCallback((readyState: UserReadyStateType) => {
    const readyUpOnClick = () => readyUp(!readyState.ready);
    const readyUpButtonClassName = readyState.ready ? styles.readyDown : styles.readyUp;
    const readyUpButtonText = readyState.ready ? 'Ready Down' : 'Ready Up';
    const readyUpButton = (
      <Button
        onClick={readyUpOnClick}
        className={cn(styles.readyUpButton, readyUpButtonClassName)}
        variant="outline"
      >
        {readyUpButtonText}
      </Button>
    );
    return (
      <li className={styles.readyItem} key={readyState.user.id}>
        {renderLobbyUserIcon(readyState.icon)}
        <div className={styles.readyUsername}>
          <p>{readyState.user.username}</p>
        </div>
        <div className={styles.readyAction}>
          {userID === readyState.user.id ? readyUpButton : (
            <p className={cn(styles.readyStatus, readyState.ready ? styles.readyStatusReady : styles.readyStatusNotReady)}>
              {readyState.ready ? 'Ready!' : 'Waiting'}
            </p>
          )}
        </div>
      </li>
    );
  }, [readyUp, renderLobbyUserIcon, userID]);

  if (currentPost) {
    return (
      <MainPage
        currentPost={currentPost}
        update={update}
        gameMode={gameMode}
        botActionSequence={botActionSequence}
        roundGuesses={roundGuesses}
      />
    );
  }

  return (
    <div className={styles.page}>
      <header className={lobbyStyles.topBar}>
        <div className={lobbyStyles.logoArea}>
          <div className={lobbyStyles.logoMark} aria-hidden />
          <span className={lobbyStyles.logoText}>Art Feud</span>
        </div>
        <nav className={lobbyStyles.topNav}>
          {navItems.map(item => (
            <button key={item} type="button" className={lobbyStyles.topNavItem}>
              {item}
            </button>
          ))}
        </nav>
        <div className={lobbyStyles.topActions}>
          <span className={lobbyStyles.usernamePill}>{username ?? 'Guest'}</span>
          <button type="button" className={lobbyStyles.menuButton}>
            Menu
          </button>
        </div>
      </header>
      <main className={styles.layout}>
        <section className={styles.formColumn}>
          <div className={styles.noticePanel}>
            <TitleText className={styles.noticeTitle}>
              Before starting, confirm your room setup.
            </TitleText>
            <p>Pick a mode, tune the room size, and share the code if you want a public lobby.</p>
          </div>
          <div className={styles.formGrid}>
            <section className={cn(styles.formSection, !isHost && styles.readOnlySection)} aria-disabled={!isHost}>
              <div className={styles.sectionInfo}>
                <div className={styles.sectionTitleRow}>
                  <h2>Game Mode</h2>
                  <button
                    type="button"
                    className={styles.caretButton}
                    onClick={() => setIsGameModeExpanded((prev) => !prev)}
                    disabled={!inputsAreValid || !isHost}
                    aria-expanded={isGameModeExpanded}
                    aria-controls="game-mode-dependent"
                    aria-label={isGameModeExpanded ? 'Collapse game mode settings' : 'Expand game mode settings'}
                  >
                    <span className={cn(styles.caretIcon, !isGameModeExpanded && styles.caretIconCollapsed)} aria-hidden />
                  </button>
                </div>
                <p>Pick the ruleset for this round. Hover a mode to preview.</p>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.modeGrid}>
                  {GAME_MODE_OPTIONS.map(option => (
                    <div
                      key={option}
                      className={cn(styles.modeOption, gameMode === option ? styles.modeOptionActive : '')}
                    >
                      <button
                        type="button"
                        className={styles.modeButton}
                        onClick={() => handleGameModeChange(option)}
                        disabled={!isHost}
                        aria-pressed={gameMode === option}
                      >
                        {option}
                      </button>
                      <span className={styles.modeHelp} aria-label={`${option} preview`}>
                        ?
                        <span className={styles.modePopover}>
                          <span className={styles.modePreview} aria-hidden />
                          <span className={styles.modeDescription}>
                            {option} mode preview (placeholder). Short description goes here.
                          </span>
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div
              id="game-mode-dependent"
              className={cn(styles.gameModeDependent, !isGameModeExpanded && styles.gameModeDependentCollapsed)}
              aria-hidden={!isGameModeExpanded}
            >
              <section className={cn(styles.formSection, !isHost && styles.readOnlySection)} aria-disabled={!isHost}>
                <div className={styles.sectionInfo}>
                  <h2>Room Name</h2>
                  <p>This will be the name of your joinable game.</p>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.fieldRow}>
                    <label htmlFor="room-name">Room Name</label>
                    <Input
                      id="room-name"
                      className={styles.textInput}
                      type="text"
                      placeholder='e.g "My Room"'
                      value={roomNameInput}
                      onChange={(event) => {
                        hasEditedRoomName.current = true;
                        setRoomNameInput(event.target.value);
                        sendRoomSettingsUpdate({ roomName: event.target.value });
                      }}
                      disabled={!isHost}
                    />
                  </div>
                </div>
              </section>
              <section className={cn(styles.formSection, !isHost && styles.readOnlySection)} aria-disabled={!isHost}>
                <div className={styles.sectionInfo}>
                  <h2>Room Setup</h2>
                  <p>Configure the round length.</p>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.pickerStack}>
                    <NumberPicker
                      title="Posts Per Round"
                      options={POSTS_PER_ROUND_OPTIONS}
                      selected={postsPerRound}
                      setSelected={updatePostsPerRound}
                      color="var(--c-tag-species)"
                      backgroundColor="var(--background)"
                      singleSelect
                      disabled={!isHost}
                    />
                    <NumberPicker
                      title="Rounds Per Game"
                      options={ROUNDS_PER_GAME_OPTIONS}
                      selected={roundsPerGame}
                      setSelected={updateRoundsPerGame}
                      color="var(--c-tag-species)"
                      backgroundColor="var(--background)"
                      singleSelect
                      disabled={!isHost}
                    />
                  </div>
                </div>
              </section>
            </div>

            <section className={cn(styles.formSection, !isHost && styles.readOnlySection)} aria-disabled={!isHost}>
              <div className={styles.sectionInfo}>
                <h2>Bot Settings</h2>
                <p>Choose how many bots to add and how quickly they guess tags.</p>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.pickerStack}>
                  <NumberPicker
                    title="Bot Count"
                    options={BOT_COUNT_OPTIONS}
                    selected={botCount}
                    setSelected={updateBotCount}
                    color="var(--c-tag-species)"
                    backgroundColor="var(--background)"
                    singleSelect
                    disabled={!isHost}
                  />
                  {displayedBotDifficulties.length === 0 ? (
                    <p className={styles.helperText}>Add bots to choose difficulty per bot.</p>
                  ) : (
                    <div className={styles.botDifficultyList}>
                      {displayedBotDifficulties.map((difficulty, index) => (
                        <div className={styles.fieldRow} key={`bot-difficulty-${index}`}>
                          <label htmlFor={`bot-difficulty-${index}`}>Bot {index + 1} Difficulty</label>
                          <Select
                            id={`bot-difficulty-${index}`}
                            className={styles.textInput}
                            value={difficulty}
                            onChange={(event) => updateBotDifficulty(index, event.target.value as BotDifficultyType)}
                            disabled={!isHost}
                          >
                            {BOT_DIFFICULTY_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className={cn(styles.formSection, !isHost && styles.readOnlySection)} aria-disabled={!isHost}>
              <div className={styles.sectionInfo}>
                <h2>Game Type</h2>
                <p>Private rooms stay hidden until you share the code.</p>
              </div>
              <div className={styles.sectionContent}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(event) => {
                      const nextValue = event.target.checked;
                      setIsPrivate(nextValue);
                      sendRoomSettingsUpdate({ isPrivate: nextValue });
                    }}
                    disabled={!isHost}
                  />
                  Private
                </label>
                {isPrivate && (
                  <div className={styles.roomCodeArea}>
                    <label className={styles.roomCodeLabel} htmlFor="room-code">
                      Room Code
                    </label>
                    <div className={styles.roomCodeRow}>
                      <Input id="room-code" readOnly value={displayRoomCode} className={styles.roomCodeInput} />
                      <Button
                        type="button"
                        className={styles.copyButton}
                        onClick={() => handleCopy(displayRoomCode)}
                      >
                        Copy Code
                      </Button>
                      <Button
                        type="button"
                        className={styles.copyButton}
                        onClick={() => handleCopy(`${window.location.origin}/play?room=${displayRoomCode}`)}
                      >
                        Copy Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionInfo}>
                <h2>Blacklist</h2>
                <p>Tags you never want to see in this room.</p>
              </div>
              <div className={styles.sectionContent}>
                <form
                  className={styles.tagForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    addBlacklistTag(blacklistInput);
                    setBlacklistInput('');
                  }}
                >
                  <Input
                    className={styles.tagInput}
                    type="text"
                    placeholder="Add a tag to blacklist"
                    value={blacklistInput}
                    onChange={(event) => setBlacklistInput(event.target.value)}
                  />
                  <Button className={styles.tagButton} type="submit" variant="outline">
                    Add
                  </Button>
                </form>
                <ul className={styles.tagList}>
                  {blacklist.length === 0 && <p className={styles.tagEmpty}>No tags blacklisted</p>}
                  {blacklist.map((tag) => (
                    <li className={styles.tagPill} key={tag}>
                      <span>{tag}</span>
                      <Button
                        className={styles.tagRemove}
                        onClick={() => removeBlacklistTag(tag)}
                        aria-label={`Remove ${tag} from blacklist`}
                        size="icon"
                        variant="ghost"
                      >
                        x
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionInfo}>
                <h2>Preferlist</h2>
                <p>Tags you want to see more often.</p>
              </div>
              <div className={styles.sectionContent}>
                <form
                  className={styles.tagForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    addPreferlistTag(preferlistInput, preferlistFrequency);
                    setPreferlistInput('');
                  }}
                >
                  <Input
                    className={styles.tagInput}
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
                  <Button className={styles.tagButton} type="submit" variant="outline">
                    Add
                  </Button>
                </form>
                <ul className={styles.tagList}>
                  {preferlist.length === 0 && <p className={styles.tagEmpty}>No tags preferred</p>}
                  {preferlist.map((entry) => (
                    <li className={styles.tagPill} key={entry.tag}>
                      <span>{entry.tag}</span>
                      <div className={styles.frequencyControl}>
                        <span className={styles.frequencyLabel}>frequency?</span>
                        <Select
                          value={entry.frequency}
                          onChange={(event) => updatePreferlistFrequency(entry.tag, event.target.value as PreferlistFrequencyType)}
                        >
                          <option value="most">most of the time</option>
                          <option value="all">all the time</option>
                        </Select>
                      </div>
                      <Button
                        className={styles.tagRemove}
                        onClick={() => removePreferlistTag(entry.tag)}
                        aria-label={`Remove ${entry.tag} from preferlist`}
                        size="icon"
                        variant="ghost"
                      >
                        x
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.sectionInfo}>
                <h2>Rating</h2>
                <p>Choose what kind of posts to see in this room.</p>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.ratingRow}>
                  {RATING_OPTIONS.map(option => (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        styles.ratingButton,
                        RATING_STYLE_MAP[option],
                        rating === option ? styles.ratingButtonActive : '',
                      )}
                      onClick={() => {
                        if (!isHost) {
                          return;
                        }
                        setRating(option);
                        sendRoomSettingsUpdate({ rating: option });
                      }}
                      disabled={!isHost}
                      aria-pressed={rating === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className={styles.actionsRow}>
              <Button
                className={styles.actionButton}
                onClick={leaveRoom}
              >
                Back
              </Button>
              <Button
                className={styles.actionButton}
                onClick={startGame}
                disabled={!canStartGame || userID !== owner?.id}
              >
                Start Game
              </Button>
              <Button
                className={styles.actionButton}
                onClick={saveGameSetup}
                disabled={!inputsAreValid || !isHost}
              >
                Save Game Setup
              </Button>
            </div>
          </div>
        </section>

        <aside className={styles.sideColumn}>
          <div className={styles.sidePanel}>
            <h2 className={styles.sideTitle}>Room Lobby</h2>
            <ul className={styles.readyList}>
              {readyStates.map(readyState => renderReadyState(readyState))}
            </ul>
          </div>
          <div className={styles.sidePanel}>
            <h2 className={styles.sideTitle}>Pick an Icon</h2>
            <IconPicker allIcons={icons.sfw} />
          </div>
        </aside>
      </main>
    </div>
  );
};

export default GameSetup;
