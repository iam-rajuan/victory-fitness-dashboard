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
const FEEDBACK_PAGE_SIZE = 25;

const BETA_ACTIONS = [
  { id: "ba1", t: "Chase the 9 silent testers", note: "Enrolled, never opened a feature", n: "9", drawer: "message" },
  { id: "ba2", t: "Reply to this week's feedback", note: "Every tester who writes gets an answer", n: "12", drawer: "feedback" },
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

const feedbackPayLabel = (value) => {
  if (value === true) return "Would pay: yes";
  if (value === false) return "Would pay: no";
  return "Would pay: not sure";
};

const testerStateFor = (tester) => {
  const activity = tester.activity || {};
  const lastActive = parseDate(activity.lastActiveAt);
  const inactiveDays = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86_400_000) : 999;
  const status = String(tester.status || "").toUpperCase();
  if (tester.isDeleted) return { label: "DELETED", tone: "bad" };
  if (tester.isBlocked || status === "BLOCKED") return { label: "BLOCKED", tone: "bad" };
  if (!activity.usedAnyTrackedFeature && !lastActive) return { label: "SILENT", tone: "bad" };
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
    profileImage: tester.profileImage || tester.profile_image || "",
    name: tester.fullName || tester.email || "Unknown tester",
    email: tester.email || "",
    country,
    currentDay,
    daysRemaining: Number(tester.daysRemaining || 0),
    state: state.label,
    tone: state.tone,
    lastActive: activity.lastActiveAt,
    lastActiveFormatted: formatLastActive(activity.lastActiveAt),
    meta: `${country} · ${currentDay ? `day ${currentDay}` : "day n/a"} · ${totalActions > 0 ? `${totalActions} actions` : activity.lastActiveAt ? "opened app" : "never opened"}`,
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
  const [selectedFeedbackItemId, setSelectedFeedbackItemId] = useState("");
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [feedbackPage, setFeedbackPage] = useState(1);
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
    const firstFeedback = Array.isArray(fb?.feedbacks) ? fb.feedbacks[0] : null;
    setFeedbackModal({ ...fb, mode: "reply" });
    setSelectedFeedbackItemId(firstFeedback?.id || "");
    setFeedbackSearch("");
    setFeedbackFilter("all");
    setFeedbackPage(1);
    setFeedbackReply(`Thanks for your feedback about ${fb?.t || "this"}. We read your note and will use it to improve the beta experience.`);
  };
  const closeFeedbackModal = () => {
    if (feedbackActionSaving) return;
    setFeedbackModal(null);
    setFeedbackReply("");
    setSelectedFeedbackItemId("");
    setFeedbackSearch("");
    setFeedbackFilter("all");
    setFeedbackPage(1);
  };
  const submitFeedbackReply = async ({ markResolved = false, replyAll = false } = {}) => {
    if (!feedbackModal || feedbackActionSaving) return;
    const themeKey = feedbackModal.themeKey || feedbackModal.t;
    const selectedId = selectedFeedbackItemId || feedbackModal.latestFeedbackId;
    setFeedbackActionSaving(true);
    try {
      const path = replyAll
        ? `/admin/trials/phase-one-beta/feedback/${encodeURIComponent(themeKey)}/reply`
        : `/admin/trials/phase-one-beta/feedback-items/${encodeURIComponent(selectedId)}/reply`;
      const result = await adminApiRequest(path, {
        method: "POST",
        body: { message: feedbackReply.trim(), mark_resolved: markResolved },
      });
      showToast(
        replyAll
          ? `Reply sent to ${result.notifiedCount || 0} member${Number(result.notifiedCount || 0) === 1 ? "" : "s"}`
          : `Reply sent to ${result.email || "member"}`
      );
      await loadBetaSummary();
      setFeedbackModal(null);
      setFeedbackReply("");
      setSelectedFeedbackItemId("");
      setFeedbackSearch("");
      setFeedbackFilter("all");
      setFeedbackPage(1);
    } catch (error) {
      showToast(error?.message || "Unable to send feedback reply");
    } finally {
      setFeedbackActionSaving(false);
    }
  };
  const feedbackRows = useMemo(
    () => (Array.isArray(feedbackModal?.feedbacks) ? feedbackModal.feedbacks : []),
    [feedbackModal]
  );
  const selectedFeedbackItem = useMemo(
    () => feedbackRows.find((item) => item.id === selectedFeedbackItemId) || feedbackRows[0] || null,
    [feedbackRows, selectedFeedbackItemId]
  );
  const feedbackRowStats = useMemo(() => {
    const replied = feedbackRows.filter((item) => String(item.adminReply || "").trim()).length;
    const open = Math.max(feedbackRows.length - replied, 0);
    const uniqueUsers = new Set(feedbackRows.map((item) => item.userId || item.userEmail || item.userName).filter(Boolean)).size;
    return { replied, open, uniqueUsers };
  }, [feedbackRows]);
  const filteredFeedbackRows = useMemo(() => {
    const query = feedbackSearch.trim().toLowerCase();
    return feedbackRows.filter((item) => {
      const hasReply = Boolean(String(item.adminReply || "").trim());
      if (feedbackFilter === "open" && hasReply) return false;
      if (feedbackFilter === "replied" && !hasReply) return false;
      if (!query) return true;
      const haystack = [
        item.userName,
        item.userEmail,
        item.country,
        item.message,
        item.adminReply,
        feedbackPayLabel(item.wouldPay),
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [feedbackRows, feedbackSearch, feedbackFilter]);
  useEffect(() => {
    setFeedbackPage(1);
  }, [feedbackSearch, feedbackFilter, feedbackModal?.themeKey]);
  const feedbackTotalPages = Math.max(1, Math.ceil(filteredFeedbackRows.length / FEEDBACK_PAGE_SIZE));
  const safeFeedbackPage = Math.min(feedbackPage, feedbackTotalPages);
  const pagedFeedbackRows = useMemo(() => {
    const start = (safeFeedbackPage - 1) * FEEDBACK_PAGE_SIZE;
    return filteredFeedbackRows.slice(start, start + FEEDBACK_PAGE_SIZE);
  }, [filteredFeedbackRows, safeFeedbackPage]);
  const feedbackListStart = filteredFeedbackRows.length ? (safeFeedbackPage - 1) * FEEDBACK_PAGE_SIZE + 1 : 0;
  const feedbackListEnd = Math.min(safeFeedbackPage * FEEDBACK_PAGE_SIZE, filteredFeedbackRows.length);

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
                    Reply to feedback
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
                    {tItem.profileImage ? (
                      <img
                        src={tItem.profileImage}
                        alt={tItem.name}
                        onError={(event) => {
                          event.currentTarget.src = "/userimg.png";
                        }}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "99px",
                          objectFit: "cover",
                          flex: "none",
                          border: "1px solid rgba(201,148,58,0.35)",
                        }}
                      />
                    ) : (
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
                    )}
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
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex justify-end font-dmsans"
          role="dialog"
          aria-modal="true"
          aria-label="Feedback action"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeFeedbackModal();
          }}
          style={{
            alignItems: "stretch",
          }}
        >
          <div
            className="w-[1040px] max-w-[96vw] h-screen max-h-screen overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 bg-[#0D0D0D] border-l border-[#F7F3EE]/15 text-[#F7F3EE]"
            onMouseDown={(event) => event.stopPropagation()}
            role="document"
          >
            <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#F7F3EE]/10">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold tracking-[0.18em] text-[#C9943A] uppercase mb-1 font-dmsans">
                    Feedback Category
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold font-clash leading-tight text-[#F7F3EE] truncate">
                    {feedbackModal.t}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm font-inter leading-relaxed max-w-2xl text-[#F7F3EE]/62">
                    Review every member submission in this category, identify repeated issues, and send a targeted app notification to one member or the whole category.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeFeedbackModal}
                  disabled={feedbackActionSaving}
                  className="w-10 h-10 rounded-full bg-[#F7F3EE]/8 border border-[#F7F3EE]/10 text-xl transition-colors cursor-pointer text-[#F7F3EE]/55 hover:text-[#F7F3EE] hover:bg-[#F7F3EE]/12 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Close drawer"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                {[
                  ["Responses", feedbackRows.length],
                  ["Members", feedbackRowStats.uniqueUsers],
                  ["Avg rating", Number(feedbackModal.averageRating || 0).toFixed(1)],
                  ["Replied", feedbackRowStats.replied],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#0D2B45] border border-[#F7F3EE]/10 px-3.5 py-3">
                    <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#F7F3EE]/38">{label}</div>
                    <div className="mt-1 text-xl font-bold font-mono text-[#F7F3EE]">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[430px_minmax(0,1fr)] overflow-hidden">
              <aside className="min-h-0 border-r border-[#F7F3EE]/10 bg-[#07131E] flex flex-col">
                <div className="p-5 border-b border-[#F7F3EE]/10">
                  <label className="block text-[10px] font-bold tracking-[0.14em] uppercase text-[#F7F3EE]/42 mb-2">
                    Search submissions
                  </label>
                  <input
                    value={feedbackSearch}
                    onChange={(event) => {
                      setFeedbackSearch(event.target.value);
                      setFeedbackPage(1);
                    }}
                    placeholder="Name, email, country, message..."
                    className="w-full h-11 rounded-xl border border-[#F7F3EE]/12 bg-[#0D2B45] px-3.5 text-sm text-[#F7F3EE] placeholder:text-[#F7F3EE]/35 outline-none focus:border-[#C9943A]/70"
                  />
                  <div className="flex gap-2 mt-3">
                    {[
                      ["all", `All ${feedbackRows.length}`],
                      ["open", `Open ${feedbackRowStats.open}`],
                      ["replied", `Replied ${feedbackRowStats.replied}`],
                    ].map(([key, label]) => {
                      const active = feedbackFilter === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setFeedbackFilter(key);
                            setFeedbackPage(1);
                          }}
                          className={`h-9 px-3 rounded-lg border text-xs font-bold transition-colors ${
                            active
                              ? "bg-[#C9943A] border-[#C9943A] text-[#0D0D0D]"
                              : "bg-transparent border-[#F7F3EE]/14 text-[#F7F3EE]/70 hover:border-[#C9943A]/60"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-3">
                  {pagedFeedbackRows.map((item) => {
                    const selected = selectedFeedbackItem?.id === item.id;
                    const hasReply = Boolean(String(item.adminReply || "").trim());
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedFeedbackItemId(item.id);
                          setFeedbackReply(`Thanks for your feedback about ${feedbackModal.t}. We read your note and will use it to improve the beta experience.`);
                        }}
                        className={`w-full min-h-[118px] text-left rounded-xl border p-3.5 mb-2.5 transition-colors overflow-hidden ${
                          selected
                            ? "border-[#C9943A] bg-[#C9943A]/12"
                            : "border-[#F7F3EE]/10 bg-[#0D2B45]/72 hover:border-[#F7F3EE]/24"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-[#F7F3EE] truncate">
                              {item.userName || item.userEmail || "Member"}
                            </div>
                            <div className="mt-0.5 text-[10px] font-mono text-[#F7F3EE]/42 truncate">
                              {[item.userEmail, item.country].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] font-bold font-mono text-[#C9943A]">★ {item.rating || 0}</span>
                            <span className={`h-5 max-w-[74px] px-2 rounded-full text-[9px] font-bold tracking-[0.08em] uppercase flex items-center truncate ${
                              hasReply ? "bg-[#1A7A4A]/22 text-[#5FC48E]" : "bg-[#C9943A]/14 text-[#C9943A]"
                            }`}>
                              {hasReply ? "replied" : "open"}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-[#F7F3EE]/68 line-clamp-2">
                          {item.message || "No message text available."}
                        </p>
                        <div className="mt-2 text-[10px] font-mono text-[#F7F3EE]/38 truncate">
                          {feedbackPayLabel(item.wouldPay)}
                        </div>
                      </button>
                    );
                  })}
                  {filteredFeedbackRows.length === 0 && (
                    <div className="rounded-xl border border-[#F7F3EE]/10 bg-[#0D2B45]/70 p-5 text-sm leading-relaxed text-[#F7F3EE]/58">
                      No feedback matches this search or filter.
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-[#F7F3EE]/10 bg-[#07131E] px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 text-[10px] font-mono text-[#F7F3EE]/45 truncate">
                    {filteredFeedbackRows.length
                      ? `Showing ${feedbackListStart}-${feedbackListEnd} of ${filteredFeedbackRows.length}`
                      : "No submissions"}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={safeFeedbackPage <= 1}
                      onClick={() => setFeedbackPage((page) => Math.max(1, page - 1))}
                      className="h-8 px-3 rounded-lg border border-[#F7F3EE]/14 text-xs font-bold text-[#F7F3EE]/70 disabled:opacity-35 disabled:cursor-not-allowed hover:border-[#C9943A]/60"
                    >
                      Prev
                    </button>
                    <span className="w-12 text-center text-[10px] font-mono text-[#F7F3EE]/45">
                      {safeFeedbackPage}/{feedbackTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safeFeedbackPage >= feedbackTotalPages}
                      onClick={() => setFeedbackPage((page) => Math.min(feedbackTotalPages, page + 1))}
                      className="h-8 px-3 rounded-lg border border-[#F7F3EE]/14 text-xs font-bold text-[#F7F3EE]/70 disabled:opacity-35 disabled:cursor-not-allowed hover:border-[#C9943A]/60"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </aside>

              <main className="min-h-0 flex flex-col bg-[#0D0D0D]">
                <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
                  <div className="rounded-2xl bg-[#0D2B45] border border-[#F7F3EE]/10 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#C9943A] mb-1">
                          Selected feedback
                        </div>
                        <h3 className="text-xl font-semibold font-clash text-[#F7F3EE] truncate">
                          {selectedFeedbackItem?.userName || selectedFeedbackItem?.userEmail || "No member selected"}
                        </h3>
                        <div className="mt-1 text-xs font-mono text-[#F7F3EE]/45 truncate">
                          {[selectedFeedbackItem?.userEmail, selectedFeedbackItem?.country, feedbackPayLabel(selectedFeedbackItem?.wouldPay)].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-bold font-mono text-[#C9943A]">★ {selectedFeedbackItem?.rating || 0}</div>
                        <div className="mt-1 text-[10px] font-bold tracking-[0.12em] uppercase text-[#F7F3EE]/42">
                          rating
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl bg-[#07131E]/70 border border-[#F7F3EE]/10 p-4">
                      <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#F7F3EE]/42 mb-2">
                        Member message
                      </div>
                      <p className="m-0 max-h-[220px] overflow-y-auto text-sm leading-relaxed text-[#F7F3EE]/84 whitespace-pre-wrap break-words pr-1">
                        {selectedFeedbackItem?.message || "Select a feedback row to see the member message."}
                      </p>
                    </div>

                    {selectedFeedbackItem?.adminReply ? (
                      <div className="mt-3 rounded-xl bg-[#1A7A4A]/12 border border-[#5FC48E]/25 p-4">
                        <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#5FC48E] mb-2">
                          Previous admin reply
                        </div>
                        <p className="m-0 max-h-[160px] overflow-y-auto text-sm leading-relaxed text-[#F7F3EE]/78 whitespace-pre-wrap break-words pr-1">
                          {selectedFeedbackItem.adminReply}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="rounded-xl bg-[#07131E]/70 border border-[#F7F3EE]/10 p-3">
                        <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#F7F3EE]/38">Category</div>
                        <div className="mt-1 text-sm font-bold text-[#F7F3EE]">{feedbackModal.t}</div>
                      </div>
                      <div className="rounded-xl bg-[#07131E]/70 border border-[#F7F3EE]/10 p-3">
                        <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#F7F3EE]/38">Payment answer</div>
                        <div className="mt-1 text-sm font-bold text-[#F7F3EE]">{feedbackPayLabel(selectedFeedbackItem?.wouldPay).replace("Would pay: ", "")}</div>
                      </div>
                      <div className="rounded-xl bg-[#07131E]/70 border border-[#F7F3EE]/10 p-3">
                        <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-[#F7F3EE]/38">Status</div>
                        <div className="mt-1 text-sm font-bold text-[#F7F3EE]">{selectedFeedbackItem?.adminReply ? "Replied" : "Open"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#F7F3EE]/10 bg-[#07131E] p-5 sm:p-6">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#C9943A]">
                      App notification message
                    </label>
                    <span className="text-[10px] font-mono text-[#F7F3EE]/38">
                      {feedbackReply.trim().length}/2000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={feedbackReply}
                    onChange={(event) => setFeedbackReply(event.target.value)}
                    placeholder="Write the short reply members should see in the app..."
                    className="w-full min-h-[106px] resize-y rounded-xl border border-[#F7F3EE]/14 bg-[#0D2B45] px-4 py-3 text-sm leading-relaxed text-[#F7F3EE] placeholder:text-[#F7F3EE]/34 outline-none focus:border-[#C9943A]/70"
                  />
                  <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      disabled={feedbackActionSaving || feedbackReply.trim().length < 4 || !selectedFeedbackItem?.id}
                      onClick={() => submitFeedbackReply({ markResolved: false, replyAll: false })}
                      className="flex-1 h-12 bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer font-dmsans disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {feedbackActionSaving ? "Processing..." : `Notify ${selectedFeedbackItem?.userName || "selected"}`}
                    </button>
                    <button
                      type="button"
                      disabled={feedbackActionSaving || feedbackReply.trim().length < 4 || feedbackRows.length === 0}
                      onClick={() => submitFeedbackReply({ markResolved: false, replyAll: true })}
                      className="sm:w-48 h-12 border transition-colors cursor-pointer font-dmsans font-semibold text-sm rounded-xl border-[#F7F3EE]/20 hover:border-[#F7F3EE]/40 text-[#F7F3EE] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Notify category
                    </button>
                  </div>
                  <p className="mt-2 mb-0 text-[11px] leading-relaxed text-[#F7F3EE]/42">
                    Selected sends to one member. Category sends the same message to all {feedbackRows.length} submissions in {feedbackModal.t}.
                  </p>
                </div>
              </main>
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
