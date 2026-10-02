import { useEffect, useMemo, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const statusTone = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "ACTIVE") return "good";
  if (normalized === "UPCOMING" || normalized === "DRAFT") return "warn";
  return "bad";
};

const statusLabel = (status) => {
  const normalized = String(status || "DRAFT").toUpperCase();
  if (normalized === "ACTIVE") return "Active";
  if (normalized === "UPCOMING") return "Upcoming";
  if (normalized === "ARCHIVED") return "Archived";
  return "Draft";
};

const mapChallengeRow = (challenge) => ({
  id: challenge.id,
  a: `${challenge.featured ? "★ " : ""}${challenge.title || "Untitled challenge"}`,
  b: `${challenge.category || "Physical"} · ${(Array.isArray(challenge.difficulties) && challenge.difficulties.length ? challenge.difficulties : [challenge.difficulty || "BEGINNER"]).join(", ")}`,
  c: String(challenge.durationDays || 0),
  d: String(challenge.participantCount || 0),
  e: statusLabel(challenge.status),
  tone: statusTone(challenge.status),
  rawData: challenge,
});

const drawerPayloadFromChallenge = (challenge = {}) => ({
  id: challenge.id || challenge._id,
  title: "Edit challenge",
  NAME: challenge.title || "",
  LENGTH: String(challenge.durationDays || challenge.duration_days || 7),
  TYPE: challenge.category || "Physical",
  "POINTS ON COMPLETION": challenge.points !== undefined && challenge.points !== null ? String(challenge.points) : "",
  "WHAT TO DO": challenge.description || "",
  "WHY IT MATTERS": challenge.whyItMatters || challenge.why_it_matters || "",
  STATUS: challenge.status || "DRAFT",
  "FEATURED CARD": challenge.featured ? "Yes" : "No",
  DIFFICULTY: Array.isArray(challenge.difficulties) && challenge.difficulties.length
    ? challenge.difficulties
    : [challenge.difficulty || "BEGINNER"],
  THUMBNAIL: challenge.thumbnail || "",
  PLAN_TEXT: challenge.planText || challenge.plan_text || "",
  PLAN_DAYS: challenge.planDays || challenge.plan_days || [],
});

export default function Challenges() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const data = await adminApiRequest("/admin/challenges");
      const list = Array.isArray(data) ? data : data?.challenges || data?.items || [];
      const sorted = [...list].sort((a, b) => {
        if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
        const timeA = new Date(a.updatedAt || a.createdAt || a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || b.updated_at || b.created_at || 0).getTime();
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        return String(b.id || b._id || "").localeCompare(String(a.id || a._id || ""));
      });
      setRows(sorted.map(mapChallengeRow));
      setTotal(Number(data?.total ?? sorted.length) || 0);
    } catch (err) {
      showToast(`Failed to load challenges: ${err?.message || "Request failed"}`);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadChallenges();
  }, []);

  const summary = useMemo(() => {
    const active = rows.filter((row) => row.rawData?.status === "ACTIVE").length;
    const upcoming = rows.filter((row) => row.rawData?.status === "UPCOMING").length;
    const draft = rows.filter((row) => row.rawData?.status === "DRAFT").length;
    const joined = rows.reduce((sum, row) => sum + Number(row.rawData?.participantCount || 0), 0);
    const completed = rows.reduce((sum, row) => sum + Number(row.rawData?.completionCount || 0), 0);
    const completionPct = joined > 0 ? Math.round((completed / joined) * 100) : 0;
    const categories = new Set(rows.map((row) => row.rawData?.category).filter(Boolean)).size;
    return { active, upcoming, draft, joined, completed, completionPct, categories };
  }, [rows]);

  const handleDelete = (row) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminApiRequest(`/admin/challenges/${deleteTarget.id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setTotal((prev) => Math.max(0, prev - 1));
      showToast(`Challenge "${deleteTarget.a}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(`Failed: ${err?.message || "Delete failed"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const rail = useMemo(() => {
    return rows.slice(0, 4).map((row) => ({
      d: `${row.c}d`,
      type: row.b,
      n: row.a,
      joined: `${row.d} joined`,
      onEdit: () => openDrawer("challenge", { ...drawerPayloadFromChallenge(row.rawData), onSaved: loadChallenges }),
      onRemove: () => handleDelete(row),
    }));
  }, [rows]);

  const getChallengeFromRow = (row) => row?.rawData || row?.raw?.rawData || row;

  const openChallengeDrawer = (row) => {
    const challenge = getChallengeFromRow(row);
    openDrawer("challenge", {
      ...drawerPayloadFromChallenge(challenge || {}),
      onSaved: loadChallenges,
    });
  };

  return (
    <>
      <ClaudeAdminTable
        pageKicker={`${total} IN THE LIBRARY · BACKEND LIVE`}
        pageTitle="Challenges"
        pageSub="Create, review and publish challenge cards. App members only see challenges that are active or upcoming."
        pagePrimary="+ Add challenge"
        pageSecondary="Refresh"
        onPrimary={() => openDrawer("challenge", { onSaved: loadChallenges })}
        onSecondary={loadChallenges}
        pageStats={[
          { k: "TOTAL", v: total.toLocaleString(), note: `${summary.categories} categories configured` },
          { k: "ACTIVE", v: summary.active.toLocaleString(), note: `${summary.upcoming} upcoming, ${summary.draft} draft` },
          { k: "JOINED", v: summary.joined.toLocaleString(), note: "Across backend challenge memberships" },
          { k: "COMPLETION", v: `${summary.completionPct}%`, note: `${summary.completed} completed logs` },
        ]}
        pageAdvice={
          summary.draft > 0
            ? `${summary.draft} challenge${summary.draft === 1 ? " is" : "s are"} still in draft. Publish only after plan days are configured.`
            : "All listed challenges are either active, upcoming or archived in the backend."
        }
        pageAdviceDone="Create challenge"
        onAdvice={() => openDrawer("challenge", { LENGTH: "3", TYPE: "Physical", STATUS: "DRAFT", onSaved: loadChallenges })}
        rail={rail}
        filters={["All", "3 day", "5 day", "7 day", "14 day", "21 day", "Draft"]}
        cols={["CHALLENGE", "TYPE", "DAYS", "JOINED", "STATUS"]}
        rows={rows}
        isLoading={loading}
        onEditRow={openChallengeDrawer}
        onDeleteRow={handleDelete}
        onRowClick={openChallengeDrawer}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-dmsans"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#F7F3EE]/15 bg-[#0D0D0D] p-6 text-[#F7F3EE] shadow-2xl">
            <div className="text-[10px] font-medium tracking-[0.16em] text-[#B5651D] uppercase mb-2">
              Confirm deletion
            </div>
            <h2 className="text-2xl font-semibold font-clash leading-tight mb-2">Delete challenge?</h2>
            <p className="text-sm font-inter leading-relaxed text-[#F7F3EE]/65 mb-5">
              This removes "{deleteTarget.a}" from the dashboard and the member app. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-xl bg-[#B5651D] text-[#0D0D0D] font-bold text-sm disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete challenge"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="w-28 h-11 rounded-xl border border-[#F7F3EE]/20 text-[#F7F3EE] font-semibold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
