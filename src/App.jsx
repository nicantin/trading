import { useState, useCallback } from "react";

const CONFLICT_START = new Date("2026-02-28T00:00:00Z");
function getDayCount() {
  return Math.ceil((new Date() - CONFLICT_START) / (1000 * 60 * 60 * 24));
}

// ─── ESCALATION SCORE ───
const ESCAL_COMPONENTS = [
  { name: "Hormuz Fermeture", weight: 25, score: 10 },
  { name: "Intensité Militaire", weight: 20, score: 10 },
  { name: "Riposte Iran", weight: 15, score: 8 },
  { name: "Escalation Régionale", weight: 15, score: 10 },
  { name: "Diplomatie", weight: 15, score: 1 },
  { name: "Risque Nucléaire", weight: 10, score: 8 },
];
const compositeScore = () => {
  const tw = ESCAL_COMPONENTS.reduce((a, c) => a + c.weight, 0);
  return (ESCAL_COMPONENTS.reduce((a, c) => a + c.score * c.weight, 0) / tw).toFixed(1);
};

// ─── PHASES ───
const PHASES = [
  { label: "Buildup", range: "Jan-Fév", status: "completed" },
  { label: "Frappes Initiales", range: "28 Fév", status: "completed" },
  { label: "Riposte Iran", range: "1-4 Mar", status: "active" },
  { label: "Fermeture Hormuz", range: "2 Mar+", status: "active" },
  { label: "Front Liban", range: "2 Mar+", status: "active" },
  { label: "Expansion NATO/Turquie", range: "4 Mar+", status: "active" },
  { label: "Expansion Azerbaïdjan", range: "5 Mar+", status: "active" },
  { label: "Attrition", range: "Sem 1-3", status: "active" },
  { label: "Négociation", range: "Sem 2-5", status: "upcoming" },
  { label: "Cessez-le-feu", range: "Sem 4-8", status: "upcoming" },
  { label: "Réouverture", range: "Post-cessez", status: "upcoming" },
];

// ─── SCENARIOS ───
const SCENARIOS = [
  {
    id: "bull", label: "BULL — Escalation Prolongée", prob: 35, color: "var(--green)",
    desc: "Hormuz fermé 3+ semaines, conflit multi-fronts (Liban, proxies, NATO/Turquie), SPR non déployé, OPEC+ insuffisant. Bushehr menacé.",
    targets: [
      { s: "Brent", v: "$100-120/bbl" }, { s: "Or", v: "$5,800-6,200/oz" },
      { s: "Tankers (VLCC ME-CN)", v: "W700+ / $400K+ day" }, { s: "O&G CDN (XEG)", v: "+25-40%" },
      { s: "Raffineurs US (MPC/VLO)", v: "+30-50% (diesel crack ATH)" },
      { s: "Aluminium NA (CENX/AA)", v: "+20-40% (GCC force majeure)" },
      { s: "Chimie NA (DOW/LYB)", v: "+15-25% (supply shift)" },
      { s: "Potash (NTR)", v: "+15-25%" }, { s: "UAE ETF (short)", v: "-25-35%" },
    ],
  },
  {
    id: "base", label: "BASE — Résolution 4-5 sem", prob: 45, color: "var(--amber)",
    desc: "Trump timeline (4-5 sem), Hormuz rouvre sem 3-4, Iran affaibli militairement, négociations via Oman",
    targets: [
      { s: "Brent", v: "$85-95 → retour $72-76" }, { s: "Or", v: "$5,200-5,500 → $5,000" },
      { s: "Tankers (VLCC ME-CN)", v: "W400-700 → normalise" }, { s: "O&G CDN (XEG)", v: "+15-25% → retour" },
      { s: "Raffineurs US (MPC/VLO)", v: "+15-25% → normalise 48-72h post-Hormuz" },
      { s: "Aluminium NA (CENX/AA)", v: "+10-20% (GCC redémarrage 6-12 mois)" },
      { s: "Chimie NA (DOW/LYB)", v: "+5-15% (avantage structurel)" },
      { s: "Potash (NTR)", v: "+10-15%" }, { s: "UAE ETF (short)", v: "-15-25%" },
    ],
  },
  {
    id: "bear", label: "BEAR — Dé-escalation Rapide", prob: 20, color: "var(--red)",
    desc: "Iran capitule vite (leadership décapité), Hormuz rouvre <10 jours, deal rapide",
    targets: [
      { s: "Brent", v: "Retour $68-72" }, { s: "Or", v: "Retour $5,000-5,100" },
      { s: "Tankers (VLCC ME-CN)", v: "Collapse rapide" }, { s: "O&G CDN (XEG)", v: "Give-back 50-70%" },
      { s: "Raffineurs US (MPC/VLO)", v: "Give-back rapide — cracks normalisent vite" },
      { s: "Aluminium NA (CENX/AA)", v: "Partiel — GCC recovery lent même si Hormuz réouvre" },
      { s: "Chimie NA (DOW/LYB)", v: "Flat/léger give-back — avantage structurel persiste" },
      { s: "Potash (NTR)", v: "Flat (planting soutient)" }, { s: "UAE ETF (short)", v: "V-shape, squeeze" },
    ],
  },
];

