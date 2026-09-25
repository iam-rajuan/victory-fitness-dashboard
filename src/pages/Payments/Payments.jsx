import { useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";

const BASE_ROWS = [
  { a: "Michael Krause", b: "SEPA", c: "€299", d: "10 Sep", e: "Succeeded", tone: "good", id: "pm1" },
  { a: "Dominik Schulz", b: "Card", c: "€399", d: "09 Sep", e: "Succeeded", tone: "good", id: "pm2" },
  { a: "Arjun Rao", b: "UPI", c: "₹3,240", d: "09 Sep", e: "Succeeded", tone: "good", id: "pm3" },
  { a: "Sarah Fischer", b: "Card", c: "€299", d: "08 Sep", e: "Declined", tone: "bad", id: "pm4" },
  { a: "Peter Wagner", b: "Card", c: "€24", d: "08 Sep", e: "Declined", tone: "bad", id: "pm5" },
  { a: "Kofi Mensah", b: "MTN MoMo", c: "GH₵4,900", d: "07 Sep", e: "Never completed", tone: "bad", id: "pm6" },
  { a: "Nana Owusu", b: "MTN MoMo", c: "GH₵4,900", d: "05 Sep", e: "Never completed", tone: "bad", id: "pm7" },
  { a: "Anna Reinhardt", b: "SEPA", c: "€24", d: "03 Sep", e: "Succeeded", tone: "good", id: "pm8" },
];

export default function Payments() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [rows, setRows] = useState(BASE_ROWS);

  return (
    <ClaudeAdminTable
      pageKicker="PROPOSED PAGE · NOT IN YOUR CURRENT IA"
      pageTitle="Payments"
      pageSub="Every transaction across SEPA, card, MoMo, Telecel, UPI and PayPal. Failures surface here before they become churn."
      pagePrimary="Retry failed"
      pageSecondary="Export ledger"
      onPrimary={() => showToast("Retry initiated for 2 failed transactions")}
      onSecondary={() => showToast("Exporting ledger...")}
      pageStats={[
        { k: "COLLECTED THIS MONTH", v: "€4,180", note: "Across 3 currencies" },
        { k: "FAILED", v: "2", note: "Both card declines" },
        { k: "GHANA COMPLETED", v: "0", note: "128 registered users" },
        { k: "REFUNDS", v: "1", note: "Within the EU 14-day window" },
      ]}
      pageAdvice="No Ghanaian payment has ever completed. Either the MoMo callback fails or the cedi price renders wrong — one test transaction settles which."
      pageAdviceDone="Run a MoMo test"
      onAdvice={() => openDrawer("flag", { MARKETS: "Ghana" })}
      filters={["All", "Succeeded", "Failed", "Refunded", "SEPA", "MoMo", "UPI", "Card"]}
      cols={["CUSTOMER", "METHOD", "AMOUNT", "DATE", "RESULT"]}
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
