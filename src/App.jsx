import { useState, useCallback } from "react";

const CONFLICT_START = new Date("2026-02-28T00:00:00Z");
function getDayCount() {
  return Math.ceil((new Date() - CONFLICT_START) / (1000 * 60 * 60 * 24));
}

// ─── ESCALATION SCORE ───
const ESCAL_COMPONENTS = [
  { name: "Hormuz Fermeture", weight: 25, score: 10 },
  { name: "Intensité Militaire", weight: 20, score: 9 },
  { name: "Riposte Iran", weight: 15, score: 9 },
  { name: "Escalation Régionale", weight: 15, score: 9 },
  { name: "Diplomatie", weight: 15, score: 2 },
  { name: "Risque Nucléaire", weight: 10, score: 7 },
];
const compositeScore = () => {
  const tw = ESCAL_COMPONENTS.reduce((a, c) => a + c.weight, 0);
  return (ESCAL_COMPONENTS.reduce((a, c) => a + c.score * c.weight, 0) / tw).toFixed(1);
};

// ─── PHASES ───
const PHASES = [
  { label: "Buildup", range: "Jan-Fév", status: "completed" },
  { label: "Frappes Initiales", range: "28 Fév", status: "completed" },
  { label: "Riposte Iran", range: "1-3 Mar", status: "active" },
  { label: "Fermeture Hormuz", range: "2 Mar+", status: "active" },
  { label: "Front Liban", range: "2 Mar+", status: "active" },
  { label: "Attrition", range: "Sem 1-3", status: "upcoming" },
  { label: "Négociation", range: "Sem 2-5", status: "upcoming" },
  { label: "Cessez-le-feu", range: "Sem 4-8", status: "upcoming" },
  { label: "Réouverture", range: "Post-cessez", status: "upcoming" },
];

