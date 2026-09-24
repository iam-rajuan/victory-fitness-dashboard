import { useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";

const BASE_ROWS = [
  { a: "Michael Krause", b: "Germany · Yearly Gold renewal", c: "SEPA", d: "€299 · 10 Sep", e: "Succeeded", tone: "good", id: "pm1" },
  { a: "Dominik Schulz", b: "Germany · Platinum membership", c: "Card", d: "€399 · 09 Sep", e: "Succeeded", tone: "good", id: "pm2" },
  { a: "Arjun Rao", b: "India · Gold Annual", c: "UPI", d: "₹3,240 · 09 Sep", e: "Succeeded", tone: "good", id: "pm3" },
  { a: "Sarah Fischer", b: "Germany · Insufficient funds", c: "Card", d: "€299 · 08 Sep", e: "Declined", tone: "bad", id: "pm4" },
  { a: "Peter Wagner", b: "Germany · Card expired", c: "Card", d: "€24 · 08 Sep", e: "Declined", tone: "bad", id: "pm5" },
  { a: "Kofi Mensah", b: "Ghana · MTN Mobile Money callback failed", c: "MTN MoMo", d: "GH₵4,900 · 07 Sep", e: "Never completed", tone: "bad", id: "pm6" },
  { a: "Nana Owusu", b: "Ghana · Telecel Cash pending", c: "MTN MoMo", d: "GH₵4,900 · 05 Sep", e: "Never completed", tone: "bad", id: "pm7" },
  { a: "Anna Reinhardt", b: "Germany · Monthly Silver subscription", c: "SEPA", d: "€24 · 03 Sep", e: "Succeeded", tone: "good", id: "pm8" },
];

export default function Payments() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [rows, setRows] = useState(BASE_ROWS);

  return (
    <ClaudeAdminTable
      pageKicker="TRANSACTION LEDGER · 5 PAYMENT RAILS"
      pageTitle="Payments"
      pageSub="Every transaction across SEPA, card, MoMo, Telecel, UPI and PayPal. Failures surface here before they become churn."
      pagePrimary="Pricing & discounts"
      pageSecondary="Export ledger"
      onPrimary={() => openDrawer("pricing")}
      pageStats={[
        { k: "COLLECTED THIS MONTH", v: "€4,180", note: "Across 3 currencies" },
        { k: "FAILED", v: "2", note: "Both card declines" },
        { k: "GHANA COMPLETED", v: "0", note: "128 registered users" },
        { k: "REFUNDS", v: "1", note: "Within 14-day EU cooling" },
      ]}
      pageAdvice="No Ghanaian payment has ever completed. Either the MoMo callback fails or the cedi price renders wrong — one test transaction settles which."
      pageAdviceDone="Run a MoMo test"
      onAdvice={() => openDrawer("flag", { MARKETS: "Ghana" })}
      filters={["All", "Succeeded", "Failed", "Refunded", "SEPA", "MoMo", "UPI", "Card"]}
      cols={["CUSTOMER", "METHOD", "AMOUNT & DATE", "RESULT", "ACTIONS"]}
      rows={rows}
      onEditRow={(row) => openDrawer("pricing", { TARGET: row.a })}
      onDeleteRow={(row) => {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        showToast(`Dismissed transaction log for ${row.a}.`);
      }}
      onRowClick={(row) => openDrawer("pricing", { TARGET: row.a })}
    />
  );
}
