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

function PlayersTab({ players }) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [natFilter,  setNatFilter]  = useState("all");
  const [search,     setSearch]     = useState("");

  const filtered = players.filter(p => {
    if (roleFilter !== "all" && p.type !== roleFilter) return false;
    if (natFilter  !== "all" && p.nationality !== natFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="players-controls">
        {["all","Batter","Bowler","AllRounder","WK"].map(r => (
          <button key={r}
            className={`filter-btn ${roleFilter === r ? "active" : ""}`}
            onClick={() => setRoleFilter(r)}
            style={roleFilter === r && r !== "all"
              ? { background: ROLE[r]?.color, borderColor: ROLE[r]?.color, color: "#000" }
              : {}}>
            {r === "all" ? "ALL TYPES" : ROLE[r]?.label}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />

        {[["all","🌐 ALL"],["Indian","🇮🇳 IND"],["Foreigner","🌏 OVERSEAS"]].map(([val, label]) => (
          <button key={val}
            className={`filter-btn ${natFilter === val ? "active" : ""}`}
            onClick={() => setNatFilter(val)}>
            {label}
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
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                    {p.nationality}
                  </div>
                </div>
                <span className="pc-badge" style={{ color: r.color, background: r.bg }}>
                  {r.label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--dimmer)", marginTop: 8 }}>
                Base: <strong style={{ color: "var(--muted)" }}>{p.basePrice}</strong>
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