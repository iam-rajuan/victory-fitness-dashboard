import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";
import RequirementAuditBoundary from "../../components/audit/RequirementAuditBoundary";

function renderWithBetaAudit(text) {
  if (!text || typeof text !== "string") return text;
  const regex = /(21-Day Gold Beta|beta testers|Beta testers|21-Day Beta)/;
  const match = text.match(regex);
  if (!match) return text;
  const index = match.index;
  const matchedText = match[0];
  const before = text.substring(0, index);
  const after = text.substring(index + matchedText.length);
  return (
    <>
      {before}
      <RequirementAuditBoundary
        auditId="ADMIN-MISMATCH-006"
        status="mismatch"
        className="inline-block"
      >
        <span>{matchedText}</span>
      </RequirementAuditBoundary>
      {after}
    </>
  );
}

const SCOPE_CONFIG = {
  today: {
    headline: "Three things before lunch",
    subhead: "Ordered by money at stake, not by when it arrived. Tick one and the next moves up. Everything below the fold is context, not work.",
    queueKicker: "TODAY · IN ORDER OF VALUE",
    queueTitle: "Your action queue",
    pulse: [
      { k: "MRR", v: "€4,180", delta: "+8.2%", dir: "up", note: "Gold is 62% of it. Platinum is the gap." },
      { k: "TRIAL → PAID", v: "34%", delta: "+4 pts", dir: "up", note: "Above the 30% floor. Gold trials convert best." },
      { k: "ACTIVE TODAY", v: "38", delta: "−12%", dir: "down", note: "Friday dip. Normal, but watch Monday." },
      { k: "NEW SIGNUPS", v: "11", delta: "+3", dir: "up", note: "7 from challenge invites — organic is working." },
      { k: "AT RISK", v: "9", delta: "—", dir: "flat", note: "No feature activity in 7 days." },
    ],
    actions: [
      {
        id: "t1",
        tag: "REVENUE",
        tagTone: "gold",
        when: "before 12:00",
        t: "4 Gold trials end today — send the day-5 message",
        why: "All four used the AI coach more than 20 times. That is the group that converts. The message is written; it needs your name on it.",
        cta: "Review and send",
        impact: "+€1,196 if all convert",
        effort: "3 min",
        target: "5-Day Gold Trial",
        drawer: "message",
        route: "/trial-analytics",
      },
      {
        id: "t2",
        tag: "CHURN",
        tagTone: "copper",
        when: "today",
        t: "9 beta testers have never opened a feature",
        why: "Enrolled, never activated. Day 21 comes either way. One WhatsApp with a single 15-minute workout link recovers most of them.",
        cta: "Send activation nudge",
        impact: "9 testers at risk",
        effort: "2 min",
        target: "All Users",
        drawer: "message",
        route: "/beta-analytics",
      },
      {
        id: "t3",
        tag: "MARKETING",
        tagTone: "gold",
        when: "today",
        t: "Post the Clean Eating Fortnight announcement",
        why: "Your last challenge announcement drove 62 cheers and 18 replies — the best organic day this month. Monday's start needs today's post.",
        cta: "Open broadcast composer",
        impact: "~180 joins expected",
        effort: "5 min",
        target: "Community",
        drawer: "broadcast",
        route: "/community",
      },
      {
        id: "t4",
        tag: "INNER CIRCLE",
        tagTone: "copper",
        when: "this afternoon",
        t: "2 applications waiting on your call",
        why: "Both answered all five questions in full. Average time to reply right now is four days; the promise on the screen says three.",
        cta: "Read and book calls",
        impact: "€798 / year each",
        effort: "12 min",
        target: "Applications",
        drawer: "application",
        route: "/applications",
      },
      {
        id: "t5",
        tag: "CONTENT",
        tagTone: "muted",
        when: "if time",
        t: "23 Vimeo workouts still sitting in draft",
        why: "Imported but never published, so nobody can see them. Publishing the six shortest ones widens the 15-minute filter, which is the most-used one.",
        cta: "Open workout library",
        impact: "library 170 → 193",
        effort: "8 min",
        target: "Workouts",
        drawer: "workout",
        route: "/workouts",
      },
    ],
  },
  week: {
    headline: "Five moves this week",
    subhead: "The week's work, ordered by what it is worth. Two of these unblock revenue that is already sitting there.",
    queueKicker: "THIS WEEK · IN ORDER OF VALUE",
    queueTitle: "What moves the number",
    pulse: [
      { k: "MRR", v: "€4,180", delta: "+€318", dir: "up", note: "Six new Gold, one Platinum, no cancellations." },
      { k: "TRIAL → PAID", v: "34%", delta: "+4 pts", dir: "up", note: "24 trials started, 8 converted, 7 undecided." },
      { k: "ACTIVE THIS WEEK", v: "214", delta: "+9%", dir: "up", note: "Of 312 registered. Beta testers are half of it." },
      { k: "VIRAL COEFFICIENT", v: "0.31", delta: "+0.06", dir: "up", note: "Below 0.5 — invites still need pushing." },
      { k: "CHURNED", v: "2", delta: "−1", dir: "up", note: "Both Silver, both never set a duo." },
    ],
    actions: [
      {
        id: "w1",
        tag: "REVENUE",
        tagTone: "gold",
        when: "Mon–Wed",
        t: "Recover the 7 trials that ended without a decision",
        why: "They tapped “decide later”. Their history is warm and still intact. A three-touch sequence on day 3, 7 and 14 is already drafted.",
        cta: "Start the sequence",
        impact: "+€2,093 potential",
        effort: "10 min",
        target: "5-Day Gold Trial",
        drawer: "pricing",
        route: "/trial-analytics",
      },
      {
        id: "w2",
        tag: "MARKETING",
        tagTone: "gold",
        when: "Tue",
        t: "Ghana is 41% of signups and 0% of revenue",
        why: "MoMo is live but nobody has completed a payment. Either the flow breaks or the price reads wrong in cedis. Worth one test transaction.",
        cta: "Run a test payment",
        impact: "unblocks a whole market",
        effort: "15 min",
        target: "Payments",
        drawer: "flag",
        route: "/payments",
      },
      {
        id: "w3",
        tag: "PRODUCT",
        tagTone: "copper",
        when: "Wed",
        t: "Habit users retain at half the rate of everyone else",
        why: "That inverts what the engine is for. Either the fields are being set and ignored, or the sample is too small to mean anything. Check before building more.",
        cta: "Open habit analytics",
        impact: "protects the Gold pitch",
        effort: "20 min",
        target: "All Users",
        drawer: "flag",
        route: "/user-details",
      },
      {
        id: "w4",
        tag: "COMMUNITY",
        tagTone: "muted",
        when: "Thu",
        t: "Seed the Silver feed — it has 1 post against Gold's 13",
        why: "A Silver member paying €199 opens the quietest room in the app. Three seeded posts a week is enough to make it feel inhabited.",
        cta: "Schedule three posts",
        impact: "Silver churn risk",
        effort: "10 min",
        target: "Community",
        drawer: "broadcast",
        route: "/community",
      },
      {
        id: "w5",
        tag: "REVENUE",
        tagTone: "gold",
        when: "Fri",
        t: "Review the week and set next week's one number",
        why: "Trial-to-paid is the only metric that moves everything else right now. Pick the target Friday, work it Monday.",
        cta: "Open weekly review",
        impact: "sets the agenda",
        effort: "15 min",
        target: "Subscriptions",
        drawer: "pricing",
        route: "/subscriptions",
      },
    ],
  },
  month: {
    headline: "September, and what closes it",
    subhead: "Nineteen days left. These five decide whether September closes above target — the first one is €320 away.",
    queueKicker: "THIS MONTH · IN ORDER OF VALUE",
    queueTitle: "What closes the month",
    pulse: [
      { k: "MRR", v: "€4,180", delta: "+24%", dir: "up", note: "September so far. August closed at €3,370." },
      { k: "NEW PAYING", v: "18", delta: "+6", dir: "up", note: "Best month since launch. Eleven came from trials." },
      { k: "TRIAL → PAID", v: "34%", delta: "+7 pts", dir: "up", note: "The day-5 recommendation screen is doing the work." },
      { k: "CHURN RATE", v: "2.9%", delta: "−0.8 pts", dir: "up", note: "Two cancellations against 68 paying." },
      { k: "CAC PAYBACK", v: "4.2 mo", delta: "−1.1 mo", dir: "up", note: "Germany only. No spend in other markets yet." },
    ],
    actions: [
      {
        id: "m1",
        tag: "REVENUE",
        tagTone: "gold",
        when: "by 30 Sep",
        t: "Close September above €4,500 MRR",
        why: "You are €320 short with 19 days left. Seven trial conversions covers it, and eight trials are already running.",
        cta: "Open the trial list",
        impact: "+€320 needed",
        effort: "ongoing",
        target: "5-Day Gold Trial",
        drawer: "pricing",
        route: "/trial-analytics",
      },
      {
        id: "m2",
        tag: "MARKET",
        tagTone: "copper",
        when: "this month",
        t: "Decide whether Ghana stays a market",
        why: "128 registered, zero revenue, a month of trying. Either the payment flow gets fixed this month or you stop spending attention there.",
        cta: "Review Ghana",
        impact: "128 users at stake",
        effort: "1 hr",
        target: "Payments",
        drawer: "flag",
        route: "/payments",
      },
      {
        id: "m3",
        tag: "REVENUE",
        tagTone: "gold",
        when: "this month",
        t: "Raise Platinum above 20% of revenue",
        why: "Platinum is 17% with nine members. It is the only tier with a human coach, and also your least-marketed feature.",
        cta: "Plan a Platinum push",
        impact: "+€399 / yr each",
        effort: "2 hr",
        target: "Subscriptions",
        drawer: "pricing",
        route: "/subscriptions",
      },
      {
        id: "m4",
        tag: "PRODUCT",
        tagTone: "copper",
        when: "from 22 Sep",
        t: "Run the second beta cohort",
        why: "The first fifteen gave you five clear themes. Fix three, then invite the next fifty with the fixes named.",
        cta: "Open the beta",
        impact: "50 testers",
        effort: "3 hr",
        target: "21-Day Gold Beta",
        drawer: "message",
        route: "/beta-analytics",
      },
      {
        id: "m5",
        tag: "CONTENT",
        tagTone: "muted",
        when: "any time",
        t: "Publish the 23 draft workouts",
        why: "They have been invisible all month. The library is your main Silver justification.",
        cta: "Open the library",
        impact: "170 → 193",
        effort: "1 hr",
        target: "Workouts",
        drawer: "vimeo",
        route: "/workouts",
      },
    ],
  },
  year: {
    headline: "The year, in five decisions",
    subhead: "Growth against last year, and the handful of calls that decide whether this one repeats. Health measures sit below, next to the numbers they explain.",
    queueKicker: "THIS YEAR · IN ORDER OF VALUE",
    queueTitle: "The calls that matter",
    pulse: [
      { k: "ARR", v: "€50,160", delta: "+312%", dir: "up", note: "Run-rate on September. Last year: €12,180." },
      { k: "PAYING MEMBERS", v: "68", delta: "+47", dir: "up", note: "Twenty-one a year ago. Gold did not exist then." },
      { k: "NET REVENUE RETENTION", v: "108%", delta: "+16 pts", dir: "up", note: "Upgrades outweigh cancellations. Above 100% is healthy." },
      { k: "LIFETIME VALUE", v: "€412", delta: "+€138", dir: "up", note: "Yearly plans and Platinum lifted it." },
      { k: "RUNWAY", v: "14 mo", delta: "+3 mo", dir: "up", note: "At current burn, no new hires." },
    ],
    actions: [
      {
        id: "y1",
        tag: "HEALTH",
        tagTone: "gold",
        when: "all year",
        t: "Hold net revenue retention above 100%",
        why: "At 108% your existing members grow revenue without a single new signup. It is the first number an investor asks about.",
        cta: "See the cohort view",
        impact: "108% · healthy",
        effort: "quarterly",
        target: "All Users",
        drawer: "pricing",
        route: "/user-details",
      },
      {
        id: "y2",
        tag: "MARKET",
        tagTone: "copper",
        when: "by Q1",
        t: "Get a second market earning properly",
        why: "Germany is 78% of revenue. One market failing would take three quarters of the business with it.",
        cta: "Compare markets",
        impact: "de-risks the year",
        effort: "ongoing",
        target: "Payments",
        drawer: "flag",
        route: "/payments",
      },
      {
        id: "y3",
        tag: "HEALTH",
        tagTone: "copper",
        when: "by Q1",
        t: "Bring cost per acquisition back under €31",
        why: "It rose 23% while revenue grew 312% — acceptable so far, but it is the one metric moving the wrong way.",
        cta: "Open acquisition",
        impact: "€38 → €31",
        effort: "ongoing",
        target: "All Users",
        drawer: "pricing",
        route: "/user-details",
      },
      {
        id: "y4",
        tag: "PRODUCT",
        tagTone: "gold",
        when: "before Q2",
        t: "Decide the Inner Circle ceiling",
        why: "Four members, unlimited coaching, all of it your own time. Past ten this stops scaling and you know it.",
        cta: "Review Inner Circle",
        impact: "protects your calendar",
        effort: "1 hr",
        target: "Applications",
        drawer: "application",
        route: "/applications",
      },
      {
        id: "y5",
        tag: "HEALTH",
        tagTone: "muted",
        when: "standing",
        t: "Protect the 14-month runway",
        why: "Three months better than last year. Every hire decision is measured against this number.",
        cta: "Open the ledger",
        impact: "14 months",
        effort: "standing",
        target: "Settings",
        drawer: "settingData",
        route: "/settings",
      },
    ],
  },
};

