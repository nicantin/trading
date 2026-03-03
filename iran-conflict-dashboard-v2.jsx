import { useState, useCallback } from "react";

const CONFLICT_START = new Date("2026-02-28T00:00:00Z");
function getDayCount() {
  return Math.ceil((new Date() - CONFLICT_START) / (1000 * 60 * 60 * 24));
}

// ─── ESCALATION SCORE COMPONENTS ───
const ESCAL_COMPONENTS = [
  { name: "Hormuz Fermeture", weight: 25, score: 9, note: "De facto fermé, -70% transit, 150+ tankers ancrés" },
  { name: "Intensité Militaire", weight: 20, score: 8, note: "Jour 3, frappes continues, 6 soldats US KIA" },
  { name: "Riposte Iran", weight: 15, score: 8, note: "Missiles sur Israël, Dubai, Doha, bases US" },
  { name: "Escalation Régionale", weight: 15, score: 7, note: "Hezbollah engagé, Ras Tanura attaqué, vols suspendus" },
  { name: "Diplomatie", weight: 15, score: 3, note: "Iran mentionne vouloir négocier, mais 'will not negotiate' aussi" },
  { name: "Risque Nucléaire", weight: 10, score: 6, note: "Natanz frappé, programme dégradé mais pas éliminé" },
];
const compositeScore = () => {
  const totalWeight = ESCAL_COMPONENTS.reduce((a, c) => a + c.weight, 0);
  return (ESCAL_COMPONENTS.reduce((a, c) => a + c.score * c.weight, 0) / totalWeight).toFixed(1);
};

// ─── PHASES ───
const PHASES = [
  { id: "buildup", label: "Buildup", range: "Jan-Feb", status: "completed" },
  { id: "strike", label: "Frappes Initiales", range: "28 Fév", status: "completed" },
  { id: "retaliation", label: "Riposte Iran", range: "1-2 Mar", status: "active" },
  { id: "hormuz", label: "Fermeture Hormuz", range: "1 Mar+", status: "active" },
  { id: "attrition", label: "Attrition / Dégradation", range: "Sem 1-3", status: "upcoming" },
  { id: "negotiation", label: "Fenêtre Négociation", range: "Sem 2-5", status: "upcoming" },
  { id: "ceasefire", label: "Cessez-le-feu", range: "Sem 4-8", status: "upcoming" },
  { id: "normalization", label: "Réouverture Hormuz", range: "Post-cessez", status: "upcoming" },
];

// ─── SCENARIOS ───
const SCENARIOS = [
  {
    id: "bull",
    label: "BULL — Escalation Prolongée",
    prob: "25%",
    color: "#22c55e",
    description: "Hormuz fermé 3+ semaines, conflit s'élargit, SPR non déployé",
    targets: [
      { sector: "Brent", value: "$100-120/bbl" },
      { sector: "Or", value: "$5,600-6,000/oz" },
      { sector: "Tankers (BDTI)", value: "+80-120% vs pré-conflit" },
      { sector: "O&G CDN (XEG)", value: "+25-40%" },
      { sector: "Potash (NTR)", value: "+15-25%" },
      { sector: "UAE ETF (short)", value: "-25-35%" },
    ],
  },
  {
    id: "base",
    label: "BASE — Résolution 4-5 semaines",
    prob: "55%",
    color: "#f59e0b",
    description: "Trump timeline (4-5 sem), Hormuz rouvre progressivement sem 3-4, négociations",
    targets: [
      { sector: "Brent", value: "$85-95/bbl → retour $70" },
      { sector: "Or", value: "$5,400-5,600 → $5,200" },
      { sector: "Tankers (BDTI)", value: "+40-60% → normalisation rapide" },
      { sector: "O&G CDN (XEG)", value: "+15-20% → retour partiel" },
      { sector: "Potash (NTR)", value: "+10-15%" },
      { sector: "UAE ETF (short)", value: "-15-20% → recovery lente" },
    ],
  },
  {
    id: "bear",
    label: "BEAR — Dé-escalation Rapide",
    prob: "20%",
    color: "#ef4444",
    description: "Iran capitule vite, Hormuz rouvre en <10 jours, deal rapide",
    targets: [
      { sector: "Brent", value: "Retour $68-72/bbl" },
      { sector: "Or", value: "Retour $5,000-5,100" },
      { sector: "Tankers (BDTI)", value: "Collapse rapide aux niveaux pré-conflit" },
      { sector: "O&G CDN (XEG)", value: "Give-back de 50-70% des gains" },
      { sector: "Potash (NTR)", value: "Flat — planting season soutient" },
      { sector: "UAE ETF (short)", value: "V-shape recovery, short squeeze" },
    ],
  },
];

