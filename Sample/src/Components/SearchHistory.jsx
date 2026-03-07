// SearchHistory.jsx
// Displays the user's past searches in a slide-in panel.
// Props:
//   onRestore(entry) — called when user clicks a past search to re-run it
//   onClose         — called to close the panel

import { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:8080";

function formatDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function SearchHistory({ onRestore, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/history`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (_) { }
        finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`${BACKEND_URL}/api/history/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            setHistory((prev) => prev.filter((h) => h.id !== id));
        } catch (_) { }
    };

    return (
        <div className="history-panel">
            <div className="history-header">
                <h3>📋 Search History</h3>
                <button className="history-close-btn" onClick={onClose} title="Close">✕</button>
            </div>

            {loading && <p className="history-empty">Loading...</p>}

            {!loading && history.length === 0 && (
                <p className="history-empty">No searches yet. Start searching!</p>
            )}

            {!loading && history.length > 0 && (
                <ul className="history-list">
                    {history.map((entry) => (
                        <li key={entry.id} className="history-item">
                            <div className="history-item-info">
                                <span className="history-mode-badge">
                                    {entry.searchMode === "internship" ? "🎓" : "💼"} {entry.searchMode}
                                </span>
                                <span className="history-query">
                                    {entry.query || entry.skills || entry.sector || "Search"}
                                </span>
                                {entry.location && (
                                    <span className="history-location">📍 {entry.location}</span>
                                )}
                                <span className="history-time">{formatDate(entry.timestamp)}</span>
                            </div>
                            <div className="history-item-actions">
                                <button
                                    className="history-restore-btn"
                                    onClick={() => onRestore(entry)}
                                    title="Re-run this search"
                                >
                                    ▶
                                </button>
                                <button
                                    className="history-delete-btn"
                                    onClick={() => handleDelete(entry.id)}
                                    title="Delete"
                                >
                                    🗑
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchHistory;
