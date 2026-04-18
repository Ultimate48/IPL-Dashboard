import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";
import './App.css';

const ROLE = {
  Batter:     { color: "#38bdf8", bg: "rgba(56,189,248,0.12)", label: "BAT" },
  Bowler:     { color: "#4ade80", bg: "rgba(74,222,128,0.12)", label: "BOWL" },
  AllRounder: { color: "#fb923c", bg: "rgba(251,146,60,0.12)", label: "AR" },
  WK:         { color: "#c084fc", bg: "rgba(192,132,252,0.12)", label: "WK" },
};

const FLAG = { Indian: "🇮🇳", Foreigner: "🌏" };

function StatTooltip({ player }) {
  const r = ROLE[player.type] || ROLE.Batter;
  const s = player.stats || {};
  const isBat  = player.type === "Batter" || player.type === "WK";
  const isBowl = player.type === "Bowler";
  const isAR   = player.type === "AllRounder";

  return (
    <div className="stat-tooltip">
      <div className="tooltip-name">
        {FLAG[player.nationality]} {player.name}
        <span style={{ marginLeft: 8, fontSize: 11, color: r.color,
          background: r.bg, padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>
          {r.label}
        </span>
      </div>
      <div className="tooltip-stats">
        <div className="tooltip-stat">
          <div className="tooltip-stat-val" style={{ color: "#94a3b8" }}>{s.matches ?? "—"}</div>
          <div className="tooltip-stat-label">MATCHES</div>
        </div>
        {(isBat || isAR) && <>
          <div className="tooltip-stat">
            <div className="tooltip-stat-val" style={{ color: "#38bdf8" }}>{s.runs ?? "—"}</div>
            <div className="tooltip-stat-label">RUNS</div>
          </div>
          <div className="tooltip-stat">
            <div className="tooltip-stat-val" style={{ color: "#38bdf8" }}>{s.batAvg ?? "—"}</div>
            <div className="tooltip-stat-label">AVG</div>
          </div>
          <div className="tooltip-stat">
            <div className="tooltip-stat-val" style={{ color: "#38bdf8" }}>{s.strikeRate ?? "—"}</div>
            <div className="tooltip-stat-label">SR</div>
          </div>
        </>}
        {(isBowl || isAR) && <>
          <div className="tooltip-stat">
            <div className="tooltip-stat-val" style={{ color: "#4ade80" }}>{s.wickets ?? "—"}</div>
            <div className="tooltip-stat-label">WKTS</div>
          </div>
          <div className="tooltip-stat">
            <div className="tooltip-stat-val" style={{ color: "#4ade80" }}>{s.bowlAvg ?? "—"}</div>
            <div className="tooltip-stat-label">B.AVG</div>
          </div>
          <div className="tooltip-stat">
            <div className="tooltip-stat-val" style={{ color: "#4ade80" }}>{s.economy ?? "—"}</div>
            <div className="tooltip-stat-label">ECON</div>
          </div>
        </>}
      </div>
    </div>
  );
}

function BudgetBar({ spent, total }) {
  const pct = Math.min(100, Math.round((spent / total) * 100));
  const color = pct > 80 ? "#ef4444" : pct > 55 ? "#fbbf24" : "#4ade80";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11,
        color: "var(--muted)", marginBottom: 6, fontWeight: 500 }}>
        <span>SPENT <strong style={{ color: "#e2e8f0" }}>₹{spent}Cr</strong></span>
        <span>LEFT <strong style={{ color }}> ₹{total - spent}Cr</strong></span>
      </div>
      <div className="budget-bar-track">
        <div className="budget-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function RolePills({ players }) {
  const counts = { Batter: 0, Bowler: 0, AllRounder: 0, WK: 0 };
  players.forEach(p => { if (counts[p.type] !== undefined) counts[p.type]++; });
  return (
    <div className="role-pills">
      {Object.entries(counts).map(([role, count]) => count > 0 && (
        <span key={role} className="role-pill"
          style={{ color: ROLE[role].color, background: ROLE[role].bg }}>
          {ROLE[role].label} {count}
        </span>
      ))}
      {players.length === 0 && <span style={{ fontSize: 11, color: "var(--dimmer)" }}>No players yet</span>}
    </div>
  );
}

