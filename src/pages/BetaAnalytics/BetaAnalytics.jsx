import { useState } from "react";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";
import RequirementAuditBoundary from "../../components/audit/RequirementAuditBoundary";

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

const FEEDBACK = [
  {
    c: 9,
    t: "Nutrition logging is too slow",
    status: "FIXED",
    tone: "good",
    quote: "I gave up logging dinner. Too many taps for something I eat every week.",
    cta: "Tell the 9 it shipped",
    who: "9 testers · Germany, Ghana, India",
    drawer: "broadcast",
  },
  {
    c: 7,
    t: "Wanted the coach to know my injury",
    status: "IN BUILD",
    tone: "warn",
    quote: "I told it about my knee on Monday and it suggested squats on Wednesday.",
    cta: "See the build ticket",
    who: "7 testers · all markets",
    drawer: "flag",
  },
  {
    c: 6,
    t: "Videos buffer on mobile data",
    status: "OPEN",
    tone: "bad",
    quote: "On 3G it stops every twenty seconds. I stopped training with the app outside.",
    cta: "Assign to dev",
    who: "6 testers · Ghana, India",
    drawer: "support",
  },
  {
    c: 5,
    t: "Loved the identity statement",
    status: "KEEP",
    tone: "good",
    quote: "Seeing my own sentence after a session hit harder than any streak counter.",
    cta: "Use as marketing copy",
    who: "5 testers · Germany, UK",
    drawer: "quote",
  },
  {
    c: 4,
    t: "Did not understand what Gold included",
    status: "OPEN",
    tone: "bad",
    quote: "I only realised on day 14 that the meal planner was part of it.",
    cta: "Fix the day-0 screen",
    who: "4 testers · Germany, Ghana",
    drawer: "template",
  },
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

const SEQUENCE = [
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
  const { isDark } = useTheme();
  const [bdone, setBdone] = useState([]);

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

  const fbCount = `${FEEDBACK.reduce((a, x) => a + x.c, 0)} responses · 5 themes`;

  return (
    <div className={`animate-in fade-in duration-200 font-dmsans ${isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"}`}>
      {/* Hero Banner: Exact Claude Reference (lines 258-278) */}
      <RequirementAuditBoundary
        auditId="ADMIN-MISMATCH-005"
        status="mismatch"
        label="MISMATCH - DOCUMENT REQUIRES 5-DAY GOLD TRIAL (21-DAY BETA HERO BANNER)"
        className="mb-5"
      >
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
      </RequirementAuditBoundary>

      {/* 4 Beta Stages: Exact Claude Reference (lines 280-291) */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {BETA_STAGES.map((b) => (
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
          <RequirementAuditBoundary
            auditId="ADMIN-EXTRA-044"
            status="extra"
            label="NOT IN REQUIREMENT - THE POINT OF THE PROGRAMME (FEEDBACK INBOX)"
            className="mb-4"
          >
            <div
              style={{
                background: t.cardBg,
                borderRadius: "20px",
                boxShadow: t.cardShadow,
                border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                borderLeft: "4px solid #B5651D",
                padding: "22px",
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

            {FEEDBACK.map((fb, i) => (
              <div
                key={fb.t}
                style={{
                  background: t.subtleBg,
                  borderRadius: "15px",
                  border: isDark ? "none" : `1px solid ${t.cardBorder}`,
                  padding: "16px 17px",
                  marginBottom: i < FEEDBACK.length - 1 ? "9px" : 0,
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
                </div>

                <p style={{ margin: "0 0 10px", font: "400 13.5px/1.55 'Inter', sans-serif", color: t.subtext, textWrap: "pretty" }}>
                  “{fb.quote}”
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div
                    onClick={() => openDrawer(fb.drawer)}
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
          </RequirementAuditBoundary>

          {/* CHECKPOINT ANALYTICS / Where testers fall away: Exact Claude Reference (lines 321-335) */}
          <RequirementAuditBoundary
            auditId="ADMIN-EXTRA-045"
            status="extra"
            label="NOT IN REQUIREMENT - CHECKPOINT ANALYTICS (WHERE TESTERS FALL AWAY)"
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
              Each bar is testers still active on that day. The drop between two days is what to fix.
            </p>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "7px", height: "132px", marginBottom: "14px" }}>
              {BETA_DAYS.map((d) => (
                <div key={d.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "7px", minWidth: 0 }}>
                  <span
                    style={{
                      font: "700 12px 'JetBrains Mono', monospace",
                      color: d.pct >= 70 ? (isDark ? "#5FC48E" : "#1A7A4A") : d.pct >= 50 ? "#C9943A" : (isDark ? "#D98A3E" : "#B5651D"),
                    }}
                  >
                    {d.v}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      borderRadius: "6px 6px 0 0",
                      height: `${Math.round(d.pct * 0.9)}px`,
                      background: d.pct >= 70 ? "#1A7A4A" : d.pct >= 50 ? "#C9943A" : "#B5651D",
                      transition: "height 0.3s ease",
                    }}
                  />
                  <span style={{ font: "500 10.5px 'JetBrains Mono', monospace", color: t.muted }}>
                    {d.d}
                  </span>
                </div>
              ))}
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
              The cliff is between day 5 and day 10 — four of fifteen stop there, and it matches the buffering complaint from Ghana and India. Fix video on mobile data before you run this programme again.
            </div>
            </div>
          </RequirementAuditBoundary>
        </div>

        {/* Right Column (flex: 1 1 330px; min-width: 300px; display: flex; flex-direction: column; gap: 16px) */}
        <div style={{ flex: "1 1 330px", minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
          
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

          {/* TESTERS: Exact Claude Reference (lines 371-388) */}
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
                15 ENROLLED · 6 COUNTRIES
              </span>
            </div>

            {TESTERS.map((tItem, idx) => (
              <div
                key={tItem.i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "11px 0",
                  borderBottom: idx < TESTERS.length - 1 ? `1px solid ${t.rowBorder}` : "none",
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
                    {tItem.i}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 13.5px 'DM Sans', sans-serif", color: t.text }}>
                    {tItem.n}
                  </div>
                  <div style={{ font: "400 11px 'JetBrains Mono', monospace", color: t.muted, marginTop: "2px" }}>
                    {tItem.meta}
                  </div>
                </div>
                <span
                  style={{
                    font: "700 9.5px 'DM Sans', sans-serif",
                    letterSpacing: ".11em",
                    flex: "none",
                    color: tItem.tone === "good" ? (isDark ? "#5FC48E" : "#1A7A4A") : tItem.tone === "warn" ? "#C9943A" : (isDark ? "#D98A3E" : "#B5651D"),
                  }}
                >
                  {tItem.state}
                </span>
              </div>
            ))}

            <div
              onClick={() => openDrawer("message")}
              style={{
                height: "42px",
                borderRadius: "12px",
                boxSizing: "border-box",
                border: "1.5px solid rgba(201,148,58,.6)",
                color: "#C9943A",
                font: "700 13px 'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginTop: "14px",
                userSelect: "none",
              }}
            >
              See all 15 · invite more
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
