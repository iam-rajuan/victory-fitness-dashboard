import { useState, useEffect } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const BASE_ROWS = [
  { a: "Victor Akko", b: "Official coach announcement", c: "Global", d: "Announcement · 1 hr ago", e: "62 cheers", tone: "good", id: "cm1" },
  { a: "Lena Meyer", b: "Post-workout hydration plate", c: "Gold", d: "Photo · 3 hrs ago", e: "21 cheers", tone: "good", id: "cm2" },
  { a: "Anna Reinhardt", b: "7-day habit streak unlocked", c: "Silver", d: "Completion · Today", e: "14 cheers", tone: "good", id: "cm3" },
  { a: "Test A", b: "Partner invite for Cold Start", c: "Platinum", d: "Challenge invite · 9 Sep", e: "0 cheers", tone: "warn", id: "cm4" },
  { a: "Md Hasan Saon", b: "Day 3 recovery reflections", c: "Gold", d: "Text · 8 Sep", e: "4 cheers", tone: "good", id: "cm5" },
  { a: "test user five", b: "Clean Eating challenge lobby", c: "Gold", d: "Challenge invite · 8 Sep", e: "1 cheer", tone: "warn", id: "cm6" },
  { a: "Kofi Mensah", b: "Form review question on deadlift", c: "Gold", d: "Video link · 7 Sep", e: "9 cheers", tone: "good", id: "cm7" },
  { a: "Member", b: "First session logged!", c: "Global", d: "Text · 6 Sep", e: "2 cheers", tone: "warn", id: "cm8" },
];

export default function Community() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(BASE_ROWS);

  useEffect(() => {
    adminApiRequest("/community/posts")
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items || [];
        if (list.length > 0) {
          setRows(
            list.map((p) => ({
              id: p._id || p.id,
              a: p.authorName || p.author || "Member",
              b: p.content || p.caption || "Community share",
              c: p.feedTier || p.tier || "Global",
              d: `${p.postType || "Post"} · Today`,
              e: `${p.cheersCount || p.likesCount || 0} cheers`,
              tone: (p.cheersCount || 0) > 5 ? "good" : "warn",
              rawData: p,
            }))
          );
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (row) => {
    if (window.confirm(`Delete post from ${row.a}?`)) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      showToast(`Removed post from ${row.a}.`);
    }
  };

  return (
    <ClaudeAdminTable
      pageKicker="21 POSTS · 5 FEEDS"
      pageTitle="Community"
      pageSub="One feed per tier plus a global broadcast. Verified announcements from you carry a badge members can see."
      pagePrimary="New broadcast"
      pageSecondary="Moderation queue"
      onPrimary={() => openDrawer("broadcast")}
      onSecondary={() => showToast("Moderation queue clear — 0 flagged items.")}
      pageStats={[
        { k: "POSTS", v: "21", note: "Across all feeds" },
        { k: "CHEERS", v: "184", note: "Best day: challenge announcement" },
        { k: "FLAGGED", v: "0", note: "Nothing awaiting review" },
        { k: "SILVER FEED", v: "1 post", note: "5% of all activity" },
      ]}
      pageAdvice="Silver has one post against Gold's thirteen. A member paying €199 is opening the quietest room in the app — seed three posts a week until it carries itself."
      pageAdviceDone="Seed the Silver feed"
      onAdvice={() => openDrawer("broadcast", { TARGET: "Silver" })}
      filters={["All tiers", "Global", "Silver", "Gold", "Platinum", "Inner Circle", "Flagged"]}
      cols={["AUTHOR", "FEED", "TYPE & POSTED", "ENGAGEMENT", "ACTIONS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={(row) => openDrawer("broadcast", { HEADLINE: row.a })}
      onDeleteRow={handleDelete}
      onRowClick={(row) => openDrawer("broadcast", { HEADLINE: row.a })}
    />
  );
}
