import { useState, useEffect, useMemo, useContext, useCallback, useRef, type FormEvent } from 'react';
import type { BotActionSequenceType, GameModeType, GuessedTagEntryType, ReadyUpEventDataType, ReadyUpEventDataToClientType, RequestPostEventDataToClientType, PostTagType, RouletteTurnStartEventDataToClientType, RouletteVoteSkipEventDataType, RouletteSkipUpdateEventDataToClientType, RouletteLifeLostEventDataToClientType, RoulettePlayerEliminatedEventDataToClientType } from '../types';
import { EventType } from '../types';
import TagList from './TagList';
import useTagListGuesser from '../useTagListGuesser';
import { ProgressBar, MobileProgressBar } from './ProgressBar';
import InRoundLeaderboard from './InRoundLeaderboard';
import { TagListLabel, TagsInput, TagsInputContainer, TagsList } from './TagListContainerStyles';
import { UserContext } from '../contexts/UserContext';
import useBotSequencePlayer from '../hooks/useBotSequencePlayer';
import MobileTagsOverlay from './MobileTagsOverlay';
import MobileInputBar from './MobileInputBar';
import MobileLandscapeTags from './MobileLandscapeTags';
import { breakpointValues } from '../styles/theme/breakpoints';
import styles from '@/styles/components/tag-list-container-wrapper.module.css';
import layoutStyles from '@/styles/components/tag-list-container.module.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STARTING_TIME = 30;
const FRAME_RATE = 60;
const INCORRECT_GUESS_PENALTY = 0.25;
const EMPTY_GUESSES: GuessedTagEntryType[] = [];

interface Props {
    tags: PostTagType[];
    nextRoundButton?: React.ReactNode
    postOrientation?: 'portrait' | 'landscape' | 'unknown';
    children?: React.ReactNode;
    gameMode?: GameModeType;
    botActionSequence?: BotActionSequenceType | null;
    roundGuesses?: GuessedTagEntryType[];
};

// Type alias to avoid importing UserReadyStateType just for the mergeBotScores helper
type ReadyState = { user: { id: string; isBot?: boolean; score: number; [key: string]: unknown }; ready: boolean; [key: string]: unknown };