const YEAR_ROWS = [
  { k: "Revenue", now: "€50,160", then: "€12,180", delta: "+312%", tone: "good" },
  { k: "Paying members", now: "68", then: "21", delta: "+224%", tone: "good" },
  { k: "Registered users", now: "312", then: "96", delta: "+225%", tone: "good" },
  { k: "Markets earning revenue", now: "3", then: "1", delta: "+2", tone: "good" },
  { k: "Workout library", now: "170", then: "48", delta: "+254%", tone: "good" },
  { k: "Revenue per member", now: "€61", then: "€48", delta: "+27%", tone: "good" },
  { k: "Churn rate", now: "2.9%", then: "5.4%", delta: "−2.5 pts", tone: "good" },
  { k: "Cost per acquisition", now: "€38", then: "€31", delta: "+23%", tone: "warn" },
];

const WEEK_ITEMS = [
  { d: "MON", date: "14 Sep", t: "Clean Eating Fortnight opens", note: "Announcement already drafted", owner: "You", hot: true },
  { d: "TUE", date: "15 Sep", t: "MoMo test payment, Ghana", note: "Blocks an entire market", owner: "Dev", hot: true },
  { d: "WED", date: "16 Sep", t: "Habit retention deep-dive", note: "Before building more habit features", owner: "You", hot: false },
  { d: "THU", date: "17 Sep", t: "Two Inner Circle calls", note: "19:00 and 20:00 CET", owner: "You", hot: false },
  { d: "FRI", date: "18 Sep", t: "Weekly review, set one number", note: "30 minutes, no more", owner: "You", hot: false },
  { d: "SAT", date: "19 Sep", t: "Nothing scheduled", note: "Highest posting day — leave it to the members", owner: "—", hot: false },
  { d: "SUN", date: "20 Sep", t: "Monday digest goes out 08:00", note: "Automatic, Platinum and Inner Circle", owner: "Auto", hot: false },
];

