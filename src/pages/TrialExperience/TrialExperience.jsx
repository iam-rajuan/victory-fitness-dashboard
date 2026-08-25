import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiBarChart2,
  FiCheck,
  FiClock,
  FiEdit3,
  FiMail,
  FiMessageCircle,
  FiPlayCircle,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiToggleLeft,
  FiToggleRight,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import AnalyticsFilterBar from "../../components/shared/AnalyticsFilterBar";
import FunnelChart from "../../components/analytics/FunnelChart";
import { useAnalyticsFilter } from "../../context/AnalyticsFilterContext";
import { getGoldTrialDashboard, updateGoldTrialConfig } from "../../../services/admin-trial.service";

const DEFAULT_MESSAGES = [
  { day: 0, title: "Welcome to Victory Gold", body: "Hi {name}, your Gold trial is active. Ask Coach Victor one question right now to get your first win.", channels: ["push", "in_app", "email"], video_url: "", active: true },
  { day: 1, title: "Have you set up your meal plan?", body: "Have you set up your meal plan yet? Takes 2 minutes.", channels: ["push", "in_app", "email"], video_url: "", active: true },
  { day: 2, title: "See what Gold can do", body: "Watch your mid-trial Victory Fitness video and choose one Gold feature to try today.", channels: ["push", "in_app", "email", "video"], video_url: "", active: true },
  { day: 3, title: "Keep your momentum going", body: "{engagement_message}", channels: ["push", "in_app", "email"], video_url: "", active: true },
  { day: 4, title: "Your trial ends tomorrow", body: "Tomorrow your trial ends. Here is what you have used so far: {usage_summary}", channels: ["push", "in_app"], video_url: "", active: true },
  { day: 5, title: "Your Gold trial is complete", body: "Your Gold trial has ended. Compare Silver and Gold using what you actually tried, then choose your plan.", channels: ["push", "in_app", "email", "video"], video_url: "", active: true },
];

const DAY_PURPOSES = {
  0: ["Welcome + first taste", "Confirm Gold trial and push the first AI Coach touch immediately."],
  1: ["Get them into Nutrition", "Move users into Nutrition Planner before it becomes the skipped feature."],
  2: ["Show, do not tell", "Use video while there is still enough runway for the user to act."],
  3: ["Reinforce or activate", "Branch from AI Coach or nutrition usage inside the trial window."],
  4: ["Pre-decision warm-up", "Show factual usage summary without guilt or upsell language."],
  5: ["Conversion decision", "Open the Silver vs Gold choice using the user's actual usage."],
};

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function normalizeMessages(messages = []) {
  const byDay = new Map(messages.map((item) => [Number(item.day), item]));
  return DEFAULT_MESSAGES.map((fallback) => {
    const item = byDay.get(fallback.day) || {};
    return {
      ...fallback,
      ...item,
      day: fallback.day,
      title: String(item.title || fallback.title),
      body: String(item.body || fallback.body),
      channels: Array.isArray(item.channels) && item.channels.length ? item.channels : fallback.channels,
      video_url: String(item.video_url || item.videoUrl || ""),
      active: item.active !== false,
    };
  });
}

