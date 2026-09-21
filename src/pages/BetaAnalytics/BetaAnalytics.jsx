import { useState, useEffect } from "react";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { getPhaseOneBetaSummary } from "../../../services/admin-trial.service";

const BETA_HERO_STATS = [
  { k: "ENROLLED", v: "15", sub: "Of 50 invited" },
  { k: "ACTIVE", v: "6", sub: "Trained this week" },
  { k: "FEEDBACK", v: "31", sub: "Across 5 themes" },
  { k: "INTERVIEWS", v: "3", sub: "Exit calls booked" },
];

const BETA_STAGES = [
  { k: "ENROLLED", v: "15", pct: "100%", note: "All invited, accepted within 48h" },
  { k: "OPENED APP", v: "13", pct: "87%", note: "Completed Day 0 onboarding" },
  { k: "FIRST WORKOUT", v: "11", pct: "73%", note: "Completed at least one session" },
  { k: "DAY 7 ACTIVE", v: "11", pct: "73%", note: "Still training after first week" },
];

const FEEDBACK_THEMES = [
  { c: 9, t: "Nutrition logging is too slow", status: "FIXED", tone: "good", quote: "I gave up logging dinner. Too many taps for something I eat every week.", cta: "Tell the 9 it shipped", who: "9 testers · Germany, Ghana, India", drawer: "broadcast" },
  { c: 7, t: "Wanted the coach to know my injury", status: "IN BUILD", tone: "warn", quote: "I told it about my knee on Monday and it suggested squats on Wednesday.", cta: "See the build ticket", who: "7 testers · all markets", drawer: "flag" },
  { c: 6, t: "Videos buffer on mobile data", status: "OPEN", tone: "bad", quote: "On 3G it stops every twenty seconds. I stopped training with the app outside.", cta: "Assign to dev", who: "6 testers · Ghana, India", drawer: "support" },
  { c: 5, t: "Loved the identity statement", status: "KEEP", tone: "good", quote: "Seeing my own sentence after a session hit harder than any streak counter.", cta: "Use as marketing copy", who: "5 testers · Germany, UK", drawer: "quote" },
  { c: 4, t: "Did not understand what Gold included", status: "OPEN", tone: "bad", quote: "I only realised on day 14 that the meal planner was part of it.", cta: "Fix the day-0 screen", who: "4 testers · Germany, Ghana", drawer: "template" },
];

const BETA_DAYS = [
  { d: "D1", v: 15, pct: 100 },
  { d: "D3", v: 13, pct: 87 },
  { d: "D5", v: 11, pct: 73 },
  { d: "D7", v: 11, pct: 73 },
  { d: "D10", v: 9, pct: 60 },
  { d: "D14", v: 8, pct: 53 },
  { d: "D18", v: 7, pct: 47 },
  { d: "D21", v: 6, pct: 40 },
];

const BETA_ACTIONS = [
  { id: "ba1", t: "Chase the 9 silent testers", note: "Enrolled, never opened a feature", n: "9", drawer: "message" },
  { id: "ba2", t: "Reply to this week's feedback", note: "Every tester who writes gets an answer", n: "12", drawer: "support" },
  { id: "ba3", t: "Ship the logging fix note", note: "Nine people asked. Tell them it is done.", n: "1", drawer: "broadcast" },
  { id: "ba4", t: "Book three exit interviews", note: "Fifteen minutes each, the ones who quit", n: "3", drawer: "application" },
];

const REMARKETING_SEQUENCE = [
  { when: "DAY 21", t: "Your beta ends — thank you, and what did we miss?", note: "One question, one field. No pitch.", state: "SCHEDULED", tone: "warn" },
  { when: "DAY 24", t: "Here is what your feedback changed", note: "The three fixes that shipped, named after them.", state: "DRAFT", tone: "warn" },
  { when: "DAY 30", t: "Gold, at the beta price", note: "Discount for testers only, expires in 7 days.", state: "DRAFT", tone: "warn" },
  { when: "DAY 45", t: "Last call, then we stop writing", note: "One message, then off the list for good.", state: "NOT WRITTEN", tone: "bad" },
];

const TESTERS = [
  { i: "KM", n: "Kofi Mensah", meta: "Ghana · day 18 · 31 messages", state: "ACTIVE", tone: "good" },
  { i: "AR", n: "Arjun Rao", meta: "India · day 14 · 12 messages", state: "ACTIVE", tone: "good" },
  { i: "JH", n: "James Hill", meta: "UK · day 11 · never opened", state: "SILENT", tone: "bad" },
  { i: "IV", n: "Ingrid Vogel", meta: "Germany · day 9 · 22 messages", state: "ACTIVE", tone: "good" },
  { i: "CD", n: "Claire Dubois", meta: "France · day 6 · 1 workout", state: "AT RISK", tone: "warn" },
];