const TagListContainerElement: React.FC<Props> = (props: Props) => {
    const { tags, nextRoundButton, postOrientation = 'unknown', children, gameMode = 'Blitz', botActionSequence = null, roundGuesses = EMPTY_GUESSES } = props;
    const [guess, setGuess] = useState('');
    const {userID, roomID, readyStates, setReadyStates, connectionManager, preferlist, rouletteEliminationOrder, setRouletteEliminationOrder} = useContext(UserContext);
    const allTimePreferTagNames = useMemo(() => {
        return (preferlist ?? []).filter(entry => entry.frequency === 'all').map(entry => entry.tag);
    }, [preferlist]);
    const allTimePreferTagSet = useMemo(() => new Set(allTimePreferTagNames), [allTimePreferTagNames]);
    const [guessedTags, guessTag, revealAllTags, applyLocalGuess, activePlayerID] = useTagListGuesser(tags, allTimePreferTagNames, roundGuesses, gameMode);

    // Roulette-specific state
    const [rouletteTurnTimeMs, setRouletteTurnTimeMs] = useState(15000);
    const [rouletteTimeLeft, setRouletteTimeLeft] = useState(15000);
    const [playerLives, setPlayerLives] = useState<Record<string, number>>({});
    const [skipVotes, setSkipVotes] = useState(0);
    const [skipTotalPlayers, setSkipTotalPlayers] = useState(0);
    const [hasVotedSkip, setHasVotedSkip] = useState(false);
    const rouletteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isMyTurn = gameMode === 'Roulette' && activePlayerID === userID;

    useBotSequencePlayer(botActionSequence, readyStates, setReadyStates, applyLocalGuess);

    const mergeBotScores = useCallback((incoming: ReadyState[]) => {
        const botScoreMap = new Map(
            readyStates
                .filter((state: ReadyState) => state.user.isBot)
                .map((state: ReadyState) => [state.user.id, state.user.score]),
        );
        return incoming.map((state: ReadyState) => {
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

    const [generalTags, artistTags, characterTags, speciesTags] = useMemo(() => {
        const generalTags = tags.filter(tag => tag.type === 'general');
        const artistTags = tags.filter(tag => tag.type === 'artist');
        const characterTags = tags.filter(tag => tag.type === 'character');
        const speciesTags = tags.filter(tag => tag.type === 'species');
        return [generalTags, artistTags, characterTags, speciesTags];
    }, [tags]);

    const [guessedGeneralTags, guessedArtistTags, guessedCharacterTags, guessedSpeciesTags] = useMemo(() => {
        const guessedGeneralTags = guessedTags.filter(entry => entry.tag.type === 'general');
        const guessedArtistTags = guessedTags.filter(entry => entry.tag.type === 'artist');
        const guessedCharacterTags = guessedTags.filter(entry => entry.tag.type === 'character');
        const guessedSpeciesTags = guessedTags.filter(entry => entry.tag.type === 'species');
        return [guessedGeneralTags, guessedArtistTags, guessedCharacterTags, guessedSpeciesTags];
    }, [guessedTags])

    const [time, setTime] = useState(STARTING_TIME);
    const hasRevealedAllTagsRef = useRef(false);
    const isPortraitPost = postOrientation === 'portrait';

    const isMobileViewport = useMemo(() => {
        return window.innerWidth < breakpointValues.mobile;
    }, []);

    useEffect(() => {
        const onTimerEnd = (data: ReadyUpEventDataToClientType) => {
            const readyStates = data.room.readyStates;
            setReadyStates(mergeBotScores(readyStates as unknown as ReadyState[]) as typeof readyStates);
        }

        const onNewRoundStart = (_data: RequestPostEventDataToClientType) => {
            setTime(STARTING_TIME);
            if (gameMode === 'Roulette') {
                setSkipVotes(0);
                setHasVotedSkip(false);
            }
        }

        const unsubscribers = [
            connectionManager.listen<ReadyUpEventDataToClientType>(EventType.enum.READY_UP, onTimerEnd),
            connectionManager.listen<RequestPostEventDataToClientType>(EventType.enum.REQUEST_POST, onNewRoundStart),
        ];

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        }
    }, [connectionManager, gameMode, mergeBotScores, setReadyStates]);

    // Roulette-specific event listeners
    useEffect(() => {
        if (gameMode !== 'Roulette') return;

        const onTurnStart = (data: RouletteTurnStartEventDataToClientType) => {
            setPlayerLives(data.playerLives);
            setRouletteTurnTimeMs(data.turnTimeMs);
            setRouletteTimeLeft(data.turnTimeMs);
        };

        const onSkipUpdate = (data: RouletteSkipUpdateEventDataToClientType) => {
            setSkipVotes(data.skipVotes);
            setSkipTotalPlayers(data.totalPlayers);
        };

        const onLifeLost = (data: RouletteLifeLostEventDataToClientType) => {
            setPlayerLives(prev => ({ ...prev, [data.playerID]: data.livesRemaining }));
        };

        const onPlayerEliminated = (data: RoulettePlayerEliminatedEventDataToClientType) => {
            setRouletteEliminationOrder([...rouletteEliminationOrder, data.playerID]);
        };

        const unsubscribers = [
            connectionManager.listen<RouletteTurnStartEventDataToClientType>(EventType.enum.ROULETTE_TURN_START, onTurnStart),
            connectionManager.listen<RouletteSkipUpdateEventDataToClientType>(EventType.enum.ROULETTE_SKIP_UPDATE, onSkipUpdate),
            connectionManager.listen<RouletteLifeLostEventDataToClientType>(EventType.enum.ROULETTE_LIFE_LOST, onLifeLost),
            connectionManager.listen<RoulettePlayerEliminatedEventDataToClientType>(EventType.enum.ROULETTE_PLAYER_ELIMINATED, onPlayerEliminated),
        ];

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [connectionManager, gameMode, rouletteEliminationOrder, setRouletteEliminationOrder]);

    // Roulette turn countdown timer (client-side display only)
    useEffect(() => {
        if (gameMode !== 'Roulette') return;
        if (rouletteTimerRef.current) {
            clearInterval(rouletteTimerRef.current);
        }
        setRouletteTimeLeft(rouletteTurnTimeMs);
        rouletteTimerRef.current = setInterval(() => {
            setRouletteTimeLeft(prev => Math.max(0, prev - (1000 / FRAME_RATE)));
        }, 1000 / FRAME_RATE);
        return () => {
            if (rouletteTimerRef.current) {
                clearInterval(rouletteTimerRef.current);
            }
        };
    }, [gameMode, rouletteTurnTimeMs]);

    useEffect(() => {
        hasRevealedAllTagsRef.current = false;
    }, [tags]);

    const readyForNextRound = useCallback((ready: boolean) => {
        if(userID != null && roomID != null) {
          const data: ReadyUpEventDataType = {type: EventType.enum.READY_UP, userID, roomID, ready};
          connectionManager.send(data);
        } else {
          console.error('user finished round before room or user was created')
        }
      }, [connectionManager, userID, roomID]);

      const myReadyState = useMemo(() => {
        const readyState = readyStates.find(readyState => readyState.user.id === userID)
        return readyState;
      }, [readyStates, userID]);

      const allUsersFinished = useMemo(() => {
        return readyStates.every(readyState => readyState.ready);
      }, [readyStates]);

    useEffect(() => {
        if (gameMode === 'Roulette') return;

        // frame rate of 60 fps for timer
        const timer = setInterval(() => setTime(time - (1 / FRAME_RATE)), (1000 / FRAME_RATE));

        if (time <= 0 && !myReadyState?.ready) {
            readyForNextRound(true);
        }

        if(allUsersFinished && !hasRevealedAllTagsRef.current) {
            hasRevealedAllTagsRef.current = true;
            revealAllTags();
        }

        return () => {
            clearInterval(timer);
        }
    }, [allUsersFinished, gameMode, myReadyState?.ready, readyForNextRound, revealAllTags, time]);

    const handleGuessSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (gameMode === 'Roulette') {
            if (!isMyTurn) return;
            guessTag(guess);
            setGuess('');
            return;
        }
        const guessedCorrect = guessTag(guess);
        if (!guessedCorrect) {
            setTime(time - INCORRECT_GUESS_PENALTY);
        }
        setGuess("");
    }, [gameMode, guess, guessTag, isMyTurn, time]);

    const handleVoteSkipToggle = useCallback(() => {
        if (!userID || !roomID) return;
        const newVote = !hasVotedSkip;
        setHasVotedSkip(newVote);
        const data: RouletteVoteSkipEventDataType = {
            type: EventType.enum.ROULETTE_VOTE_SKIP,
            roomID,
            userID,
            vote: newVote,
        };
        connectionManager.send(data);
    }, [connectionManager, hasVotedSkip, roomID, userID]);

    // Mobile layout
    if (isMobileViewport) {
        const showLandscapeTags = postOrientation === 'landscape';
        return (
            <>
                {children}
                {!showLandscapeTags && (
                    <MobileTagsOverlay
                        guessedTags={guessedTags}
                    />
                )}
                {showLandscapeTags && (
                    <MobileLandscapeTags guessedTags={guessedTags} />
                )}
                <InRoundLeaderboard isMobile gameMode={gameMode} activePlayerID={activePlayerID} playerLives={playerLives} />
                <MobileInputBar
                    guess={guess}
                    setGuess={setGuess}
                    onSubmit={handleGuessSubmit}
                    nextRoundButton={nextRoundButton}
                    progressBar={(
                        <MobileProgressBar
                            percentComplete={gameMode === 'Roulette'
                                ? (rouletteTimeLeft / Math.max(rouletteTurnTimeMs, 1) * 100)
                                : time / STARTING_TIME * 100}
                            totalTime={gameMode === 'Roulette' ? rouletteTurnTimeMs / 1000 : STARTING_TIME}
                        />
                    )}
                />
                {gameMode === 'Roulette' && (
                    <div style={{ padding: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {isMyTurn && <span style={{ fontWeight: 'bold', color: 'var(--c-tag-general)' }}>YOUR TURN</span>}
                        <Button
                            variant="outline"
                            onClick={handleVoteSkipToggle}
                            style={{ opacity: hasVotedSkip ? 1 : 0.6 }}
                        >
                            {hasVotedSkip ? 'Voted Skip' : 'Vote Skip'}
                            {skipTotalPlayers > 0 && ` (${skipVotes}/${skipTotalPlayers})`}
                        </Button>
                    </div>
                )}
            </>
        );
    }

    const portraitColumns = useMemo(() => {
        if (!isPortraitPost) {
            return null;
        }
        const totalTags = tags.length;
        const leftTargetCount = totalTags > 50 ? Math.ceil(totalTags / 2) : Math.min(25, totalTags);
        let remainingLeft = leftTargetCount;
        const splitType = (typeTags: PostTagType[]) => {
            const leftCount = Math.min(remainingLeft, typeTags.length);
            const leftTags = typeTags.slice(0, leftCount);
            const rightTags = typeTags.slice(leftCount);
            remainingLeft -= leftCount;
            return { leftTags, rightTags };
        };
        const { leftTags: leftGeneral, rightTags: rightGeneral } = splitType(generalTags);
        const { leftTags: leftSpecies, rightTags: rightSpecies } = splitType(speciesTags);
        const { leftTags: leftCharacter, rightTags: rightCharacter } = splitType(characterTags);
        const { leftTags: leftArtist, rightTags: rightArtist } = splitType(artistTags);
        return {
            left: {
                general: leftGeneral,
                species: leftSpecies,
                character: leftCharacter,
                artist: leftArtist,
            },
            right: {
                general: rightGeneral,
                species: rightSpecies,
                character: rightCharacter,
                artist: rightArtist,
            },
        };
    }, [artistTags, characterTags, generalTags, isPortraitPost, speciesTags, tags.length]);

    const renderTagSection = (
        label: string,
        sectionTags: PostTagType[],
        guessedSectionTags: GuessedTagEntryType[]
    ) => {
        if (sectionTags.length === 0) {
            return null;
        }
        return (
            <div className={layoutStyles.tagSection}>
                <TagListLabel className={layoutStyles.tagSectionLabel}>{label}</TagListLabel>
                <TagsList className={layoutStyles.tagSectionList}>
                    <TagList
                        tags={sectionTags}
                        guessedTags={guessedSectionTags}
                        autoRevealedTagNames={allTimePreferTagSet}
                    />
                </TagsList>
            </div>
        );
    };

    const leftColumnTags = portraitColumns?.left ?? {
        general: generalTags,
        species: speciesTags,
        character: characterTags,
        artist: artistTags,
    };
    const rightColumnTags = portraitColumns?.right ?? {
        general: [],
        species: [],
        character: [],
        artist: [],
    };
    const hasRightColumn = isPortraitPost && (
        rightColumnTags.general.length > 0 ||
        rightColumnTags.species.length > 0 ||
        rightColumnTags.character.length > 0 ||
        rightColumnTags.artist.length > 0
    );
    const layoutClassName = hasRightColumn ? layoutStyles.columnsThree : layoutStyles.columnsTwo;

    const timerPercent = gameMode === 'Roulette'
        ? (rouletteTimeLeft / Math.max(rouletteTurnTimeMs, 1) * 100)
        : (time / STARTING_TIME * 100);
    const timerTotal = gameMode === 'Roulette' ? rouletteTurnTimeMs / 1000 : STARTING_TIME;

    // Desktop layout
    return (
        <div className={`${layoutStyles.columnsLayout} ${layoutClassName}`.trim()}>
            <div className={layoutStyles.leftColumn}>
                <div className={layoutStyles.sidebar}>
                    <h1 className={layoutStyles.sidebarTitle}>Guess</h1>
                    {gameMode === 'Roulette' && (
                        <div style={{ marginBottom: '8px' }}>
                            {isMyTurn
                                ? <span style={{ fontWeight: 'bold', color: 'var(--c-tag-general)', display: 'block', marginBottom: '4px' }}>YOUR TURN</span>
                                : <span style={{ color: 'var(--c-text-secondary)', display: 'block', marginBottom: '4px' }}>Waiting for your turn...</span>
                            }
                            <Button
                                variant="outline"
                                onClick={handleVoteSkipToggle}
                                style={{ opacity: hasVotedSkip ? 1 : 0.6, width: '100%' }}
                            >
                                {hasVotedSkip ? 'Voted Skip' : 'Vote Skip'}
                                {skipTotalPlayers > 0 && ` (${skipVotes}/${skipTotalPlayers})`}
                            </Button>
                        </div>
                    )}
                    <TagsInputContainer className={layoutStyles.sidebarInputContainer}>
                        <TagsInput className={layoutStyles.sidebarInput}>
                            <form onSubmit={handleGuessSubmit}>
                                <Input
                                    type="text"
                                    placeholder={gameMode === 'Roulette' && !isMyTurn ? 'Not your turn' : 'Guess'}
                                    value={guess}
                                    onChange={(e) => setGuess(e.target.value)}
                                    disabled={gameMode === 'Roulette' && !isMyTurn}
                                />
                            </form>
                        </TagsInput>
                    </TagsInputContainer>
                    {nextRoundButton && <div className={layoutStyles.nextRoundArea}>{nextRoundButton}</div>}
                    <div className={layoutStyles.tagSections}>
                        {renderTagSection('Artists', leftColumnTags.artist, guessedArtistTags)}
                        {renderTagSection('Characters', leftColumnTags.character, guessedCharacterTags)}
                        {renderTagSection('Species', leftColumnTags.species, guessedSpeciesTags)}
                        {renderTagSection('General', leftColumnTags.general, guessedGeneralTags)}
                    </div>
                </div>
            </div>
            <div className={layoutStyles.middleColumn}>
                <div className={layoutStyles.roundBanner}>
                    <InRoundLeaderboard
                        className={layoutStyles.roundLeaderboard}
                        gameMode={gameMode}
                        activePlayerID={activePlayerID}
                        playerLives={playerLives}
                    />
                    <div className={layoutStyles.roundProgress}>
                        <ProgressBar percentComplete={timerPercent} totalTime={timerTotal}/>
                    </div>
                </div>
                <div className={layoutStyles.postSlot}>
                    {children}
                </div>
            </div>
            {hasRightColumn && (
                <div className={layoutStyles.rightColumn}>
                    <div className={layoutStyles.rightSidebar}>
                        <div className={layoutStyles.tagSections}>
                            {renderTagSection('Artists', rightColumnTags.artist, guessedArtistTags)}
                            {renderTagSection('Characters', rightColumnTags.character, guessedCharacterTags)}
                            {renderTagSection('Species', rightColumnTags.species, guessedSpeciesTags)}
                            {renderTagSection('General', rightColumnTags.general, guessedGeneralTags)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const TagListContainer = (props: Props) => (
  <div className={styles.container}>
    <TagListContainerElement {...props} />
  </div>
);
