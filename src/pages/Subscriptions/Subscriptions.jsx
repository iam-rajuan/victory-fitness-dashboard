import { useCallback, useEffect, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import {
  listAdminSubscriptionPlans,
  deleteAdminSubscriptionPlan,
} from "../../../services/admin-content.service";
import { readStaleCache, writeStaleCache } from "../../utils/staleCache";

const BASE_ROWS = [
  { a: "Victory Silver", b: "€199", c: "€24", d: "21", e: "18%", tone: "good", id: "plan-silver" },
  { a: "Victory Gold", b: "€299", c: "€36", d: "34", e: "62%", tone: "good", id: "plan-gold" },
  { a: "Victory Platinum", b: "€399", c: "€48", d: "9", e: "17%", tone: "good", id: "plan-platinum" },
  { a: "Victory Inner Circle", b: "Application", c: "—", d: "4", e: "3%", tone: "good", id: "plan-inner-circle" },
  { a: "21-Day Gold Beta", b: "€0", c: "—", d: "15", e: "0%", tone: "warn", id: "plan-gold-beta-21-day" },
  { a: "5-Day trial · Gold", b: "€0", c: "—", d: "12 running", e: "0%", tone: "warn", id: "trial-gold" },
  { a: "5-Day trial · Silver", b: "€0", c: "—", d: "4 running", e: "0%", tone: "warn", id: "trial-silver" },
  { a: "5-Day trial · Platinum", b: "€0", c: "—", d: "3 running", e: "0%", tone: "warn", id: "trial-platinum" },
];

const DEFAULT_STATS = [
  { k: "MRR", v: "€4,180", note: "+€318 this week" },
  { k: "PAYING", v: "68", note: "Gold is 62% of revenue" },
  { k: "ARPU", v: "€61", note: "Yearly plans lift it" },
  { k: "FAILED RENEWALS", v: "2", note: "Two cards declined" },
];

const formatTierTitle = (tier) => {
  if (!tier) return "Subscription Plan";
  const str = String(tier).trim();
  return str.replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
};

const formatPriceYearly = (plan) => {
  if (plan.isApplicationOnly) return "Application";
  if (plan.priceYearly === 0) return "€0";
  if (plan.priceYearly != null && plan.priceYearly !== "") return `€${plan.priceYearly}`;
  return "Application";
};

const formatPriceMonthly = (plan) => {
  if (plan.isApplicationOnly) return "—";
  if (plan.priceMonthly === 0 || plan.priceMonthly == null || plan.priceMonthly === "") return "—";
  return `€${plan.priceMonthly}`;
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

export default function Subscriptions() {
  const { openDrawer, showToast } = useAdminDrawer();
  const cached = readStaleCache("subscriptions");
  const [loading, setLoading] = useState(!cached);
  const [rows, setRows] = useState(() => cached?.rows || BASE_ROWS);
  const [stats, setStats] = useState(() => cached?.stats || DEFAULT_STATS);

  const loadPlans = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await listAdminSubscriptionPlans();
      const planList = Array.isArray(data) ? data : data?.items || data?.plans || [];

      if (planList.length > 0) {
        // Map backend plans onto the canonical prototype base rows
        const matchedPlanIds = new Set();
        const updatedRows = BASE_ROWS.map((base) => {
          const matchingPlan = planList.find((p) => matchesTier(base, p));
          if (matchingPlan) {
            matchedPlanIds.add(matchingPlan.id);
            return {
              ...base,
              b: formatPriceYearly(matchingPlan),
              c: formatPriceMonthly(matchingPlan),
              tone: matchingPlan.priceYearly > 0 ? "good" : base.tone,
              rawData: matchingPlan,
            };
          }
          return base;
        });

        // Any new custom plans created that are not in base rows
        const extraPlans = planList
          .filter((p) => !matchedPlanIds.has(p.id))
          .map((p) => ({
            id: p.id,
            a: formatTierTitle(p.tier),
            b: formatPriceYearly(p),
            c: formatPriceMonthly(p),
            d: String(p.subscriberCount || 0),
            e: p.shareOfMrr ? `${p.shareOfMrr}%` : "0%",
            tone: p.priceYearly > 0 ? "good" : "warn",
            rawData: p,
          }));

        const finalRows = [...updatedRows, ...extraPlans];
        setRows(finalRows);
        writeStaleCache("subscriptions", { rows: finalRows, stats });
      }
    } catch (err) {
      showToast(`Failed to load subscription plans: ${err.message || "Request failed"}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast, stats]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const handleEditRow = (row) => {
    const raw = row.rawData || row;
    const tierName = row.a ? row.a.replace(/^Victory\s+/i, "") : "Gold";
    openDrawer("pricing", {
      TITLE: row.a,
      "APPLIES TO": ["Silver", "Gold", "Platinum"].includes(tierName) ? tierName : "Gold",
      rawData: raw,
      onSaved: () => loadPlans({ silent: true }),
    });
  };

  const handleDeleteRow = async (row) => {
    if (row.rawData?.id && !row.id?.startsWith("trial-")) {
      try {
        await deleteAdminSubscriptionPlan(row.rawData.id);
        showToast(`Plan "${row.a}" removed.`);
        await loadPlans({ silent: true });
      } catch (err) {
        showToast(`Failed: ${err.message}`);
      }
    } else {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      showToast(`Removed ${row.a}`);
    }
  };

  return (
    <ClaudeAdminTable
      pageKicker="REVENUE · 4 TIERS · 5 MARKETS"
      pageTitle="Subscriptions"
      pageSub="Silver €199, Gold €299, Platinum €399 a year, or monthly at a 31% premium. Inner Circle is application only and never sold here."
      pagePrimary="+ Add plan"
      pageSecondary="Edit pricing"
      onPrimary={() =>
        openDrawer("pricing", {
          onSaved: () => loadPlans({ silent: true }),
        })
      }
      onSecondary={() =>
        openDrawer("pricing", {
          onSaved: () => loadPlans({ silent: true }),
        })
      }
      pageStats={stats}
      pageAdvice="Ghana has 128 registered users and no completed payment. Until one MoMo transaction clears, every cedi spent on reach there is wasted."
      pageAdviceDone="Run a test payment"
      onAdvice={() => openDrawer("flag", { MARKETS: "Ghana" })}
      filters={["All tiers", "Silver", "Gold", "Platinum", "Inner Circle", "Monthly", "Yearly"]}
      cols={["PLAN", "PRICE / YEAR", "PRICE / MONTH", "SUBSCRIBERS", "SHARE OF MRR"]}
      rows={rows}
      isLoading={loading}
      onEditRow={handleEditRow}
      onDeleteRow={handleDeleteRow}
      onRowClick={handleEditRow}
    />
  );
}