// ─── SCENARIOS ───
const SCENARIOS = [
  {
    id: "bull", label: "BULL — Escalation Prolongée", prob: 30, color: "var(--green)",
    desc: "Hormuz fermé 3+ semaines, conflit multi-fronts (Liban, proxies), SPR non déployé, OPEC+ insuffisant",
    targets: [
      { s: "Brent", v: "$100-120/bbl" }, { s: "Or", v: "$5,800-6,200/oz" },
      { s: "Tankers (VLCC ME-CN)", v: "W300+ / $15M+" }, { s: "O&G CDN (XEG)", v: "+25-40%" },
      { s: "Potash (NTR)", v: "+15-25%" }, { s: "UAE ETF (short)", v: "-25-35%" },
    ],
  },
  {
    id: "base", label: "BASE — Résolution 4-5 sem", prob: 50, color: "var(--amber)",
    desc: "Trump timeline (4-5 sem), Hormuz rouvre sem 3-4, Iran affaibli militairement, négociations via Oman",
    targets: [
      { s: "Brent", v: "$90-100 → retour $75" }, { s: "Or", v: "$5,500-5,800 → $5,200" },
      { s: "Tankers (VLCC ME-CN)", v: "W225-300 → normalise" }, { s: "O&G CDN (XEG)", v: "+15-25% → retour" },
      { s: "Potash (NTR)", v: "+10-15%" }, { s: "UAE ETF (short)", v: "-15-25%" },
    ],
  },
  {
    id: "bear", label: "BEAR — Dé-escalation Rapide", prob: 20, color: "var(--red)",
    desc: "Iran capitule vite (leadership décapité), Hormuz rouvre <10 jours, deal rapide",
    targets: [
      { s: "Brent", v: "Retour $68-72" }, { s: "Or", v: "Retour $5,000-5,100" },
      { s: "Tankers (VLCC ME-CN)", v: "Collapse rapide" }, { s: "O&G CDN (XEG)", v: "Give-back 50-70%" },
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
      { name: "Transit Hormuz", val: "~0% (fermé de facto)", sig: "bull", src: "MarineTraffic/Kpler" },
      { name: "VLCC ME-CN (TD3C)", val: "W225 / ~$12M", sig: "bull", src: "LSEG/Baltic" },
      { name: "TD3C YTD", val: "Quasi triplé", sig: "bull", src: "LSEG" },
      { name: "War Risk Premium", val: "+300% (→1% hull value)", sig: "bull", src: "Marsh/Lloyd's" },
      { name: "P&I Cancel", val: "Effective 5 mars", sig: "bull", src: "Gard/Skuld/NorthStd" },
      { name: "Tankers Ancrés", val: "150+", sig: "bull", src: "MarineTraffic AIS" },
      { name: "Tankers Endommagés", val: "5+, 1 crew tué", sig: "bull", src: "UKMTO/Reuters" },
      { name: "Cape Rerouting", val: "Maersk/MSC/Hapag/CMA", sig: "bull", src: "CNBC" },
    ],
    exhaustion: [
      "Rates VLCC déclinent 2+ jours malgré Hormuz fermé",
      "Assureurs P&I reprennent couverture Gulf (post-5 mars)",
      "Premier tanker commercial traverse Hormuz avec succès",
      "Volume decay >30% sur tanker equities (3-day avg)",
      "US Navy annonce programme d'escorte de convois",
    ],
    exit: "PREMIER à sortir. Tanker rates collapse en 2-5 jours post-réouverture.",
    histPattern: {
      title: "Tanker War 1984-88 + Gulf War I 1990",
      items: [
        "1984-88 : 400+ navires attaqués dans le Golfe, assurances x3-5x, mais les tankers ont continué à naviguer. Rates élevés soutenus ~4 ans.",
        "1990 : Rates spot +100% sur invasion Kuwait, normalisation rapide (<6 mois) post-libération.",
        "2022-23 : Ukraine = tanker rates TNK +108%, INSW +98%, FRO +70% sur 12 mois (rerouting, sanctions).",
        "⚡ JOUR 4 UPDATE : TD3C quasi triplé YTD, assureurs P&I annulent couverture. Plus violent que 1990. Fermeture de facto totale — pas comparable à une simple menace.",
      ],
      analog: "Tanker War 1987 (attaques + mines Hormuz, US Navy escorte) — mais cette fois fermeture totale + annulation assurances = aucun transit commercial.",
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
      { name: "Brent", val: "$83-84/bbl (+8% mardi)", sig: "bull", src: "CNBC/Yahoo" },
      { name: "WTI", val: "$76-77/bbl (+7.5%)", sig: "bull", src: "CNBC/Yahoo" },
      { name: "Brent 5-day", val: "+17.8%", sig: "bull", src: "Yahoo Finance" },
      { name: "WCS Discount", val: "Monitor", sig: "neutral", src: "Net Energy" },
      { name: "TMX Pipeline", val: "Stable", sig: "bull", src: "Trans Mountain" },
      { name: "SPR Release", val: "Aucun — 'wait-and-see'", sig: "bull", src: "DOE/WH" },
      { name: "OPEC+ Output", val: "+206k bpd annoncé", sig: "watch", src: "OPEC" },
      { name: "Aramco Ras Tanura", val: "Attaqué (drones)", sig: "bull", src: "SPA/Reuters" },
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
        "⚡ JOUR 4 : Brent +18% en 5 jours à $84. Analystes voient $100+ si Hormuz reste fermé. Barclays/UBS projettent $100-120. CDN O&G bénéficie du TMX = pas dépendant Hormuz.",
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
      { name: "Or Spot", val: "$5,350-5,400 (mardi AM)", sig: "bull", src: "Kitco" },
      { name: "Or Session High", val: "$5,738 (Asie mardi)", sig: "bull", src: "News24" },
      { name: "ATH Janvier", val: "$5,589", sig: "neutral", src: "CBS News" },
      { name: "GLD Flows", val: "Record Jan ($18.7B)", sig: "bull", src: "World Gold Council" },
      { name: "Real Rates", val: "10Y → 4.10%", sig: "mixed", src: "FRED" },
      { name: "DXY", val: "Fort (+0.9%)", sig: "mixed", src: "TradingView" },
      { name: "Argent (Ag)", val: "$90.56/oz (+1.9%)", sig: "bull", src: "News24" },
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
        "⚡ JOUR 4 : Or déjà en bull séculaire (+100% sur 12 mois). $5,400 spot, ATH $5,589. UBS/Bloomberg ciblent $6,000 H2 2026. Banques centrales acheteuses record. Mais DXY fort + taux 10Y en hausse = headwinds.",
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
      { name: "Potash Spot (MOP)", val: "Rising", sig: "bull", src: "CRU/Argus" },
      { name: "EU Natgas", val: "+70% cette semaine", sig: "bull", src: "ICE/Yahoo" },
      { name: "Qatar LNG", val: "Production SUSPENDUE", sig: "bull", src: "Kpler/AJ" },
      { name: "Planting Season", val: "Mar-Mai", sig: "bull", src: "USDA" },
      { name: "Urea Prices", val: "Monitor", sig: "neutral", src: "Green Markets" },
      { name: "Russia/Belarus", val: "Contraint", sig: "bull", src: "IFA" },
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
        "⚡ JOUR 4 : EU natgas +70% cette semaine, Qatar suspend LNG. Combinaison inédite : fermeture Hormuz + halt Qatar + planting season. Pire que Ukraine pour le natgas EU.",
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
      { name: "Jebel Ali Port", val: "Frappé (missiles)", sig: "bear_target", src: "Kpler" },
      { name: "Abu Dhabi Port", val: "Infrastructure touchée", sig: "bear_target", src: "Kpler" },
      { name: "Dubai Vols", val: "Aéroport fermé", sig: "bear_target", src: "AP/CNN" },
      { name: "Expat Evacuations", val: "State Dept évac urgente", sig: "bear_target", src: "State Dept" },
      { name: "UAE Casualties", val: "Morts civils confirmés", sig: "bear_target", src: "NBC" },
      { name: "Ras Tanura", val: "Drones sur Aramco", sig: "bear_target", src: "SPA" },
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
        "⚡ JOUR 4 : MISSILES SUR JEBEL ALI + ABU DHABI + hôtels. Morts civils UAE/Kuwait/Bahrain. Aéroport fermé. State Dept évac urgente. C'est structurellement différent de tout précédent.",
      ],
      analog: "AUCUN précédent direct. Plus comparable à la crise 2008-09 (Emaar -80%) mais avec une composante MILITAIRE en plus.",
    },
  },
];