// ─── SECTORS ───
const SECTORS = [
  {
    id: "tankers", name: "Tankers / Shipping", icon: "⚓", color: "#0ea5e9", horizon: "Swing → Position",
    tickers: [
      { symbol: "STNG", name: "Scorpio Tankers" }, { symbol: "FRO", name: "Frontline" },
      { symbol: "INSW", name: "Intl Seaways" }, { symbol: "DHT", name: "DHT Holdings" },
      { symbol: "TNK", name: "Teekay Tankers" }, { symbol: "ASC", name: "Ardmore" },
    ],
    etfs: [{ symbol: "XLE", note: "Proxy large cap energy" }],
    kpis: [
      { name: "Transit Hormuz", val: "5 crossings J6 (vs 107 avg) — effectivement fermé J7", sig: "bull", src: "Windward/Wikipedia" },
      { name: "VLCC ME-CN (TD3C)", val: "W700 / $424-481K/day ATH", sig: "bull", src: "LSEG/Sinokor/Baltic" },
      { name: "VLCC Immobilisés", val: "72 VLCCs (8% flotte mondiale)", sig: "bull", src: "Arrow Brokers" },
      { name: "Total Tankers Bloqués", val: "329 crude+product, ~150 à l'ancre hors détroit", sig: "bull", src: "Arrow/AJ/Wikipedia" },
      { name: "Tankers Endommagés", val: "5+ tankers frappés, 2 morts équipage", sig: "bull", src: "Al Jazeera" },
      { name: "P&I Cancel", val: "EFFECTIF depuis 5 mars — transit sans assurance", sig: "bull", src: "Gard/Skuld/London" },
      { name: "Freight $/bbl", val: "$20/bbl ME→CN (vs $2.50 moy 2025) = x8", sig: "bull", src: "Sinokor/Bloomberg" },
      { name: "AIS Jamming", val: "44 zones injection + 92 zones denial dans le Gulf", sig: "bull", src: "Windward" },
      { name: "Trump DFC Insurance", val: "Annoncé, Bessent dit 'annonces à venir' — toujours pas opérationnel", sig: "neutral", src: "CNBC/Bessent" },
      { name: "Navy Escorts", val: "Shipping industry : 'welcome step' mais need 'genuinely safe'", sig: "neutral", src: "NPR/Seanergy CEO" },
      { name: "Bab el-Mandeb", val: "21 crossings J6 (+950% vs jour précédent) — rerouting", sig: "watch", src: "Windward" },
      { name: "STNG", val: "$77-80 (52-wk high $81.85). Strong Buy consensus", sig: "bull", src: "TradingView/Investing" },
      { name: "Kuwait Explosion", val: "Tanker + cargo endommagés, oil spill — zone danger s'élargit", sig: "bull", src: "Windward/AJ" },
    ],
    exhaustion: [
      "DFC insurance opérationnel + premiers tankers acceptent couverture US",
      "US Navy commence escortes effectives (pas juste annonce)",
      "Assureurs P&I reprennent couverture Gulf (post-5 mars)",
      "Premier VLCC traverse Hormuz avec succès sous escorte",
      "VLCC spot rate < $200K/day 2+ jours consécutifs",
      "Volume decay >30% sur tanker equities (3-day avg)",
    ],
    exit: "PREMIER à sortir. Tanker rates collapse en 2-5 jours post-réouverture.",
    histPattern: {
      title: "Tanker War 1984-88 + Gulf War I 1990",
      items: [
        "1984-88 : 400+ navires attaqués dans le Golfe, assurances x3-5x, mais les tankers ont continué à naviguer. Rates élevés soutenus ~4 ans.",
        "1990 : Rates spot +100% sur invasion Kuwait, normalisation rapide (<6 mois) post-libération.",
        "2022-23 : Ukraine = tanker rates TNK +108%, INSW +98%, FRO +70% sur 12 mois (rerouting, sanctions).",
        "⚡ JOUR 7 UPDATE : AIS jamming massif (44 zones injection, 92 denial). Tanker+cargo explosion Kuwait + oil spill — zone danger s'élargit au nord du Gulf. Bab el-Mandeb +950% trafic (rerouting). P&I annulé depuis J5. Bessent dit 'annonces à venir' sur DFC mais toujours rien de concret. Shipping CEOs : 'pas suffisant tant que pas genuinely safe'. Iran strikes Bahrain (raffinerie touchée). Le shipping industry NE REVIENT PAS tant que le conflit dure.",
      ],
      analog: "Tanker War 1987 (Operation Earnest Will — escortes US) MAIS cette fois: W700 vs W225 en 1987, assurances annulées (pas juste majorées), zéro transit vs transit réduit. Aucun comparable historique pour les rates actuels.",
    },
  },
  {
    id: "oilgas", name: "O&G Canadien", icon: "🛢️", color: "#f59e0b", horizon: "Position (2-6 sem)",
    tickers: [
      { symbol: "CNQ", name: "Canadian Natural" }, { symbol: "SU", name: "Suncor" },
      { symbol: "CVE", name: "Cenovus" }, { symbol: "IMO", name: "Imperial Oil" },
      { symbol: "TOU", name: "Tourmaline" }, { symbol: "BTE", name: "Baytex" },
    ],
    etfs: [{ symbol: "XEG.TO", note: "iShares TSX Energy" }, { symbol: "ZEO.TO", note: "BMO Equal Weight O&G" }],
    kpis: [
      { name: "Brent Spot", val: "$89.21 (+22.4% vs semaine passée)", sig: "bull", src: "Commodity.com" },
      { name: "Brent Futures", val: "$84.48 (range $83-86, 52-wk high $86.28)", sig: "bull", src: "Yahoo/Investing" },
      { name: "WTI", val: "$79.88-85.91 (near 52-wk high)", sig: "bull", src: "Commodity.com/CME" },
      { name: "Brent 7-day", val: "+22%+ ($72→$89 spot)", sig: "bull", src: "Commodity.com" },
      { name: "Goldman Q2", val: "$76 avg (+$10). '$100 si Hormuz 5 sem'", sig: "bull", src: "Goldman/Reuters" },
      { name: "UBS 2026", val: "$72 avg (+$10). '>$90 si infra frappée'", sig: "bull", src: "UBS/Reuters" },
      { name: "Iraq Cuts Forcés", val: "-1.5Mbpd (stockage saturé, expansion possible -3Mbpd)", sig: "bull", src: "Reuters/SED" },
      { name: "Oxford Economics", val: "'Sell extreme moves, will fade. Conflit max 2 mois'", sig: "watch", src: "Oxford/Alpine Macro" },
      { name: "XLE Retail Inflow", val: "$49M lundi — record all-time", sig: "bull", src: "VandaTrack" },
      { name: "TMX Pipeline", val: "Stable — avantage CDN (Brent Pacific pricing)", sig: "bull", src: "Trans Mountain" },
      { name: "Gasoline US", val: "$3.19+ gal (+22¢ vs semaine passée)", sig: "bull", src: "AAA" },
      { name: "Ras Tanura (Aramco)", val: "Drone iranien sur terminal chargement — MoD Saoudi", sig: "bull", src: "Investing.com/Reuters" },
      { name: "CDN = Best Positioned", val: "OilPrice: 'most reliable oil supplier' — TMX non-Hormuz", sig: "bull", src: "OilPrice.com" },
    ],
    exhaustion: [
      "Trump tweet baisser gas / SPR release (Rubio dit 'pas encore')",
      "OPEC+ annonce surge output d'urgence (actuellement +206k insuffisant)",
      "Brent échoue à casser $100 malgré Hormuz fermé",
      "WCS-WTI spread > $15",
      "RSI divergence sur XEG — prix up, RSI down",
    ],
    exit: "Plus long que tankers (avantage TMX). Trimmer sur SPR/OPEC. Full exit sur cessez-le-feu.",
    histPattern: {
      title: "Gulf War I 1990 + Révolution Iran 1979",
      items: [
        "1990 : Brent $17→$46 (+170%) en 10 semaines. Retour à $20 dès Desert Storm (jan 1991).",
        "1979 : Brent $14→$39 (+179%). Recovery 2-3 ans. Mais contexte différent (pas de US shale, pas de SPR).",
        "2003 Irak : Brent $28→$37 (+32%), retour en 3 mois. Victoire rapide = spike court.",
        "⚡ JOUR 7 (6 mars) : Brent spot $89 (+22% 1 sem). Hegseth 'just getting started'. Israel 'next phase' — 2,500 frappes, 6,000+ armes. Bahrain frappé (hôtel, résidentiel, raffinerie). Azerbaijan frappé pour 1re fois. Gasoline $3.19+. Oxford Economics : 'max 2 mois, sell extreme moves'. MAIS Iran dit 'ready for invasion'. Aucun signe de dé-escalation.",
      ],
      analog: "Gulf War I pour la durée (Trump dit 4-5 sem). Mais supply buffers modernes (SPR, shale) limitent vs 1973/1979.",
    },
  },
  {
    id: "gold", name: "Or / Gold", icon: "🥇", color: "#eab308", horizon: "Core + trade autour",
    tickers: [
      { symbol: "AEM", name: "Agnico Eagle" }, { symbol: "ABX/GOLD", name: "Barrick" },
      { symbol: "FNV", name: "Franco-Nevada" }, { symbol: "WPM", name: "Wheaton PM" },
      { symbol: "K.TO", name: "Kinross" },
    ],
    etfs: [{ symbol: "GLD", note: "SPDR Gold Trust" }, { symbol: "GDX", note: "Gold Miners" }, { symbol: "GDXJ", note: "Junior Miners" }],
    kpis: [
      { name: "Or Spot", val: "$5,079-5,102 (correction continue du ATH)", sig: "mixed", src: "LiteFinance/LongForecast" },
      { name: "Or Range J7", val: "$5,074-$5,151", sig: "mixed", src: "LongForecast" },
      { name: "Or ATH Semaine", val: "$5,400 (lundi 2 mars, +2%)", sig: "bull", src: "CNN/Yahoo" },
      { name: "Or Selloff J3-7", val: "De $5,400 → $5,079 (-6%). DXY fort + profit-taking", sig: "watch", src: "Multiple" },
      { name: "Dubai Air Cargo", val: "HALT — 20% global gold flows bloqués (2e exportateur)", sig: "bull", src: "FT/USAGOLD" },
      { name: "Physical Premium", val: "India flip discount→parity en 48h. Asian premiums up", sig: "bull", src: "USAGOLD/WGC" },
      { name: "DXY", val: "~99 (force = headwind for gold)", sig: "mixed", src: "Yahoo Finance" },
      { name: "Silver (Ag)", val: "$82-93 (volatile, $93.41 ATH lundi)", sig: "mixed", src: "Investing.com" },
      { name: "HSBC Target", val: "$6,500/oz fin 2026", sig: "bull", src: "HSBC/CNBC" },
      { name: "Gold-Silver Ratio", val: "61.8:1", sig: "neutral", src: "USAGOLD" },
      { name: "Fed", val: "Hold 'quite some time' — 95.6% prob no cut mars", sig: "mixed", src: "CME FedWatch" },
    ],
    exhaustion: [
      "Or échoue à casser ATH Jan ($5,589) sur fort volume",
      "Fed signale hausse de taux anti-inflation guerre (taux stables 95.6% prob mars)",
      "GLD outflows 2+ jours consécutifs",
      "Gold/Oil ratio compresse",
      "VIX retombe sous 20",
    ],
    exit: "DERNIER à sortir. Core = keep. Trade le premium. Exit total si dé-escalation + Fed hawkish.",
    histPattern: {
      title: "Kippour 1973 + Révolution 1979 + Gulf War I",
      items: [
        "1973 : Or +47% — début d'un bull séculaire après Nixon décroche le dollar de l'or (1971).",
        "1979 : Or +134% → $850/oz ATH (tenu 28 ans). Chute -60% quand Volcker monte les taux.",
        "1990 : Or +8-15% sur 2 mois, retour au pré-guerre en 6 mois.",
        "⚡ JOUR 7 : Or $5,079-5,102, correction continue (-6% du ATH $5,400). MAIS : Dubai air cargo HALT = 20% global gold supply chain bloquée. Premiums physiques Inde passent de discount → parité en 48h. Le marché physique se serre pendant que le papier corrige. DXY fort reste headwind. Conflit s'intensifie = thèse structurelle intacte. Watch: $5,000 comme support psychologique.",
      ],
      analog: "Bull structurel type 1979. Mais le marché est DÉJÀ en bull. Risk = Fed keeps rates high pour combattre l'inflation énergie.",
    },
  },
  {
    id: "potash", name: "Fertilisants / Potash", icon: "🌾", color: "#22c55e", horizon: "Position (3-8 sem)",
    tickers: [
      { symbol: "NTR", name: "Nutrien" }, { symbol: "MOS", name: "Mosaic" },
      { symbol: "IPI", name: "Intrepid Potash" }, { symbol: "CF", name: "CF Industries" },
    ],
    etfs: [{ symbol: "SOIL", note: "Global X Fertilizers" }],
    kpis: [
      { name: "Urea NOLA", val: "$520-550/t (vs $475 pré-conflit, +10-16%)", sig: "bull", src: "CRU/DTN" },
      { name: "Phosphate", val: "+$30/t depuis début conflit. 'More increases coming'", sig: "bull", src: "AgWeb/DTN" },
      { name: "Potash", val: "Seul fert pas encore impacté. MAIS Israel+Jordan = risk", sig: "neutral", src: "AgWeb/DTN" },
      { name: "Urea Egypt", val: "+$60/t (acheteurs cherchent alternatives N.Africa/SE Asia)", sig: "bull", src: "Bloomberg Green" },
      { name: "EU Natgas", val: "+70%+ soutenu cette semaine", sig: "bull", src: "ICE/Yahoo" },
      { name: "Qatar LNG", val: "Production TOUJOURS SUSPENDUE — world's largest export facility", sig: "bull", src: "Kpler/AJ" },
      { name: "DOJ Probe", val: "Enquête antitrust sur CF, Koch, Mosaic, Nutrien, Yara", sig: "watch", src: "Bloomberg/DTN" },
      { name: "Supply Chain", val: "'30 jours Persian Gulf → US shores, +3-4 sem vers Corn Belt'", sig: "bull", src: "AgWeb/Linville" },
      { name: "Planting Season", val: "ACTIVE — timing pire possible pour agriculture", sig: "bull", src: "USDA" },
      { name: "Corn-to-Fert Ratio", val: "2e ou 3e pire de l'histoire pour cette période", sig: "bull", src: "AgWeb/Linville" },
      { name: "Potash Canada", val: "30% production mondiale SK — non-Hormuz, mais demand risk", sig: "mixed", src: "Globe & Mail" },
      { name: "Acreage Shift", val: "Risk corn → soja si azote n'arrive pas au Corn Belt", sig: "watch", src: "AgWeb" },
    ],
    exhaustion: [
      "Hormuz rouvre → routes fertilisants normalisent",
      "Qatar reprend production LNG",
      "EU natgas stabilise (actuellement +70%)",
      "Planting season passe peak (fin mai)",
      "Volume drops sur NTR/MOS malgré prix hausse",
    ],
    exit: "SLEEPER PLAY. Tenir jusqu'en mai. Supply chain recovery plus lente que pétrole. Qatar halt = catalyseur majeur.",
    histPattern: {
      title: "Kippour 1973 + Ukraine 2022",
      items: [
        "1973 : Prix engrais doublent — l'énergie est 60-80% du coût de production des engrais azotés.",
        "2022 Ukraine : NTR +35%, MOS +80%, CF +100%. Spike soutenu 6+ mois.",
        "Recovery lente : supply chains fertilisants prennent 6-12 mois à normaliser.",
        "⚡ JOUR 7 : Urea NOLA $520-550/t (+10-16%). Phosphate +$30/t. Egypt urea +$60/t. 25% du marché mondial azote transite Hormuz. Qatar LNG toujours down — feedstock ammoniac impacté. DOJ ouvre enquête antitrust sur 5 majors (CF, Koch, Mosaic, Nutrien, Yara). Potash CDN pas encore impacté mais demand destruction possible si farmers switch corn→soja. Globe & Mail: 'million-dollar question is how long soil holds up'.",
      ],
      analog: "Ukraine 2022 + Kippour. Qatar LNG halt = nouveau facteur sans précédent direct.",
    },
  },
  {
    id: "gulf", name: "Gulf Short (Dubai/UAE)", icon: "🏗️", color: "#ef4444", horizon: "Swing (1-4 sem)",
    tickers: [
      { symbol: "UAE", name: "iShares MSCI UAE ETF — $20.31" },
      { symbol: "EMAAR (DFM)", name: "Emaar Properties — direct si accès DFM" },
    ],
    etfs: [{ symbol: "UAE", note: "iShares MSCI UAE — 25% RE, 38% financials" }],
    kpis: [
      { name: "UAE ETF Price", val: "$20.31 (range 20.18-20.53)", sig: "bear_target", src: "Investing.com" },
      { name: "UAE 52w Range", val: "$15.40-$22.29", sig: "bear_target", src: "Investing.com" },
      { name: "Bahrain Strikes J7", val: "Hôtel, 2 résidentiels, raffinerie — premiers strikes Bahrain", sig: "bear_target", src: "CNN" },
      { name: "Azerbaijan Strikes", val: "Iran frappe Azerbaijan — 1er pays nouveau touché J6+", sig: "bear_target", src: "CNN" },
      { name: "Israel 'Next Phase'", val: "IDF chief: 2,500 frappes, 6,000+ armes. 'Push deeper into Lebanon'", sig: "bear_target", src: "CNN" },
      { name: "Beirut Évacuation", val: "500,000+ personnes fuient Dahiyeh — panique de masse", sig: "bear_target", src: "CNN" },
      { name: "Iran Death Toll", val: "1,200+ morts (HRANA/AJ). Internet blackout persiste", sig: "bear_target", src: "CNN/AJ" },
      { name: "State Dept", val: "'DEPART NOW' — Rubio: leave immediately. 12+ pays", sig: "bear_target", src: "State/CBS" },
      { name: "Airlines", val: "Espace aérien Iran/Iraq/partie du Gulf fermé", sig: "bear_target", src: "CNN/AJ" },
      { name: "Goldman Sachs CEO", val: "'Surprisingly benign market reaction' — 'needs weeks to digest'", sig: "watch", src: "CNBC/AFR Summit" },
    ],
    exhaustion: [
      "Vols commerciaux reprennent à Dubai/Abu Dhabi",
      "State Dept downgrade advisory → normal",
      "Expats reviennent (visa data, flights)",
      "UAE ETF rebondit sur volume",
      "⚠️ RISQUE SQUEEZE: petit float, V-shape si ceasefire",
    ],
    exit: "SHORT TACTIQUE. Cover si vols + cessez-le-feu. Max 5-8% portfolio. Préférer short direct IBKR.",
    thesis: "Jebel Ali + Abu Dhabi port frappés. Hôtels 5* touchés. Aéroport Dubai fermé. Expats en fuite. Morts civils UAE confirmés. Première fois que le GCC est physiquement frappé dans un conflit — modèle Dubai directement menacé.",
    histPattern: {
      title: "Gulf War I 1990 + Israel-Iran Juin 2025",
      items: [
        "1990 : Kuwait RE détruit physiquement. Dubai non impacté — pas de missiles sur le GCC.",
        "Juin 2025 (12 jours) : UAE ETF dip court, recovery V en 3 semaines. Hormuz menacé mais pas fermé.",
        "Dubai historique : Chaque crise = dip temporaire 5-15%, recovery 1-3 mois. Modèle 'buy the dip' a toujours marché... jusqu'ici.",
        "⚡ JOUR 7 : Bahrain frappé pour la 1re fois (hôtel, 2 résidentiels, raffinerie). Azerbaijan frappé. Conflit atteint des pays GCC NON-belligérants. Beirut : 500K+ fuient Dahiyeh. Israel 'next phase' avec 6,000+ armes. Goldman CEO Solomon dit marché 'surprisingly benign' — 'needs weeks to digest'. La thèse Gulf short s'intensifie à chaque pays GCC touché.",
      ],
      analog: "AUCUN précédent direct. Plus comparable à la crise 2008-09 (Emaar -80%) mais avec une composante MILITAIRE en plus.",
    },
  },
  {
    id: "refiners", name: "Raffineurs US (Crack Spread)", icon: "🏭", color: "#8b5cf6", horizon: "Swing → Position (2-8 sem)",
    tickers: [
      { symbol: "MPC", name: "Marathon Petroleum — $210 (ATH)" },
      { symbol: "VLO", name: "Valero Energy — $215 (ATH)" },
      { symbol: "PBF", name: "PBF Energy — leveragé" },
      { symbol: "PSX", name: "Phillips 66 — refining+midstream" },
    ],
    etfs: [{ symbol: "CRAK", note: "VanEck Oil Refiners ETF" }, { symbol: "XLE", note: "Proxy large cap energy" }],
    kpis: [
      { name: "3-2-1 Crack Spread", val: "Plus haut depuis 2023", sig: "bull", src: "Reuters/CME" },
      { name: "Diesel Crack EU", val: "+34% en 2 jours (2-yr high)", sig: "bull", src: "Bloomberg" },
      { name: "Diesel Crack US", val: "+10% mardi, plus haut depuis oct 2023", sig: "bull", src: "Reuters" },
      { name: "Gasoline Crack US", val: "Flat/légèrement positif (Hormuz = peu de gasoline)", sig: "neutral", src: "Bloomberg" },
      { name: "Jet Fuel Crack EU", val: "Plus haut depuis été 2023 — Kuwait hub down", sig: "bull", src: "Bloomberg/Kpler" },
      { name: "Diesel EU fwd", val: "Backwardation forte = supply serré", sig: "bull", src: "ICE" },
      { name: "Ras Tanura (Aramco)", val: "FERMÉE (drone strike)", sig: "bull", src: "Reuters" },
      { name: "Produits perdus Hormuz", val: "4.3Mbpd produits raffinés bloqués", sig: "bull", src: "FGE NexantECA" },
      { name: "Gasoline US", val: "$3.11/gal (+$0.11/jour), prévision +20-55¢/2 sem", sig: "bull", src: "AAA/GasBuddy" },
      { name: "Diesel US", val: "$3.86/gal — plus haut depuis mai 2024", sig: "bull", src: "GasBuddy" },
      { name: "MPC Capture Rate Q4", val: "114% (vs 96% Q3) — ATH opérationnel", sig: "bull", src: "MPC Earnings" },
      { name: "VLO Benicia", val: "Fermée fév 2026 (-145Kbpd) — aide MPC", sig: "mixed", src: "Bloomberg/DOE" },
      { name: "Refinery Closures US", val: "LyondellBasell -264K, P66 LA -139K = pricing power survivants", sig: "bull", src: "BIC Magazine" },
    ],
    exhaustion: [
      "SPR release de produits raffinés (US n'en a presque pas — NE reserves ~2M bbl seulement)",
      "Hormuz réouvre → crack spreads normalisent en 48-72h (plus rapide que crude)",
      "Trump impose price ceiling sur gasoline/diesel (politiquement risqué mais possible)",
      "Crude dépasse $100 → demand destruction comprime volumes raffineurs",
      "Maintenance non planifiée sur raffinerie MPC/VLO (risque opérationnel)",
    ],
    exit: "PLUS VOLATILE que upstream. Crack spreads normalisent vite si Hormuz rouvre. Mais upside non-linéaire si conflit dure. Exit partiel sur premiers signes de réouverture.",
    thesis: "Les raffineurs US achètent du WTI pipeline à $75 et vendent diesel/jet/gasoline sur un marché mondial en panique. Le crack spread diesel est le plus élevé depuis 2023 et monte. Ras Tanura (plus grosse raffinerie saoudienne) est down. 4.3Mbpd de produits raffinés du Golfe sont bloqués. C'est le 2e dérivé de la même crise géopolitique — corrélation imparfaite avec upstream = diversification.",
    histPattern: {
      title: "Ukraine 2022 + Gulf War I 1990",
      items: [
        "2022 Ukraine : Crack spreads ATH records. VLO +85% en 3 mois. MPC +60%. Diesel shortage EU a soutenu les marges 6+ mois.",
        "1990 Gulf War : Raffineurs US ont surperformé car crude spike mais pipeline supply intacte. Crack spreads x2-3.",
        "⚡ JOUR 5 : Diesel EU +34% en 2 jours. Jet fuel crack plus haut depuis été 2023. Ras Tanura fermée. Produits raffinés 4.3Mbpd bloqués par Hormuz. Les raffineurs US ont du WTI $75 en feedstock et vendent des produits à prix de panique mondiale.",
        "⚡ MPC vs VLO : MPC = meilleur risk/reward. P/E 15x vs VLO 27x. MPLX floor (distributions couvrent dividende+capex). Capture rate 114% Q4. Plus gros producteur jet fuel US. Goldman a retiré VLO de Conviction List.",
      ],
      analog: "Ukraine 2022 pour les marges. MAIS potentiellement pire — Hormuz bloque 4.3Mbpd de PRODUITS RAFFINÉS (pas juste crude). Le diesel crack pourrait dépasser les ATH de 2022 si Hormuz reste fermé 3+ semaines.",
    },
  },
  {
    id: "aluminum", name: "Aluminium NA (Supply Shift)", icon: "🏗️", color: "#06b6d4", horizon: "Position (2-8 sem) — THÈSE À SUIVRE",
    tickers: [
      { symbol: "CENX", name: "Century Aluminum — seul producteur US fighter jet Al" },
      { symbol: "AA", name: "Alcoa — intégré global, smelters US/CA/Islande" },
      { symbol: "RIO", name: "Rio Tinto — Saguenay-Lac-St-Jean QC, Kitimat BC" },
      { symbol: "KALU", name: "Kaiser Aluminum — semi-fabricated, 13 usines NA" },
    ],
    etfs: [],
    kpis: [
      { name: "LME Aluminium", val: "$3,340-3,418/t (+5% J5, 4-yr high)", sig: "bull", src: "LME/Bloomberg" },
      { name: "LME Al week", val: "+9% depuis début conflit", sig: "bull", src: "Mining.com/Stocktwits" },
      { name: "Midwest Premium", val: "$2,182/t — ATH record", sig: "bull", src: "FinancialContent" },
      { name: "Alba (Bahrain)", val: "FORCE MAJEURE — plus gros smelter hors Chine (1.62Mt/an)", sig: "bull", src: "Reuters/Bloomberg" },
      { name: "Qatalum (Qatar)", val: "Shutdown contrôlé (Hydro)", sig: "bull", src: "Hydro/Argus" },
      { name: "GCC Production", val: "~9% production mondiale bloquée par Hormuz", sig: "bull", src: "AZ China/ING" },
      { name: "Rio Tinto", val: "Suspend négo Q2 Japon. Premium $250/t ATH depuis 2015", sig: "bull", src: "Bloomberg" },
      { name: "Citi Target", val: "$3,600/t (0-3 mois) — 'risk to realised disruption'", sig: "bull", src: "Citi/GBAF" },
      { name: "Goldman Target", val: "$3,600/t si production Gulf arrêtée 1 mois", sig: "bull", src: "Goldman/Mining.com" },
      { name: "CENX Mt Holly", val: "Relance SC — +10% production US (mid-2026)", sig: "bull", src: "Motley Fool" },
      { name: "Europe", val: "30% imports alu du GCC — 'particularly exposed' (ING)", sig: "bull", src: "ING/Stocktwits" },
      { name: "Mozal (Mozambique)", val: "Fermeture imminente — supply crunch pré-existant", sig: "bull", src: "Mining.com" },
    ],
    exhaustion: [
      "Hormuz réouvre → GCC reprend exports aluminium (mais 6-12 mois pour normaliser selon Qatalum)",
      "LME revient sous $3,000/t",
      "CENX/AA corrige après spike si pas de follow-through demande",
      "China augmente exports alu (cap de production limitant)",
      "DXY fort comprime prix commodités en général",
    ],
    exit: "PLUS LENT que pétrole à normaliser. Smelters GCC = 6-12 mois pour redémarrer. Alumina stocks = 1-2 sem seulement. Thèse structurelle plus longue que energy.",
    thesis: "GCC = 9% production mondiale aluminium. Alba (Bahrain) en force majeure. Qatalum shutdown. 5Mt+ transitent par Hormuz/an. Les smelters NA (CENX, AA, RIO Saguenay) sont HORS de la chaîne ME — hydro-powered, pipeline supply, pas de dépendance Hormuz. Si Hormuz reste fermé, les acheteurs EU/US se retournent vers NA. Midwest premium déjà à ATH ($2,182). Le supply crunch ME s'ajoute à un marché DÉJÀ en déficit (Mozal ferme, China à son cap).",
    histPattern: {
      title: "Ukraine 2022 (énergie) + Russia Rusal sanctions 2018",
      items: [
        "2018 : Sanctions US sur Rusal → LME +35% en 2 semaines. Rusal contrôlait ~6% production mondiale. Similaire au ~9% GCC bloqué maintenant.",
        "2022 : Crise énergie EU → smelters EU ferment (Norsk Hydro, Alcoa Espagne). Prix ATH $4,073. Transfert de demande vers NA/Islande.",
        "⚡ JOUR 6 : Alba FORCE MAJEURE mercredi. LME +5% à $3,418 (4-yr high). Qatalum shutdown. Citi relève target à $3,600. Rio Tinto suspend négo Q2 avec Japon. Premium Midwest $2,182 ATH. 'Force majeure at two Gulf producers = shift from risk to realised disruption' (Citi).",
        "⚡ THÈSE NA : CENX relance Mt Holly SC (+10% production US). RIO Saguenay = 50% de sa production globale Al. AA = 87% smelters sur renouvelable. Ces producteurs sont géographiquement et logistiquement ISOLÉS du conflit. Premium NA → eux.",
      ],
      analog: "Rusal 2018 pour le mécanisme (sanctions → supply shift) mais GCC = plus gros que Rusal. Smelters GCC prennent 6-12 mois à redémarrer = thèse durable.",
    },
  },
  {
    id: "chemicals", name: "Chimie Intégrée NA (Supply Shift)", icon: "🧪", color: "#ec4899", horizon: "Position (3-8 sem) — THÈSE À SUIVRE",
    tickers: [
      { symbol: "DOW", name: "Dow Inc — ethylene/polyethylene, Gulf Coast feedstock" },
      { symbol: "LYB", name: "LyondellBasell — polyolefins, intégré NA" },
      { symbol: "CE", name: "Celanese — acétyl chain, intégré" },
      { symbol: "WLK", name: "Westlake — PVC/ethylene, Gulf Coast" },
      { symbol: "OLN", name: "Olin Corp — chlor-alkali, epoxy" },
    ],
    etfs: [],
    kpis: [
      { name: "EU Natgas", val: "+70%+ cette semaine — feedstock chimie EU en crise", sig: "bull", src: "ICE" },
      { name: "Qatar Petrochim", val: "Shutdown (LNG + pétrochimie liés)", sig: "bull", src: "AJ/Reuters" },
      { name: "Iraq Storage", val: "Saturé — cascade pétrochimie/engrais", sig: "bull", src: "Reuters" },
      { name: "Ethane/Ethylene US", val: "Gulf Coast : feedstock shale gas local, PAS ME", sig: "bull", src: "EIA" },
      { name: "EU Chimie", val: "+5% prix nécessaire sur 12 mois (coûts énergie)", sig: "bull", src: "Investing.com" },
      { name: "ME Polyethylene", val: "SABIC/Sadara (Saoudi) — exports via Hormuz menacés", sig: "bull", src: "ICIS/Argus" },
      { name: "Iran Slab/Billet", val: "Exports suspendus — Fastmarkets arrête cotations", sig: "bull", src: "Fastmarkets/Argus" },
      { name: "Tarifs US 15%", val: "Protège producteurs NA vs imports asiatiques", sig: "bull", src: "Treasury/Bessent" },
    ],
    exhaustion: [
      "Hormuz réouvre → ME petrochim reprend exports",
      "EU natgas retombe (Qatar LNG redémarre)",
      "Demand destruction si récession (chimie = cyclique)",
      "China redirige exports petrochim vers EU/US (compétition)",
      "Crude >$100 hausse feedstock pour NA aussi (natgas indexé partiellement)",
    ],
    exit: "SLEEPER. Margins chimie NA = avantage structurel natgas vs naphtha EU/Asie. Si EU en crise énergie prolongée → clients EU achètent NA. Plus lent que alu mais durable.",
    thesis: "Les chimistes NA (Dow, LYB, Westlake) utilisent du ethane/natgas local comme feedstock — PAS du naphtha importé via Hormuz. Les concurrents ME (SABIC, Sadara) et EU (BASF, naphtha-based) sont en crise : ME bloqué par Hormuz, EU par natgas +70%. L'avantage cost NA s'élargit massivement. Les clients EU/asiatiques vont chercher du polyethylene/PVC NA. C'est le même mécanisme que les raffineurs (supply shift) mais appliqué à la pétrochimie.",
    histPattern: {
      title: "Ukraine 2022 (énergie EU) + Gulf War I",
      items: [
        "2022 Ukraine : BASF annonce réduction Ludwigshafen. EU chimie en crise. Dow/LYB surperforment car feedstock natgas US pas impacté.",
        "Structurel : avantage US natgas vs naphtha = $200-400/t sur ethylene. S'est construit depuis shale revolution 2010+.",
        "⚡ JOUR 6 : Qatar pétrochimie down (lié au LNG halt). Iraq storage saturé = cascade pétrochimie. Iran exports slab/billet suspendus. EU chimie doit hausser prix +5% (énergie). Les chimistes NA n'ont PAS de dépendance ME — leur feedstock est du shale gas du Permian/Marcellus.",
        "⚡ RISQUE : Si crude dépasse $100, natgas US monte aussi (indexation partielle). Aussi, Dow/LYB sont cycliques — si recession fears = multiple compression même avec margins en hausse.",
      ],
      analog: "Ukraine 2022 pour le mécanisme exact (énergie EU en crise → avantage NA). Potentiellement plus intense si Hormuz bloque les exports ME petrochim.",
    },
  },
];

