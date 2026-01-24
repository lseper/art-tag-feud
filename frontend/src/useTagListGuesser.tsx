import { useEffect, useState, useCallback, useContext } from 'react';
import type { GuessTagEventDataType, GuessTagEventDataToClientType, GuessedTagEntryType, PostTagType, UserType } from './types';
import alias_data_untyped from './data/tag-aliases.json'
import { UserContext } from './contexts/UserContext';
import { EventType } from './types';

const alias_data : Record<string, string> = alias_data_untyped;

function checkAlias(tag_name: string) : string {
    const true_value = alias_data[tag_name];
    if (true_value) {
        return true_value
    } else {
        return '';
    }
}
// custom hook, returns an object that has the CurrentPost, and an update callback function that we define
export default function useTagListGuesser(startingTags : PostTagType[], forcedGuessedTagNames: string[] = [], initialGuesses: GuessedTagEntryType[] = []) : [
    GuessedTagEntryType[], (guess: string) => boolean, () => void, (tag: PostTagType, user: UserType) => boolean
] {
    // want component re-rendering when this changes
    const [guessedTags, setGuessedTags] = useState<GuessedTagEntryType[]>([]);
    const [hiddenTags, setHiddenTags] = useState(startingTags);
    const {connectionManager, username, readyStates, setReadyStates, userID, roomID, score} = useContext(UserContext);

    // TODO: uncomment once reveal all tags functionality is added
    function revealAllTags() {
        setGuessedTags((prevGuessedTags) => {
            if (hiddenTags.length === 0) {
                return prevGuessedTags;
            }
            const existingNames = new Set(prevGuessedTags.map(entry => entry.tag.name));
            let didAdd = false;
            const nextGuessedTags = [...prevGuessedTags];
            hiddenTags.forEach((tag) => {
                if (!existingNames.has(tag.name)) {
                    existingNames.add(tag.name);
                    nextGuessedTags.push({ tag });
                    didAdd = true;
                }
            });
            return didAdd ? nextGuessedTags : prevGuessedTags;
        });
    }

    // reset on new post
    useEffect(() => {
        const forcedGuessedSet = new Set(forcedGuessedTagNames);
        const initialGuessMap = new Map(initialGuesses.map(entry => [entry.tag.name, entry]));
        const nextGuessedTags: GuessedTagEntryType[] = [];
        startingTags.forEach((tag) => {
            const existingGuess = initialGuessMap.get(tag.name);
            if (existingGuess) {
                nextGuessedTags.push(existingGuess);
                return;
            }
            if (forcedGuessedSet.has(tag.name)) {
                nextGuessedTags.push({ tag });
            }
        });
        setHiddenTags(startingTags);
        setGuessedTags(nextGuessedTags);
    }, [forcedGuessedTagNames, initialGuesses, startingTags])

    const handleGuess = useCallback((guess: string) : {isCorrect: boolean, tag?: PostTagType} => {
        let tagIndex = hiddenTags.findIndex((tag : PostTagType) => tag.name === guess);
        if(guessedTags.some(entry => entry.tag.name === guess)){
            return {isCorrect: false};
        }
        if(tagIndex < 0) {
            // see if there is an alias
            guess = checkAlias(guess);
            if(guess === '') {
                // short-circuit on faulty guess, return false for did not guess tag correctly
                return {isCorrect: false};
            }
            tagIndex = hiddenTags.findIndex((tag : PostTagType) => tag.name === guess)
            if(tagIndex === -1) {
                return {isCorrect: false};
            }
        }
        const guessedTag = hiddenTags[tagIndex];
        return {isCorrect: true, tag: guessedTag};
    }, [guessedTags, hiddenTags]);

    const applyLocalGuess = useCallback((tag: PostTagType, user: UserType) => {
        const { isCorrect } = handleGuess(tag.name);
        if (!isCorrect) {
            return false;
        }
        const newGuessedTags = [...guessedTags, { tag, user }];
        setGuessedTags(newGuessedTags);
        const userToUpdateScore = readyStates.find(readyState => readyState.user.id === user.id);
        if (userToUpdateScore) {
            userToUpdateScore.user.score += tag.score;
            setReadyStates([...readyStates]);
        }
        return true;
    }, [guessedTags, handleGuess, readyStates, setReadyStates]);
    
    // define what the update callback will be
    const guessTag = (guess: string) : boolean => {
        const {isCorrect, tag} = handleGuess(guess);
        if(userID && roomID && isCorrect && tag != null) {
            // TODO: emit username as well
            const usernameToSend = username ?? 'DEFAULT_USERNAME';
            const userToSend: UserType = {id: userID, score, username: usernameToSend, roomID};
            const data: GuessTagEventDataType = {type: EventType.enum.GUESS_TAG, tag, user: userToSend, roomID};
            connectionManager.send(data);
        }
        return isCorrect;
    }

    useEffect(() => {
        const onGuess = (data: GuessTagEventDataToClientType) => {
            const {isCorrect, tag} = handleGuess(data.tag.name);
            if(isCorrect && tag != null) {
                const newGuessedTags = [...guessedTags, { tag, user: data.user }];
                setGuessedTags(newGuessedTags);
                // update user's score on client side
                const userToUpdateScore = readyStates.find(readyState => readyState.user.id === data.user.id);
                if(userToUpdateScore) {
                    userToUpdateScore.user.score += tag.score;
                    setReadyStates([...readyStates]);
                }
            }
        };
        const unsubscribers = [connectionManager.listen<GuessTagEventDataToClientType>(EventType.enum.GUESS_TAG, onGuess)];
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        }

    }, [connectionManager, guessedTags, handleGuess, readyStates, setReadyStates])

    return [ guessedTags, guessTag, revealAllTags, applyLocalGuess ];
  }