// ─── DE-ESCALATION ───
const STATUSES = ["inactive", "rumored", "developing", "pending", "confirmed"];
const initDeesc = () => [
  { cat: "Diplomatique", signals: [
    { text: "Iran temporary council ouvre back-channel (Larijani: 'won't negotiate')", weight: 3, status: "inactive" },
    { text: "Trump engage avec nouveau leadership iranien", weight: 4, status: "inactive" },
    { text: "Médiation Oman/Qatar formelle reprend", weight: 3, status: "inactive" },
    { text: "Résolution Conseil de Sécurité ONU (IAEA réunion urgente 2 mars)", weight: 2, status: "developing" },
  ]},
  { cat: "Militaire", signals: [
    { text: "Marine iranienne largement détruite (IRIS Jamaran coulé)", weight: 4, status: "confirmed" },
    { text: "Batteries côtières IRGC neutralisées (Jask frappé)", weight: 5, status: "developing" },
    { text: "US annonce objectifs atteints (Trump: 'ahead of schedule')", weight: 5, status: "developing" },
    { text: "Inventaires missiles Iran épuisés", weight: 3, status: "pending" },
    { text: "Hezbollah accepte cessez-le-feu séparé (PM Salam a banni activités mil.)", weight: 3, status: "developing" },
  ]},
  { cat: "Maritime", signals: [
    { text: "Premier tanker commercial traverse Hormuz", weight: 5, status: "inactive" },
    { text: "US Navy annonce escorte de convois", weight: 4, status: "pending" },
    { text: "Primes assurance guerre baissent (actuellement +300%, P&I cancelled)", weight: 4, status: "inactive" },
    { text: "Maersk/Hapag-Lloyd reprennent transit (actuellement tous suspendus)", weight: 5, status: "inactive" },
    { text: "AIS montre reprise trafic Hormuz (actuellement ~0%)", weight: 5, status: "inactive" },
  ]},
  { cat: "Marché", signals: [
    { text: "Courbe futures pétrole en contango", weight: 3, status: "pending" },
    { text: "VIX en baisse soutenue (actuellement 26.43, +23%)", weight: 2, status: "inactive" },
    { text: "Défense sous-performe SPY", weight: 2, status: "inactive" },
    { text: "Ratio Gold/Oil normalise", weight: 2, status: "pending" },
    { text: "UAE ETF rebondit sur volume", weight: 3, status: "inactive" },
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
  { name: "LSEG", url: "lseg.com", use: "TD3C VLCC rates", freq: "Daily" },
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
  { time: "3 Mar AM", text: "IRIB (broadcaster iranien) et Golestan Palace (UNESCO) frappés par Israël", cat: "mil" },
  { time: "3 Mar AM", text: "Brent $84/bbl (+8%), WTI $77 (+7.5%). 5ème jour de hausse consécutif", cat: "market" },
  { time: "3 Mar AM", text: "Or $5,738 en session asiatique (record intraday). Retrace à $5,350", cat: "market" },
  { time: "3 Mar AM", text: "S&P 500 -2.34%, Dow -1,200pts intraday, VIX 26.43 (+23%)", cat: "market" },
  { time: "3 Mar AM", text: "Israel incursion terrestre au Liban sud. Hezbollah : 'open war'", cat: "escal" },
  { time: "3 Mar AM", text: "Nikkei -6.65%, KOSPI -7.24% (pire jour depuis avril)", cat: "market" },
  { time: "2 Mar PM", text: "IRGC confirme Hormuz FERMÉ — 'tout navire sera incendié'", cat: "hormuz" },
  { time: "2 Mar PM", text: "Drones frappent ambassade US à Riyadh (dommages mineurs)", cat: "escal" },
  { time: "2 Mar PM", text: "Aramco Ras Tanura — drones interceptés, shrapnel cause feu", cat: "escal" },
  { time: "2 Mar PM", text: "P&I clubs (Gard, Skuld, NorthStd, London, American) annulent couverture guerre effective 5 mars", cat: "hormuz" },
  { time: "2 Mar PM", text: "Qatar suspend production LNG — drones iraniens sur infrastructure", cat: "escal" },
  { time: "2 Mar", text: "Hezbollah tire missiles/drones sur Haifa. Israel bombarde Beyrouth (52+ morts)", cat: "escal" },
  { time: "2 Mar", text: "Liban PM Salam interdit activités militaires Hezbollah, ordonne arrestations", cat: "deesc" },
  { time: "2 Mar", text: "Trump : opérations 4-5 semaines, 'substantially ahead of schedule'", cat: "mil" },
  { time: "2 Mar", text: "Rubio : 'the hardest hits are yet to come'", cat: "mil" },
  { time: "1-2 Mar", text: "6 militaires US tués, 18 blessés. 3 F-jets abattus par erreur par Kuwait", cat: "mil" },
  { time: "28 Fév-2 Mar", text: "787+ morts en Iran. Natanz endommagé. Khamenei confirmé mort. 40+ officials tués", cat: "mil" },
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
                { label: "Brent", val: "$84", unit: "/bbl", delta: "+18% 5-day", color: "var(--amber)", bars: [72,73,79,78,84], bl: ["V","S","L","L*","M"] },
                { label: "WTI", val: "$77", unit: "/bbl", delta: "+7.5% mardi", color: "var(--amber)", bars: [62,62,73,71,77], bl: ["V","S","L","L*","M"] },
                { label: "Or Spot", val: "$5,350", unit: "/oz", delta: "ATH $5,589 Jan", color: "#eab308", bars: [5100,5200,5300,5400,5350], bl: ["V","S","L","L*","M"] },
                { label: "Hormuz", val: "FERMÉ", unit: "~0% trafic", delta: "150+ ancrés, 5 touchés", color: "var(--red)", bars: [100,95,30,5,0], bl: ["V","S","L","L*","M"] },
                { label: "EU Gas", val: "+70%", unit: "cette sem", delta: "Qatar halt LNG", color: "var(--blue)", bars: [50,52,70,85,100], bl: ["V","S","L","L*","M"] },
                { label: "VIX", val: "26.43", unit: "", delta: "+23% mardi", color: "#8b5cf6", bars: [18,19,22,20,26], bl: ["V","S","L","L*","M"] },
                { label: "UAE ETF", val: "$20.31", unit: "", delta: "52w: $15.40-$22.29", color: "var(--red)", bars: [22,22,20.5,20.3,20.3], bl: ["V","S","L","L*","M"] },
                { label: "S&P 500", val: "-2.3%", unit: "mardi", delta: "Dow -1,200 intraday", color: "#8b5cf6", bars: [100,100,99,100,97.7], bl: ["V","S","L","L*","M"] },
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
              <div className="card-label" style={{ color: "var(--red)" }}>🔴 DÉVELOPPEMENTS CRITIQUES JOUR 4</div>
              <div style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.8 }}>
                <div>• <strong style={{ color: "var(--text)" }}>Hormuz fermé de facto</strong> — IRGC confirme fermeture, P&I annulées le 5 mars, 0 transit commercial</div>
                <div>• <strong style={{ color: "var(--text)" }}>Multi-fronts</strong> — Hezbollah rejoint (Haifa frappé), Israel incursion au Liban, proxies Iraq/Yémen actifs</div>
                <div>• <strong style={{ color: "var(--text)" }}>GCC sous feu</strong> — Jebel Ali, Abu Dhabi port, hôtels UAE, Ras Tanura, ambassade US Riyadh</div>
                <div>• <strong style={{ color: "var(--text)" }}>US tués</strong> — 6 militaires, 18 blessés. 3 jets abattus par erreur par Kuwait</div>
                <div>• <strong style={{ color: "var(--text)" }}>Trump timeline</strong> — 4-5 semaines, "ahead of schedule". Rubio: "hardest hits yet to come"</div>
                <div>• <strong style={{ color: "var(--text)" }}>Iran décapité mais combatif</strong> — Khamenei mort, 787+ morts Iran, Natanz endommagé. Larijani: "won't negotiate"</div>
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
                Évaluation subjective : 1 = peu comparable, 5 = très comparable. Mise à jour Jour 4 : analogie 1979 rehaussée (regime change + fermeture effective).
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
              <div className="card-label" style={{ color: "var(--red)" }}>🎯 POSITIONNEMENT ACTUEL VS HISTORIQUE — JOUR 4 UPDATE</div>
              <div style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.8 }}>
                <p style={{ marginBottom: 8 }}>Le conflit Iran 2026 est <strong style={{ color: "var(--text)" }}>sans précédent direct</strong> — premier Hormuz fermé de facto + regime change + multi-fronts (Liban, proxies, GCC sous feu).</p>
                <div style={{ marginBottom: 6 }}><span style={{ color: "var(--amber)", fontWeight: 600 }}>Pétrole :</span> Brent $84 (+18% 5-day). Sur trajectoire Golfe I (+89%). Analystes voient $100-120 si fermeture prolongée. OPEC+ (+206k bpd) insuffisant vs 14M bpd bloqués.</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: "#eab308", fontWeight: 600 }}>Or :</span> $5,350 spot, ATH $5,589 Jan. Session asiatique a touché $5,738. UBS/Bloomberg ciblent $6,000 H2. Mais DXY fort + 10Y → 4.10% = headwinds court terme.</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: "#0ea5e9", fontWeight: 600 }}>Tankers :</span> VLCC TD3C quasi triplé YTD à W225/$12M. P&I annulées 5 mars. NOUVEAU mécanisme : assureurs font le blocus, pas la marine iranienne.</div>
                <div style={{ marginBottom: 6 }}><span style={{ color: "#22c55e", fontWeight: 600 }}>Fertilisants :</span> EU natgas +70% semaine. Qatar halt LNG = sans précédent. Planting season lock-in demande mars-mai.</div>
                <div><span style={{ color: "var(--red)", fontWeight: 600 }}>Gulf/Dubai :</span> Jebel Ali + Abu Dhabi ports frappés. Hôtels touchés. Aéroport fermé. Morts civils GCC confirmés. UAE ETF $20.31. AUCUN précédent — première menace existentielle au modèle Dubai.</div>
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
        Données manuelles — Jour 4 — {new Date().toLocaleDateString("fr-CA")} — Dernière MàJ: mardi 3 mars 2026
      </footer>
    </div>
  );
}
