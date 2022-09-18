import { useEffect, useState, useCallback, useContext } from 'react';
import type { GuessTagEventData, GuessTagEventDataToClient, Tag, User } from './types';
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
export default function useTagListGuesser(startingTags : Tag[]) : [
    Tag[], Tag[], (guess: string) => boolean, () => void, () => void
] {
    // want component re-rendering when this changes
    const [guessedTags, setGuessedTags] = useState<Tag[]>([]);
    const [hiddenTags, setHiddenTags] = useState(startingTags);
    const {connectionManager, username, readyStates, setReadyStates, userID, roomID, score} = useContext(UserContext);

    function revealAllTags() {
        setGuessedTags([...guessedTags, ...hiddenTags]);
    }

    function hideAllTags() {
        setGuessedTags([]);
    }

    // reset on new post
    useEffect(() => {
        setHiddenTags(startingTags);
        setGuessedTags([]);
    }, [startingTags])

    const handleGuess = useCallback((guess: string) : {isCorrect: boolean, tag?: Tag} => {
        let tagIndex = hiddenTags.findIndex((tag : Tag) => tag.name === guess);
        if(guessedTags.some(tag => tag.name === guess)){
            // console.log('short circuiting, already guessed');
            return {isCorrect: false};
        }
        if(tagIndex < 0) {
            // see if there is an alias
            guess = checkAlias(guess);
            if(guess === '') {
                // short-circuit on faulty guess, return false for did not guess tag correctly
                return {isCorrect: false};
            }
            tagIndex = hiddenTags.findIndex((tag : Tag) => tag.name === guess)
            if(tagIndex === -1) {
                return {isCorrect: false};
            }
        }
        console.log("successful guess");
        const guessedTag = hiddenTags[tagIndex];
        return {isCorrect: true, tag: guessedTag};
    }, [guessedTags, hiddenTags]);
    
    // define what the update callback will be
    const guessTag = (guess: string) : boolean => {
        const {isCorrect, tag} = handleGuess(guess);
        if(userID && roomID && isCorrect && tag != null) {
            // TODO: emit username as well
            const usernameToSend = username ?? 'DEFAULT_USERNAME';
            const userToSend: User = {id: userID, score, username: usernameToSend, roomID};
            const data: GuessTagEventData = {type: EventType.enum.GUESS_TAG, tag, user: userToSend, roomID};
            connectionManager.send(data);
        }
        return isCorrect;
    }

    useEffect(() => {
        // console.log("adding event listener...");
        const onGuess = (data: GuessTagEventDataToClient) => {
            const {isCorrect, tag} = handleGuess(data.tag.name);
            console.log(`isCorrect: ${isCorrect} Tag: ${tag}`);
            if(isCorrect && tag != null) {
                // TODO: associate guessed tags with a user that guessed it
                const newGuessedTags = [...guessedTags, tag];
                setGuessedTags(newGuessedTags);
                // update user's score on client side
                const userToUpdateScore = readyStates.find(readyState => readyState.user.id === data.user.id);
                if(userToUpdateScore) {
                    console.log(`score before: ${userToUpdateScore.user.score}`);
                    userToUpdateScore.user.score += tag.score;
                    console.log(`score after: ${userToUpdateScore.user.score}`);
                    setReadyStates([...readyStates]);
                }
            }
        };
        const unsubscribers = [connectionManager.listen<GuessTagEventDataToClient>(EventType.enum.GUESS_TAG, onGuess)];
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        }

    }, [connectionManager, guessedTags, handleGuess])

    return [ guessedTags, hiddenTags, guessTag, revealAllTags, hideAllTags ];
  }