import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { fetchRevenue, fetchUserStats } from "../../../services/analytics.service";

const SCOPE_CONFIG = {
  today: {
    headline: "Five things to move today",
    subhead: "Trial decisions, at-risk beta testers and an Inner Circle call. Everything here has a revenue impact you can count.",
    pulse: [
      { k: "MRR", v: "€4,180", delta: "+8.2%", dir: "up", note: "Gold is 62% of it. Platinum is the gap." },
      { k: "TRIAL → PAID", v: "34%", delta: "+4 pts", dir: "up", note: "Above the 30% floor. Gold trials convert best." },
      { k: "ACTIVE TODAY", v: "38", delta: "−12%", dir: "down", note: "Friday dip. Normal, but watch Monday." },
      { k: "NEW SIGNUPS", v: "11", delta: "+3", dir: "up", note: "7 from challenge invites — organic is working." },
      { k: "AT RISK", v: "9", delta: "—", dir: "flat", note: "No feature activity in 7 days." },
    ],
    actions: [
      { id: "t1", tag: "REVENUE", tagTone: "gold", when: "before 12:00", t: "4 Gold trials end today — send the day-5 message", why: "All four used the AI coach more than 20 times. That is the group that converts. The message is written; it needs your name on it.", cta: "Review and send", impact: "+€1,196 if all convert", effort: "3 min", drawer: "support", target: "trials" },
      { id: "t2", tag: "CHURN", tagTone: "copper", when: "today", t: "9 beta testers have never opened a feature", why: "Enrolled, never activated. Day 21 comes either way. One WhatsApp with a single 15-minute workout link recovers most of them.", cta: "Send activation nudge", impact: "9 testers at risk", effort: "2 min", drawer: "message", target: "messaging" },
      { id: "t3", tag: "MARKETING", tagTone: "gold", when: "today", t: "Post the Clean Eating Fortnight announcement", why: "Your last challenge announcement drove 62 cheers and 18 replies — the best organic day this month. Monday's start needs today's post.", cta: "Open broadcast composer", impact: "~180 joins expected", effort: "5 min", drawer: "broadcast", target: "community" },
      { id: "t4", tag: "INNER CIRCLE", tagTone: "copper", when: "this afternoon", t: "2 applications waiting on your call", why: "Both answered all five questions in full. Average time to reply right now is four days; the promise on the screen says three.", cta: "Read and book calls", impact: "€798 / year each", effort: "12 min", drawer: "application", target: "applications" },
      { id: "t5", tag: "CONTENT", tagTone: "muted", when: "if time", t: "23 Vimeo workouts still sitting in draft", why: "Imported but never published, so nobody can see them. Publishing the six shortest ones widens the 15-minute filter, which is the most-used one.", cta: "Open workout library", impact: "library 170 → 193", effort: "8 min", drawer: "workout", target: "workouts" },
    ],
  },
  week: {
    headline: "The week at a glance",
    subhead: "Trial-to-paid is holding at 34%. Focus is moving Ghana from zero revenue to paying.",
    pulse: [
      { k: "MRR", v: "€4,180", delta: "+€318", dir: "up", note: "Six new Gold, one Platinum, no cancellations." },
      { k: "TRIAL → PAID", v: "34%", delta: "+4 pts", dir: "up", note: "24 trials started, 8 converted, 7 undecided." },
      { k: "ACTIVE THIS WEEK", v: "214", delta: "+9%", dir: "up", note: "Of 312 registered. Beta testers are half of it." },
      { k: "VIRAL COEFFICIENT", v: "0.31", delta: "+0.06", dir: "up", note: "Below 0.5 — invites still need pushing." },
      { k: "CHURNED", v: "2", delta: "−1", dir: "up", note: "Both Silver, both never set a duo." },
    ],
    actions: [
      { id: "w1", tag: "REVENUE", tagTone: "gold", when: "Mon–Wed", t: "Recover the 7 trials that ended without a decision", why: "They tapped “decide later”. Their history is warm and still intact. A three-touch sequence on day 3, 7 and 14 is already drafted.", cta: "Start the sequence", impact: "+€2,093 potential", effort: "10 min", drawer: "pricing", target: "trials" },
      { id: "w2", tag: "MARKETING", tagTone: "gold", when: "Tue", t: "Ghana is 41% of signups and 0% of revenue", why: "MoMo is live but nobody has completed a payment. Either the flow breaks or the price reads wrong in cedis. Worth one test transaction.", cta: "Run a test payment", impact: "unblocks a whole market", effort: "15 min", drawer: "flag", target: "payments" },
      { id: "w3", tag: "PRODUCT", tagTone: "copper", when: "Wed", t: "Habit users retain at half the rate of everyone else", why: "That inverts what the engine is for. Either the fields are being set and ignored, or the sample is too small to mean anything. Check before building more.", cta: "Open habit analytics", impact: "protects the Gold pitch", effort: "20 min", drawer: "flag", target: "analytics" },
      { id: "w4", tag: "COMMUNITY", tagTone: "muted", when: "Thu", t: "Seed the Silver feed — it has 1 post against Gold's 13", why: "A Silver member paying €199 opens the quietest room in the app. Three seeded posts a week is enough to make it feel inhabited.", cta: "Schedule three posts", impact: "Silver churn risk", effort: "10 min", drawer: "broadcast", target: "community" },
      { id: "w5", tag: "REVENUE", tagTone: "gold", when: "Fri", t: "Review the week and set next week's one number", why: "Trial-to-paid is the only metric that moves everything else right now. Pick the target Friday, work it Monday.", cta: "Open weekly review", impact: "sets the agenda", effort: "15 min", drawer: "pricing", target: "subscriptions" },
    ],
  },
  month: {
    headline: "Close September above €4,500 MRR",
    subhead: "You are €320 short of target with nineteen days to run. Seven trial conversions covers it.",
    pulse: [
      { k: "MRR", v: "€4,180", delta: "+24%", dir: "up", note: "September so far. August closed at €3,370." },
      { k: "NEW PAYING", v: "18", delta: "+6", dir: "up", note: "Best month since launch. Eleven came from trials." },
      { k: "TRIAL → PAID", v: "34%", delta: "+7 pts", dir: "up", note: "The day-5 recommendation screen is doing the work." },
      { k: "CHURN RATE", v: "2.9%", delta: "−0.8 pts", dir: "up", note: "Two cancellations against 68 paying." },
      { k: "CAC PAYBACK", v: "4.2 mo", delta: "−1.1 mo", dir: "up", note: "Germany only. No spend in other markets yet." },
    ],
    actions: [
      { id: "m1", tag: "REVENUE", tagTone: "gold", when: "by 30 Sep", t: "Close September above €4,500 MRR", why: "You are €320 short with 19 days left. Seven trial conversions covers it, and eight trials are already running.", cta: "Open the trial list", impact: "+€320 needed", effort: "ongoing", drawer: "pricing", target: "trials" },
      { id: "m2", tag: "MARKET", tagTone: "copper", when: "this month", t: "Decide whether Ghana stays a market", why: "128 registered, zero revenue, a month of trying. Either the payment flow gets fixed this month or you stop spending attention there.", cta: "Review Ghana", impact: "128 users at stake", effort: "1 hr", drawer: "flag", target: "payments" },
      { id: "m3", tag: "REVENUE", tagTone: "gold", when: "this month", t: "Raise Platinum above 20% of revenue", why: "Platinum is 17% with nine members. It is the only tier with a human coach, and also your least-marketed feature.", cta: "Plan a Platinum push", impact: "+€399 / yr each", effort: "2 hr", drawer: "pricing", target: "subscriptions" },
      { id: "m4", tag: "PRODUCT", tagTone: "copper", when: "from 22 Sep", t: "Run the second beta cohort", why: "The first fifteen gave you five clear themes. Fix three, then invite the next fifty with the fixes named.", cta: "Open the beta", impact: "50 testers", effort: "3 hr", drawer: "message", target: "beta" },
      { id: "m5", tag: "CONTENT", tagTone: "muted", when: "any time", t: "Publish the 23 draft workouts", why: "They have been invisible all month. The library is your main Silver justification.", cta: "Open the library", impact: "170 → 193", effort: "1 hr", drawer: "vimeo", target: "workouts" },
    ],
  },
  year: {
    headline: "Year in review · 2026",
    subhead: "Annual recurring revenue at €50,160, up 312% on last year. Germany is 78% of it.",
    pulse: [
      { k: "ARR", v: "€50,160", delta: "+312%", dir: "up", note: "Run-rate on September. Last year: €12,180." },
      { k: "PAYING MEMBERS", v: "68", delta: "+47", dir: "up", note: "Twenty-one a year ago. Gold did not exist then." },
      { k: "NET REVENUE RETENTION", v: "108%", delta: "+16 pts", dir: "up", note: "Upgrades outweigh cancellations. Above 100% is healthy." },
      { k: "LIFETIME VALUE", v: "€412", delta: "+€138", dir: "up", note: "Yearly plans and Platinum lifted it." },
      { k: "RUNWAY", v: "14 mo", delta: "+3 mo", dir: "up", note: "At current burn, no new hires." },
    ],
    actions: [
      { id: "y1", tag: "HEALTH", tagTone: "gold", when: "all year", t: "Hold net revenue retention above 100%", why: "At 108% your existing members grow revenue without a single new signup. It is the first number an investor asks about.", cta: "See the cohort view", impact: "108% · healthy", effort: "quarterly", drawer: "pricing", target: "analytics" },
      { id: "y2", tag: "MARKET", tagTone: "copper", when: "by Q1", t: "Get a second market earning properly", why: "Germany is 78% of revenue. One market failing would take three quarters of the business with it.", cta: "Compare markets", impact: "de-risks the year", effort: "ongoing", drawer: "flag", target: "payments" },
      { id: "y3", tag: "HEALTH", tagTone: "copper", when: "by Q1", t: "Bring cost per acquisition back under €31", why: "It rose 23% while revenue grew 312% — acceptable so far, but it is the one metric moving the wrong way.", cta: "Open acquisition", impact: "€38 → €31", effort: "ongoing", drawer: "pricing", target: "analytics" },
      { id: "y4", tag: "PRODUCT", tagTone: "gold", when: "before Q2", t: "Decide the Inner Circle ceiling", why: "Four members, unlimited coaching, all of it your own time. Past ten this stops scaling and you know it.", cta: "Review Inner Circle", impact: "protects your calendar", effort: "1 hr", drawer: "application", target: "applications" },
      { id: "y5", tag: "HEALTH", tagTone: "muted", when: "standing", t: "Protect the 14-month runway", why: "Three months better than last year. Every hire decision is measured against this number.", cta: "Open the ledger", impact: "14 months", effort: "standing", drawer: "settingData", target: "settings" },
    ],
  },
};