function StatusPill({ status, label }) {
  const config = {
    done: "border-[#1A7A4A]/20 bg-[#1A7A4A]/10 text-[#1A7A4A]",
    attention: "border-[#C9943A]/25 bg-[#C9943A]/10 text-[#8a611d]",
    missing: "border-rose-200 bg-rose-50 text-rose-700",
  }[status] || "border-slate-200 bg-slate-50 text-slate-600";

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

function channelLabel(value) {
  return String(value || "").replace("_", "-").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function TrialDayCard({ item, active, onSelect }) {
  const [headline, purpose] = DAY_PURPOSES[item.day] || [`Day ${item.day}`, ""];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "rounded-lg border p-4 text-left transition-all",
        active ? "border-[#C9943A] bg-[#C9943A]/10 shadow-sm" : "border-[#0D2B45]/10 bg-[#F7F3EE] hover:border-[#C9943A]/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B5651D]">Day {item.day}</p>
          <h3 className="mt-1 text-base font-black text-[#0D2B45]">{headline}</h3>
          <p className="text-sm font-semibold text-slate-500">{item.title}</p>
        </div>
        {item.active ? <FiClock className="h-5 w-5 text-[#C9943A]" /> : <FiToggleLeft className="h-5 w-5 text-slate-400" />}
      </div>
      <p className="mt-4 rounded-md bg-white p-3 text-sm leading-relaxed text-slate-700">{item.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.channels.map((channel) => (
          <span key={channel} className="rounded-full border border-[#0D2B45]/10 bg-white px-2.5 py-1 text-xs font-bold text-[#0D2B45]">
            {channelLabel(channel)}
          </span>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">{purpose}</p>
      {item.channels.includes("video") ? (
        <p className={cx("mt-2 text-xs font-semibold", item.video_url ? "text-[#1A7A4A]" : "text-[#8a611d]")}>
          {item.video_url ? "Video asset configured." : "Video URL needed before production launch."}
        </p>
      ) : null}
    </button>
  );
}

function ConfigEditor({ config, selectedDay, setSelectedDay, onSave, saving }) {
  const [draft, setDraft] = useState({ tierLabel: "Try Gold free for 5 days", messages: DEFAULT_MESSAGES });

  useEffect(() => {
    setDraft({
      tierLabel: config?.tierLabel || "Try Gold free for 5 days",
      messages: normalizeMessages(config?.messages),
    });
  }, [config]);

  const selected = draft.messages.find((item) => item.day === selectedDay) || draft.messages[0];
  const updateSelected = (patch) => {
    setDraft((current) => ({
      ...current,
      messages: current.messages.map((item) => (item.day === selected.day ? { ...item, ...patch } : item)),
    }));
  };

  const toggleChannel = (channel) => {
    const channels = new Set(selected.channels);
    if (channels.has(channel)) channels.delete(channel);
    else channels.add(channel);
    updateSelected({ channels: Array.from(channels) });
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.7fr_1fr]">
      <div className="space-y-2">
        {draft.messages.map((message) => (
          <button
            key={message.day}
            type="button"
            onClick={() => setSelectedDay(message.day)}
            className={cx(
              "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left",
              selectedDay === message.day ? "border-[#C9943A] bg-[#C9943A]/10" : "border-[#0D2B45]/10 bg-[#F7F3EE]",
            )}
          >
            <span className="text-sm font-black text-[#0D2B45]">Day {message.day}</span>
            <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
              {message.active ? <FiToggleRight className="h-4 w-4 text-[#1A7A4A]" /> : <FiToggleLeft className="h-4 w-4" />}
              {message.channels.includes("video") && !message.video_url ? "Needs video" : "Ready"}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-[#0D2B45]/10 bg-[#F7F3EE] p-4">
        <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Public trial label</label>
        <input
          value={draft.tierLabel}
          onChange={(event) => setDraft((current) => ({ ...current, tierLabel: event.target.value }))}
          className="mt-2 w-full rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm font-semibold text-[#0D2B45] outline-none focus:border-[#C9943A]"
        />

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Day {selected.day} title</span>
            <input
              value={selected.title}
              onChange={(event) => updateSelected({ title: event.target.value })}
              className="mt-2 w-full rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm font-semibold text-[#0D2B45] outline-none focus:border-[#C9943A]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Video URL</span>
            <input
              value={selected.video_url}
              onChange={(event) => updateSelected({ video_url: event.target.value })}
              placeholder={selected.channels.includes("video") ? "Required for video days" : "Optional"}
              className="mt-2 w-full rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm font-semibold text-[#0D2B45] outline-none focus:border-[#C9943A]"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">Message body</span>
          <textarea
            value={selected.body}
            onChange={(event) => updateSelected({ body: event.target.value })}
            rows={4}
            className="mt-2 w-full resize-none rounded-md border border-[#0D2B45]/15 bg-white px-3 py-2 text-sm font-semibold leading-6 text-[#0D2B45] outline-none focus:border-[#C9943A]"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {["push", "in_app", "email", "video"].map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => toggleChannel(channel)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-black",
                selected.channels.includes(channel) ? "border-[#0D2B45] bg-[#0D2B45] text-white" : "border-[#0D2B45]/15 bg-white text-[#0D2B45]",
              )}
            >
              {channelLabel(channel)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => updateSelected({ active: !selected.active })}
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-[#0D2B45]/10 bg-white px-3 py-2 text-xs font-black text-[#0D2B45]"
          >
            {selected.active ? <FiToggleRight className="h-4 w-4 text-[#1A7A4A]" /> : <FiToggleLeft className="h-4 w-4" />}
            {selected.active ? "Active" : "Inactive"}
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-[#0D2B45] px-4 py-2 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
            Save Trial Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrialExperience() {
  const filter = useAnalyticsFilter();
  const [data, setData] = useState({ funnel: { steps: [] }, userStats: {}, cohorts: [], dropouts: [], config: { messages: [] }, outcomes: {}, errors: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedDay, setSelectedDay] = useState(3);
  const [selectedBranch, setSelectedBranch] = useState("engaged");

  const messages = useMemo(() => normalizeMessages(data.config?.messages), [data.config]);
  const videoReady = messages.filter((item) => item.channels.includes("video")).every((item) => item.video_url);
  const activeMessages = messages.filter((item) => item.active).length;
  const outcomes = data.outcomes || {};
  const trialStarted = data.funnel?.steps?.[0]?.count || outcomes.totalTrials || 0;
  const conversionRate = Number(outcomes.conversionRate ?? data.userStats?.trialConversionRate ?? 0);
  const launchStatus = data.errors?.length ? "missing" : videoReady ? "done" : "attention";
  const launchLabel = data.errors?.length ? "Blocked" : videoReady ? "Ready" : "Asset Needed";

  const readinessRows = useMemo(() => [
    { item: "Explicit trial fields", status: data.config?.error ? "missing" : "done", note: "Backend stores trial_tier_granted, trial_start_at, trial_end_at, and trial_outcome." },
    { item: "Gold access during trial", status: data.config?.error ? "missing" : "done", note: "Access layer grants Gold features during an active trial while paid tier can remain NONE." },
    { item: "Day 0-5 scheduled messaging", status: activeMessages === 6 ? "done" : "attention", note: `${activeMessages}/6 campaign messages are active.` },
    { item: "Day-3 usage branch", status: "done", note: "Backend branches using AI Coach and nutrition activity inside the trial window." },
    { item: "Day-4 factual usage summary", status: "done", note: "Campaign supports usage_summary, ai_message_count, meal_logged_count, and nutrition_plan_count tokens." },
    { item: "Day-5 decision payload", status: "done", note: "App can call /me/trial/decision for Silver vs Gold options with demonstrated usage." },
    { item: "No silent paid conversion", status: "done", note: "Trial start does not set a paid plan. Outcome is written only after explicit subscription choice or lapse." },
    { item: "Dashboard trial_outcome breakdown", status: data.outcomes?.error ? "missing" : "done", note: "Admin outcomes endpoint returns converted_gold, downgraded_silver, lapsed, active, and pending counts." },
    { item: "Video fallback and admin alerting", status: videoReady ? "done" : "attention", note: videoReady ? "Video days have configured URLs." : "Day 2 and Day 5 should have production video URLs before launch." },
  ], [activeMessages, data.config?.error, data.outcomes?.error, videoReady]);

  const branchMessage = selectedBranch === "engaged"
    ? "You've already sent {ai_message_count} messages to your coach - keep going."
    : "You have 2 days left to try your AI Coach - ask it one question right now.";

  const load = () => {
    const controller = new AbortController();
    setLoading(true);
    setNotice("");
    getGoldTrialDashboard({ ...filter, signal: controller.signal })
      .then(setData)
      .catch((error) => setData((current) => ({ ...current, errors: [error.message] })))
      .finally(() => setLoading(false));
    return () => controller.abort();
  };

  const refreshDashboard = () => {
    load();
  };

  useEffect(() => load(), [filter.preset, filter.market, filter.from, filter.to]);

  const saveConfig = async (draft) => {
    setSaving(true);
    setNotice("");
    try {
      const config = await updateGoldTrialConfig({
        tierLabel: draft.tierLabel,
        messages: draft.messages.map((item) => ({
          day: Number(item.day),
          title: item.title.trim(),
          body: item.body.trim(),
          channels: item.channels,
          video_url: item.video_url.trim(),
          active: item.active,
        })),
      });
      setData((current) => ({ ...current, config }));
      setNotice("Gold trial settings saved.");
    } catch (error) {
      setNotice(error.message || "Failed to save Gold trial settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-[#F7F3EE] pb-8 text-[#0D0D0D]">
      <header className="overflow-hidden rounded-lg bg-[#0D2B45] text-white shadow-xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.45fr_0.8fr] lg:p-8">
          <div>
            <p className="inline-flex rounded-full border border-[#C9943A]/40 bg-[#C9943A]/15 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-[#F7F3EE]">Section 19</p>
            <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight tracking-normal sm:text-4xl">5-Day Gold Trial Experience</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#F7F3EE]/80 sm:text-base">
              Production control room for undecided sign-ups: Gold entitlement, Day 0-5 campaign, usage-based branching, Day-5 decision payload, and conversion outcomes.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Try Gold free for 5 days", "No silent conversion", "Usage-based Day 3", "Silver is paid"].map((label) => (
                <span key={label} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#F7F3EE]">{label}</span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9943A]">Production check</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3"><span className="text-sm text-white/80">Backend endpoints</span><StatusPill status={data.errors?.length ? "missing" : "done"} label={data.errors?.length ? "Blocked" : "Live"} /></div>
              <div className="flex items-center justify-between gap-3"><span className="text-sm text-white/80">Campaign messages</span><StatusPill status={activeMessages === 6 ? "done" : "attention"} label={`${activeMessages}/6`} /></div>
              <div className="flex items-center justify-between gap-3"><span className="text-sm text-white/80">Video assets</span><StatusPill status={videoReady ? "done" : "attention"} label={videoReady ? "Ready" : "Needed"} /></div>
            </div>
            {data.errors?.length ? <div className="mt-4 rounded-md bg-rose-500/15 p-3 text-xs text-rose-50">{data.errors[0]}</div> : null}
            {notice ? <div className="mt-4 rounded-md bg-white/10 p-3 text-xs font-semibold text-white">{notice}</div> : null}
          </div>
        </div>
      </header>

      <AnalyticsFilterBar />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FiZap} label="Trial offer" value={data.config?.tierLabel || "Gold"} caption="Only for undecided sign-ups after onboarding or an explicit not-sure choice." tone="gold" />
        <MetricCard icon={FiClock} label="Trial window" value={`${data.config?.durationDays || 5} days`} caption="trial_end_at is calculated from each user's trial_start_at." tone="navy" />
        <MetricCard icon={FiBarChart2} label="Gold conversion" value={`${conversionRate.toFixed(1)}%`} caption={`${outcomes.convertedGold || 0} converted, ${outcomes.downgradedSilver || 0} downgraded, ${outcomes.lapsed || 0} lapsed.`} tone="green" />
        <MetricCard icon={FiShield} label="Launch status" value={launchLabel} caption={videoReady ? "Backend and dashboard wiring are complete." : "Configure Day 2 and Day 5 video URLs before launch."} tone={launchStatus === "done" ? "green" : launchStatus === "missing" ? "danger" : "ivory"} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]">
        <SectionShell title="Entitlement Rules" eyebrow="19.1 what the trial unlocks">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              "trial_tier_granted = gold",
              "trial_start_at set per user",
              "trial_end_at = start + 5 days",
              "paid plan remains NONE until explicit choice",
              "AI Coach available during trial",
              "Nutrition Planner and AI meal plans available",
              "Challenge creation available during trial",
              "Workouts, Challenges, Silver Community remain available",
            ].map((rule) => (
              <div key={rule} className="flex items-start gap-3 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] p-3">
                <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1A7A4A]" />
                <span className="text-sm font-semibold text-[#0D2B45]">{rule}</span>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          title="Live Trial Funnel"
          eyebrow="dashboard analytics"
          action={
            <button type="button" onClick={refreshDashboard} className="inline-flex items-center gap-2 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] px-3 py-2 text-xs font-bold text-[#0D2B45] hover:bg-white">
              <FiRefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
          }
        >
          <FunnelChart steps={data.funnel?.steps || []} />
        </SectionShell>
      </div>

      <SectionShell title="Campaign Settings" eyebrow="production editor" action={<FiEdit3 className="h-5 w-5 text-[#B5651D]" />}>
        <ConfigEditor config={data.config} selectedDay={selectedDay} setSelectedDay={setSelectedDay} onSave={saveConfig} saving={saving} />
      </SectionShell>

      <SectionShell title="Day-By-Day Messaging Sequence" eyebrow="19.2 campaign design">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {messages.map((item) => (
            <TrialDayCard key={item.day} item={item} active={selectedDay === item.day} onSelect={() => setSelectedDay(item.day)} />
          ))}
        </div>
      </SectionShell>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionShell title="Day-3 Branch Logic" eyebrow="19.3 engagement decision">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F7F3EE] p-1">
            {[["engaged", "Engaged"], ["unengaged", "Unengaged"]].map(([key, label]) => (
              <button key={key} type="button" onClick={() => setSelectedBranch(key)} className={cx("rounded-md px-3 py-2 text-sm font-black", selectedBranch === key ? "bg-[#0D2B45] text-white shadow-sm" : "text-[#0D2B45]")}>{label}</button>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-[#C9943A]/25 bg-[#C9943A]/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B5651D]">Message preview</p>
            <p className="mt-2 text-lg font-black text-[#0D2B45]">{branchMessage}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Engaged means 1+ AI Coach message or nutrition activity since trial_start_at. Unengaged means zero AI Coach messages and zero nutrition activity.</p>
          </div>
        </SectionShell>

        <SectionShell title="Day-5 Decision Payload" eyebrow="19.2 conversion push">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#0D2B45]/15 bg-[#F7F3EE] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0D2B45]">Victory Silver</p>
              <p className="mt-2 text-3xl font-black text-[#0D2B45]">EUR 199/year</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600"><li>Workouts</li><li>Challenges</li><li>Silver community</li></ul>
            </div>
            <div className="rounded-lg border-2 border-[#C9943A] bg-[#0D2B45] p-4 text-white shadow-md">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C9943A]">Victory Gold</p>
              <p className="mt-2 text-3xl font-black">Keep Gold</p>
              <ul className="mt-4 space-y-2 text-sm text-white/80"><li>AI Coach usage pre-filled</li><li>Nutrition usage pre-filled</li><li>Challenge access retained</li></ul>
            </div>
          </div>
          <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm font-semibold text-rose-700">Guardrail: no paid plan is activated without explicit user action.</div>
        </SectionShell>
      </div>

      <SectionShell title="Backend Completion Check" eyebrow="live readiness">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#0D2B45]/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Requirement</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {readinessRows.map((row) => (
                <tr key={row.item} className="border-b border-[#0D2B45]/5">
                  <td className="py-3 pr-4 font-semibold text-[#0D2B45]">{row.item}</td>
                  <td className="py-3 pr-4"><StatusPill status={row.status} /></td>
                  <td className="py-3 text-slate-600">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionShell>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionShell title="Trial Outcome Breakdown" eyebrow="19.4 cohort tracking">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard label="Converted to Gold" value={outcomes.convertedGold || 0} caption={`${outcomes.conversionRate || 0}% of decided trials.`} tone="gold" />
            <MetricCard label="Downgraded to Silver" value={outcomes.downgradedSilver || 0} caption={`${outcomes.downgradeRate || 0}% of decided trials.`} tone="navy" />
            <MetricCard label="Lapsed" value={outcomes.lapsed || 0} caption={`${outcomes.lapsedRate || 0}% of decided trials.`} tone="danger" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-[#F7F3EE] p-3 font-semibold text-[#0D2B45]">Active trials: {outcomes.activeTrials || 0}</div>
            <div className="rounded-md bg-[#F7F3EE] p-3 font-semibold text-[#0D2B45]">Pending decision: {outcomes.pendingDecision || 0}</div>
          </div>
        </SectionShell>

        <SectionShell title="Recent Trial Dropouts" eyebrow="activation watchlist">
          <div className="space-y-3">
            {data.dropouts.length ? data.dropouts.slice(0, 5).map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#0D2B45]/10 bg-[#F7F3EE] p-3">
                <div>
                  <p className="font-black text-[#0D2B45]">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{user.email} - {user.signupSource || "unknown source"}</p>
                </div>
                <div className="flex gap-2 text-xs font-bold">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[#0D2B45]">{user.coachMessages || 0} coach messages</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[#0D2B45]">{user.nutritionPlanCreated ? "Nutrition used" : "No nutrition"}</span>
                </div>
              </div>
            )) : (
              <div className="rounded-md border border-dashed border-[#0D2B45]/20 bg-[#F7F3EE] p-6 text-center text-sm font-semibold text-slate-500">No dropouts returned by the backend yet.</div>
            )}
          </div>
        </SectionShell>
      </div>

      <SectionShell title="Launch Checklist" eyebrow="production gate">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            [FiMessageCircle, "App integration", "Onboarding must call POST /me/trial/gold/start when the user is undecided."],
            [FiPlayCircle, "Trial videos", "Configure Day 2 and Day 5 video URLs in Campaign Settings."],
            [FiMail, "Email/push credentials", "Production Resend and push provider keys must be valid before scheduled jobs run."],
            [FiUsers, "Decision screen", "App should render GET /me/trial/decision on Day 5."],
            [FiAlertTriangle, "Cron schedule", "Run /jobs/trial-campaign daily with CRON_SECRET."],
            [FiShield, "Payment verification", "Payment callback must call the subscription update flow after explicit user choice."],
          ].map(([Icon, title, body]) => (
            <div key={title} className="rounded-lg border border-[#0D2B45]/10 bg-[#F7F3EE] p-4">
              <Icon className="h-5 w-5 text-[#B5651D]" />
              <h3 className="mt-3 font-black text-[#0D2B45]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}
