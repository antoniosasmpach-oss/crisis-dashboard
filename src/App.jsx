import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "";
const REFRESH = 60000;

const STATUS_COLOR = {
  "VIABLE":       "#00ff88",
  "ACTIVATE NOW": "#00ff88",
  "AT RISK":      "#ffcc00",
  "STANDBY":      "#ffcc00",
  "BLOCKED":      "#ff4444",
  "UNKNOWN":      "#888888",
  "UNASSESSED":   "#888888",
};

const PRIORITY_COLOR = {
  "CRITICAL": "#ff2222",
  "HIGH":     "#ff6600",
  "MEDIUM":   "#ffcc00",
  "LOW":      "#00ff88",
};

const THREAT_COLOR = {
  "CRITICAL": "#ff2222",
  "HIGH":     "#ff6600",
  "MEDIUM":   "#ffcc00",
  "LOW":      "#00ff88",
};

function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function Countdown({ label, date, color }) {
  const days = daysUntil(date);
  return (
    <div style={{ background: "#111", border: `1px solid ${color}`, borderRadius: 6,
      padding: "8px 14px", textAlign: "center", minWidth: 110 }}>
      <div style={{ color, fontSize: 22, fontWeight: "bold" }}>{days}</div>
      <div style={{ color: "#888", fontSize: 11 }}>{label}</div>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{ background: color + "22", border: `1px solid ${color}`,
      color, borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: "bold" }}>
      {text}
    </span>
  );
}

