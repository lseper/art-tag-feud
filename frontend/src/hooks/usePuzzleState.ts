import { useState, useEffect, useCallback } from 'react';
import type { ConnectionManager } from '../util/ConnectionManager';
import type {
    PuzzlePieceDefinitionType,
    PuzzlePieceAssignmentType,
    PuzzleRoundStartEventDataToClientType,
    PuzzlePlacePieceEventDataToClientType,
    PuzzleRoundEndEventDataToClientType,
    PuzzlePlacePieceEventDataType,
} from '../types';
import { EventType } from '../types';

interface UsePuzzleStateReturn {
    pieces: PuzzlePieceDefinitionType[];
    myPieceIndices: number[];
    placedPieces: Map<number, string>;
    postUrl: string;
    postId: number | null;
    timerEnd: number;
    roundNumber: number;
    totalRounds: number;
    roundComplete: boolean;
    roundCompleted: boolean;
    onPlacePiece: (pieceIndex: number) => void;
    isActive: boolean;
}

/**
 * usePuzzleState manages puzzle-specific WebSocket state.
 * Listens for PUZZLE_ROUND_START, PUZZLE_PLACE_PIECE, and PUZZLE_ROUND_END events.
 */
export function usePuzzleState(
    connectionManager: ConnectionManager,
    roomID: string | undefined,
    userID: string | undefined,
): UsePuzzleStateReturn {
    const [pieces, setPieces] = useState<PuzzlePieceDefinitionType[]>([]);
    const [assignments, setAssignments] = useState<PuzzlePieceAssignmentType[]>([]);
    const [myPieceIndices, setMyPieceIndices] = useState<number[]>([]);
    const [placedPieces, setPlacedPieces] = useState<Map<number, string>>(new Map());
    const [postUrl, setPostUrl] = useState('');
    const [postId, setPostId] = useState<number | null>(null);
    const [timerEnd, setTimerEnd] = useState(0);
    const [roundNumber, setRoundNumber] = useState(0);
    const [totalRounds, setTotalRounds] = useState(0);
    const [roundComplete, setRoundComplete] = useState(false);
    const [roundCompleted, setRoundCompleted] = useState(false);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const onRoundStart = (data: PuzzleRoundStartEventDataToClientType) => {
            setPieces(data.pieces);
            setAssignments(data.assignments);
            setPlacedPieces(new Map());
            setPostUrl(data.postUrl);
            setPostId(data.postId);
            setTimerEnd(Date.now() + data.timerDurationMs);
            setRoundNumber(data.roundNumber);
            setTotalRounds(data.totalRounds);
            setRoundComplete(false);
            setRoundCompleted(false);
            setIsActive(true);

            // Determine which pieces belong to this user
            if (userID) {
                const myAssignment = data.assignments.find(a => a.userId === userID);
                setMyPieceIndices(myAssignment?.pieceIndices ?? []);
            } else {
                setMyPieceIndices([]);
            }
        };

        const onPlacePiece = (data: PuzzlePlacePieceEventDataToClientType) => {
            setPlacedPieces(prev => {
                const next = new Map(prev);
                next.set(data.pieceIndex, data.userID);
                return next;
            });
        };

        const onRoundEnd = (data: PuzzleRoundEndEventDataToClientType) => {
            setRoundComplete(true);
            setRoundCompleted(data.completed);
            setIsActive(false);
            // Sync placed pieces from server in case of desync
            setPlacedPieces(prev => {
                const next = new Map(prev);
                data.placedPieces.forEach(idx => {
                    if (!next.has(idx)) {
                        next.set(idx, 'server');
                    }
                });
                return next;
            });
        };

        const unsubscribers = [
            connectionManager.listen<PuzzleRoundStartEventDataToClientType>(
                EventType.enum.PUZZLE_ROUND_START,
                onRoundStart,
            ),
            connectionManager.listen<PuzzlePlacePieceEventDataToClientType>(
                EventType.enum.PUZZLE_PLACE_PIECE,
                onPlacePiece,
            ),
            connectionManager.listen<PuzzleRoundEndEventDataToClientType>(
                EventType.enum.PUZZLE_ROUND_END,
                onRoundEnd,
            ),
        ];

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [connectionManager, userID]);

    const onPlacePiece = useCallback(
        (pieceIndex: number) => {
            if (!roomID || !userID) return;
            const data: PuzzlePlacePieceEventDataType = {
                type: EventType.enum.PUZZLE_PLACE_PIECE,
                roomID,
                userID,
                pieceIndex,
            };
            connectionManager.send(data);
        },
        [connectionManager, roomID, userID],
    );

    return {
        pieces,
        myPieceIndices,
        placedPieces,
        postUrl,
        postId,
        timerEnd,
        roundNumber,
        totalRounds,
        roundComplete,
        roundCompleted,
        onPlacePiece,
        isActive,
    };
}
