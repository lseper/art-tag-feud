import { UserContext } from '../contexts/UserContext';
import { useContext, useMemo, useEffect, useCallback } from 'react';
import type {LeaveRoomEventDataType, LeaveRoomEventDataToClientType } from '../types';
import { EventType } from '../types';
import LeaderBoard from '../components/Leaderboard';
import {
  useNavigate,
} from 'react-router-dom';
import styles from '@/styles/pages/finish.module.css';

type Props = {
  className?: string;
}

export const Finish : React.FC<Props> = ({className}: Props) => {

    // TODO: test with multiple users at end of game
  /**
   * Server-driven user values
   */
  const {userID, roomID, readyStates, owner, setOwner, setReadyStates, leaveRoomCleanup, connectionManager, gameMode, rouletteEliminationOrder} = useContext(UserContext);
  const navigate = useNavigate();

  // Sort readyStates by Roulette survival order on mount
  useEffect(() => {
    if (gameMode !== 'Roulette') return;
    const eliminatedSet = new Set(rouletteEliminationOrder);
    const survivors = readyStates.filter(rs => !eliminatedSet.has(rs.user.id));
    const eliminated = rouletteEliminationOrder
      .map(id => readyStates.find(rs => rs.user.id === id))
      .filter((rs): rs is (typeof readyStates)[number] => rs != null)
      .reverse(); // last eliminated = highest ranked among eliminated
    const sorted = [...survivors, ...eliminated];
    if (sorted.length === readyStates.length) {
      setReadyStates(sorted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {

    // transfer ownership of room if owner leaves, lets people leave room
    const onUserLeftRoom = (data: LeaveRoomEventDataToClientType) => {
      const newReadyStates = data.room.readyStates;
      const newOwner = data.room.owner;
      if(!owner) {
        setOwner(newOwner);
      } else {
        if(owner.id !== newOwner.id) {
          setOwner(newOwner);
        }
      }
      setReadyStates(newReadyStates);
    }

    // orchestrate game start
    const unsubscribers = [
        connectionManager.listen<LeaveRoomEventDataToClientType>(EventType.enum.LEAVE_ROOM, onUserLeftRoom),
    ];

    return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
    }
}, [connectionManager, owner, readyStates, setOwner, setReadyStates])

    const winner = useMemo(() => {
        if (gameMode === 'Roulette') {
            const eliminatedSet = new Set(rouletteEliminationOrder);
            const survivors = readyStates.filter(rs => !eliminatedSet.has(rs.user.id));
            if (survivors.length > 0) {
                return survivors[0];
            }
            // All eliminated — last eliminated was the winner
            if (rouletteEliminationOrder.length > 0) {
                const lastEliminatedID = rouletteEliminationOrder[rouletteEliminationOrder.length - 1];
                return readyStates.find(rs => rs.user.id === lastEliminatedID);
            }
            return readyStates[0];
        }
        readyStates.sort((a, b) => b.user.score - a.user.score);
        return readyStates[0];
    }, [gameMode, readyStates, rouletteEliminationOrder]);

    const leaveRoom = useCallback(() => {
        if(roomID && userID) {
          const data: LeaveRoomEventDataType = {type: EventType.enum.LEAVE_ROOM, userID, roomID};
          connectionManager.send(data);
          leaveRoomCleanup();
        }
        navigate("/");
      }, [connectionManager, leaveRoomCleanup, navigate, roomID, userID]);

    const playAgain = useCallback(() => {
        // TODO: test this lol
        if(owner?.id === userID) {
            navigate("/create");
        } else {
            navigate("/play");
        }
    }, [navigate, owner?.id, userID]);

  return <div className={styles.container}>
    <span>
        <h1 className={`${styles.winnerText} ${styles.winnerName}`}>{winner ? winner.user.username : 'Rory'}</h1>
        <h1 className={styles.winnerText}> is the winner!</h1>
    </span>
    <LeaderBoard />
    <div className={styles.buttonContainer}>
        {/* <RoomUpdateButton color="var(--c-tag-species)" onClick={() => leaveRoom()}>
            Leave Room
        </RoomUpdateButton>
        <RoomUpdateButton color="var(--c-tag-character)" onClick={() => playAgain()}>
            Play Again
        </RoomUpdateButton> */}
    </div>
  </div>;
}

export default Finish;
