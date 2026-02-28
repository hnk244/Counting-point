import { useState, useEffect } from "react";

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

interface Props {
  roomCode: string;
  onClose: () => void;
}

export default function HistoryModal({ roomCode, onClose }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rooms/${roomCode}/history`)
      .then((r) => r.json())
      .then((data) => setGames(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomCode]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[80vh] bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">Game History</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <p className="text-white/60 text-center py-8">Loading...</p>
          ) : games.length === 0 ? (
            <p className="text-white/60 text-center py-8">No completed games yet</p>
          ) : (
            games.map((game, gi) => (
              <div key={game.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                  <span className="text-white font-semibold text-sm">Game #{games.length - gi}</span>
                  <span className="text-white/40 text-xs">
                    {new Date(game.startedAt).toLocaleString()}
                  </span>
                </div>
                <div className="divide-y divide-white/5">
                  {[...game.scores]
                    .sort((a, b) => b.value - a.value)
                    .map((s, i) => (
                      <div key={s.id} className="flex items-center px-4 py-2.5">
                        <span className={`w-6 text-center font-bold text-sm ${
                          i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-white/40"
                        }`}>
                          {i + 1}
                        </span>
                        <span className="text-white ml-3 flex-1 text-sm">{s.participant.name}</span>
                        <span className="text-white font-bold tabular-nums">{s.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