export default function BetaAnalytics() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [completedActions, setCompletedActions] = useState({});
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    getPhaseOneBetaSummary()
      .then((res) => {
        if (res) setLiveData(res);
      })
      .catch(() => null);
  }, []);

  const toggleAction = (id, title) => {
    setCompletedActions((prev) => {
      const next = !prev[id];
      if (next) showToast(`✓ Completed: ${title}`);
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-dmsans">
      {/* Hero Banner with 4 Stats */}
      <div className="bg-[#0D2B45] rounded-[22px] p-6 sm:p-7 border-l-4 border-[#B5651D] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-[10px] font-bold tracking-wider text-[#0D0D0D] bg-[#C9943A] rounded px-2 py-0.5">
                ONE-TIME PROGRAMME
              </span>
              <span className="text-xs font-mono text-[#F7F3EE]/55">
                PHASE 1 · CLOSES 30 SEP
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#F7F3EE] font-clash tracking-tight mb-2.5">
              21-Day Gold Beta
            </h1>
            <p className="text-sm sm:text-[15px] text-[#F7F3EE]/65 font-inter leading-relaxed">
              Full Gold, free, for 21 days. No card, no auto-renewal. The purpose is not conversion — it is written feedback you can build from, and a warm list to sell to when the fixes ship.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto shrink-0">
            {BETA_HERO_STATS.map((h) => (
              <div
                key={h.k}
                className="bg-[#F7F3EE]/6 rounded-xl p-3.5 sm:p-4 min-w-[120px] flex flex-col justify-between"
              >
                <div className="text-[9.5px] font-semibold uppercase tracking-wider text-[#F7F3EE]/50 mb-1">
                  {h.k}
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F7F3EE]">
                  {liveData && h.k === "ENROLLED" ? liveData.totalBetaUsers || h.v : h.v}
                </div>
                <div className="text-[11px] text-[#F7F3EE]/45 font-inter mt-1">{h.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Stage Activation Funnel Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {BETA_STAGES.map((s) => (
          <div
            key={s.k}
            className="bg-[#0D2B45] rounded-2xl p-4 sm:p-5 border-l-3 border-[#C9943A]"
          >
            <div className="text-[9.5px] font-semibold uppercase tracking-wider text-[#F7F3EE]/50 mb-1.5">
              {s.k}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#F7F3EE]">
                {s.v}
              </span>
              <span className="text-xs font-mono text-[#F7F3EE]/45">{s.pct}</span>
            </div>
            <div className="text-xs text-[#F7F3EE]/55 font-inter mt-1.5 leading-snug">
              {s.note}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: Left (Feedback + Drop-off) & Right (Actions + Sequence + Testers) */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Stage */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* Feedback Inbox */}
          <div className="bg-[#0D2B45] rounded-2xl p-5 sm:p-6 border-l-4 border-[#B5651D]">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <div>
                <div className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase mb-1">
                  THE POINT OF THE PROGRAMME
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-[#F7F3EE] font-clash">
                  Feedback inbox
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-[#C9943A]">
                31 items across 5 themes
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-[#F7F3EE]/55 font-inter mb-4">
              Grouped by theme, not by tester. Size of the group is how many people said it.
            </p>

            <div className="space-y-3.5">
              {FEEDBACK_THEMES.map((fb) => (
                <div
                  key={fb.t}
                  className="p-4 rounded-xl bg-[#0A0A0A]/70 border border-[#F7F3EE]/10"
                >
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-[#C9943A] text-[#0D0D0D] font-bold text-xs flex items-center justify-center font-mono">
                      {fb.c}
                    </span>
                    <span className="font-semibold text-sm sm:text-[15px] text-[#F7F3EE] font-dmsans">
                      {fb.t}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                        fb.tone === "good"
                          ? "bg-[#1A7A4A]/20 text-[#5FC48E]"
                          : fb.tone === "warn"
                          ? "bg-[#C9943A]/20 text-[#C9943A]"
                          : "bg-[#B5651D]/20 text-[#D98A3E]"
                      }`}
                    >
                      {fb.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13.5px] text-[#F7F3EE]/75 font-inter italic mb-3">
                    “{fb.quote}”
                  </p>
                  <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-[#F7F3EE]/5">
                    <button
                      type="button"
                      onClick={() => openDrawer(fb.drawer)}
                      className="text-xs font-bold text-[#C9943A] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{fb.cta}</span>
                      <span>→</span>
                    </button>
                    <span className="text-[11px] font-mono text-[#F7F3EE]/45">{fb.who}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkpoint Analytics / Drop-off Chart */}
          <div className="bg-[#0D2B45] rounded-2xl p-5 sm:p-6">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase mb-1">
              CHECKPOINT ANALYTICS
            </div>
            <h3 className="text-xl font-semibold text-[#F7F3EE] font-clash mb-1">
              Where testers fall away
            </h3>
            <p className="text-xs sm:text-[13px] text-[#F7F3EE]/55 font-inter mb-6">
              Each bar is testers still active on that day. The drop between two days is what to fix.
            </p>

            {/* Custom Bar Chart */}
            <div className="flex items-end gap-2 sm:gap-3 h-36 mb-4 px-2">
              {BETA_DAYS.map((d) => (
                <div
                  key={d.d}
                  className="flex-1 flex flex-col items-center justify-end gap-2 h-full"
                >
                  <span className="text-[11px] font-mono font-bold text-[#F7F3EE]">{d.v}</span>
                  <div className="w-full bg-[#F7F3EE]/10 rounded-t-md overflow-hidden flex items-end h-24">
                    <div
                      className="w-full bg-[#C9943A] rounded-t-md transition-all duration-300"
                      style={{ height: `${d.pct}%` }}
                    />
                  </div>
                  <span className="text-[10.5px] font-mono text-[#F7F3EE]/50">{d.d}</span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-[#B5651D]/15 border-l-3 border-[#B5651D] text-xs text-[#F7F3EE]/85 font-inter leading-relaxed">
              Steepest drop is between Day 1 and Day 3 (2 testers) and Day 7 to Day 10 (2 testers). Fixing the Day 0 tour and video buffering addresses both.
            </div>
          </div>
        </div>

        {/* Right Rail */}
        <div className="w-full xl:w-[350px] shrink-0 space-y-5">
          {/* Do This Today Checklist */}
          <div className="bg-[#0D2B45] rounded-2xl p-5 border-l-4 border-[#B5651D]">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase mb-3">
              DO THIS TODAY
            </div>
            <div className="space-y-2.5">
              {BETA_ACTIONS.map((a) => {
                const isDone = completedActions[a.id];
                return (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-xl hover:bg-[#0A0A0A]/40 transition-colors flex items-start gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAction(a.id, a.t)}
                      className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center cursor-pointer ${
                        isDone
                          ? "bg-[#5FC48E] border-[#5FC48E]"
                          : "border-[#C9943A] hover:bg-[#C9943A]/20"
                      }`}
                    >
                      {isDone && <span className="text-[#0D0D0D] font-bold text-[10px]">✓</span>}
                    </button>
                    <div
                      onClick={() => openDrawer(a.drawer)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div
                        className={`text-xs sm:text-sm font-semibold text-[#F7F3EE] ${
                          isDone ? "line-through text-[#F7F3EE]/50" : ""
                        }`}
                      >
                        {a.t}
                      </div>
                      <div className="text-[11px] text-[#F7F3EE]/50 mt-0.5">{a.note}</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#5FC48E]">{a.n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* After Day 21 Remarketing Sequence */}
          <div className="bg-[#0D2B45] rounded-2xl p-5">
            <div className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase mb-1">
              AFTER DAY 21
            </div>
            <h4 className="text-base font-semibold text-[#F7F3EE] font-clash mb-1">
              The re-marketing sequence
            </h4>
            <p className="text-xs text-[#F7F3EE]/60 font-inter mb-4 leading-relaxed">
              They tried Gold free and told you what was wrong. You fix it, then you go back and say so. That second message is the one that sells.
            </p>

            <div className="space-y-3">
              {REMARKETING_SEQUENCE.map((q) => (
                <div key={q.when} className="pt-2.5 first:pt-0 border-t border-[#F7F3EE]/10 first:border-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold text-[#C9943A]">
                      {q.when}
                    </span>
                    <span
                      className={`text-[9.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        q.tone === "warn"
                          ? "bg-[#C9943A]/20 text-[#C9943A]"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {q.state}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#F7F3EE] leading-snug">{q.t}</div>
                  <div className="text-[11px] text-[#F7F3EE]/50 mt-0.5">{q.note}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openDrawer("template")}
              className="w-full h-10 mt-4 bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              Open the sequence editor
            </button>
          </div>

          {/* Testers Roster */}
          <div className="bg-[#0D2B45] rounded-2xl p-5">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-[#C9943A] uppercase">
                TESTERS
              </span>
              <span className="text-[11px] font-mono text-[#F7F3EE]/45">
                15 ENROLLED · 6 COUNTRIES
              </span>
            </div>

            <div className="space-y-2">
              {TESTERS.map((t) => (
                <div
                  key={t.i}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#0A0A0A]/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#F7F3EE]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#C9943A] font-mono">{t.i}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#F7F3EE] truncate">{t.n}</div>
                    <div className="text-[10.5px] font-mono text-[#F7F3EE]/45 truncate">
                      {t.meta}
                    </div>
                  </div>
                  <span
                    className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      t.tone === "good"
                        ? "bg-[#1A7A4A]/20 text-[#5FC48E]"
                        : t.tone === "warn"
                        ? "bg-[#C9943A]/20 text-[#C9943A]"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {t.state}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openDrawer("message")}
              className="w-full h-10 mt-3 border border-[#C9943A]/60 hover:border-[#C9943A] text-[#C9943A] font-bold text-xs rounded-xl transition-colors flex items-center justify-center cursor-pointer"
            >
              See all 15 · invite more
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
