import { useState, useEffect, useContext } from 'react';
import { ConnectionManager } from './util/ConnectionManager';
import { UserContext } from './contexts/UserContext';
import type { BotActionSequenceType, GameModeType, GuessedTagEntryType, PostType, RequestPostEventDataToClientType, RequestPostEventDataType, RouletteAllTagsGuessedEventDataToClientType, SyncRoundStateEventDataToClientType } from './types';
import { EventType } from './types';

// custom hook, returns an object that has the CurrentPost, and an update callback function that we define
export default function usePostFetcher(connectionManager: ConnectionManager, roomID?: string, gameMode?: GameModeType) : {
    currentPost: PostType | null;
    botActionSequence: BotActionSequenceType | null;
    roundGuesses: GuessedTagEntryType[];
    update: () => Promise<void>;
  } {
    // want component re-rendering when this changes
    const [currentPost, setCurrentPost] = useState<PostType | null>(null);
    const [botActionSequence, setBotActionSequence] = useState<BotActionSequenceType | null>(null);
    const [roundGuesses, setRoundGuesses] = useState<GuessedTagEntryType[]>([]);
    const {userID, readyStates, setReadyStates} = useContext(UserContext);

    // run update once on mount
    useEffect( () => {
      const onRequestPost = (data: RequestPostEventDataToClientType) => {
        const newPost = data.post;
        if(newPost != null) {
          const tags = Array.isArray(newPost.tags) ? [...newPost.tags] : [];
          tags.sort((a, b) => b.score - a.score);
          setCurrentPost({ ...newPost, tags });
          setBotActionSequence(data.botActionSequence ?? null);
          setRoundGuesses([]);
          // reset client side ready states to false (only for Blitz mode)
          if (gameMode !== 'Roulette') {
            setReadyStates(prevStates => (
              (Array.isArray(prevStates) ? prevStates : []).map(readyState => ({ ...readyState, ready: false }))
            ));
          }
        } else {
          setBotActionSequence(null);
        }
      }
      const onSyncRoundState = (data: SyncRoundStateEventDataToClientType) => {
        const syncedPost = data.post;
        if (syncedPost != null) {
          const tags = Array.isArray(syncedPost.tags) ? [...syncedPost.tags] : [];
          tags.sort((a, b) => b.score - a.score);
          setCurrentPost({ ...syncedPost, tags });
        }
        setRoundGuesses(data.guessedTags ?? []);
        setBotActionSequence(null);
      };

      // In Roulette mode, ROULETTE_ALL_TAGS_GUESSED precedes a new REQUEST_POST.
      // The server auto-fetches the next post, so we just clear state here.
      const onRouletteAllTagsGuessed = (_data: RouletteAllTagsGuessedEventDataToClientType) => {
        setRoundGuesses([]);
      };

      const unsubscribers = [
        connectionManager.listen<RequestPostEventDataToClientType>(EventType.enum.REQUEST_POST, onRequestPost),
        connectionManager.listen<SyncRoundStateEventDataToClientType>(EventType.enum.SYNC_ROUND_STATE, onSyncRoundState),
        connectionManager.listen<RouletteAllTagsGuessedEventDataToClientType>(EventType.enum.ROULETTE_ALL_TAGS_GUESSED, onRouletteAllTagsGuessed),
      ];

      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      }
    }, [connectionManager, gameMode, readyStates, setReadyStates]);

    // define what the update callback will be
    async function update() {
      if(roomID != null && userID != null) {
        const data: RequestPostEventDataType = {type: EventType.enum.REQUEST_POST, roomID: roomID, userID: userID}
        connectionManager.send(data);
      }
    }
    return { currentPost, botActionSequence, roundGuesses, update };
  }
