import { useState, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./firebase";
import { SPORTS, POOL_MAP } from "./poolRegistry";
import NBAPlayoffPool from "./NBAPlayoffPool";
import { migrateNBAData } from "./migrations";

// ─── Shell CSS ────────────────────────────────────────────────────────────────

const shellCss = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#080c12; --surface:#0e1420; --surface2:#141b28; --surface3:#1b2435;
    --border:#1e2a3a; --border2:#243040; --gold:#c9a84c; --gold2:#f0c65a;
    --amber:#e8943a; --cyan:#2dd4bf; --red:#ef4444; --green:#22c55e;
    --text:#e8edf5; --text2:#b0bfd0; --text3:#728499;
  }
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@700;800&display=swap');
  body {
    background:var(--bg); color:var(--text);
    font-family:'DM Sans',sans-serif; min-height:100vh; overflow:hidden;
  }

  /* ── Shell layout ─────────────────────────────────────────────────────── */
  .shell { display:flex; height:100vh; overflow:hidden; background:var(--bg); }
  .shell-main { flex:1; overflow-y:auto; overflow-x:hidden; min-width:0; }

  /* ── Sidebar ──────────────────────────────────────────────────────────── */
  .shell-sidebar {
    width:252px; min-width:252px;
    background:var(--surface);
    border-right:1px solid var(--border);
    display:flex; flex-direction:column;
    transition:width 0.25s ease, min-width 0.25s ease;
    overflow:hidden; flex-shrink:0; z-index:20;
    user-select:none;
  }
  .shell-sidebar.sb-collapsed { width:56px; min-width:56px; }

  /* Sidebar header */
  .sb-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:15px 12px 13px; border-bottom:1px solid var(--border);
    min-height:58px; flex-shrink:0; gap:8px;
  }
  .sb-logo {
    display:flex; align-items:center; gap:9px;
    cursor:pointer; flex:1; min-width:0; overflow:hidden;
    text-decoration:none;
  }
  .sb-logo-icon { font-size:1.35rem; flex-shrink:0; line-height:1; }
  .sb-logo-text {
    font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:3px;
    color:var(--text); white-space:nowrap; overflow:hidden;
    opacity:1; transition:opacity 0.15s; flex-shrink:0;
  }
  .sb-collapsed .sb-logo-text { opacity:0; width:0; }
  .sb-collapse-btn {
    width:28px; height:28px; flex-shrink:0;
    background:none; border:1px solid var(--border2); border-radius:6px;
    color:var(--text3); cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    font-size:0.8rem; transition:all 0.15s; line-height:1;
  }
  .sb-collapse-btn:hover { border-color:var(--gold); color:var(--gold); }
  .sb-collapsed .sb-collapse-btn { margin:0 auto; }

  /* Sidebar scroll area */
  .sb-scroll { flex:1; overflow-y:auto; overflow-x:hidden; padding:6px 0 10px; }
  .sb-scroll::-webkit-scrollbar { width:3px; }
  .sb-scroll::-webkit-scrollbar-track { background:transparent; }
  .sb-scroll::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }

  /* Sport section */
  .sb-sport { margin-bottom:1px; }
  .sb-sport-hdr {
    display:flex; align-items:center; gap:8px;
    padding:7px 12px 7px 10px; cursor:pointer;
    transition:background 0.12s; border-radius:0;
    min-height:36px;
  }
  .sb-sport-hdr:hover { background:rgba(255,255,255,0.03); }
  .sb-sport-icon {
    font-size:1rem; width:28px; height:28px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    border-radius:7px; transition:all 0.15s;
  }
  .sb-sport-name {
    flex:1; font-size:0.7rem; font-weight:700; letter-spacing:1.5px;
    text-transform:uppercase; color:var(--text3);
    white-space:nowrap; overflow:hidden;
    opacity:1; transition:opacity 0.15s;
  }
  .sb-collapsed .sb-sport-name { opacity:0; }
  .sb-sport-chevron {
    font-size:0.55rem; color:var(--text3);
    transition:transform 0.2s, opacity 0.15s; flex-shrink:0;
  }
  .sb-collapsed .sb-sport-chevron { opacity:0; }
  .sb-sport-hdr.open .sb-sport-chevron { transform:rotate(180deg); }

  /* Pool item */
  .sb-pool-list { overflow:hidden; }
  .sb-pool-item {
    display:flex; align-items:center; gap:8px;
    padding:6px 10px 6px 46px; cursor:pointer;
    transition:all 0.12s; border-left:3px solid transparent;
    min-height:34px; position:relative;
  }
  .sb-pool-item:hover { background:rgba(255,255,255,0.03); }
  .sb-pool-item.active {
    border-left-color:var(--gold);
    background:rgba(201,168,76,0.06);
  }
  .sb-pool-name {
    flex:1; font-size:0.74rem; font-weight:600; color:var(--text2);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    opacity:1; transition:opacity 0.15s;
  }
  .sb-pool-item.active .sb-pool-name { color:var(--gold2); }
  .sb-pool-item.inactive .sb-pool-name { color:var(--text3); font-style:italic; }
  .sb-collapsed .sb-pool-name { opacity:0; }
  .sb-pool-dot {
    width:6px; height:6px; border-radius:50%; background:var(--gold);
    flex-shrink:0; opacity:1; transition:opacity 0.15s;
  }
  .sb-collapsed .sb-pool-dot { opacity:0; }
  .sb-inactive-chip {
    font-size:0.48rem; letter-spacing:1px; text-transform:uppercase;
    color:var(--text3); background:rgba(255,255,255,0.04);
    border:1px solid var(--border2); border-radius:3px;
    padding:1px 5px; flex-shrink:0;
    opacity:1; transition:opacity 0.15s;
  }
  .sb-collapsed .sb-inactive-chip { opacity:0; }

  /* Collapsed icon rail sport pills */
  .sb-collapsed .sb-sport-hdr {
    padding:0; justify-content:center; height:44px;
  }
  .sb-collapsed .sb-sport-icon {
    position:relative;
  }
  .sb-collapsed .sb-sport-icon.has-active {
    border:1.5px solid rgba(201,168,76,0.5);
    box-shadow:0 0 6px rgba(201,168,76,0.2);
    background:rgba(201,168,76,0.08);
  }
  .sb-collapsed .sb-pool-item {
    display:none;
  }

  /* Sidebar divider */
  .sb-divider { height:1px; background:var(--border); margin:8px 10px; }

  /* Admin hub sidebar item */
  .sb-admin-item {
    display:flex; align-items:center; gap:9px;
    padding:9px 12px 9px 10px; cursor:pointer;
    transition:all 0.12s; border-radius:0;
    color:var(--text3); font-size:0.74rem; font-weight:600;
    border-left:3px solid transparent;
  }
  .sb-admin-item:hover { background:rgba(255,255,255,0.03); color:var(--text2); }
  .sb-admin-item.active { border-left-color:var(--gold); color:var(--gold2); background:rgba(201,168,76,0.06); }
  .sb-admin-icon { font-size:1rem; width:28px; height:28px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; }
  .sb-admin-label { opacity:1; transition:opacity 0.15s; white-space:nowrap; }
  .sb-collapsed .sb-admin-label { opacity:0; }
  .sb-collapsed .sb-admin-item { padding:0; justify-content:center; height:44px; }

  /* ── Pool Hub Home ─────────────────────────────────────────────────────── */
  .hub-home { padding:48px 40px 80px; max-width:1100px; }
  .hub-hero { margin-bottom:40px; }
  .hub-hero-title {
    font-family:'Bebas Neue',sans-serif; font-size:3.4rem; letter-spacing:5px;
    line-height:1; color:var(--text); margin-bottom:6px;
  }
  .hub-hero-title span { color:var(--gold); }
  .hub-hero-sub {
    font-size:0.72rem; letter-spacing:3px; color:var(--text3); text-transform:uppercase;
  }

  .hub-section-label {
    font-size:0.62rem; font-weight:700; letter-spacing:2.5px; text-transform:uppercase;
    color:var(--text3); margin-bottom:16px;
    display:flex; align-items:center; gap:10px;
  }
  .hub-section-label::after { content:''; flex:1; height:1px; background:var(--border); }

  /* Active pool cards */
  .hub-active-grid {
    display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr));
    gap:16px; margin-bottom:44px;
  }
  .hub-active-card {
    background:var(--surface2); border:1px solid var(--gold);
    border-radius:12px; padding:24px 20px; cursor:pointer;
    transition:all 0.15s; position:relative; overflow:hidden;
  }
  .hub-active-card::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 60%);
    pointer-events:none;
  }
  .hub-active-card:hover { border-color:var(--gold2); box-shadow:0 0 20px rgba(201,168,76,0.12); transform:translateY(-1px); }
  .hub-ac-icon { font-size:2.2rem; margin-bottom:12px; line-height:1; }
  .hub-ac-sport { font-size:0.6rem; letter-spacing:2px; text-transform:uppercase; color:var(--text3); margin-bottom:4px; }
  .hub-ac-name { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; letter-spacing:2px; color:var(--gold); line-height:1; margin-bottom:6px; }
  .hub-ac-badge {
    display:inline-flex; align-items:center; gap:4px;
    background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25);
    color:var(--green); font-size:0.58rem; letter-spacing:1.5px; text-transform:uppercase;
    font-weight:700; border-radius:20px; padding:2px 8px;
  }

  /* All sports grid */
  .hub-sports-grid {
    display:grid; grid-template-columns:repeat(auto-fill, minmax(160px,1fr));
    gap:12px;
  }
  .hub-sport-card {
    background:var(--surface2); border:1px solid var(--border2); border-radius:10px;
    padding:18px 14px; cursor:pointer; transition:all 0.15s; text-align:center;
  }
  .hub-sport-card:hover { border-color:var(--border2); background:var(--surface3); }
  .hub-sport-card.has-active:hover { border-color:rgba(201,168,76,0.4); }
  .hub-sc-icon { font-size:1.6rem; margin-bottom:8px; line-height:1; }
  .hub-sc-name { font-size:0.72rem; font-weight:700; letter-spacing:1px; color:var(--text2); margin-bottom:6px; text-transform:uppercase; }
  .hub-sc-pools { font-size:0.62rem; color:var(--text3); }
  .hub-sc-active-dot { display:inline-block; width:5px; height:5px; border-radius:50%; background:var(--gold); margin-right:4px; vertical-align:middle; }

  /* ── Inactive Pool View ────────────────────────────────────────────────── */
  .inactive-pool-view {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    min-height:70vh; padding:40px 20px; text-align:center;
  }
  .ipv-icon { font-size:3.5rem; margin-bottom:16px; line-height:1; }
  .ipv-sport { font-size:0.65rem; letter-spacing:3px; text-transform:uppercase; color:var(--text3); margin-bottom:6px; }
  .ipv-name {
    font-family:'Bebas Neue',sans-serif; font-size:2.2rem; letter-spacing:3px;
    color:var(--text); margin-bottom:14px; line-height:1;
  }
  .ipv-badge {
    display:inline-flex; align-items:center; gap:5px;
    background:rgba(255,255,255,0.04); border:1px solid var(--border2);
    color:var(--text3); font-size:0.62rem; letter-spacing:2px; text-transform:uppercase;
    font-weight:700; border-radius:20px; padding:4px 12px; margin-bottom:20px;
  }
  .ipv-desc { font-size:0.83rem; color:var(--text2); max-width:400px; line-height:1.6; margin-bottom:24px; }
  .ipv-enable-btn {
    background:var(--surface2); border:1px solid var(--gold); color:var(--gold);
    border-radius:8px; padding:10px 24px; font-size:0.75rem; font-weight:700;
    letter-spacing:1.5px; text-transform:uppercase; font-family:'Bebas Neue',sans-serif;
    cursor:pointer; transition:all 0.15s;
  }
  .ipv-enable-btn:hover { background:rgba(201,168,76,0.1); }

  /* ── Global Admin Hub ─────────────────────────────────────────────────── */
  .admin-hub { max-width:800px; padding:40px 40px 80px; }
  .admin-hub-title {
    font-family:'Bebas Neue',sans-serif; font-size:2.2rem; letter-spacing:4px;
    color:var(--text); margin-bottom:6px;
  }
  .admin-hub-sub { font-size:0.7rem; color:var(--text3); letter-spacing:1px; margin-bottom:32px; }

  /* Admin login form (in hub) */
  .hub-auth-card {
    background:var(--surface2); border:1px solid var(--border2); border-radius:12px;
    padding:32px 28px; max-width:400px;
  }
  .hub-auth-title { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; letter-spacing:3px; color:var(--text); margin-bottom:4px; }
  .hub-auth-sub { font-size:0.72rem; color:var(--text3); margin-bottom:24px; }
  .hub-auth-field { margin-bottom:14px; }
  .hub-auth-label { font-size:0.65rem; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); margin-bottom:5px; display:block; }
  .hub-auth-input {
    width:100%; background:var(--surface3); border:1px solid var(--border2);
    border-radius:6px; padding:9px 12px; color:var(--text); font-size:0.82rem;
    font-family:'DM Sans',sans-serif; outline:none; transition:border 0.15s;
  }
  .hub-auth-input:focus { border-color:var(--gold); }
  .hub-auth-pw { position:relative; }
  .hub-auth-pw .hub-auth-input { padding-right:38px; }
  .hub-auth-eye {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    background:none; border:none; color:var(--text3); cursor:pointer; font-size:0.85rem;
    transition:color 0.15s; padding:2px;
  }
  .hub-auth-eye:hover { color:var(--text); }
  .hub-auth-error { font-size:0.72rem; color:var(--red); margin-bottom:12px; }
  .hub-auth-btn {
    width:100%; padding:11px; background:var(--gold); color:#111;
    border:none; border-radius:6px; font-size:0.8rem; font-weight:700;
    letter-spacing:1.5px; font-family:'Bebas Neue',sans-serif; cursor:pointer;
    transition:background 0.15s; margin-top:4px;
  }
  .hub-auth-btn:hover { background:var(--gold2); }

  /* Admin hub tabs */
  .admin-hub-tabs { display:flex; gap:4px; margin-bottom:28px; }
  .admin-hub-tab {
    padding:8px 18px; background:none; border:1px solid var(--border2);
    border-radius:6px; color:var(--text3); font-size:0.72rem; font-weight:600;
    letter-spacing:1px; cursor:pointer; transition:all 0.15s;
  }
  .admin-hub-tab.active { background:var(--gold); color:#111; border-color:transparent; }
  .admin-hub-tab:hover:not(.active) { border-color:var(--gold); color:var(--gold); }

  /* Admin signed-in header bar */
  .admin-hub-bar {
    display:flex; align-items:center; justify-content:space-between;
    background:var(--surface2); border:1px solid var(--border2); border-radius:8px;
    padding:10px 14px; margin-bottom:24px;
  }
  .admin-hub-bar-email { font-size:0.72rem; color:var(--text2); }
  .admin-hub-signout {
    background:none; border:1px solid var(--border2); color:var(--text3);
    border-radius:5px; padding:5px 12px; font-size:0.67rem; letter-spacing:1px;
    cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;
  }
  .admin-hub-signout:hover { border-color:var(--red); color:var(--red); }

  /* Pool management table */
  .pool-mgmt-table { width:100%; border-collapse:collapse; }
  .pool-mgmt-table th {
    text-align:left; font-size:0.6rem; letter-spacing:2px; text-transform:uppercase;
    color:var(--text3); padding:0 12px 10px; border-bottom:1px solid var(--border);
  }
  .pool-mgmt-table td {
    padding:12px 12px; border-bottom:1px solid var(--border); vertical-align:middle;
  }
  .pmt-sport-cell { display:flex; align-items:center; gap:8px; }
  .pmt-sport-icon { font-size:1.1rem; width:28px; height:28px; display:flex; align-items:center; justify-content:center;
    background:var(--surface3); border-radius:6px; }
  .pmt-sport-name { font-size:0.72rem; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:1px; }
  .pmt-pool-name { font-size:0.8rem; color:var(--text); font-weight:600; }
  .pmt-status-chip {
    display:inline-flex; align-items:center; gap:4px;
    font-size:0.58rem; letter-spacing:1.5px; text-transform:uppercase; font-weight:700;
    border-radius:20px; padding:3px 8px;
  }
  .pmt-status-chip.active { background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25); color:var(--green); }
  .pmt-status-chip.inactive { background:rgba(255,255,255,0.04); border:1px solid var(--border2); color:var(--text3); }

  /* Toggle switch */
  .toggle-switch { position:relative; display:inline-block; width:38px; height:22px; cursor:pointer; }
  .toggle-switch input { opacity:0; width:0; height:0; }
  .toggle-slider {
    position:absolute; inset:0; background:var(--surface3); border:1px solid var(--border2);
    border-radius:22px; transition:all 0.2s;
  }
  .toggle-slider::before {
    content:''; position:absolute; height:14px; width:14px; border-radius:50%;
    left:3px; bottom:3px; background:var(--text3); transition:all 0.2s;
  }
  .toggle-switch input:checked + .toggle-slider { background:rgba(34,197,94,0.2); border-color:var(--green); }
  .toggle-switch input:checked + .toggle-slider::before { transform:translateX(16px); background:var(--green); }

  /* Migration panel */
  .migrate-panel { background:var(--surface2); border:1px solid var(--border2); border-radius:10px; padding:24px; }
  .migrate-title { font-size:0.9rem; font-weight:700; color:var(--text); margin-bottom:6px; }
  .migrate-desc { font-size:0.75rem; color:var(--text2); line-height:1.6; margin-bottom:16px; }
  .migrate-btn {
    background:var(--surface3); border:1px solid var(--border2); color:var(--text);
    border-radius:6px; padding:9px 20px; font-size:0.75rem; font-weight:700;
    letter-spacing:1px; cursor:pointer; transition:all 0.15s; font-family:'DM Sans',sans-serif;
  }
  .migrate-btn:hover:not(:disabled) { border-color:var(--gold); color:var(--gold); }
  .migrate-btn:disabled { opacity:0.5; cursor:default; }
  .migrate-log {
    margin-top:16px; background:var(--bg); border:1px solid var(--border);
    border-radius:6px; padding:12px 14px; font-family:'JetBrains Mono',monospace;
    font-size:0.68rem; color:var(--text2); line-height:1.8;
    max-height:240px; overflow-y:auto;
  }
  .migrate-log::-webkit-scrollbar { width:3px; }
  .migrate-log::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }

  /* ── Responsive ────────────────────────────────────────────────────────── */
  @media (max-width:900px) {
    .shell-sidebar { width:56px; min-width:56px; }
    .sb-logo-text, .sb-sport-name, .sb-sport-chevron,
    .sb-pool-name, .sb-pool-dot, .sb-inactive-chip, .sb-admin-label { opacity:0; pointer-events:none; }
    .sb-sport-hdr { padding:0; justify-content:center; height:44px; }
    .sb-collapse-btn { display:none; }
    .sb-pool-item { display:none; }
    .sb-admin-item { padding:0; justify-content:center; height:44px; }
    .hub-home { padding:28px 20px 60px; }
    .admin-hub { padding:28px 20px 60px; }
  }
  @media (max-width:600px) {
    .hub-active-grid { grid-template-columns:1fr; }
    .hub-sports-grid { grid-template-columns:repeat(2, 1fr); }
  }
