import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import socket from "../lib/socket";
import HistoryModal from "../components/HistoryModal";

interface Participant {
  id: string;
  name: string;
}

interface ScoreEntry {
  id: string;
  value: number;
  participantId: string;
  participant: Participant;
}

interface Game {
  id: string;
  startedAt: string;
  endedAt: string | null;
  scores: ScoreEntry[];
}

interface Room {
  id: string;
  code: string;
  participants: Participant[];
  games: Game[];
}

export default function GameRoom() {
  const { code } = useParams<{ code: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) throw new Error();
      const data: Room = await res.json();
      setRoom(data);
      // Find the active game (most recent without endedAt)
      const active = data.games.find((g) => !g.endedAt);
      if (active) {
        setActiveGame(active);
        setScores(active.scores);
      }
    } catch {
      setError("Failed to load room");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchRoom();
    socket.emit("join-room", code);

    const handleScoreUpdated = (data: {
      scoreId: string;
      participantId: string;
      value: number;
      participantName: string;
    }) => {
      setScores((prev) =>
        prev.map((s) => (s.id === data.scoreId ? { ...s, value: data.value } : s))
      );
    };

    const handleGameStarted = (game: Game) => {
      setActiveGame(game);
      setScores(game.scores);
    };

    const handleGameEnded = (game: Game) => {
      setActiveGame(null);
      setScores(game.scores);
    };

    const handleParticipantAdded = () => {
      fetchRoom();
    };

    socket.on("score-updated", handleScoreUpdated);
    socket.on("game-started", handleGameStarted);
    socket.on("game-ended", handleGameEnded);
    socket.on("participant-added", handleParticipantAdded);

    return () => {
      socket.off("score-updated", handleScoreUpdated);
      socket.off("game-started", handleGameStarted);
      socket.off("game-ended", handleGameEnded);
      socket.off("participant-added", handleParticipantAdded);
    };
  }, [code, fetchRoom]);

  async function handleIncrement(scoreId: string) {
    try {
      await fetch(`/api/scores/${scoreId}/increment`, { method: "POST" });
    } catch {
      setError("Failed to update score");
    }
  }

  async function handleDecrement(scoreId: string) {
    try {
      await fetch(`/api/scores/${scoreId}/decrement`, { method: "POST" });
    } catch {
      setError("Failed to update score");
    }
  }

  async function handleEndGame() {
    if (!activeGame) return;
    setEnding(true);
    try {
      await fetch(`/api/games/${activeGame.id}/end`, { method: "POST" });
      setActiveGame(null);
    } catch {
      setError("Failed to end game");
    } finally {
      setEnding(false);
    }
  }

  async function handleStartNewGame() {
    try {
      const res = await fetch(`/api/rooms/${code}/games`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch {
      setError("Failed to start new game");
    }
  }

  const sortedScores = [...scores].sort((a, b) => b.value - a.value);

  if (loading) {
    return (
      <div className="min-h-dvh bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-dvh bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-red-300 text-lg">Room not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <h1 className="text-white font-bold text-lg">Game Room</h1>
        <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
          <span className="text-white/60 text-xs">CODE</span>
          <span className="text-white font-mono font-bold ml-2 text-lg tracking-wider">{code}</span>
        </div>
      </header>

      {/* Score Table */}
      {scores.length > 0 && (
        <div className="mx-4 mt-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Scoreboard</h2>
          </div>
          <div className="divide-y divide-white/10">
            {sortedScores.map((s, i) => (
              <div key={s.id} className="flex items-center px-4 py-3">
                <span className={`w-6 text-center font-bold text-sm ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-white/40"
                }`}>
                  {i + 1}
                </span>
                <span className="text-white ml-3 flex-1 font-medium">{s.participant.name}</span>
                <span className="text-white font-bold text-xl tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoring buttons */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeGame ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {scores.map((s) => (
              <div
                key={s.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold">
                  {s.participant.name[0].toUpperCase()}
                </div>
                <p className="text-white text-sm font-medium truncate w-full text-center">
                  {s.participant.name}
                </p>
                <p className="text-white font-bold text-3xl tabular-nums">{s.value}</p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleDecrement(s.id)}
                    className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-lg hover:bg-red-500/30 transition-colors active:scale-95"
                  >
                    −
                  </button>
                  <button
                    onClick={() => handleIncrement(s.id)}
                    className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-lg hover:bg-emerald-500/30 transition-colors active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-white/60 text-center">
              {scores.length > 0 ? "Game has ended." : "No active game."}
            </p>
            <button
              onClick={handleStartNewGame}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all active:scale-[0.98]"
            >
              Start New Game
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-300 text-sm text-center bg-red-500/20 rounded-lg py-2 mt-4">{error}</p>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <button
          onClick={() => setShowHistory(true)}
          className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-colors"
        >
          View History
        </button>

        {activeGame && (
          <button
            onClick={handleEndGame}
            disabled={ending}
            className="w-full py-4 rounded-xl bg-red-500 text-white font-semibold text-lg hover:bg-red-600 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {ending ? "Ending..." : "End Game"}
          </button>
        )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <HistoryModal roomCode={code!} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
