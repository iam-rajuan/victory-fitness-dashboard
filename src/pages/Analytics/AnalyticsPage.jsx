import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Select } from "antd";
import { FaDumbbell, FaTrophy, FaUserPlus, FaUsers } from "react-icons/fa";
import {
  MdCardMembership,
  MdRestaurantMenu,
  MdPsychology,
  MdWhatshot,
  MdLeaderboard,
} from "react-icons/md";
import AnalyticsFilterBar from "../../components/shared/AnalyticsFilterBar";
import StatCard from "../../components/shared/StatCard";
import MiniBarChart from "../../components/shared/MiniBarChart";
import DonutTierChart from "../../components/analytics/DonutTierChart";
import CohortHeatmap from "../../components/analytics/CohortHeatmap";
import FunnelChart from "../../components/analytics/FunnelChart";
import MarketPanel from "../../components/analytics/MarketPanel";
import WinsFeed from "../../components/analytics/WinsFeed";
import { useAnalyticsFilter } from "../../context/AnalyticsFilterContext";
import {
  fetchAccountabilityStats,
  fetchChallengeStats,
  fetchHabitAdoption,
  fetchMarketBreakdown,
  fetchNutritionStats,
  fetchRetentionCohort,
  fetchRevenue,
  fetchTrialFunnel,
  fetchUserStats,
  fetchViralCoefficient,
  fetchWhatsappTracker,
  fetchWorkoutStats,
} from "../../../services/analytics.service";

/**
 * Custom hook that re-fetches whenever the filter changes.
 */
function useAnalyticsQuery(fetcher, refreshKey = "") {
  const filter = useAnalyticsFilter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetcher({ ...filter, signal: ac.signal })
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.preset, filter.market, filter.from, filter.to, refreshKey]);

  return { data, loading, error };
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-surface-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-surface-500">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SectionError({ error }) {
  if (!error) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {error}
    </div>
  );
}

const money = (v, currency = "EUR") =>
  typeof v === "number"
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(v)
    : "—";

