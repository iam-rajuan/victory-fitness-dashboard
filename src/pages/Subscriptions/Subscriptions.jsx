import { useCallback, useEffect, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import {
  getAdminSubscriptionPlanOverview,
  deleteAdminSubscriptionPlan,
} from "../../../services/admin-content.service";
import { readStaleCache, writeStaleCache } from "../../utils/staleCache";

const SUBSCRIPTION_CACHE_KEY = "subscriptions:overview:v1";

const formatTierTitle = (tier) => {
  if (!tier) return "Subscription Plan";
  const str = String(tier).trim();
  return str.replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
};

const matchesTier = (baseRow, apiPlan) => {
  const planId = String(apiPlan.id || "").toLowerCase();
  const planTier = String(apiPlan.tier || "").toLowerCase();
  const rowId = String(baseRow.id || "").toLowerCase();
  const rowName = String(baseRow.a || "").toLowerCase();

  if (planId && rowId && (planId === rowId || rowId.includes(planId) || planId.includes(rowId))) return true;
  if (planTier.includes("silver") && rowName.includes("silver") && !rowName.includes("trial")) return true;
  if (planTier.includes("beta") && rowName.includes("beta")) return true;
  if (planTier.includes("inner circle") && rowName.includes("inner circle")) return true;
  if (planTier.includes("platinum") && rowName.includes("platinum") && !rowName.includes("trial")) return true;
  if (planTier.includes("gold") && rowName.includes("gold") && !rowName.includes("trial") && !rowName.includes("beta")) return true;
  return false;
};

const buildLivePriceTable = (planList = []) => {
  const findPlan = (keyword) => planList.find((p) => String(p.tier || "").toLowerCase().includes(keyword));
  const silver = findPlan("silver");
  const gold = findPlan("gold");
  const platinum = findPlan("platinum");
  return [
    silver ? ["Victory Silver", silver.priceYearly ?? 0, silver.priceMonthly ?? 0, "Silver"] : null,
    gold ? ["Victory Gold", gold.priceYearly ?? 0, gold.priceMonthly ?? 0, "Gold"] : null,
    platinum ? ["Victory Platinum", platinum.priceYearly ?? 0, platinum.priceMonthly ?? 0, "Platinum"] : null,
  ].filter(Boolean);
};

const mapOverviewRows = (items = []) =>
  items.map((item) => ({
    id: item.id,
    a: item.label,
    b: item.priceYearly,
    c: item.priceMonthly,
    d: item.subscriberLabel ?? String(item.subscribers ?? 0),
    e: item.shareOfMrrLabel ?? `${item.shareOfMrr ?? 0}%`,
    tone: item.tone || "warn",
    rawData: item.rawPlan || null,
    overview: item,
  }));

const mapOverviewStats = (items = []) =>
  items.map((item) => ({
    k: item.key,
    v: item.value,
    note: item.note || "",
  }));

export default function Subscriptions() {
  const { openDrawer, showToast } = useAdminDrawer();
  const cached = readStaleCache(SUBSCRIPTION_CACHE_KEY);
  const [loading, setLoading] = useState(!cached);
  const [plans, setPlans] = useState(() => cached?.plans || []);
  const [rows, setRows] = useState(() => cached?.rows || []);
  const [stats, setStats] = useState(() => cached?.stats || []);
  const [summary, setSummary] = useState(() => cached?.summary || "Live subscription catalog and active subscriber reporting.");
  const [warning, setWarning] = useState(() => cached?.warning || null);

  const loadPlans = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAdminSubscriptionPlanOverview();
      const planList = Array.isArray(data?.plans) ? data.plans : [];
      const nextRows = mapOverviewRows(data?.rows || []);
      const nextStats = mapOverviewStats(data?.stats || []);
      setPlans(planList);
      setRows(nextRows);
      setStats(nextStats);
      setSummary(data?.summary || "Live subscription catalog and active subscriber reporting.");
      setWarning(data?.warning || null);
      writeStaleCache(SUBSCRIPTION_CACHE_KEY, {
        rows: nextRows,
        stats: nextStats,
        plans: planList,
        summary: data?.summary || "",
        warning: data?.warning || null,
      });
    } catch (err) {
      showToast(`Failed to load subscription overview: ${err.message || "Request failed"}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const handleEditRow = (row) => {
    const raw = row.rawData || plans.find((p) => matchesTier(row, p)) || {};
    const isBeta = row.id === "plan-gold-beta-21-day" || String(row.a).toLowerCase().includes("beta");
    const isAppOnly = Boolean(raw.isApplicationOnly) || String(row.a).toLowerCase().includes("inner circle");

    if (row.id?.startsWith("trial-")) {
      showToast(`${row.a} is an automated 5-day trial period.`);
      return;
    }

    const tierTitle = formatTierTitle(raw.tier || row.a);

    openDrawer("plan", {
      id: raw.id || row.id,
      kicker: `PLAN PRICING · ${String(raw.tier || row.a).toUpperCase()}`,
      title: `Edit ${tierTitle} pricing`,
      sub: isBeta
        ? "21-Day Gold Beta is free for all approved testers. Follows the app's zero-cost onboarding structure."
        : isAppOnly
        ? "Victory Inner Circle is application only and not sold with standard recurring prices in the app."
        : "Update production yearly and monthly pricing for this tier. New prices apply immediately to new signups.",
      "TIER NAME": tierTitle,
      DESCRIPTION: raw.description || (isBeta ? "Free 21-day Gold beta access for approved testers during Phase 1." : ""),
      "YEARLY PRICE (€)": isBeta ? "0" : isAppOnly ? "—" : raw.priceYearly != null ? String(raw.priceYearly) : row.b.replace(/[^0-9]/g, ""),
      "MONTHLY PRICE (€)": isBeta || isAppOnly ? "—" : raw.priceMonthly != null ? String(raw.priceMonthly) : row.c.replace(/[^0-9]/g, ""),
      "DISCOUNT (%)": raw.discountPercentage ? `${raw.discountPercentage}%` : "None",
      "TIER TYPE": isBeta ? "Free beta access" : isAppOnly ? "Application only" : "Standard paid",
      "MOST POPULAR": raw.isMostPopular ? "Yes" : "No",
      rawData: raw,
      onSaved: async () => {
        await loadPlans({ silent: true });
      },
    });
  };

  const handlePrimary = () => {
    openDrawer("plan", {
      id: "new",
      kicker: "NEW SUBSCRIPTION PLAN",
      title: "Add subscription plan",
      sub: "Create a new production subscription tier with custom yearly and monthly pricing.",
      "TIER NAME": "Victory Custom",
      DESCRIPTION: "Access to coaching and workouts.",
      "YEARLY PRICE (€)": "249",
      "MONTHLY PRICE (€)": "29",
      "DISCOUNT (%)": "None",
      "TIER TYPE": "Standard paid",
      "MOST POPULAR": "No",
      onSaved: async () => {
        await loadPlans({ silent: true });
      },
    });
  };

  const handleSecondary = () => {
    openDrawer("pricing", {
      priceTable: buildLivePriceTable(plans),
      onSaved: async () => {
        await loadPlans({ silent: true });
      },
    });
  };

  const handleDeleteRow = async (row) => {
    if (row.id?.startsWith("trial-")) {
      showToast(`${row.a} is generated from active trial users and cannot be deleted here.`);
      return;
    }
    if (row.rawData?.id && !row.id?.startsWith("trial-")) {
      try {
        await deleteAdminSubscriptionPlan(row.rawData.id);
        showToast(`Plan "${row.a}" removed.`);
        await loadPlans({ silent: true });
      } catch (err) {
        showToast(`Failed: ${err.message}`);
      }
    } else {
      showToast("This row is backend-generated and cannot be removed locally.");
    }
  };

  return (
    <ClaudeAdminTable
      pageKicker="REVENUE · LIVE SUBSCRIPTION DATA"
      pageTitle="Subscriptions"
      pageSub={summary}
      pagePrimary="+ Add plan"
      pageSecondary="Edit pricing"
      onPrimary={handlePrimary}
      onSecondary={handleSecondary}
      pageStats={stats}
      pageAdvice={warning?.message}
      pageAdviceDone={warning?.actionLabel || "Review payments"}
      onAdvice={() => {
        const users = Number(warning?.registeredUsers || 0);
        const payments = Number(warning?.completedPayments || 0);
        showToast(`Backend payment check: Ghana users ${users}, completed payments ${payments}.`);
      }}
      filters={["All tiers", "Silver", "Gold", "Platinum", "Inner Circle", "Monthly", "Yearly"]}
      cols={["PLAN", "PRICE / YEAR", "PRICE / MONTH", "ENROLLED", "SHARE OF MRR"]}
      rows={rows}
      isLoading={loading}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      onRowClick={handleEditRow}
    />
  );
}