const YEAR_ROWS = [
  { k: "Revenue", now: "€50,160", then: "€12,180", delta: "+312%", deltaStyle: "text-[#5FC48E]" },
  { k: "Paying members", now: "68", then: "21", delta: "+224%", deltaStyle: "text-[#5FC48E]" },
  { k: "Registered users", now: "312", then: "96", delta: "+225%", deltaStyle: "text-[#5FC48E]" },
  { k: "Markets earning revenue", now: "3", then: "1", delta: "+2", deltaStyle: "text-[#5FC48E]" },
  { k: "Workout library", now: "170", then: "48", delta: "+254%", deltaStyle: "text-[#5FC48E]" },
  { k: "Revenue per member", now: "€61", then: "€48", delta: "+27%", deltaStyle: "text-[#5FC48E]" },
  { k: "Churn rate", now: "2.9%", then: "5.4%", delta: "−2.5 pts", deltaStyle: "text-[#5FC48E]" },
  { k: "Cost per acquisition", now: "€38", then: "€31", delta: "+23%", deltaStyle: "text-[#D98A3E]" },
];

const WEEK_ITEMS = [
  { d: "MON", date: "14 Sep", t: "Clean Eating Fortnight opens", note: "Announcement already drafted", owner: "You", active: true },
  { d: "TUE", date: "15 Sep", t: "MoMo test payment, Ghana", note: "Blocks an entire market", owner: "Dev", active: true },
  { d: "WED", date: "16 Sep", t: "Habit retention deep-dive", note: "Before building more habit features", owner: "You", active: false },
  { d: "THU", date: "17 Sep", t: "Two Inner Circle calls", note: "19:00 and 20:00 CET", owner: "You", active: false },
  { d: "FRI", date: "18 Sep", t: "Weekly review, set one number", note: "30 minutes, no more", owner: "You", active: false },
  { d: "SAT", date: "19 Sep", t: "Nothing scheduled", note: "Highest posting day — leave it to the members", owner: "—", active: false },
  { d: "SUN", date: "20 Sep", t: "Monday digest goes out 08:00", note: "Automatic, Platinum and Inner Circle", owner: "Auto", active: false },
];