// ─── DE-ESCALATION ───
const STATUSES = ["inactive", "rumored", "developing", "pending", "confirmed"];
const initDeesc = () => [
  { cat: "Diplomatique", signals: [
    { text: "Mojtaba Khamenei (fils) candidat Supreme Leader — continuité IRGC, pas réforme", weight: 3, status: "developing" },
    { text: "Trump engage avec nouveau leadership iranien (Hegseth: 'just getting started')", weight: 4, status: "inactive" },
    { text: "Médiation Oman/Qatar — Qatar frappé, focus défensif", weight: 3, status: "inactive" },
    { text: "Sénat US résolution limiter Trump — REJETÉE par républicains", weight: 2, status: "confirmed" },
    { text: "Carney (Canada) : 'ne peut exclure participation'. Coalition s'élargit", weight: 2, status: "developing" },
    { text: "France autorise bases US. NATO AWACS en Turquie", weight: 2, status: "confirmed" },
    { text: "Iran dit prêt pour invasion — aucun signal de capitulation", weight: 5, status: "confirmed" },
  ]},
  { cat: "Militaire", signals: [
    { text: "Marine iranienne 'destroyed' (Trump) — IRIS Dena coulée (87 morts Sri Lanka)", weight: 4, status: "confirmed" },
    { text: "Iran 1,200+ morts. Israel 2,500 frappes, 6,000+ armes. IDF 'next phase'", weight: 5, status: "confirmed" },
    { text: "Hegseth: 'just getting started', 'new capabilities' déployées J7", weight: 5, status: "confirmed" },
    { text: "Bahrain frappé (hôtel, résidentiels, raffinerie) + Azerbaijan touché", weight: 4, status: "confirmed" },
    { text: "6 US service members tués au Kuwait (drone) — premières pertes US", weight: 3, status: "confirmed" },
    { text: "Israel évacuation massive Beirut Dahiyeh (500K+), front Liban 'next phase'", weight: 4, status: "confirmed" },
    { text: "Iran 'ready for invasion' — AUCUN signe capitulation leadership", weight: 5, status: "confirmed" },
    { text: "Iran strikes diminuent en volume MAIS menace reste élevée", weight: 3, status: "developing" },
  ]},
  { cat: "Maritime", signals: [
    { text: "P&I cancel EFFECTIF aujourd'hui 5 mars — transit sans assurance", weight: 5, status: "confirmed" },
    { text: "DFC insurance annoncé mais pas opérationnel — détails inconnus", weight: 4, status: "pending" },
    { text: "US Navy escortes : Navy dit 'pas de dispo' toujours", weight: 4, status: "inactive" },
    { text: "Tanker explosion 30nm Kuwait — escalation zone danger", weight: 4, status: "confirmed" },
    { text: "Aramco tente rerouter exports via pipeline E-W → Red Sea (Jeddah)", weight: 3, status: "developing" },
    { text: "Maersk/Hapag-Lloyd toujours suspendus", weight: 5, status: "inactive" },
    { text: "Houthis n'ont PAS repris attaques Red Sea (pour l'instant)", weight: 3, status: "confirmed" },
  ]},
  { cat: "Marché", signals: [
    { text: "S&P 500 rebond +0.78% mercredi — marché s'adapte", weight: 2, status: "developing" },
    { text: "VIX repli 22.38 (vs pic 27.3) — stress baisse", weight: 2, status: "developing" },
    { text: "Or rebond $5,172 après selloff — stabilisation", weight: 2, status: "developing" },
    { text: "Brent stable $82 vs $85 ATH — pas de breakout $100", weight: 3, status: "developing" },
    { text: "UBS: 'equities will produce good gains, stick with base case'", weight: 2, status: "rumored" },
    { text: "Bessent: 15% global tariff cette semaine + mesures fuel à venir", weight: 3, status: "developing" },
    { text: "Bitcoin $71K (+5%) — alternative safe-haven narrative", weight: 1, status: "rumored" },
  ]},
];

