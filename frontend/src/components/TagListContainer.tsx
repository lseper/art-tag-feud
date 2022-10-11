import { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import type { ReadyUpEventDataType, ReadyUpEventDataToClientType, RequestPostEventDataToClientType, PostTagType } from '../types';
import { EventType } from '../types';
import TagList from './TagList';
import useTagListGuesser from '../useTagListGuesser';
import styled from 'styled-components';
import { ProgressBar } from './ProgressBar';
import InRoundLeaderboard from './InRoundLeaderboard';
import { TagListLabel, TagsGrid, TagsInput, TagsInputContainer, TagsList } from './TagListContainerStyles';
import { UserContext } from '../contexts/UserContext';

const STARTING_TIME = 30;
const FRAME_RATE = 60;
const INCORRECT_GUESS_PENALTY = 3;

interface Props {
    tags: PostTagType[];
    className?: string;
};

const TagListContainerElement: React.FC<Props> = (props: Props) => {
    const { tags, className } = props;
    const [guess, setGuess] = useState('');
    const [hasRevealedAll, setHasRevealedAll] = useState(false);
    const [guessedTags, guessTag, revealAllTags] = useTagListGuesser(tags);
    const {userID, roomID, readyStates, setReadyStates, connectionManager} = useContext(UserContext);

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

    useEffect(() => {
        const onTimerEnd = (data: ReadyUpEventDataToClientType) => {
            const readyStates = data.room.readyStates;
            // populate new ready states
            setReadyStates(readyStates);
        }

        const onNewRoundStart = (data: RequestPostEventDataToClientType) => {
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

        if(allUsersFinished && !hasRevealedAll) {
            revealAllTags();
            setHasRevealedAll(true);
        }

        if(!allUsersFinished && hasRevealedAll) {
            setHasRevealedAll(false);
        }

        return () => {
            clearInterval(timer);
        }
    }, [allUsersFinished, hasRevealedAll, myReadyState?.ready, readyForNextRound, revealAllTags, time]);

    const generalTagLists = useMemo(() => {
        const tagList1 = generalTags.slice(0, Math.ceil(generalTags.length / 3));
        const tagList2 = generalTags.slice(Math.ceil(generalTags.length / 3), Math.ceil(generalTags.length / 3) * 2);
        const tagList3 = generalTags.slice(Math.ceil(generalTags.length / 3) * 2);
        const tagLists = [
            tagList1,
            tagList2,
            tagList3,
        ];
        return tagLists;
    }, [generalTags]);

    const tagListBaseDelays = useMemo(() => {
       const tagListDelays = [];
       let baseDelay = 0;
       for (const tagList of generalTagLists) {
        tagListDelays.push(baseDelay);
        baseDelay += tagList.length;
       }
       // base delay for species tags
       tagListDelays.push(baseDelay);
       baseDelay += speciesTags.length;
       // base delay for character tags
       tagListDelays.push(baseDelay);
       baseDelay += characterTags.length;
       // base delay for artist tags
       tagListDelays.push(baseDelay);
       return tagListDelays;
    }, [characterTags.length, generalTagLists, speciesTags.length]);

    return (
        <div className={className}>
            <h1>Guess a tag!{ }</h1>
            <TagsInputContainer>
                <TagsInput>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const guessedCorrect = guessTag(guess);
                        if (!guessedCorrect) {
                            setTime(time - INCORRECT_GUESS_PENALTY);
                        }
                        setGuess("");
                    }}>
                        <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)}
                        />
                    </form>
                </TagsInput>
                <ProgressBar percentComplete={time / STARTING_TIME * 100} totalTime={STARTING_TIME}/>
                {/* <Timer onRoundFinish={onRoundFinish} /> */}
            </TagsInputContainer>
            {/* <button onClick={revealAllTags}>
                reveal tags
            </button>
            <button onClick={hideAllTags}>
                clear tags
            </button> */}
            <InRoundLeaderboard />
            {/* Grid definition */}
            <TagListLabel> General Tags </TagListLabel>
            <TagsGrid>
                {/* 1/3 side of grid */}
                <TagsList>
                    {/* Big large general tag block, takes up 1/3 of right side of screen */}
                    <TagList 
                    tags={generalTagLists[0]} 
                    guessedTags={guessedGeneralTags} 
                    baseDelayIndex={tagListBaseDelays[0]}
                    revealAll={hasRevealedAll}
                    ></TagList>
                </TagsList>
                <TagsList>
                    {/* 1 / 3 of grid */}
                    <TagList 
                    tags={generalTagLists[1]} 
                    guessedTags={guessedGeneralTags}
                    baseDelayIndex={tagListBaseDelays[1]}
                    revealAll={hasRevealedAll}
                    ></TagList>
                </TagsList>
                <TagsList>
                    {/* 1 / 3 of grid */}
                    <TagList 
                    tags={generalTagLists[2]} 
                    guessedTags={guessedGeneralTags} 
                    baseDelayIndex={tagListBaseDelays[2]}
                    revealAll={hasRevealedAll}
                    ></TagList>
                </TagsList>
            </TagsGrid>
            {/* Artist, chracter, and species tags */}
            <TagsGrid>
                <div>
                    <TagListLabel> Species Tags </TagListLabel>
                    <TagsList>
                        <TagList 
                        tags={speciesTags} 
                        guessedTags={guessedSpeciesTags}
                        baseDelayIndex={tagListBaseDelays[3]}
                        revealAll={hasRevealedAll}
                        ></TagList>
                    </TagsList>
                </div>
                <div>
                    <TagListLabel> Character Tags </TagListLabel>
                    <TagsList>
                        <TagList 
                        tags={characterTags} 
                        guessedTags={guessedCharacterTags}
                        baseDelayIndex={tagListBaseDelays[4]}
                        revealAll={hasRevealedAll}
                        ></TagList>
                    </TagsList>
                </div>
                <div>
                    <TagListLabel> Artist Tags </TagListLabel>
                    {/* Rest of the tags, stacked on top of one another. Takes up the other 1/2 side of right screen */}
                    <TagsList>
                        <TagList 
                        tags={artistTags} 
                        guessedTags={guessedArtistTags}
                        baseDelayIndex={tagListBaseDelays[5]}
                        revealAll={hasRevealedAll}
                        ></TagList>
                    </TagsList>
                </div>
            </TagsGrid>
        </div>
    );
};

export const TagListContainer = styled(TagListContainerElement)`
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-content: flex-start;
    align-items: flex-start;
`;