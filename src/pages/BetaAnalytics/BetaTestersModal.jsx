import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext";
import { adminApiRequest } from "../../../services/auth.service";
import { blockAdminUser, deleteAdminUser, restoreAdminUser } from "../../../services/admin-users.service";

const PAGE_SIZE = 7;

export default function BetaTestersModal({ isOpen, onClose, testers = [], countryCount = 0, onRefresh }) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingTesterId, setSendingTesterId] = useState("");
  const [managingTesterId, setManagingTesterId] = useState("");
  const [notice, setNotice] = useState("");

  // Close on Escape & Lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    const total = testers.length;
    let active = 0;
    let atRisk = 0;
    let silent = 0;

    testers.forEach((item) => {
      const state = String(item.state || "").toUpperCase();
      if (state === "ACTIVE") active++;
      else if (state === "AT RISK") atRisk++;
      else if (state === "SILENT") silent++;
    });
    const blocked = testers.filter((item) => item.isBlocked || item.isDeleted).length;

    return { total, active, atRisk, silent, blocked };
  }, [testers]);

  // Filtered testers
  const filteredTesters = useMemo(() => {
    return testers.filter((item) => {
      // Status filter
      if (selectedFilter !== "ALL") {
        const itemState = String(item.state || "").toUpperCase();
        if (selectedFilter === "ACTIVE" && itemState !== "ACTIVE") return false;
        if (selectedFilter === "AT RISK" && itemState !== "AT RISK") return false;
        if (selectedFilter === "SILENT" && itemState !== "SILENT") return false;
        if (selectedFilter === "BLOCKED" && !item.isBlocked && !item.isDeleted) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = (item.name || "").toLowerCase().includes(query);
        const emailMatch = (item.email || "").toLowerCase().includes(query);
        const countryMatch = (item.country || "").toLowerCase().includes(query);
        const stateMatch = (item.state || "").toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !countryMatch && !stateMatch) return false;
      }

      return true;
    });
  }, [testers, selectedFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTesters.length / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTesters = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
    return filteredTesters.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTesters, validCurrentPage]);

  const startIndexDisplay = filteredTesters.length === 0 ? 0 : (validCurrentPage - 1) * PAGE_SIZE + 1;
  const endIndexDisplay = Math.min(validCurrentPage * PAGE_SIZE, filteredTesters.length);

  if (!isOpen) return null;

  const t = {
    modalBg: isDark ? "#0D2B45" : "#FFFFFF",
    headerBg: isDark ? "#0A243A" : "#FAF7F2",
    footerBg: isDark ? "#0A243A" : "#FAF7F2",
    tableHeaderBg: isDark ? "rgba(247, 243, 238, 0.03)" : "rgba(13, 43, 69, 0.02)",
    cardBorder: isDark ? "rgba(247, 243, 238, 0.12)" : "rgba(13, 43, 69, 0.1)",
    rowBorder: isDark ? "rgba(247, 243, 238, 0.08)" : "rgba(13, 43, 69, 0.06)",
    rowHoverBg: isDark ? "rgba(247, 243, 238, 0.04)" : "rgba(13, 43, 69, 0.025)",
    text: isDark ? "#F7F3EE" : "#0D2B45",
    subtext: isDark ? "rgba(247, 243, 238, 0.68)" : "rgba(13, 43, 69, 0.72)",
    muted: isDark ? "rgba(247, 243, 238, 0.45)" : "rgba(13, 43, 69, 0.52)",
    inputBg: isDark ? "rgba(247, 243, 238, 0.06)" : "#FFFFFF",
    inputBorder: isDark ? "rgba(247, 243, 238, 0.15)" : "rgba(13, 43, 69, 0.15)",
    statCardBg: isDark ? "rgba(247, 243, 238, 0.04)" : "#FAF7F2",
  };

  const formatLastActiveTime = (val) => {
    if (!val) return "Never";
    const date = new Date(val);
    if (Number.isNaN(date.getTime())) return "Never";
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  const buildOutreachCopy = (tester) => {
    const name = String(tester?.name || "there").split(" ")[0] || "there";
    const state = String(tester?.state || "").toUpperCase();
    if (state === "SILENT") {
      return {
        subject: "Your 21-Day Gold Beta is ready",
        body: `Hi ${name},\n\nYour Victory Fitness 21-Day Gold Beta is open. Start with one workout today so we can learn what works for you.\n\n- Victory Fitness`,
        notificationTitle: "Your Gold Beta is ready",
        notificationMessage: "Start with one workout today and keep your 21-day beta moving.",
      };
    }
    if (state === "AT RISK") {
      return {
        subject: "Keep your 21-Day Gold Beta moving",
        body: `Hi ${name},\n\nYou still have ${tester?.daysRemaining ?? ""} days left in your Gold Beta. Open Victory Fitness today and log one action so your progress does not stall.\n\n- Victory Fitness`,
        notificationTitle: "Keep your beta moving",
        notificationMessage: "Open Victory Fitness today and log one action before your beta momentum drops.",
      };
    }
    return {
      subject: "Your Victory Fitness beta progress",
      body: `Hi ${name},\n\nThanks for being active in the 21-Day Gold Beta. Keep going today and send us any feedback you notice.\n\n- Victory Fitness`,
      notificationTitle: "Your beta progress is moving",
      notificationMessage: "Keep going today and send us any feedback you notice.",
    };
  };

  const handleEmailTester = (tester) => {
    if (!tester?.email) {
      setNotice("This tester does not have an email address.");
      return;
    }
    const copy = buildOutreachCopy(tester);
    window.location.href = `mailto:${encodeURIComponent(tester.email)}?subject=${encodeURIComponent(copy.subject)}&body=${encodeURIComponent(copy.body)}`;
  };

  const handleNotifyTester = async (tester) => {
    if (tester?.isBlocked || tester?.isDeleted) {
      setNotice("Restore this tester before sending app notifications.");
      return;
    }
    const testerId = tester?.id || tester?.email;
    if (!testerId) {
      setNotice("This tester cannot be notified because no account id was found.");
      return;
    }
    const copy = buildOutreachCopy(tester);
    setSendingTesterId(testerId);
    setNotice("");
    try {
      const response = await adminApiRequest(`/admin/trials/phase-one-beta/testers/${encodeURIComponent(testerId)}/notify`, {
        method: "POST",
        body: {
          title: copy.notificationTitle,
          message: copy.notificationMessage,
        },
      });
      setNotice(`Notification queued for ${tester.name}. Status: ${response.status || "queued"}.`);
    } catch (error) {
      setNotice(error?.message || "Could not send notification.");
    } finally {
      setSendingTesterId("");
    }
  };

  const refreshAfterAccountAction = async () => {
    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  const handleBlockTester = async (tester) => {
    if (!tester?.id) {
      setNotice("This tester cannot be blocked because no account id was found.");
      return;
    }
    if (!window.confirm(`Block "${tester.name}"? Their current app session will expire immediately.`)) {
      return;
    }
    setManagingTesterId(tester.id);
    setNotice("");
    try {
      await blockAdminUser(tester.id);
      await refreshAfterAccountAction();
      setNotice(`${tester.name} was blocked and their session was expired.`);
    } catch (error) {
      setNotice(error?.message || "Could not block tester.");
    } finally {
      setManagingTesterId("");
    }
  };

  const handleDeleteTester = async (tester) => {
    if (!tester?.id) {
      setNotice("This tester cannot be deleted because no account id was found.");
      return;
    }
    if (!window.confirm(`Delete "${tester.name}"? The account will be hidden, recoverable, and logged out immediately.`)) {
      return;
    }
    setManagingTesterId(tester.id);
    setNotice("");
    try {
      await deleteAdminUser(tester.id);
      await refreshAfterAccountAction();
      setNotice(`${tester.name} was deleted and logged out.`);
    } catch (error) {
      setNotice(error?.message || "Could not delete tester.");
    } finally {
      setManagingTesterId("");
    }
  };

  const handleRestoreTester = async (tester) => {
    if (!tester?.id) {
      setNotice("This tester cannot be restored because no account id was found.");
      return;
    }
    if (!window.confirm(`Restore "${tester.name}"? They will be able to sign in again.`)) {
      return;
    }
    setManagingTesterId(tester.id);
    setNotice("");
    try {
      await restoreAdminUser(tester.id);
      await refreshAfterAccountAction();
      setNotice(`${tester.name} was restored and can sign in again.`);
    } catch (error) {
      setNotice(error?.message || "Could not restore tester.");
    } finally {
      setManagingTesterId("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 transition-all duration-200"
      style={{
        backgroundColor: "rgba(3, 14, 24, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[1280px] rounded-[24px] flex flex-col max-h-[92vh] overflow-hidden my-auto shadow-2xl transition-all duration-300"
        style={{
          background: t.modalBg,
          color: t.text,
          border: `1px solid ${t.cardBorder}`,
          boxShadow: isDark
            ? "0 25px 70px rgba(0,0,0,0.85), 0 0 0 1px rgba(201,148,58,0.22)"
            : "0 25px 70px rgba(13,43,69,0.18), 0 0 0 1px rgba(201,148,58,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="testers-modal-title"
      >
        {/* Modal Header */}
        <div
          className="px-6 py-5 sm:px-8 sm:py-6 flex items-start justify-between gap-4 border-b shrink-0"
          style={{
            background: t.headerBg,
            borderColor: t.cardBorder,
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                style={{
                  font: "700 9.5px 'DM Sans', sans-serif",
                  letterSpacing: ".16em",
                  color: "#C9943A",
                  background: isDark ? "rgba(201,148,58,0.14)" : "rgba(201,148,58,0.16)",
                  border: "1px solid rgba(201,148,58,0.3)",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: "#C9943A",
                    display: "inline-block",
                  }}
                />
                21-DAY GOLD BETA · COHORT AUDIT
              </span>
              <span
                style={{
                  font: "600 11px 'JetBrains Mono', monospace",
                  color: t.muted,
                }}
              >
                {testers.length} ENROLLED · {countryCount || 6} COUNTRIES
              </span>
            </div>

            <h2
              id="testers-modal-title"
              style={{
                font: "600 24px/1.2 'Clash Display', 'DM Sans', sans-serif",
                color: t.text,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              All Beta Testers
            </h2>
            <p
              style={{
                font: "400 13px 'Inter', sans-serif",
                color: t.subtext,
                margin: "4px 0 0",
              }}
            >
              Comprehensive cohort roster showing active day, recorded actions, and retention state.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0"
            style={{
              background: isDark ? "rgba(247,243,238,0.08)" : "rgba(13,43,69,0.07)",
              color: t.subtext,
              border: `1px solid ${t.cardBorder}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = t.text;
              e.currentTarget.style.borderColor = "#C9943A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = t.subtext;
              e.currentTarget.style.borderColor = t.cardBorder;
            }}
          >
            <span style={{ fontSize: "20px", lineHeight: "1", fontWeight: 300 }}>×</span>
          </button>
        </div>

        {/* Filter & Metric Summary Bar */}
        <div
          className="px-6 py-3.5 sm:px-8 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
          style={{
            borderColor: t.cardBorder,
            background: isDark ? "rgba(247,243,238,0.015)" : "#FFFFFF",
          }}
        >
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "All Testers", count: counts.total, color: "#C9943A" },
              { id: "ACTIVE", label: "Active", count: counts.active, color: isDark ? "#5FC48E" : "#1A7A4A" },
              { id: "AT RISK", label: "At Risk", count: counts.atRisk, color: "#C9943A" },
              { id: "SILENT", label: "Silent", count: counts.silent, color: isDark ? "#D98A3E" : "#B5651D" },
              { id: "BLOCKED", label: "Blocked", count: counts.blocked, color: "#D85F4A" },
            ].map((tab) => {
              const active = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id)}
                  style={{
                    font: "600 12px 'DM Sans', sans-serif",
                    padding: "6px 12px",
                    borderRadius: "99px",
                    cursor: "pointer",
                    border: active ? "1.5px solid #C9943A" : `1px solid ${t.cardBorder}`,
                    background: active
                      ? isDark
                        ? "rgba(201,148,58,0.18)"
                        : "rgba(201,148,58,0.12)"
                      : "transparent",
                    color: active ? (isDark ? "#F7F3EE" : "#0D2B45") : t.muted,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: tab.color,
                      display: "inline-block",
                    }}
                  />
                  <span>{tab.label}</span>
                  <span
                    style={{
                      font: "700 10.5px 'JetBrains Mono', monospace",
                      background: active
                        ? isDark
                          ? "rgba(201,148,58,0.3)"
                          : "rgba(201,148,58,0.22)"
                        : isDark
                        ? "rgba(247,243,238,0.08)"
                        : "rgba(13,43,69,0.06)",
                      color: active ? (isDark ? "#F7F3EE" : "#0D2B45") : t.muted,
                      padding: "1px 6px",
                      borderRadius: "99px",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px] max-w-xs flex-1 sm:flex-initial">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tester, email, country..."
              style={{
                width: "100%",
                height: "36px",
                padding: "0 12px 0 32px",
                borderRadius: "10px",
                fontSize: "12.5px",
                fontFamily: "'DM Sans', sans-serif",
                background: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#C9943A";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = t.inputBorder;
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: t.muted,
                fontSize: "13px",
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: t.muted,
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
              >
                ✕
              </button>
            )}
          </div>
          {notice ? (
            <div
              style={{
                width: "100%",
                border: `1px solid ${notice.toLowerCase().includes("could not") ? "rgba(217,138,62,0.45)" : "rgba(95,196,142,0.35)"}`,
                background: notice.toLowerCase().includes("could not")
                  ? "rgba(217,138,62,0.1)"
                  : "rgba(95,196,142,0.1)",
                color: notice.toLowerCase().includes("could not")
                  ? isDark ? "#D98A3E" : "#B5651D"
                  : isDark ? "#5FC48E" : "#1A7A4A",
                borderRadius: "10px",
                padding: "9px 12px",
                font: "600 12px 'DM Sans', sans-serif",
              }}
            >
              {notice}
            </div>
          ) : null}
        </div>

        {/* Table Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-[320px]">
          {filteredTesters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: isDark ? "rgba(247,243,238,0.06)" : "rgba(13,43,69,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  fontSize: "20px",
                }}
              >
                👥
              </div>
              <p style={{ font: "600 15px 'DM Sans', sans-serif", color: t.text, margin: 0 }}>
                No testers found
              </p>
              <p style={{ font: "400 13px 'Inter', sans-serif", color: t.muted, margin: "4px 0 0" }}>
                {searchQuery
                  ? `No testers match "${searchQuery}". Try a different keyword.`
                  : "No testers match the selected filter category."}
              </p>
            </div>
          ) : (
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr
                  style={{
                    background: t.tableHeaderBg,
                    borderBottom: `1px solid ${t.cardBorder}`,
                  }}
                >
                  <th
                    style={{
                      font: "700 9.5px 'JetBrains Mono', monospace",
                      letterSpacing: ".12em",
                      color: t.muted,
                      padding: "12px 24px",
                      width: "24%",
                    }}
                  >
                    TESTER
                  </th>
                  <th
                    style={{
                      font: "700 9.5px 'JetBrains Mono', monospace",
                      letterSpacing: ".12em",
                      color: t.muted,
                      padding: "12px 16px",
                      width: "11%",
                    }}
                  >
                    COUNTRY
                  </th>
                  <th
                    style={{
                      font: "700 9.5px 'JetBrains Mono', monospace",
                      letterSpacing: ".12em",
                      color: t.muted,
                      padding: "12px 16px",
                      width: "10%",
                    }}
                  >
                    PROGRESS
                  </th>
                  <th
                    style={{
                      font: "700 9.5px 'JetBrains Mono', monospace",
                      letterSpacing: ".12em",
                      color: t.muted,
                      padding: "12px 16px",
                      width: "12%",
                    }}
                  >
                    ACTIVITY
                  </th>
                  <th
                    style={{
                      font: "700 9.5px 'JetBrains Mono', monospace",
                      letterSpacing: ".12em",
                      color: t.muted,
                      padding: "12px 16px",
                      width: "10%",
                    }}
                  >
                    LAST ACTIVE
                  </th>
                  <th
                    style={{
                      font: "700 9.5px 'JetBrains Mono', monospace",
                      letterSpacing: ".12em",
                      color: t.muted,
                      padding: "12px 24px",
                      width: "11%",
                      textAlign: "right",
                    }}
                  >
                    STATE
                  </th>
                  <th
                    style={{
                      font: "700 9.5px 'JetBrains Mono', monospace",
                      letterSpacing: ".12em",
                      color: t.muted,
                      padding: "12px 24px 12px 12px",
                      width: "11%",
                      textAlign: "right",
                    }}
                  >
                    ACCOUNT
                  </th>
                  <th
                    style={{
                      font: "700 9.5px 'JetBrains Mono', monospace",
                      letterSpacing: ".12em",
                      color: t.muted,
                      padding: "12px 24px 12px 12px",
                      width: "11%",
                      textAlign: "right",
                    }}
                  >
                    OUTREACH
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTesters.map((tItem, idx) => {
                  const stateColor =
                    tItem.tone === "good"
                      ? isDark
                        ? "#5FC48E"
                        : "#1A7A4A"
                      : tItem.tone === "warn"
                      ? "#C9943A"
                      : isDark
                      ? "#D98A3E"
                      : "#B5651D";

                  const stateBg =
                    tItem.tone === "good"
                      ? isDark
                        ? "rgba(95,196,142,0.12)"
                        : "rgba(26,122,74,0.1)"
                      : tItem.tone === "warn"
                      ? isDark
                        ? "rgba(201,148,58,0.14)"
                        : "rgba(201,148,58,0.12)"
                      : isDark
                      ? "rgba(217,138,62,0.14)"
                      : "rgba(181,101,29,0.1)";

                  return (
                    <tr
                      key={tItem.id || `${tItem.email}-${idx}`}
                      style={{
                        borderBottom: `1px solid ${t.rowBorder}`,
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = t.rowHoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* Tester column */}
                      <td style={{ padding: "13px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: isDark ? "rgba(201,148,58,0.16)" : "rgba(201,148,58,0.12)",
                              border: "1px solid rgba(201,148,58,0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                font: "700 12.5px 'DM Sans', sans-serif",
                                color: "#C9943A",
                              }}
                            >
                              {tItem.initials}
                            </span>
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
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
                                font: "400 11.5px 'JetBrains Mono', monospace",
                                color: t.muted,
                                marginTop: "2px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {tItem.email || "No email listed"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Country */}
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            font: "500 12.5px 'DM Sans', sans-serif",
                            color: t.subtext,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span style={{ opacity: 0.6, fontSize: "11px" }}>🌐</span>
                          {tItem.country}
                        </span>
                      </td>

                      {/* Progress / Day */}
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
                          <span
                            style={{
                              font: "700 12.5px 'JetBrains Mono', monospace",
                              color: "#C9943A",
                            }}
                          >
                            {tItem.currentDay ? `Day ${tItem.currentDay}` : "Day -"}
                          </span>
                          <span
                            style={{
                              font: "400 10.5px 'Inter', sans-serif",
                              color: t.muted,
                            }}
                          >
                            {tItem.daysRemaining !== undefined ? `${tItem.daysRemaining}d left` : "of 21 days"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            font: "600 12px 'JetBrains Mono', monospace",
                            color: tItem.totalActions > 0 ? (isDark ? "#F7F3EE" : "#0D2B45") : t.muted,
                            background: tItem.totalActions > 0
                              ? isDark
                                ? "rgba(247,243,238,0.06)"
                                : "rgba(13,43,69,0.05)"
                              : "transparent",
                            padding: tItem.totalActions > 0 ? "3px 8px" : "0",
                            borderRadius: "6px",
                            display: "inline-block",
                          }}
                        >
                          {tItem.totalActions > 0 ? `${tItem.totalActions} actions` : "never opened"}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            font: "500 12px 'DM Sans', sans-serif",
                            color: t.subtext,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatLastActiveTime(tItem.lastActive)}
                        </span>
                      </td>

                      {/* State badge */}
                      <td style={{ padding: "13px 24px", textAlign: "right" }}>
                        <span
                          style={{
                            font: "700 10px 'DM Sans', sans-serif",
                            letterSpacing: ".08em",
                            padding: "4px 9px",
                            borderRadius: "99px",
                            color: stateColor,
                            backgroundColor: stateBg,
                            border: `1px solid ${stateColor}33`,
                            whiteSpace: "nowrap",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              backgroundColor: stateColor,
                            }}
                          />
                          {tItem.state}
                        </span>
                      </td>
                      <td style={{ padding: "13px 24px 13px 12px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                          {tItem.isBlocked || tItem.isDeleted ? (
                            <button
                              type="button"
                              onClick={() => handleRestoreTester(tItem)}
                              disabled={managingTesterId === tItem.id}
                              title="Restore account access"
                              style={{
                                height: "28px",
                                padding: "0 9px",
                                borderRadius: "8px",
                                border: "1px solid rgba(95,196,142,0.55)",
                                background: "transparent",
                                color: isDark ? "#5FC48E" : "#1A7A4A",
                                font: "700 11px 'DM Sans', sans-serif",
                                cursor: managingTesterId === tItem.id ? "wait" : "pointer",
                                opacity: managingTesterId === tItem.id ? 0.65 : 1,
                              }}
                            >
                              {managingTesterId === tItem.id ? "Working" : "Restore"}
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleBlockTester(tItem)}
                                disabled={managingTesterId === tItem.id}
                                title="Block account and expire session"
                                style={{
                                  height: "28px",
                                  padding: "0 9px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(217,138,62,0.55)",
                                  background: "transparent",
                                  color: isDark ? "#D98A3E" : "#B5651D",
                                  font: "700 11px 'DM Sans', sans-serif",
                                  cursor: managingTesterId === tItem.id ? "wait" : "pointer",
                                  opacity: managingTesterId === tItem.id ? 0.65 : 1,
                                }}
                              >
                                Block
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTester(tItem)}
                                disabled={managingTesterId === tItem.id}
                                title="Delete account and expire session"
                                style={{
                                  height: "28px",
                                  padding: "0 9px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(217,95,74,0.55)",
                                  background: "transparent",
                                  color: "#D85F4A",
                                  font: "700 11px 'DM Sans', sans-serif",
                                  cursor: managingTesterId === tItem.id ? "wait" : "pointer",
                                  opacity: managingTesterId === tItem.id ? 0.65 : 1,
                                }}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "13px 24px 13px 12px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            onClick={() => handleEmailTester(tItem)}
                            disabled={!tItem.email}
                            title={tItem.email ? `Email ${tItem.email}` : "No email available"}
                            style={{
                              height: "28px",
                              padding: "0 9px",
                              borderRadius: "8px",
                              border: `1px solid ${t.cardBorder}`,
                              background: isDark ? "rgba(247,243,238,0.05)" : "#FFFFFF",
                              color: tItem.email ? t.text : t.muted,
                              font: "700 11px 'DM Sans', sans-serif",
                              cursor: tItem.email ? "pointer" : "not-allowed",
                              opacity: tItem.email ? 1 : 0.45,
                            }}
                          >
                            Email
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNotifyTester(tItem)}
                            disabled={sendingTesterId === (tItem.id || tItem.email) || tItem.isBlocked || tItem.isDeleted}
                            title="Send in-app notification and push/email when enabled"
                            style={{
                              height: "28px",
                              padding: "0 9px",
                              borderRadius: "8px",
                              border: "1px solid rgba(201,148,58,0.55)",
                              background: sendingTesterId === (tItem.id || tItem.email)
                                ? "rgba(201,148,58,0.12)"
                                : "#C9943A",
                              color: sendingTesterId === (tItem.id || tItem.email) ? "#C9943A" : "#0D0D0D",
                              font: "700 11px 'DM Sans', sans-serif",
                              cursor: sendingTesterId === (tItem.id || tItem.email) ? "wait" : tItem.isBlocked || tItem.isDeleted ? "not-allowed" : "pointer",
                              opacity: tItem.isBlocked || tItem.isDeleted ? 0.5 : 1,
                            }}
                          >
                            {sendingTesterId === (tItem.id || tItem.email) ? "Sending" : "Notify"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer with Pagination */}
        <div
          className="px-6 py-4 sm:px-8 border-t flex flex-wrap items-center justify-between gap-4 shrink-0"
          style={{
            background: t.footerBg,
            borderColor: t.cardBorder,
          }}
        >
          {/* Item count text */}
          <div
            style={{
              font: "500 12.5px 'DM Sans', sans-serif",
              color: t.subtext,
            }}
          >
            Showing{" "}
            <span style={{ fontWeight: 700, color: t.text, fontFamily: "'JetBrains Mono', monospace" }}>
              {startIndexDisplay}
            </span>{" "}
            to{" "}
            <span style={{ fontWeight: 700, color: t.text, fontFamily: "'JetBrains Mono', monospace" }}>
              {endIndexDisplay}
            </span>{" "}
            of{" "}
            <span style={{ fontWeight: 700, color: "#C9943A", fontFamily: "'JetBrains Mono', monospace" }}>
              {filteredTesters.length}
            </span>{" "}
            testers
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5">
            {/* Prev button */}
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                font: "600 12.5px 'DM Sans', sans-serif",
                padding: "6px 12px",
                borderRadius: "8px",
                border: `1px solid ${t.cardBorder}`,
                background: isDark ? "rgba(247,243,238,0.06)" : "#FFFFFF",
                color: validCurrentPage <= 1 ? t.muted : t.text,
                cursor: validCurrentPage <= 1 ? "not-allowed" : "pointer",
                opacity: validCurrentPage <= 1 ? 0.45 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <span>←</span>
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === validCurrentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      font: "700 12px 'JetBrains Mono', monospace",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      border: isActive ? "1.5px solid #C9943A" : `1px solid ${t.cardBorder}`,
                      background: isActive
                        ? "#C9943A"
                        : isDark
                        ? "rgba(247,243,238,0.04)"
                        : "#FFFFFF",
                      color: isActive ? "#0D0D0D" : t.text,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                font: "600 12.5px 'DM Sans', sans-serif",
                padding: "6px 12px",
                borderRadius: "8px",
                border: `1px solid ${t.cardBorder}`,
                background: isDark ? "rgba(247,243,238,0.06)" : "#FFFFFF",
                color: validCurrentPage >= totalPages ? t.muted : t.text,
                cursor: validCurrentPage >= totalPages ? "not-allowed" : "pointer",
                opacity: validCurrentPage >= totalPages ? 0.45 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <span>Next</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

BetaTestersModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  testers: PropTypes.array,
  countryCount: PropTypes.number,
  onRefresh: PropTypes.func,
};