// ─── HISTORICAL PATTERNS ───
const HIST_CONFLICTS = [
  {
    name: "Guerre du Kippour", year: "1973-74", duration: "6 mois",
    oilBefore: "$3", oilPeak: "$12", oilChange: "+300%", oilRecovery: "Jamais (nouveau plateau)",
    goldChange: "+47%", goldNote: "Or découplé du dollar en 1971, début du bull run",
    shippingNote: "Embargo = tanker rates explosent, rerouting massif",
    fertNote: "Prix engrais doublent (feedstock energy cost)",
    gulfNote: "N/A",
    keyLesson: "Choc structurel — les prix ne reviennent jamais au pré-conflit. Changement de paradigme permanent.",
    analogy: 2,
  },
  {
    name: "Révolution Iranienne", year: "1979", duration: "12+ mois",
    oilBefore: "$14", oilPeak: "$39", oilChange: "+179%", oilRecovery: "2-3 ans",
    goldChange: "+134% (→$850/oz ATH)", goldNote: "Record absolu tenu 28 ans. Safe haven peak.",
    shippingNote: "Perte 2-2.5M bbl/jour, tanker rates spike prolongé",
    fertNote: "Engrais azotés : crise prix 18 mois",
    gulfNote: "N/A (pré-boom Dubai)",
    keyLesson: "Plus la disruption supply est longue, plus le spike est durable. Gold spike = front-loaded puis fade.",
    analogy: 4,
  },
  {
    name: "Guerre Iran-Iraq", year: "1980-88", duration: "8 ans",
    oilBefore: "$39", oilPeak: "$39 (déjà élevé)", oilChange: "Volatil, -65% net", oilRecovery: "Marché baissier",
    goldChange: "-60% sur la période", goldNote: "Conflit prolongé = gold fade, marché s'habitue",
    shippingNote: "Tanker War 1984-88 : attaques sur 400+ navires, assurance spike",
    fertNote: "Volatilité prolongée des inputs",
    gulfNote: "N/A",
    keyLesson: "Guerre longue ≠ prix hauts soutenus. Le marché price-in le conflit. La Tanker War est l'analogue le plus direct pour le Hormuz.",
    analogy: 4,
  },
  {
    name: "Guerre du Golfe I", year: "1990-91", duration: "9 mois",
    oilBefore: "$17", oilPeak: "$46", oilChange: "+89%", oilRecovery: "6 mois post-guerre",
    goldChange: "+8% puis retour", goldNote: "Spike court, retour au pré-guerre en 6 mois",
    shippingNote: "Tanker rates +100%, normalisation rapide post-libération Kuwait",
    fertNote: "Spike modéré, recovery 6 mois",
    gulfNote: "Kuwait RE détruit, Dubai non impacté",
    keyLesson: "Pattern classique : spike sur invasion → fade sur succès militaire → retour pré-conflit. 'Buy the cannons, sell the church bells.'",
    analogy: 5,
  },
  {
    name: "Guerre d'Iraq", year: "2003", duration: "Invasion: 6 sem",
    oilBefore: "$28", oilPeak: "$37", oilChange: "+32%", oilRecovery: "Retour en 3 mois",
    goldChange: "+15% puis retour", goldNote: "Rally pré-guerre, sell-off au début des frappes",
    shippingNote: "Spike modéré, normalisation rapide",
    fertNote: "Impact minimal",
    gulfNote: "Dubai boom accélère post-2003",
    keyLesson: "Victoire rapide = spike court. Pétrole et or vendent sur les premières frappes. 'Sell the fact.'",
    analogy: 3,
  },
  {
    name: "Attaque Aramco (drones)", year: "2019", duration: "2 semaines",
    oilBefore: "$60", oilPeak: "$69", oilChange: "+15% intraday", oilRecovery: "2 semaines",
    goldChange: "+1%", goldNote: "Réaction mineure, pas de conflit ouvert",
    shippingNote: "Spike 1-2 jours puis normalisation",
    fertNote: "Aucun impact",
    gulfNote: "Impact négligeable",
    keyLesson: "Event ponctuel sans escalation = spike très court. Le marché teste et revient vite.",
    analogy: 1,
  },
  {
    name: "Guerre Israel-Iran (12 jours)", year: "Juin 2025", duration: "12 jours",
    oilBefore: "$65", oilPeak: "$78", oilChange: "+20%", oilRecovery: "3 semaines",
    goldChange: "+8%", goldNote: "Rally safe-haven court, retour rapide",
    shippingNote: "Hormuz menacé mais pas fermé. Spike modéré.",
    fertNote: "Impact limité",
    gulfNote: "Dubai : dip court, recovery en V",
    keyLesson: "Précédent direct. Hormuz NON fermé → recovery rapide. Cette fois-ci Hormuz EST fermé → scénario très différent.",
    analogy: 3,
  },
];