// ─── SECTORS WITH TICKERS ───
const SECTORS = [
  {
    id: "tankers", name: "Tankers / Shipping", icon: "⚓", color: "#0ea5e9",
    horizon: "Swing → Position",
    tickers: [
      { symbol: "STNG", name: "Scorpio Tankers", note: "Product tankers, forte expo" },
      { symbol: "FRO", name: "Frontline", note: "VLCC, très leveragé au spot" },
      { symbol: "INSW", name: "International Seaways", note: "Mix crude + product" },
      { symbol: "DHT", name: "DHT Holdings", note: "VLCC pure play" },
      { symbol: "TNK", name: "Teekay Tankers", note: "Mid-size tankers" },
      { symbol: "ASC", name: "Ardmore Shipping", note: "Product tankers smaller" },
      { symbol: "SFL", name: "SFL Corp", note: "Diversifié, inclut tankers" },
    ],
    etfs: [{ symbol: "XLE", note: "Proxy large cap energy" }],
    kpis: [
      { name: "Transit Hormuz", val: "-70%", sig: "bull", src: "MarineTraffic" },
      { name: "BDTI", val: "Spiking", sig: "bull", src: "Baltic Exchange" },
      { name: "War Risk Premium", val: "+50%", sig: "bull", src: "Lloyd's List" },
      { name: "Cape Rerouting", val: "Actif", sig: "bull", src: "Maersk/Hapag" },
      { name: "Tankers Ancrés", val: "150+", sig: "bull", src: "MarineTraffic AIS" },
    ],
    exhaustion: [
      "BDTI décline 2+ jours consécutifs malgré Hormuz fermé",
      "Assureurs reprennent la couverture Gulf",
      "Premier tanker traverse Hormuz avec succès",
      "Volume decay >30% sur tanker equities (3-day avg)",
      "US Navy annonce programme d'escorte de convois",
    ],
    exit: "PREMIER à sortir. Tanker rates collapse en 2-5 jours post-réouverture.",
  },
  {
    id: "oilgas", name: "O&G Canadien", icon: "🛢️", color: "#f59e0b",
    horizon: "Position (2-6 sem)",
    tickers: [
      { symbol: "CNQ", name: "Canadian Natural Resources", note: "Plus gros producteur CDN" },
      { symbol: "SU", name: "Suncor Energy", note: "Intégré, raffinage + production" },
      { symbol: "CVE", name: "Cenovus Energy", note: "Oil sands, leveragé au WCS" },
      { symbol: "IMO", name: "Imperial Oil", note: "Contrôlé par Exxon" },
      { symbol: "TOU", name: "Tourmaline Oil", note: "Natgas CDN, si EU gas spill" },
      { symbol: "ARX", name: "ARC Resources", note: "Montney play" },
      { symbol: "WCP", name: "Whitecap Resources", note: "Light oil, bon dividende" },
      { symbol: "BTE", name: "Baytex Energy", note: "Eagle Ford + CDN, plus leveragé" },
    ],
    etfs: [
      { symbol: "XEG.TO", note: "iShares S&P/TSX Capped Energy" },
      { symbol: "ZEO.TO", note: "BMO Equal Weight Oil & Gas" },
    ],
    kpis: [
      { name: "Brent", val: "~$80/bbl", sig: "bull", src: "TradingView" },
      { name: "WTI", val: "~$72/bbl", sig: "bull", src: "TradingView" },
      { name: "WCS Discount", val: "Monitor", sig: "neutral", src: "Net Energy" },
      { name: "TMX Pipeline", val: "Stable", sig: "bull", src: "Trans Mountain" },
      { name: "SPR Release", val: "Aucun", sig: "neutral", src: "DOE/WH" },
      { name: "OPEC+ Output", val: "+206k bpd", sig: "watch", src: "OPEC" },
    ],
    exhaustion: [
      "Trump tweet sur baisser le prix du gas / SPR release",
      "OPEC+ annonce surge output d'urgence",
      "Brent échoue à casser $100 malgré Hormuz fermé",
      "WCS-WTI spread > $15 (CDN bearish spécifique)",
      "RSI divergence sur XEG — prix up, RSI down",
    ],
    exit: "Plus long que tankers (avantage TMX non-Hormuz). Trimmer sur SPR/OPEC. Full exit sur cessez-le-feu.",
  },
  {
    id: "gold", name: "Or / Gold", icon: "🥇", color: "#eab308",
    horizon: "Core + trade autour",
    tickers: [
      { symbol: "AEM", name: "Agnico Eagle", note: "Top gold miner CDN, Navellier pick" },
      { symbol: "ABX / GOLD", name: "Barrick Gold", note: "Global diversifié" },
      { symbol: "FNV", name: "Franco-Nevada", note: "Royalty/streaming, moins leveragé" },
      { symbol: "WPM", name: "Wheaton Precious Metals", note: "Streaming, or + argent" },
      { symbol: "K.TO", name: "Kinross Gold", note: "Mid-tier, plus leveragé au spot" },
    ],
    etfs: [
      { symbol: "GLD", note: "SPDR Gold Trust (spot gold)" },
      { symbol: "GDX", note: "VanEck Gold Miners" },
      { symbol: "GDXJ", note: "VanEck Junior Gold Miners" },
      { symbol: "IAU", note: "iShares Gold Trust" },
    ],
    kpis: [
      { name: "Or Spot", val: "$5,300-5,400", sig: "bull", src: "Kitco" },
      { name: "GLD Flows", val: "Surging", sig: "bull", src: "ETF.com" },
      { name: "Real Rates", val: "Watch", sig: "neutral", src: "FRED" },
      { name: "DXY", val: "Fort", sig: "mixed", src: "TradingView" },
      { name: "Dubai Gold Route", val: "Perturbé", sig: "bull", src: "Bloomberg" },
    ],
    exhaustion: [
      "Or échoue à casser ATH Jan ($5,600) sur fort volume",
      "Fed signale hausse de taux anti-inflation guerre",
      "GLD outflows 2+ jours consécutifs",
      "Gold/Oil ratio compresse (pétrole monte plus vite)",
      "VIX retombe sous niveaux pré-conflit",
    ],
    exit: "DERNIER à sortir. Core = keep. Trade le premium. Exit total seulement si dé-escalation + Hormuz rouvert + Fed hawkish.",
  },
  {
    id: "potash", name: "Fertilisants / Potash", icon: "🌾", color: "#22c55e",
    horizon: "Position (3-8 sem)",
    tickers: [
      { symbol: "NTR", name: "Nutrien", note: "Plus gros producteur potash mondial, CDN" },
      { symbol: "MOS", name: "Mosaic Company", note: "Potash + phosphate US" },
      { symbol: "IPI", name: "Intrepid Potash", note: "Small cap, plus leveragé" },
      { symbol: "ICL", name: "ICL Group", note: "Israélien — double expo conflit + potash" },
      { symbol: "CF", name: "CF Industries", note: "Nitrogen fertilizer, expo natgas cost" },
    ],
    etfs: [
      { symbol: "SOIL", note: "Global X Fertilizers/Potash ETF" },
    ],
    kpis: [
      { name: "Potash Spot (MOP)", val: "Rising", sig: "bull", src: "CRU/Argus" },
      { name: "EU Natgas", val: "+40%", sig: "bull", src: "ICE" },
      { name: "Planting Season", val: "Mar-Mai", sig: "bull", src: "USDA" },
      { name: "Urea Prices", val: "Monitor", sig: "neutral", src: "Green Markets" },
      { name: "Russia/Belarus", val: "Toujours contraint", sig: "bull", src: "IFA" },
    ],
    exhaustion: [
      "Hormuz rouvre → routes fertilisants normalisent",
      "EU natgas stabilise (Qatar reprend LNG)",
      "Planting season passe le peak (fin mai) → demand cliff",
      "Acheteurs annoncent inventaires suffisants",
      "Volume drops sur NTR/MOS malgré prix en hausse",
    ],
    exit: "SLEEPER PLAY. Tenir jusqu'en mai sauf normalisation Hormuz. Supply chain recovery plus lente que pétrole.",
  },
  {
    id: "gulf", name: "Gulf Short (Dubai/UAE)", icon: "🏗️", color: "#ef4444",
    horizon: "Swing (1-4 sem)",
    tickers: [
      { symbol: "UAE", name: "iShares MSCI UAE ETF", note: "SEUL véhicule US-listed. ~$20.40, vol 2.25M (spike). 25% real estate (Emaar), 38% financials." },
      { symbol: "EMAAR (DFM)", name: "Emaar Properties", note: "Direct sur DFM si accès. -4% aujourd'hui." },
    ],
    etfs: [
      { symbol: "UAE", note: "iShares MSCI UAE — seul ETF pur UAE listé aux US" },
    ],
    kpis: [
      { name: "UAE ETF Price", val: "$20.40 (-6% du high)", sig: "bear_target", src: "Robinhood/IBKR" },
      { name: "UAE Volume", val: "2.25M (2.4x avg)", sig: "bear_target", src: "Nasdaq" },
      { name: "Dubai Vols", val: "Suspendus", sig: "bear_target", src: "Emirates/FlyDubai" },
      { name: "Expat Evacuations", val: "En cours", sig: "bear_target", src: "State Dept/UK FCO" },
      { name: "Dubai Gold Flows", val: "Coupés", sig: "bear_target", src: "Bloomberg" },
      { name: "Ras Tanura Attack", val: "Raffinerie touchée", sig: "bear_target", src: "Saudi TV/Reuters" },
    ],
    exhaustion: [
      "Vols commerciaux reprennent à Dubai/Abu Dhabi",
      "State Dept downgrade 'DEPART NOW' → advisory normal",
      "Expats commencent à revenir (visa data, flight bookings)",
      "Emaar/ALDAR rebondissent sur volume",
      "UAE ETF volume retombe au avg normal (~930K)",
      "⚠️ RISQUE SHORT SQUEEZE: petit float, si ceasefire rapide = V-shape",
    ],
    exit: "SHORT TACTIQUE. Cover si: vols reprennent + cessez-le-feu. ATTENTION: petit AUM ($224M), options probablement illiquides. Préférer short selling direct sur IBKR si shares available. Sizing: PETIT — max 5-8% du portfolio, risque de squeeze élevé.",
    thesisNote: "La thèse: Dubai RE + tourism + business hub dépendent des vols, de la sécurité perçue et des flux de capitaux. Missiles sur Dubai/Abu Dhabi = expats paniquent, transactions gèlent, développeurs (Emaar 14.6% de UAE ETF) souffrent. Le trade fonctionne tant que les explosions continuent dans le Gulf.",
  },
];

