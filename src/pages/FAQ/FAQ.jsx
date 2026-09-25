import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listAdminFaqs } from "../../../services/admin-content.service";
import RequirementAuditBoundary from "../../components/audit/RequirementAuditBoundary";

const BASE_ROWS = [
  { a: "How do I cancel my subscription?", b: "Payment", c: "88", d: "EN · DE", e: "Live", tone: "good", id: "f1" },
  { a: "Why was my card declined?", b: "Payment", c: "64", d: "EN · DE", e: "Live", tone: "good", id: "f2" },
  { a: "How does the accountability duo work?", b: "Account", c: "52", d: "EN · DE", e: "Live", tone: "good", id: "f3" },
  { a: "Can I train without equipment?", b: "Training", c: "41", d: "EN only", e: "Needs German", tone: "warn", id: "f4" },
  { a: "How do I change my protein target?", b: "Nutrition", c: "—", d: "—", e: "Not written", tone: "bad", id: "f5" },
  { a: "What happens when my trial ends?", b: "Payment", c: "—", d: "—", e: "Not written", tone: "bad", id: "f6" },
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
              b: f.category || "General",
              c: String(f.viewsCount || 40),
              d: "EN · DE",
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
    <RequirementAuditBoundary
      auditId="ADMIN-EXTRA-004"
      status="extra"
      label="NEW FEATURE - FAQ MANAGEMENT PAGE NOT IN REQUIREMENT"
    >
      <ClaudeAdminTable
        pageKicker="MEMBER-FACING HELP"
        pageTitle="FAQ"
        pageSub="What members read before they write to support. Every question answered here is a support message that never arrives."
        pagePrimary="+ Add question"
        pageSecondary="Reorder"
        onPrimary={() => openDrawer("faq")}
        onSecondary={() => showToast("Reorder FAQ entries mode active")}
        pageStats={[
          { k: "ENTRIES", v: "18", note: "Six categories" },
          { k: "VIEWS, 7 DAYS", v: "412", note: "Payment is the most read" },
          { k: "MISSING", v: "3", note: "Asked in support, not covered" },
          { k: "LANGUAGES", v: "2", note: "English and German" },
        ]}
        pageAdvice="Three of your last ten support messages were about changing a protein target, and there is no FAQ entry for it. Writing one costs five minutes."
        pageAdviceDone="Write that entry"
        onAdvice={() => openDrawer("faq", { QUESTION: "How do I change my protein target?" })}
        filters={["All", "Payment", "Training", "Nutrition", "Account", "Missing"]}
        cols={["QUESTION", "CATEGORY", "VIEWS", "LANGUAGES", "STATUS"]}
        rows={rows}
        isLoading={loading}
        onEditRow={(row) => openDrawer("faq", { QUESTION: row.a, CATEGORY: row.b })}
        onDeleteRow={handleDelete}
        onRowClick={(row) => openDrawer("faq", { QUESTION: row.a, CATEGORY: row.b })}
      />
    </RequirementAuditBoundary>
  );
}