const PATTERN_RULES = [
  { rule: "Sell the cannons, buy the church bells", desc: "Les marchés spike AVANT ou AU DÉBUT du conflit, puis fadent pendant. La sortie optimale est souvent dans les premiers jours/semaines." },
  { rule: "La durée de fermeture Hormuz détermine tout", desc: "1-2 sem = spike court (Aramco 2019). 3+ sem = dommage structurel. 6+ sem = changement de régime (Kippour 1973)." },
  { rule: "Gold front-loads, Oil sustains", desc: "L'or spike immédiatement (safe haven) puis fade. Le pétrole maintient tant que le supply est perturbé. Sortir de l'or avant le pétrole." },
  { rule: "Tankers = proxy leveragé de la durée", desc: "Tanker rates sont le meilleur indicateur temps réel de la sévérité. Quand les rates commencent à baisser, la crise se termine." },
  { rule: "Les marchés s'habituent", desc: "Même Iran-Iraq 8 ans : après 6-12 mois le premium de guerre disparaît. Le marché price-in le 'new normal'." },
  { rule: "Recovery pattern : Tankers > Oil > Fertilizers > Gold", desc: "Tankers collapsent en premier (rates spot), pétrole suit (futures), fertilisants plus lents (supply chain), or dernier (structural bid des banques centrales)." },
  { rule: "⚡ NOUVEAU : Assurance kill = blocus sans blocus", desc: "L'annulation P&I par les assureurs fait le travail du blocus sans qu'Iran ait besoin de contrôler physiquement le détroit. C'est un nouveau mécanisme sans précédent historique." },
  { rule: "⚡ NOUVEAU J7 : Conflit s'élargit géographiquement = escalation", desc: "Bahrain, Azerbaijan frappés pour la 1re fois J6-7. Chaque pays GCC touché = modèle Dubai + fragilisé. Iran dit 'ready for invasion'. Hegseth 'just getting started'. Aucun signal de dé-escalation. Watch: premier contact diplomatique direct US-Iran = signal de sortie." },
  { rule: "⚡ NOUVEAU J7 : Gold physical vs paper divergence", desc: "Or papier corrige (-6% du ATH) MAIS Dubai air cargo halt = 20% flux physiques bloqués. Premiums physiques Inde flip de discount à parité en 48h. Le marché physique se serre pendant que le papier vend. Pattern = opportunité si conflit dure." },
  { rule: "⚡ NOUVEAU J7 : Fertilisants = bombe à retardement", desc: "Urea +10-16%, phosphate +$30/t, 25% azote mondial via Hormuz. Supply chain 30 jours Gulf→US + 3-4 sem vers Corn Belt. Si conflit dure 5+ sem → supply n'arrive pas pour planting season. Potash CDN (NTR) = pas encore impacté directement mais demand shift corn→soja = risk." },
  { rule: "⚡ NOUVEAU : Diesel crack > gasoline crack", desc: "Hormuz exporte LPG/naphta/diesel, PAS gasoline. La fermeture frappe les cracks distillats. Ras Tanura (Aramco) fermée = diesel mondial en crise. Raffineurs US achètent WTI $75, vendent diesel à prix de panique. Crack spread = upside NON-LINÉAIRE vs upstream (linéaire). MPC > VLO (P/E 15x vs 27x, MPLX floor, capture 114%)." },
];

const SOURCES = [
  { name: "MarineTraffic", url: "marinetraffic.com", use: "AIS, Hormuz transit", freq: "Daily" },
  { name: "Kpler", url: "kpler.com", use: "Vessel tracking, cargo flows, analytics", freq: "Real-time" },
  { name: "TradingView", url: "tradingview.com", use: "Prix, RSI, volume, spreads", freq: "Real-time" },
  { name: "FRED", url: "fred.stlouisfed.org", use: "Real rates, DXY, 10Y yield", freq: "Daily" },
  { name: "CENTCOM", url: "centcom.mil", use: "Opérations US", freq: "As released" },
  { name: "Kitco", url: "kitco.com", use: "Gold spot", freq: "Real-time" },
  { name: "Hellenic Shipping", url: "hellenicshippingnews.com", use: "BDTI/BCTI", freq: "Daily" },
  { name: "UKMTO", url: "ukmto.org", use: "Sécurité maritime", freq: "As released" },
  { name: "ETF.com", url: "etf.com", use: "GLD/ETF flows", freq: "Daily" },
  { name: "OPEC", url: "opec.org", use: "Output decisions", freq: "As released" },
  { name: "Dryad Global", url: "dryadglobal.com", use: "Threat maritime", freq: "As released" },
  { name: "LSEG", url: "lseg.com", use: "TD3C VLCC rates, FFAs", freq: "Daily" },
  { name: "Seatrade", url: "seatrade-maritime.com", use: "Tanker fixtures ATH, market analysis", freq: "Daily" },
  { name: "Splash247", url: "splash247.com", use: "VLCC fixtures, immobilisation data", freq: "Daily" },
  { name: "Arrow Brokers", url: "arrowship.com", use: "Fleet immobilisation par segment", freq: "Daily" },
  { name: "Clarksons", url: "clarksons.com", use: "Spot rate estimates, market consensus", freq: "Daily" },
  { name: "Windward", url: "windward.ai", use: "Transit counts, security briefings", freq: "Daily" },
  { name: "Bloomberg", url: "bloomberg.com", use: "Crack spreads, diesel/jet cracks, refiner news", freq: "Real-time" },
  { name: "FGE NexantECA", url: "fgenexanteca.com", use: "Product flow analysis, refinery margin forecasts", freq: "Weekly" },
  { name: "GasBuddy", url: "gasbuddy.com", use: "US retail gas/diesel prices, forecasts", freq: "Daily" },
  { name: "CME Group", url: "cmegroup.com", use: "Crack spread futures, 3-2-1 data", freq: "Real-time" },
];

const ROUTINE = [
  ["06h00", "CENTCOM + UKMTO — opérations nuit, incidents maritimes, tankers endommagés"],
  ["07h00", "MarineTraffic/Kpler — AIS tankers, transit Hormuz (actuellement ~0)"],
  ["08h00", "Brent/WTI/Gold ouverture EU, WCS spread, EU natgas, UAE pre-market"],
  ["09h30", "Ouverture NYSE — volume secteurs, RSI check, VIX opening"],
  ["12h00", "Scan — OPEC, SPR, assurances P&I, flight status Dubai, Hezbollah/Liban front"],
  ["16h00", "VLCC TD3C rates, ETF flows, update matrice dé-escalation"],
  ["20h00", "Synthèse — scoring, ajustement positions, overnight Iran/CENTCOM"],
];

// ─── FLASH NEWS ───
const FLASH_NEWS = [
  { time: "6 Mar", text: "🔴 JOUR 7 : Hegseth 'just getting started'. Israel IDF chief : 'next phase', 2,500 frappes avec 6,000+ armes", cat: "mil" },
  { time: "6 Mar", text: "🔴 Bahrain frappé : hôtel, 2 bâtiments résidentiels, raffinerie. Qatar/Kuwait/Saoudi interceptent missiles", cat: "escal" },
  { time: "6 Mar", text: "🔴 Azerbaijan frappé par l'Iran — 1er pays nouveau touché depuis début conflit", cat: "escal" },
  { time: "6 Mar", text: "Israel 'broad-scale wave of strikes' sur infrastructure régime Tehran (J7 matin)", cat: "mil" },
  { time: "6 Mar", text: "Beirut : évacuation massive Dahiyeh (500K+ personnes), Israel 'push deeper into Lebanon'", cat: "escal" },
  { time: "6 Mar", text: "Iran strikes diminuent en volume MAIS Hegseth avertit que US 'accelerate'. NATO allies 'reluctantly pulled in'", cat: "mil" },
  { time: "6 Mar", text: "Brent spot $89.21 (+22% 1 semaine). Futures $84.48. Brent/WTI spread s'élargit", cat: "market" },
  { time: "6 Mar", text: "Or $5,079-5,102 (correction -6% du ATH $5,400). Dubai gold air cargo HALT = 20% flux mondiaux bloqués", cat: "market" },
  { time: "6 Mar", text: "Hormuz : 5 crossings J6, AIS jamming 44 zones injection + 92 denial. P&I cancel J2. Trafic ~0", cat: "hormuz" },
  { time: "6 Mar", text: "Urea NOLA $520-550/t (+10-16%). Phosphate +$30/t. Potash = seul fert pas encore impacté", cat: "market" },
  { time: "6 Mar", text: "Goldman CEO Solomon: marché 'surprisingly benign' — 'needs weeks to digest implications'", cat: "market" },
  { time: "6 Mar", text: "Oxford Economics/Alpine Macro : 'conflit max 2 mois. Sell extreme moves — they will fade'", cat: "market" },
  { time: "6 Mar", text: "S&P 500 -0.56%, Dow -1.76% (jeudi). VIX +12% à 23.75. Marché s'ajuste", cat: "market" },
  { time: "6 Mar", text: "DOJ ouvre enquête antitrust sur fertilisants (CF, Koch, Mosaic, Nutrien, Yara)", cat: "market" },
  { time: "5 Mar", text: "🏭 NOUVEAU SECTEUR : Raffineurs US ajouté au dashboard. Diesel crack ATH 2023. MPC = pick #1 (P/E 15x, capture 114%, MPLX floor)", cat: "market" },
  { time: "5 Mar", text: "P&I cancel effective AUJOURD'HUI — transit Hormuz désormais sans assurance commerciale", cat: "hormuz" },
  { time: "5 Mar", text: "Hegseth : US 'accelerating, not decelerating'. Frappes vont aller 'deeper' en Iran", cat: "mil" },
  { time: "5 Mar", text: "Sénat Républicain REJETTE résolution limiter pouvoirs de guerre Trump", cat: "mil" },
  { time: "5 Mar", text: "6 US service members tués par drone à un port au Kuwait — premières pertes US", cat: "escal" },
  { time: "5 Mar", text: "Iran death toll 1,230+, 6,000+ blessés (J6). Funérailles Khamenei 3 jours", cat: "mil" },
  { time: "5 Mar", text: "Mojtaba Khamenei (fils) émerge comme candidat Supreme Leader — liens IRGC", cat: "mil" },
  { time: "5 Mar", text: "Kurdes iraniens lancent offensive terrestre NW Iran. Kurdes irakiens en 'standby'", cat: "mil" },
  { time: "5 Mar", text: "Drone iranien sur Ras Tanura LOADING TERMINAL — MoD Saoudi confirme", cat: "escal" },
  { time: "5 Mar", text: "Ambassade US Riyadh frappée (drone). Qatar évacue résidents près ambassade US Doha", cat: "escal" },
  { time: "5 Mar", text: "Explosion tanker ancré 30nm SE Kuwait (Mubarak al-Kabeer)", cat: "hormuz" },
  { time: "5 Mar", text: "Chypre : personnel US non-essentiel évacué. France autorise bases US (BFMTV)", cat: "escal" },
  { time: "5 Mar", text: "Canada Carney : 'ne peut exclure participation militaire'. Australie Albanese : 'dé-escalation'", cat: "mil" },
  { time: "5 Mar", text: "Ukraine offre experts anti-drones aux pays du Golfe (Zelenskyy-Qatar)", cat: "mil" },
  { time: "5 Mar", text: "S&P 500 mercredi +0.78% (6,869). Nasdaq +1.29%. Jeudi pre-market -0.1% à -0.36%", cat: "market" },
  { time: "5 Mar", text: "VIX 22.38 (ouverture 24.66, repli intraday). Toujours élevé mais sous le pic de 27.3", cat: "market" },
  { time: "5 Mar", text: "Or $5,172 rebond (+0.7%). Cassure Fib 50% à $5,165. Target $5,400+", cat: "market" },
  { time: "5 Mar", text: "Brent $82-84, WTI $76. Brent 52-wk range $58-$85. Still well below $100 trigger", cat: "market" },
  { time: "5 Mar", text: "Diesel EU +34% en 2 jours (2-yr high). Jet fuel crack au plus haut depuis été 2023", cat: "market" },
  { time: "5 Mar", text: "Ras Tanura LOADING terminal frappé + 4.3Mbpd produits raffinés bloqués Hormuz", cat: "escal" },
  { time: "5 Mar", text: "Diesel US $3.86/gal (top-10 daily increase since 2005). Gas $3.11+. Prévision Q2 diesel $4+", cat: "market" },
  { time: "5 Mar", text: "Iran : 33 sites civils frappés (hôpitaux, écoles, Grand Bazar Téhéran, Golestan Palace)", cat: "mil" },
  { time: "5 Mar", text: "Trump menace couper tout commerce avec l'Espagne (refus utiliser bases US)", cat: "mil" },
  { time: "5 Mar", text: "Bitcoin $71,400 (+5% mercredi) — BTC teste safe-haven narrative vs or", cat: "market" },
  { time: "5 Mar", text: "🏗️ THÈSE ALUMINIUM NA : Alba (Bahrain) FORCE MAJEURE. Qatalum shutdown. LME +9% à $3,418 (4-yr high). Citi target $3,600. CENX/AA/RIO = supply shift", cat: "market" },
  { time: "5 Mar", text: "🧪 THÈSE CHIMIE NA : Qatar pétrolchimie down. EU chimie +5% prix. DOW/LYB feedstock shale = pas de dépendance ME. Supply shift même mécanisme que raffineurs", cat: "market" },
  { time: "4 Mar PM", text: "S&P 500 -0.65%, Dow -0.50%. Tech rebond partiel (AMZN +2.8%, NVDA +1%)", cat: "market" },
  { time: "4 Mar PM", text: "Or $5,121 (-3.6%). Miners crash: NEM -7%, HBM -15%, CDE -13%, AAUK -12%", cat: "market" },
  { time: "4 Mar PM", text: "Brent $80.45 (repli du $85 intraday). WTI $75.10", cat: "market" },
  { time: "4 Mar AM", text: "VLCC TD3C ATH : W700 Sinokor ($20/bbl), Pantanassa fixé $436K/day à GS Caltex", cat: "hormuz" },
  { time: "4 Mar AM", text: "329 tankers immobilisés dont 72 VLCCs (8% flotte mondiale) — Arrow Brokers", cat: "hormuz" },
  { time: "4 Mar AM", text: "Iraq annonce -1.5Mbpd forced cuts — stockage saturé, expansion possible à -3Mbpd", cat: "escal" },
  { time: "4 Mar AM", text: "Turkiye : NATO intercepte missile balistique iranien en Méditerranée orientale", cat: "escal" },
  { time: "4 Mar AM", text: "IRIS Dena coulée par sous-marin US au large du Sri Lanka", cat: "mil" },
  { time: "4 Mar AM", text: "Israel bombarde Assembly of Experts pendant élection nouveau Supreme Leader", cat: "mil" },
  { time: "4 Mar AM", text: "Explosions au consulat US à Dubai. Ambassades Kuwait/Liban/Saoudi fermées", cat: "escal" },
  { time: "4 Mar AM", text: "CIA arme les Kurdes pour insurrection — CNN sources multiples", cat: "mil" },
  { time: "4 Mar AM", text: "Iran death toll 1,045+ (Red Crescent). Internet blackout 100+ heures", cat: "mil" },
  { time: "4 Mar AM", text: "Bushehr nucléaire menacé — Russie avertit, explosions à proximité", cat: "escal" },
  { time: "4 Mar AM", text: "Hegseth: opérations 'still in early days'. Sénat vote sur résolution pour limiter Trump", cat: "mil" },
  { time: "4 Mar AM", text: "Goldman Q2 Brent +$10 à $76 avg. '$100 si Hormuz 5 sem'. UBS aussi +$10", cat: "market" },
  { time: "4 Mar AM", text: "Fed Hammack/Kashkari : hold rates 'quite some time'. Cuts repoussés sept 2026+", cat: "market" },
  { time: "3 Mar PM", text: "Trump : DFC insurance + naval escorts Hormuz. MAIS US Navy dit 'pas de dispo'", cat: "hormuz" },
  { time: "3 Mar PM", text: "Tanker + container frappés 10nm Fujairah (UKMTO advisory)", cat: "hormuz" },
  { time: "3 Mar PM", text: "Houthis solidarité avec Iran MAIS pas repris attaques Red Sea — pour l'instant", cat: "deesc" },
  { time: "3 Mar PM", text: "NCRI annonce gouvernement provisoire iranien depuis Paris (Maryam Rajavi)", cat: "mil" },
  { time: "3 Mar AM", text: "IRIB (broadcaster iranien) et Golestan Palace (UNESCO) frappés par Israël", cat: "mil" },
  { time: "3 Mar AM", text: "Israel incursion terrestre au Liban sud. Hezbollah : 'open war'", cat: "escal" },
  { time: "3 Mar AM", text: "S&P 500 -1.6%, VIX 27.30 (+23% — 3-month high)", cat: "market" },
  { time: "2 Mar PM", text: "IRGC confirme Hormuz FERMÉ — 'tout navire sera incendié'", cat: "hormuz" },
  { time: "2 Mar PM", text: "P&I clubs annulent couverture guerre effective 5 mars", cat: "hormuz" },
  { time: "2 Mar PM", text: "Qatar suspend production LNG — drones iraniens sur Ras Laffan", cat: "escal" },
  { time: "2 Mar", text: "Trump : opérations 4-5 semaines, 'substantially ahead of schedule'", cat: "mil" },
  { time: "28 Fév-2 Mar", text: "1,045+ morts en Iran. Natanz endommagé. Khamenei mort. 40+ officials tués", cat: "mil" },
];

