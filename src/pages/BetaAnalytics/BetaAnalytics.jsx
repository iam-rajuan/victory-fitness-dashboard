import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";
import RequirementAuditBoundary from "../../components/audit/RequirementAuditBoundary";
import { adminApiRequest } from "../../../services/auth.service";
import BetaTestersModal from "./BetaTestersModal";

const BETA_HERO = [
  { k: "CAPACITY", v: "300", tone: "default" },
  { k: "ENROLLED", v: "15", tone: "gold" },
  { k: "STILL ACTIVE", v: "11", tone: "good" },
  { k: "AVG DAYS LEFT", v: "12.4", tone: "default" },
];

const BETA_STAGES = [
  { k: "ENROLLED", v: "15", pct: "of 300", note: "Approved testers who accepted the invite.", c: "#C9943A", border: "#C9943A" },
  { k: "ACTIVATED", v: "6", pct: "40%", note: "Opened at least one Gold feature. This is the real number.", c: "#5FC48E", border: "#1A7A4A" },
  { k: "GAVE FEEDBACK", v: "12", pct: "80%", note: "Wrote something back. Higher than activation — people will talk even when they do not train.", c: "#5FC48E", border: "#1A7A4A" },
  { k: "WOULD PAY", v: "4", pct: "27%", note: "Said yes to “would you pay for this”. Ask again after the fixes ship.", c: "#D98A3E", border: "#B5651D" },
];

const CHECKPOINT_DISPLAY_DAYS = [1, 3, 5, 7, 10, 14, 18, 21];

const BETA_ACTIONS = [
  { id: "ba1", t: "Chase the 9 silent testers", note: "Enrolled, never opened a feature", n: "9", drawer: "message" },
  { id: "ba2", t: "Reply to this week's feedback", note: "Every tester who writes gets an answer", n: "12", drawer: "support" },
  { id: "ba3", t: "Ship the logging fix note", note: "Nine people asked. Tell them it is done.", n: "1", drawer: "broadcast" },
  { id: "ba4", t: "Book three exit interviews", note: "Fifteen minutes each, the ones who quit", n: "3", drawer: "application" },
];

const SEQUENCE = [
  { when: "DAY 21", t: "Your beta ends — thank you, and what did we miss?", note: "One question, one field. No pitch.", state: "SCHEDULED", tone: "warn" },
  { when: "DAY 24", t: "Here is what your feedback changed", note: "The three fixes that shipped, named after them.", state: "DRAFT", tone: "warn" },
  { when: "DAY 30", t: "Gold, at the beta price", note: "Discount for testers only, expires in 7 days.", state: "DRAFT", tone: "warn" },
  { when: "DAY 45", t: "Last call, then we stop writing", note: "One message, then off the list for good.", state: "NOT WRITTEN", tone: "bad" },
];

const renderStars = (rating) => {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return "★".repeat(value) + "☆".repeat(Math.max(0, 5 - value));
};

const buildCheckpointGraph = (summary) => {
  const total = Number(summary?.totalBetaUsers || 0);
  const byDay = new Map((summary?.checkpoints || []).map((item) => [Number(item.day), item]));
  const points = CHECKPOINT_DISPLAY_DAYS.map((day, index) => {
    const raw = byDay.get(day) || {};
    const eligible = Number(raw.eligibleUsers || 0);
    const active = Number(raw.activeUsers || 0);
    const previousActive = index > 0 ? Number(byDay.get(CHECKPOINT_DISPLAY_DAYS[index - 1])?.activeUsers || 0) : active;
    const droppedFromPrevious = Math.max(previousActive - active, 0);
    const denominator = eligible || total || previousActive || active || 1;
    const retentionPct = Math.round((active / denominator) * 100);
    return {
      day,
      label: `D${day}`,
      active,
      eligible,
      retainedPct: retentionPct,
      droppedFromPrevious,
      anyFeatureUsers: Number(raw.anyFeatureUsers || 0),
      aiUsers: Number(raw.aiUsers || 0),
      nutritionUsers: Number(raw.nutritionUsers || 0),
      workoutUsers: Number(raw.workoutUsers || 0),
      challengeUsers: Number(raw.challengeUsers || 0),
      communityUsers: Number(raw.communityUsers || 0),
      fill: retentionPct >= 70 ? "#1A7A4A" : retentionPct >= 50 ? "#C9943A" : "#B5651D",
    };
  });
  return points.filter((point) => point.eligible > 0 || point.active > 0);
};

const buildCheckpointInsight = (points, total) => {
  if (!points.length) {
    return "No eligible beta checkpoint data yet. As testers reach D1, D3 and later days, this graph will show exactly where they fall away.";
  }
  const biggestDrop = points.slice(1).reduce(
    (winner, point, index) => {
      const previous = points[index];
      const drop = Math.max(Number(previous?.active || 0) - Number(point.active || 0), 0);
      return drop > winner.drop ? { drop, from: previous, to: point } : winner;
    },
    { drop: 0, from: points[0], to: points[0] }
  );
  const last = points[points.length - 1];
  if (!biggestDrop.drop) {
    return `${last.active} of ${total || last.eligible || last.active} testers are still active through ${last.label}. No major checkpoint cliff is visible yet.`;
  }
  return `The biggest cliff is between ${biggestDrop.from.label} and ${biggestDrop.to.label}: ${biggestDrop.drop} tester${biggestDrop.drop === 1 ? "" : "s"} fall away there. Fix the experience immediately before ${biggestDrop.to.label}.`;
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const daysBetween = (start, end = new Date()) => {
  if (!start) return null;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1);
};

