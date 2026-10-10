import { useState, useMemo } from "react";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";
import RequirementAuditBoundary from "../audit/RequirementAuditBoundary";

const ALIAS = {
  "Ending ≤48h": ["day 5"],
  Undecided: ["watch"],
  "At risk": ["quiet", "declined", "risk", "never"],
  "Never active": ["never"],
  "Renewing soon": ["sep"],
  Lapsed: ["declined"],
  Untagged: ["untagged"],
  "Under 20 min": ["12 min", "15 min", "18 min"],
  "No equipment": ["mobility", "core"],
  Flagged: ["flag"],
  "All tiers": [],
  "Beta testers": ["beta"],
  "On trial": ["trial"],
  Paying: ["gold", "silver", "platinum"],
  Succeeded: ["succeeded"],
  Failed: ["declined", "never completed"],
  Refunded: ["refund"],
  Draft: ["draft"],
  Published: ["published"],
  Yearly: ["yearly"],
  Monthly: ["monthly"],
  Live: ["live"],
};

const PAGE_MATCH = {
  "All users|Paying": (r) => Boolean(r.raw?.isPaying || r.raw?.rawData?.isPaying),
  "All users|On trial": (r) => Boolean(r.raw?.isTrial || r.raw?.rawData?.isTrial || r.raw?.rawData?.trial_type),
  "All users|Beta testers": (r) => Boolean(r.raw?.isBetaTester || r.raw?.rawData?.isBetaTester || r.raw?.rawData?.is_beta_tester),
  "All users|At risk": (r) => Boolean(r.raw?.isAtRisk || r.raw?.rawData?.isAtRisk),
  "All users|Never active": (r) => Boolean(r.raw?.neverActive || r.raw?.rawData?.neverActive),
  "Community|Flagged": (r) => Boolean(r.raw?.rawData?.flagged || r.raw?.flagged),
  "Audit Logs|Broadcasts": (r) => /broadcast/i.test(r.c || ""),
  "Audit Logs|Pricing": (r) => /price|refund/i.test(r.c || ""),
  "Audit Logs|Content": (r) => /workout|challenge|masterclass|quote/i.test(r.c || ""),
  "Audit Logs|Members": (r) => /member|tier/i.test(r.c || ""),
  "Audit Logs|Destructive": (r) => /deleted|refunded|price changed/i.test(r.c || ""),
  "Feature Flags|On": (r) => (r.e || "").trim() === "On",
  "Feature Flags|Off": (r) => (r.e || "").trim() === "Off",
  "Feature Flags|Partial": (r) => {
    const v = parseInt(r.b || "0", 10);
    return v > 0 && v < 100;
  },
  "Feature Flags|Market-scoped": (r) => (r.c || "").trim() !== "All",
  "Feature Flags|Stale": (r) => (r.e || "").trim() === "Stale",
  "FAQ|Missing": (r) => (r.e || "").trim() === "Not written",
  "FAQ|Payment": (r) => (r.b || "").trim() === "Payment",
  "FAQ|Training": (r) => (r.b || "").trim() === "Training",
  "FAQ|Nutrition": (r) => (r.b || "").trim() === "Nutrition",
  "FAQ|Account": (r) => (r.b || "").trim() === "Account",
  "Settings|Legal": (r) => /policy|Terms|About/i.test(r.a || ""),
  "Settings|Data": (r) => /Data|export|delete/i.test(r.a || ""),
  "Settings|Access": (r) => /Admin/i.test(r.a || ""),
  "Notification Templates|Push": (r) => /Push/.test(r.b || ""),
  "Notification Templates|WhatsApp": (r) => /WhatsApp/.test(r.b || ""),
  "Notification Templates|Email": (r) => /Email/.test(r.b || ""),
  "Notification Templates|Approved": (r) => (r.e || "").trim() === "Approved",
  "Notification Templates|Member-facing": (r) => !/digest|receipt/i.test(r.a || ""),
  "Notification Templates|Unapproved": (r) => (r.e || "").trim() === "Unapproved",
  "Quotes|Live": (r) => (r.e || "").trim() === "Live",
  "Quotes|Unused": (r) => (r.e || "").trim() === "Unused",
  "Quotes|By Victor": (r) => /Victor/.test(r.b || ""),
  "Help & Support|Open": (r) => (r.e || "").trim() === "Open",
  "Help & Support|In progress": (r) => (r.e || "").trim() === "In progress",
  "Help & Support|Resolved": (r) => (r.e || "").trim() === "Resolved",
  "Help & Support|Payment": (r) => /payment|invoice|MoMo|card/i.test(r.b || ""),
  "Help & Support|Technical": (r) => /buffer|access|not working|change/i.test(r.b || ""),
  "Applications|Waiting": (r) => (r.e || "").trim() === "Waiting",
  "Applications|Call booked": (r) => (r.e || "").trim() === "Call booked",
  "Applications|Accepted": (r) => (r.e || "").trim() === "Accepted",
  "Applications|Declined": (r) => /Declined/.test(r.e || ""),
  "Workout library|Published": (r) => (r.raw?.rawData?.visibility || r.e || "").trim() === "Published",
  "Workout library|Draft": (r) => (r.raw?.rawData?.visibility || r.e || "").trim() === "Draft",
  "Workout library|Untagged": (r) => {
    const workout = r.raw?.rawData || {};
    return !workout.tag || !workout.equipment || !workout.level;
  },
  "Workout library|Under 20 min": (r) => Number(r.raw?.rawData?.durationMinutes || 0) > 0 && Number(r.raw?.rawData?.durationMinutes || 0) < 20,
  "Workout library|No equipment": (r) => {
    const equipment = String(r.raw?.rawData?.equipment || "").trim().toLowerCase();
    return !equipment || equipment === "bodyweight" || equipment === "no equipment";
  },
};

