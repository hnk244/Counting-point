import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateRoom() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      const room = await res.json();
      navigate(`/room/${room.code}/setup`);
    } catch {
      setError("Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinRoom() {
    if (joinCode.length !== 4) {
      setError("Please enter a 4-digit room code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/rooms/${joinCode}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Room not found");
        return;
      }
      navigate(`/room/${joinCode}`);
    } catch {
      setError("Failed to join room");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Count Point</h1>
          <p className="text-purple-200 text-sm">Real-time score tracking</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4 border border-white/20">
          {!showJoin ? (
            <>
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg hover:from-indigo-600 hover:to-purple-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create New Room"}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-white/50 text-xs uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              <button
                onClick={() => setShowJoin(true)}
                className="w-full py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all active:scale-[0.98]"
              >
                Join Room
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setShowJoin(false); setError(""); }}
                className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <p className="text-white font-medium text-center">Enter Room Code</p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ""))}
                placeholder="0000"
                className="w-full text-center text-3xl tracking-[0.5em] py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />

              <button
                onClick={handleJoinRoom}
                disabled={loading || joinCode.length !== 4}
                className="w-full py-4 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join"}
              </button>
            </>
          )}

          {error && (
            <p className="text-red-300 text-sm text-center bg-red-500/20 rounded-lg py-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
