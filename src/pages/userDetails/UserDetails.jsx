import { useCallback, useEffect, useMemo, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { blockAdminUser, deleteAdminUser, getUserManagementOverview, restoreAdminUser } from "../../../services/admin-users.service";
import { readStaleCache, writeStaleCache } from "../../utils/staleCache";

const USER_FILTERS = ["All", "Paying", "On trial", "Beta testers", "At risk", "Never active"];

const pct = (part, total) => {
  if (!total) return "0%";
  return `${Math.round((Number(part || 0) / Number(total || 1)) * 100)}%`;
};

const normalizeTierLabel = (user) => {
  const tier = String(user.tier || user.subscription_tier || user.subscriptionTier || "NONE").trim().toUpperCase();
  if (user.isBetaTester || user.is_beta_tester) {
    return tier && tier !== "NONE" && tier !== "GOLD_BETA" ? `TRIAL · ${tier}` : "BETA";
  }
  if (user.isTrial || user.trial_type) {
    return tier && tier !== "NONE" ? `TRIAL · ${tier}` : "TRIAL";
  }
  return tier === "NONE" ? "FREE" : tier;
};

const mapUserRow = (user) => ({
  id: user.id,
  a: user.fullName || user.name || user.email || "Member",
  b: normalizeTierLabel(user),
  c: user.country || user.country_code || "Not set",
  d: user.lastActiveLabel || "Never",
  e: user.isDeleted ? "Deleted" : user.isBlocked ? "Blocked" : user.statusLabel || (user.status === "ACTIVE" ? "Healthy" : user.status || "Pending"),
  profileImage: user.profileImage || user.profile_image || "",
  tone: user.isDeleted || user.isBlocked ? "bad" : user.tone || (user.neverActive ? "bad" : user.isAtRisk ? "warn" : "good"),
  rawData: user,
  isPaying: Boolean(user.isPaying),
  isTrial: Boolean(user.isTrial || user.trial_type),
  isBetaTester: Boolean(user.isBetaTester || user.is_beta_tester),
  isAtRisk: Boolean(user.isAtRisk),
  neverActive: Boolean(user.neverActive),
  isBlocked: Boolean(user.isBlocked),
  isDeleted: Boolean(user.isDeleted),
});

const actionButtonStyle = (variant = "neutral", isDark = true) => {
  const colors = {
    neutral: { border: "rgba(201,148,58,.55)", text: "#C9943A" },
    warn: { border: "rgba(217,138,62,.55)", text: "#D98A3E" },
    good: { border: "rgba(95,196,142,.55)", text: "#5FC48E" },
  }[variant] || { border: "rgba(201,148,58,.55)", text: "#C9943A" };
  return {
    height: "30px",
    padding: "0 10px",
    borderRadius: "8px",
    boxSizing: "border-box",
    border: `1.5px solid ${colors.border}`,
    color: colors.text,
    font: "700 11.5px 'DM Sans', sans-serif",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    whiteSpace: "nowrap",
    userSelect: "none",
    background: isDark ? "transparent" : "#FAF7F2",
  };
};

export default function UserDetails() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const cacheKey = showBlockedUsers ? "users:blocked" : "users:active";
  const cached = readStaleCache(cacheKey);
  const [loading, setLoading] = useState(!cached);
  const [rows, setRows] = useState(() => cached?.rows || []);
  const [summary, setSummary] = useState(() => cached?.summary || null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserManagementOverview({ limit: 500, statusScope: showBlockedUsers ? "blocked" : "active" });
      const nextSummary = data?.summary || {};
      const users = Array.isArray(data?.table?.users) ? data.table.users : [];
      const nextRows = users.map(mapUserRow);
      setSummary(nextSummary);
      setRows(nextRows);
      writeStaleCache(cacheKey, { rows: nextRows, summary: nextSummary });
    } catch (err) {
      showToast(`Failed: ${err?.message || "Unable to load users."}`);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, showBlockedUsers, showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const stats = useMemo(() => {
    const total = Number(summary?.totalUsers || 0);
    const paying = Number(summary?.payingUsers || 0);
    const active7 = Number(summary?.active7DaysUsers || 0);
    const never = Number(summary?.neverActiveUsers || 0);
    const registeredThisWeek = Number(summary?.registeredThisWeek || 0);
    return [
      { k: "TOTAL", v: String(total), note: `+${registeredThisWeek} this week` },
      { k: "PAYING", v: String(paying), note: `${pct(paying, total)} of registered` },
      { k: "ACTIVE 7 DAYS", v: String(active7), note: `${pct(active7, total)} of registered` },
      { k: "NEVER ACTIVE", v: String(never), note: "Registered, never opened a feature" },
    ];
  }, [summary]);

  const pageKicker = `${Number(summary?.totalUsers || 0)} REGISTERED · ${Number(summary?.countryCount || 0)} COUNTRIES`;
  const neverActiveCount = Number(summary?.neverActiveUsers || 0);

  const openUserEditor = useCallback((row) => {
    const user = row?.rawData || {};
    openDrawer("user", {
      id: user.id,
      title: user.id ? "Edit user" : "Invite user",
      "FULL NAME": user.fullName || "",
      EMAIL: user.email || "",
      ROLE: user.role || "user",
      STATUS: user.status || "PENDING",
      "CONTACT NUMBER": user.contactNumber || "",
      COUNTRY: user.country || "",
      "PROFILE IMAGE": user.profileImage || "",
      onSaved: loadUsers,
    });
  }, [loadUsers, openDrawer]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.a}"? The account will be hidden, recoverable, and the user will be logged out immediately.`)) {
      return;
    }
    try {
      await deleteAdminUser(row.id);
      showToast(`User ${row.a} deleted and session expired.`);
      await loadUsers();
    } catch (err) {
      showToast(`Failed: ${err?.message || "Unable to delete user."}`);
    }
  };

  const handleBlock = async (row) => {
    if (!window.confirm(`Block "${row.a}"? Their current app session will expire immediately.`)) {
      return;
    }
    try {
      await blockAdminUser(row.id);
      showToast(`User ${row.a} blocked and logged out.`);
      await loadUsers();
    } catch (err) {
      showToast(`Failed: ${err?.message || "Unable to block user."}`);
    }
  };

  const handleRestore = async (row) => {
    if (!window.confirm(`Restore "${row.a}"? They will be able to sign in again.`)) {
      return;
    }
    try {
      await restoreAdminUser(row.id);
      showToast(`User ${row.a} restored.`);
      await loadUsers();
    } catch (err) {
      showToast(`Failed: ${err?.message || "Unable to restore user."}`);
    }
  };

  return (
    <ClaudeAdminTable
      pageKicker={pageKicker}
      pageTitle={showBlockedUsers ? "Blocked users" : "All users"}
      pageSub={showBlockedUsers ? "Blocked and deleted member accounts. Restore only when access should be allowed again." : "Everyone who has an account, paid or not. Sorted by what they are worth to you, not by when they joined."}
      pagePrimary="+ Invite user"
      pageSecondary={showBlockedUsers ? "Show active users" : "Blocked users"}
      onPrimary={() => openUserEditor({ rawData: {} })}
      onSecondary={() => setShowBlockedUsers((value) => !value)}
      pageStats={stats}
      pageAdvice={showBlockedUsers ? "Restore only accounts that should regain access. Blocked and deleted users cannot continue with old sessions." : "9 users have never opened a feature since registering. They are the cheapest churn you will ever prevent — one message each."}
      pageAdviceDone="Message the 9"
      onAdvice={() => openDrawer("message")}
      adviceAudit={{
        auditId: "ADMIN-EXTRA-020",
        status: "extra",
        label: "NEW FEATURE - INACTIVE USER CHURN NUDGE ADVICE NOT IN REQUIREMENT",
      }}
      filters={showBlockedUsers ? ["All"] : USER_FILTERS}
      cols={["NAME", "TIER", "MARKET", "LAST ACTIVE", "STATUS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("message", { WHO: row.a })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("message", { WHO: row.a })}
      renderRowActions={(row, { isDark }) => {
        const isBlocked = Boolean(row.isBlocked || row.rawData?.isBlocked || row.isDeleted || row.rawData?.isDeleted);
        if (isBlocked) {
          return (
            <div onClick={() => handleRestore(row)} style={actionButtonStyle("good", isDark)}>
              Restore
            </div>
          );
        }
        return (
          <>
            <div onClick={() => openDrawer("message", { WHO: row.a })} style={actionButtonStyle("neutral", isDark)}>
              Message
            </div>
            <div onClick={() => handleBlock(row)} style={actionButtonStyle("warn", isDark)}>
              Block
            </div>
            <div onClick={() => handleDelete(row)} style={actionButtonStyle("warn", isDark)}>
              Delete
            </div>
          </>
        );
      }}
    />
  );
}