const COL_MATCH = {
  "3 day": [2, "3"],
  "5 day": [2, "5"],
  "7 day": [2, "7"],
  "14 day": [2, "14"],
  "21 day": [2, "21"],
};

export default function ClaudeAdminTable({
  pageKicker,
  pageTitle = "Page",
  pageSub,
  pagePrimary = "+ Add new",
  pageSecondary = "Export CSV",
  onPrimary,
  onSecondary,
  extraHeaderActions,
  pageStats = [],
  pageAdvice,
  pageAdviceDone,
  onAdvice,
  adviceAudit,
  rail,
  railFeatured,
  filters = ["All"],
  cols = ["NAME", "TIER", "MARKET", "LAST ACTIVE", "STATUS"],
  rows = [],
  onEditRow,
  onDeleteRow,
  renderRowActions,
  hideDeleteActions = false,
  onRowClick,
  isLoading = false,
}) {
  const [activeFilterIdx, setActiveFilterIdx] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [adviceAcknowledged, setAdviceAcknowledged] = useState(false);
  const { openDrawer, showToast } = useAdminDrawer();
  const { isDark } = useTheme();

  const t = {
    text: isDark ? "#F7F3EE" : "#0D2B45",
    subtext: isDark ? "rgba(247, 243, 238, 0.65)" : "rgba(13, 43, 69, 0.72)",
    muted: isDark ? "rgba(247, 243, 238, 0.45)" : "rgba(13, 43, 69, 0.52)",
    cardBg: isDark ? "#0D2B45" : "#FFFFFF",
    cardBorder: isDark ? "rgba(247, 243, 238, 0.1)" : "rgba(13, 43, 69, 0.08)",
    cardShadow: isDark ? "none" : "0 4px 20px rgba(13, 43, 69, 0.04)",
    subtleBg: isDark ? "rgba(247, 243, 238, 0.04)" : "#F5EFEB",
    tableHeaderBg: isDark ? "rgba(247, 243, 238, 0.04)" : "#F2EDE4",
    borderSubtle: isDark ? "rgba(247, 243, 238, 0.08)" : "rgba(13, 43, 69, 0.08)",
    borderMedium: isDark ? "rgba(247, 243, 238, 0.12)" : "rgba(13, 43, 69, 0.12)",
    filterBorder: isDark ? "rgba(247, 243, 238, 0.2)" : "rgba(13, 43, 69, 0.16)",
    filterInactiveText: isDark ? "rgba(247, 243, 238, 0.65)" : "rgba(13, 43, 69, 0.7)",
    secondaryBtnBorder: isDark ? "rgba(247, 243, 238, 0.22)" : "rgba(13, 43, 69, 0.18)",
    secondaryBtnText: isDark ? "#F7F3EE" : "#0D2B45",
  };

  // Normalize rows to standard format { a, b, c, d, e, tone, id, raw }
  const normalizedRows = useMemo(() => {
    return (rows || []).map((r, i) => {
      if (Array.isArray(r)) {
        return {
          id: `row-${i}-${r[0]}`,
          a: r[0] || "",
          b: r[1] || "",
          c: r[2] || "",
          d: r[3] || "",
          e: r[4] || "",
          tone: r[5] || "good",
          raw: r,
        };
      }
      return {
        id: r.id || `row-${i}-${r.a}`,
        a: r.a || "",
        b: r.b || "",
        c: r.c || "",
        d: r.d || "",
        e: r.e || "",
        tone: r.tone || "good",
        raw: r,
      };
    });
  }, [rows]);

  const activeLabel = filters[activeFilterIdx] || "All";

  // Filter matching adhering strictly to Admin Dashboard.dc.html logic
  const filteredRows = useMemo(() => {
    if (!activeLabel || activeLabel.startsWith("All")) {
      return normalizedRows;
    }
    const navKey = `${pageTitle}|${activeLabel}`;
    const pk = PAGE_MATCH[navKey];
    if (pk) {
      return normalizedRows.filter(pk);
    }
    if (COL_MATCH[activeLabel]) {
      const [colIdx, targetVal] = COL_MATCH[activeLabel];
      return normalizedRows.filter((r) => {
        const val = colIdx === 2 ? r.c : colIdx === 1 ? r.b : colIdx === 3 ? r.d : r.a;
        return String(val).trim() === targetVal;
      });
    }
    if (activeLabel === "Monthly") {
      return normalizedRows.filter((r) => r.c && r.c !== "—");
    }
    if (activeLabel === "Yearly") {
      return normalizedRows.filter((r) => r.b && (String(r.b).startsWith("€") || r.b === "Free"));
    }
    const needles = (ALIAS[activeLabel] || [activeLabel.toLowerCase()]).map((x) => x.toLowerCase());
    if (!needles.length) return normalizedRows;
    const hit = normalizedRows.filter((r) => {
      const hay = [r.a, r.b, r.c, r.d, r.e].join(" | ").toLowerCase();
      return needles.some((n) => hay.includes(n));
    });
    return hit.length ? hit : [];
  }, [normalizedRows, activeLabel, pageTitle]);

  // Canonical row drawer resolver (lines 1539-1554)
  const resolveRowDrawer = (row) => {
    if (onEditRow) {
      onEditRow(row);
      return;
    }
    if (pageTitle === "Settings") {
      const n = String(row.a);
      if (/policy|Terms/i.test(n)) return openDrawer("settingDoc");
      if (/About/i.test(n)) return openDrawer("settingText");
      if (/Admin/i.test(n)) return openDrawer("settingAccess");
      return openDrawer("settingData");
    }
    const navMap = {
      Workouts: "workout",
      "Workout library": "workout",
      Masterclasses: "workout",
      Challenges: "challenge",
      Community: "broadcast",
      Applications: "application",
      "Help & Support": "support",
      "Help & support": "support",
      Quotes: "quote",
      "Daily inspiration": "quote",
      "Feature Flags": "flag",
      "Feature flags": "flag",
      "Notification Templates": "template",
      "Notification templates": "template",
      FAQ: "faq",
      "Audit Logs": "audit",
      "Audit log": "audit",
      Subscriptions: "pricing",
    };
    const drawerKey = navMap[pageTitle] || "message";
    openDrawer(drawerKey, { TITLE: row.a, WHO: row.a });
  };

  const handleAdviceClick = () => {
    if (onAdvice) {
      onAdvice();
      return;
    }
    const adviceDrawerMap = {
      "All Users": "message",
      "All users": "message",
      "All Subscribers": "message",
      "All subscribers": "message",
      Community: "broadcast",
      Workouts: "workout",
      "Workout library": "workout",
      Challenges: "challenge",
      Masterclasses: "broadcast",
      Applications: "application",
      "Help & Support": "support",
      "Help & support": "support",
      Quotes: "quote",
      "Daily inspiration": "quote",
      "Feature Flags": "flag",
      "Feature flags": "flag",
      "Notification Templates": "template",
      "Notification templates": "template",
      FAQ: "faq",
      Settings: "settingDoc",
      "Audit Logs": "audit",
      "Audit log": "audit",
    };
    const target = adviceDrawerMap[pageTitle];
    if (target) {
      openDrawer(target);
      return;
    }
    setAdviceAcknowledged((prev) => !prev);
    showToast("Action added to today's queue.");
  };

  const handlePrimaryClick = () => {
    if (onPrimary) {
      onPrimary();
      return;
    }
    const primaryDrawerMap = {
      Workouts: "workout",
      "Workout library": "workout",
      Challenges: "challenge",
      Community: "broadcast",
      "All Users": "message",
      "All users": "message",
      "All Subscribers": "message",
      "All subscribers": "message",
      Masterclasses: "workout",
      Subscriptions: "pricing",
      Applications: "application",
      "Help & Support": "support",
      "Help & support": "support",
      Quotes: "quote",
      "Daily inspiration": "quote",
      "Feature Flags": "flag",
      "Feature flags": "flag",
      "Notification Templates": "newTemplate",
      "Notification templates": "newTemplate",
      FAQ: "faq",
      Settings: "settingDoc",
      "Audit Logs": "audit",
      "Audit log": "audit",
    };
    const target = primaryDrawerMap[pageTitle];
    if (target) {
      openDrawer(target);
    } else {
      showToast(`${pagePrimary} — opened.`);
    }
  };

  const handleSecondaryClick = () => {
    if (onSecondary) {
      onSecondary();
      return;
    }
    const secondaryDrawerMap = {
      Workouts: "vimeo",
      "Workout library": "vimeo",
      Masterclasses: "vimeo",
      Challenges: "challenge",
      Subscriptions: "pricing",
      Applications: "application",
      "Help & Support": "support",
      "Help & support": "support",
      Quotes: "quote",
      "Daily inspiration": "quote",
      "Feature Flags": "flag",
      "Feature flags": "flag",
      "Notification Templates": "template",
      "Notification templates": "template",
      FAQ: "faq",
      Settings: "settingText",
      "Audit Logs": "audit",
      "Audit log": "audit",
    };
    const target = secondaryDrawerMap[pageTitle];
    if (target) {
      openDrawer(target);
    } else {
      // Standard CSV Export fallback
      const headers = [cols[0] || "Title", cols[1] || "Type", cols[2] || "Detail", cols[3] || "Activity", cols[4] || "Status"].join(",");
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers, ...normalizedRows.map((r) => `"${r.a}","${r.b}","${r.c}","${r.d}","${r.e}"`)].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${pageTitle.toLowerCase().replace(/\s+/g, "_")}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported ${normalizedRows.length} records to CSV.`);
    }
  };

  const handleDeleteClick = (row, e) => {
    e.stopPropagation();
    if (onDeleteRow) {
      onDeleteRow(row.raw || row);
    } else {
      showToast(`Removed ${row.a}`);
    }
  };

  // Header column calculation: [cols[0] + " · " + cols[1], cols[2], cols[3], cols[4]]
  const headerCols = useMemo(() => {
    if (!cols || !cols.length) return [];
    return [
      `${cols[0] || "ITEM"} · ${cols[1] || "SUBTITLE"}`,
      cols[2] || "DETAIL",
      cols[3] || "ACTIVITY",
      cols[4] || "STATUS",
    ];
  }, [cols]);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: t.text }} className="animate-in fade-in duration-200">
      {/* Page Header: Title, Subtitle, and Primary/Secondary Action Buttons (lines 395-405) */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "26px", flexWrap: "wrap", marginBottom: "20px" }}>
        <div>
          {pageKicker && (
            <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".18em", color: "#B5651D", marginBottom: "8px", textTransform: "uppercase" }}>
              {pageKicker}
            </div>
          )}
          <h1 style={{ margin: "0 0 8px", font: "600 34px/1.06 'Clash Display', 'DM Sans', sans-serif", color: t.text, letterSpacing: "-.015em" }}>
            {pageTitle}
          </h1>
          {pageSub && (
            <p style={{ margin: 0, maxWidth: "600px", font: "400 14.5px/1.6 'Inter', sans-serif", color: t.subtext, textWrap: "pretty" }}>
              {pageSub}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {extraHeaderActions}
          {pageSecondary && (
            <div
              onClick={handleSecondaryClick}
              style={{
                height: "44px",
                padding: "0 18px",
                borderRadius: "12px",
                boxSizing: "border-box",
                border: `1.5px solid ${t.secondaryBtnBorder}`,
                color: t.secondaryBtnText,
                font: "700 13.5px 'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
                background: isDark ? "transparent" : "#FFFFFF",
              }}
            >
              {pageSecondary}
            </div>
          )}
          <div
            onClick={handlePrimaryClick}
            style={{
              height: "44px",
              padding: "0 18px",
              borderRadius: "12px",
              background: "#C9943A",
              color: "#0D0D0D",
              font: "700 13.5px 'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              userSelect: "none",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#d8a24a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C9943A")}
          >
            {pagePrimary}
          </div>
        </div>
      </div>

      {/* 4 Key Stat Cards (lines 407-415 & 1778-1780) */}
      {pageStats && pageStats.length > 0 && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "18px" }}>
          {pageStats.map((p, idx) => {
            const label = Array.isArray(p) ? p[0] : p.k;
            const val = Array.isArray(p) ? p[1] : p.v;
            const note = Array.isArray(p) ? p[2] : p.note;
            return (
              <div
                key={label || idx}
                style={{
                  flex: "1 1 200px",
                  minWidth: "190px",
                  background: t.cardBg,
                  borderRadius: "18px",
                  borderLeft: "4px solid #C9943A",
                  border: `1px solid ${t.cardBorder}`,
                  boxShadow: t.cardShadow,
                  padding: "17px 18px",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: ".14em", color: t.muted, marginBottom: "8px" }}>
                  {label}
                </div>
                <div style={{ font: "700 27px/1 'JetBrains Mono', monospace", color: t.text }}>
                  {val}
                </div>
                <div style={{ font: "400 12px/1.45 'Inter', sans-serif", color: t.subtext, marginTop: "7px" }}>
                  {note}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actionable Advice Banner (lines 417-423 & 1911-1921) */}
      {pageAdvice && (() => {
        const adviceCard = (
          <div
            style={{
              background: t.cardBg,
              borderRadius: "20px",
              borderLeft: "4px solid #B5651D",
              border: `1px solid ${t.cardBorder}`,
              boxShadow: t.cardShadow,
              padding: "18px 20px",
              marginBottom: adviceAudit ? "0" : "18px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              boxSizing: "border-box",
            }}
          >
            <div style={{ flex: "1 1 240px", minWidth: "240px" }}>
              <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".14em", color: "#C9943A", marginBottom: "5px" }}>
                WHAT TO DO ON THIS PAGE
              </div>
              <div style={{ font: "400 14px/1.55 'Inter', sans-serif", color: isDark ? "rgba(247,243,238,.8)" : "rgba(13,43,69,.8)", textWrap: "pretty" }}>
                {pageAdvice}
              </div>
            </div>
            <div
              onClick={handleAdviceClick}
              style={{
                height: "44px",
                padding: "0 18px",
                borderRadius: "12px",
                boxSizing: "border-box",
                font: "700 13.5px 'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                flex: "none",
                userSelect: "none",
                ...(adviceAcknowledged
                  ? { border: "1.5px solid rgba(95,196,142,.6)", color: "#5FC48E", background: "transparent" }
                  : { background: "#C9943A", color: "#0D0D0D", border: "1.5px solid #C9943A" }),
              }}
            >
              {adviceAcknowledged ? "Done — added to today's queue" : (pageAdviceDone || "Execute recommendation →")}
            </div>
          </div>
        );

        if (adviceAudit) {
          return (
            <RequirementAuditBoundary
              auditId={adviceAudit.auditId}
              status={adviceAudit.status || "extra"}
              label={adviceAudit.label}
              className="mb-[18px]"
            >
              {adviceCard}
            </RequirementAuditBoundary>
          );
        }

        return adviceCard;
      })()}

      {/* Mobile Mirror Rail (e.g. for Challenges, lines 425-448) */}
      {(railFeatured || (rail && rail.length > 0)) && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "11px" }}>
            <span style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".15em", color: "#C9943A" }}>
              FEATURED CARD · TOP 5 MOST JOINED
            </span>
            <span style={{ font: "500 11.5px 'JetBrains Mono', monospace", color: t.muted }}>
              mirrors the challenge screen
            </span>
          </div>
          {railFeatured && (
            <div
              style={{
                marginBottom: "11px",
                width: "min(100%, 520px)",
                background: t.cardBg,
                borderRadius: "16px",
                border: `1px solid ${t.cardBorder}`,
                borderLeft: "4px solid #C9943A",
                boxShadow: t.cardShadow,
                padding: "16px 18px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "7px" }}>
                <span style={{ font: "700 11px 'DM Sans', sans-serif", letterSpacing: ".14em", color: "#C9943A" }}>FEATURED CARD</span>
                <span style={{ font: "700 12px 'JetBrains Mono', monospace", color: "#C9943A" }}>{railFeatured.joined}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "700 18px/1.25 'DM Sans', sans-serif", color: t.text }}>{railFeatured.n}</div>
                  <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".1em", color: t.muted, marginTop: "5px", textTransform: "uppercase" }}>
                    {railFeatured.d} · {railFeatured.type}
                  </div>
                </div>
                <div
                  onClick={() => (railFeatured.onEdit ? railFeatured.onEdit() : openDrawer("challenge"))}
                  style={{
                    height: "36px",
                    minWidth: "96px",
                    borderRadius: "10px",
                    boxSizing: "border-box",
                    border: "1.5px solid rgba(201,148,58,.7)",
                    color: "#C9943A",
                    font: "700 12px 'DM Sans', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  Edit
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "11px", overflowX: "auto", paddingBottom: "4px" }}>
            {(rail || []).map((c, i) => (
              <div
                key={c.n || i}
                style={{
                  width: "210px",
                  flex: "none",
                  background: t.cardBg,
                  borderRadius: "16px",
                  borderLeft: "3px solid #B5651D",
                  border: `1px solid ${t.cardBorder}`,
                  boxShadow: t.cardShadow,
                  padding: "15px 16px",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "7px" }}>
                  <span style={{ font: "700 20px 'JetBrains Mono', monospace", color: t.text }}>{c.d}</span>
                  <span style={{ font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: ".1em", color: "#C9943A" }}>{c.type}</span>
                </div>
                <div style={{ font: "600 15px/1.3 'DM Sans', sans-serif", color: t.text }}>{c.n}</div>
                <div style={{ font: "400 11.5px 'JetBrains Mono', monospace", color: t.muted, marginTop: "5px" }}>{c.joined}</div>
                <div style={{ display: "flex", gap: "7px", marginTop: "12px" }}>
                  <div
                    onClick={() => (c.onEdit ? c.onEdit() : openDrawer("challenge"))}
                    style={{
                      flex: 1,
                      height: "34px",
                      borderRadius: "9px",
                      boxSizing: "border-box",
                      border: "1.5px solid rgba(201,148,58,.6)",
                      color: "#C9943A",
                      font: "700 12px 'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Edit
                  </div>
                  <div
                    onClick={() => (c.onRemove ? c.onRemove() : showToast(`Removed ${c.n}`))}
                    style={{
                      width: "38px",
                      height: "34px",
                      borderRadius: "9px",
                      boxSizing: "border-box",
                      border: "1.5px solid rgba(217,138,62,.55)",
                      color: "#D98A3E",
                      font: "700 13px 'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    ×
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs Row & Item Count (lines 450-453 & 1781-1785) */}
      {filters && filters.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          {filters.map((f, i) => {
            const on = i === activeFilterIdx;
            return (
              <div
                key={f}
                onClick={() => {
                  setActiveFilterIdx(i);
                  setSelectedId(null);
                }}
                style={{
                  padding: "9px 15px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  font: `${on ? "700" : "500"} 12.5px 'DM Sans', sans-serif`,
                  ...(on
                    ? { background: "#C9943A", color: "#0D0D0D" }
                    : { boxSizing: "border-box", border: `1px solid ${t.filterBorder}`, color: t.filterInactiveText, background: isDark ? "transparent" : "#FAF7F2" }),
                  userSelect: "none",
                }}
              >
                {f}
              </div>
            );
          })}
          <span style={{ font: "700 11.5px 'JetBrains Mono', monospace", color: "#C9943A", marginLeft: "6px" }}>
            {filteredRows.length} of {normalizedRows.length} shown
          </span>
        </div>
      )}

      {/* Canonical Table: Exact 1:1 Grid Layout (lines 455-477 & 1556-1558 & 1933-1948) */}
      <div
        style={{
          background: t.cardBg,
          borderRadius: "20px",
          border: `1px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
          overflow: "hidden",
        }}
      >
        {/* Table Header Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.6fr) minmax(0, 2.2fr) minmax(0, 1.3fr) minmax(0, 1.3fr) 88px",
            gap: "12px",
            alignItems: "start",
            padding: "13px 20px",
            borderBottom: `1px solid ${t.borderMedium}`,
            background: t.tableHeaderBg,
          }}
        >
          {headerCols.map((name, i) => (
            <span
              key={i}
              style={{
                minWidth: 0,
                font: "500 9.5px 'DM Sans', sans-serif",
                letterSpacing: ".13em",
                color: t.muted,
                textAlign: i === 3 ? "right" : "left",
              }}
            >
              {name}
            </span>
          ))}
          <span style={{ minWidth: 0 }} />
        </div>

        {/* Table Body Rows */}
        {isLoading && filteredRows.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div className="w-7 h-7 border-2 border-[#C9943A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div style={{ font: "400 12px 'JetBrains Mono', monospace", color: t.muted }}>
              Loading records...
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div
            style={{
              padding: "34px 20px",
              textAlign: "center",
              font: "400 13.5px 'Inter', sans-serif",
              color: t.muted,
            }}
          >
            Nothing matches this filter. Good news, usually.
          </div>
        ) : (
          <div>
            {filteredRows.map((r, i, arr) => {
              const selected = selectedId === r.id;
              const ink = r.tone === "good" ? "#1A7A4A" : r.tone === "warn" ? "#C9943A" : "#B5651D";
              const rowAudit = r.raw?.audit;
              const rowProfileImage =
                r.profileImage ||
                r.raw?.profileImage ||
                r.raw?.rawData?.profileImage ||
                r.raw?.rawData?.profile_image ||
                r.raw?.rawData?.author_profile_image ||
                "";
              const rowElement = (
                <div
                  onClick={() => {
                    setSelectedId(selected ? null : r.id);
                    if (onRowClick) onRowClick(r.raw || r);
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 2.6fr) minmax(0, 2.2fr) minmax(0, 1.3fr) minmax(0, 1.3fr) auto",
                    gap: "12px",
                    alignItems: "start",
                    padding: "15px 20px",
                    cursor: "pointer",
                    borderBottom: i < arr.length - 1 ? `1px solid ${t.borderSubtle}` : "none",
                    ...(selected
                      ? { background: isDark ? "rgba(201,148,58,.13)" : "rgba(201,148,58,.16)", boxShadow: "inset 3px 0 0 #C9943A" }
                      : {}),
                    transition: "background 0.12s ease",
                  }}
                >
                  {/* Column 0: r.a & r.b */}
                  <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    {rowProfileImage ? (
                      <img
                        src={rowProfileImage}
                        alt={r.a || "Profile"}
                        onError={(event) => {
                          event.currentTarget.src = "/userimg.png";
                        }}
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "999px",
                          objectFit: "cover",
                          flex: "none",
                          border: "1px solid rgba(201,148,58,0.35)",
                        }}
                      />
                    ) : null}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ font: "600 14.5px/1.3 'DM Sans', sans-serif", color: t.text, overflowWrap: "break-word" }}>
                        {r.a}
                      </div>
                      {r.b && (
                        <div
                          style={{
                            font: "500 11.5px/1.35 'JetBrains Mono', monospace",
                            color: t.muted,
                            marginTop: "4px",
                            overflowWrap: "break-word",
                          }}
                        >
                          {r.b}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 1: r.c */}
                  <span
                    style={{
                      minWidth: 0,
                      font: "500 13px/1.35 'DM Sans', sans-serif",
                      color: t.subtext,
                      overflowWrap: "break-word",
                    }}
                  >
                    {r.c}
                  </span>

                  {/* Column 2: r.d */}
                  <span
                    style={{
                      minWidth: 0,
                      font: "500 12px/1.35 'JetBrains Mono', monospace",
                      color: t.subtext,
                      overflowWrap: "break-word",
                    }}
                  >
                    {r.d}
                  </span>

                  {/* Column 3: r.e with exact color ink */}
                  <span
                    style={{
                      minWidth: 0,
                      textAlign: "right",
                      font: "700 12.5px/1.35 'DM Sans', sans-serif",
                      color: ink,
                      overflowWrap: "break-word",
                    }}
                  >
                    {r.e}
                  </span>

                  {/* Column 4: Edit & Delete Action Buttons (lines 468-472) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}
                  >
                    {renderRowActions ? (
                      renderRowActions(r.raw || r, { isDark, resolveRowDrawer: () => resolveRowDrawer(r), handleDelete: (e) => handleDeleteClick(r, e) })
                    ) : (
                      <>
                        <div
                          onClick={() => resolveRowDrawer(r)}
                          style={{
                            height: "30px",
                            padding: "0 10px",
                            borderRadius: "8px",
                            boxSizing: "border-box",
                            border: "1.5px solid rgba(201,148,58,.55)",
                            color: "#C9943A",
                            font: "700 11.5px 'DM Sans', sans-serif",
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            userSelect: "none",
                            background: isDark ? "transparent" : "#FAF7F2",
                          }}
                        >
                          Edit
                        </div>
                        {!hideDeleteActions ? (
                          <div
                            onClick={(e) => handleDeleteClick(r, e)}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "8px",
                              boxSizing: "border-box",
                              border: "1.5px solid rgba(217,138,62,.5)",
                              color: "#D98A3E",
                              font: "700 13px 'DM Sans', sans-serif",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              flex: "none",
                              userSelect: "none",
                              background: isDark ? "transparent" : "#FAF7F2",
                            }}
                          >
                            ×
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              );

              if (rowAudit) {
                return (
                  <RequirementAuditBoundary
                    key={r.id}
                    auditId={rowAudit.auditId}
                    status={rowAudit.status}
                    label={rowAudit.label}
                    className="my-1"
                  >
                    {rowElement}
                  </RequirementAuditBoundary>
                );
              }

              return <div key={r.id}>{rowElement}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
