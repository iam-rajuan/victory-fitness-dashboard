import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiGlobe,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { getPhaseOneBetaSummary } from "../../../services/admin-trial.service";
import DetailModal from "../../components/dashboard/DetailModal";
import { formatDisplayDate, formatDisplayDateTime, formatEnumLabel } from "../../utils/dashboardFormatters";

const EMPTY_DATA = {
  totalBetaUsers: 0,
  activeBetaUsers: 0,
  expiredBetaUsers: 0,
  goldBetaUsers: 0,
  limit: 300,
  remainingSlots: 0,
  averageDaysRemaining: 0,
  countriesRepresented: 0,
  participation: {
    enrollmentProgressPct: 0,
    activeRatePct: 0,
    expiredRatePct: 0,
    neverActiveUsers: 0,
    usersActiveToday: 0,
    usersActiveThisWeek: 0,
  },
  featureAdoption: {
    aiCoach: {},
    nutrition: {},
    workouts: {},
    challenges: {},
    community: {},
  },
  crossFeatureAdoption: {},
  checkpoints: [],
  campaignHealth: {},
  support: {},
  countries: [],
  users: [],
};

const CHECKPOINT_CONTENT = {
  1: { title: "Initial Activity", note: "The first signs of activation after enrollment." },
  2: { title: "Early Follow-Through", note: "The first repeat touchpoints after sign-up." },
  3: { title: "Early Engagement", note: "Early usage patterns during the opening beta window." },
  4: { title: "Momentum Check", note: "Short-term engagement after the first activation phase." },
  5: { title: "Early Retention", note: "Whether usage is continuing across the opening stretch." },
  6: { title: "Progress Check", note: "Steady feature usage before the first full week closes." },
  7: { title: "First Week", note: "The first sustained week of product usage." },
  8: { title: "Week Two Start", note: "The start of the second-week testing window." },
  9: { title: "Repeat Usage", note: "Whether testers are coming back for another session." },
  10: { title: "Habit Building", note: "Mid-cycle signs of repeated product behavior." },
  11: { title: "Engagement Check", note: "Program engagement after the midpoint begins to form." },
  12: { title: "Usage Continuity", note: "Ongoing feature usage heading into the middle stretch." },
  13: { title: "Mid-Program Review", note: "A daily checkpoint before the two-week mark." },
  14: { title: "Continued Usage", note: "Mid-program engagement and repeat behavior." },
  15: { title: "Late-Cycle Start", note: "The start of the final week of testing." },
  16: { title: "Return Activity", note: "Whether testers are still returning late in the window." },
  17: { title: "Late Engagement", note: "Daily product usage after the main testing period settles." },
  18: { title: "Sustained Interest", note: "Longer-window engagement approaching completion." },
  19: { title: "Completion Runway", note: "Usage nearing the final days of access." },
  20: { title: "Final Stretch", note: "The last full day before the beta completion point." },
  21: { title: "Beta Completion", note: "The full testing window through entitlement expiry." },
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function StatusPill({ status, label }) {
  const config = {
    done: "border-[#1A7A4A]/20 bg-[#1A7A4A]/10 text-[#1A7A4A]",
    attention: "border-[#C9943A]/25 bg-[#C9943A]/10 text-[#8a611d]",
    neutral: "border-[#0D2B45]/10 bg-[#F7F3EE] text-[#0D2B45]",
    inactive: "border-slate-200 bg-slate-100 text-slate-600",
  }[status] || "border-[#0D2B45]/10 bg-[#F7F3EE] text-[#0D2B45]";

  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide", config)}>
      {label || status}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, caption, tone = "navy" }) {
  const toneMap = {
    navy: "bg-[#0D2B45] text-white",
    gold: "bg-[#C9943A] text-[#0D0D0D]",
    green: "bg-[#1A7A4A] text-white",
    ivory: "bg-[#F7F3EE] text-[#0D2B45] border border-[#0D2B45]/10",
    danger: "bg-rose-600 text-white",
  };

  return (
    <div className={cx("rounded-lg p-4 shadow-sm", toneMap[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-black tabular-nums">{value}</p>
        </div>
        {Icon ? <Icon className="h-5 w-5 opacity-75" /> : null}
      </div>
      {caption ? <p className="mt-3 text-xs leading-relaxed opacity-80">{caption}</p> : null}
    </div>
  );
}

function SectionShell({ title, eyebrow, children, action }) {
  return (
    <section className="rounded-lg border border-[#0D2B45]/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B5651D]">{eyebrow}</p> : null}
          <h2 className="mt-1 text-lg font-black text-[#0D2B45]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CompactEmptyState({ title, body }) {
  return (
    <div className="rounded-md border border-dashed border-[#0D2B45]/15 bg-[#F7F3EE] px-4 py-5 text-center">
      <h3 className="text-sm font-black text-[#0D2B45]">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function getCountryOptions(countries) {
  return [
    { value: "ALL", label: "All Countries" },
    ...(Array.isArray(countries)
      ? countries.map((item) => ({
          value: item.code || item.label,
          label: item.code ? `${item.label} (${item.code})` : item.label,
        }))
      : []),
  ];
}

function getFeatureLabel(value) {
  return {
    all: "All Features",
    ai: "AI Coach",
    nutrition: "Nutrition",
    workout: "Workouts",
    challenge: "Challenges",
    community: "Community",
    inactive: "No Feature Usage",
  }[value] || "All Features";
}

function getTimelineLabel(value) {
  return {
    all: "All Timelines",
    endingSoon: "0-2 Days Left",
    weekOne: "3-7 Days Left",
    later: "8+ Days Left",
    expired: "Expired",
  }[value] || "All Timelines";
}

function getUserStatusMeta(user) {
  const status = String(user.status || "").toUpperCase();
  if (status === "ACTIVE" && Number(user.daysRemaining || 0) <= 2) {
    return {
      label: "Active",
      helper: "Ending Soon",
      className: "bg-[#C9943A]/10 text-[#8a611d] border border-[#C9943A]/20",
      helperClassName: "bg-[#C9943A]/10 text-[#8a611d] border border-[#C9943A]/20",
    };
  }
  if (status === "ACTIVE") {
    return {
      label: "Active",
      helper: null,
      className: "bg-[#1A7A4A]/10 text-[#1A7A4A] border border-[#1A7A4A]/20",
      helperClassName: "",
    };
  }
  return {
    label: "Expired",
    helper: null,
    className: "bg-slate-100 text-slate-600 border border-slate-200",
    helperClassName: "",
  };
}

function featureMatch(user, feature) {
  const activity = user.activity || {};
  if (feature === "all") return true;
  if (feature === "inactive") return !activity.usedAnyTrackedFeature;
  if (feature === "ai") return activity.usedAiCoach;
  if (feature === "nutrition") return activity.usedNutrition;
  if (feature === "workout") return activity.usedWorkout;
  if (feature === "challenge") return activity.usedChallenge;
  if (feature === "community") return activity.usedCommunity;
  return true;
}

function timelineMatch(user, selectedWindow) {
  const status = String(user.status || "").toUpperCase();
  const daysRemaining = Number(user.daysRemaining || 0);
  if (selectedWindow === "all") return true;
  if (selectedWindow === "expired") return status === "EXPIRED";
  if (status !== "ACTIVE") return false;
  if (selectedWindow === "endingSoon") return daysRemaining >= 0 && daysRemaining <= 2;
  if (selectedWindow === "weekOne") return daysRemaining >= 3 && daysRemaining <= 7;
  if (selectedWindow === "later") return daysRemaining >= 8;
  return true;
}

function sortUsers(users, sortBy, sortDirection) {
  const multiplier = sortDirection === "asc" ? 1 : -1;
  const normalizeDate = (value) => {
    const parsed = value ? new Date(value).getTime() : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  return [...users].sort((left, right) => {
    let leftValue = 0;
    let rightValue = 0;
    switch (sortBy) {
      case "name":
        return multiplier * left.fullName.localeCompare(right.fullName);
      case "start":
        leftValue = normalizeDate(left.trialStartedAt);
        rightValue = normalizeDate(right.trialStartedAt);
        break;
      case "end":
        leftValue = normalizeDate(left.trialExpiresAt);
        rightValue = normalizeDate(right.trialExpiresAt);
        break;
      case "daysRemaining":
        leftValue = Number(left.daysRemaining || 0);
        rightValue = Number(right.daysRemaining || 0);
        break;
      case "lastActive":
        leftValue = normalizeDate(left.activity?.lastActiveAt);
        rightValue = normalizeDate(right.activity?.lastActiveAt);
        break;
      case "aiMessages":
        leftValue = Number(left.activity?.aiMessages || 0);
        rightValue = Number(right.activity?.aiMessages || 0);
        break;
      case "workoutsCompleted":
        leftValue = Number(left.activity?.workoutsCompleted || 0);
        rightValue = Number(right.activity?.workoutsCompleted || 0);
        break;
      default:
        leftValue = normalizeDate(left.trialStartedAt);
        rightValue = normalizeDate(right.trialStartedAt);
        break;
    }
    return multiplier * (leftValue - rightValue);
  });
}

function buildDetailSections(user) {
  const activity = user.activity || {};
  return [
    {
      key: "beta",
      eyebrow: "Phase 1",
      title: "21-Day Gold Beta Program",
      cards: [
        { label: "Beta Tester", value: "Yes" },
        { label: "Gold Access", value: "Gold" },
        { label: "Price", value: "€0" },
        { label: "Payment Required", value: user.paymentRequired ? "Yes" : "No" },
        { label: "Country", value: user.country || "N/A" },
        { label: "Status", value: formatEnumLabel(user.status) },
        { label: "Start Date", value: formatDisplayDateTime(user.trialStartedAt) },
        { label: "End Date", value: formatDisplayDateTime(user.trialExpiresAt) },
        { label: "Days Remaining", value: String(user.daysRemaining ?? 0) },
      ],
    },
    {
      key: "activity",
      eyebrow: "Usage",
      title: "Tracked Gold feature activity",
      cards: [
        { label: "AI Conversations", value: String(activity.aiConversations || 0) },
        { label: "AI Messages", value: String(activity.aiMessages || 0) },
        { label: "Meal Plans", value: String(activity.nutritionPlans || 0) },
        { label: "Meals Logged", value: String(activity.nutritionLogs || 0) },
        { label: "Workouts Started", value: String(activity.workoutsStarted || 0) },
        { label: "Workouts Completed", value: String(activity.workoutsCompleted || 0) },
        { label: "Challenges Joined", value: String(activity.challengesJoined || 0) },
        { label: "Challenges Completed", value: String(activity.challengesCompleted || 0) },
        { label: "Community Posts", value: String(activity.communityPosts || 0) },
        { label: "Community Comments", value: String(activity.communityComments || 0) },
        { label: "Community Reactions", value: String(activity.communityReactions || 0) },
        { label: "Last Feature Activity", value: formatDisplayDateTime(activity.lastActiveAt) },
      ],
    },
  ];
}

function LoadingCardGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 animate-pulse">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="h-32 rounded-lg border border-[#0D2B45]/10 bg-white" />
      ))}
    </div>
  );
}

export default function BetaAnalytics() {
  const [data, setData] = useState(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedFeature, setSelectedFeature] = useState("all");
  const [selectedTimeline, setSelectedTimeline] = useState("all");
  const [sortBy, setSortBy] = useState("start");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedUser, setSelectedUser] = useState(null);

  const loadAnalytics = async (signal) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getPhaseOneBetaSummary({ signal });
      setData({
        ...EMPTY_DATA,
        ...response,
        participation: { ...EMPTY_DATA.participation, ...(response?.participation || {}) },
        featureAdoption: { ...EMPTY_DATA.featureAdoption, ...(response?.featureAdoption || {}) },
        crossFeatureAdoption: { ...EMPTY_DATA.crossFeatureAdoption, ...(response?.crossFeatureAdoption || {}) },
        campaignHealth: { ...(response?.campaignHealth || {}) },
        support: { ...(response?.support || {}) },
        checkpoints: Array.isArray(response?.checkpoints) ? response.checkpoints : [],
        countries: Array.isArray(response?.countries) ? response.countries : [],
        users: Array.isArray(response?.users) ? response.users : [],
      });
    } catch (requestError) {
      if (signal?.aborted || requestError?.name === "AbortError" || requestError?.message === "signal is aborted without reason") {
        return;
      }
      setData(EMPTY_DATA);
      setError(requestError instanceof Error ? requestError.message : "Unable to load beta analytics.");
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadAnalytics(controller.signal);
    return () => controller.abort();
  }, []);

  const countryOptions = useMemo(() => getCountryOptions(data.countries), [data.countries]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const nextUsers = data.users.filter((user) => {
      const matchesSearch =
        !normalizedSearch
        || String(user.fullName || "").toLowerCase().includes(normalizedSearch)
        || String(user.email || "").toLowerCase().includes(normalizedSearch);
      const matchesCountry =
        selectedCountry === "ALL"
        || String(user.countryCode || "").toUpperCase() === selectedCountry
        || String(user.country || "") === selectedCountry;
      const matchesStatus = selectedStatus === "ALL" || String(user.status || "").toUpperCase() === selectedStatus;
      const matchesFeature = featureMatch(user, selectedFeature);
      const matchesTimeline = timelineMatch(user, selectedTimeline);
      return matchesSearch && matchesCountry && matchesStatus && matchesFeature && matchesTimeline;
    });
    return sortUsers(nextUsers, sortBy, sortDirection);
  }, [data.users, searchQuery, selectedCountry, selectedStatus, selectedFeature, selectedTimeline, sortBy, sortDirection]);

  const filteredSummary = useMemo(() => {
    const activeUsers = filteredUsers.filter((user) => String(user.status || "").toUpperCase() === "ACTIVE");
    const expiredUsers = filteredUsers.length - activeUsers.length;
    return {
      total: filteredUsers.length,
      active: activeUsers.length,
      expired: expiredUsers,
      averageDaysRemaining: activeUsers.length
        ? Math.round((activeUsers.reduce((total, user) => total + Number(user.daysRemaining || 0), 0) / activeUsers.length) * 10) / 10
        : 0,
    };
  }, [filteredUsers]);

  const featureBreakdown = useMemo(
    () =>
      data.users.reduce(
        (summary, user) => {
          const activity = user.activity || {};
          summary.ai.conversations += Number(activity.aiConversations || 0);
          summary.ai.messages += Number(activity.aiMessages || 0);
          summary.nutrition.plans += Number(activity.nutritionPlans || 0);
          summary.nutrition.logs += Number(activity.nutritionLogs || 0);
          summary.workouts.completed += Number(activity.workoutsCompleted || 0);
          summary.challenges.joined += Number(activity.challengesJoined || 0);
          summary.community.interactions +=
            Number(activity.communityPosts || 0)
            + Number(activity.communityComments || 0)
            + Number(activity.communityReactions || 0);
          return summary;
        },
        {
          ai: { conversations: 0, messages: 0 },
          nutrition: { plans: 0, logs: 0 },
          workouts: { completed: 0 },
          challenges: { joined: 0 },
          community: { interactions: 0 },
        },
      ),
    [data.users],
  );

  const checkpointCards = useMemo(() => {
    const checkpointMap = new Map((data.checkpoints || []).map((checkpoint) => [checkpoint.day, checkpoint]));
    return Array.from({ length: 21 }, (_, index) => index + 1).map((day) => ({
      day,
      meta: CHECKPOINT_CONTENT[day] || { title: `Day ${day}`, note: "Daily beta progress checkpoint." },
      values: checkpointMap.get(day) || {
        day,
        eligibleUsers: 0,
        activeUsers: 0,
        aiUsers: 0,
        nutritionUsers: 0,
        workoutUsers: 0,
        challengeUsers: 0,
        anyFeatureUsers: 0,
      },
    }));
  }, [data.checkpoints]);

  const featureCards = [
    {
      title: "AI Coach",
      users: data.featureAdoption.aiCoach?.users || 0,
      rows: [
        ["Conversations", featureBreakdown.ai.conversations],
        ["Messages", featureBreakdown.ai.messages],
      ],
    },
    {
      title: "Nutrition",
      users: data.featureAdoption.nutrition?.users || 0,
      rows: [
        ["Meal Plans", featureBreakdown.nutrition.plans],
        ["Meals Logged", featureBreakdown.nutrition.logs],
      ],
    },
    {
      title: "Workouts",
      users: data.featureAdoption.workouts?.users || 0,
      rows: [["Completed Workouts", featureBreakdown.workouts.completed]],
    },
    {
      title: "Challenges",
      users: data.featureAdoption.challenges?.users || 0,
      rows: [["Participation", featureBreakdown.challenges.joined]],
    },
    {
      title: "Community",
      users: data.featureAdoption.community?.users || 0,
      rows: [["Interactions", featureBreakdown.community.interactions]],
    },
  ];

  const crossFeatureCards = [
    ["AI + Nutrition", data.crossFeatureAdoption.aiAndNutrition || 0],
    ["AI + Workouts", data.crossFeatureAdoption.aiAndWorkout || 0],
    ["Nutrition + Workouts", data.crossFeatureAdoption.nutritionAndWorkout || 0],
    ["3+ Features Used", data.crossFeatureAdoption.usedThreePlusFeatures || 0],
    ["No Tracked Feature Usage", data.crossFeatureAdoption.usedNoTrackedFeature || 0],
  ];

  const entitlementRules = [
    "Gold access granted",
    "Access duration: 21 days",
    "Price: €0",
    "No payment required",
    "No card required",
    "No automatic subscription",
    "Access expires after 21 days",
  ];

  const launchStatus = error ? "attention" : "done";
  const hasUsers = data.totalBetaUsers > 0;

  return (
    <div className="min-h-screen space-y-6 bg-[#F7F3EE] pb-8 text-[#0D0D0D]">
      <header className="overflow-hidden rounded-lg bg-[#0D2B45] text-white shadow-xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.45fr_0.8fr] lg:p-8">
          <div>
            <p className="inline-flex rounded-full border border-[#C9943A]/40 bg-[#C9943A]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-[#F7F3EE]">
              Phase 1
            </p>
            <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight tracking-normal sm:text-4xl">21-Day Gold Beta</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#F7F3EE]/90 sm:text-base">21-Day Gold Beta Program</p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#F7F3EE]/80 sm:text-base">
              Monitor tester participation, Gold feature usage, engagement, and progress throughout the 21-day testing period.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["300 approved testers", "Gold access", "21-day window", "No payment required"].map((label) => (
                <span key={label} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#F7F3EE]">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9943A]">Program check</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Capacity", "300"],
                ["Access", "Gold"],
                ["Price", "€0"],
                ["Payments", "Disabled"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/10 px-3 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">{label}</p>
                  <p className="mt-2 text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm text-white/80">Analytics endpoint</span>
              <StatusPill status={launchStatus} label={error ? "Attention" : "Live"} />
            </div>
            {error ? <div className="mt-4 rounded-md bg-rose-500/15 p-3 text-xs text-rose-50">{error}</div> : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FiUsers} label="Enrolled" value={`${data.totalBetaUsers} / ${data.limit}`} caption="Approved testers currently enrolled in the program." tone="gold" />
        <MetricCard icon={FiCheckCircle} label="Active Testers" value={data.activeBetaUsers} caption="Testers still inside the 21-day beta access window." tone="navy" />
        <MetricCard icon={FiShield} label="Remaining Slots" value={data.remainingSlots} caption="Available capacity before the 300-tester limit is reached." tone="ivory" />
        <MetricCard icon={FiClock} label="Avg. Days Remaining" value={data.averageDaysRemaining} caption="Average time remaining across active testers." tone="green" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionShell title="Beta Access" eyebrow="program entitlement">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {entitlementRules.map((rule) => (
              <div key={rule} className="flex items-start gap-3 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] p-3">
                <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1A7A4A]" />
                <span className="text-sm font-semibold text-[#0D2B45]">{rule}</span>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          title="Program Overview"
          eyebrow="tester coverage"
          action={
            <button
              type="button"
              onClick={() => loadAnalytics()}
              className="inline-flex items-center gap-2 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] px-3 py-2 text-xs font-bold text-[#0D2B45] hover:bg-white"
            >
              <FiRefreshCw className={cx("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </button>
          }
        >
          {isLoading ? (
            <LoadingCardGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MetricCard icon={FiGlobe} label="Countries Represented" value={data.countriesRepresented} caption="Unique enrolled countries currently represented." tone="ivory" />
              <MetricCard icon={FiActivity} label="Active This Week" value={data.participation.usersActiveThisWeek} caption="Testers with tracked feature activity in the last 7 days." tone="ivory" />
              <MetricCard icon={FiUser} label="Never Active" value={data.participation.neverActiveUsers} caption="Enrolled testers with no tracked feature usage yet." tone="ivory" />
              <MetricCard icon={FiClock} label="Expired Testers" value={data.expiredBetaUsers} caption="Testers whose 21-day access period has ended." tone="ivory" />
            </div>
          )}
        </SectionShell>
      </div>

      <SectionShell title="21-Day Progress" eyebrow="checkpoint analytics">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {checkpointCards.map(({ day, meta, values }) => (
            <div key={day} className="rounded-lg border border-[#0D2B45]/10 bg-[#F7F3EE] p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B5651D]">Day {day}</p>
              <h3 className="mt-2 text-base font-black text-[#0D2B45]">{meta.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{meta.note}</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3"><span>Eligible Testers</span><span className="font-black text-[#0D2B45]">{values.eligibleUsers}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Active Testers</span><span className="font-black text-[#0D2B45]">{values.activeUsers}</span></div>
                <div className="flex items-center justify-between gap-3"><span>AI Coach Users</span><span className="font-black text-[#0D2B45]">{values.aiUsers}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Nutrition Users</span><span className="font-black text-[#0D2B45]">{values.nutritionUsers}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Workout Users</span><span className="font-black text-[#0D2B45]">{values.workoutUsers}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Challenge Users</span><span className="font-black text-[#0D2B45]">{values.challengeUsers}</span></div>
                <div className="flex items-center justify-between gap-3"><span>Any Feature Activity</span><span className="font-black text-[#0D2B45]">{values.anyFeatureUsers}</span></div>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell title="Gold Feature Adoption" eyebrow="product usage">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          {featureCards.map((card) => (
            <div key={card.title} className="rounded-lg border border-[#0D2B45]/10 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B5651D]">{card.title}</p>
                  <p className="mt-2 text-3xl font-black text-[#0D2B45]">{card.users}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Users</p>
                </div>
                <FiZap className="h-5 w-5 text-[#C9943A]" />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {card.rows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span>{label}</span>
                    <span className="font-black text-[#0D2B45]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.8fr]">
        <SectionShell title="Cross-Feature Engagement" eyebrow="combined behavior">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {crossFeatureCards.map(([label, value]) => (
              <div key={label} className="rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] px-4 py-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-[#0D2B45]">{value}</p>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell title="Beta Health" eyebrow="operational indicators">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] px-4 py-3">
              <span className="text-sm font-semibold text-[#0D2B45]">Ending Soon</span>
              <StatusPill status="attention" label={String(data.campaignHealth.endingSoonUsers || 0)} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] px-4 py-3">
              <span className="text-sm font-semibold text-[#0D2B45]">No Feature Activity</span>
              <StatusPill status="neutral" label={String(data.campaignHealth.zeroActivityUsers || 0)} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] px-4 py-3">
              <span className="text-sm font-semibold text-[#0D2B45]">Never Used AI Coach</span>
              <StatusPill status="neutral" label={String(data.campaignHealth.usersWithoutAiCoach || 0)} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] px-4 py-3">
              <span className="text-sm font-semibold text-[#0D2B45]">Never Used Nutrition</span>
              <StatusPill status="neutral" label={String(data.campaignHealth.usersWithoutNutrition || 0)} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] px-4 py-3">
              <span className="text-sm font-semibold text-[#0D2B45]">Expired Testers</span>
              <StatusPill status="inactive" label={String(data.expiredBetaUsers || 0)} />
            </div>
            <div className="rounded-md border border-[#0D2B45]/10 bg-white px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B5651D]">Support Reference</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Beta users with support messages</span>
                  <span className="font-black text-[#0D2B45]">{data.support.betaUsersWithMessages || 0}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Total support messages</span>
                  <span className="font-black text-[#0D2B45]">{data.support.totalSupportMessages || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </SectionShell>
      </div>

      <SectionShell title="Country Analytics" eyebrow="geographic distribution">
        {!data.countries.length ? (
          <CompactEmptyState title="No country data yet" body="Country distribution will appear as testers enroll." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#0D2B45]/10 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Country</th>
                  <th className="py-3 pr-4">Total Testers</th>
                  <th className="py-3 pr-4">Active Testers</th>
                  <th className="py-3 pr-4">AI Users</th>
                  <th className="py-3 pr-4">Nutrition Users</th>
                  <th className="py-3 pr-0">Workout Users</th>
                </tr>
              </thead>
              <tbody>
                {data.countries.map((country) => (
                  <tr key={`${country.code || country.label}`} className="border-b border-[#0D2B45]/5">
                    <td className="py-4 pr-4 font-semibold text-[#0D2B45]">
                      {country.label}
                      {country.code ? <span className="ml-2 text-xs text-slate-400">{country.code}</span> : null}
                    </td>
                    <td className="py-4 pr-4">{country.count}</td>
                    <td className="py-4 pr-4">{country.activeUsers}</td>
                    <td className="py-4 pr-4">{country.aiUsers}</td>
                    <td className="py-4 pr-4">{country.nutritionUsers}</td>
                    <td className="py-4 pr-0">{country.workoutUsers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionShell>

      <SectionShell
        title="Beta Testers"
        eyebrow="search and drilldown"
        action={(
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
            <label className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search name or email"
                className="w-full rounded-md border border-[#0D2B45]/15 bg-white py-2 pl-10 pr-4 text-sm text-[#0D2B45] outline-none focus:border-[#C9943A] lg:w-56"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <FiFilter className="h-4 w-4" />
                Filters
              </span>
              <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)} className="rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm text-[#0D2B45] outline-none focus:border-[#C9943A]">
                {countryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm text-[#0D2B45] outline-none focus:border-[#C9943A]">
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <select value={selectedFeature} onChange={(event) => setSelectedFeature(event.target.value)} className="rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm text-[#0D2B45] outline-none focus:border-[#C9943A]">
                {["all", "ai", "nutrition", "workout", "challenge", "community", "inactive"].map((value) => (
                  <option key={value} value={value}>{getFeatureLabel(value)}</option>
                ))}
              </select>
              <select value={selectedTimeline} onChange={(event) => setSelectedTimeline(event.target.value)} className="rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm text-[#0D2B45] outline-none focus:border-[#C9943A]">
                {["all", "endingSoon", "weekOne", "later", "expired"].map((value) => (
                  <option key={value} value={value}>{getTimelineLabel(value)}</option>
                ))}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm text-[#0D2B45] outline-none focus:border-[#C9943A]">
                <option value="start">Start Date</option>
                <option value="end">End Date</option>
                <option value="daysRemaining">Days Remaining</option>
                <option value="lastActive">Last Feature Activity</option>
                <option value="aiMessages">AI Usage</option>
                <option value="workoutsCompleted">Workout Count</option>
                <option value="name">Name</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                className="rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm font-semibold text-[#0D2B45]"
                aria-label="Toggle sort direction"
              >
                {sortDirection === "asc" ? "Ascending" : "Descending"}
              </button>
            </div>
          </div>
        )}
      >
        {!hasUsers ? (
          <CompactEmptyState title="No beta testers yet" body="Approved testers will appear here after enrollment." />
        ) : !filteredUsers.length ? (
          <CompactEmptyState title="No matching testers" body="Try adjusting the current search or filters." />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={FiUsers} label="Filtered Testers" value={filteredSummary.total} caption="Users matching the current search and filters." tone="ivory" />
              <MetricCard icon={FiCheckCircle} label="Filtered Active" value={filteredSummary.active} caption="Active testers in the current view." tone="green" />
              <MetricCard icon={FiClock} label="Filtered Expired" value={filteredSummary.expired} caption="Expired testers in the current view." tone="ivory" />
              <MetricCard icon={FiShield} label="Filtered Avg. Days" value={filteredSummary.averageDaysRemaining} caption="Average days remaining for active testers in view." tone="gold" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#0D2B45]/10 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Country</th>
                    <th className="py-3 pr-4">Start Date</th>
                    <th className="py-3 pr-4">End Date</th>
                    <th className="py-3 pr-4">Days Remaining</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Last Feature Activity</th>
                    <th className="py-3 pr-4">AI</th>
                    <th className="py-3 pr-4">Nutrition</th>
                    <th className="py-3 pr-4">Workouts</th>
                    <th className="py-3 pr-4">Challenges</th>
                    <th className="py-3 pr-0">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const statusMeta = getUserStatusMeta(user);
                    return (
                      <tr key={user.id} className="border-b border-[#0D2B45]/5">
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-[#0D2B45]">{user.fullName}</div>
                          <div className="mt-1 text-xs text-slate-500">{formatEnumLabel(user.trialType)}</div>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{user.email}</td>
                        <td className="py-4 pr-4 text-slate-600">
                          {user.country || "N/A"}
                          {user.countryCode ? <span className="ml-1 text-xs text-slate-400">({user.countryCode})</span> : null}
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{formatDisplayDate(user.trialStartedAt)}</td>
                        <td className="py-4 pr-4 text-slate-600">{formatDisplayDate(user.trialExpiresAt)}</td>
                        <td className="py-4 pr-4 font-semibold text-[#0D2B45]">{user.daysRemaining}</td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <span className={cx("inline-flex rounded-full px-3 py-1 text-xs font-bold", statusMeta.className)}>{statusMeta.label}</span>
                            {statusMeta.helper ? <span className={cx("inline-flex rounded-full px-3 py-1 text-xs font-bold", statusMeta.helperClassName)}>{statusMeta.helper}</span> : null}
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{formatDisplayDateTime(user.activity?.lastActiveAt)}</td>
                        <td className="py-4 pr-4 text-slate-600">{user.activity?.aiMessages || 0} msgs</td>
                        <td className="py-4 pr-4 text-slate-600">{user.activity?.nutritionLogs || 0} logs</td>
                        <td className="py-4 pr-4 text-slate-600">{user.activity?.workoutsCompleted || 0}</td>
                        <td className="py-4 pr-4 text-slate-600">{user.activity?.challengesJoined || 0}</td>
                        <td className="py-4 pr-0">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] px-3 py-2 text-sm font-bold text-[#0D2B45] hover:bg-white"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SectionShell>

      {selectedUser ? (
        <DetailModal
          title={selectedUser.fullName}
          subtitle="Phase 1 beta tester activity and access summary."
          sections={buildDetailSections(selectedUser)}
          onClose={() => setSelectedUser(null)}
        />
      ) : null}
    </div>
  );
}