// ─── DE-ESCALATION SIGNALS ───
const initDeescSignals = () => [
  { cat: "Diplomatique", signals: [
    { text: "Iran temporary council ouvre back-channel", weight: 3, status: "rumored" },
    { text: "Trump engage avec nouveau leadership iranien", weight: 4, status: "pending" },
    { text: "Médiation Oman/Qatar formelle reprend", weight: 3, status: "inactive" },
    { text: "Résolution Conseil de Sécurité ONU", weight: 2, status: "inactive" },
  ]},
  { cat: "Militaire", signals: [
    { text: "Marine iranienne largement détruite", weight: 4, status: "developing" },
    { text: "Batteries côtières IRGC neutralisées", weight: 5, status: "pending" },
    { text: "US annonce objectifs de mission atteints", weight: 5, status: "pending" },
    { text: "Inventaires missiles Iran épuisés", weight: 3, status: "pending" },
    { text: "Hezbollah accepte cessez-le-feu séparé", weight: 3, status: "inactive" },
  ]},
  { cat: "Maritime", signals: [
    { text: "Premier tanker commercial traverse Hormuz", weight: 5, status: "pending" },
    { text: "US Navy annonce escorte de convois", weight: 4, status: "pending" },
    { text: "Primes assurance guerre baissent", weight: 4, status: "pending" },
    { text: "Maersk/Hapag-Lloyd reprennent transit", weight: 5, status: "pending" },
    { text: "AIS montre reprise du trafic Hormuz (+30%)", weight: 5, status: "pending" },
  ]},
  { cat: "Marché", signals: [
    { text: "Courbe futures pétrole passe en contango", weight: 3, status: "pending" },
    { text: "VIX en baisse soutenue", weight: 2, status: "pending" },
    { text: "Actions défense sous-performent SPY", weight: 2, status: "pending" },
    { text: "Ratio Gold/Oil normalise", weight: 2, status: "pending" },
    { text: "UAE ETF rebondit sur volume", weight: 3, status: "pending" },
  ]},
];

