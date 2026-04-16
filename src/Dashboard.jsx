import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

const ROLE = {
  Batter:    { color: "#38bdf8", bg: "rgba(56,189,248,0.12)",  label: "BAT" },
  Bowler:     { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  label: "BOWL" },
  AllRounder: { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  label: "AR" },
  WK:         { color: "#c084fc", bg: "rgba(192,132,252,0.12)", label: "WK" },
};

const FLAG = { Indian: "🇮🇳", Foreigner: "🌏" };

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #060b14;
    --surface: #0d1829;
    --surface2: #111e33;
    --border: rgba(255,255,255,0.07);
    --border-bright: rgba(255,255,255,0.15);
    --orange: #f97316;
    --blue: #38bdf8;
    --green: #4ade80;
    --purple: #c084fc;
    --gold: #fbbf24;
    --text: #e2e8f0;
    --muted: #64748b;
    --dimmer: #334155;
  }

  body { background: var(--bg); }

  .dash { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Barlow', sans-serif; }

  /* Header */
  .header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(6,11,20,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0 28px;
    display: flex; align-items: center; gap: 20px;
    height: 64px;
  }
  .header-logo {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 22px; font-weight: 900; letter-spacing: 2px;
    background: linear-gradient(90deg, var(--orange), var(--gold));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    white-space: nowrap;
  }
  .header-sub { font-size: 11px; color: var(--muted); letter-spacing: 3px; font-weight: 600; }
  .header-stats { margin-left: auto; display: flex; gap: 20px; align-items: center; }
  .hstat { text-align: center; }
  .hstat-val { font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 800; line-height: 1; }
  .hstat-label { font-size: 9px; letter-spacing: 2px; color: var(--muted); font-weight: 600; }
  .live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 8px #ef4444;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse { 0%,100% { opacity:1; box-shadow:0 0 8px #ef4444; } 50% { opacity:.4; box-shadow:0 0 2px #ef4444; } }

  /* Tabs */
  .tabs {
    display: flex; gap: 0; padding: 0 28px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    position: sticky; top: 64px; z-index: 90;
  }
  .tab {
    padding: 14px 20px; border: none; background: none; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 2px;
    color: var(--muted); border-bottom: 3px solid transparent;
    transition: all 0.2s;
  }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--orange); border-bottom-color: var(--orange); }

  /* Content */
  .content { padding: 24px 28px; max-width: 1400px; margin: 0 auto; }

  /* Teams Grid */
  .teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  /* Team Card */
  .team-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.25s;
    position: relative;
    overflow: hidden;
  }
  .team-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--orange), var(--gold));
    opacity: 0; transition: opacity 0.25s;
  }
  .team-card:hover, .team-card.expanded {
    border-color: rgba(249,115,22,0.3);
    background: var(--surface2);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(249,115,22,0.08);
  }
  .team-card:hover::before, .team-card.expanded::before { opacity: 1; }

  .team-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px; font-weight: 800; letter-spacing: 1px;
    color: #fff;
  }
  .team-meta { font-size: 11px; color: var(--muted); margin-top: 2px; font-weight: 500; }
  .team-budget {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 28px; font-weight: 900; line-height: 1;
  }
  .budget-label { font-size: 9px; letter-spacing: 2px; color: var(--muted); font-weight: 600; }

  /* Budget Bar */
  .budget-bar-track {
    height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px;
    margin-top: 12px; overflow: hidden;
  }
  .budget-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }

  /* Role pills */
  .role-pills { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
  .role-pill {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 1px;
    padding: 3px 8px; border-radius: 20px;
  }

  /* Players in team */
  .team-players { margin-top: 16px; border-top: 1px solid var(--border); padding-top: 14px; }
  .player-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03);
    position: relative;
    cursor: default;
  }
  .player-row:last-child { border-bottom: none; }
  .player-name { font-size: 13px; font-weight: 500; color: var(--text); }
  .player-price {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px; font-weight: 700; color: var(--green);
  }

  /* Hover tooltip */
  .stat-tooltip {
    display: none;
    position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
    background: #0a1628; border: 1px solid rgba(249,115,22,0.4);
    border-radius: 12px; padding: 12px 14px; z-index: 200;
    white-space: nowrap;
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    pointer-events: none;
  }
  .stat-tooltip::after {
    content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    border: 6px solid transparent; border-top-color: rgba(249,115,22,0.4);
  }
  .player-row:hover .stat-tooltip { display: block; }
  .tooltip-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 8px;
  }
  .tooltip-stats { display: flex; gap: 10px; }
  .tooltip-stat { text-align: center; }
  .tooltip-stat-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 18px; font-weight: 800;
  }
  .tooltip-stat-label { font-size: 9px; color: var(--muted); letter-spacing: 1px; font-weight: 600; }

  /* Players tab */
  .players-controls { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
  .filter-btn {
    padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
    background: none; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 12px; font-weight: 700; letter-spacing: 1px;
    color: var(--muted); transition: all 0.15s;
  }
  .filter-btn:hover { border-color: var(--border-bright); color: var(--text); }
  .filter-btn.active { background: var(--orange); border-color: var(--orange); color: #000; }

  .players-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 10px;
  }
  .player-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 14px;
    position: relative; cursor: default;
    transition: all 0.2s;
  }
  .player-card:hover {
    border-color: var(--border-bright);
    background: var(--surface2);
  }
  .player-card:hover .stat-tooltip { display: block; }
  .player-card .stat-tooltip { bottom: calc(100% + 8px); }

  .pc-name { font-size: 14px; font-weight: 600; color: var(--text); }
  .pc-sold-to { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .pc-badge {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 1px;
    padding: 2px 7px; border-radius: 10px; margin-left: auto;
  }
  .pc-price {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px; font-weight: 800; color: var(--green);
    margin-top: 6px;
  }
  .pc-base { font-size: 11px; color: var(--dimmer); margin-top: 6px; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 2px; }
`;

function StatTooltip({ player }) {
  const r = ROLE[player.type] || ROLE.Batter;
  const s = player.stats || {};
  const isBat = player.type === "Batter" || player.type === "WK";
  const isBowl = player.type === "Bowler";
  const isAR = player.type === "AllRounder";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = players.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (roleFilter !== "all" && p.type !== roleFilter) return false;
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
                <span className="pc-badge"
                  style={{ color: r.color, background: r.bg }}>
                  {r.label}
                </span>
              </div>
              {p.status === "sold" ? (
                <div className="pc-price">₹{p.soldPrice}Cr</div>
              ) : (
                <div className="pc-base">Base: {p.basePrice}</div>
              )}
              <div style={{
                display: "inline-block", marginTop: 8,
                fontSize: 10, fontWeight: 700, letterSpacing: 1,
                padding: "2px 8px", borderRadius: 10,
                background: p.status === "sold" ? "rgba(74,222,128,0.12)" : "rgba(100,116,139,0.15)",
                color: p.status === "sold" ? "#4ade80" : "var(--dimmer)",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}>
                {p.status === "sold" ? "SOLD" : "AVAILABLE"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [activeTab, setActiveTab] = useState("teams");

  useEffect(() => {
    const unsubTeams = onValue(ref(db, "teams"), snap => {
      const data = snap.val() || {};
      setTeams(Object.entries(data).map(([id, t]) => ({ id, ...t })));
    });
    const unsubPlayers = onValue(ref(db, "players"), snap => {
      const data = snap.val() || {};
      setPlayers(Object.entries(data).map(([slug, p]) => ({ slug, ...p })));
    });
    return () => { unsubTeams(); unsubPlayers(); };
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
  const totalUnsold = players.filter(p => p.status === "unsold").length;
  const totalBudgetLeft = teamsWithPlayers.reduce((sum, t) => {
    const spent = t.players.reduce((s, p) => s + (p.soldPrice || 0), 0);
    return sum + (100 - spent);
  }, 0);

  return (
    <>
      <style>{css}</style>
      <div className="dash">
        <header className="header">
          <div>
            <div className="header-logo">IPL AUCTION</div>
          </div>
          <div style={{ width: 1, height: 36, background: "var(--border)", margin: "0 8px" }} />
          <div className="header-stats">
            <div className="hstat">
              <div className="hstat-val" style={{ color: "#4ade80" }}>{totalSold}</div>
              <div className="hstat-label">SOLD</div>
            </div>
            <div className="hstat">
              <div className="hstat-val" style={{ color: "var(--muted)" }}>{totalUnsold}</div>
              <div className="hstat-label">UNSOLD</div>
            </div>
            <div className="hstat">
              <div className="hstat-val" style={{ color: "#fbbf24" }}>{teams.length}</div>
              <div className="hstat-label">TEAMS</div>
            </div>
          </div>
          <div style={{ marginLeft: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 10, letterSpacing: 2, color: "#ef4444", fontWeight: 700 }}>LIVE</span>
          </div>
        </header>

        <nav className="tabs">
          {[["teams", "🏏 TEAMS"], ["players", "👤 PLAYERS"]].map(([id, label]) => (
            <button key={id} className={`tab ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </nav>

        <main className="content">
          {activeTab === "teams" && (
            <div className="teams-grid">
              {teamsWithPlayers.map(team => (
                <TeamCard
                  key={team.id}
                  team={team}
                  players={team.players}
                  allPlayerData={players}
                  isExpanded={expandedTeam === team.id}
                  onToggle={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                />
              ))}
            </div>
          )}
          {activeTab === "players" && <PlayersTab players={playerList} />}
        </main>
      </div>
    </>
  );
}