const COUNTRY_OPTIONS = [
  { value: "Afghanistan", label: "Afghanistan" },
  { value: "Albania", label: "Albania" },
  { value: "Algeria", label: "Algeria" },
  { value: "Andorra", label: "Andorra" },
  { value: "Angola", label: "Angola" },
  { value: "Argentina", label: "Argentina" },
  { value: "Armenia", label: "Armenia" },
  { value: "Australia", label: "Australia" },
  { value: "Austria", label: "Austria" },
  { value: "Azerbaijan", label: "Azerbaijan" },
  { value: "Bahamas", label: "Bahamas" },
  { value: "Bahrain", label: "Bahrain" },
  { value: "Bangladesh", label: "Bangladesh" },
  { value: "Barbados", label: "Barbados" },
  { value: "Belgium", label: "Belgium" },
  { value: "Belize", label: "Belize" },
  { value: "Benin", label: "Benin" },
  { value: "Bhutan", label: "Bhutan" },
  { value: "Bolivia", label: "Bolivia" },
  { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina" },
  { value: "Botswana", label: "Botswana" },
  { value: "Brazil", label: "Brazil" },
  { value: "Brunei", label: "Brunei" },
  { value: "Bulgaria", label: "Bulgaria" },
  { value: "Burkina Faso", label: "Burkina Faso" },
  { value: "Burundi", label: "Burundi" },
  { value: "Cambodia", label: "Cambodia" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "Canada", label: "Canada" },
  { value: "Cape Verde", label: "Cape Verde" },
  { value: "Chile", label: "Chile" },
  { value: "China", label: "China" },
  { value: "Colombia", label: "Colombia" },
  { value: "Costa Rica", label: "Costa Rica" },
  { value: "Croatia", label: "Croatia" },
  { value: "Cuba", label: "Cuba" },
  { value: "Cyprus", label: "Cyprus" },
  { value: "Czech Republic", label: "Czech Republic" },
  { value: "Denmark", label: "Denmark" },
  { value: "Djibouti", label: "Djibouti" },
  { value: "Dominica", label: "Dominica" },
  { value: "Dominican Republic", label: "Dominican Republic" },
  { value: "Ecuador", label: "Ecuador" },
  { value: "Egypt", label: "Egypt" },
  { value: "El Salvador", label: "El Salvador" },
  { value: "Estonia", label: "Estonia" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Fiji", label: "Fiji" },
  { value: "Finland", label: "Finland" },
  { value: "France", label: "France" },
  { value: "Georgia", label: "Georgia" },
  { value: "Greece", label: "Greece" },
  { value: "Guatemala", label: "Guatemala" },
  { value: "Honduras", label: "Honduras" },
  { value: "Hungary", label: "Hungary" },
  { value: "Iceland", label: "Iceland" },
  { value: "Indonesia", label: "Indonesia" },
  { value: "Iran", label: "Iran" },
  { value: "Iraq", label: "Iraq" },
  { value: "Ireland", label: "Ireland" },
  { value: "Israel", label: "Israel" },
  { value: "Italy", label: "Italy" },
  { value: "Jamaica", label: "Jamaica" },
  { value: "Japan", label: "Japan" },
  { value: "Jordan", label: "Jordan" },
  { value: "Kazakhstan", label: "Kazakhstan" },
  { value: "Kenya", label: "Kenya" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Latvia", label: "Latvia" },
  { value: "Lebanon", label: "Lebanon" },
  { value: "Libya", label: "Libya" },
  { value: "Liechtenstein", label: "Liechtenstein" },
  { value: "Lithuania", label: "Lithuania" },
  { value: "Luxembourg", label: "Luxembourg" },
  { value: "Macedonia", label: "Macedonia" },
  { value: "Madagascar", label: "Madagascar" },
  { value: "Malaysia", label: "Malaysia" },
  { value: "Maldives", label: "Maldives" },
  { value: "Malta", label: "Malta" },
  { value: "Mexico", label: "Mexico" },
  { value: "Moldova", label: "Moldova" },
  { value: "Monaco", label: "Monaco" },
  { value: "Mongolia", label: "Mongolia" },
  { value: "Montenegro", label: "Montenegro" },
  { value: "Morocco", label: "Morocco" },
  { value: "Nepal", label: "Nepal" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "New Zealand", label: "New Zealand" },
  { value: "Nicaragua", label: "Nicaragua" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Norway", label: "Norway" },
  { value: "Oman", label: "Oman" },
  { value: "Pakistan", label: "Pakistan" },
  { value: "Panama", label: "Panama" },
  { value: "Paraguay", label: "Paraguay" },
  { value: "Peru", label: "Peru" },
  { value: "Philippines", label: "Philippines" },
  { value: "Poland", label: "Poland" },
  { value: "Portugal", label: "Portugal" },
  { value: "Qatar", label: "Qatar" },
  { value: "Romania", label: "Romania" },
  { value: "Russia", label: "Russia" },
  { value: "Rwanda", label: "Rwanda" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "Senegal", label: "Senegal" },
  { value: "Serbia", label: "Serbia" },
  { value: "Singapore", label: "Singapore" },
  { value: "Slovakia", label: "Slovakia" },
  { value: "Slovenia", label: "Slovenia" },
  { value: "Somalia", label: "Somalia" },
  { value: "South Africa", label: "South Africa" },
  { value: "South Korea", label: "South Korea" },
  { value: "Spain", label: "Spain" },
  { value: "Sri Lanka", label: "Sri Lanka" },
  { value: "Sudan", label: "Sudan" },
  { value: "Sweden", label: "Sweden" },
  { value: "Switzerland", label: "Switzerland" },
  { value: "Syria", label: "Syria" },
  { value: "Taiwan", label: "Taiwan" },
  { value: "Tajikistan", label: "Tajikistan" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Thailand", label: "Thailand" },
  { value: "Tunisia", label: "Tunisia" },
  { value: "Turkey", label: "Turkey" },
  { value: "Uganda", label: "Uganda" },
  { value: "Ukraine", label: "Ukraine" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "United States", label: "United States" },
  { value: "Uruguay", label: "Uruguay" },
  { value: "Uzbekistan", label: "Uzbekistan" },
  { value: "Venezuela", label: "Venezuela" },
  { value: "Vietnam", label: "Vietnam" },
  { value: "Yemen", label: "Yemen" },
  { value: "Zambia", label: "Zambia" },
  { value: "Zimbabwe", label: "Zimbabwe" }
];

export default function AnalyticsPage() {
  const [revenueGranularity, setRevenueGranularity] = useState("daily");
  const userStats = useAnalyticsQuery(fetchUserStats);
  const workoutStats = useAnalyticsQuery(fetchWorkoutStats);
  const challengeStats = useAnalyticsQuery(fetchChallengeStats);
  const nutritionStats = useAnalyticsQuery(fetchNutritionStats);
  const revenueStats = useAnalyticsQuery(
    (params) => fetchRevenue({ ...params, granularity: revenueGranularity }),
    revenueGranularity,
  );
  const accountability = useAnalyticsQuery(fetchAccountabilityStats);
  const habit = useAnalyticsQuery(fetchHabitAdoption);
  const funnel = useAnalyticsQuery(fetchTrialFunnel);
  const viral = useAnalyticsQuery(fetchViralCoefficient);
  const whatsapp = useAnalyticsQuery(fetchWhatsappTracker);

  const cohort = useAnalyticsQuery(fetchRetentionCohort);
  
  const filter = useAnalyticsFilter();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [marketBreakdown, setMarketBreakdown] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    setMarketBreakdown((prev) => ({ ...prev, loading: true, error: null }));
    
    fetchMarketBreakdown({
      preset: filter.preset,
      from: filter.from,
      to: filter.to,
      country: selectedCountry || undefined,
      signal: ac.signal,
    })
      .then((res) => {
        if (!cancelled) {
          setMarketBreakdown({ data: res, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMarketBreakdown({ data: null, loading: false, error: err.message || "Failed to load" });
        }
      });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [filter.preset, filter.from, filter.to, selectedCountry]);

  return (
    <div className="space-y-6" id="intelligence-dashboard">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-brand-900 px-6 py-7 text-white shadow-xl border border-brand-500/30 sm:px-8 sm:py-8">
        {/* Decorative background glow effects for visual depth */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand-400/30 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-400"></span>
            </span>
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent-200 backdrop-blur-md border border-white/20 shadow-xs">
              Live intelligence layer
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
            Intelligence &amp; Marketing Dashboard
          </h1>

          <p className="mt-2.5 max-w-3xl text-sm font-medium text-brand-100 sm:text-base leading-relaxed">
            Product engagement, retention, revenue, and organic growth in one
            decision view. Every section follows the filters below.
          </p>
        </div>
      </header>
      <AnalyticsFilterBar />

      {/* =================== 18.9 Marketing widgets (always visible) =================== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard
          title="Trial Funnel"
          subtitle={
            funnel.data?.largestDropOff
              ? `Biggest drop-off: ${funnel.data.largestDropOff}`
              : "Drop-off between each step"
          }
          action={<span id="trial-funnel" />}
        >
          <SectionError error={funnel.error} />
          <FunnelChart steps={funnel.data?.steps || []} />
        </SectionCard>

        <SectionCard
          title="Viral Coefficient"
          subtitle={viral.data?.sublabel || "Rolling 30 days"}
        >
          <SectionError error={viral.error} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p
                className={`text-5xl font-extrabold tabular-nums ${
                  viral.data?.color === "green"
                    ? "text-accent-600"
                    : viral.data?.color === "amber"
                    ? "text-warm-600"
                    : "text-danger-500"
                }`}
              >
                {viral.data?.current?.toFixed(2) ?? "—"}
              </p>
              <p className="mt-1 text-xs text-surface-500">
                {viral.data?.color === "green"
                  ? "Your community is growing itself. Save this number for investors."
                  : viral.data?.color === "amber"
                  ? "Almost there — optimise invite flow."
                  : "Below 0.5 — focus on invites & sharing."}
              </p>
            </div>
            <div className="w-full sm:w-1/2">
              <MiniBarChart
                data={viral.data?.sparkline || []}
                type="sparkline"
                color="accent"
                height={70}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="WhatsApp Share Tracker"
          subtitle="Organic growth heartbeat"
        >
          <SectionError error={whatsapp.error} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                Today
              </p>
              <p className="text-2xl font-bold tabular-nums text-surface-900">
                {whatsapp.data?.todayCount ?? 0}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                This week
              </p>
              <p className="text-2xl font-bold tabular-nums text-surface-900">
                {whatsapp.data?.thisWeekCount ?? 0}
              </p>
              <p className="text-[11px] font-semibold text-accent-600">
                {whatsapp.data?.thisWeekChangePct?.toFixed(1) ?? 0}% vs last
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                Market split
              </p>
              <p className="text-xs text-surface-700">
                🇬🇭 {whatsapp.data?.marketSplit?.ghana ?? 0} · 🇩🇪{" "}
                {whatsapp.data?.marketSplit?.germany ?? 0} · 🇮🇳{" "}
                {whatsapp.data?.marketSplit?.india ?? 0}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <MiniBarChart
              data={whatsapp.data?.dailySeries || []}
              color="accent"
              height={140}
            />
          </div>
        </SectionCard>

        <SectionCard title="Daily Wins" subtitle="Real-time social proof">
          <WinsFeed />
        </SectionCard>
      </div>

      {/* =================== 18.2 User Statistics =================== */}
      <SectionCard title="User Statistics" subtitle="Acquisition, retention, and top performers">
        <SectionError error={userStats.error} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="Total registered"
            value={userStats.data?.totalRegistered?.toLocaleString() ?? 0}
            changePct={userStats.data?.totalRegisteredChangePct}
            tone="brand"
            icon={<FaUsers />}
            loading={userStats.loading}
          />
          <StatCard
            label="New users"
            value={userStats.data?.newUsers?.toLocaleString() ?? 0}
            changePct={userStats.data?.newUsersChangePct}
            tone="accent"
            icon={<FaUserPlus />}
            loading={userStats.loading}
          />
          <StatCard
            label="Active users"
            value={userStats.data?.activeUsers?.toLocaleString() ?? 0}
            changePct={userStats.data?.activeUsersChangePct}
            tone="accent"
            icon={<MdWhatshot />}
            loading={userStats.loading}
          />
          <StatCard
            label="Trial → paid"
            value={`${userStats.data?.trialConversionRate?.toFixed(1) ?? 0}%`}
            colorBand={userStats.data?.trialConversionColor}
            tone="warm"
            loading={userStats.loading}
          />
          <StatCard
            label="Churned"
            value={userStats.data?.churnedUsers?.toLocaleString() ?? 0}
            changePct={userStats.data?.churnedChangePct}
            tone="danger"
            loading={userStats.loading}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Users by tier
            </h3>
            <ul className="space-y-1.5">
              {(userStats.data?.usersByTier || []).map((t) => (
                <li key={t.tier} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: t.color || "#94a3b8" }}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm text-surface-700">{t.tier}</span>
                  <span className="text-sm font-semibold tabular-nums">{t.count}</span>
                </li>
              ))}
              {!userStats.data?.usersByTier?.length && !userStats.loading && (
                <li className="text-xs text-surface-400">No tier data yet.</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Top 10 users
            </h3>
            <ol className="space-y-1 text-sm">
              {(userStats.data?.top10Users || []).map((u) => (
                <li key={u.userId}>
                  <Link
                    to={`/user-details?userId=${encodeURIComponent(u.userId)}`}
                    className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1 py-1.5 transition hover:bg-brand-50"
                  >
                    <span className="text-xs font-bold text-surface-400">#{u.rank}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-surface-800">{u.name}</span>
                      <span className="block text-[10px] text-surface-500">{u.tier || "None"} · {u.workouts || 0} workouts</span>
                    </span>
                    <span className="font-semibold tabular-nums">{u.points} pts</span>
                  </Link>
                </li>
              ))}
              {!userStats.data?.top10Users?.length && !userStats.loading && (
                <li className="text-xs text-surface-400">
                  Award points to populate this leaderboard.
                </li>
              )}
            </ol>
          </div>
        </div>

      </SectionCard>

      {/* =================== 18.3 Workout Statistics =================== */}
      <SectionCard title="Workout Statistics" subtitle="Engagement & completion quality">
        <SectionError error={workoutStats.error} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Completed"
            value={workoutStats.data?.totalCompleted?.toLocaleString() ?? 0}
            changePct={workoutStats.data?.totalCompletedChangePct}
            tone="brand"
            icon={<FaDumbbell />}
            loading={workoutStats.loading}
          />
          <StatCard
            label="Completion rate"
            value={`${workoutStats.data?.completionRate?.toFixed(1) ?? 0}%`}
            colorBand={workoutStats.data?.completionRateColor}
            tone="accent"
            loading={workoutStats.loading}
          />
          <StatCard
            label="AI-generated workouts"
            value={workoutStats.data?.aiGeneratedWorkouts?.toLocaleString() ?? 0}
            tone="warm"
            loading={workoutStats.loading}
          />
        </div>

        {workoutStats.data?.topWorkout && (
          <div className="mt-4 rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50 to-accent-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              Top workout of the period
            </p>
            <p className="mt-1 text-lg font-bold text-surface-900">
              {workoutStats.data.topWorkout.title}
            </p>
            <p className="text-xs text-surface-600">
              {workoutStats.data.topWorkout.count} completions · avg{" "}
              {Math.round(workoutStats.data.topWorkout.avgDurationSeconds / 60)} min
            </p>
          </div>
        )}
      </SectionCard>

      {/* =================== 18.4 Challenge Statistics =================== */}
      <SectionCard title="Challenge Statistics" subtitle="Viral mechanics & A/B results">
        <SectionError error={challengeStats.error} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <StatCard
            label="Invites sent"
            value={challengeStats.data?.invitesSent?.toLocaleString() ?? 0}
            changePct={challengeStats.data?.invitesSentChangePct}
            tone="brand"
            icon={<FaTrophy />}
            loading={challengeStats.loading}
          />
          <StatCard
            label="Invite → register"
            value={`${challengeStats.data?.inviteConversionRate?.toFixed(1) ?? 0}%`}
            tone="accent"
            loading={challengeStats.loading}
          />
          <StatCard
            label="A/B variants"
            value={challengeStats.data?.abTestResult?.length ?? 0}
            tone="warm"
            sublabel={
              (challengeStats.data?.abTestResult || [])
                .map((v) => `${v.variant.toUpperCase()}: ${v.total ? ((v.acceptances / v.total) * 100).toFixed(1) : 0}%`)
                .join(" · ") || "No variants yet"
            }
            loading={challengeStats.loading}
          />
        </div>

        {challengeStats.data?.mostPopular && (
          <div className="mt-4 rounded-xl border border-warm-200 bg-warm-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-700">
              Most popular challenge
            </p>
            <p className="mt-1 text-lg font-bold text-surface-900">
              {challengeStats.data.mostPopular.title}
            </p>
            <p className="text-xs text-surface-600">
              {challengeStats.data.mostPopular.participants} participants ·{" "}
              {challengeStats.data.mostPopular.completionRate?.toFixed(1) ?? "—"}% completed
            </p>
          </div>
        )}

        {!!challengeStats.data?.topChallenges?.length && (
          <div className="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                  Top challenges
                </p>
                <p className="mt-1 text-xs text-surface-600">
                  Ranked by participant count for the selected filters.
                </p>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                Top {challengeStats.data.topChallenges.length}
              </span>
            </div>

            <div className="space-y-2">
              {challengeStats.data.topChallenges.map((challenge, index) => (
                <div
                  key={challenge.challengeId || `${challenge.title}-${index}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-surface-200 bg-white px-3 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-black text-white">
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-surface-900">
                      {challenge.title}
                    </p>
                    <p className="text-xs text-surface-500">
                      {challenge.category || "Challenge"} · {challenge.participants} participants
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-surface-900">
                      {challenge.completionRate?.toFixed(1) ?? "—"}%
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-surface-400">
                      completed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* =================== 18.5 Nutrition =================== */}
      <SectionCard title="Nutrition Statistics" subtitle="AI plans and adherence">
        <SectionError error={nutritionStats.error} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            label="AI meal plans generated"
            value={nutritionStats.data?.aiMealPlans?.toLocaleString() ?? 0}
            changePct={nutritionStats.data?.aiMealPlansChangePct}
            tone="accent"
            icon={<MdRestaurantMenu />}
            loading={nutritionStats.loading}
          />
          <StatCard
            label="Protein target hit"
            value={`${nutritionStats.data?.proteinTargetHitRate?.toFixed(1) ?? 0}%`}
            tone="warm"
            loading={nutritionStats.loading}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["Ghana", "Germany", "India"].map((m) => {
            const food = nutritionStats.data?.mostLoggedByMarket?.[m];
            return (
              <div
                key={m}
                className="rounded-xl border border-surface-200 bg-surface-50 p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                  Top food in {m}
                </p>
                <p className="mt-1 text-base font-bold text-surface-900">
                  {food?.foodName ?? "—"}
                </p>
                <p className="text-xs text-surface-500">
                  {food ? `${food.count} logs` : "Awaiting data"}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* =================== 18.6 Revenue =================== */}
      <SectionCard
        title="Revenue Statistics"
        subtitle="MRR, ARPU, and trend"
        action={
          <div className="inline-flex rounded-lg border border-surface-200 bg-surface-50 p-1">
            {["daily", "weekly", "monthly"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRevenueGranularity(option)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                  revenueGranularity === option
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-surface-500 hover:text-surface-800"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        }
      >
        <SectionError error={revenueStats.error} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="MRR (EUR)"
            value={money(revenueStats.data?.mrr?.eur, "EUR")}
            tone="brand"
            icon={<MdCardMembership />}
            loading={revenueStats.loading}
          />
          <StatCard
            label="MRR (GHS)"
            value={money(revenueStats.data?.mrr?.ghs, "GHS")}
            tone="warm"
            loading={revenueStats.loading}
          />
          <StatCard
            label="MRR (INR)"
            value={money(revenueStats.data?.mrr?.inr, "INR")}
            tone="accent"
            loading={revenueStats.loading}
          />
          <StatCard
            label="ARPU"
            value={money(revenueStats.data?.arpu, "EUR")}
            tone="accent"
            loading={revenueStats.loading}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Revenue by tier
            </h3>
            <DonutTierChart data={revenueStats.data?.revenueByTier || []} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">
              MRR trend ({revenueStats.data?.trendGranularity || "weekly"})
            </h3>
            <MiniBarChart
              data={revenueStats.data?.mrrTrend || []}
              color="brand"
              height={220}
              tooltipFormatter={(v) =>
                new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                }).format(Number(v))
              }
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { market: "GH", label: "Ghana revenue", currency: "GHS" },
            { market: "DE", label: "Germany revenue", currency: "EUR" },
            { market: "IN", label: "India revenue", currency: "INR" },
          ].map((item) => {
            const revenue = (revenueStats.data?.revenueByMarket || []).find(
              (row) => row.market === item.market,
            );
            return (
              <div
                key={item.market}
                className="rounded-xl border border-surface-200 bg-surface-50 p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-surface-900">
                  {money(revenue?.amount ?? 0, item.currency)}
                </p>
                <p className="text-[11px] text-surface-500">Selected period</p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* =================== 18.7 Accountability Adoption =================== */}
      <SectionCard
        title="Accountability Adoption"
        subtitle="New active accountability pairs"
      >
        <SectionError error={accountability.error} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            label="New pairs"
            value={accountability.data?.newAccountabilityPairs?.toLocaleString() ?? 0}
            changePct={accountability.data?.newPairsChangePct}
            tone="warm"
            loading={accountability.loading}
          />
        </div>
      </SectionCard>

      {/* =================== 18.8 Habit Engine =================== */}
      <SectionCard
        title="Habit Engine Adoption"
        subtitle="Gold-tier personalisation metrics"
      >
        <SectionError error={habit.error} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Identity statement"
            value={habit.data?.identityStatementSet?.toLocaleString() ?? 0}
            sublabel={`${habit.data?.identityStatementPct?.toFixed(1) ?? 0}% of eligible`}
            tone="brand"
            icon={<MdPsychology />}
            loading={habit.loading}
          />
          <StatCard
            label="Workout unlock"
            value={habit.data?.workoutUnlockSet?.toLocaleString() ?? 0}
            sublabel={`${habit.data?.workoutUnlockPct?.toFixed(1) ?? 0}% of eligible`}
            tone="accent"
            icon={<FaDumbbell />}
            loading={habit.loading}
          />
          <StatCard
            label="If-then trigger"
            value={habit.data?.ifThenTriggerSet?.toLocaleString() ?? 0}
            sublabel={`${habit.data?.ifThenTriggerPct?.toFixed(1) ?? 0}% of eligible`}
            tone="warm"
            icon={<MdLeaderboard />}
            loading={habit.loading}
          />
        </div>

        {habit.data?.retentionComparison && (
          <div className="mt-4 rounded-xl border border-accent-200 bg-accent-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-700">
              30-day retention comparison
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-surface-600">Habit users</p>
                <p className="text-xl font-bold tabular-nums text-accent-700">
                  {habit.data.retentionComparison.habitRetainedPct?.toFixed(1) ?? "—"}%
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-600">Non-habit users</p>
                <p className="text-xl font-bold tabular-nums text-surface-700">
                  {habit.data.retentionComparison.nonHabitRetainedPct?.toFixed(1) ?? "—"}%
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* =================== 18.10 Retention Cohort =================== */}
      <SectionCard
        title="Retention Cohort Table"
        subtitle="Day-7 retention > 45% for 4 weeks = scale marketing"
      >
        <SectionError error={cohort.error} />
        <CohortHeatmap
          cohorts={cohort.data?.cohorts || []}
          loading={cohort.loading}
        />
      </SectionCard>

      {/* =================== 18.11 Market Breakdown =================== */}
      <SectionCard
        title="Market Breakdown"
        subtitle="30-second decision tool for marketing budget"
        action={
          <Select
            placeholder="Compare another country"
            value={selectedCountry}
            onChange={setSelectedCountry}
            options={COUNTRY_OPTIONS.filter(c => c.value !== "Ghana" && c.value !== "Germany" && c.value !== "India")}
            allowClear
            showSearch
            style={{ width: 220 }}
            optionFilterProp="label"
          />
        }
      >
        <SectionError error={marketBreakdown.error} />
        <MarketPanel
          markets={marketBreakdown.data?.markets || []}
          loading={marketBreakdown.loading}
        />
      </SectionCard>
    </div>
  );
}
