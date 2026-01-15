import { useState, useEffect, useContext } from 'react';
import { ConnectionManager } from './util/ConnectionManager';
import { UserContext } from './contexts/UserContext';
import type { PostType, RequestPostEventDataToClientType, RequestPostEventDataType} from './types';
import { EventType } from './types';

// custom hook, returns an object that has the CurrentPost, and an update callback function that we define
export default function usePostFetcher(connectionManager: ConnectionManager, roomID?: string) : {
    currentPost: PostType | null;
    update: () => Promise<void>;
  } {
    // want component re-rendering when this changes
    const [currentPost, setCurrentPost] = useState<PostType | null>(null);
    const {userID, readyStates, setReadyStates} = useContext(UserContext);
  
    // run update once on mount
    useEffect( () => {
      const onRequestPost = (data: RequestPostEventDataToClientType) => {
        const newPost = data.post;
        if(newPost != null) {
          const tags = Array.isArray(newPost.tags) ? [...newPost.tags] : [];
          tags.sort((a, b) => b.score - a.score);
          setCurrentPost({ ...newPost, tags });
          // reset client side ready states to false
          const newReadyStates = (Array.isArray(readyStates) ? readyStates : []).map(readyState => ({...readyState, ready: false}))
          setReadyStates(newReadyStates);
        }
      }
      const unsubscribers = [connectionManager.listen<RequestPostEventDataToClientType>(EventType.enum.REQUEST_POST, onRequestPost)];

      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      }
    }, [connectionManager, readyStates, setReadyStates]);

    // define what the update callback will be
    async function update() {
      if(roomID != null && userID != null) {
        const data: RequestPostEventDataType = {type: EventType.enum.REQUEST_POST, roomID: roomID, userID: userID}
        connectionManager.send(data);
      }
    }
    return { currentPost, update };
  }