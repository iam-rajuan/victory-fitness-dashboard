import { useCallback, useEffect, useMemo, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { deleteAdminUser, getUserManagementOverview } from "../../../services/admin-users.service";

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
  e: user.statusLabel || (user.status === "ACTIVE" ? "Healthy" : user.status || "Pending"),
  tone: user.tone || (user.neverActive ? "bad" : user.isAtRisk ? "warn" : "good"),
  rawData: user,
  isPaying: Boolean(user.isPaying),
  isTrial: Boolean(user.isTrial || user.trial_type),
  isBetaTester: Boolean(user.isBetaTester || user.is_beta_tester),
  isAtRisk: Boolean(user.isAtRisk),
  neverActive: Boolean(user.neverActive),
});

export default function UserDetails() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserManagementOverview({ limit: 500 });
      const nextSummary = data?.summary || {};
      const users = Array.isArray(data?.table?.users) ? data.table.users : [];
      setSummary(nextSummary);
      setRows(users.map(mapUserRow));
    } catch (err) {
      showToast(`Failed: ${err?.message || "Unable to load users."}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
    if (!window.confirm(`Delete "${row.a}"? This removes the account from the backend.`)) {
      return;
    }
    try {
      await deleteAdminUser(row.id);
      showToast(`User ${row.a} deleted.`);
      await loadUsers();
    } catch (err) {
      showToast(`Failed: ${err?.message || "Unable to delete user."}`);
    }
  };

  return (
    <ClaudeAdminTable
      pageKicker={pageKicker}
      pageTitle="All users"
      pageSub="Everyone who has an account, paid or not. Sorted by what they are worth to you, not by when they joined."
      pagePrimary="+ Invite user"
      pageSecondary="Export CSV"
      onPrimary={() => openUserEditor({ rawData: {} })}
      pageStats={stats}
      pageAdvice="9 users have never opened a feature since registering. They are the cheapest churn you will ever prevent — one message each."
      pageAdviceDone="Message the 9"
      onAdvice={() => openDrawer("message")}
      adviceAudit={{
        auditId: "ADMIN-EXTRA-020",
        status: "extra",
        label: "NEW FEATURE - INACTIVE USER CHURN NUDGE ADVICE NOT IN REQUIREMENT",
      }}
      filters={USER_FILTERS}
      cols={["NAME", "TIER", "MARKET", "LAST ACTIVE", "STATUS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("message", { WHO: row.a })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("message", { WHO: row.a })}
    />
  );
}