function TeamCard({ team, players, allPlayerData, isExpanded, onToggle }) {
  const totalBudget = 100;
  const spent = players.reduce((s, p) => s + (p.soldPrice || 0), 0);
  const foreign = players.filter(p => p.nationality === "Foreigner").length;
  const pct = Math.min(100, Math.round((spent / totalBudget) * 100));
  const budgetColor = pct > 80 ? "#ef4444" : pct > 55 ? "#fbbf24" : "#4ade80";

  return (
    <div className={`team-card ${isExpanded ? "expanded" : ""}`} onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="team-name">{team.name}</div>
          <div className="team-meta">{players.length} players · {foreign}/8 overseas</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="team-budget" style={{ color: budgetColor }}>₹{totalBudget - spent}</div>
          <div className="budget-label">CR LEFT</div>
        </div>
      </div>

      <BudgetBar spent={spent} total={totalBudget} />
      <RolePills players={players} />

      {isExpanded && (
        <div className="team-players" onClick={e => e.stopPropagation()}>
          {players.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--dimmer)", textAlign: "center", padding: "12px 0" }}>
              No players bought yet
            </div>
          ) : players.map((p, i) => {
            const fullPlayer = allPlayerData.find(ap => ap.name === p.name) || p;
            const r = ROLE[p.type] || ROLE.Batter;
            return (
              <div key={i} className="player-row">
                <StatTooltip player={fullPlayer} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{FLAG[p.nationality]}</span>
                  <span className="player-name">{p.name}</span>
                  <span style={{ fontSize: 10, color: r.color, background: r.bg,
                    padding: "1px 6px", borderRadius: 8, fontWeight: 700,
                    fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
                    {r.label}
                  </span>
                </div>
                <span className="player-price">₹{p.soldPrice}Cr</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlayersTab({ players }) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const isUnsoldStatus = status => status === "unsold" || status === "unsold_final";
  const isSoldStatus = status => status === "sold";

  const filtered = players.filter(p => {
    if (statusFilter === "unsold" && !isUnsoldStatus(p.status)) return false;
    if (statusFilter === "sold" && !isSoldStatus(p.status)) return false;
    if (roleFilter !== "all" && p.type !== roleFilter) return false;
    if (natFilter  !== "all" && p.nationality !== natFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="players-controls">
        {["all","unsold","sold"].map(s => (
          <button key={s} className={`filter-btn ${statusFilter===s?"active":""}`}
            onClick={() => setStatusFilter(s)}>
            {s.toUpperCase()}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
        {["all","Batter","Bowler","AllRounder","WK"].map(r => (
          <button key={r} className={`filter-btn ${roleFilter===r?"active":""}`}
            onClick={() => setRoleFilter(r)}
            style={roleFilter===r && r!=="all" ? { background: ROLE[r]?.color, borderColor: ROLE[r]?.color } : {}}>
            {r === "all" ? "ALL TYPES" : ROLE[r]?.label || r}
          </button>
        ))}

        <input
          placeholder="Search player..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            marginLeft: "auto", padding: "6px 12px",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 20, color: "var(--text)", fontSize: 12,
            outline: "none", fontFamily: "'Barlow', sans-serif",
          }}
        />
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
          {filtered.length} players
        </span>
      </div>

      <div className="players-grid">
        {filtered.map((p, i) => {
          const r = ROLE[p.type] || ROLE.Batter;
          return (
            <div key={i} className="player-card">
              <StatTooltip player={p} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{FLAG[p.nationality]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pc-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </div>
                  {p.status === "sold" && (
                    <div className="pc-sold-to">{p.soldTeamName}</div>
                  )}
                </div>
                <span className="pc-badge" style={{ color: r.color, background: r.bg }}>
                  {r.label}
                </span>
              </div>
                {isSoldStatus(p.status) ? (
                <div className="pc-price">₹{p.soldPrice}Cr</div>
              ) : (
                <div className="pc-base">Base: {p.basePrice}</div>
              )}
              <div style={{
                display: "inline-block", marginTop: 8,
                fontSize: 10, fontWeight: 700, letterSpacing: 1,
                padding: "2px 8px", borderRadius: 10,
                  background: isSoldStatus(p.status) ? "rgba(74,222,128,0.12)" : "rgba(100,116,139,0.15)",
                  color: isSoldStatus(p.status) ? "#4ade80" : "var(--dimmer)",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>
                  {isSoldStatus(p.status) ? "SOLD" : "AVAILABLE"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const unsub = onValue(ref(db, "players"), snap => {
      const data = snap.val() || {};
      setPlayers(Object.entries(data).map(([slug, p]) => ({ slug, ...p })));
    });
    return () => unsub();
  }, []);

  const teamsWithPlayers = teams.map(team => ({
    ...team,
    players: players
      .filter(p => p.status === "sold" && p.soldTo === team.id)
      .map(p => ({ name: p.name, type: p.type, nationality: p.nationality, soldPrice: p.soldPrice })),
  }));

  const playerList = players.map(p => ({
    ...p,
    soldTeamName: p.soldTo ? (teams.find(t => t.id === p.soldTo)?.name || "") : "",
  }));

  const totalSold = players.filter(p => p.status === "sold").length;
  const totalUnsold = players.filter(p => (p.status === "unsold" || p.status === "unsold_final")).length;
  const totalBudgetLeft = teamsWithPlayers.reduce((sum, t) => {
    const spent = t.players.reduce((s, p) => s + (p.soldPrice || 0), 0);
    return sum + (100 - spent);
  }, 0);

  return (
    <div className="dash">
      <header className="header">
        <div className="header-logo">IPL AUCTION</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <div className="live-dot" />
          <span style={{ fontSize: 10, letterSpacing: 2, color: "#ef4444", fontWeight: 700 }}>LIVE</span>
        </div>
      </header>
      <main className="content" style={{ paddingTop: 20 }}>
        <PlayersTab players={players} />
      </main>
    </div>
  );
}