`;

// ─── Sidebar Component ────────────────────────────────────────────────────────

function Sidebar({ collapsed, onToggle, selectedPool, onSelectPool, adminAuthed, poolSettings }) {
  const [expandedSports, setExpandedSports] = useState(() =>
    Object.fromEntries(SPORTS.map(s => [s.id, true]))
  );

  function toggleSport(sportId) {
    setExpandedSports(prev => ({ ...prev, [sportId]: !prev[sportId] }));
  }

  function getEffectiveActive(pool) {
    return poolSettings[pool.id]?.active ?? pool.active;
  }

  function sportHasActive(sport) {
    return sport.pools.some(p => getEffectiveActive(p));
  }

  return (
    <div className={`shell-sidebar${collapsed ? " sb-collapsed" : ""}`}>
      {/* Header */}
      <div className="sb-header">
        <div className="sb-logo" onClick={() => onSelectPool(null)} title="Pool Hub Home">
          <span className="sb-logo-icon">🏆</span>
          <span className="sb-logo-text">POOL HUB</span>
        </div>
        <button className="sb-collapse-btn" onClick={onToggle} title={collapsed ? "Expand" : "Collapse"}>
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Sport sections */}
      <div className="sb-scroll">
        {SPORTS.map(sport => {
          const isExpanded = expandedSports[sport.id];
          const hasActive = sportHasActive(sport);
          return (
            <div key={sport.id} className="sb-sport">
              <div
                className={`sb-sport-hdr${isExpanded && !collapsed ? " open" : ""}`}
                onClick={() => collapsed
                  ? onSelectPool(sport.pools.find(p => getEffectiveActive(p))?.id || sport.pools[0]?.id)
                  : toggleSport(sport.id)
                }
                title={collapsed ? sport.name : undefined}
              >
                <span className={`sb-sport-icon${hasActive ? " has-active" : ""}`}>{sport.icon}</span>
                <span className="sb-sport-name">{sport.name}</span>
                {!collapsed && <span className="sb-sport-chevron">▼</span>}
              </div>
              {/* Pool items — only show when expanded and not collapsed */}
              {(isExpanded || collapsed) && (
                <div className="sb-pool-list">
                  {sport.pools.map(pool => {
                    const isActive = getEffectiveActive(pool);
                    const isSelected = selectedPool === pool.id;
                    return (
                      <div
                        key={pool.id}
                        className={`sb-pool-item${isSelected ? " active" : ""}${!isActive ? " inactive" : ""}`}
                        onClick={() => onSelectPool(pool.id)}
                        title={collapsed ? `${sport.name}: ${pool.name}` : undefined}
                      >
                        {isActive && <span className="sb-pool-dot" />}
                        <span className="sb-pool-name">{pool.name}</span>
                        {!isActive && <span className="sb-inactive-chip">Not Active</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="sb-divider" />

        {/* Admin Hub */}
        <div
          className={`sb-admin-item${selectedPool === "__admin__" ? " active" : ""}`}
          onClick={() => onSelectPool("__admin__")}
          title={collapsed ? "Admin Hub" : undefined}
        >
          <span className="sb-admin-icon">⚙</span>
          <span className="sb-admin-label">{adminAuthed ? "Admin Hub" : "Admin"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pool Hub Home ────────────────────────────────────────────────────────────

function PoolHubHome({ onSelectPool, poolSettings }) {
  function getEffectiveActive(pool) {
    return poolSettings[pool.id]?.active ?? pool.active;
  }

  const activePools = SPORTS.flatMap(sport =>
    sport.pools
      .filter(pool => getEffectiveActive(pool))
      .map(pool => ({ pool, sport }))
  );

  return (
    <div className="hub-home">
      {/* Hero */}
      <div className="hub-hero">
        <div className="hub-hero-title">SPORTS <span>POOL</span> HUB</div>
        <div className="hub-hero-sub">Your pools. All in one place.</div>
      </div>

      {/* Active Pools */}
      {activePools.length > 0 && (
        <div style={{ marginBottom: 44 }}>
          <div className="hub-section-label">Active Pools</div>
          <div className="hub-active-grid">
            {activePools.map(({ pool, sport }) => (
              <div
                key={pool.id}
                className="hub-active-card"
                onClick={() => onSelectPool(pool.id)}
              >
                <div className="hub-ac-icon">{sport.icon}</div>
                <div className="hub-ac-sport">{sport.name}</div>
                <div className="hub-ac-name">{pool.name}</div>
                <span className="hub-ac-badge">
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Sports */}
      <div>
        <div className="hub-section-label">All Sports</div>
        <div className="hub-sports-grid">
          {SPORTS.map(sport => {
            const hasActive = sport.pools.some(p => getEffectiveActive(p));
            const poolCount = sport.pools.length;
            return (
              <div
                key={sport.id}
                className={`hub-sport-card${hasActive ? " has-active" : ""}`}
                onClick={() => {
                  const target = sport.pools.find(p => getEffectiveActive(p)) || sport.pools[0];
                  if (target) onSelectPool(target.id);
                }}
              >
                <div className="hub-sc-icon">{sport.icon}</div>
                <div className="hub-sc-name">{sport.name}</div>
                <div className="hub-sc-pools">
                  {hasActive && <span className="hub-sc-active-dot" />}
                  {poolCount} pool{poolCount !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Inactive Pool View ───────────────────────────────────────────────────────

function InactivePoolView({ pool, sport, adminAuthed, onEnablePool }) {
  return (
    <div className="inactive-pool-view">
      <div className="ipv-icon">{sport.icon}</div>
      <div className="ipv-sport">{sport.name}</div>
      <div className="ipv-name">{pool.name}</div>
      <div className="ipv-badge">⏸ Not Active</div>
      <p className="ipv-desc">
        This pool is not yet active for the current season.
        {adminAuthed
          ? " You can enable it below to make it available to participants."
          : " Check back when the season begins or contact the pool admin."}
      </p>
      {adminAuthed && (
        <button className="ipv-enable-btn" onClick={onEnablePool}>
          Enable This Pool
        </button>
      )}
    </div>
  );
}

// ─── Global Admin Hub ─────────────────────────────────────────────────────────

function GlobalAdminHub({
  adminAuthed,
  adminEmail, setAdminEmail,
  adminPass, setAdminPass,
  adminLoginError,
  showAdminPass, setShowAdminPass,
  onAdminLogin, onAdminLogout,
  poolSettings,
  onTogglePoolActive,
  migrateLog, migrating, onRunMigration,
}) {
  const [adminTab, setAdminTab] = useState("pools");

  if (!adminAuthed) {
    return (
      <div className="admin-hub">
        <div className="admin-hub-title">ADMIN HUB</div>
        <div className="admin-hub-sub">Sign in to manage pools and settings</div>
        <div className="hub-auth-card">
          <div className="hub-auth-title">Sign In</div>
          <div className="hub-auth-sub">Admin access required</div>
          <div className="hub-auth-field">
            <label className="hub-auth-label">Email</label>
            <input
              className="hub-auth-input"
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onAdminLogin()}
              placeholder="admin@example.com"
              autoFocus
            />
          </div>
          <div className="hub-auth-field">
            <label className="hub-auth-label">Password</label>
            <div className="hub-auth-pw">
              <input
                className="hub-auth-input"
                type={showAdminPass ? "text" : "password"}
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onAdminLogin()}
                placeholder="••••••••"
              />
              <button className="hub-auth-eye" type="button" onClick={() => setShowAdminPass(s => !s)}>
                {showAdminPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          {adminLoginError && <div className="hub-auth-error">{adminLoginError}</div>}
          <button className="hub-auth-btn" onClick={onAdminLogin}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-hub">
      <div className="admin-hub-title">ADMIN HUB</div>
      <div className="admin-hub-sub">Manage pools, settings, and data migration</div>

      {/* Signed-in bar */}
      <div className="admin-hub-bar">
        <span className="admin-hub-bar-email">✓ Signed in as admin</span>
        <button className="admin-hub-signout" onClick={onAdminLogout}>Sign Out</button>
      </div>

      {/* Tab nav */}
      <div className="admin-hub-tabs">
        <button className={`admin-hub-tab${adminTab === "pools" ? " active" : ""}`} onClick={() => setAdminTab("pools")}>
          Pool Management
        </button>
        <button className={`admin-hub-tab${adminTab === "migrate" ? " active" : ""}`} onClick={() => setAdminTab("migrate")}>
          Data Migration
        </button>
      </div>

      {/* Pool Management tab */}
      {adminTab === "pools" && (
        <table className="pool-mgmt-table">
          <thead>
            <tr>
              <th>Sport</th>
              <th>Pool</th>
              <th>Status</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {SPORTS.flatMap(sport =>
              sport.pools.map(pool => {
                const isActive = poolSettings[pool.id]?.active ?? pool.active;
                return (
                  <tr key={pool.id}>
                    <td>
                      <div className="pmt-sport-cell">
                        <div className="pmt-sport-icon">{sport.icon}</div>
                        <span className="pmt-sport-name">{sport.name}</span>
                      </div>
                    </td>
                    <td><span className="pmt-pool-name">{pool.name}</span></td>
                    <td>
                      <span className={`pmt-status-chip ${isActive ? "active" : "inactive"}`}>
                        {isActive ? "● Active" : "○ Inactive"}
                      </span>
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={e => onTogglePoolActive(pool.id, e.target.checked)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      {/* Data Migration tab */}
      {adminTab === "migrate" && (
        <div className="migrate-panel">
          <div className="migrate-title">Migrate NBA 2026 Data</div>
          <div className="migrate-desc">
            Copies data from the legacy flat Firebase paths (<code>/participants/</code>, <code>/results/</code>,{" "}
            <code>/settings/</code>) to the new multi-pool structure (<code>/pools/nba-2026/...</code>).
            Old data is <strong>not deleted</strong> — remove it manually from the Firebase console after verifying.
          </div>
          <button
            className="migrate-btn"
            disabled={migrating}
            onClick={onRunMigration}
          >
            {migrating ? "⏳ Running Migration..." : "▶ Run NBA Data Migration"}
          </button>
          {migrateLog.length > 0 && (
            <div className="migrate-log">
              {migrateLog.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main App Shell ───────────────────────────────────────────────────────────

export default function App() {
  const [selectedPool, setSelectedPool]         = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminAuthed, setAdminAuthed]           = useState(false);
  const [adminEmail, setAdminEmail]             = useState("");
  const [adminPass, setAdminPass]               = useState("");
  const [adminLoginError, setAdminLoginError]   = useState("");
  const [showAdminPass, setShowAdminPass]       = useState(false);
  const [poolSettings, setPoolSettings]         = useState({});
  const [migrateLog, setMigrateLog]             = useState([]);
  const [migrating, setMigrating]               = useState(false);

  // ── Firebase listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsubAuth = auth
      ? onAuthStateChanged(auth, user => setAdminAuthed(!!user))
      : () => {};
    const unsubSettings = db
      ? onValue(ref(db, "admin/poolSettings"), snap => setPoolSettings(snap.val() || {}))
      : () => {};
    return () => { unsubAuth(); unsubSettings(); };
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleAdminLogin() {
    setAdminLoginError("");
    if (!adminEmail.trim() || !adminPass.trim()) {
      setAdminLoginError("Please enter your email and password.");
      return;
    }
    if (!auth) {
      setAdminLoginError("Firebase not configured — check environment variables.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPass.trim());
      setAdminEmail("");
      setAdminPass("");
    } catch (e) {
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" || e.code === "auth/user-not-found") {
        setAdminLoginError("Incorrect email or password.");
      } else if (e.code === "auth/unauthorized-domain") {
        setAdminLoginError("Domain not authorized — add it in Firebase Console → Authentication → Authorized Domains.");
      } else {
        setAdminLoginError(`Login failed: ${e.code || e.message}`);
      }
      setAdminPass("");
    }
  }

  async function handleAdminLogout() {
    try { if (auth) await signOut(auth); } catch (e) { console.error(e); }
  }

  async function handleTogglePoolActive(poolId, value) {
    if (!db) return;
    await set(ref(db, `admin/poolSettings/${poolId}/active`), value);
  }

  async function handleRunMigration() {
    setMigrateLog([]);
    setMigrating(true);
    const result = await migrateNBAData(msg => {
      setMigrateLog(prev => [...prev, msg]);
    });
    if (!result.success) {
      setMigrateLog(prev => [...prev, `❌ ${result.message}`]);
    }
    setMigrating(false);
  }

  function getEffectiveActive(pool) {
    return poolSettings[pool.id]?.active ?? pool.active;
  }

  // ── Pool router ─────────────────────────────────────────────────────────────
  function renderMainContent() {
    // Hub home
    if (!selectedPool) {
      return (
        <PoolHubHome
          onSelectPool={setSelectedPool}
          poolSettings={poolSettings}
        />
      );
    }

    // Global admin hub
    if (selectedPool === "__admin__") {
      return (
        <GlobalAdminHub
          adminAuthed={adminAuthed}
          adminEmail={adminEmail}
          setAdminEmail={setAdminEmail}
          adminPass={adminPass}
          setAdminPass={setAdminPass}
          adminLoginError={adminLoginError}
          showAdminPass={showAdminPass}
          setShowAdminPass={setShowAdminPass}
          onAdminLogin={handleAdminLogin}
          onAdminLogout={handleAdminLogout}
          poolSettings={poolSettings}
          onTogglePoolActive={handleTogglePoolActive}
          migrateLog={migrateLog}
          migrating={migrating}
          onRunMigration={handleRunMigration}
        />
      );
    }

    // Pool lookup
    const entry = POOL_MAP[selectedPool];
    if (!entry) return null;
    const { pool, sport } = entry;
    const isActive = getEffectiveActive(pool);

    // NBA 2026 pool
    if (pool.component === "NBAPlayoffPool" && (isActive || adminAuthed)) {
      return (
        <NBAPlayoffPool
          dbPath={pool.dbPath}
          poolId={pool.id}
          adminAuthed={adminAuthed}
          onAdminLogin={handleAdminLogin}
        />
      );
    }

    // Inactive or unbuilt pool
    return (
      <InactivePoolView
        pool={pool}
        sport={sport}
        adminAuthed={adminAuthed}
        onEnablePool={() => handleTogglePoolActive(pool.id, true)}
      />
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{shellCss}</style>
      <div className="shell">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
          selectedPool={selectedPool}
          onSelectPool={setSelectedPool}
          adminAuthed={adminAuthed}
          poolSettings={poolSettings}
        />
        <main className="shell-main">
          {renderMainContent()}
        </main>
      </div>
    </>
  );
}
