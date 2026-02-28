import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../lib/socket";

interface Participant {
  id: string;
  name: string;
  roomId: string;
}

export default function RoomSetup() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    socket.emit("join-room", code);
    // Fetch existing participants
    fetch(`/api/rooms/${code}`)
      .then((r) => r.json())
      .then((room) => setParticipants(room.participants || []))
      .catch(() => {});
    const handleAdded = (p: Participant) => {
      setParticipants((prev) => {
        if (prev.find((x) => x.id === p.id)) return prev;
        return [...prev, p];
      });
    };
    socket.on("participant-added", handleAdded);
    return () => {
      socket.off("participant-added", handleAdded);
    };
  }, [code]);

  async function handleAddParticipant() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${code}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error();
      setName("");
      setShowInput(false);
    } catch {
      setError("Failed to add participant");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartGame() {
    if (participants.length < 2) {
      setError("Need at least 2 participants");
      return;
    }
    setStarting(true);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${code}/games`, { method: "POST" });
      if (!res.ok) throw new Error();
      navigate(`/room/${code}`);
    } catch {
      setError("Failed to start game");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <h1 className="text-white font-bold text-lg">Room Setup</h1>
        <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
          <span className="text-white/60 text-xs">CODE</span>
          <span className="text-white font-mono font-bold ml-2 text-lg tracking-wider">{code}</span>
        </div>
      </header>

      {/* Participants list */}
      <div className="flex-1 p-4 overflow-y-auto">
        <p className="text-white/60 text-sm mb-4">
          {participants.length} participant{participants.length !== 1 ? "s" : ""} added
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {participants.map((p) => (
            <div
              key={p.id}
              className="bg-white/10 border border-white/20 rounded-xl p-4 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-400 to-purple-400 mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm">
                {p.name[0].toUpperCase()}
              </div>
              <p className="text-white text-sm font-medium truncate">{p.name}</p>
            </div>
          ))}
        </div>

        {/* Add participant button / input */}
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-all active:scale-95 shadow-lg shadow-purple-500/30"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 max-w-sm mx-auto">
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
              placeholder="Participant name"
              className="w-full py-3 px-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowInput(false); setName(""); }}
                className="flex-1 py-2.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParticipant}
                disabled={loading || !name.trim()}
                className="flex-1 py-2.5 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-300 text-sm text-center bg-red-500/20 rounded-lg py-2 mt-4">{error}</p>
        )}
      </div>

      {/* Start game button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleStartGame}
          disabled={starting || participants.length < 2}
          className="w-full py-4 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {starting ? "Starting..." : "Start Game"}
        </button>
      </div>
    </div>
  );
}
