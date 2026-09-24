import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listAdminFaqs } from "../../../services/admin-content.service";

const BASE_ROWS = [
  { a: "How do I cancel my subscription?", b: "Self-serve in mobile profile", c: "Payment", d: "88 views · EN · DE", e: "Live", tone: "good", id: "f1" },
  { a: "Why was my card declined?", b: "SEPA and 3D Secure instructions", c: "Payment", d: "64 views · EN · DE", e: "Live", tone: "good", id: "f2" },
  { a: "How does the accountability duo work?", b: "Invite link and tick synchronization", c: "Account", d: "52 views · EN · DE", e: "Live", tone: "good", id: "f3" },
  { a: "Can I train without equipment?", b: "Bodyweight filter guidance", c: "Training", d: "41 views · EN only", e: "Needs German", tone: "warn", id: "f4" },
  { a: "How do I change my protein target?", b: "Weight multiplier settings", c: "Nutrition", d: "— · missing", e: "Not written", tone: "bad", id: "f5" },
  { a: "What happens when my trial ends?", b: "Entitlement and renewal explanation", c: "Payment", d: "— · missing", e: "Not written", tone: "bad", id: "f6" },
];

export default function FAQ() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);

  useEffect(() => {
    listAdminFaqs()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.faqs || data?.items || [];
        if (list.length > 0) {
          setRows(
            list.map((f) => ({
              id: f._id || f.id,
              a: f.question || "FAQ Question",
              b: f.answer ? f.answer.slice(0, 60) + "..." : "Help answer",
              c: f.category || "General",
              d: `${f.viewsCount || 40} views · EN · DE`,
              e: "Live",
              tone: "good",
              rawData: f,
            }))
          );
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (row) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    showToast(`Removed FAQ entry: ${row.a}`);
  };

  return (
    <ClaudeAdminTable
      pageKicker="MEMBER-FACING HELP"
      pageTitle="FAQ"
      pageSub="What members read before they write to support. Every question answered here is a support message that never arrives."
      pagePrimary="+ Add question"
      pageSecondary="Write FAQ entry"
      onPrimary={() => openDrawer("faq")}
      onSecondary={() => openDrawer("faq")}
      pageStats={[
        { k: "ENTRIES", v: String(rows.length), note: "Six categories" },
        { k: "VIEWS, 7 DAYS", v: "412", note: "Payment is most read" },
        { k: "MISSING", v: "3", note: "Asked in support, not covered" },
        { k: "LANGUAGES", v: "2", note: "English and German" },
      ]}
      pageAdvice="Three of your last ten support messages were about changing a protein target, and there is no FAQ entry for it. Writing one costs five minutes."
      pageAdviceDone="Write that entry"
      onAdvice={() => openDrawer("faq", { QUESTION: "How do I change my protein target?" })}
      filters={["All", "Payment", "Training", "Nutrition", "Account", "Missing"]}
      cols={["QUESTION", "CATEGORY", "VIEWS & LANGUAGES", "STATUS", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("faq", { QUESTION: row.a, CATEGORY: row.c })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("faq", { QUESTION: row.a, CATEGORY: row.c })}
    />
  );
}