function ScenarioCard({ scenario }) {
  const [expanded, setExpanded] = useState(false);
  const status = scenario.status || "UNKNOWN";
  const color = STATUS_COLOR[status] || "#888";
  const letter = scenario.name?.replace("SCENARIO ", "") || "?";

  return (
    <div onClick={() => setExpanded(!expanded)} style={{
      background: "#111", border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`, borderRadius: 8,
      padding: 16, cursor: "pointer", marginBottom: 12,
      transition: "border-color 0.2s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: color + "22", border: `1px solid ${color}`,
            borderRadius: 6, width: 36, height: 36, display: "flex",
            alignItems: "center", justifyContent: "center",
            color, fontWeight: "bold", fontSize: 18 }}>
            {letter}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>
              {scenario.name}
            </div>
            <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
              {scenario.subtitle || scenario.notes?.slice(0, 60) || "—"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Badge text={status} color={color} />
          {scenario.last_checked && (
            <div style={{ color: "#555", fontSize: 10, marginTop: 4 }}>
              {new Date(scenario.last_checked).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      {expanded && scenario.notes && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #222",
          color: "#aaa", fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {scenario.notes}
        </div>
      )}
    </div>
  );
}

// Static fallback scenarios
const FALLBACK_SCENARIOS = [
  { name: "SCENARIO A", subtitle: "AUH → MXP Milan — BOOKED 13 Mar", status: "STANDBY", notes: "AUH suspended. Flight booked for 13 March. Monitor daily." },
  { name: "SCENARIO B", subtitle: "AUH → ATH Athens — NOT booked", status: "STANDBY", notes: "Requires AUH reopening. Etihad ATH route on hold." },
  { name: "SCENARIO C", subtitle: "Drive Mezyad → MCT → ATH", status: "VIABLE", notes: "Oman Air MCT-ATH operating. Mezyad border open. Annual leave 13-22 Mar." },
  { name: "SCENARIO D", subtitle: "Full overland — last resort", status: "STANDBY", notes: "Last resort only. High cost and risk." },
  { name: "SCENARIO E", subtitle: "AI Best Case — dynamic", status: "UNASSESSED", notes: "Send /scenarios to bot for live AI assessment." },
];

// ── TABS ──────────────────────────────────────────────────────────────────────

function ScenariosTab({ scenarios }) {
  const data = scenarios.length > 0 ? scenarios : FALLBACK_SCENARIOS;
  return (
    <div>
      <div style={{ color: "#888", fontSize: 12, marginBottom: 16 }}>
        Click any scenario to expand details. Updates every 60 seconds from bot.
      </div>
      {data.map((s, i) => <ScenarioCard key={i} scenario={s} />)}
    </div>
  );
}

function LiveNowTab({ status }) {
  const liveText = status?.live_now || "";
  const threatLevel = status?.threat_level || "HIGH";
  const color = THREAT_COLOR[threatLevel] || "#ff6600";

  // Parse live_now text into lines
  const lines = liveText ? liveText.split(/\n+/).filter(Boolean) : [];

  return (
    <div>
      <div style={{ background: color + "11", border: `1px solid ${color}`,
        borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ color, fontSize: 20, fontWeight: "bold" }}>⚡ LIVE NOW</div>
          <Badge text={threatLevel} color={color} />
        </div>
        {lines.length > 0 ? lines.map((line, i) => {
          const isHeader = line.startsWith("LIVE NOW") || line.startsWith("THREAT");
          const isAction = line.startsWith("IMMEDIATE") || line.startsWith("Shelter");
          return (
            <div key={i} style={{
              color: isAction ? "#ffcc00" : isHeader ? "#fff" : "#ccc",
              fontWeight: isHeader || isAction ? "bold" : "normal",
              fontSize: isHeader ? 14 : 13,
              padding: "3px 0",
              borderBottom: i < lines.length - 1 ? "1px solid #1a1a1a" : "none"
            }}>
              {line}
            </div>
          );
        }) : (
          <div style={{ color: "#888", fontSize: 13 }}>
            No live data yet. Send /live to @NinoBach_bot on Telegram to update.
          </div>
        )}
      </div>
      <div style={{ color: "#555", fontSize: 11, textAlign: "center" }}>
        Auto-updated every 6hrs by bot • Manual update: send /live on Telegram
      </div>
    </div>
  );
}

function IntelTab({ news }) {
  if (!news || news.length === 0) {
    return (
      <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 32 }}>
        No intel items yet. Send /briefing to @NinoBach_bot to populate feed.
      </div>
    );
  }
  return (
    <div>
      {news.map((item, i) => {
        const pcolor = PRIORITY_COLOR[item.priority] || "#888";
        return (
          <div key={i} style={{ background: "#111", borderRadius: 6, padding: 12,
            marginBottom: 8, borderLeft: `3px solid ${pcolor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: pcolor, fontSize: 11, fontWeight: "bold" }}>
                {item.source}
              </span>
              <span style={{ color: "#555", fontSize: 11 }}>{item.time}</span>
            </div>
            <div style={{ color: "#ddd", fontSize: 13 }}>{item.headline}</div>
            {item.verified && (
              <div style={{ color: "#00ff88", fontSize: 10, marginTop: 4 }}>✓ verified</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RepatriationTab({ status }) {
  const repat = status?.repatriation || "";
  const lines = repat ? repat.split(/\n+/).filter(Boolean) : [];

  return (
    <div>
      <div style={{ background: "#0d1f0d", border: "1px solid #00aa44",
        borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: "#00ff88", fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
          🇬🇷 GREEK REPATRIATION STATUS
        </div>
        {lines.length > 0 ? lines.map((line, i) => (
          <div key={i} style={{ color: "#ccc", fontSize: 13, padding: "4px 0",
            borderBottom: "1px solid #1a2a1a" }}>
            {line}
          </div>
        )) : (
          <div>
            <div style={{ color: "#ccc", fontSize: 13, marginBottom: 8 }}>
              253 Greeks evacuated (162 initial + 91 via C-130 military)
            </div>
            <div style={{ color: "#ccc", fontSize: 13, marginBottom: 8 }}>
              1,500+ Greeks remaining in UAE requesting evacuation
            </div>
            <div style={{ color: "#ffcc00", fontSize: 13, fontWeight: "bold" }}>
              Send /repatriation to @NinoBach_bot for live embassy updates
            </div>
          </div>
        )}
      </div>

      <div style={{ color: "#888", fontSize: 12, marginBottom: 8, fontWeight: "bold" }}>
        EMBASSY CONTACTS
      </div>
      {[
        { name: "Greek Embassy Abu Dhabi", phone: "+971 2 449 2550" },
        { name: "Greek Embassy Qatar",     phone: "+974 4467 9100" },
        { name: "Greek Embassy Kuwait",    phone: "+965 2252 4588" },
        { name: "Greek Embassy Oman",      phone: "+968 2469 5685" },
        { name: "Greek MFA Emergency",     phone: "+30 210 368 1730" },
      ].map((e, i) => (
        <div key={i} style={{ background: "#111", borderRadius: 6, padding: "10px 14px",
          marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#ccc", fontSize: 13 }}>{e.name}</span>
          <span style={{ color: "#00ff88", fontSize: 13, fontWeight: "bold" }}>{e.phone}</span>
        </div>
      ))}

      <div style={{ color: "#555", fontSize: 11, textAlign: "center", marginTop: 12 }}>
        Send /repatriation on Telegram for live embassy announcements
      </div>
    </div>
  );
}

function StatusTab({ status, scenarios }) {
  const threat = status?.threat_level || "HIGH";
  const active = status?.active_scenario || "C";
  const color = THREAT_COLOR[threat] || "#ff6600";

  const items = [
    { label: "Threat Level",       value: threat,    color },
    { label: "Active Scenario",    value: `SCENARIO ${active}`, color: "#00ff88" },
    { label: "Last Briefing",      value: status?.last_briefing || "Check Telegram", color: "#888" },
    { label: "Scenarios Assessed", value: `${scenarios.length}/5`, color: "#888" },
  ];

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ background: "#111", borderRadius: 6, padding: "12px 16px",
          marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#888", fontSize: 13 }}>{item.label}</span>
          <span style={{ color: item.color, fontSize: 14, fontWeight: "bold" }}>{item.value}</span>
        </div>
      ))}

      <div style={{ background: "#111", borderRadius: 6, padding: 16, marginTop: 16 }}>
        <div style={{ color: "#888", fontSize: 12, marginBottom: 8, fontWeight: "bold" }}>
          BOT COMMANDS
        </div>
        {[
          ["/briefing",     "Full morning intel"],
          ["/live",         "LIVE NOW threat snapshot"],
          ["/threat",       "Threat level 1-10"],
          ["/scenarios",    "All 5 scenario validity"],
          ["/airport",      "AUH + DXB + MCT status"],
          ["/border",       "Mezyad border crossing"],
          ["/repatriation", "Greek embassy + MFA"],
          ["/status",       "Quick 5-line report"],
          ["/ceasefire",    "Negotiations update"],
        ].map(([cmd, desc], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between",
            padding: "6px 0", borderBottom: "1px solid #1a1a1a" }}>
            <span style={{ color: "#00ff88", fontSize: 12, fontFamily: "monospace" }}>{cmd}</span>
            <span style={{ color: "#888", fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: "live",        label: "⚡ Live Now" },
  { id: "scenarios",   label: "🗺 Scenarios" },
  { id: "intel",       label: "📡 Intel Feed" },
  { id: "repatriation",label: "🇬🇷 Repatriation" },
  { id: "status",      label: "⚙️ Status" },
];

export default function App() {
  const [tab, setTab] = useState("live");
  const [scenarios, setScenarios] = useState([]);
  const [news, setNews] = useState([]);
  const [status, setStatus] = useState({});
  const [lastFetch, setLastFetch] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!API) { setLoading(false); return; }
    try {
      const resp = await fetch(`${API}/state`);
      if (resp.ok) {
        const data = await resp.json();
        setScenarios(data.scenarios || []);
        setNews(data.news || []);
        setStatus(data.status || {});
        setLastFetch(new Date());
      }
    } catch (e) {
      console.error("API fetch failed:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH);
    return () => clearInterval(interval);
  }, [fetchData]);

  const threatLevel = status?.threat_level || "HIGH";
  const threatColor = THREAT_COLOR[threatLevel] || "#ff6600";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0",
      fontFamily: "'Courier New', monospace", maxWidth: 700, margin: "0 auto", padding: 16 }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: threatColor, fontSize: 11, fontWeight: "bold", letterSpacing: 2 }}>
              ● CRISIS COMMAND CENTER
            </div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginTop: 2 }}>
              Abu Dhabi · UAE-Iran 2026
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Badge text={threatLevel} color={threatColor} />
            {lastFetch && (
              <div style={{ color: "#555", fontSize: 10, marginTop: 4 }}>
                {lastFetch.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Countdowns */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <Countdown label="MXP FLIGHT" date="2026-03-13" color="#00ff88" />
          <Countdown label="LEAVE START" date="2026-03-13" color="#ffcc00" />
          <Countdown label="LEAVE ENDS"  date="2026-03-22" color="#ff6600" />
          <Countdown label="TODAY"       date={new Date().toISOString().split("T")[0]} color="#888" />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto",
        paddingBottom: 4, borderBottom: "1px solid #222" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? "#1a1a2e" : "transparent",
            border: tab === t.id ? "1px solid #333" : "1px solid transparent",
            color: tab === t.id ? "#fff" : "#666",
            borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            fontSize: 12, whiteSpace: "nowrap", fontFamily: "inherit",
            transition: "all 0.15s"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ color: "#888", textAlign: "center", padding: 48 }}>
          Connecting to Crisis API...
        </div>
      ) : (
        <>
          {tab === "live"         && <LiveNowTab status={status} />}
          {tab === "scenarios"    && <ScenariosTab scenarios={scenarios} />}
          {tab === "intel"        && <IntelTab news={news} />}
          {tab === "repatriation" && <RepatriationTab status={status} />}
          {tab === "status"       && <StatusTab status={status} scenarios={scenarios} />}
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #1a1a1a",
        color: "#444", fontSize: 10, textAlign: "center" }}>
        Auto-refresh every 60s • Bot: @NinoBach_bot • Crisis Command v4.0
      </div>
    </div>
  );
}