const STATUSES = ["inactive", "rumored", "developing", "pending", "confirmed"];
const STATUS_COLORS = { inactive: "#1e293b", rumored: "#f59e0b", developing: "#3b82f6", pending: "#475569", confirmed: "#22c55e" };
const SIG_COLORS = { bull: "#22c55e", watch: "#f59e0b", neutral: "#64748b", mixed: "#a78bfa", bear_target: "#ef4444" };

const FREE_SOURCES = [
  { name: "MarineTraffic", url: "marinetraffic.com", use: "AIS vessel tracking, Hormuz transit count", freq: "Daily" },
  { name: "TradingView", url: "tradingview.com", use: "Prix, RSI, volume, spreads, ratio charts", freq: "Real-time" },
  { name: "FRED", url: "fred.stlouisfed.org", use: "Real rates, DXY, macro data", freq: "Daily" },
  { name: "CENTCOM", url: "centcom.mil", use: "Opérations militaires US officielles", freq: "As released" },
  { name: "Kitco", url: "kitco.com", use: "Gold spot, métaux", freq: "Real-time" },
  { name: "Hellenic Shipping", url: "hellenicshippingnews.com", use: "BDTI/BCTI delayed", freq: "Daily" },
  { name: "UKMTO", url: "ukmto.org", use: "Advisories sécurité maritime", freq: "As released" },
  { name: "ETF.com", url: "etf.com", use: "GLD/commodity ETF flows", freq: "Daily" },
  { name: "OPEC", url: "opec.org", use: "Output decisions", freq: "As released" },
  { name: "Dryad Global", url: "dryadglobal.com", use: "Threat assessments maritime", freq: "As released" },
];

// ─── MINI BAR CHART ───
function MiniBar({ values, maxVal, color, labels }) {
  const h = 48;
  const barW = Math.min(28, Math.floor(200 / values.length));
  const gap = 3;
  return (
    <div style={{ display: "inline-flex", alignItems: "flex-end", gap: `${gap}px`, height: h }}>
      {values.map((v, i) => {
        const barH = Math.max(2, (v / maxVal) * h);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <div style={{ width: barW, height: barH, background: color, borderRadius: "2px 2px 0 0", opacity: 0.6 + (v / maxVal) * 0.4, transition: "height 0.3s" }} title={labels?.[i] ? `${labels[i]}: ${v}` : `${v}`} />
            {labels && <span style={{ fontSize: "7px", color: "#475569" }}>{labels[i]}</span>}
          </div>
        );
      })}
    </div>
  );
}

