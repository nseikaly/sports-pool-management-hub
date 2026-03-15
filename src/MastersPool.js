// ─── Masters 2026 Pool ─────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { ref, onValue, set, push, remove } from "firebase/database";
import { db } from "./firebase";
import { MASTERS_CONFIG, buildDefaultPlayerMap, getFinishBonus } from "./mastersConfig";
import { buildMastersLeaderboard, scoreEntry, calcGolferTotal } from "./mastersScoring";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
  :root {
    --mg:      #1a6b3a;
    --mg2:     #22854a;
    --mg-dim:  rgba(26,107,58,0.12);
    --mg-dim2: rgba(26,107,58,0.22);
    --mg-glow: rgba(26,107,58,0.35);
  }

  /* ── Wrap ───────────────────────────────────────────────────────────────── */
  .mp { min-height:100vh; background:var(--bg); color:var(--text); font-family:'DM Sans',sans-serif; }

  /* ── Header ─────────────────────────────────────────────────────────────── */
  .mp-header {
    background: linear-gradient(135deg, #0a1a10 0%, #0e1a14 60%, var(--surface) 100%);
    border-bottom: 1px solid var(--border);
    padding: 28px 32px 0;
    position: relative; overflow: hidden;
  }
  .mp-header::before {
    content:''; position:absolute; inset:0;
    background: radial-gradient(ellipse at 20% 50%, rgba(26,107,58,0.18) 0%, transparent 60%);
    pointer-events:none;
  }
  .mp-header-top { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; flex-wrap:wrap; margin-bottom:20px; }
  .mp-event-info {}
  .mp-event-eyebrow { font-size:0.62rem; letter-spacing:3px; text-transform:uppercase; color:var(--mg2); margin-bottom:6px; display:flex; align-items:center; gap:6px; }
  .mp-event-title { font-family:'Bebas Neue',sans-serif; font-size:2.8rem; letter-spacing:4px; color:var(--text); line-height:1; margin-bottom:6px; }
  .mp-event-title span { color:var(--gold); }
  .mp-event-meta { font-size:0.72rem; color:var(--text3); letter-spacing:0.5px; }
  .mp-event-meta span { color:var(--text2); }

  /* Countdown */
  .mp-countdown { display:flex; gap:10px; align-items:flex-start; flex-shrink:0; }
  .mp-cd-block { text-align:center; background:var(--surface2); border:1px solid var(--border2); border-radius:8px; padding:8px 12px; min-width:54px; }
  .mp-cd-num { font-family:'JetBrains Mono',monospace; font-size:1.4rem; font-weight:800; color:var(--gold2); line-height:1; }
  .mp-cd-label { font-size:0.52rem; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); margin-top:3px; }
  .mp-cd-sep { font-family:'JetBrains Mono',monospace; font-size:1.2rem; color:var(--text3); padding-top:12px; }
  .mp-deadline-passed { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:8px 14px; color:var(--red); font-size:0.72rem; font-weight:700; letter-spacing:1px; text-transform:uppercase; }
  .mp-locked-banner { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-top:none; padding:8px 32px; font-size:0.7rem; color:var(--red); letter-spacing:1px; display:flex; align-items:center; gap:8px; }

  /* ── Tab Nav ────────────────────────────────────────────────────────────── */
  .mp-tabs { display:flex; gap:0; padding:0 32px; position:relative; z-index:1; }
  .mp-tab {
    padding:12px 22px; font-size:0.72rem; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
    background:none; border:none; border-bottom:2px solid transparent;
    color:var(--text3); cursor:pointer; transition:all 0.15s; white-space:nowrap;
  }
  .mp-tab:hover { color:var(--text2); }
  .mp-tab.active { color:var(--gold); border-bottom-color:var(--gold); }
  .mp-tab-count { display:inline-flex; align-items:center; justify-content:center; background:var(--surface3); border-radius:10px; min-width:18px; height:18px; font-size:0.58rem; padding:0 5px; margin-left:6px; color:var(--text3); }
  .mp-tab.active .mp-tab-count { background:rgba(201,168,76,0.15); color:var(--gold); }

  /* ── Body ───────────────────────────────────────────────────────────────── */
  .mp-body { padding:24px 32px 80px; }

  /* ── Picks Tab ──────────────────────────────────────────────────────────── */
  .mp-picks-layout { display:grid; grid-template-columns:310px 1fr; gap:20px; align-items:start; }

  /* Left panel — Your Team */
  .mp-team-panel {
    position:sticky; top:16px;
    background:var(--surface); border:1px solid var(--border2); border-radius:12px;
    overflow:hidden;
  }
  .mp-team-hdr {
    padding:14px 16px; border-bottom:1px solid var(--border);
    background:linear-gradient(135deg, rgba(26,107,58,0.12) 0%, transparent 100%);
  }
  .mp-team-hdr-title { font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:2px; color:var(--text); margin-bottom:2px; }
  .mp-team-hdr-sub { font-size:0.65rem; color:var(--text3); }

  /* Cap bar */
  .mp-cap-section { padding:14px 16px; border-bottom:1px solid var(--border); }
  .mp-cap-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
  .mp-cap-label { font-size:0.62rem; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); }
  .mp-cap-value { font-family:'JetBrains Mono',monospace; font-size:0.9rem; font-weight:800; }
  .mp-cap-value.ok  { color:var(--green); }
  .mp-cap-value.warn { color:var(--amber); }
  .mp-cap-value.over { color:var(--red); }
  .mp-cap-bar-track { height:6px; background:var(--surface3); border-radius:3px; overflow:hidden; }
  .mp-cap-bar-fill { height:100%; border-radius:3px; transition:width 0.3s ease, background 0.3s ease; }
  .mp-picks-count { font-size:0.65rem; color:var(--text3); margin-top:6px; display:flex; justify-content:space-between; }

  /* Pick slots */
  .mp-slots { padding:12px 16px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; gap:6px; }
  .mp-slot {
    display:flex; align-items:center; gap:8px;
    background:var(--surface2); border:1px solid var(--border); border-radius:8px;
    padding:8px 10px; min-height:42px; transition:all 0.15s;
  }
  .mp-slot.filled { border-color:var(--mg); background:rgba(26,107,58,0.07); }
  .mp-slot-num { font-size:0.6rem; font-weight:700; color:var(--text3); width:14px; flex-shrink:0; text-align:center; }
  .mp-slot-icon { font-size:0.75rem; color:var(--text3); flex-shrink:0; }
  .mp-slot-name { flex:1; font-size:0.78rem; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mp-slot-salary { font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:var(--gold); flex-shrink:0; }
  .mp-slot-remove { background:none; border:none; color:var(--text3); cursor:pointer; font-size:0.8rem; padding:2px 4px; border-radius:4px; transition:color 0.12s; flex-shrink:0; }
  .mp-slot-remove:hover { color:var(--red); }
  .mp-slot-empty .mp-slot-name { color:var(--text3); font-style:italic; font-weight:400; }

  /* Entry form */
  .mp-entry-form { padding:14px 16px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; gap:10px; }
  .mp-field label { display:block; font-size:0.6rem; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); margin-bottom:4px; }
  .mp-field input {
    width:100%; background:var(--surface2); border:1px solid var(--border2); border-radius:6px;
    padding:8px 10px; color:var(--text); font-size:0.82rem; font-family:'DM Sans',sans-serif;
    outline:none; transition:border 0.15s;
  }
  .mp-field input:focus { border-color:var(--mg2); }
  .mp-field input::placeholder { color:var(--text3); }

  /* Submit area */
  .mp-submit-area { padding:14px 16px; }
  .mp-submit-btn {
    width:100%; padding:13px; background:var(--mg); color:#fff;
    border:none; border-radius:8px; font-size:0.8rem; font-weight:700;
    letter-spacing:2px; font-family:'Bebas Neue',sans-serif; cursor:pointer;
    transition:all 0.15s; position:relative; overflow:hidden;
  }
  .mp-submit-btn:hover:not(:disabled) { background:var(--mg2); box-shadow:0 4px 16px var(--mg-glow); transform:translateY(-1px); }
  .mp-submit-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }
  .mp-submit-error { font-size:0.7rem; color:var(--red); margin-top:8px; line-height:1.4; }
  .mp-submit-success {
    background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.25);
    border-radius:8px; padding:12px; text-align:center;
  }
  .mp-submit-success-icon { font-size:1.8rem; margin-bottom:4px; }
  .mp-submit-success-title { font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:2px; color:var(--green); margin-bottom:4px; }
  .mp-submit-success-sub { font-size:0.72rem; color:var(--text2); }
  .mp-submit-another { margin-top:10px; background:none; border:1px solid var(--border2); color:var(--text3); border-radius:6px; padding:7px 14px; font-size:0.67rem; cursor:pointer; transition:all 0.15s; }
  .mp-submit-another:hover { border-color:var(--gold); color:var(--gold); }

  /* ── Player Grid (right panel) ───────────────────────────────────────────── */
  .mp-player-panel { min-width:0; }
  .mp-player-controls {
    display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; align-items:center;
    position:sticky; top:16px; z-index:5; background:var(--bg); padding:0 0 10px;
    border-bottom:1px solid var(--border);
  }
  .mp-search-wrap { position:relative; flex:1; min-width:160px; }
  .mp-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:0.8rem; color:var(--text3); pointer-events:none; }
  .mp-search {
    width:100%; background:var(--surface2); border:1px solid var(--border2); border-radius:8px;
    padding:9px 12px 9px 32px; color:var(--text); font-size:0.82rem; font-family:'DM Sans',sans-serif;
    outline:none; transition:border 0.15s;
  }
  .mp-search:focus { border-color:var(--mg2); }
  .mp-search::placeholder { color:var(--text3); }
  .mp-sort-btns { display:flex; gap:4px; }
  .mp-sort-btn {
    background:var(--surface2); border:1px solid var(--border2); border-radius:6px;
    padding:7px 12px; font-size:0.65rem; letter-spacing:1px; text-transform:uppercase;
    color:var(--text3); cursor:pointer; transition:all 0.15s; white-space:nowrap;
  }
  .mp-sort-btn:hover { border-color:var(--border2); color:var(--text2); background:var(--surface3); }
  .mp-sort-btn.active { background:var(--surface3); border-color:var(--gold); color:var(--gold); }

  /* Filter chips */
  .mp-filter-chips { display:flex; gap:6px; flex-wrap:wrap; padding-bottom:6px; }
  .mp-filter-chip {
    background:var(--surface2); border:1px solid var(--border2); border-radius:20px;
    padding:4px 12px; font-size:0.65rem; letter-spacing:0.5px; color:var(--text3);
    cursor:pointer; transition:all 0.15s;
  }
  .mp-filter-chip:hover { border-color:var(--border2); color:var(--text2); }
  .mp-filter-chip.active { background:var(--mg-dim); border-color:var(--mg2); color:#5db877; }

  /* Player list */
  .mp-player-list { display:flex; flex-direction:column; gap:4px; }
  .mp-player-row {
    display:flex; align-items:center; gap:10px;
    background:var(--surface); border:1px solid var(--border); border-radius:8px;
    padding:9px 12px; cursor:pointer; transition:all 0.15s; user-select:none;
  }
  .mp-player-row:hover:not(.mp-player-row--disabled) { background:var(--surface2); border-color:var(--border2); }
  .mp-player-row.mp-player-row--selected { background:var(--mg-dim2); border-color:var(--mg2); }
  .mp-player-row.mp-player-row--selected:hover { background:var(--mg-dim2); filter:brightness(1.05); }
  .mp-player-row.mp-player-row--disabled { opacity:0.35; cursor:default; pointer-events:none; }
  .mp-player-row.mp-player-row--over-cap { opacity:0.45; cursor:not-allowed; }
  .mp-player-row.mp-player-row--over-cap:hover { background:var(--surface); border-color:var(--border); }

  .mp-pr-rank { font-family:'JetBrains Mono',monospace; font-size:0.65rem; color:var(--text3); width:22px; text-align:center; flex-shrink:0; }
  .mp-pr-salary { font-family:'JetBrains Mono',monospace; font-size:0.92rem; font-weight:800; color:var(--gold); width:36px; flex-shrink:0; text-align:right; }
  .mp-pr-name { flex:1; font-size:0.82rem; font-weight:600; color:var(--text); min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mp-pr-wr { font-size:0.62rem; color:var(--text3); flex-shrink:0; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:2px 6px; }
  .mp-pr-over-cap-badge { font-size:0.58rem; color:var(--amber); background:rgba(232,148,58,0.1); border:1px solid rgba(232,148,58,0.25); border-radius:4px; padding:2px 6px; flex-shrink:0; }
  .mp-pr-select {
    width:26px; height:26px; flex-shrink:0; border-radius:50%;
    border:1.5px solid var(--border2); background:var(--surface2);
    display:flex; align-items:center; justify-content:center; font-size:0.7rem;
    transition:all 0.15s; color:transparent;
  }
  .mp-player-row:hover:not(.mp-player-row--disabled):not(.mp-player-row--over-cap) .mp-pr-select { border-color:var(--mg2); color:var(--mg2); }
  .mp-player-row.mp-player-row--selected .mp-pr-select { background:var(--mg); border-color:var(--mg); color:#fff; }

  .mp-no-results { text-align:center; padding:40px; color:var(--text3); font-size:0.82rem; }

  /* ── Leaderboard Tab ────────────────────────────────────────────────────── */
  .mp-lb-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
  .mp-lb-title { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; letter-spacing:3px; color:var(--text); }
  .mp-lb-meta { font-size:0.7rem; color:var(--text3); }
  .mp-lb-empty { text-align:center; padding:80px 24px; }
  .mp-lb-empty-icon { font-size:3rem; margin-bottom:12px; }
  .mp-lb-empty-title { font-family:'Bebas Neue',sans-serif; font-size:1.4rem; letter-spacing:2px; color:var(--text); margin-bottom:8px; }
  .mp-lb-empty-sub { font-size:0.8rem; color:var(--text3); }

  /* Entry cards */
  .mp-entry-card {
    background:var(--surface); border:1px solid var(--border); border-radius:12px;
    margin-bottom:8px; overflow:hidden; transition:all 0.15s;
  }
  .mp-entry-card:hover { border-color:var(--border2); }
  .mp-entry-card.top-3 { border-color:rgba(201,168,76,0.35); }
  .mp-entry-card.rank-1 { background:linear-gradient(135deg, rgba(201,168,76,0.07) 0%, var(--surface) 100%); border-color:var(--gold); }

  .mp-ec-main {
    display:flex; align-items:center; gap:14px; padding:14px 16px;
    cursor:pointer; user-select:none;
  }
  .mp-ec-rank {
    font-family:'JetBrains Mono',monospace; font-size:1.1rem; font-weight:800;
    width:34px; text-align:center; flex-shrink:0;
  }
  .mp-ec-rank.r1 { color:var(--gold); }
  .mp-ec-rank.r2 { color:var(--text2); }
  .mp-ec-rank.r3 { color:var(--amber); }
  .mp-ec-rank.other { color:var(--text3); }
  .mp-ec-medal { font-size:1rem; margin-right:-6px; flex-shrink:0; }

  .mp-ec-info { flex:1; min-width:0; }
  .mp-ec-name { font-size:0.9rem; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .mp-ec-salary-used { font-size:0.65rem; color:var(--text3); margin-top:2px; }

  .mp-ec-pts {
    font-family:'JetBrains Mono',monospace; font-size:1.5rem; font-weight:800;
    color:var(--text); flex-shrink:0; text-align:right; min-width:70px;
  }
  .mp-ec-pts-label { font-size:0.55rem; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); text-align:right; }
  .mp-ec-chevron { color:var(--text3); font-size:0.7rem; flex-shrink:0; transition:transform 0.2s; }
  .mp-ec-chevron.open { transform:rotate(180deg); }

  /* Expanded picks */
  .mp-ec-picks { border-top:1px solid var(--border); padding:12px 16px; display:flex; flex-direction:column; gap:5px; background:var(--surface2); }
  .mp-ec-pick-row { display:flex; align-items:center; gap:8px; font-size:0.78rem; }
  .mp-ec-pick-player { flex:1; font-weight:600; color:var(--text); }
  .mp-ec-pick-status { font-size:0.6rem; letter-spacing:1px; text-transform:uppercase; padding:2px 6px; border-radius:3px; flex-shrink:0; }
  .mp-ec-pick-status.active { background:rgba(45,212,191,0.1); color:var(--cyan); border:1px solid rgba(45,212,191,0.2); }
  .mp-ec-pick-status.finished { background:rgba(34,197,94,0.08); color:var(--green); border:1px solid rgba(34,197,94,0.2); }
  .mp-ec-pick-status.cut { background:rgba(239,68,68,0.08); color:var(--red); border:1px solid rgba(239,68,68,0.2); }
  .mp-ec-pick-status.wd { background:rgba(255,255,255,0.04); color:var(--text3); border:1px solid var(--border2); }
  .mp-ec-pick-pos { font-size:0.68rem; color:var(--text3); flex-shrink:0; min-width:30px; text-align:right; }
  .mp-ec-pick-pts {
    font-family:'JetBrains Mono',monospace; font-size:0.8rem; font-weight:700;
    min-width:46px; text-align:right; flex-shrink:0;
  }
  .mp-ec-pick-pts.positive { color:var(--green); }
  .mp-ec-pick-pts.negative { color:var(--red); }
  .mp-ec-pick-pts.zero { color:var(--text3); }
  .mp-ec-pick-pts.pending { color:var(--text3); font-style:italic; }

  /* ── Scoring Rules Card ─────────────────────────────────────────────────── */
  .mp-rules-card { background:var(--surface); border:1px solid var(--border2); border-radius:12px; padding:20px 24px; margin-bottom:24px; }
  .mp-rules-title { font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:2px; color:var(--text); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .mp-rules-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px; }
  .mp-rules-group-title { font-size:0.6rem; letter-spacing:2px; text-transform:uppercase; color:var(--text3); margin-bottom:8px; display:flex; align-items:center; gap:6px; }
  .mp-rules-group-title::after { content:''; flex:1; height:1px; background:var(--border); }
  .mp-rules-row { display:flex; justify-content:space-between; align-items:center; padding:3px 0; }
  .mp-rules-row-label { font-size:0.73rem; color:var(--text2); }
  .mp-rules-row-pts { font-family:'JetBrains Mono',monospace; font-size:0.73rem; font-weight:700; }
  .mp-rules-row-pts.pos { color:var(--green); }
  .mp-rules-row-pts.neg { color:var(--red); }
  .mp-rules-row-pts.neu { color:var(--text3); }

  /* ── Admin Tab ──────────────────────────────────────────────────────────── */
  .mp-admin-grid { display:grid; gap:20px; }
  .mp-admin-card { background:var(--surface); border:1px solid var(--border2); border-radius:12px; overflow:hidden; }
  .mp-admin-card-hdr { padding:14px 18px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .mp-admin-card-title { font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:2px; color:var(--text); }
  .mp-admin-card-body { padding:18px; }

  /* Lock toggle */
  .mp-lock-row { display:flex; align-items:center; gap:14px; }
  .mp-lock-status { flex:1; }
  .mp-lock-label { font-size:0.82rem; font-weight:600; color:var(--text); margin-bottom:2px; }
  .mp-lock-sub { font-size:0.7rem; color:var(--text3); }

  /* Results table */
  .mp-results-table { width:100%; border-collapse:collapse; }
  .mp-results-table th {
    text-align:left; font-size:0.58rem; letter-spacing:2px; text-transform:uppercase;
    color:var(--text3); padding:0 8px 10px; border-bottom:1px solid var(--border); white-space:nowrap;
  }
  .mp-results-table th.right { text-align:right; }
  .mp-results-table td { padding:7px 8px; border-bottom:1px solid rgba(255,255,255,0.03); vertical-align:middle; }
  .mp-rt-name { font-size:0.78rem; font-weight:600; color:var(--text); }
  .mp-rt-salary { font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:var(--gold); }
  .mp-rt-picked { font-size:0.6rem; color:var(--text3); background:var(--surface2); border-radius:4px; padding:2px 6px; white-space:nowrap; }
  .mp-rt-input {
    background:var(--surface2); border:1px solid var(--border2); border-radius:5px;
    padding:5px 7px; color:var(--text); font-size:0.78rem; font-family:'DM Sans',sans-serif;
    outline:none; transition:border 0.12s; width:100%;
  }
  .mp-rt-input:focus { border-color:var(--mg2); }
  .mp-rt-input.pos { color:var(--green); }
  .mp-rt-input.neg { color:var(--red); }
  .mp-rt-select {
    background:var(--surface2); border:1px solid var(--border2); border-radius:5px;
    padding:5px 7px; color:var(--text); font-size:0.75rem; font-family:'DM Sans',sans-serif;
    outline:none; cursor:pointer;
  }
  .mp-rt-total { font-family:'JetBrains Mono',monospace; font-size:0.82rem; font-weight:800; text-align:right; }
  .mp-rt-total.pos { color:var(--green); }
  .mp-rt-total.zero { color:var(--text3); }
  .mp-rt-save-btn {
    background:var(--mg); border:none; color:#fff; border-radius:5px;
    padding:5px 12px; font-size:0.65rem; font-weight:700; cursor:pointer;
    transition:background 0.12s; white-space:nowrap; letter-spacing:0.5px;
  }
  .mp-rt-save-btn:hover { background:var(--mg2); }
  .mp-rt-save-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .mp-rt-saved { font-size:0.65rem; color:var(--green); animation:fadeOut 2s forwards; }
  @keyframes fadeOut { 0%{opacity:1} 70%{opacity:1} 100%{opacity:0} }

  /* Field Manager */
  .mp-field-row { display:flex; gap:8px; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.03); }
  .mp-field-row:last-child { border-bottom:none; }
  .mp-field-name { flex:1; }
  .mp-field-sal { width:70px; }
  .mp-field-wr { width:60px; }
  .mp-field-del { background:none; border:1px solid var(--border2); color:var(--text3); border-radius:5px; padding:5px 9px; font-size:0.65rem; cursor:pointer; transition:all 0.12s; white-space:nowrap; }
  .mp-field-del:hover { border-color:var(--red); color:var(--red); }
  .mp-add-row { display:flex; gap:8px; align-items:flex-end; margin-top:14px; padding-top:14px; border-top:1px solid var(--border); flex-wrap:wrap; }
  .mp-add-row .mp-field-name { min-width:140px; }
  .mp-add-btn { background:var(--mg); border:none; color:#fff; border-radius:6px; padding:8px 16px; font-size:0.72rem; font-weight:700; cursor:pointer; transition:background 0.12s; white-space:nowrap; }
  .mp-add-btn:hover { background:var(--mg2); }

  /* Participants list */
  .mp-part-table { width:100%; border-collapse:collapse; }
  .mp-part-table th { text-align:left; font-size:0.58rem; letter-spacing:2px; text-transform:uppercase; color:var(--text3); padding:0 10px 10px; border-bottom:1px solid var(--border); }
  .mp-part-table td { padding:9px 10px; border-bottom:1px solid rgba(255,255,255,0.03); font-size:0.78rem; vertical-align:middle; }
  .mp-part-name { font-weight:600; color:var(--text); }
  .mp-part-email { color:var(--text3); font-size:0.72rem; }
  .mp-part-picks { display:flex; flex-wrap:wrap; gap:4px; }
  .mp-part-pick-chip { background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:2px 7px; font-size:0.65rem; color:var(--text2); }
  .mp-part-del { background:none; border:none; color:var(--text3); cursor:pointer; font-size:0.85rem; transition:color 0.12s; padding:2px 5px; }
  .mp-part-del:hover { color:var(--red); }

  /* Shared utils */
  .mp-btn-secondary {
    background:none; border:1px solid var(--border2); color:var(--text3);
    border-radius:6px; padding:7px 14px; font-size:0.68rem; font-weight:600;
    cursor:pointer; transition:all 0.12s; letter-spacing:0.5px;
  }
  .mp-btn-secondary:hover { border-color:var(--gold); color:var(--gold); }
  .mp-section-label {
    font-size:0.6rem; font-weight:700; letter-spacing:2.5px; text-transform:uppercase;
    color:var(--text3); margin-bottom:14px; display:flex; align-items:center; gap:10px;
  }
  .mp-section-label::after { content:''; flex:1; height:1px; background:var(--border); }

  /* Responsive */
  @media (max-width:860px) {
    .mp-header { padding:20px 16px 0; }
    .mp-tabs { padding:0 16px; }
    .mp-body { padding:16px 16px 80px; }
    .mp-picks-layout { grid-template-columns:1fr; }
    .mp-team-panel { position:static; }
    .mp-countdown { display:none; }
    .mp-header-top { flex-direction:column; gap:12px; }
  }
  @media (max-width:600px) {
    .mp-event-title { font-size:2rem; }
    .mp-rules-grid { grid-template-columns:1fr; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeLeft(isoDeadline) {
  const diff = new Date(isoDeadline) - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function pad2(n) { return String(n).padStart(2, "0"); }

function fmtPts(pts) {
  if (pts == null) return "—";
  return pts % 1 === 0 ? String(pts) : pts.toFixed(1);
}

function posLabel(pos) {
  if (!pos) return "—";
  if (pos === 1) return "1st";
  if (pos === 2) return "2nd";
  if (pos === 3) return "3rd";
  return `${pos}th`;
}

function salaryColor(used, cap) {
  const pct = used / cap;
  if (pct >= 1) return "over";
  if (pct >= 0.9) return "warn";
  return "ok";
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function Countdown({ isoDeadline }) {
  const [tl, setTl] = useState(() => getTimeLeft(isoDeadline));
  useEffect(() => {
    const id = setInterval(() => setTl(getTimeLeft(isoDeadline)), 1000);
    return () => clearInterval(id);
  }, [isoDeadline]);

  if (!tl) return <div className="mp-deadline-passed">🔒 Picks Closed</div>;

  return (
    <div className="mp-countdown">
      <div className="mp-cd-block"><div className="mp-cd-num">{pad2(tl.d)}</div><div className="mp-cd-label">Days</div></div>
      <div className="mp-cd-sep">:</div>
      <div className="mp-cd-block"><div className="mp-cd-num">{pad2(tl.h)}</div><div className="mp-cd-label">Hrs</div></div>
      <div className="mp-cd-sep">:</div>
      <div className="mp-cd-block"><div className="mp-cd-num">{pad2(tl.m)}</div><div className="mp-cd-label">Min</div></div>
      <div className="mp-cd-sep">:</div>
      <div className="mp-cd-block"><div className="mp-cd-num">{pad2(tl.s)}</div><div className="mp-cd-label">Sec</div></div>
    </div>
  );
}

// ─── Scoring Rules Panel ──────────────────────────────────────────────────────

function ScoringRules() {
  const { scoring } = MASTERS_CONFIG;
  return (
    <div className="mp-rules-card">
      <div className="mp-rules-title">⛳ Scoring Rules</div>
      <div className="mp-rules-grid">
        <div>
          <div className="mp-rules-group-title">Per Hole</div>
          {[
            ["Double Eagle+", `+${scoring.doubleEagle}`, "pos"],
            ["Eagle",         `+${scoring.eagle}`,       "pos"],
            ["Birdie",        `+${scoring.birdie}`,       "pos"],
            ["Par",           `+${scoring.par}`,          "neu"],
            ["Bogey",         `${scoring.bogey}`,         "neg"],
            ["Dbl Bogey+",    `${scoring.doubleBogeyOrWorse}`, "neg"],
          ].map(([l, v, cls]) => (
            <div key={l} className="mp-rules-row">
              <span className="mp-rules-row-label">{l}</span>
              <span className={`mp-rules-row-pts ${cls}`}>{v} pts</span>
            </div>
          ))}
        </div>
        <div>
          <div className="mp-rules-group-title">Finish Bonus</div>
          {[
            ["1st Place", "+30"], ["2nd Place", "+20"], ["3rd Place", "+18"],
            ["4th Place", "+16"], ["5th Place", "+14"], ["6th Place", "+12"],
            ["7th Place", "+10"], ["8th–10th",  "+7–9"],["11th–20th", "+5–6"],
            ["21st–50th", "+1–4"],
          ].map(([l, v]) => (
            <div key={l} className="mp-rules-row">
              <span className="mp-rules-row-label">{l}</span>
              <span className="mp-rules-row-pts pos">{v} pts</span>
            </div>
          ))}
        </div>
        <div>
          <div className="mp-rules-group-title">Bonuses</div>
          {[
            ["Birdie streak ≥3 (max 1/round)", "+3"],
            ["Bogey-free round",               "+3"],
            ["All 4 rounds under 70",          "+5"],
            ["Hole in one",                    "+5"],
          ].map(([l, v]) => (
            <div key={l} className="mp-rules-row">
              <span className="mp-rules-row-label">{l}</span>
              <span className="mp-rules-row-pts pos">{v} pts</span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: "10px", background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.6rem", color: "var(--text3)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>Buy-In</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text)", fontWeight: 600 }}>${MASTERS_CONFIG.buyin} · Max {MASTERS_CONFIG.maxEntriesPerPerson} entries</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text3)", marginTop: 4 }}>
              Venmo {MASTERS_CONFIG.venmo}<br />Zelle {MASTERS_CONFIG.zelle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Picks Tab ────────────────────────────────────────────────────────────────

function PicksTab({ picksLocked, field, dbPath, participants }) {
  const CAP    = MASTERS_CONFIG.pool.salaryCap;
  const NPICKS = MASTERS_CONFIG.pool.picksPerEntry;

  const [picks,       setPicks]       = useState([]);   // array of player names
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [search,      setSearch]      = useState("");
  const [sort,        setSort]        = useState("salary"); // "salary"|"name"|"wr"
  const [salFilter,   setSalFilter]   = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted,   setSubmitted]   = useState(false);

  const totalSalary   = picks.reduce((s, p) => s + (field[p]?.salary ?? 0), 0);
  const remaining     = CAP - totalSalary;
  const capPct        = Math.min(totalSalary / CAP, 1);
  const capCls        = salaryColor(totalSalary, CAP);

  // Salary bracket filters
  const salBrackets = [
    { label: "All",       min: 0,   max: 999 },
    { label: "$120+",     min: 120, max: 999 },
    { label: "$90–119",   min: 90,  max: 119 },
    { label: "$70–89",    min: 70,  max: 89  },
    { label: "Under $70", min: 0,   max: 69  },
  ];

  function togglePick(playerName) {
    if (picks.includes(playerName)) {
      setPicks(p => p.filter(x => x !== playerName));
      return;
    }
    if (picks.length >= NPICKS) return;
    const sal = field[playerName]?.salary ?? 0;
    if (totalSalary + sal > CAP) return;
    setPicks(p => [...p, playerName]);
  }

  function removePick(playerName) {
    setPicks(p => p.filter(x => x !== playerName));
  }

  async function handleSubmit() {
    setSubmitError("");
    if (!name.trim())          return setSubmitError("Please enter your name.");
    if (!email.trim() || !email.includes("@")) return setSubmitError("Please enter a valid email.");
    if (picks.length < NPICKS) return setSubmitError(`Please select all ${NPICKS} golfers.`);
    if (totalSalary > CAP)     return setSubmitError(`Salary ($${totalSalary}) exceeds the $${CAP} cap.`);
    if (!db || !dbPath)        return setSubmitError("Database not connected.");

    setSubmitting(true);
    try {
      await push(ref(db, `${dbPath}/participants`), {
        name:        name.trim(),
        email:       email.trim().toLowerCase(),
        picks,
        totalSalary,
        timestamp:   Date.now(),
      });
      setSubmitted(true);
    } catch (e) {
      setSubmitError("Submission failed — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setPicks([]); setName(""); setEmail("");
    setSubmitted(false); setSubmitError("");
  }

  // Filter & sort player list
  const allPlayers = Object.entries(field).map(([name, d]) => ({ name, ...d }));
  const filtered = allPlayers
    .filter(p => {
      if (salFilter) { const b = salBrackets.find(x => x.label === salFilter); if (b && (p.salary < b.min || p.salary > b.max)) return false; }
      if (search.trim()) { if (!p.name.toLowerCase().includes(search.toLowerCase())) return false; }
      return true;
    })
    .sort((a, b) => {
      if (sort === "name")   return a.name.localeCompare(b.name);
      if (sort === "wr")     return (a.wr ?? 9999) - (b.wr ?? 9999);
      return b.salary - a.salary; // default: salary desc
    });

  if (picksLocked) {
    return (
      <div>
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "20px 24px", marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>🔒</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.1rem", letterSpacing: "2px", color: "var(--red)", marginBottom: 6 }}>Picks Are Locked</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>The deadline has passed. Check the Leaderboard to see standings.</div>
        </div>
        <ScoringRules />
      </div>
    );
  }

  return (
    <div className="mp-picks-layout">
      {/* ── Left: Your Team ── */}
      <div className="mp-team-panel">
        <div className="mp-team-hdr">
          <div className="mp-team-hdr-title">Your Team</div>
          <div className="mp-team-hdr-sub">Pick {NPICKS} golfers under ${CAP} cap</div>
        </div>

        {/* Cap bar */}
        <div className="mp-cap-section">
          <div className="mp-cap-row">
            <span className="mp-cap-label">Salary Used</span>
            <span className={`mp-cap-value ${capCls}`}>${totalSalary}</span>
          </div>
          <div className="mp-cap-bar-track">
            <div
              className="mp-cap-bar-fill"
              style={{
                width: `${capPct * 100}%`,
                background: capCls === "over" ? "var(--red)" : capCls === "warn" ? "var(--amber)" : "var(--mg2)",
              }}
            />
          </div>
          <div className="mp-picks-count">
            <span>${remaining >= 0 ? remaining : 0} remaining</span>
            <span>{picks.length} / {NPICKS} picks</span>
          </div>
        </div>

        {/* Pick slots */}
        <div className="mp-slots">
          {Array.from({ length: NPICKS }, (_, i) => {
            const player = picks[i];
            const sal    = player ? (field[player]?.salary ?? 0) : null;
            return player ? (
              <div key={i} className="mp-slot filled">
                <span className="mp-slot-num">{i + 1}</span>
                <span className="mp-slot-icon">✓</span>
                <span className="mp-slot-name">{player}</span>
                <span className="mp-slot-salary">${sal}</span>
                <button className="mp-slot-remove" onClick={() => removePick(player)} title="Remove">✕</button>
              </div>
            ) : (
              <div key={i} className="mp-slot mp-slot-empty">
                <span className="mp-slot-num">{i + 1}</span>
                <span className="mp-slot-icon" style={{ color: "var(--border2)" }}>○</span>
                <span className="mp-slot-name">Select a golfer</span>
              </div>
            );
          })}
        </div>

        {/* Entry form */}
        {submitted ? (
          <div className="mp-submit-area">
            <div className="mp-submit-success">
              <div className="mp-submit-success-icon">🏌️</div>
              <div className="mp-submit-success-title">Entry Submitted!</div>
              <div className="mp-submit-success-sub">Good luck, {name.trim()}!</div>
              <button className="mp-submit-another" onClick={startOver}>Submit Another Entry</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mp-entry-form">
              <div className="mp-field">
                <label>Your Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" />
              </div>
              <div className="mp-field">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@email.com" />
              </div>
            </div>
            <div className="mp-submit-area">
              <button
                className="mp-submit-btn"
                onClick={handleSubmit}
                disabled={submitting || picks.length < NPICKS || totalSalary > CAP}
              >
                {submitting ? "Submitting…" : "Submit Entry"}
              </button>
              {submitError && <div className="mp-submit-error">⚠ {submitError}</div>}
            </div>
          </>
        )}
      </div>

      {/* ── Right: Player Selection ── */}
      <div className="mp-player-panel">
        {/* Controls */}
        <div className="mp-player-controls">
          <div className="mp-search-wrap">
            <span className="mp-search-icon">🔍</span>
            <input
              className="mp-search"
              placeholder="Search golfers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="mp-sort-btns">
            {[["salary","Salary"],["wr","WR"],["name","A–Z"]].map(([k, lbl]) => (
              <button key={k} className={`mp-sort-btn${sort === k ? " active" : ""}`} onClick={() => setSort(k)}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Salary filter chips */}
        <div className="mp-filter-chips" style={{ marginBottom: 10 }}>
          {salBrackets.map(b => (
            <div
              key={b.label}
              className={`mp-filter-chip${salFilter === (b.label === "All" ? null : b.label) ? " active" : ""}`}
              onClick={() => setSalFilter(b.label === "All" ? null : (salFilter === b.label ? null : b.label))}
            >
              {b.label}
            </div>
          ))}
        </div>

        {/* Player list */}
        <div className="mp-player-list">
          {filtered.length === 0 && (
            <div className="mp-no-results">No golfers match your search.</div>
          )}
          {filtered.map(player => {
            const isSelected = picks.includes(player.name);
            const wouldExceed = !isSelected && totalSalary + player.salary > CAP;
            const maxed       = !isSelected && picks.length >= NPICKS;
            const disabled    = maxed || (wouldExceed && !isSelected);

            return (
              <div
                key={player.name}
                className={[
                  "mp-player-row",
                  isSelected ? "mp-player-row--selected" : "",
                  !isSelected && wouldExceed ? "mp-player-row--over-cap" : "",
                  !isSelected && maxed ? "mp-player-row--disabled" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => !disabled ? togglePick(player.name) : undefined}
              >
                <span className="mp-pr-salary">${player.salary}</span>
                <span className="mp-pr-name">{player.name}</span>
                {player.wr && player.wr <= 200 && (
                  <span className="mp-pr-wr">WR {player.wr}</span>
                )}
                {!isSelected && wouldExceed && !maxed && (
                  <span className="mp-pr-over-cap-badge">Over cap</span>
                )}
                <div className="mp-pr-select">{isSelected ? "✓" : "+"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────

function LeaderboardTab({ participants, results, field }) {
  const [expanded, setExpanded] = useState(null);
  const leaderboard = buildMastersLeaderboard(participants, results);

  const totalEntries = leaderboard.length;
  const hasResults   = Object.keys(results).length > 0;

  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const rankCls = r => r === 1 ? "r1" : r === 2 ? "r2" : r === 3 ? "r3" : "other";

  if (totalEntries === 0) {
    return (
      <div>
        <ScoringRules />
        <div className="mp-lb-empty">
          <div className="mp-lb-empty-icon">⛳</div>
          <div className="mp-lb-empty-title">No Entries Yet</div>
          <div className="mp-lb-empty-sub">Be the first to submit your picks!</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mp-lb-header">
        <div className="mp-lb-title">Pool Standings</div>
        <div className="mp-lb-meta">
          {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
          {hasResults ? " · Live" : " · Picks"}
        </div>
      </div>

      {!hasResults && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: "0.75rem", color: "var(--text3)", display: "flex", alignItems: "center", gap: 8 }}>
          ℹ️ Standings will update with live scoring once the tournament begins (Apr 9).
        </div>
      )}

      {leaderboard.map(entry => {
        const isExpanded = expanded === entry.id;
        return (
          <div
            key={entry.id}
            className={`mp-entry-card${entry.rank <= 3 ? " top-3" : ""}${entry.rank === 1 ? " rank-1" : ""}`}
          >
            <div className="mp-ec-main" onClick={() => setExpanded(isExpanded ? null : entry.id)}>
              {medals[entry.rank] && <span className="mp-ec-medal">{medals[entry.rank]}</span>}
              <div className={`mp-ec-rank ${rankCls(entry.rank)}`}>
                {medals[entry.rank] ? "" : `#${entry.rank}`}
              </div>
              <div className="mp-ec-info">
                <div className="mp-ec-name">{entry.name}</div>
                <div className="mp-ec-salary-used">${entry.totalSalary} salary · {entry.picks?.length ?? 0} picks</div>
              </div>
              <div>
                <div className="mp-ec-pts">{hasResults ? fmtPts(entry.totalPoints) : "—"}</div>
                <div className="mp-ec-pts-label">{hasResults ? "pts" : "No scores yet"}</div>
              </div>
              <span className={`mp-ec-chevron${isExpanded ? " open" : ""}`}>▼</span>
            </div>

            {isExpanded && (
              <div className="mp-ec-picks">
                {(entry.pickDetails || (entry.picks || []).map(p => ({ player: p, status: null, totalPoints: null }))).map((pick, i) => {
                  const pts = pick.totalPoints;
                  const ptsCls = pts == null ? "pending" : pts > 0 ? "positive" : pts < 0 ? "negative" : "zero";
                  const statusCls = { active: "active", F: "finished", CUT: "cut", WD: "wd" }[pick.status] || "";
                  return (
                    <div key={i} className="mp-ec-pick-row">
                      <span style={{ fontSize: "0.65rem", color: "var(--text3)", width: 14 }}>{i + 1}</span>
                      <span className="mp-ec-pick-player">{pick.player}</span>
                      <span style={{ fontSize: "0.68rem", color: "var(--gold)", fontFamily: "'JetBrains Mono',monospace" }}>
                        ${field[pick.player]?.salary ?? "—"}
                      </span>
                      {pick.status && (
                        <span className={`mp-ec-pick-status ${statusCls}`}>
                          {pick.status === "F" ? `${posLabel(pick.position)}` : pick.status}
                        </span>
                      )}
                      <span className={`mp-ec-pick-pts ${ptsCls}`}>
                        {pts == null ? "—" : `${pts > 0 ? "+" : ""}${fmtPts(pts)}`}
                      </span>
                    </div>
                  );
                })}
                {hasResults && (
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 6, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text3)", marginRight: 8 }}>Total</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.9rem", fontWeight: 800, color: "var(--gold2)" }}>
                      {fmtPts(entry.totalPoints)} pts
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Admin Tab ────────────────────────────────────────────────────────────────

function AdminTab({ adminAuthed, dbPath, participants, results, picksLocked, field, fieldPlayers }) {
  // Results entry state: local edits keyed by player name
  const [localResults, setLocalResults] = useState({});
  const [savedFlags,   setSavedFlags]   = useState({});
  // Field manager
  const [addName,   setAddName]   = useState("");
  const [addSal,    setAddSal]    = useState("");
  const [addWr,     setAddWr]     = useState("");
  const [fieldEdit, setFieldEdit] = useState(() =>
    fieldPlayers.map(p => ({ ...p }))
  );

  // Which players were picked (and by how many participants)
  const pickCounts = {};
  Object.values(participants).forEach(p => {
    (p.picks || []).forEach(name => { pickCounts[name] = (pickCounts[name] || 0) + 1; });
  });

  function localResult(name) {
    return localResults[name] ?? results[name] ?? { status: "active", position: "", holePoints: "", bonusPoints: "" };
  }
  function updateLocal(name, key, val) {
    setLocalResults(prev => ({ ...prev, [name]: { ...localResult(name), [key]: val } }));
  }

  async function saveResult(playerName) {
    const lr = localResult(playerName);
    const pos        = parseInt(lr.position) || null;
    const holePoints = parseFloat(lr.holePoints) || 0;
    const bonusPoints= parseFloat(lr.bonusPoints) || 0;
    const finishBonus= getFinishBonus(pos);
    const totalPoints= holePoints + finishBonus + bonusPoints;

    await set(ref(db, `${dbPath}/results/${playerName.replace(/[.#$[\]]/g, "_")}`), {
      status:      lr.status || "active",
      position:    pos,
      holePoints,
      bonusPoints,
      finishBonus,
      totalPoints,
    });
    setSavedFlags(f => ({ ...f, [playerName]: true }));
    setTimeout(() => setSavedFlags(f => ({ ...f, [playerName]: false })), 2000);
  }

  async function toggleLock() {
    await set(ref(db, `${dbPath}/settings/locked`), !picksLocked);
  }

  // Field manager helpers
  async function saveField(newList) {
    const obj = {};
    newList.forEach((p, i) => { obj[`p${i}`] = { name: p.name, salary: Number(p.salary), wr: p.wr ? Number(p.wr) : null }; });
    await set(ref(db, `${dbPath}/field`), obj);
    setFieldEdit(newList);
  }

  function addPlayer() {
    if (!addName.trim() || !addSal) return;
    const newList = [...fieldEdit, { name: addName.trim(), salary: Number(addSal), wr: addWr ? Number(addWr) : null }]
      .sort((a, b) => b.salary - a.salary);
    saveField(newList);
    setAddName(""); setAddSal(""); setAddWr("");
  }

  function removePlayer(name) {
    saveField(fieldEdit.filter(p => p.name !== name));
  }

  function updateFieldPlayer(name, key, val) {
    setFieldEdit(prev => prev.map(p => p.name === name ? { ...p, [key]: val } : p));
  }

  async function deleteParticipant(id) {
    if (!window.confirm("Delete this entry?")) return;
    await remove(ref(db, `${dbPath}/participants/${id}`));
  }

  if (!adminAuthed) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔒</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", letterSpacing: "2px", color: "var(--text)", marginBottom: 8 }}>Admin Access Required</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>Sign in via the Admin Hub in the left sidebar.</div>
      </div>
    );
  }

  const pickedPlayers = Object.keys(pickCounts).sort((a, b) => (field[b]?.salary ?? 0) - (field[a]?.salary ?? 0));
  const unpickedPlayers = fieldPlayers.filter(p => !pickCounts[p.name]).sort((a, b) => b.salary - a.salary);

  return (
    <div className="mp-admin-grid">

      {/* Lock control */}
      <div className="mp-admin-card">
        <div className="mp-admin-card-hdr">
          <div className="mp-admin-card-title">Picks Lock</div>
        </div>
        <div className="mp-admin-card-body">
          <div className="mp-lock-row">
            <div className="mp-lock-status">
              <div className="mp-lock-label">{picksLocked ? "🔒 Picks Locked" : "🔓 Picks Open"}</div>
              <div className="mp-lock-sub">{picksLocked ? "Participants cannot submit new entries." : `Deadline: ${MASTERS_CONFIG.deadline}`}</div>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={picksLocked} onChange={toggleLock} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* Results Entry */}
      <div className="mp-admin-card">
        <div className="mp-admin-card-hdr">
          <div className="mp-admin-card-title">Enter Results</div>
          <span style={{ fontSize: "0.68rem", color: "var(--text3)" }}>
            {pickedPlayers.length} picked · {fieldPlayers.length} in field
          </span>
        </div>
        <div className="mp-admin-card-body" style={{ padding: 0, overflowX: "auto" }}>
          <table className="mp-results-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Entries</th>
                <th>Status</th>
                <th style={{ width: 64 }}>Position</th>
                <th style={{ width: 80 }}>Hole Pts</th>
                <th style={{ width: 80 }}>Bonus Pts</th>
                <th style={{ width: 80 }}>Finish Bonus</th>
                <th className="right" style={{ width: 70 }}>Total</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {[...pickedPlayers, ...unpickedPlayers.map(p => p.name)].map(playerName => {
                const lr          = localResult(playerName);
                const pos         = parseInt(lr.position) || null;
                const fb          = getFinishBonus(pos);
                const hp          = parseFloat(lr.holePoints) || 0;
                const bp          = parseFloat(lr.bonusPoints) || 0;
                const total       = hp + fb + bp;
                const isDirty     = JSON.stringify(localResults[playerName]) !== undefined;

                return (
                  <tr key={playerName}>
                    <td>
                      <div className="mp-rt-name">{playerName}</div>
                      <div className="mp-rt-salary">${field[playerName]?.salary ?? "—"}</div>
                    </td>
                    <td>
                      {pickCounts[playerName]
                        ? <span className="mp-rt-picked">{pickCounts[playerName]} {pickCounts[playerName] === 1 ? "entry" : "entries"}</span>
                        : <span style={{ color: "var(--text3)", fontSize: "0.65rem" }}>—</span>
                      }
                    </td>
                    <td>
                      <select className="mp-rt-select" value={lr.status || "active"} onChange={e => updateLocal(playerName, "status", e.target.value)}>
                        <option value="active">Active</option>
                        <option value="F">Finished</option>
                        <option value="CUT">CUT</option>
                        <option value="WD">WD</option>
                      </select>
                    </td>
                    <td>
                      <input className="mp-rt-input" type="number" min="1" max="96" placeholder="—"
                        value={lr.position || ""}
                        onChange={e => updateLocal(playerName, "position", e.target.value)}
                        style={{ width: 56 }}
                      />
                    </td>
                    <td>
                      <input className={`mp-rt-input ${hp > 0 ? "pos" : hp < 0 ? "neg" : ""}`}
                        type="number" step="0.5" placeholder="0"
                        value={lr.holePoints || ""}
                        onChange={e => updateLocal(playerName, "holePoints", e.target.value)}
                        style={{ width: 72 }}
                      />
                    </td>
                    <td>
                      <input className={`mp-rt-input ${bp > 0 ? "pos" : ""}`}
                        type="number" step="0.5" placeholder="0"
                        value={lr.bonusPoints || ""}
                        onChange={e => updateLocal(playerName, "bonusPoints", e.target.value)}
                        style={{ width: 72 }}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", color: fb > 0 ? "var(--green)" : "var(--text3)" }}>
                        {fb > 0 ? `+${fb}` : "—"}
                      </span>
                    </td>
                    <td className="mp-rt-total" style={{ color: total > 0 ? "var(--green)" : "var(--text3)" }}>
                      {total !== 0 ? fmtPts(total) : "—"}
                    </td>
                    <td>
                      {savedFlags[playerName]
                        ? <span className="mp-rt-saved">✓ Saved</span>
                        : <button className="mp-rt-save-btn" onClick={() => saveResult(playerName)}>Save</button>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Participants */}
      <div className="mp-admin-card">
        <div className="mp-admin-card-hdr">
          <div className="mp-admin-card-title">Entries ({Object.keys(participants).length})</div>
        </div>
        <div className="mp-admin-card-body" style={{ padding: 0, overflowX: "auto" }}>
          {Object.keys(participants).length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text3)", fontSize: "0.78rem" }}>No entries yet.</div>
          ) : (
            <table className="mp-part-table">
              <thead>
                <tr><th>Name / Email</th><th>Salary</th><th>Picks</th><th>Submitted</th><th></th></tr>
              </thead>
              <tbody>
                {Object.entries(participants).map(([id, p]) => (
                  <tr key={id}>
                    <td>
                      <div className="mp-part-name">{p.name}</div>
                      <div className="mp-part-email">{p.email}</div>
                    </td>
                    <td><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.78rem", color: "var(--gold)" }}>${p.totalSalary}</span></td>
                    <td>
                      <div className="mp-part-picks">
                        {(p.picks || []).map(pick => (
                          <span key={pick} className="mp-part-pick-chip">{pick}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.68rem", color: "var(--text3)", whiteSpace: "nowrap" }}>
                      {p.timestamp ? new Date(p.timestamp).toLocaleString() : "—"}
                    </td>
                    <td>
                      <button className="mp-part-del" title="Delete entry" onClick={() => deleteParticipant(id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Field Manager */}
      <div className="mp-admin-card">
        <div className="mp-admin-card-hdr">
          <div className="mp-admin-card-title">Field Manager</div>
          <span style={{ fontSize: "0.68rem", color: "var(--text3)" }}>{fieldEdit.length} players · Changes save to Firebase</span>
        </div>
        <div className="mp-admin-card-body">
          <div style={{ overflowX: "auto" }}>
            {fieldEdit.map((p, i) => (
              <div key={p.name} className="mp-field-row">
                <div className="mp-field-name">
                  <input className="mp-rt-input" value={p.name}
                    onChange={e => updateFieldPlayer(p.name, "name", e.target.value)}
                    onBlur={() => saveField(fieldEdit)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="mp-field-sal">
                  <input className="mp-rt-input" type="number" value={p.salary}
                    onChange={e => updateFieldPlayer(p.name, "salary", e.target.value)}
                    onBlur={() => saveField(fieldEdit)}
                    placeholder="Salary"
                  />
                </div>
                <div className="mp-field-wr">
                  <input className="mp-rt-input" type="number" value={p.wr ?? ""}
                    onChange={e => updateFieldPlayer(p.name, "wr", e.target.value)}
                    onBlur={() => saveField(fieldEdit)}
                    placeholder="WR"
                  />
                </div>
                <button className="mp-field-del" onClick={() => removePlayer(p.name)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="mp-add-row">
            <div className="mp-field-name">
              <input className="mp-rt-input" value={addName} onChange={e => setAddName(e.target.value)} placeholder="Player Name" style={{ width: "100%" }} />
            </div>
            <div className="mp-field-sal">
              <input className="mp-rt-input" type="number" value={addSal} onChange={e => setAddSal(e.target.value)} placeholder="Salary" />
            </div>
            <div className="mp-field-wr">
              <input className="mp-rt-input" type="number" value={addWr} onChange={e => setAddWr(e.target.value)} placeholder="WR" />
            </div>
            <button className="mp-add-btn" onClick={addPlayer}>+ Add Player</button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MastersPool({ dbPath, poolId, adminAuthed }) {
  const [tab,          setTab]          = useState("picks");
  const [participants, setParticipants] = useState({});
  const [results,      setResults]      = useState({});
  const [picksLocked,  setPicksLocked]  = useState(false);
  const [firebaseField,setFirebaseField]= useState(null); // null = use config default

  // Firebase listeners
  useEffect(() => {
    if (!db || !dbPath) return;
    const unsubs = [
      onValue(ref(db, `${dbPath}/participants`), s => setParticipants(s.exists() ? s.val() : {})),
      onValue(ref(db, `${dbPath}/results`),      s => setResults(s.exists() ? s.val() : {})),
      onValue(ref(db, `${dbPath}/settings/locked`), s => setPicksLocked(s.exists() ? s.val() : false)),
      onValue(ref(db, `${dbPath}/field`),        s => {
        if (s.exists()) {
          // Firebase field is stored as object { p0: {...}, p1: {...} }
          const val = s.val();
          setFirebaseField(Object.values(val).sort((a, b) => b.salary - a.salary));
        } else {
          setFirebaseField(null);
        }
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [dbPath]);

  // Deadline auto-lock
  useEffect(() => {
    const check = () => {
      const past = new Date(MASTERS_CONFIG.deadlineISO) <= new Date();
      if (past && !picksLocked && db && dbPath) {
        set(ref(db, `${dbPath}/settings/locked`), true);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [dbPath, picksLocked]);

  // Effective field: Firebase override or config default
  const fieldPlayers = firebaseField ?? MASTERS_CONFIG.players;
  const field = buildDefaultPlayerMap(fieldPlayers);

  const entryCount = Object.keys(participants).length;

  return (
    <>
      <style>{css}</style>
      <div className="mp">

        {/* ── Header ── */}
        <div className="mp-header">
          <div className="mp-header-top">
            <div className="mp-event-info">
              <div className="mp-event-eyebrow">⛳ Golf · Augusta National</div>
              <div className="mp-event-title">The <span>Masters</span> 2026</div>
              <div className="mp-event-meta">
                <span>{MASTERS_CONFIG.dates}</span>
                &nbsp;·&nbsp;
                <span>{MASTERS_CONFIG.venue}</span>
                &nbsp;·&nbsp; Deadline: <span>{MASTERS_CONFIG.deadline}</span>
              </div>
            </div>
            <Countdown isoDeadline={MASTERS_CONFIG.deadlineISO} />
          </div>

          {picksLocked && (
            <div className="mp-locked-banner">
              🔒 Picks are locked — submissions closed. Live scoring active.
            </div>
          )}

          {/* Tab nav */}
          <div className="mp-tabs">
            {[
              ["picks",       "My Picks",    picksLocked ? null : "Open"],
              ["leaderboard", "Leaderboard", entryCount || null],
              ["admin",       "Admin",       null],
            ].map(([id, label, badge]) => (
              <button
                key={id}
                className={`mp-tab${tab === id ? " active" : ""}`}
                onClick={() => setTab(id)}
              >
                {label}
                {badge != null && (
                  <span className="mp-tab-count">{badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="mp-body">
          {tab === "picks" && (
            <PicksTab
              picksLocked={picksLocked}
              field={field}
              fieldPlayers={fieldPlayers}
              dbPath={dbPath}
              participants={participants}
            />
          )}
          {tab === "leaderboard" && (
            <LeaderboardTab
              participants={participants}
              results={results}
              field={field}
            />
          )}
          {tab === "admin" && (
            <AdminTab
              adminAuthed={adminAuthed}
              dbPath={dbPath}
              participants={participants}
              results={results}
              picksLocked={picksLocked}
              field={field}
              fieldPlayers={fieldPlayers}
            />
          )}
        </div>

      </div>
    </>
  );
}