const MARKETS = [
  { n: "Germany", rev: "€3,240", pct: 78, users: "142 users", conv: "41% convert", barColor: "#1A7A4A", verdict: "Your paying market. Conversion is strong and support load is low. This is where ad spend returns.", action: "Scale the German ads", drawer: "pricing" },
  { n: "Ghana", rev: "GH₵0", pct: 4, users: "128 users", conv: "0% convert", barColor: "#B5651D", verdict: "Second-biggest audience, zero revenue. MoMo has never completed a payment. Fix the flow before spending another cedi on reach.", action: "Test the MoMo flow", drawer: "flag" },
  { n: "India", rev: "₹4,480", pct: 18, users: "42 users", conv: "12% convert", barColor: "#C9943A", verdict: "Small but paying. UPI works. Price sensitivity shows — most pick monthly over yearly.", action: "Trial a monthly-first offer", drawer: "pricing" },
];

const INBOX_ITEMS = [
  { t: "Inner Circle applications", note: "Oldest waiting 4 days", c: "2", tone: "gold", route: "/applications" },
  { t: "Flagged community posts", note: "Nothing pending", c: "0", tone: "muted", route: "/community" },
  { t: "Trials ending in 48 hours", note: "4 Gold, 1 Platinum", c: "5", tone: "copper", route: "/trial-analytics" },
  { t: "Support messages", note: "Promise is a reply within a day", c: "3", tone: "gold", route: "/support-inbox" },
  { t: "Payments failed", note: "Two cards declined on renewal", c: "2", tone: "copper", route: "/subscriptions" },
];

