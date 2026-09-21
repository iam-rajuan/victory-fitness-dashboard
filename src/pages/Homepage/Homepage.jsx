import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listAdminHomepageQuotes, replaceAdminHomepageQuotes } from "../../../services/admin-content.service";

const BASE_ROWS = [
  { a: "Every rep is a reminder that growth takes patience.", b: "Victor Akko", c: "Victor Akko", d: "Today · 11 days live", e: "Live", tone: "good", id: "q1" },
  { a: "Consistency is what transforms average into excellence.", b: "Victor Akko", c: "Victor Akko", d: "24 Aug · 6 days live", e: "Ready", tone: "good", id: "q2" },
  { a: "Small daily improvements lead to stunning results.", b: "Victor Akko", c: "Victor Akko", d: "12 Aug · 9 days live", e: "Ready", tone: "good", id: "q3" },
  { a: "Your only limit is the one you build in your mind.", b: "Victor Akko", c: "Victor Akko", d: "— · 0 days live", e: "Unused", tone: "warn", id: "q4" },
  { a: "Discipline is choosing what you want most.", b: "Victor Akko", c: "Victor Akko", d: "— · 0 days live", e: "Unused", tone: "warn", id: "q5" },
  { a: "You do not rise to your goals. You fall to your habits.", b: "Victor Akko", c: "Victor Akko", d: "2 Aug · 4 days live", e: "Ready", tone: "good", id: "q6" },
];

export default function Homepage() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);

  useEffect(() => {
    listAdminHomepageQuotes()
      .then((data) => {
        const items = data?.items || [];
        if (items.length > 0) {
          setRows(
            items.map((q, idx) => ({
              id: q.id || `q-${idx}`,
              a: q.text || q.quote || "Quote",
              b: q.author || "Victor Akko",
              c: q.author || "Victor Akko",
              d: q.active ? "Live today" : "Ready in library",
              e: q.active ? "Live" : "Ready",
              tone: q.active ? "good" : "warn",
              rawData: q,
            }))
          );
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (row) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    showToast(`Deleted quote: “${row.a.slice(0, 30)}...”`);
  };

  return (
    <ClaudeAdminTable
      pageKicker="APP HOME SCREEN"
      pageTitle="Daily inspiration"
      pageSub="One quote is live on every member's home screen at a time. Set live, or delete — the change reaches the app immediately."
      pagePrimary="+ Add quote"
      pageSecondary="Shuffle daily"
      onPrimary={() => openDrawer("quote")}
      onSecondary={() => showToast("Daily quote shuffled to next ready item.")}
      pageStats={[
        { k: "IN LIBRARY", v: String(rows.length), note: "All by Victor Akko" },
        { k: "LIVE NOW", v: "1", note: "Shown on all home screens" },
        { k: "SEEN TODAY", v: "38", note: "Every home-screen open" },
        { k: "ROTATION", v: "Manual", note: "No automatic schedule" },
      ]}
      pageAdvice="The same quote has been live for eleven days. Members who open the app daily have read it eleven times."
      pageAdviceDone="Set a new one live"
      onAdvice={() => openDrawer("quote", { "THE QUOTE": "Consistency is what transforms average into excellence." })}
      filters={["All", "Live", "Unused"]}
      cols={["QUOTE", "AUTHOR", "LAST LIVE & DURATION", "STATUS", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("quote", { "THE QUOTE": row.a, AUTHOR: row.c })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("quote", { "THE QUOTE": row.a, AUTHOR: row.c })}
    />
  );
}