function ScoreGauge({ score, max = 10 }) {
  const pct = (score / max) * 100;
  const gaugeColor = score >= 8 ? "#ef4444" : score >= 6 ? "#f59e0b" : score >= 4 ? "#eab308" : "#22c55e";
  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "10px", color: "#22c55e" }}>DÉ-ESCALATION</span>
        <span style={{ fontSize: "10px", color: "#ef4444" }}>ESCALATION MAX</span>
      </div>
      <div style={{ height: "10px", background: "#1e293b", borderRadius: "5px", overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, #22c55e 0%, #eab308 40%, #f59e0b 60%, #ef4444 100%)",
          opacity: 0.3, borderRadius: "5px",
        }} />
        <div style={{
          position: "absolute", left: `${pct}%`, top: "-2px",
          width: "14px", height: "14px", borderRadius: "50%",
          background: gaugeColor, border: "2px solid #0a0e17",
          transform: "translateX(-50%)", transition: "left 0.5s",
          boxShadow: `0 0 8px ${gaugeColor}80`,
        }} />
      </div>
      <div style={{ textAlign: "center", marginTop: "6px" }}>
        <span style={{ fontSize: "28px", fontWeight: 800, color: gaugeColor, fontFamily: "'Space Grotesk', sans-serif" }}>{score}</span>
        <span style={{ fontSize: "14px", color: "#64748b" }}>/10</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [sector, setSector] = useState("tankers");
  const [scenario, setScenario] = useState("base");
  const [deesc, setDeesc] = useState(initDeescSignals);

  const dayCount = getDayCount();
  const score = compositeScore();
  const sec = SECTORS.find(s => s.id === sector);
  const scen = SCENARIOS.find(s => s.id === scenario);

  const cycleStatus = useCallback((catIdx, sigIdx) => {
    setDeesc(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const cur = next[catIdx].signals[sigIdx].status;
      const idx = STATUSES.indexOf(cur);
      next[catIdx].signals[sigIdx].status = STATUSES[(idx + 1) % STATUSES.length];
      return next;
    });
  }, []);

  const confirmedCount = deesc.reduce((a, c) => a + c.signals.filter(s => s.status === "confirmed").length, 0);
  const totalSignals = deesc.reduce((a, c) => a + c.signals.length, 0);

  const TABS = [
    { id: "overview", label: "SITUATION" },
    { id: "sectors", label: "SECTEURS" },
    { id: "scenarios", label: "SCÉNARIOS" },
    { id: "deesc", label: "SORTIE" },
    { id: "sources", label: "SOURCES" },
  ];

  return (
    <div style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: "#0a0e17", color: "#e2e8f0", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#0a0e17} ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}
        @keyframes pulse-red{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        button{font-family:inherit;cursor:pointer}
        .card{background:#0f1729;border:1px solid #1e293b;border-radius:6px;padding:14px}
        .tag{font-size:9px;padding:2px 6px;border-radius:2px;letter-spacing:.5px;font-weight:600;display:inline-block}
      `}</style>

      {/* ═══ HEADER ═══ */}
      <div style={{ background: "linear-gradient(180deg,#0f1729,#0a0e17)", borderBottom: "1px solid #1e293b", padding: "16px 20px 0" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,#ef4444,#f59e0b,#ef4444)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
              <span style={{ fontSize: "9px", letterSpacing: "3px", color: "#ef4444", fontWeight: 600, animation: "pulse-red 2s infinite" }}>● LIVE</span>
              <span style={{ fontSize: "9px", letterSpacing: "2px", color: "#64748b" }}>JOUR {dayCount} | SCORE {score}/10</span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: "18px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px" }}>
              IRAN CONFLICT — TRADING DASHBOARD v2
            </h1>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {SECTORS.map(s => (
              <span key={s.id} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "3px", background: s.color + "15", color: s.color, border: `1px solid ${s.color}30` }}>
                {s.icon} {s.name.split(" / ")[0].split(" (")[0]}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "1px", marginTop: "12px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? "#1e293b" : "transparent",
              color: tab === t.id ? "#f1f5f9" : "#475569",
              border: `1px solid ${tab === t.id ? "#334155" : "transparent"}`,
              borderBottom: "none", padding: "7px 14px", fontSize: "10px",
              letterSpacing: "1px", fontWeight: 500, borderRadius: "4px 4px 0 0",
            }}>{t.label}{t.id === "deesc" && confirmedCount > 0 && <span style={{ marginLeft: 4, color: "#22c55e" }}>({confirmedCount})</span>}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 20px", animation: "fadeIn .25s ease" }}>

        {/* ═══ OVERVIEW ═══ */}
        {tab === "overview" && (<div>
          {/* Score Gauge */}
          <div className="card" style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "1px", marginBottom: "10px" }}>SCORE COMPOSITE D'ESCALATION</div>
            <ScoreGauge score={parseFloat(score)} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", marginTop: "12px" }}>
              {ESCAL_COMPONENTS.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                  <div style={{ display: "flex", gap: "1px" }}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <div key={j} style={{ width: "3px", height: "10px", borderRadius: "1px", background: j < c.score ? (c.score >= 7 ? "#ef4444" : c.score >= 4 ? "#f59e0b" : "#22c55e") : "#1e293b" }} />
                    ))}
                  </div>
                  <span style={{ color: "#94a3b8", flex: 1, minWidth: 0 }}>{c.name}</span>
                  <span style={{ color: "#475569", fontSize: "9px" }}>{c.weight}%w</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px", marginBottom: "16px" }}>
            {[
              { label: "Brent", val: "~$80", unit: "/bbl", delta: "+13%", color: "#f59e0b", bars: [72,73,73,74,80], barLabels: ["W","T","F","Sa","Mo"] },
              { label: "Or Spot", val: "$5,400", unit: "/oz", delta: "+2.9%", color: "#eab308", bars: [5100,5100,5200,5300,5400], barLabels: ["W","T","F","Sa","Mo"] },
              { label: "Hormuz", val: "-70%", unit: "trafic", delta: "150+ ancrés", color: "#ef4444", bars: [100,100,95,30,30], barLabels: ["W","T","F","Sa","Mo"] },
              { label: "EU Gas", val: "+40%", unit: "", delta: "Qatar halt", color: "#3b82f6", bars: [50,50,52,70,90], barLabels: ["W","T","F","Sa","Mo"] },
              { label: "UAE ETF", val: "$20.40", unit: "", delta: "-8% du high", color: "#ef4444", bars: [22,22,21.5,20.5,20.4], barLabels: ["W","T","F","Sa","Mo"] },
              { label: "VIX", val: "Élevé", unit: "", delta: "Risk-off", color: "#8b5cf6", bars: [18,19,22,28,30], barLabels: ["W","T","F","Sa","Mo"] },
            ].map((m, i) => (
              <div key={i} className="card" style={{ animation: `fadeIn .2s ease ${i * .04}s both` }}>
                <div style={{ fontSize: "9px", color: "#475569", letterSpacing: "1px", marginBottom: "4px" }}>{m.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                  <span style={{ fontSize: "17px", fontWeight: 700, color: m.color, fontFamily: "'Space Grotesk'" }}>{m.val}</span>
                  <span style={{ fontSize: "9px", color: "#475569" }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: "9px", color: m.color, marginBottom: "6px" }}>{m.delta}</div>
                <MiniBar values={m.bars} maxVal={Math.max(...m.bars) * 1.1} color={m.color} labels={m.barLabels} />
              </div>
            ))}
          </div>

          {/* Timeline compact */}
          <div className="card">
            <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "1px", marginBottom: "8px" }}>PROGRESSION DU CONFLIT</div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {PHASES.map(p => (
                <div key={p.id} style={{
                  padding: "4px 10px", borderRadius: "3px", fontSize: "10px",
                  background: p.status === "active" ? "#ef444420" : p.status === "completed" ? "#1e293b" : "#0a0e17",
                  border: `1px solid ${p.status === "active" ? "#ef4444" : "#1e293b"}`,
                  color: p.status === "active" ? "#ef4444" : p.status === "completed" ? "#64748b" : "#334155",
                  animation: p.status === "active" ? "pulse-red 3s infinite" : "none",
                }}>
                  {p.label} <span style={{ fontSize: "8px", opacity: .7 }}>{p.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>)}

        {/* ═══ SECTORS ═══ */}
        {tab === "sectors" && (<div>
          <div style={{ display: "flex", gap: "4px", marginBottom: "14px", flexWrap: "wrap" }}>
            {SECTORS.map(s => (
              <button key={s.id} onClick={() => setSector(s.id)} style={{
                background: sector === s.id ? s.color + "20" : "#0f1729",
                border: `1px solid ${sector === s.id ? s.color : "#1e293b"}`,
                color: sector === s.id ? s.color : "#475569",
                padding: "6px 12px", fontSize: "11px", borderRadius: "4px",
                fontWeight: sector === s.id ? 600 : 400,
              }}>{s.icon} {s.name.split(" / ")[0].split(" (")[0]}</button>
            ))}
          </div>

          {sec && (<div style={{ animation: "fadeIn .2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: sec.color, fontFamily: "'Space Grotesk'" }}>{sec.icon} {sec.name}</span>
              <span className="tag" style={{ background: "#1e293b", color: "#94a3b8" }}>HORIZON: {sec.horizon}</span>
            </div>

            {/* Thesis note for Gulf */}
            {sec.thesisNote && (
              <div className="card" style={{ borderLeft: `3px solid ${sec.color}`, marginBottom: "12px", fontSize: "11px", color: "#cbd5e1", lineHeight: 1.6 }}>
                <span style={{ color: sec.color, fontWeight: 600 }}>📋 THÈSE :</span> {sec.thesisNote}
              </div>
            )}

            {/* Tickers */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "1px", marginBottom: "6px" }}>TICKERS INDIVIDUELS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {sec.tickers.map((t, i) => (
                  <div key={i} title={t.note} style={{
                    padding: "4px 8px", background: sec.color + "10", border: `1px solid ${sec.color}25`,
                    borderRadius: "3px", fontSize: "11px",
                  }}>
                    <span style={{ color: sec.color, fontWeight: 600 }}>{t.symbol}</span>
                    <span style={{ color: "#64748b", marginLeft: "4px", fontSize: "9px" }}>{t.name}</span>
                  </div>
                ))}
              </div>
              {sec.etfs.length > 0 && (
                <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                  {sec.etfs.map((e, i) => (
                    <span key={i} className="tag" style={{ background: "#1e293b", color: "#94a3b8" }}>ETF: {e.symbol} — {e.note}</span>
                  ))}
                </div>
              )}
            </div>

            {/* KPIs */}
            <div className="card" style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "1px", marginBottom: "8px" }}>INDICATEURS CLÉS</div>
              {sec.kpis.map((k, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < sec.kpis.length - 1 ? "1px solid #1e293b" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: SIG_COLORS[k.sig] || "#475569" }} />
                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>{k.name}</span>
                    <span style={{ fontSize: "9px", color: "#475569" }}>{k.src}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: sec.color }}>{k.val}</span>
                </div>
              ))}
            </div>

            {/* Exhaustion + Exit */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="card">
                <div style={{ fontSize: "10px", color: "#ef4444", letterSpacing: "1px", marginBottom: "6px" }}>⚠️ SIGNAUX EXHAUSTION</div>
                {sec.exhaustion.map((e, i) => (
                  <div key={i} style={{ fontSize: "11px", color: "#94a3b8", padding: "3px 0", borderBottom: i < sec.exhaustion.length - 1 ? "1px solid #1e293b10" : "none", display: "flex", gap: "6px" }}>
                    <span style={{ color: "#ef4444", fontWeight: 600, flexShrink: 0 }}>#{i + 1}</span>
                    <span>{e}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ borderLeft: `3px solid ${sec.color}` }}>
                <div style={{ fontSize: "10px", color: sec.color, letterSpacing: "1px", marginBottom: "6px" }}>🎯 FENÊTRE DE SORTIE</div>
                <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.6 }}>{sec.exit}</div>
              </div>
            </div>
          </div>)}
        </div>)}

        {/* ═══ SCENARIOS ═══ */}
        {tab === "scenarios" && (<div>
          <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
            {SCENARIOS.map(s => (
              <button key={s.id} onClick={() => setScenario(s.id)} style={{
                background: scenario === s.id ? s.color + "20" : "#0f1729",
                border: `1px solid ${scenario === s.id ? s.color : "#1e293b"}`,
                color: scenario === s.id ? s.color : "#475569",
                padding: "8px 16px", fontSize: "11px", borderRadius: "4px", fontWeight: 600, flex: 1,
              }}>
                <div>{s.label.split(" — ")[0]}</div>
                <div style={{ fontSize: "9px", opacity: .8, fontWeight: 400 }}>{s.prob}</div>
              </button>
            ))}
          </div>

          {scen && (<div style={{ animation: "fadeIn .2s ease" }}>
            <div className="card" style={{ borderLeft: `3px solid ${scen.color}`, marginBottom: "14px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: scen.color, fontFamily: "'Space Grotesk'", marginBottom: "4px" }}>{scen.label}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>Probabilité: {scen.prob}</div>
              <div style={{ fontSize: "12px", color: "#cbd5e1" }}>{scen.description}</div>
            </div>

            <div className="card">
              <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "1px", marginBottom: "10px" }}>PRICE TARGETS PAR SECTEUR</div>
              {scen.targets.map((t, i) => {
                const sectorData = SECTORS.find(s => t.sector.toLowerCase().includes(s.id.substring(0, 4)));
                const col = sectorData?.color || "#94a3b8";
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: i < scen.targets.length - 1 ? "1px solid #1e293b" : "none",
                  }}>
                    <span style={{ fontSize: "12px", color: "#e2e8f0" }}>{t.sector}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: col, fontFamily: "'Space Grotesk'" }}>{t.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Scenario comparison mini-bars */}
            <div className="card" style={{ marginTop: "10px" }}>
              <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "1px", marginBottom: "10px" }}>COMPARAISON PROBABILITÉS</div>
              {SCENARIOS.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", color: s.color, width: "50px", fontWeight: 600 }}>{s.id.toUpperCase()}</span>
                  <div style={{ flex: 1, height: "8px", background: "#1e293b", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${parseInt(s.prob)}%`, background: s.color, borderRadius: "4px", transition: "width .5s" }} />
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8", width: "30px" }}>{s.prob}</span>
                </div>
              ))}
            </div>
          </div>)}
        </div>)}

        {/* ═══ DE-ESCALATION ═══ */}
        {tab === "deesc" && (<div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
            Cliquer sur un statut pour le changer. Quand 3+ signaux "Maritime" → CONFIRMED = fenêtre de sortie principale.
          </div>
          <div style={{ fontSize: "10px", color: "#475569", marginBottom: "14px" }}>
            Confirmés: <span style={{ color: "#22c55e", fontWeight: 600 }}>{confirmedCount}</span>/{totalSignals} | 
            Statuts: <span style={{ color: STATUS_COLORS.inactive }}>■</span> INACTIVE → <span style={{ color: STATUS_COLORS.rumored }}>■</span> RUMORED → <span style={{ color: STATUS_COLORS.developing }}>■</span> DEVELOPING → <span style={{ color: STATUS_COLORS.pending }}>■</span> PENDING → <span style={{ color: STATUS_COLORS.confirmed }}>■</span> CONFIRMED
          </div>

          {deesc.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: "14px", animation: `fadeIn .2s ease ${ci * .05}s both` }}>
              <div style={{ fontSize: "10px", letterSpacing: "1px", color: "#64748b", marginBottom: "6px", fontWeight: 600 }}>{cat.cat.toUpperCase()}</div>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {cat.signals.map((sig, si) => (
                  <div key={si} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", borderBottom: si < cat.signals.length - 1 ? "1px solid #1e293b" : "none",
                  }}>
                    <div style={{ flex: 1, fontSize: "11px", color: "#cbd5e1" }}>{sig.text}</div>
                    <div style={{ display: "flex", gap: "2px", marginRight: "10px" }}>
                      {Array.from({ length: 5 }).map((_, wi) => (
                        <div key={wi} style={{ width: "3px", height: "10px", borderRadius: "1px", background: wi < sig.weight ? "#f59e0b" : "#1e293b" }} />
                      ))}
                    </div>
                    <button onClick={() => cycleStatus(ci, si)} style={{
                      background: STATUS_COLORS[sig.status] + "20",
                      border: `1px solid ${STATUS_COLORS[sig.status]}60`,
                      color: STATUS_COLORS[sig.status],
                      padding: "2px 10px", borderRadius: "3px",
                      fontSize: "9px", fontWeight: 600, letterSpacing: ".5px",
                      minWidth: "80px", textAlign: "center",
                    }}>
                      {sig.status.toUpperCase()}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Exit Framework */}
          <div className="card" style={{ borderTop: "2px solid #f59e0b" }}>
            <div style={{ fontSize: "11px", letterSpacing: "1px", color: "#f59e0b", fontWeight: 600, marginBottom: "10px" }}>🎯 ORDRE DE SORTIE</div>
            <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.8 }}>
              {[
                { n: 1, name: "TANKERS", col: "#0ea5e9", text: "Sortir en premier. 2-5 jours de la réouverture au rate collapse." },
                { n: 2, name: "O&G CDN", col: "#f59e0b", text: "Trimmer sur SPR/OPEC+ surge. Full exit sur cessez-le-feu. WCS spread = early warning." },
                { n: 3, name: "GULF SHORT", col: "#ef4444", text: "Cover dès que vols reprennent + ceasefire. RISQUE SQUEEZE ÉLEVÉ." },
                { n: 4, name: "FERTILISANTS", col: "#22c55e", text: "Tenir → mai (planting season). Supply chain recovery lente." },
                { n: 5, name: "OR", col: "#eab308", text: "Dernier à sortir. Core = keep. Trade le premium. Exit total seulement si dé-escalation + Fed hawkish." },
              ].map(e => (
                <div key={e.n} style={{ marginBottom: "4px" }}>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>{e.n}.</span>{" "}
                  <span style={{ color: e.col, fontWeight: 700 }}>{e.name}</span>{" — "}
                  {e.text}
                </div>
              ))}
            </div>
          </div>
        </div>)}

        {/* ═══ SOURCES ═══ */}
        {tab === "sources" && (<div>
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 80px", gap: "8px", padding: "8px 12px", background: "#1e293b40", fontSize: "9px", letterSpacing: "1px", color: "#475569", fontWeight: 600 }}>
              <span>SOURCE</span><span>UTILITÉ</span><span>FRÉQ</span>
            </div>
            {FREE_SOURCES.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr 80px", gap: "8px", padding: "7px 12px", borderBottom: i < FREE_SOURCES.length - 1 ? "1px solid #1e293b" : "none" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#e2e8f0", fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: "9px", color: "#3b82f6" }}>{s.url}</div>
                </div>
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>{s.use}</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>{s.freq}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ borderLeft: "3px solid #3b82f6" }}>
            <div style={{ fontWeight: 700, color: "#3b82f6", marginBottom: "6px", fontSize: "11px" }}>📋 ROUTINE QUOTIDIENNE</div>
            {[
              ["06h00", "CENTCOM + UKMTO (opérations nuit, incidents maritimes)"],
              ["07h00", "MarineTraffic: tankers ancrés vs en transit Hormuz"],
              ["08h00", "Brent/WTI/Gold ouverture EU, WCS spread, UAE ETF pre-market"],
              ["09h30", "Ouverture NYSE: volume tankers/O&G/gold miners, RSI check"],
              ["12h00", "Scan: OPEC, SPR, assurances maritimes, flight status Dubai"],
              ["16h00", "BDTI/BCTI, ETF flows (GLD, XEG), update matrice dé-escalation"],
              ["20h00", "Synthèse: scoring composite, ajuster positions si nécessaire"],
            ].map(([t, d], i) => (
              <div key={i} style={{ fontSize: "11px", color: "#cbd5e1", padding: "2px 0" }}>
                <span style={{ color: "#475569", marginRight: "8px" }}>{t}</span>{d}
              </div>
            ))}
          </div>
        </div>)}
      </div>

      <div style={{ padding: "8px 20px", borderTop: "1px solid #1e293b", fontSize: "9px", color: "#1e293b", textAlign: "center" }}>
        Données manuelles — Updater via sources listées | {new Date().toLocaleDateString("fr-CA")}
      </div>
    </div>
  );
}