const LEVER_ITEMS = [
  { t: "Broadcast to a tier", note: "Verified announcement into Silver, Gold, Platinum or Inner Circle feeds", drawer: "broadcast" },
  { t: "Launch a challenge", note: "35 in the library. The 3-day ones convert browsers into posters.", drawer: "challenge" },
  { t: "Offer a win-back", note: "One-time discount to the 7 undecided trials. Expires in 72 hours.", drawer: "pricing" },
  { t: "Publish a masterclass", note: "3 live. Gold members who watch one retain noticeably better.", drawer: "workout" },
];

const COHORTS = [
  { w: "11 Aug", v: 38, pct: "38%" },
  { w: "18 Aug", v: 44, pct: "44%" },
  { w: "25 Aug", v: 51, pct: "51%" },
  { w: "01 Sep", v: 47, pct: "47%" },
];

export default function DashboardPage() {
  const [scope, setScope] = useState("today");
  const [market, setMarket] = useState("All");
  const [completedActions, setCompletedActions] = useState({});
  const { openDrawer, showToast } = useAdminDrawer();
  const navigate = useNavigate();

  const currentScopeData = SCOPE_CONFIG[scope];
  const actions = currentScopeData.actions;

  const toggleDone = (id, title) => {
    setCompletedActions((prev) => {
      const next = !prev[id];
      if (next) {
        showToast(`✓ Marked done: ${title}`);
      }
      return { ...prev, [id]: next };
    });
  };

  const doneCount = actions.filter((a) => completedActions[a.id]).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Scope & Market Switcher Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap pb-2">
        <div>
          <div className="text-[10px] font-medium tracking-[0.18em] text-[#B5651D] mb-2 uppercase font-dmsans">
            VICTORY FITNESS · LIVE EXECUTIVE VIEW
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#F7F3EE] tracking-tight font-clash leading-tight mb-2">
            {currentScopeData.headline}
          </h1>
          <p className="max-w-2xl text-sm sm:text-[14.5px] text-[#F7F3EE]/60 font-inter leading-relaxed">
            {currentScopeData.subhead}
          </p>
        </div>

        {/* Scope and Market Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex border border-[#F7F3EE]/15 rounded-xl p-1 bg-[#0A0A0A]">
            {["today", "week", "month", "year"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  scope === s
                    ? "bg-[#C9943A] text-[#0D0D0D]"
                    : "text-[#F7F3EE]/60 hover:text-[#F7F3EE]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex border border-[#F7F3EE]/15 rounded-xl p-1 bg-[#0A0A0A]">
            {["All", "Germany", "Ghana", "India", "Rest of world"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMarket(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  market === m
                    ? "bg-[#F7F3EE]/20 text-[#F7F3EE]"
                    : "text-[#F7F3EE]/50 hover:text-[#F7F3EE]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pulse Metrics Row (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {currentScopeData.pulse.map((p) => {
          const isUp = p.dir === "up";
          const isDown = p.dir === "down";
          return (
            <div
              key={p.k}
              className="bg-[#0D2B45] rounded-2xl p-4 sm:p-5 border-l-3 border-[#C9943A] flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-[9.5px] font-semibold tracking-[0.14em] text-[#F7F3EE]/50 uppercase font-dmsans">
                  {p.k}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    isUp ? "text-[#5FC48E]" : isDown ? "text-[#D98A3E]" : "text-[#F7F3EE]/50"
                  }`}
                >
                  {p.delta}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F7F3EE] tracking-tight">
                {p.v}
              </div>
              <div className="mt-2 text-[11.5px] text-[#F7F3EE]/55 font-inter leading-tight">
                {p.note}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Left Stage (Action Queue + Agenda/YoY) & Right Rail */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Stage */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* Action Queue */}
          <div className="bg-[#0D2B45] rounded-2xl p-5 sm:p-6 border-l-4 border-[#B5651D]">
            <div className="flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-[#F7F3EE]/10">
              <div>
                <div className="text-[10px] font-semibold tracking-[0.17em] text-[#B5651D] uppercase mb-1">
                  QUEUE · PRIORITY ORDER
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-[#F7F3EE] font-clash">
                  Do these in order
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-[#C9943A]">
                {doneCount} of {actions.length} done
              </span>
            </div>

            <div className="space-y-4">
              {actions.map((a) => {
                const isDone = completedActions[a.id];
                return (
                  <div
                    key={a.id}
                    className={`p-4 sm:p-4.5 rounded-xl border transition-all ${
                      isDone
                        ? "bg-[#0A0A0A]/40 border-[#F7F3EE]/5 opacity-60"
                        : "bg-[#0A0A0A]/80 border-[#F7F3EE]/10 hover:border-[#C9943A]/40"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Interactive Round Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleDone(a.id, a.t)}
                        className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 transition-colors flex items-center justify-center cursor-pointer ${
                          isDone
                            ? "bg-[#5FC48E] border-[#5FC48E]"
                            : "border-[#C9943A] hover:bg-[#C9943A]/20"
                        }`}
                        aria-label="Toggle task completed"
                      >
                        {isDone && <span className="text-[#0D0D0D] font-bold text-xs">✓</span>}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              a.tagTone === "gold"
                                ? "bg-[#C9943A] text-[#0D0D0D]"
                                : a.tagTone === "copper"
                                ? "bg-[#B5651D] text-[#F7F3EE]"
                                : "bg-[#F7F3EE]/15 text-[#F7F3EE]/70"
                            }`}
                          >
                            {a.tag}
                          </span>
                          <span className="text-[11px] font-mono text-[#F7F3EE]/45">
                            {a.when}
                          </span>
                        </div>

                        <div
                          className={`text-sm sm:text-[15px] font-semibold font-dmsans text-[#F7F3EE] leading-snug ${
                            isDone ? "line-through text-[#F7F3EE]/50" : ""
                          }`}
                        >
                          {a.t}
                        </div>

                        <p className="mt-1 text-xs sm:text-[13.5px] text-[#F7F3EE]/65 font-inter leading-relaxed">
                          {a.why}
                        </p>

                        <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openDrawer(a.drawer)}
                            className="h-8 px-3 rounded-lg bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>{a.cta}</span>
                            <span>→</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleDone(a.id, a.t)}
                            className="h-8 px-3 rounded-lg border border-[#F7F3EE]/20 hover:border-[#F7F3EE]/40 text-[#F7F3EE]/70 hover:text-[#F7F3EE] text-xs font-semibold cursor-pointer"
                          >
                            {isDone ? "Undo" : "Done"}
                          </button>
                          <span className="text-xs font-mono font-bold text-[#5FC48E]">
                            {a.impact}
                          </span>
                          <span className="text-xs text-[#F7F3EE]/40 font-inter">
                            {a.effort}
                          </span>
                          <span className="text-[11px] font-mono text-[#F7F3EE]/35 ml-auto">
                            opens {a.target}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditional: The Week Ahead (Scope: Today or Week) */}
          {(scope === "today" || scope === "week") && (
            <div className="bg-[#0D2B45] rounded-2xl p-5 sm:p-6 border-l-4 border-[#B5651D]">
              <div className="flex items-baseline justify-between gap-3 mb-4 pb-2 border-b border-[#F7F3EE]/10">
                <div>
                  <div className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase mb-1">
                    THE WEEK AHEAD
                  </div>
                  <h3 className="text-xl font-semibold text-[#F7F3EE] font-clash">
                    Seven days, planned
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#F7F3EE]/50">
                  auto-scheduled from active data
                </span>
              </div>

              <div className="space-y-2">
                {WEEK_ITEMS.map((w) => (
                  <div
                    key={w.d + w.date}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0A0A0A]/40 transition-colors"
                  >
                    <div className="w-16 shrink-0">
                      <div className="text-xs font-bold text-[#F7F3EE]">{w.d}</div>
                      <div className="text-[10px] font-mono text-[#F7F3EE]/40">{w.date}</div>
                    </div>
                    <div
                      className={`w-1.5 h-7 rounded-full shrink-0 ${
                        w.active ? "bg-[#C9943A]" : "bg-[#F7F3EE]/20"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#F7F3EE] truncate">
                        {w.t}
                      </div>
                      <div className="text-[11px] text-[#F7F3EE]/50 truncate">{w.note}</div>
                    </div>
                    <span className="text-xs font-mono text-[#F7F3EE]/45 shrink-0">{w.owner}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional: YoY Table (Scope: Month or Year) */}
          {(scope === "month" || scope === "year") && (
            <div className="bg-[#0D2B45] rounded-2xl p-5 sm:p-6 border-l-4 border-[#B5651D]">
              <div className="flex items-baseline justify-between gap-3 mb-4 pb-2 border-b border-[#F7F3EE]/10">
                <div>
                  <div className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase mb-1">
                    COMPANY HEALTH · AGAINST LAST YEAR
                  </div>
                  <h3 className="text-xl font-semibold text-[#F7F3EE] font-clash">
                    Where you were, where you are
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#F7F3EE]/50">Sep 2025 → Sep 2026</span>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[480px]">
                  <div className="flex text-[10px] font-semibold tracking-wider text-[#F7F3EE]/50 pb-2 border-b border-[#F7F3EE]/10 uppercase">
                    <span className="flex-2">Measure</span>
                    <span className="flex-1 text-right">Now</span>
                    <span className="flex-1 text-right">Last Year</span>
                    <span className="flex-1 text-right text-[#C9943A]">Change</span>
                  </div>
                  {YEAR_ROWS.map((y) => (
                    <div
                      key={y.k}
                      className="flex items-center text-xs sm:text-sm py-2.5 border-b border-[#F7F3EE]/5"
                    >
                      <span className="flex-2 font-semibold text-[#F7F3EE]">{y.k}</span>
                      <span className="flex-1 text-right font-mono font-bold text-[#F7F3EE]">
                        {y.now}
                      </span>
                      <span className="flex-1 text-right font-mono text-[#F7F3EE]/50">
                        {y.then}
                      </span>
                      <span className={`flex-1 text-right font-mono font-bold ${y.deltaStyle}`}>
                        {y.delta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-[#B5651D]/15 border-l-3 border-[#B5651D] text-xs text-[#F7F3EE]/85 leading-relaxed font-inter">
                Every measure improved except cost per acquisition, which rose 23% while revenue grew 312% — you bought growth, and it was worth it. Watch it if the gap narrows.
              </div>
            </div>
          )}
        </div>

        {/* Right Rail */}
        <div className="w-full xl:w-[360px] shrink-0 space-y-5">
          {/* Where The Money Is */}
          <div className="bg-[#0D2B45] rounded-2xl p-5 border-l-4 border-[#B5651D]">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase mb-3">
              WHERE THE MONEY IS
            </div>
            <div className="space-y-4">
              {MARKETS.map((m) => (
                <div key={m.n} className="pt-2 first:pt-0 border-t border-[#F7F3EE]/10 first:border-0">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="font-semibold text-sm text-[#F7F3EE]">{m.n}</span>
                    <span className="font-mono font-bold text-sm text-[#C9943A]">{m.rev}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F7F3EE]/10 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.pct}%`, backgroundColor: m.barColor }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[#F7F3EE]/60 mb-1.5">
                    <span>{m.users}</span>
                    <span>·</span>
                    <span>{m.conv}</span>
                  </div>
                  <p className="text-xs text-[#F7F3EE]/70 font-inter leading-relaxed mb-2.5">
                    {m.verdict}
                  </p>
                  <button
                    type="button"
                    onClick={() => openDrawer(m.drawer)}
                    className="text-xs font-bold text-[#C9943A] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{m.action}</span>
                    <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Needs You / Inbox */}
          <div className="bg-[#0D2B45] rounded-2xl p-5">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase">
                NEEDS YOU
              </span>
              <span className="text-xs font-mono text-[#F7F3EE]/45">5 open</span>
            </div>
            <div className="space-y-1.5">
              {INBOX_ITEMS.map((item) => (
                <div
                  key={item.t}
                  onClick={() => navigate(item.route)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0A0A0A]/40 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.tone === "gold"
                        ? "bg-[#C9943A]"
                        : item.tone === "copper"
                        ? "bg-[#B5651D]"
                        : "bg-[#F7F3EE]/30"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-[#F7F3EE] truncate">
                      {item.t}
                    </div>
                    <div className="text-[11px] text-[#F7F3EE]/50 truncate">{item.note}</div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      item.tone === "gold"
                        ? "bg-[#C9943A]/20 text-[#C9943A]"
                        : item.tone === "copper"
                        ? "bg-[#B5651D]/20 text-[#D98A3E]"
                        : "bg-[#F7F3EE]/10 text-[#F7F3EE]/40"
                    }`}
                  >
                    {item.c}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Push Something, Now / Levers */}
          <div className="bg-[#0D2B45] rounded-2xl p-5">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase mb-3">
              PUSH SOMETHING, NOW
            </div>
            <div className="space-y-2">
              {LEVER_ITEMS.map((lever) => (
                <div
                  key={lever.t}
                  onClick={() => openDrawer(lever.drawer)}
                  className="p-3 rounded-xl bg-[#0A0A0A]/60 border border-[#F7F3EE]/5 hover:border-[#C9943A]/40 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-semibold text-[#F7F3EE]">
                      {lever.t}
                    </div>
                    <div className="text-[11px] text-[#F7F3EE]/50 mt-0.5 leading-snug">
                      {lever.note}
                    </div>
                  </div>
                  <span className="text-base font-bold text-[#C9943A] shrink-0">›</span>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Gate */}
          <div className="bg-[#0D2B45] rounded-2xl p-5">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase mb-1">
              RETENTION GATE
            </div>
            <div className="text-xs text-[#F7F3EE]/60 font-inter mb-3 leading-snug">
              Day-7 above 45% for four straight weeks is the signal to spend on ads. Not before.
            </div>
            <div className="space-y-2 mb-3">
              {COHORTS.map((c) => (
                <div key={c.w} className="flex items-center gap-2 text-xs">
                  <span className="w-14 shrink-0 font-mono text-[#F7F3EE]/50">{c.w}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#F7F3EE]/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.v >= 45 ? "bg-[#5FC48E]" : "bg-[#D98A3E]"
                      }`}
                      style={{ width: `${c.v}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono font-bold text-[#F7F3EE]">
                    {c.pct}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-2.5 rounded-xl bg-[#1A7A4A]/20 border-l-2 border-[#1A7A4A] text-xs font-mono text-[#5FC48E]">
              GATE PASS · 3 OF 4 WEEKS OVER 45%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
