import { useCallback, useEffect, useMemo, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import {
  deleteAdminMasterclass,
  listAdminMasterclasses,
} from "../../../services/admin-content.service";

const statusTone = (status) => (String(status).toLowerCase() === "live" ? "good" : "warn");

const normalizeDuration = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "Not set";
  if (/min$/i.test(raw)) return raw;
  if (/^\d+$/.test(raw)) return `${raw} min`;
  const timeMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeMatch) {
    return `${Math.max(1, Number(timeMatch[1]))} min`;
  }
  return raw;
};

const buildRow = (item) => {
  const status = String(item.status || "").trim() || (item.videoUrl ? "Live" : "Draft");
  return {
    id: item.id,
    a: item.title || "Untitled masterclass",
    b: item.category || "Uncategorised",
    c: normalizeDuration(item.duration),
    d: String(Number(item.watchCount || 0)),
    e: status,
    tone: statusTone(status),
    rawData: item,
  };
};

const buildDrawerPayload = (row, onSaved) => {
  if (!row) {
    return {
      onSaved,
      PURPOSE: "Strength",
      LENGTH: "15 min",
      EQUIPMENT: "Bodyweight",
      LEVEL: "Intermediate",
      "TIER ACCESS": "Gold and up",
      MOVEMENTS: [],
      videoSource: "VIMEO",
    };
  }
  const item = row?.raw?.rawData || row?.rawData || row || {};
  return {
    id: item.id,
    TITLE: item.title || row?.a || "",
    PURPOSE: item.category || row?.b || "Strength",
    LENGTH: item.duration || row?.c || "",
    STATUS: item.status || row?.e || "Draft",
    EQUIPMENT: item.equipment || "Bodyweight",
    LEVEL: item.level || "Intermediate",
    "TIER ACCESS": item.tierAccess || "Gold and up",
    MOVEMENTS: Array.isArray(item.movements) ? item.movements : [],
    "COACH NOTE": item.coachNote || item.description || "",
    videoSource: item.videoSource || "VIMEO",
    videoUrl: item.videoUrl || "",
    vimeoId: String(item.videoUrl || "").match(/vimeo(?:\.com\/|\.com\/video\/)(\d+)/)?.[1] || "",
    "AUDIO URL": item.audioUrl || "",
    DESCRIPTION: item.description || "",
    "EDUCATIONAL CONTENT": item.educationalContent || "",
    "THUMBNAIL URL": item.thumbnailUrl || "",
    WATCHED: String(Number(item.watchCount || row?.d || 0)),
    "FINISH RATE": String(Number(item.finishRatePct || 0)),
    "RETENTION LIFT": String(Number(item.retentionLiftPoints || 0)),
    rawData: item,
    onSaved,
  };
};

export default function Masterclasses() {
  const { openDrawer, showToast } = useAdminDrawer();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const loadMasterclasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdminMasterclasses();
      const items = Array.isArray(data?.items) ? data.items : [];
      setRows(items.map(buildRow));
    } catch (error) {
      showToast(`Failed: ${error?.message || "Could not load masterclasses."}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMasterclasses();
  }, [loadMasterclasses]);

  const stats = useMemo(() => {
    const liveRows = rows.filter((row) => String(row.e).toLowerCase() === "live");
    const watched = rows.reduce((sum, row) => sum + Number(row.rawData?.watchCount || 0), 0);
    const finishRows = rows.filter((row) => Number(row.rawData?.finishRatePct || 0) > 0);
    const liftRows = rows.filter((row) => Number(row.rawData?.retentionLiftPoints || 0) !== 0);
    const avgFinish = finishRows.length
      ? Math.round(finishRows.reduce((sum, row) => sum + Number(row.rawData.finishRatePct || 0), 0) / finishRows.length)
      : 0;
    const avgLift = liftRows.length
      ? Math.round(liftRows.reduce((sum, row) => sum + Number(row.rawData.retentionLiftPoints || 0), 0) / liftRows.length)
      : 0;
    const liveCategories = [...new Set(liveRows.map((row) => row.b).filter(Boolean))].join(", ") || "No live categories";

    return [
      { k: "LIVE", v: String(liveRows.length), note: liveCategories },
      { k: "WATCHED", v: String(watched), note: "Sessions started" },
      { k: "FINISH RATE", v: `${avgFinish}%`, note: finishRows.length ? "Average from backend" : "No completion data yet" },
      { k: "RETENTION LIFT", v: `${avgLift >= 0 ? "+" : ""}${avgLift} pts`, note: liftRows.length ? "Backend retention signal" : "No retention data yet" },
    ];
  }, [rows]);

  const pageKicker = `${rows.filter((row) => String(row.e).toLowerCase() === "live").length} LIVE · BACKEND`;

  const openMasterclassDrawer = (row = null) => {
    openDrawer("masterclass", buildDrawerPayload(row, loadMasterclasses));
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(`Delete "${row.a}" from masterclasses?`);
    if (!confirmed) return;
    try {
      await deleteAdminMasterclass(row.id);
      await loadMasterclasses();
      showToast(`Masterclass "${row.a}" deleted.`);
    } catch (error) {
      showToast(`Failed: ${error?.message || "Could not delete masterclass."}`);
    }
  };

  return (
    <ClaudeAdminTable
      pageKicker={pageKicker}
      pageTitle="Masterclasses"
      pageSub="Long-form teaching from Victor. Gold and above. Members who watch one retain noticeably better than those who never do."
      pagePrimary="+ Add masterclass"
      pageSecondary="Import from Vimeo"
      onPrimary={() => openMasterclassDrawer()}
      onSecondary={() =>
        openDrawer("masterclass", {
          ...buildDrawerPayload(null, loadMasterclasses),
          "VIDEO SOURCE": "VIMEO",
        })
      }
      pageStats={stats}
      pageAdvice="Only live masterclasses are visible to members. Keep drafts until the video, lesson copy and thumbnail are ready."
      pageAdviceDone="Announce one to Gold"
      onAdvice={() => openDrawer("broadcast", { TARGET: "Gold" })}
      filters={["All", "Nutrition", "Science", "Training", "Draft"]}
      cols={["TITLE", "CATEGORY", "LENGTH", "WATCHED", "STATUS"]}
      rows={rows}
      isLoading={loading}
      onEditRow={openMasterclassDrawer}
      onDeleteRow={handleDelete}
      onRowClick={openMasterclassDrawer}
    />
  );
}