const MARKETS = [
  {
    n: "Germany",
    rev: "€3,240",
    pct: 78,
    users: "142 users",
    conv: "41% convert",
    tone: "#1A7A4A",
    ink: "#5FC48E",
    verdict: "Your paying market. Conversion is strong and support load is low. This is where ad spend returns.",
    action: "Scale the German ads",
    drawer: "pricing",
  },
  {
    n: "Ghana",
    rev: "GH₵0",
    pct: 4,
    users: "128 users",
    conv: "0% convert",
    tone: "#B5651D",
    ink: "#D98A3E",
    verdict: "Second-biggest audience, zero revenue. MoMo has never completed a payment. Fix the flow before spending another cedi on reach.",
    action: "Test the MoMo flow",
    drawer: "flag",
  },
  {
    n: "India",
    rev: "₹4,480",
    pct: 18,
    users: "42 users",
    conv: "12% convert",
    tone: "#C9943A",
    ink: "#C9943A",
    verdict: "Small but paying. UPI works. Price sensitivity shows — most pick monthly over yearly.",
    action: "Trial a monthly-first offer",
    drawer: "pricing",
  },
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

const MARKET_RULES = [
  { k: "Detected, then confirmed", v: "IP and phone locale set it at register, shown as a chip the user can correct. Never a silent guess.", tone: "good" },
  { k: "It sets three things", v: "Display currency, the payment methods offered, and the clock reminders run on.", tone: "good" },
  { k: "Named markets", v: "Germany €, Ghana GH₵, India ₹, UK £, US $ — each with local rails: SEPA, MoMo, UPI, Bacs, cards.", tone: "good" },
  { k: "Everywhere else", v: "Euro pricing on card or PayPal. Nothing is blocked — someone in Kenya or Brazil can pay, just not yet in their own currency.", tone: "warn" },
  { k: "Promotion rule", v: "A fallback country earns its own currency and local rails once it passes 50 paying members. Nigeria is closest, at 31.", tone: "warn" },
];

const getTarget = (t, cta) => {
  const c = `${t} ${cta}`.toLowerCase();
  if (/trial/.test(c)) return "5-Day Gold Trial";
  if (/beta/.test(c)) return "21-Day Gold Beta";
  if (/broadcast|community|seed|post/.test(c)) return "Community";
  if (/application|inner circle|call/.test(c)) return "Applications";
  if (/librar|workout/.test(c)) return "Workouts";
  if (/challenge/.test(c)) return "Challenges";
  if (/ghana|market|payment|momo|acquisition/.test(c)) return "Payments";
  if (/platinum|pricing|price|subscriptions|ledger/.test(c)) return "Subscriptions";
  if (/habit|analytics|cohort|weekly review|agenda/.test(c)) return "All Users";
  if (/nudge|message/.test(c)) return "All Users";
  return "All Users";
};

const TARGET_ROUTES = {
  "5-Day Gold Trial": "/trial-analytics",
  "21-Day Gold Beta": "/beta-analytics",
  "Community": "/community",
  "Applications": "/applications",
  "Workouts": "/workouts",
  "Challenges": "/challenges",
  "Payments": "/payments",
  "Subscriptions": "/subscriptions",
  "All Users": "/user-details",
};

export default function DashboardPage() {
  const [scope, setScope] = useState("today");
  const [market, setMarket] = useState("All");
  const [doneList, setDoneList] = useState([]);
  const { openDrawer, showToast } = useAdminDrawer();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const t = {
    text: isDark ? "#F7F3EE" : "#0D2B45",
    subtext: isDark ? "rgba(247, 243, 238, 0.65)" : "rgba(13, 43, 69, 0.72)",
    muted: isDark ? "rgba(247, 243, 238, 0.45)" : "rgba(13, 43, 69, 0.52)",
    cardBg: isDark ? "#0D2B45" : "#FFFFFF",
    cardBorder: isDark ? "rgba(247, 243, 238, 0.1)" : "rgba(13, 43, 69, 0.08)",
    cardShadow: isDark ? "none" : "0 4px 20px rgba(13, 43, 69, 0.04)",
    subtleBg: isDark ? "rgba(247, 243, 238, 0.05)" : "#FAF7F2",
    pillBorder: isDark ? "rgba(247, 243, 238, 0.16)" : "rgba(13, 43, 69, 0.14)",
    tabInactiveText: isDark ? "rgba(247, 243, 238, 0.6)" : "rgba(13, 43, 69, 0.65)",
    rowBorder: isDark ? "rgba(247, 243, 238, 0.09)" : "rgba(13, 43, 69, 0.08)",
  };

  const currentScopeData = SCOPE_CONFIG[scope] || SCOPE_CONFIG.today;
  const actions = currentScopeData.actions || [];

  const isWeek = scope === "week";
  const queueKicker =
    (scope === "year" ? "THIS YEAR" : scope === "month" ? "THIS MONTH" : isWeek ? "THIS WEEK" : "TODAY") +
    " · IN ORDER OF VALUE";
  const queueTitle =
    scope === "year"
      ? "The calls that matter"
      : scope === "month"
      ? "What closes the month"
      : isWeek
      ? "What moves the number"
      : "Your action queue";

  const doneCount = actions.filter((_, i) => doneList.includes(`${scope}${i}`)).length;
  const inboxCount = INBOX_ITEMS.reduce((a, r) => a + Number(r.c || 0), 0) + " open";

  const toggleDone = (scopeKey, index, title) => {
    const key = `${scopeKey}${index}`;
    setDoneList((prev) => {
      const isNowDone = !prev.includes(key);
      if (isNowDone) {
        showToast(`✓ Marked done: ${title}`);
        return [...prev, key];
      }
      return prev.filter((x) => x !== key);
    });
  };

  const getToneColor = (tone) => {
    if (tone === "gold") return "#C9943A";
    if (tone === "copper") return isDark ? "#D98A3E" : "#B5651D";
    return isDark ? "rgba(247, 243, 238, 0.55)" : "rgba(13, 43, 69, 0.55)";
  };

  const handleActionOpen = (a) => {
    const target = getTarget(a.t, a.cta);
    const targetRoute = TARGET_ROUTES[target] || a.route;
    if (targetRoute) {
      navigate(targetRoute);
    } else if (a.drawer) {
      openDrawer(a.drawer);
    }
  };

  return (
    <div className={`animate-in fade-in duration-200 font-dmsans ${isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"}`}>
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-6 flex-wrap mb-2">
        <RequirementAuditBoundary auditId="ADMIN-EXTRA-009" status="extra">
          <div>
            <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: "0.18em", color: "#B5651D", marginBottom: "8px" }}>
              FRIDAY, 11 SEPTEMBER · 09:17
            </div>
            <h1 style={{ margin: "0 0 8px", font: "600 36px/1.06 'Clash Display', 'DM Sans', sans-serif", color: t.text, letterSpacing: "-0.015em" }}>
              {currentScopeData.headline}
            </h1>
            <p style={{ margin: 0, maxWidth: "620px", font: "400 14.5px/1.6 'Inter', sans-serif", color: t.subtext, textWrap: "pretty" }}>
              {currentScopeData.subhead}
            </p>
          </div>
        </RequirementAuditBoundary>

        {/* Filter Segment Pills */}
        <div className="flex gap-2.5 items-center flex-wrap">
          {/* Scope Tabs */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", border: `1px solid ${t.pillBorder}`, backgroundColor: isDark ? "transparent" : "#FAF7F2", borderRadius: "12px", padding: "4px" }}>
            {[
              ["today", "Today"],
              ["week", "This week"],
              ["month", "Month"],
              ["year", "Year"],
            ].map(([k, n]) => {
              const on = scope === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setScope(k)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "9px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    font: `${on ? "700" : "500"} 12.5px 'DM Sans', sans-serif`,
                    backgroundColor: on ? "#C9943A" : "transparent",
                    color: on ? "#0D0D0D" : t.tabInactiveText,
                    border: "none",
                    outline: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>

          {/* Market Tabs */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", border: `1px solid ${t.pillBorder}`, backgroundColor: isDark ? "transparent" : "#FAF7F2", borderRadius: "12px", padding: "4px" }}>
            {["All", "Germany", "Ghana", "India", "Rest of world"].map((m) => {
              const on = market === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMarket(m)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "9px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    font: `${on ? "700" : "500"} 12.5px 'DM Sans', sans-serif`,
                    backgroundColor: on ? "#C9943A" : "transparent",
                    color: on ? "#0D0D0D" : t.tabInactiveText,
                    border: "none",
                    outline: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pulse Metrics Row (5 Cards) */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "26px" }}>
        {currentScopeData.pulse.map((p) => {
          const dirBorder =
            p.dir === "down" ? "#B5651D" : p.dir === "flat" ? (isDark ? "rgba(247, 243, 238, 0.25)" : "rgba(13, 43, 69, 0.2)") : "#1A7A4A";
          const deltaColor =
            p.dir === "down" ? "#D98A3E" : p.dir === "flat" ? t.muted : (isDark ? "#5FC48E" : "#1A7A4A");

          return (
            <div
              key={p.k}
              style={{
                flex: "1 1 180px",
                minWidth: "170px",
                backgroundColor: t.cardBg,
                borderRadius: "18px",
                borderLeft: `4px solid ${dirBorder}`,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.cardShadow,
                padding: "17px 18px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px", marginBottom: "9px" }}>
                <span style={{ font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: "0.14em", color: t.muted, textTransform: "uppercase" }}>
                  {p.k}
                </span>
                <span style={{ font: "700 11.5px 'JetBrains Mono', monospace", color: deltaColor }}>
                  {p.delta}
                </span>
              </div>
              <div style={{ font: "700 30px/1 'JetBrains Mono', monospace", color: t.text, letterSpacing: "-0.02em" }}>
                {p.v}
              </div>
              <div style={{ font: "400 12px/1.45 'Inter', sans-serif", color: t.subtext, marginTop: "7px" }}>
                {renderWithBetaAudit(p.note)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Action Queue on Left (620px), Context Rail on Right (340px) */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Left Column: Exactly Matching Claude Reference (flex: 1 1 620px; min-width: 0) */}
        <div style={{ flex: "1 1 620px", minWidth: 0 }}>
          <RequirementAuditBoundary auditId="ADMIN-EXTRA-010" status="extra" className="mb-4">
            {/* Action Queue Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
              <div>
                <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".17em", color: "#B5651D", marginBottom: "5px" }}>
                  {queueKicker}
                </div>
                <h2 style={{ margin: 0, font: "600 24px 'Clash Display', 'DM Sans', sans-serif", color: t.text }}>
                  {queueTitle}
                </h2>
              </div>
              <RequirementAuditBoundary auditId="ADMIN-EXTRA-011" status="extra" className="inline-flex flex-col items-end">
                <span style={{ font: "700 12.5px 'JetBrains Mono', monospace", color: "#C9943A" }}>
                  {doneCount} of {actions.length} done
                </span>
              </RequirementAuditBoundary>
            </div>

            {/* Action Cards List - Direct unnested items */}
            {actions.map((a, index) => {
              const key = `${scope}${index}`;
              const isDone = doneList.includes(key);
              const target = getTarget(a.t, a.cta);
              const toneColor = getToneColor(a.tagTone);

              return (
                <div
                  key={key}
                  style={{
                    background: t.cardBg,
                    borderRadius: "18px",
                    padding: "18px 20px",
                    marginBottom: "10px",
                    opacity: isDone ? 0.6 : 1,
                    boxShadow: t.cardShadow,
                    border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                    borderLeft: isDone ? "4px solid #1A7A4A" : `4px solid ${toneColor}`,
                    boxSizing: "border-box",
                    transition: "opacity 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    {/* Exact 22x22 Checkbox with 7px Radius */}
                    <div
                      onClick={() => toggleDone(scope, index, a.t)}
                      style={
                        isDone
                          ? {
                              width: "22px",
                              height: "22px",
                              borderRadius: "7px",
                              background: "#1A7A4A",
                              flex: "none",
                              marginTop: "3px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }
                          : {
                              width: "22px",
                              height: "22px",
                              borderRadius: "7px",
                              boxSizing: "border-box",
                              border: isDark ? "1.5px solid rgba(201,148,58,.6)" : "1.5px solid rgba(201,148,58,.8)",
                              background: isDark ? "transparent" : "#FFF9F0",
                              flex: "none",
                              marginTop: "3px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }
                      }
                      title={isDone ? "Undo" : "Mark done"}
                    >
                      {isDone && (
                        <span style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: "11.5px", lineHeight: "1" }}>
                          ✓
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Tag & When Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap", marginBottom: "6px" }}>
                        <span style={{ font: "700 9.5px 'DM Sans', sans-serif", letterSpacing: ".12em", color: toneColor }}>
                          {a.tag}
                        </span>
                        <span style={{ font: "500 11px 'JetBrains Mono', monospace", color: t.muted }}>
                          {a.when}
                        </span>
                      </div>

                      {/* Action Title */}
                      <div
                        style={{
                          font: `600 ${isDone ? "17" : "19"}px/1.25 'Clash Display', 'DM Sans', sans-serif`,
                          color: t.text,
                          textDecoration: isDone ? "line-through" : "none",
                        }}
                      >
                        {renderWithBetaAudit(a.t)}
                      </div>

                      {/* Why Copy */}
                      <p
                        style={{
                          margin: "7px 0 0",
                          font: "400 13.5px/1.55 'Inter', sans-serif",
                          color: t.subtext,
                          textWrap: "pretty",
                        }}
                      >
                        {a.why}
                      </p>

                      {/* Action Footer Bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "13px", flexWrap: "wrap" }}>
                        {/* Primary CTA Button */}
                        <div
                          onClick={() => handleActionOpen(a)}
                          style={
                            isDone
                              ? {
                                  height: "38px",
                                  padding: "0 16px",
                                  borderRadius: "11px",
                                  boxSizing: "border-box",
                                  border: isDark ? "1.5px solid rgba(247,243,238,.22)" : "1.5px solid rgba(13,43,69,.2)",
                                  color: t.muted,
                                  font: "700 13px 'DM Sans', sans-serif",
                                  display: "flex",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  userSelect: "none",
                                  whiteSpace: "nowrap",
                                }
                              : {
                                  height: "38px",
                                  padding: "0 16px",
                                  borderRadius: "11px",
                                  background: "#C9943A",
                                  color: "#0D0D0D",
                                  font: "700 13px 'DM Sans', sans-serif",
                                  display: "flex",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  userSelect: "none",
                                  whiteSpace: "nowrap",
                                }
                          }
                        >
                          {a.cta} →
                        </div>

                        {/* Secondary Mark done / Undo Button */}
                        <div
                          onClick={() => toggleDone(scope, index, a.t)}
                          style={{
                            height: "38px",
                            padding: "0 13px",
                            borderRadius: "11px",
                            boxSizing: "border-box",
                            border: isDark ? "1.5px solid rgba(247,243,238,.2)" : "1.5px solid rgba(13,43,69,.15)",
                            color: t.subtext,
                            font: "700 12.5px 'DM Sans', sans-serif",
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            userSelect: "none",
                          }}
                        >
                          {isDone ? "Undo" : "Mark done"}
                        </div>

                        {/* Impact Stat */}
                        {!isDone && a.impact && (
                          <span style={{ font: "700 12.5px 'JetBrains Mono', monospace", color: isDark ? "#5FC48E" : "#1A7A4A" }}>
                            {a.impact}
                          </span>
                        )}

                        {/* Effort Estimate */}
                        {!isDone && a.effort && (
                          <span style={{ font: "400 12px 'Inter', sans-serif", color: t.muted }}>
                            {a.effort}
                          </span>
                        )}

                        {/* Opens Target Hint */}
                        <span style={{ font: "500 11px 'JetBrains Mono', monospace", color: t.muted }}>
                          opens {renderWithBetaAudit(target)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </RequirementAuditBoundary>

          {/* Conditional: The Week Ahead (Scope: Today or Week) */}
          {(scope === "today" || scope === "week") && (
            <RequirementAuditBoundary auditId="ADMIN-EXTRA-014" status="extra" className="mt-5">
              <div
                style={{
                  marginTop: "20px",
                  backgroundColor: t.cardBg,
                  borderRadius: "20px",
                  boxShadow: t.cardShadow,
                  border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                  borderLeft: "4px solid #B5651D",
                  padding: "22px",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: "0.16em", color: "#C9943A", marginBottom: "5px" }}>
                      THE WEEK AHEAD
                    </div>
                    <h3 style={{ margin: 0, font: "600 20px 'Clash Display', 'DM Sans', sans-serif", color: t.text }}>
                      Seven days, planned
                    </h3>
                  </div>
                  <span style={{ font: "500 11.5px 'JetBrains Mono', monospace", color: t.muted }}>
                    auto-scheduled from your data
                  </span>
                </div>

              <div>
                {WEEK_ITEMS.map((w, idx) => (
                  <div
                    key={w.d}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 0",
                      borderBottom: idx < WEEK_ITEMS.length - 1 ? `1px solid ${t.rowBorder}` : "none",
                    }}
                  >
                    <div style={{ width: "74px", flex: "none" }}>
                      <div style={{ font: "700 12px 'JetBrains Mono', monospace", color: w.hot ? "#C9943A" : t.subtext }}>
                        {w.d}
                      </div>
                      <div style={{ font: "400 10.5px 'JetBrains Mono', monospace", color: t.muted, marginTop: "2px" }}>
                        {w.date}
                      </div>
                    </div>
                    <div
                      style={{
                        width: "3px",
                        alignSelf: "stretch",
                        borderRadius: "99px",
                        backgroundColor: w.hot ? "#C9943A" : isDark ? "rgba(247, 243, 238, 0.16)" : "rgba(13, 43, 69, 0.12)",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: w.hot ? "600 14.5px 'DM Sans', sans-serif" : "500 14.5px 'DM Sans', sans-serif", color: w.hot ? t.text : t.subtext }}>
                        {w.t}
                      </div>
                      <div style={{ font: "400 12px 'Inter', sans-serif", color: t.muted, marginTop: "2px" }}>
                        {w.note}
                      </div>
                    </div>
                    <span style={{ font: "500 11px 'JetBrains Mono', monospace", color: t.muted }}>
                      {w.owner}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            </RequirementAuditBoundary>
          )}

          {/* Conditional: YoY Table (Scope: Month or Year) */}
          {(scope === "month" || scope === "year") && (
            <div
              style={{
                marginTop: "20px",
                backgroundColor: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                borderLeft: "4px solid #B5651D",
                padding: "22px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: "0.16em", color: "#C9943A", marginBottom: "5px" }}>
                    COMPANY HEALTH · AGAINST LAST YEAR
                  </div>
                  <h3 style={{ margin: 0, font: "600 20px 'Clash Display', 'DM Sans', sans-serif", color: t.text }}>
                    Where you were, where you are
                  </h3>
                </div>
                <span style={{ font: "500 11.5px 'JetBrains Mono', monospace", color: t.muted }}>
                  Sep 2025 → Sep 2026
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", padding: "0 0 10px", borderBottom: `1px solid ${t.rowBorder}` }}>
                <span style={{ flex: 2, font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: "0.13em", color: t.muted, textTransform: "uppercase" }}>
                  MEASURE
                </span>
                <span style={{ flex: 1, textAlign: "right", font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: "0.13em", color: t.muted, textTransform: "uppercase" }}>
                  NOW
                </span>
                <span style={{ flex: 1, textAlign: "right", font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: "0.13em", color: t.muted, textTransform: "uppercase" }}>
                  LAST YEAR
                </span>
                <span style={{ flex: 1, textAlign: "right", font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: "0.13em", color: "#C9943A", textTransform: "uppercase" }}>
                  CHANGE
                </span>
              </div>

              <div>
                {YEAR_ROWS.map((y, idx) => (
                  <div
                    key={y.k}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "11px 0",
                      borderBottom: idx < YEAR_ROWS.length - 1 ? `1px solid ${t.rowBorder}` : "none",
                    }}
                  >
                    <span style={{ flex: 2, minWidth: 0, font: "600 14px 'DM Sans', sans-serif", color: t.text }}>
                      {y.k}
                    </span>
                    <span style={{ flex: 1, textAlign: "right", font: "700 13.5px 'JetBrains Mono', monospace", color: t.text }}>
                      {y.now}
                    </span>
                    <span style={{ flex: 1, textAlign: "right", font: "500 13px 'JetBrains Mono', monospace", color: t.muted }}>
                      {y.then}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        textAlign: "right",
                        font: "700 13px 'JetBrains Mono', monospace",
                        color: y.tone === "good" ? (isDark ? "#5FC48E" : "#1A7A4A") : (isDark ? "#D98A3E" : "#B5651D"),
                      }}
                    >
                      {y.delta}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "16px",
                  padding: "13px 15px",
                  borderRadius: "13px",
                  backgroundColor: isDark ? "rgba(181, 101, 29, 0.14)" : "rgba(181, 101, 29, 0.08)",
                  boxSizing: "border-box",
                  borderLeft: "3px solid #B5651D",
                  font: "400 12.5px/1.55 'Inter', sans-serif",
                  color: t.subtext,
                }}
              >
                Every measure improved except cost per acquisition, which rose 23% while revenue grew 312% — you bought growth, and it was worth it. Watch it if the gap narrows.
              </div>
            </div>
          )}
        </div>

        {/* Right Stage Rail: Exact Claude Reference (flex: 1 1 340px; min-width: 300px; display: flex; flex-direction: column; gap: 16px) */}
        <div style={{ flex: "1 1 340px", minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Where The Money Is */}
          <div
            style={{
              backgroundColor: t.cardBg,
              borderRadius: "20px",
              boxShadow: t.cardShadow,
              border: isDark ? "none" : `1px solid ${t.cardBorder}`,
              borderLeft: "4px solid #B5651D",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A", marginBottom: "14px" }}>
              WHERE THE MONEY IS
            </div>
            <div>
              {MARKETS.map((m, idx) => (
                <div
                  key={m.n}
                  style={{
                    padding: "16px 0",
                    borderBottom: idx < MARKETS.length - 1 ? `1px solid ${t.rowBorder}` : "none",
                    paddingBottom: idx === MARKETS.length - 1 ? 0 : "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px", marginBottom: "7px" }}>
                    <span style={{ font: "600 15.5px 'DM Sans', sans-serif", color: t.text }}>{m.n}</span>
                    <span style={{ font: "700 14px 'JetBrains Mono', monospace", color: "#C9943A" }}>{m.rev}</span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "99px", backgroundColor: isDark ? "rgba(247, 243, 238, 0.12)" : "rgba(13, 43, 69, 0.08)", overflow: "hidden", marginBottom: "9px" }}>
                    <div style={{ width: `${m.pct}%`, height: "100%", backgroundColor: m.tone }} />
                  </div>
                  <div style={{ display: "flex", gap: "14px", marginBottom: "9px" }}>
                    <span style={{ font: "500 11.5px 'JetBrains Mono', monospace", color: t.muted }}>{m.users}</span>
                    <span style={{ font: "500 11.5px 'JetBrains Mono', monospace", color: t.muted }}>{m.conv}</span>
                  </div>
                  <p style={{ margin: "0 0 10px", font: "400 12.5px/1.5 'Inter', sans-serif", color: t.subtext, textWrap: "pretty" }}>
                    {m.verdict}
                  </p>
                  <RequirementAuditBoundary auditId="ADMIN-EXTRA-012" status="extra">
                    <div
                      onClick={() => openDrawer(m.drawer)}
                      style={{
                        height: "40px",
                        borderRadius: "11px",
                        boxSizing: "border-box",
                        border: `1.5px solid ${isDark ? m.ink : m.tone}`,
                        color: isDark ? m.ink : m.tone,
                        font: "700 13px 'DM Sans', sans-serif",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      {m.action}
                    </div>
                  </RequirementAuditBoundary>
                </div>
              ))}
            </div>
          </div>

          {/* Needs You / Inbox */}
          <RequirementAuditBoundary auditId="ADMIN-EXTRA-013" status="extra">
            <div
              style={{
                backgroundColor: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px", marginBottom: "14px" }}>
                <span style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A" }}>
                  NEEDS YOU
                </span>
                <span style={{ font: "700 11.5px 'JetBrains Mono', monospace", color: t.muted }}>
                  {inboxCount}
                </span>
              </div>
              <div>
                {INBOX_ITEMS.map((item, idx) => (
                  <div
                    key={item.t}
                    onClick={() => navigate(item.route)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 0",
                      cursor: "pointer",
                      borderBottom: idx < INBOX_ITEMS.length - 1 ? `1px solid ${t.rowBorder}` : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "99px",
                        flex: "none",
                        backgroundColor:
                          item.c === "0"
                            ? isDark ? "rgba(247, 243, 238, 0.2)" : "rgba(13, 43, 69, 0.2)"
                            : item.tone === "gold" ? "#C9943A" : (isDark ? "#D98A3E" : "#B5651D"),
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 14px 'DM Sans', sans-serif", color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.t}
                      </div>
                      <div style={{ font: "400 11.5px 'Inter', sans-serif", color: t.muted, marginTop: "2px" }}>
                        {item.note}
                      </div>
                    </div>
                    <span
                      style={{
                        font: "700 13px 'JetBrains Mono', monospace",
                        flex: "none",
                        color: item.c === "0" ? t.muted : t.text,
                      }}
                    >
                      {item.c}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </RequirementAuditBoundary>

          {/* Push Something, Now / Levers */}
          <RequirementAuditBoundary auditId="ADMIN-EXTRA-015" status="extra">
            <div
              style={{
                backgroundColor: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A", marginBottom: "14px" }}>
                PUSH SOMETHING, NOW
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {LEVER_ITEMS.map((lever) => {
                  const leverCard = (
                    <div
                      key={lever.t}
                      onClick={() => openDrawer(lever.drawer)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        backgroundColor: t.subtleBg,
                        border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                        borderRadius: "13px",
                        padding: "13px 15px",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ font: "600 14px 'DM Sans', sans-serif", color: t.text }}>
                          {lever.t}
                        </div>
                        <div style={{ font: "400 11.5px/1.45 'Inter', sans-serif", color: t.muted, marginTop: "3px" }}>
                          {lever.note}
                        </div>
                      </div>
                      <span style={{ font: "700 15px 'DM Sans', sans-serif", color: "#C9943A", flex: "none" }}>›</span>
                    </div>
                  );

                  if (lever.t === "Offer a win-back") {
                    return (
                      <RequirementAuditBoundary key={lever.t} auditId="ADMIN-EXTRA-016" status="extra">
                        {leverCard}
                      </RequirementAuditBoundary>
                    );
                  }

                  return leverCard;
                })}
              </div>
            </div>
          </RequirementAuditBoundary>

          {/* Country and Currency: Exact Claude Reference (lines 224-236) */}
          <RequirementAuditBoundary auditId="ADMIN-EXTRA-017" status="extra">
            <div
              style={{
                backgroundColor: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                borderLeft: "4px solid #B5651D",
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A", marginBottom: "6px" }}>
                COUNTRY AND CURRENCY
              </div>
              <div style={{ font: "400 12.5px/1.5 'Inter', sans-serif", color: t.subtext, marginBottom: "14px" }}>
                How someone registering from outside your three target markets is handled.
              </div>
              <div>
                {MARKET_RULES.map((m) => (
                  <div
                    key={m.k}
                    style={{
                      display: "flex",
                      gap: "11px",
                      padding: "10px 0",
                      borderTop: `1px solid ${t.rowBorder}`,
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "99px",
                        flex: "none",
                        marginTop: "6px",
                        backgroundColor: m.tone === "good" ? "#1A7A4A" : "#B5651D",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 13.5px 'DM Sans', sans-serif", color: t.text }}>
                        {m.k}
                      </div>
                      <div style={{ font: "400 12px/1.5 'Inter', sans-serif", color: t.subtext, marginTop: "3px" }}>
                        {m.v}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RequirementAuditBoundary>

          {/* Retention Gate: Exact Claude Reference (lines 238-249) */}
          <RequirementAuditBoundary auditId="ADMIN-EXTRA-018" status="extra">
            <div
              style={{
                backgroundColor: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A", marginBottom: "6px" }}>
                RETENTION GATE
              </div>
              <div style={{ font: "400 12.5px/1.5 'Inter', sans-serif", color: t.subtext, marginBottom: "16px" }}>
                Day-7 above 45% for four straight weeks is the signal to spend on ads. Not before.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                {COHORTS.map((c) => (
                  <div key={c.w} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "52px", flex: "none", font: "500 11px 'JetBrains Mono', monospace", color: t.muted }}>
                      {c.w}
                    </span>
                    <div style={{ flex: 1, height: "6px", borderRadius: "99px", backgroundColor: isDark ? "rgba(247, 243, 238, 0.12)" : "rgba(13, 43, 69, 0.08)", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${c.v}%`,
                          height: "100%",
                          backgroundColor: c.v >= 45 ? "#1A7A4A" : "#B5651D",
                        }}
                      />
                    </div>
                    <span style={{ width: "44px", textAlign: "right", flex: "none", font: "700 12px 'JetBrains Mono', monospace", color: c.v >= 45 ? (isDark ? "#5FC48E" : "#1A7A4A") : (isDark ? "#D98A3E" : "#B5651D") }}>
                      {c.pct}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  padding: "13px 15px",
                  borderRadius: "13px",
                  backgroundColor: isDark ? "rgba(181, 101, 29, 0.14)" : "rgba(181, 101, 29, 0.08)",
                  boxSizing: "border-box",
                  borderLeft: "3px solid #B5651D",
                  font: "400 12.5px/1.55 'Inter', sans-serif",
                  color: t.subtext,
                }}
              >
                Two of four weeks above the line. Hold ad spend one more week — if 08 Sep lands above 45%, scale Germany first.
              </div>
            </div>
          </RequirementAuditBoundary>

        </div>
      </div>
    </div>
  );
}
