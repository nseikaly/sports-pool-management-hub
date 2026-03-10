// ─── Masters 2026 Pool ────────────────────────────────────────────────────────
// Main component for The Masters 2026 golf pool.
// Scaffold — ready for full development.

import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db, auth } from "./firebase";
import { MASTERS_CONFIG } from "./mastersConfig";
import { buildMastersLeaderboard } from "./mastersScoring";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  :root {
    --masters-green:  #1A6B3A;
    --masters-gold:   #D4AF37;
    --masters-cream:  #FDF8EE;
  }
  .masters-wrap { max-width: 900px; margin: 0 auto; padding: 24px 16px; font-family: sans-serif; }
  .masters-header { text-align: center; margin-bottom: 32px; }
  .masters-title { font-size: 2rem; font-weight: 800; color: var(--masters-green); letter-spacing: 2px; }
  .masters-subtitle { font-size: 0.85rem; color: #666; margin-top: 4px; }
  .masters-coming-soon { text-align: center; padding: 80px 24px; color: #888; }
  .masters-coming-soon h2 { font-size: 1.4rem; color: var(--masters-green); margin-bottom: 8px; }
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function MastersPool({ dbPath, poolId, adminAuthed, onAdminLogin }) {
  const [tab,          setTab]          = useState("picks");
  const [participants, setParticipants] = useState({});
  const [results,      setResults]      = useState({});  // { playerName: { position, score, thru, status } }
  const [picksLocked,  setPicksLocked]  = useState(false);

  // ── Firebase listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!db || !dbPath) return;

    const unsubs = [
      onValue(ref(db, `${dbPath}/participants`), snap => {
        setParticipants(snap.exists() ? snap.val() : {});
      }),
      onValue(ref(db, `${dbPath}/results`), snap => {
        setResults(snap.exists() ? snap.val() : {});
      }),
      onValue(ref(db, `${dbPath}/settings/locked`), snap => {
        setPicksLocked(snap.exists() ? snap.val() : false);
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, [dbPath]);

  const leaderboard = buildMastersLeaderboard(participants, results);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="masters-wrap">

        {/* Header */}
        <div className="masters-header">
          <div className="masters-title">⛳ THE MASTERS 2026</div>
          <div className="masters-subtitle">
            {MASTERS_CONFIG.venue} · {MASTERS_CONFIG.dates}
          </div>
        </div>

        {/* Tab nav — placeholder, expand as needed */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, justifyContent: "center" }}>
          {["picks", "leaderboard", "admin"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: tab === t ? "var(--masters-green)" : "#fff",
                color: tab === t ? "#fff" : "#333",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── PICKS TAB ── */}
        {tab === "picks" && (
          <div className="masters-coming-soon">
            <h2>Pick Your Golfers</h2>
            <p>Pick one golfer per tier before the tournament begins.</p>
            <p style={{ fontSize: "0.75rem", color: "#aaa", marginTop: 16 }}>
              {MASTERS_CONFIG.tiers.length} tiers · {MASTERS_CONFIG.tiers.reduce((a, t) => a + t.players.length, 0)} players in the field
            </p>
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {tab === "leaderboard" && (
          <div className="masters-coming-soon">
            <h2>Pool Standings</h2>
            <p>{leaderboard.length} participant{leaderboard.length !== 1 ? "s" : ""} entered.</p>
            <p style={{ fontSize: "0.75rem", color: "#aaa", marginTop: 16 }}>
              Standings will populate once the tournament begins.
            </p>
          </div>
        )}

        {/* ── ADMIN TAB ── */}
        {tab === "admin" && !adminAuthed && (
          <div className="masters-coming-soon">
            <div style={{ fontSize: "2rem" }}>🔒</div>
            <h2>Admin Access</h2>
            <p>Sign in via <strong>Admin Hub</strong> in the left menu to access admin controls.</p>
          </div>
        )}

        {tab === "admin" && adminAuthed && (
          <div className="masters-coming-soon">
            <h2>Admin Controls</h2>
            <p>Results entry and pool management coming soon.</p>
          </div>
        )}

      </div>
    </>
  );
}