const initialsFor = (name, email) => {
  const words = String(name || email || "Tester").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return String(words[0] || "T").slice(0, 2).toUpperCase();
};

const formatLastActive = (value) => {
  const date = parseDate(value);
  if (!date) return "Never";
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
};

const testerStateFor = (tester) => {
  const activity = tester.activity || {};
  const lastActive = parseDate(activity.lastActiveAt);
  const inactiveDays = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86_400_000) : 999;
  const status = String(tester.status || "").toUpperCase();
  if (tester.isDeleted) return { label: "DELETED", tone: "bad" };
  if (tester.isBlocked || status === "BLOCKED") return { label: "BLOCKED", tone: "bad" };
  if (!activity.usedAnyTrackedFeature) return { label: "SILENT", tone: "bad" };
  if (status !== "ACTIVE") return { label: status || "EXPIRED", tone: "bad" };
  if (inactiveDays >= 3 || Number(tester.daysRemaining || 0) <= 2) return { label: "AT RISK", tone: "warn" };
  return { label: "ACTIVE", tone: "good" };
};

const normalizeTester = (tester) => {
  const activity = tester.activity || {};
  const started = parseDate(tester.trialStartedAt);
  const currentDay = daysBetween(started);
  const totalActions = [
    activity.aiMessages,
    activity.nutritionPlans,
    activity.nutritionLogs,
    activity.workoutsCompleted,
    activity.challengesJoined,
    activity.communityPosts,
    activity.communityComments,
    activity.communityReactions,
  ].reduce((sum, value) => sum + Number(value || 0), 0);
  const state = testerStateFor(tester);
  const country = tester.country || tester.countryCode || "Unknown";
  return {
    id: tester.id,
    initials: initialsFor(tester.fullName, tester.email),
    name: tester.fullName || tester.email || "Unknown tester",
    email: tester.email || "",
    country,
    currentDay,
    daysRemaining: Number(tester.daysRemaining || 0),
    state: state.label,
    tone: state.tone,
    lastActive: activity.lastActiveAt,
    lastActiveFormatted: formatLastActive(activity.lastActiveAt),
    meta: `${country} · ${currentDay ? `day ${currentDay}` : "day n/a"} · ${totalActions > 0 ? `${totalActions} actions` : "never opened"}`,
    activity,
    totalActions,
    isBlocked: Boolean(tester.isBlocked),
    isDeleted: Boolean(tester.isDeleted),
    blockedAt: tester.blockedAt || null,
    deletedAt: tester.deletedAt || null,
  };
};

