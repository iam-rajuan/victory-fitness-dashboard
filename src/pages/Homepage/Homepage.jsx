import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listAdminHomepageQuotes, replaceAdminHomepageQuotes } from "../../../services/admin-content.service";

export default function Homepage() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    listAdminHomepageQuotes()
      .then((data) => {
        const items = data?.items || [];
        setQuotes(items);
      })
      .catch((error) => showToast(error.message || "Failed to load daily inspiration"))
      .finally(() => setLoading(false));
  }, []);

  const rows = quotes.map((q, idx) => ({
    id: q.id || `daily-line-${idx + 1}`,
    a: q.text || q.quote || "Quote",
    b: q.author || "Victor Akko",
    c: `#${idx + 1}`,
    d: q.active === false ? "Paused" : "In loop",
    e: q.active === false ? "Paused" : "Active",
    tone: q.active === false ? "warn" : "good",
    rawData: q,
  }));

  const activeCount = quotes.filter((q) => q.active !== false).length;

  const handleDelete = async (row) => {
    const nextQuotes = quotes.filter((q) => String(q.id) !== String(row.id));
    setQuotes(nextQuotes);
    await replaceAdminHomepageQuotes(nextQuotes);
    showToast(`Deleted quote: “${row.a.slice(0, 30)}...”`);
  };

  return (
    <ClaudeAdminTable
      pageKicker="APP HOME SCREEN"
      pageTitle="Daily inspiration"
      pageSub="The app reads this database list in order. Every home reload serves the next active Daily Line, then loops back after the final line."
      pagePrimary="+ Add quote"
      pageSecondary="Refresh"
      onPrimary={() => openDrawer("quote")}
      onSecondary={() => {
        setLoading(true);
        listAdminHomepageQuotes()
          .then((data) => setQuotes(data?.items || []))
          .catch((error) => showToast(error.message || "Failed to refresh daily inspiration"))
          .finally(() => setLoading(false));
      }}
      pageStats={[
        { k: "IN LIBRARY", v: String(quotes.length), note: "Daily Lines in database" },
        { k: "ACTIVE", v: String(activeCount), note: "Included in the app loop" },
        { k: "PAUSED", v: String(quotes.length - activeCount), note: "Hidden from rotation" },
        { k: "ROTATION", v: "Serial", note: "One by one on reload" },
      ]}
      pageAdvice={`${activeCount} Daily Lines are active. The app advances through them serially and starts again after the last line.`}
      pageAdviceDone="Refresh"
      onAdvice={() => {
        setLoading(true);
        listAdminHomepageQuotes()
          .then((data) => setQuotes(data?.items || []))
          .catch((error) => showToast(error.message || "Failed to refresh daily inspiration"))
          .finally(() => setLoading(false));
      }}
      filters={["All", "Live", "Unused"]}
      cols={["QUOTE", "AUTHOR", "ORDER", "LOOP", "STATUS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("quote", { "THE QUOTE": row.a, AUTHOR: row.b })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("quote", { "THE QUOTE": row.a, AUTHOR: row.b })}
    />
  );
}