// ─── MINI BAR ───
function MiniBar({ values, color, labels }) {
  const mx = Math.max(...values) * 1.1;
  return (
    <div style={{ display: "inline-flex", alignItems: "flex-end", gap: "3px", height: 44 }}>
      {values.map((v, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <div style={{
            width: 22, height: Math.max(2, (v / mx) * 44), borderRadius: "2px 2px 0 0",
            background: color, opacity: 0.5 + (v / mx) * 0.5, transition: "height .3s",
          }} />
          {labels && <span style={{ fontSize: "8px", color: "var(--text-dim)" }}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

function ScoreGauge({ score }) {
  const pct = (score / 10) * 100;
  const c = score >= 8 ? "var(--red)" : score >= 6 ? "var(--amber)" : "var(--green)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
        <span style={{ color: "var(--green)" }}>DÉ-ESCALATION</span>
        <span style={{ color: "var(--red)" }}>ESCALATION MAX</span>
      </div>
      <div className="gauge-track">
        <div className="gauge-gradient" />
        <div className="gauge-marker" style={{ left: `${pct}%`, borderColor: c, boxShadow: `0 0 10px color-mix(in srgb, ${c} 50%, transparent)` }} />
      </div>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <span style={{ fontSize: 40, fontWeight: 800, color: c, fontFamily: "var(--mono)" }}>{score}</span>
        <span style={{ fontSize: 16, color: "var(--text-dim)" }}>/10</span>
      </div>
    </div>
  );
}

// ─── MAIN ───
export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [sector, setSector] = useState("tankers");
  const [scenario, setScenario] = useState("base");
  const [deesc, setDeesc] = useState(initDeesc);

  const dayCount = getDayCount();
  const score = compositeScore();
  const sec = SECTORS.find(s => s.id === sector);
  const scen = SCENARIOS.find(s => s.id === scenario);

  const cycleStatus = useCallback((ci, si) => {
    setDeesc(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const cur = next[ci].signals[si].status;
      next[ci].signals[si].status = STATUSES[(STATUSES.indexOf(cur) + 1) % STATUSES.length];
      return next;
    });
  }, []);

  const confirmed = deesc.reduce((a, c) => a + c.signals.filter(s => s.status === "confirmed").length, 0);
  const total = deesc.reduce((a, c) => a + c.signals.length, 0);

  const SIG = { bull: "var(--green)", watch: "var(--amber)", neutral: "var(--text-dim)", mixed: "#a78bfa", bear_target: "var(--red)" };
  const SCOLORS = { inactive: "#334155", rumored: "var(--amber)", developing: "var(--blue)", pending: "var(--text-dim)", confirmed: "var(--green)" };
  const FLASH_COLORS = { mil: "#ef4444", market: "#f59e0b", escal: "#ef4444", hormuz: "#0ea5e9", deesc: "#22c55e" };

  const TABS = [
    { id: "overview", label: "SITUATION" },
    { id: "flash", label: "⚡ FLASH" },
    { id: "sectors", label: "SECTEURS" },
    { id: "scenarios", label: "SCÉNARIOS" },
    { id: "deesc", label: "SORTIE" },
    { id: "patterns", label: "PATTERNS" },
    { id: "sources", label: "SOURCES" },
  ];

  return (
    <div className="root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700;800&display=swap');

        :root {
          --bg: #080c14;
          --surface: #111827;
          --surface-2: #1a2236;
          --surface-hover: #1f2b42;
          --border: #1e2d45;
          --border-light: #2a3a55;
          --text: #f1f5f9;
          --text-mid: #94a3b8;
          --text-dim: #4b5e78;
          --red: #ef4444;
          --amber: #f59e0b;
          --green: #22c55e;
          --blue: #3b82f6;
          --sans: 'DM Sans', system-ui, sans-serif;
          --mono: 'JetBrains Mono', monospace;
          --radius: 8px;
          --radius-sm: 4px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        .root {
          font-family: var(--sans);
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .header {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 20px 28px 0;
          position: relative;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--red), var(--amber), var(--red));
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--red);
        }
        .live-dot {
          width: 7px; height: 7px;
          background: var(--red);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .title {
          font-family: var(--mono);
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.3px;
          margin-top: 4px;
        }
        .sector-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .sector-tag {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          border: 1px solid;
        }

        .tabs { display: flex; gap: 2px; flex-wrap: wrap; }
        .tab {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid transparent;
          border-bottom: none;
          padding: 10px 16px;
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          cursor: pointer;
          border-radius: var(--radius) var(--radius) 0 0;
          transition: all 0.15s;
        }
        .tab:hover { background: var(--surface-hover); color: var(--text-mid); }
        .tab.active { background: var(--bg); color: var(--text); border-color: var(--border); }

        .content { padding: 24px 28px; max-width: 1400px; }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          margin-bottom: 16px;
        }
        .card-flush { padding: 0; overflow: hidden; }
        .card-accent { border-left: 3px solid; padding-left: 18px; }
        .card-label {
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        .kpi-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          transition: border-color 0.15s;
        }
        .kpi-card:hover { border-color: var(--border-light); }
        .kpi-label { font-size: 10px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
        .kpi-value { font-family: var(--mono); font-size: 22px; font-weight: 700; }
        .kpi-unit { font-size: 11px; color: var(--text-dim); }
        .kpi-delta { font-size: 11px; margin-top: 4px; margin-bottom: 8px; }

        .btn {
          font-family: var(--sans);
          font-size: 12px;
          font-weight: 500;
          padding: 7px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn:hover { background: var(--surface-hover); color: var(--text-mid); }
        .btn.active { border-color: currentColor; }

        .status-btn {
          font-family: var(--mono);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.5px;
          padding: 3px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid;
          cursor: pointer;
          min-width: 90px;
          text-align: center;
          transition: all 0.15s;
        }
        .status-btn:hover { filter: brightness(1.2); }

        .ticker-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          border: 1px solid;
        }
        .ticker-symbol { font-family: var(--mono); font-weight: 600; }
        .ticker-name { color: var(--text-dim); font-size: 10px; }

        .gauge-track {
          height: 10px;
          background: var(--bg);
          border-radius: 5px;
          position: relative;
          overflow: visible;
        }
        .gauge-gradient {
          position: absolute;
          inset: 0;
          border-radius: 5px;
          background: linear-gradient(90deg, var(--green) 0%, var(--amber) 50%, var(--red) 100%);
          opacity: 0.25;
        }
        .gauge-marker {
          position: absolute;
          top: -5px;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--surface);
          border: 3px solid;
          transform: translateX(-50%);
          transition: left 0.5s;
        }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          transition: background 0.1s;
        }
        .row:last-child { border-bottom: none; }
        .row:hover { background: var(--surface-hover); }
        .row-header {
          padding: 8px 14px;
          background: color-mix(in srgb, var(--surface-2) 60%, transparent);
          font-size: 10px;
          letter-spacing: 1px;
          color: var(--text-dim);
          font-weight: 600;
        }

        .weight-bar { display: flex; gap: 2px; }
        .weight-pip { width: 3px; height: 11px; border-radius: 1px; }

        .phase-chip {
          padding: 5px 12px;
          border-radius: var(--radius-sm);
          font-size: 10px;
          font-weight: 500;
          border: 1px solid;
          transition: all 0.15s;
        }

        .prob-track {
          flex: 1;
          height: 8px;
          background: var(--bg);
          border-radius: 4px;
          overflow: hidden;
        }
        .prob-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s;
        }

        .score-bar { display: flex; gap: 1px; }
        .score-pip { width: 3px; height: 10px; border-radius: 1px; }

        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.2s ease both; }
      `}</style>

      {/* ══════ HEADER ══════ */}
      <header className="header">
        <div className="header-top">
          <div>
            <div className="live-badge">
              <span className="live-dot" />
              LIVE — JOUR {dayCount} — SCORE {score}/10
            </div>
            <h1 className="title">IRAN CONFLICT — TRADING DASHBOARD</h1>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4, fontFamily: "var(--mono)" }}>
              Op. Roaring Lion (ISR) / Op. Epic Fury (US) / True Promise IV (IRN)
            </div>
          </div>
          <div className="sector-tags">
            {SECTORS.map(s => (
              <span key={s.id} className="sector-tag" style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)`, color: s.color, borderColor: `color-mix(in srgb, ${s.color} 25%, transparent)` }}>
                {s.icon} {s.name.split(" / ")[0].split(" (")[0]}
              </span>
            ))}
          </div>
        </div>
        <nav className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === "deesc" && confirmed > 0 && <span style={{ color: "var(--green)", marginLeft: 4 }}>({confirmed})</span>}
            </button>
          ))}
        </nav>
      </header>

      {/* ══════ CONTENT ══════ */}
      <main className="content">

        {/* ─── OVERVIEW ─── */}
        {tab === "overview" && (
          <div className="animate-in">
            <div className="card">
              <div className="card-label">Score Composite d'Escalation</div>
              <ScoreGauge score={parseFloat(score)} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 16 }}>
                {ESCAL_COMPONENTS.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <div className="score-bar">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <div key={j} className="score-pip" style={{ background: j < c.score ? (c.score >= 7 ? "var(--red)" : c.score >= 4 ? "var(--amber)" : "var(--green)") : "var(--border)" }} />
                      ))}
                    </div>
                    <span style={{ color: "var(--text-mid)", flex: 1 }}>{c.name}</span>
                    <span style={{ color: "var(--text-dim)", fontSize: 10, fontFamily: "var(--mono)" }}>{c.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="kpi-grid" style={{ marginBottom: 16 }}>
              {[
                { label: "Brent", val: "$80.5", unit: "/bbl", delta: "Repli du $85 ATH. GS Q2 $76", color: "var(--amber)", bars: [79,78,84,85,80.5], bl: ["L","L*","M","M*","Me"] },
                { label: "WTI", val: "$75.1", unit: "/bbl", delta: "Iraq -1.5Mbpd. Gas $3.11", color: "var(--amber)", bars: [73,71,77,78,75.1], bl: ["L","L*","M","M*","Me"] },
                { label: "Or Spot", val: "$5,121", unit: "/oz", delta: "⚠️ -5% M, -3.6% Me. Miners -17%", color: "#eab308", bars: [5300,5400,5042,5000,5121], bl: ["L","L*","M","M*","Me"] },
                { label: "Hormuz", val: "FERMÉ", unit: "VLCC W700 ATH", delta: "329 tankers bloqués. 72 VLCCs", color: "var(--red)", bars: [30,5,0,0,0], bl: ["L","L*","M","M*","Me"] },
                { label: "EU Gas", val: "+70%+", unit: "cette sem", delta: "Qatar halt. Iraq stockage plein", color: "var(--blue)", bars: [70,85,100,95,90], bl: ["L","L*","M","M*","Me"] },
                { label: "VIX", val: "23.2", unit: "", delta: "Repli du 27.3 mais elevated", color: "#8b5cf6", bars: [22,20,27,27.3,23.2], bl: ["L","L*","M","M*","Me"] },
                { label: "UAE ETF", val: "$20.31", unit: "", delta: "Consulat US Dubai explosé", color: "var(--red)", bars: [20.5,20.3,20.3,20.3,20.3], bl: ["L","L*","M","M*","Me"] },
                { label: "S&P 500", val: "-0.65%", unit: "mercredi", delta: "Tech rebond, énergie/banques down", color: "#8b5cf6", bars: [99,100,98.4,97,98.5], bl: ["L","L*","M","M*","Me"] },
              ].map((m, i) => (
                <div key={i} className="kpi-card">
                  <div className="kpi-label">{m.label}</div>
                  <div className="kpi-value" style={{ color: m.color }}>{m.val}<span className="kpi-unit"> {m.unit}</span></div>
                  <div className="kpi-delta" style={{ color: m.color }}>{m.delta}</div>
                  <MiniBar values={m.bars} color={m.color} labels={m.bl} />
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-label">Progression du Conflit</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {PHASES.map((p, i) => (
                  <div key={i} className="phase-chip" style={{
                    background: p.status === "active" ? "color-mix(in srgb, var(--red) 12%, transparent)" : p.status === "completed" ? "var(--surface-2)" : "transparent",
                    borderColor: p.status === "active" ? "var(--red)" : "var(--border)",
                    color: p.status === "active" ? "var(--red)" : p.status === "completed" ? "var(--text-dim)" : "var(--border)",
                    animation: p.status === "active" ? "pulse 3s infinite" : "none",
                  }}>
                    {p.label} <span style={{ fontSize: 8, opacity: .7, marginLeft: 3 }}>{p.range}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key developments card */}
            <div className="card card-accent" style={{ borderColor: "var(--red)" }}>
              <div className="card-label" style={{ color: "var(--red)" }}>🔴 DÉVELOPPEMENTS CRITIQUES JOUR 5 (4 MARS)</div>
              <div style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.8 }}>
                <div>• <strong style={{ color: "var(--text)" }}>Iran death toll 1,045+</strong> — frappes continues sur Tehran (Basij, sécurité interne), Karaj, Isfahan</div>
                <div>• <strong style={{ color: "var(--text)" }}>Turkiye intercepte missile iranien</strong> — NATO air defense détruit balistique dans la Méditerranée orientale</div>
                <div>• <strong style={{ color: "var(--text)" }}>IRIS Dena coulé</strong> — frégate iranienne torpillée par sous-marin US au large du Sri Lanka</div>
                <div>• <strong style={{ color: "var(--text)" }}>Consulat US Dubai</strong> — explosions. Ambassades fermées : Kuwait, Liban, Arabie Saoudite</div>
                <div>• <strong style={{ color: "var(--text)" }}>Bushehr menacé</strong> — Russie avertit, explosions à proximité du périmètre nucléaire</div>
                <div>• <strong style={{ color: "var(--text)" }}>Container ship frappé au Hormuz</strong> — consolide le blocus. Trump promet assurance/escorte mais marché sceptique</div>
                <div>• <strong style={{ color: "var(--text)" }}>Or -5% mardi</strong> — profit-taking + DXY fort + taux 10Y hausse. Rebond partiel mercredi à $5,162</div>
                <div>• <strong style={{ color: "var(--text)" }}>Fed : hold "quite some time"</strong> — rate cuts repoussés à sept 2026. Kashkari/Hammack prudents</div>
                <div>• <strong style={{ color: "var(--text)" }}>Goldman : Brent Q2 $76 avg</strong> — +$10. "Si Hormuz 5 sem de plus → $100". UBS aussi +$10</div>
                <div>• <strong style={{ color: "var(--text)" }}>NCRI annonce gouvernement provisoire</strong> — opposition iranienne en exil se positionne pour transition</div>
              </div>
            </div>
          </div>
        )}

        {/* ─── FLASH NEWS ─── */}
        {tab === "flash" && (
          <div className="animate-in">
            <div className="card-label">⚡ FIL D'ÉVÉNEMENTS — 28 FÉV → 3 MARS 2026</div>
            <div className="card card-flush">
              {FLASH_NEWS.map((n, i) => (
                <div key={i} className="row" style={{ gap: 12 }}>
                  <span style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--mono)", flexShrink: 0, width: 70 }}>{n.time}</span>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: FLASH_COLORS[n.cat], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--text-mid)", flex: 1 }}>{n.text}</span>
                  <span style={{ fontSize: 9, color: FLASH_COLORS[n.cat], fontFamily: "var(--mono)", flexShrink: 0, padding: "2px 6px", background: `color-mix(in srgb, ${FLASH_COLORS[n.cat]} 10%, transparent)`, borderRadius: 3 }}>{n.cat.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── SECTORS ─── */}
        {tab === "sectors" && (
          <div className="animate-in">
            <div style={{ display: "flex", gap: 5, marginBottom: 20, flexWrap: "wrap" }}>
              {SECTORS.map(s => (
                <button key={s.id} className={`btn ${sector === s.id ? "active" : ""}`}
                  onClick={() => setSector(s.id)}
                  style={sector === s.id ? { background: `color-mix(in srgb, ${s.color} 12%, transparent)`, color: s.color, borderColor: s.color } : {}}>
                  {s.icon} {s.name.split(" / ")[0].split(" (")[0]}
                </button>
              ))}
            </div>

            {sec && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: sec.color, fontFamily: "var(--mono)" }}>{sec.icon} {sec.name}</span>
                  <span style={{ fontSize: 10, padding: "4px 10px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", color: "var(--text-mid)", fontFamily: "var(--mono)" }}>
                    {sec.horizon}
                  </span>
                </div>

                {sec.thesis && (
                  <div className="card card-accent" style={{ borderColor: sec.color, fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7 }}>
                    <span style={{ color: sec.color, fontWeight: 700 }}>📋 THÈSE :</span> {sec.thesis}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <div className="card-label">Tickers</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {sec.tickers.map((t, i) => (
                      <span key={i} className="ticker-chip" style={{ background: `color-mix(in srgb, ${sec.color} 8%, transparent)`, borderColor: `color-mix(in srgb, ${sec.color} 20%, transparent)` }}>
                        <span className="ticker-symbol" style={{ color: sec.color }}>{t.symbol}</span>
                        <span className="ticker-name">{t.name}</span>
                      </span>
                    ))}
                  </div>
                  {sec.etfs.length > 0 && (
                    <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                      {sec.etfs.map((e, i) => (
                        <span key={i} style={{ fontSize: 10, padding: "3px 8px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", color: "var(--text-mid)" }}>
                          ETF: {e.symbol} — {e.note}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card card-flush" style={{ marginBottom: 14 }}>
                  <div className="row-header">INDICATEURS CLÉS</div>
                  {sec.kpis.map((k, i) => (
                    <div key={i} className="row">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: SIG[k.sig] || "var(--text-dim)" }} />
                        <span style={{ fontSize: 13, color: "var(--text)" }}>{k.name}</span>
                        <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{k.src}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: sec.color, fontFamily: "var(--mono)" }}>{k.val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="card">
                    <div className="card-label" style={{ color: "var(--red)" }}>⚠️ Signaux d'Exhaustion</div>
                    {sec.exhaustion.map((e, i) => (
                      <div key={i} style={{ fontSize: 12, color: "var(--text-mid)", padding: "5px 0", borderBottom: i < sec.exhaustion.length - 1 ? "1px solid var(--border)" : "none", display: "flex", gap: 8 }}>
                        <span style={{ color: "var(--red)", fontWeight: 700, fontFamily: "var(--mono)", flexShrink: 0 }}>#{i + 1}</span>
                        <span>{e}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card card-accent" style={{ borderColor: sec.color }}>
                    <div className="card-label" style={{ color: sec.color }}>🎯 Fenêtre de Sortie</div>
                    <p style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7 }}>{sec.exit}</p>
                  </div>
                </div>

                {sec.histPattern && (
                  <div className="card" style={{ marginTop: 12, background: "color-mix(in srgb, var(--surface-2) 60%, var(--bg))" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div className="card-label" style={{ marginBottom: 0 }}>📐 PATTERN HISTORIQUE</div>
                      <span style={{ fontSize: 10, padding: "3px 8px", background: "color-mix(in srgb, var(--amber) 12%, transparent)", borderRadius: "var(--radius-sm)", color: "var(--amber)", fontWeight: 500 }}>{sec.histPattern.title}</span>
                    </div>
                    {sec.histPattern.items.map((item, i) => (
                      <div key={i} style={{ fontSize: 12, color: item.startsWith("⚡") ? "var(--text)" : "var(--text-mid)", lineHeight: 1.7, padding: "4px 0", borderBottom: i < sec.histPattern.items.length - 1 ? "1px solid var(--border)" : "none", fontWeight: item.startsWith("⚡") ? 500 : 400 }}>
                        {!item.startsWith("⚡") && <span style={{ color: "var(--text-dim)", fontFamily: "var(--mono)", marginRight: 8 }}>•</span>}
                        {item}
                      </div>
                    ))}
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "color-mix(in srgb, var(--amber) 6%, transparent)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--amber)" }}>
                      <span style={{ fontSize: 10, color: "var(--amber)", fontWeight: 600, letterSpacing: 1 }}>ANALOGIE : </span>
                      <span style={{ fontSize: 11, color: "var(--text-mid)" }}>{sec.histPattern.analog}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── SCENARIOS ─── */}
        {tab === "scenarios" && (
          <div className="animate-in">
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {SCENARIOS.map(s => (
                <button key={s.id} className={`btn ${scenario === s.id ? "active" : ""}`}
                  onClick={() => setScenario(s.id)}
                  style={{ flex: 1, textAlign: "center", ...(scenario === s.id ? { background: `color-mix(in srgb, ${s.color} 12%, transparent)`, color: s.color, borderColor: s.color } : {}) }}>
                  <div style={{ fontWeight: 600 }}>{s.label.split(" — ")[0]}</div>
                  <div style={{ fontSize: 10, opacity: .8, marginTop: 2 }}>{s.prob}%</div>
                </button>
              ))}
            </div>

            {scen && (
              <>
                <div className="card card-accent" style={{ borderColor: scen.color }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: scen.color, fontFamily: "var(--mono)", marginBottom: 4 }}>{scen.label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-mid)" }}>{scen.desc}</div>
                </div>

                <div className="card card-flush">
                  <div className="row-header">PRICE TARGETS PAR SECTEUR</div>
                  {scen.targets.map((t, i) => (
                    <div key={i} className="row">
                      <span style={{ fontSize: 13 }}>{t.s}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--mono)", color: scen.color }}>{t.v}</span>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="card-label">Comparaison des Probabilités</div>
                  {SCENARIOS.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: s.color, fontFamily: "var(--mono)", fontWeight: 600, width: 45 }}>{s.id.toUpperCase()}</span>
                      <div className="prob-track">
                        <div className="prob-fill" style={{ width: `${s.prob}%`, background: s.color }} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-mid)", fontFamily: "var(--mono)", width: 35 }}>{s.prob}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── DE-ESCALATION ─── */}
        {tab === "deesc" && (
          <div className="animate-in">
            <div style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 6 }}>
              Cliquer sur un statut pour le changer. 3+ signaux Maritime → CONFIRMED = fenêtre de sortie.
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 18 }}>
              Confirmés: <span style={{ color: "var(--green)", fontWeight: 700 }}>{confirmed}</span>/{total}
              <span style={{ marginLeft: 12 }}>
                {STATUSES.map(s => <span key={s} style={{ marginRight: 8 }}><span style={{ color: SCOLORS[s] }}>■</span> {s.toUpperCase()}</span>)}
              </span>
            </div>

            {deesc.map((cat, ci) => (
              <div key={ci} style={{ marginBottom: 16 }}>
                <div className="card-label">{cat.cat}</div>
                <div className="card card-flush">
                  {cat.signals.map((sig, si) => (
                    <div key={si} className="row">
                      <span style={{ flex: 1, fontSize: 12 }}>{sig.text}</span>
                      <div className="weight-bar" style={{ marginRight: 12 }}>
                        {Array.from({ length: 5 }).map((_, w) => (
                          <div key={w} className="weight-pip" style={{ background: w < sig.weight ? "var(--amber)" : "var(--border)" }} />
                        ))}
                      </div>
                      <button className="status-btn" onClick={() => cycleStatus(ci, si)} style={{
                        background: `color-mix(in srgb, ${SCOLORS[sig.status]} 15%, transparent)`,
                        borderColor: `color-mix(in srgb, ${SCOLORS[sig.status]} 40%, transparent)`,
                        color: SCOLORS[sig.status],
                      }}>
                        {sig.status.toUpperCase()}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="card" style={{ borderTop: "2px solid var(--amber)" }}>
              <div className="card-label" style={{ color: "var(--amber)" }}>🎯 Ordre de Sortie</div>
              <div style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 2 }}>
                {[
                  { n: 1, name: "TANKERS", c: "#0ea5e9", t: "Sortir en premier. 2-5 jours de réouverture au rate collapse. P&I = leading indicator." },
                  { n: 2, name: "O&G CDN", c: "#f59e0b", t: "Trimmer sur SPR/OPEC+. Full exit cessez-le-feu. WCS = early warning." },
                  { n: 3, name: "GULF SHORT", c: "#ef4444", t: "Cover dès vols + ceasefire. RISQUE SQUEEZE. Max 5-8% portfolio." },
                  { n: 4, name: "FERTILISANTS", c: "#22c55e", t: "Tenir → mai (planting). Qatar LNG halt = catalyseur prolongé." },
                  { n: 5, name: "OR", c: "#eab308", t: "Dernier. Core = keep. Trade premium. Exit si dé-escalation + Fed hawkish." },
                ].map(e => (
                  <div key={e.n}>
                    <span style={{ color: "var(--red)", fontWeight: 700, fontFamily: "var(--mono)" }}>{e.n}.</span>{" "}
                    <span style={{ color: e.c, fontWeight: 700 }}>{e.name}</span> — {e.t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── PATTERNS ─── */}
        {tab === "patterns" && (
          <div className="animate-in">
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-label" style={{ color: "var(--amber)" }}>📐 RÈGLES HISTORIQUES — CE QUE LES GUERRES PASSÉES NOUS DISENT</div>
              {PATTERN_RULES.map((r, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: i < PATTERN_RULES.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
                    <span style={{ color: "var(--amber)", fontFamily: "var(--mono)", marginRight: 8 }}>#{i + 1}</span>
                    {r.rule}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-mid)", paddingLeft: 28 }}>{r.desc}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-label">DEGRÉ D'ANALOGIE AVEC LE CONFLIT ACTUEL</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12 }}>
                Évaluation subjective : 1 = peu comparable, 5 = très comparable. Mise à jour Jour 6 : Hegseth 'accelerating'. P&I effectif. Premières pertes US.
              </div>
              {HIST_CONFLICTS.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-mid)", width: 200, flexShrink: 0 }}>{c.name} ({c.year})</span>
                  <div style={{ display: "flex", gap: 3, flex: 1 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} style={{
                        flex: 1, maxWidth: 60, height: 14, borderRadius: 2,
                        background: j < c.analogy ? "var(--amber)" : "var(--border)",
                        opacity: j < c.analogy ? 0.5 + (j / 5) * 0.5 : 0.3,
                        transition: "all 0.3s",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "var(--mono)", width: 25 }}>{c.analogy}/5</span>
                </div>
              ))}
            </div>

            <div className="card-label">DÉTAIL PAR CONFLIT</div>
            {HIST_CONFLICTS.map((c, i) => (
              <div key={i} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mono)" }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 10 }}>{c.year} — {c.duration}</span>
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} style={{ width: 8, height: 8, borderRadius: 2, background: j < c.analogy ? "var(--amber)" : "var(--border)" }} />
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 12 }}>
                  <div style={{ background: "var(--bg)", padding: 10, borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: 1, marginBottom: 4 }}>PÉTROLE</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--amber)", fontFamily: "var(--mono)" }}>{c.oilChange}</div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{c.oilBefore} → {c.oilPeak}</div>
                    <div style={{ fontSize: 10, color: "var(--text-mid)", marginTop: 2 }}>Recovery: {c.oilRecovery}</div>
                  </div>
                  <div style={{ background: "var(--bg)", padding: 10, borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: 1, marginBottom: 4 }}>OR</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#eab308", fontFamily: "var(--mono)" }}>{c.goldChange}</div>
                    <div style={{ fontSize: 10, color: "var(--text-mid)", marginTop: 2 }}>{c.goldNote}</div>
                  </div>
                  <div style={{ background: "var(--bg)", padding: 10, borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: 1, marginBottom: 4 }}>TANKERS</div>
                    <div style={{ fontSize: 10, color: "var(--text-mid)" }}>{c.shippingNote}</div>
                  </div>
                  <div style={{ background: "var(--bg)", padding: 10, borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: 1, marginBottom: 4 }}>FERTILISANTS</div>
                    <div style={{ fontSize: 10, color: "var(--text-mid)" }}>{c.fertNote}</div>
                  </div>
                </div>

                <div style={{ background: "color-mix(in srgb, var(--amber) 8%, transparent)", padding: "8px 12px", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--amber)" }}>
                  <span style={{ fontSize: 11, color: "var(--amber)", fontWeight: 600 }}>💡 </span>
                  <span style={{ fontSize: 12, color: "var(--text-mid)" }}>{c.keyLesson}</span>
                </div>
              </div>
            ))}

            <div className="card" style={{ borderTop: "2px solid var(--red)" }}>
              <div className="card-label" style={{ color: "var(--red)" }}>🎯 POSITIONNEMENT ACTUEL VS HISTORIQUE — JOUR 7 UPDATE (6 MARS)</div>
              <div style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.8 }}>
                <p style={{ marginBottom: 8 }}>Le conflit Iran 2026 est <strong style={{ color: "var(--text)" }}>sans précédent direct</strong> — VLCC rates ATH (W700), regime change en cours, multi-fronts actifs (Liban, Iraq, Bahrain, Azerbaijan, NATO/Turquie). Hegseth 'just getting started'. Israel 'next phase'. Aucun signal de dé-escalation.</p>
                <div style={{ marginBottom: 6 }}><span style={{ color: "var(--amber)", fontWeight: 600 }}>Pétrole :</span> Brent spot $89 (+22% 1 sem). Goldman/UBS +$10 forecasts. Iraq -1.5Mbpd forced cuts. Gas US $3.19 (+22¢/sem). Oxford Econ : 'max 2 mois, sell extreme moves'. OilPrice : Canada = 'most reliable supplier' grâce TMX.</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: "#8b5cf6", fontWeight: 600 }}>🏭 Raffineurs US :</span> Diesel crack EU +34% (2-yr high). Ras Tanura fermée. 4.3Mbpd produits raffinés bloqués. MPC = pick #1. Crack spread = upside non-linéaire.</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: "#06b6d4", fontWeight: 600 }}>🏗️ Aluminium NA :</span> Alba force majeure. Qatalum shutdown. LME $3,418 (4-yr high). Citi/Goldman target $3,600. Smelters GCC = 6-12 mois redémarrage.</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: "#ec4899", fontWeight: 600 }}>🧪 Chimie NA :</span> Qatar petrochim down. EU chimie +5% prix. DOW/LYB feedstock = shale gas NA. Supply shift structurel.</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: "#eab308", fontWeight: 600 }}>Or :</span> Correction -6% du ATH ($5,400 → $5,080). DXY fort. MAIS : Dubai air cargo halt = 20% flux physiques bloqués. Premiums physiques Inde flip. Physical market tightens pendant paper vend. Pattern classique — thèse intacte si conflit dure.</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: "#0ea5e9", fontWeight: 600 }}>Tankers :</span> VLCC W700 ATH. $20/bbl freight. 329 bloqués. P&I cancel J2. AIS jamming massif. Bessent 'annonces à venir' mais DFC toujours pas opérationnel. Shipping CEOs : 'not enough until genuinely safe'.</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: "#22c55e", fontWeight: 600 }}>Fertilisants :</span> Urea +10-16%, phosphate +$30/t. 25% azote mondial via Hormuz. Qatar LNG toujours down. DOJ probe antitrust. 30j supply chain = bombe à retardement.</div>
                <div><span style={{ color: "var(--red)", fontWeight: 600 }}>Gulf/Dubai :</span> Bahrain frappé (1re fois). Azerbaijan frappé. 500K+ fuient Beirut. Goldman CEO : 'needs weeks to digest'. Le modèle GCC est sous attaque physique — aucun précédent.</div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SOURCES ─── */}
        {tab === "sources" && (
          <div className="animate-in">
            <div className="card card-flush" style={{ marginBottom: 16 }}>
              <div className="row-header" style={{ display: "grid", gridTemplateColumns: "140px 1fr 80px" }}>
                <span>SOURCE</span><span>UTILITÉ</span><span>FRÉQ</span>
              </div>
              {SOURCES.map((s, i) => (
                <div key={i} className="row" style={{ display: "grid", gridTemplateColumns: "140px 1fr 80px", padding: "8px 14px" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: "var(--blue)" }}>{s.url}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-mid)" }}>{s.use}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{s.freq}</div>
                </div>
              ))}
            </div>

            <div className="card card-accent" style={{ borderColor: "var(--blue)" }}>
              <div className="card-label" style={{ color: "var(--blue)" }}>📋 Routine Quotidienne</div>
              {ROUTINE.map(([t, d], i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--text-mid)", padding: "3px 0" }}>
                  <span style={{ color: "var(--text-dim)", fontFamily: "var(--mono)", marginRight: 10 }}>{t}</span>{d}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ padding: "10px 28px", borderTop: "1px solid var(--border)", fontSize: 9, color: "var(--border)", textAlign: "center" }}>
        Données manuelles — Jour 7 — {new Date().toLocaleDateString("fr-CA")} — Dernière MàJ: vendredi 6 mars 2026 (données J7 — Bahrain/Azerbaijan strikes, Brent $89, Or $5,080, fertilisants +10-16%)
      </footer>
    </div>
  );
}