export default function BetaAnalytics() {
  const { openDrawer, showToast } = useAdminDrawer();
  const { isDark } = useTheme();
  const [bdone, setBdone] = useState([]);
  const [betaSummary, setBetaSummary] = useState(null);
  const [isTestersModalOpen, setIsTestersModalOpen] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackReply, setFeedbackReply] = useState("");
  const [feedbackTicketNote, setFeedbackTicketNote] = useState("");
  const [feedbackActionSaving, setFeedbackActionSaving] = useState(false);

  const loadBetaSummary = useCallback(async ({ signal } = {}) => {
    const data = await adminApiRequest("/admin/trials/phase-one-beta?limit=300", { signal });
    setBetaSummary(data);
    return data;
  }, []);

  const t = {
    text: isDark ? "#F7F3EE" : "#0D2B45",
    subtext: isDark ? "rgba(247, 243, 238, 0.65)" : "rgba(13, 43, 69, 0.72)",
    muted: isDark ? "rgba(247, 243, 238, 0.45)" : "rgba(13, 43, 69, 0.52)",
    cardBg: isDark ? "#0D2B45" : "#FFFFFF",
    cardBorder: isDark ? "rgba(247, 243, 238, 0.1)" : "rgba(13, 43, 69, 0.08)",
    cardShadow: isDark ? "none" : "0 4px 20px rgba(13, 43, 69, 0.04)",
    subtleBg: isDark ? "rgba(247, 243, 238, 0.05)" : "#FAF7F2",
    heroMetricBg: isDark ? "rgba(247, 243, 238, 0.06)" : "#FAF7F2",
    rowBorder: isDark ? "rgba(247, 243, 238, 0.09)" : "rgba(13, 43, 69, 0.08)",
  };

  const getHeroColor = (tone) => {
    if (tone === "gold") return "#C9943A";
    if (tone === "good") return isDark ? "#5FC48E" : "#1A7A4A";
    return t.text;
  };

  const toggleDone = (index, title) => {
    setBdone((prev) => {
      const isDone = prev.includes(index);
      if (!isDone) {
        showToast(`✓ Completed: ${title}`);
        return [...prev, index];
      }
      return prev.filter((x) => x !== index);
    });
  };

  useEffect(() => {
    const ac = new AbortController();
    loadBetaSummary({ signal: ac.signal }).catch(() => {});
    return () => ac.abort();
  }, [loadBetaSummary]);

  const feedbackData = betaSummary?.feedback || null;
  const feedbackItems = feedbackData?.themes || [];
  const feedbackTotal = Number(feedbackData?.totalResponses || 0);
  const feedbackThemeCount = Number(feedbackData?.themeCount || feedbackItems.length || 0);
  const betaStages = useMemo(() => {
    const totalUsers = Number(betaSummary?.totalBetaUsers || 0);
    return BETA_STAGES.map((stage) => {
      if (stage.k === "GAVE FEEDBACK") {
        const pct = totalUsers > 0 ? `${Math.round((feedbackTotal / totalUsers) * 100)}%` : stage.pct;
        return { ...stage, v: String(feedbackTotal), pct };
      }
      if (stage.k === "WOULD PAY") {
        const pctNumber = Number(feedbackData?.wouldPayPct || 0);
        return { ...stage, v: String(feedbackData?.wouldPayCount || 0), pct: `${Math.round(pctNumber)}%` };
      }
      return stage;
    });
  }, [betaSummary, feedbackData, feedbackTotal]);
  const fbCount = `${feedbackTotal} responses · ${feedbackThemeCount} themes`;
  const checkpointGraph = useMemo(() => buildCheckpointGraph(betaSummary), [betaSummary]);
  const checkpointInsight = useMemo(
    () => buildCheckpointInsight(checkpointGraph, Number(betaSummary?.totalBetaUsers || 0)),
    [checkpointGraph, betaSummary]
  );
  const maxCheckpointActive = Math.max(...checkpointGraph.map((point) => point.active), 1);
  const testers = useMemo(
    () => (Array.isArray(betaSummary?.users) ? betaSummary.users.map(normalizeTester) : []),
    [betaSummary]
  );
  const visibleTesters = useMemo(() => testers.slice(0, 5), [testers]);
  const testerCountryCount = Number(betaSummary?.countriesRepresented || new Set(testers.map((item) => item.country)).size || 0);
  const openFeedbackAction = (fb) => {
    const mode = String(fb?.cta || "").toLowerCase().includes("assign")
      ? "ticket"
      : String(fb?.cta || "").toLowerCase().includes("build")
        ? "build"
        : "reply";
    setFeedbackModal({ ...fb, mode });
    setFeedbackReply(
      mode === "reply"
        ? `Hi ${fb?.latestUserName || "there"},\n\nThanks for sending this feedback. We have read it and will use it in the beta fixes.\n\n- Victory Fitness`
        : ""
    );
    setFeedbackTicketNote(fb?.quote ? `Member feedback: "${fb.quote}"` : "");
  };
  const closeFeedbackModal = () => {
    if (feedbackActionSaving) return;
    setFeedbackModal(null);
    setFeedbackReply("");
    setFeedbackTicketNote("");
  };
  const submitFeedbackReply = async (markResolved = false) => {
    if (!feedbackModal || feedbackActionSaving) return;
    const themeKey = feedbackModal.themeKey || feedbackModal.t;
    setFeedbackActionSaving(true);
    try {
      const result = await adminApiRequest(`/admin/trials/phase-one-beta/feedback/${encodeURIComponent(themeKey)}/reply`, {
        method: "POST",
        body: { message: feedbackReply.trim(), mark_resolved: markResolved },
      });
      showToast(`Reply sent to ${result.notifiedCount || 0} member${Number(result.notifiedCount || 0) === 1 ? "" : "s"}`);
      await loadBetaSummary();
      setFeedbackModal(null);
      setFeedbackReply("");
      setFeedbackTicketNote("");
    } catch (error) {
      showToast(error?.message || "Unable to send feedback reply");
    } finally {
      setFeedbackActionSaving(false);
    }
  };
  const submitFeedbackTicket = async (status = "ASSIGNED") => {
    if (!feedbackModal || feedbackActionSaving) return;
    const themeKey = feedbackModal.themeKey || feedbackModal.t;
    setFeedbackActionSaving(true);
    try {
      const result = await adminApiRequest(`/admin/trials/phase-one-beta/feedback/${encodeURIComponent(themeKey)}/dev-ticket`, {
        method: "POST",
        body: { note: feedbackTicketNote.trim(), status },
      });
      showToast(`${result.ticketId || "Build ticket"} ${status === "IN_BUILD" ? "moved into build" : "assigned to dev"}`);
      await loadBetaSummary();
      setFeedbackModal(null);
      setFeedbackReply("");
      setFeedbackTicketNote("");
    } catch (error) {
      showToast(error?.message || "Unable to update build ticket");
    } finally {
      setFeedbackActionSaving(false);
    }
  };

  return (
    <div className={`animate-in fade-in duration-200 font-dmsans ${isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"}`}>
      {/* Hero Banner: Exact Claude Reference (lines 258-278) */}
      <div className="mb-5">
        <div
          style={{
            background: t.cardBg,
            borderRadius: "22px",
            padding: "26px 28px",
            boxShadow: t.cardShadow,
            border: isDark ? "none" : `1px solid ${t.cardBorder}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "4px", background: "#B5651D" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "26px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span
                style={{
                  font: "700 10px 'DM Sans', sans-serif",
                  letterSpacing: ".12em",
                  color: "#0D0D0D",
                  background: "#C9943A",
                  borderRadius: "5px",
                  padding: "4px 9px",
                }}
              >
                ONE-TIME PROGRAMME
              </span>
              <span style={{ font: "500 11px 'JetBrains Mono', monospace", color: t.muted }}>
                PHASE 1 · CLOSES 30 SEP
              </span>
            </div>
            <h1 style={{ margin: "0 0 10px", font: "600 38px/1.05 'Clash Display', 'DM Sans', sans-serif", color: t.text, letterSpacing: "-.015em" }}>
              21-Day Gold Beta
            </h1>
            <p style={{ margin: 0, maxWidth: "600px", font: "400 15px/1.6 'Inter', sans-serif", color: t.subtext, textWrap: "pretty" }}>
              Full Gold, free, for 21 days. No card, no auto-renewal. The purpose is not conversion — it is written feedback you can build from, and a warm list to sell to when the fixes ship.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {BETA_HERO.map((h) => (
              <div key={h.k} style={{ width: "126px", background: t.heroMetricBg, border: isDark ? "none" : `1px solid ${t.cardBorder}`, borderRadius: "14px", padding: "14px 15px", boxSizing: "border-box" }}>
                <div style={{ font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: ".12em", color: t.muted, marginBottom: "6px" }}>
                  {h.k}
                </div>
                <div style={{ font: "700 28px/1 'JetBrains Mono', monospace", color: getHeroColor(h.tone) }}>
                  {h.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* 4 Beta Stages: Exact Claude Reference (lines 280-291) */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {betaStages.map((b) => (
          <div
            key={b.k}
            style={{
              flex: "1 1 200px",
              minWidth: "190px",
              background: t.cardBg,
              borderRadius: "18px",
              boxShadow: t.cardShadow,
              border: isDark ? "none" : `1px solid ${t.cardBorder}`,
              borderLeft: `4px solid ${b.border}`,
              padding: "17px 18px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: ".13em", color: t.muted, marginBottom: "7px" }}>
              {b.k}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "7px" }}>
              <span style={{ font: "700 30px/1 'JetBrains Mono', monospace", color: b.c === "#5FC48E" ? (isDark ? "#5FC48E" : "#1A7A4A") : b.c === "#D98A3E" ? (isDark ? "#D98A3E" : "#B5651D") : "#C9943A" }}>
                {b.v}
              </span>
              <span style={{ font: "500 12px 'JetBrains Mono', monospace", color: t.muted }}>
                {b.pct}
              </span>
            </div>
            <div style={{ font: "400 12px/1.45 'Inter', sans-serif", color: t.subtext, marginTop: "7px" }}>
              {b.note}
            </div>
          </div>
        ))}
      </div>

      {/* Main Two-Column Stage: Left (Feedback + Drop-off) & Right (Actions + Sequence + Testers) */}
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Left Column (flex: 1 1 600px; min-width: 0) */}
        <div style={{ flex: "1 1 600px", minWidth: 0 }}>
          
          {/* THE POINT OF THE PROGRAMME / Feedback inbox: Exact 1:1 Claude Reference */}
            <div
              style={{
                background: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                borderLeft: "4px solid #B5651D",
                padding: "22px",
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
              <div>
                <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A", marginBottom: "5px" }}>
                  THE POINT OF THE PROGRAMME
                </div>
                <h3 style={{ margin: 0, font: "600 21px 'Clash Display', 'DM Sans', sans-serif", color: t.text }}>
                  Feedback inbox
                </h3>
              </div>
              <span style={{ font: "700 12px 'JetBrains Mono', monospace", color: "#C9943A" }}>
                {fbCount}
              </span>
            </div>
            <p style={{ margin: "0 0 16px", font: "400 13px/1.55 'Inter', sans-serif", color: t.subtext }}>
              Grouped by theme, not by tester. Size of the group is how many people said it.
            </p>

            {feedbackItems.length === 0 && (
              <div
                style={{
                  background: t.subtleBg,
                  borderRadius: "15px",
                  border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                  padding: "16px 17px",
                  boxSizing: "border-box",
                  font: "400 13.5px/1.55 'Inter', sans-serif",
                  color: t.subtext,
                }}
              >
                No feedback has been sent from the app yet.
              </div>
            )}

            {feedbackItems.map((fb, i) => (
              <div
                key={fb.t}
                style={{
                  background: t.subtleBg,
                  borderRadius: "15px",
                  border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                  padding: "16px 17px",
                  marginBottom: i < feedbackItems.length - 1 ? "9px" : 0,
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      font: "700 12px 'JetBrains Mono', monospace",
                      color: "#0D0D0D",
                      background: "#C9943A",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      lineHeight: "1.2",
                    }}
                  >
                    {fb.c}×
                  </span>
                  <span style={{ font: "600 15.5px 'DM Sans', sans-serif", color: t.text }}>
                    {fb.t}
                  </span>
                  <span
                    style={{
                      font: "700 9.5px 'DM Sans', sans-serif",
                      letterSpacing: ".11em",
                      color: fb.tone === "good" ? (isDark ? "#5FC48E" : "#1A7A4A") : fb.tone === "warn" ? "#C9943A" : (isDark ? "#D98A3E" : "#B5651D"),
                    }}
                  >
                    {fb.status}
                  </span>
                  <span
                    title={`${Number(fb.averageRating || 0).toFixed(1)} out of 5`}
                    style={{
                      font: "700 12px 'DM Sans', sans-serif",
                      color: "#C9943A",
                      letterSpacing: ".06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {renderStars(fb.averageRating)}
                    <span style={{ color: t.subtext, marginLeft: "5px", letterSpacing: 0 }}>
                      {Number(fb.averageRating || 0).toFixed(1)}
                    </span>
                  </span>
                </div>

                <p style={{ margin: "0 0 10px", font: "400 13.5px/1.55 'Inter', sans-serif", color: t.subtext, textWrap: "pretty" }}>
                  “{fb.quote}”
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div
                    onClick={() => openFeedbackAction(fb)}
                    style={{
                      height: "36px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      boxSizing: "border-box",
                      border: "1.5px solid rgba(201,148,58,.6)",
                      color: "#C9943A",
                      font: "700 12.5px 'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {fb.cta}
                  </div>
                  <span style={{ font: "400 11.5px 'JetBrains Mono', monospace", color: t.muted }}>
                    {fb.who}
                  </span>
                </div>
              </div>
            ))}
            </div>

          {/* CHECKPOINT ANALYTICS / Where testers fall away */}
          <RequirementAuditBoundary
            auditId="ADMIN-EXTRA-045"
            status="extra"
            label="EXTRA - IMPLEMENTED - CHECKPOINT ANALYTICS (WHERE TESTERS FALL AWAY)"
            markerColor="#1A7A4A"
          >
            <div
              style={{
                background: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                padding: "22px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A", marginBottom: "5px" }}>
                CHECKPOINT ANALYTICS
              </div>
              <h3 style={{ margin: "0 0 4px", font: "600 21px 'Clash Display', 'DM Sans', sans-serif", color: t.text }}>
                Where testers fall away
              </h3>
              <p style={{ margin: "0 0 18px", font: "400 13px/1.55 'Inter', sans-serif", color: t.subtext }}>
                Each bar is testers still active through that checkpoint. The drop between two days is what to fix.
              </p>

            <div style={{ height: "220px", margin: "2px 0 16px" }}>
              {checkpointGraph.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={checkpointGraph} margin={{ top: 18, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid vertical={false} stroke={isDark ? "rgba(247,243,238,.08)" : "rgba(13,43,69,.08)"} />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: t.muted, fontSize: 11, fontFamily: "JetBrains Mono" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, Math.max(maxCheckpointActive, 1)]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: t.muted, fontSize: 10, fontFamily: "JetBrains Mono" }}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? "rgba(247,243,238,.04)" : "rgba(13,43,69,.04)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: isDark ? "#071A2A" : "#FFFFFF",
                              border: `1px solid ${isDark ? "rgba(247,243,238,.14)" : "rgba(13,43,69,.12)"}`,
                              borderRadius: "12px",
                              padding: "10px 12px",
                              boxShadow: isDark ? "none" : "0 12px 30px rgba(13,43,69,.14)",
                            }}
                          >
                            <div style={{ font: "700 12px 'DM Sans', sans-serif", color: t.text, marginBottom: "4px" }}>
                              {item.label}
                            </div>
                            <div style={{ font: "500 11px/1.6 'JetBrains Mono', monospace", color: t.subtext }}>
                              Active: {item.active} / {item.eligible || item.active}
                              <br />
                              Retained: {item.retainedPct}%
                              <br />
                              Drop from previous: {item.droppedFromPrevious}
                              <br />
                              AI {item.aiUsers} · Nutrition {item.nutritionUsers} · Workouts {item.workoutUsers}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="active"
                      name="Active testers"
                      radius={[8, 8, 0, 0]}
                      label={{
                        position: "top",
                        fill: isDark ? "#F7F3EE" : "#0D2B45",
                        fontSize: 12,
                        fontFamily: "JetBrains Mono",
                        fontWeight: 700,
                      }}
                    >
                      {checkpointGraph.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    height: "100%",
                    borderRadius: "15px",
                    background: t.subtleBg,
                    border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "18px",
                    color: t.subtext,
                    font: "400 13px/1.55 'Inter', sans-serif",
                  }}
                >
                  No eligible checkpoint data yet.
                </div>
              )}
            </div>

            <div
              style={{
                padding: "13px 15px",
                borderRadius: "13px",
                background: isDark ? "rgba(181,101,29,.14)" : "rgba(181,101,29,.08)",
                boxSizing: "border-box",
                borderLeft: "3px solid #B5651D",
                font: "400 12.5px/1.55 'Inter', sans-serif",
                color: t.subtext,
              }}
            >
              {checkpointInsight}
            </div>
            </div>
          </RequirementAuditBoundary>
        </div>

        {/* Right Column (flex: 1 1 330px; min-width: 300px; display: flex; flex-direction: column; gap: 16px) */}
        <div style={{ flex: "1 1 330px", minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* TESTERS: real beta users from the backend */}
          <div
            style={{
              background: t.cardBg,
              borderRadius: "20px",
              boxShadow: t.cardShadow,
              border: isDark ? "none" : `1px solid ${t.cardBorder}`,
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px", marginBottom: "14px" }}>
              <span style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A" }}>
                TESTERS
              </span>
              <span style={{ font: "700 11px 'JetBrains Mono', monospace", color: t.muted }}>
                {testers.length} ENROLLED · {testerCountryCount} COUNTRIES
              </span>
            </div>

            {visibleTesters.length === 0 ? (
              <div
                style={{
                  border: `1px solid ${t.rowBorder}`,
                  borderRadius: "14px",
                  padding: "18px",
                  font: "600 13px 'DM Sans', sans-serif",
                  color: t.muted,
                }}
              >
                No beta testers found yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {visibleTesters.map((tItem, idx) => (
                  <div
                    key={tItem.id || `${tItem.email}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "11px",
                      padding: "11px 10px",
                      borderBottom: idx < visibleTesters.length - 1 ? `1px solid ${t.rowBorder}` : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "99px",
                        background: isDark ? "rgba(247,243,238,.12)" : "rgba(13,43,69,.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "none",
                      }}
                    >
                      <span style={{ font: "700 11.5px 'DM Sans', sans-serif", color: "#C9943A" }}>
                        {tItem.initials}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          font: "600 13.5px 'DM Sans', sans-serif",
                          color: t.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {tItem.name}
                      </div>
                      <div
                        style={{
                          font: "400 11px 'JetBrains Mono', monospace",
                          color: t.muted,
                          marginTop: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {tItem.meta}
                      </div>
                    </div>
                    <span
                      style={{
                        font: "700 9.5px 'DM Sans', sans-serif",
                        letterSpacing: ".11em",
                        flex: "none",
                        color:
                          tItem.tone === "good"
                            ? isDark
                              ? "#5FC48E"
                              : "#1A7A4A"
                            : tItem.tone === "warn"
                            ? "#C9943A"
                            : isDark
                            ? "#D98A3E"
                            : "#B5651D",
                      }}
                    >
                      {tItem.state}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsTestersModalOpen(true)}
              style={{
                width: "100%",
                height: "42px",
                borderRadius: "12px",
                boxSizing: "border-box",
                border: "1.5px solid rgba(201,148,58,.6)",
                background: isDark ? "rgba(201,148,58,0.06)" : "rgba(201,148,58,0.04)",
                color: "#C9943A",
                font: "700 13px 'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                marginTop: "14px",
                userSelect: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? "rgba(201,148,58,0.14)" : "rgba(201,148,58,0.12)";
                e.currentTarget.style.borderColor = "#C9943A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? "rgba(201,148,58,0.06)" : "rgba(201,148,58,0.04)";
                e.currentTarget.style.borderColor = "rgba(201,148,58,.6)";
              }}
            >
              <span>{`See all ${testers.length || 0}`}</span>
              <span style={{ fontSize: "14px", lineHeight: 1 }}>↗</span>
            </button>
          </div>

          {/* DO THIS TODAY: Exact Claude Reference (lines 340-352) */}
          <RequirementAuditBoundary
            auditId="ADMIN-EXTRA-046"
            status="extra"
            label="NOT IN REQUIREMENT - DO THIS TODAY (BETA ACTIONS CHECKLIST)"
          >
            <div
              style={{
                background: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                borderLeft: "4px solid #B5651D",
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
            <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A", marginBottom: "14px" }}>
              DO THIS TODAY
            </div>

            {BETA_ACTIONS.map((a, i) => {
              const on = bdone.includes(i);
              return (
                <div
                  key={a.id}
                  onClick={() => toggleDone(i, a.t)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 0",
                    cursor: "pointer",
                    borderBottom: i < BETA_ACTIONS.length - 1 ? `1px solid ${t.rowBorder}` : "none",
                    opacity: on ? 0.45 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  <div
                    style={
                      on
                        ? {
                            width: "20px",
                            height: "20px",
                            borderRadius: "6px",
                            background: "#1A7A4A",
                            flex: "none",
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }
                        : {
                            width: "20px",
                            height: "20px",
                            borderRadius: "6px",
                            boxSizing: "border-box",
                            border: isDark ? "1.5px solid rgba(201,148,58,.6)" : "1.5px solid rgba(201,148,58,.8)",
                            background: isDark ? "transparent" : "#FFF9F0",
                            flex: "none",
                            marginTop: "2px",
                          }
                    }
                  >
                    {on && (
                      <span style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: "10px", lineHeight: 1 }}>
                        ✓
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        font: "600 14px 'DM Sans', sans-serif",
                        color: t.text,
                        textDecoration: on ? "line-through" : "none",
                      }}
                    >
                      {a.t}
                    </div>
                    <div style={{ font: "400 12px/1.45 'Inter', sans-serif", color: t.muted, marginTop: "3px" }}>
                      {a.note}
                    </div>
                  </div>

                  <span style={{ font: "700 11.5px 'JetBrains Mono', monospace", color: isDark ? "#5FC48E" : "#1A7A4A", flex: "none" }}>
                    {a.n}
                  </span>
                </div>
              );
            })}
            </div>
          </RequirementAuditBoundary>

          {/* AFTER DAY 21: Exact Claude Reference (lines 354-370) */}
          <RequirementAuditBoundary
            auditId="ADMIN-EXTRA-047"
            status="extra"
            label="NOT IN REQUIREMENT - AFTER DAY 21 (RE-MARKETING SEQUENCE)"
          >
            <div
              style={{
                background: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
            <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A", marginBottom: "5px" }}>
              AFTER DAY 21
            </div>
            <h4 style={{ margin: "0 0 6px", font: "600 18px 'Clash Display', 'DM Sans', sans-serif", color: t.text }}>
              The re-marketing sequence
            </h4>
            <p style={{ margin: "0 0 16px", font: "400 12.5px/1.55 'Inter', sans-serif", color: t.subtext }}>
              They tried Gold free and told you what was wrong. You fix it, then you go back and say so. That second message is the one that sells.
            </p>

            {SEQUENCE.map((q) => (
              <div key={q.when} style={{ display: "flex", gap: "12px", padding: "12px 0", borderTop: `1px solid ${t.rowBorder}` }}>
                <span style={{ width: "52px", flex: "none", font: "700 11px 'JetBrains Mono', monospace", color: "#C9943A" }}>
                  {q.when}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 13.5px/1.35 'DM Sans', sans-serif", color: t.text }}>
                    {q.t}
                  </div>
                  <div style={{ font: "400 11.5px/1.45 'Inter', sans-serif", color: t.muted, marginTop: "3px" }}>
                    {q.note}
                  </div>
                </div>
                <span
                  style={{
                    font: "700 9.5px 'DM Sans', sans-serif",
                    letterSpacing: ".11em",
                    flex: "none",
                    color: q.tone === "good" ? (isDark ? "#5FC48E" : "#1A7A4A") : q.tone === "warn" ? "#C9943A" : (isDark ? "#D98A3E" : "#B5651D"),
                  }}
                >
                  {q.state}
                </span>
              </div>
            ))}

            <div
              onClick={() => openDrawer("template")}
              style={{
                height: "46px",
                borderRadius: "12px",
                background: "#C9943A",
                color: "#0D0D0D",
                font: "700 14px 'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginTop: "16px",
                userSelect: "none",
              }}
            >
              Open the sequence editor
            </div>
            </div>
          </RequirementAuditBoundary>

        </div>
      </div>

      {feedbackModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Feedback action"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeFeedbackModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(13,13,13,.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto",
              borderRadius: "18px",
              background: isDark ? "#0D0D0D" : "#FFFFFF",
              border: `1px solid ${isDark ? "rgba(247,243,238,.14)" : "rgba(13,43,69,.12)"}`,
              boxShadow: isDark ? "0 24px 60px rgba(0,0,0,.45)" : "0 24px 70px rgba(13,43,69,.2)",
            }}
          >
            <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${t.rowBorder}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px" }}>
                <div>
                  <div style={{ font: "700 10px 'DM Sans', sans-serif", letterSpacing: ".16em", color: "#C9943A", marginBottom: "7px" }}>
                    FEEDBACK THREAD
                  </div>
                  <h3 style={{ margin: 0, font: "600 24px/1.1 'Clash Display', 'DM Sans', sans-serif", color: t.text }}>
                    {feedbackModal.t}
                  </h3>
                  <p style={{ margin: "8px 0 0", font: "400 13px/1.55 'Inter', sans-serif", color: t.subtext }}>
                    {feedbackModal.c} response{Number(feedbackModal.c || 0) === 1 ? "" : "s"} · {feedbackModal.who}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeFeedbackModal}
                  disabled={feedbackActionSaving}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "99px",
                    border: `1px solid ${t.rowBorder}`,
                    background: isDark ? "rgba(247,243,238,.08)" : "rgba(13,43,69,.05)",
                    color: t.subtext,
                    cursor: feedbackActionSaving ? "not-allowed" : "pointer",
                    font: "700 18px 'DM Sans', sans-serif",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: "20px 24px 24px", display: "grid", gap: "14px" }}>
              <div
                style={{
                  borderRadius: "14px",
                  background: t.subtleBg,
                  border: `1px solid ${t.rowBorder}`,
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                  <span style={{ font: "700 10px 'DM Sans', sans-serif", letterSpacing: ".14em", color: "#C9943A" }}>
                    LATEST MEMBER FEEDBACK
                  </span>
                  <span style={{ font: "600 11px 'JetBrains Mono', monospace", color: t.muted }}>
                    {feedbackModal.latestUserName || feedbackModal.latestUserEmail || "Member"}
                  </span>
                </div>
                <p style={{ margin: 0, font: "400 13.5px/1.65 'Inter', sans-serif", color: t.subtext }}>
                  “{feedbackModal.quote || "No message text available."}”
                </p>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  background: isDark ? "rgba(13,43,69,.75)" : "rgba(13,43,69,.04)",
                  border: `1px solid ${t.rowBorder}`,
                  padding: "14px 16px",
                }}
              >
                <div style={{ font: "700 10px 'DM Sans', sans-serif", letterSpacing: ".14em", color: "#C9943A", marginBottom: "10px" }}>
                  REPLY TO MEMBER
                </div>
                <textarea
                  value={feedbackReply}
                  onChange={(event) => setFeedbackReply(event.target.value)}
                  placeholder="Write the reply the member should see in the app..."
                  rows={6}
                  style={{
                    width: "100%",
                    resize: "vertical",
                    minHeight: "132px",
                    boxSizing: "border-box",
                    borderRadius: "12px",
                    border: `1px solid ${isDark ? "rgba(247,243,238,.16)" : "rgba(13,43,69,.14)"}`,
                    background: isDark ? "#082033" : "#FFFFFF",
                    color: t.text,
                    padding: "13px 14px",
                    font: "500 13px/1.55 'Inter', sans-serif",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => submitFeedbackReply(false)}
                    disabled={feedbackActionSaving || feedbackReply.trim().length < 4}
                    style={{
                      height: "40px",
                      padding: "0 16px",
                      borderRadius: "11px",
                      border: "none",
                      background: "#C9943A",
                      color: "#0D0D0D",
                      font: "700 13px 'DM Sans', sans-serif",
                      cursor: feedbackActionSaving || feedbackReply.trim().length < 4 ? "not-allowed" : "pointer",
                    }}
                  >
                    {feedbackActionSaving ? "Sending..." : "Send reply"}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitFeedbackReply(true)}
                    disabled={feedbackActionSaving || feedbackReply.trim().length < 4}
                    style={{
                      height: "40px",
                      padding: "0 16px",
                      borderRadius: "11px",
                      border: `1px solid ${t.rowBorder}`,
                      background: "transparent",
                      color: t.text,
                      font: "700 13px 'DM Sans', sans-serif",
                      cursor: feedbackActionSaving || feedbackReply.trim().length < 4 ? "not-allowed" : "pointer",
                    }}
                  >
                    Send and mark resolved
                  </button>
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  background: t.subtleBg,
                  border: `1px solid ${t.rowBorder}`,
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ font: "700 10px 'DM Sans', sans-serif", letterSpacing: ".14em", color: "#C9943A" }}>
                    BUILD TICKET
                  </span>
                  <span style={{ font: "700 11px 'JetBrains Mono', monospace", color: t.muted }}>
                    {feedbackModal.devTicketStatus || "NOT ASSIGNED"}
                  </span>
                </div>
                <textarea
                  value={feedbackTicketNote}
                  onChange={(event) => setFeedbackTicketNote(event.target.value)}
                  placeholder="Add implementation notes for the dev team..."
                  rows={3}
                  style={{
                    width: "100%",
                    resize: "vertical",
                    minHeight: "82px",
                    boxSizing: "border-box",
                    borderRadius: "12px",
                    border: `1px solid ${isDark ? "rgba(247,243,238,.16)" : "rgba(13,43,69,.14)"}`,
                    background: isDark ? "#082033" : "#FFFFFF",
                    color: t.text,
                    padding: "12px 13px",
                    font: "500 13px/1.55 'Inter', sans-serif",
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => submitFeedbackTicket("ASSIGNED")}
                    disabled={feedbackActionSaving}
                    style={{
                      height: "38px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: `1.5px solid rgba(201,148,58,.65)`,
                      background: "transparent",
                      color: "#C9943A",
                      font: "700 12.5px 'DM Sans', sans-serif",
                      cursor: feedbackActionSaving ? "not-allowed" : "pointer",
                    }}
                  >
                    Assign to dev
                  </button>
                  <button
                    type="button"
                    onClick={() => submitFeedbackTicket("IN_BUILD")}
                    disabled={feedbackActionSaving}
                    style={{
                      height: "38px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "none",
                      background: isDark ? "#1A7A4A" : "#1A7A4A",
                      color: "#FFFFFF",
                      font: "700 12.5px 'DM Sans', sans-serif",
                      cursor: feedbackActionSaving ? "not-allowed" : "pointer",
                    }}
                  >
                    Mark in build
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paginated Beta Testers Modal */}
      <BetaTestersModal
        isOpen={isTestersModalOpen}
        onClose={() => setIsTestersModalOpen(false)}
        testers={testers}
        countryCount={testerCountryCount}
        onRefresh={loadBetaSummary}
      />
    </div>
  );
}
