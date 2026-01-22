import { useState, useEffect, useMemo, useContext, useCallback, useRef, type FormEvent } from 'react';
import type { ReadyUpEventDataType, ReadyUpEventDataToClientType, RequestPostEventDataToClientType, PostTagType } from '../types';
import { EventType } from '../types';
import TagList from './TagList';
import useTagListGuesser from '../useTagListGuesser';
import { ProgressBar, MobileProgressBar } from './ProgressBar';
import InRoundLeaderboard from './InRoundLeaderboard';
import { TagListLabel, TagsInput, TagsInputContainer, TagsList } from './TagListContainerStyles';
import { UserContext } from '../contexts/UserContext';
import MobileTagsOverlay from './MobileTagsOverlay';
import MobileInputBar from './MobileInputBar';
import MobileLandscapeTags from './MobileLandscapeTags';
import { breakpointValues } from '../styles/theme/breakpoints';
import styles from '@/styles/components/tag-list-container-wrapper.module.css';
import layoutStyles from '@/styles/components/tag-list-container.module.css';
import { Input } from '@/components/ui/input';

const STARTING_TIME = 30;
const FRAME_RATE = 60;
const INCORRECT_GUESS_PENALTY = 0.25;

interface Props {
    tags: PostTagType[];
    nextRoundButton?: React.ReactNode
    postOrientation?: 'portrait' | 'landscape' | 'unknown';
    children?: React.ReactNode;
};

const TagListContainerElement: React.FC<Props> = (props: Props) => {
    const { tags, nextRoundButton, postOrientation = 'unknown', children } = props;
    const [guess, setGuess] = useState('');
    const {userID, roomID, readyStates, setReadyStates, connectionManager, preferlist} = useContext(UserContext);
    const allTimePreferTagNames = useMemo(() => {
        return (preferlist ?? []).filter(entry => entry.frequency === 'all').map(entry => entry.tag);
    }, [preferlist]);
    const allTimePreferTagSet = useMemo(() => new Set(allTimePreferTagNames), [allTimePreferTagNames]);
    const [guessedTags, guessTag, revealAllTags] = useTagListGuesser(tags, allTimePreferTagNames);

    const [generalTags, artistTags, characterTags, speciesTags] = useMemo(() => {
        const generalTags = tags.filter(tag => tag.type === 'general');
        const artistTags = tags.filter(tag => tag.type === 'artist');
        const characterTags = tags.filter(tag => tag.type === 'character');
        const speciesTags = tags.filter(tag => tag.type === 'species');
        return [generalTags, artistTags, characterTags, speciesTags];
    }, [tags]);

    const [guessedGeneralTags, guessedArtistTags, guessedCharacterTags, guessedSpeciesTags] = useMemo(() => {
        const guessedGeneralTags = guessedTags.filter(tag => tag.type === 'general');
        const guessedArtistTags = guessedTags.filter(tag => tag.type === 'artist');
        const guessedCharacterTags = guessedTags.filter(tag => tag.type === 'character');
        const guessedSpeciesTags = guessedTags.filter(tag => tag.type === 'species');
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
            // populate new ready states
            setReadyStates(readyStates);
        }

        const onNewRoundStart = (_data: RequestPostEventDataToClientType) => {
            // new round has started, so reset the timer
            setTime(STARTING_TIME);
        }

        const unsubscribers = [
            connectionManager.listen<ReadyUpEventDataToClientType>(EventType.enum.READY_UP, onTimerEnd),
            connectionManager.listen<RequestPostEventDataToClientType>(EventType.enum.REQUEST_POST, onNewRoundStart),
        ];

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        }
    }, [connectionManager, setReadyStates]);

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
    }, [allUsersFinished, myReadyState?.ready, readyForNextRound, revealAllTags, time]);

    const handleGuessSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        const guessedCorrect = guessTag(guess);
        if (!guessedCorrect) {
            setTime(time - INCORRECT_GUESS_PENALTY);
        }
        setGuess("");
    }, [guess, guessTag, time]);

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
                <InRoundLeaderboard isMobile />
                <MobileInputBar 
                    guess={guess}
                    setGuess={setGuess}
                    onSubmit={handleGuessSubmit}
                    nextRoundButton={nextRoundButton}
                    progressBar={(
                        <MobileProgressBar 
                            percentComplete={time / STARTING_TIME * 100} 
                            totalTime={STARTING_TIME}
                        />
                    )}
                />
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
        guessedSectionTags: PostTagType[]
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

    // Desktop layout
    return (
        <div className={`${layoutStyles.columnsLayout} ${layoutClassName}`.trim()}>
            <div className={layoutStyles.leftColumn}>
                <div className={layoutStyles.sidebar}>
                    <h1 className={layoutStyles.sidebarTitle}>Guess</h1>
                    <TagsInputContainer className={layoutStyles.sidebarInputContainer}>
                        <TagsInput className={layoutStyles.sidebarInput}>
                            <form onSubmit={handleGuessSubmit}>
                                <Input
                                    type="text"
                                    placeholder="Guess"
                                    value={guess}
                                    onChange={(e) => setGuess(e.target.value)}
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
                    <InRoundLeaderboard className={layoutStyles.roundLeaderboard} />
                    <div className={layoutStyles.roundProgress}>
                        <ProgressBar percentComplete={time / STARTING_TIME * 100} totalTime={STARTING_TIME}/>
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

