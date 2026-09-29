import { useEffect, useMemo, useState } from "react";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { listNotificationTemplates, saveNotificationTemplates } from "../../../services/admin-notifications.service";

const EMPTY_TEMPLATE = {
  id: "",
  type: "",
  title: "",
  channels: ["push"],
  audience: "member",
  frequencyCapHours: 24,
  requiresContentReview: false,
  reviewStatus: "draft",
  variants: [{ key: "a", title: "", message: "" }],
};

function capLabel(hours) {
  const value = Math.max(Number(hours || 0), 1);
  if (value < 24) return `${Math.max(1, Math.round(24 / value))} / day`;
  if (value === 24) return "1 / day";
  if (value < 720) return `${Math.max(1, Math.round(168 / value))} / week`;
  return "1 / month";
}

function channelLabel(channels = []) {
  const labels = { push: "Push", whatsapp: "WhatsApp", email: "Email" };
  return channels.map((item) => labels[item] || item).join(" · ") || "No channel";
}

function normalizeTemplate(item) {
  return {
    id: String(item.id || item.type || "").trim(),
    type: String(item.type || "").trim(),
    title: String(item.title || "").trim(),
    channels: Array.isArray(item.channels) && item.channels.length ? item.channels : ["push"],
    audience: item.audience === "system" ? "system" : "member",
    frequencyCapHours: Math.max(Number(item.frequencyCapHours || 24), 1),
    requiresContentReview: Boolean(item.requiresContentReview),
    reviewStatus: ["draft", "pending_review", "approved"].includes(item.reviewStatus) ? item.reviewStatus : "approved",
    variants: Array.isArray(item.variants) && item.variants.length
      ? item.variants.map((variant, index) => ({
          key: String(variant.key || String.fromCharCode(97 + index)).slice(0, 1).toLowerCase(),
          title: String(variant.title || item.title || "").trim(),
          message: String(variant.message || "").trim(),
        }))
      : [{ key: "a", title: String(item.title || "").trim(), message: "" }],
    enabledMembers: Number(item.enabledMembers || 0),
    disabledMembers: Number(item.disabledMembers || 0),
    sentCount: Number(item.sentCount || 0),
  };
}

function toApiPayload(item) {
  return {
    id: item.id || item.type,
    type: item.type,
    title: item.title,
    channels: item.channels,
    audience: item.audience,
    frequencyCapHours: Number(item.frequencyCapHours || 24),
    requiresContentReview: Boolean(item.requiresContentReview),
    reviewStatus: item.reviewStatus,
    variants: item.variants.map((variant) => ({
      key: variant.key,
      title: variant.title || item.title,
      message: variant.message || item.title,
    })),
  };
}

function TemplateEditor({ value, onClose, onSave }) {
  const [draft, setDraft] = useState(() => normalizeTemplate(value || EMPTY_TEMPLATE));

  const setField = (key, nextValue) => setDraft((prev) => ({ ...prev, [key]: nextValue }));
  const toggleChannel = (channel) => {
    setDraft((prev) => {
      const set = new Set(prev.channels || []);
      if (set.has(channel)) set.delete(channel);
      else set.add(channel);
      return { ...prev, channels: Array.from(set) };
    });
  };

  const updateVariant = (index, key, nextValue) => {
    setDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) => (i === index ? { ...variant, [key]: nextValue } : variant)),
    }));
  };

  const save = () => {
    const type = draft.type.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
    if (!type || !draft.title.trim()) return;
    onSave({ ...draft, id: draft.id || type, type, title: draft.title.trim() });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 flex items-start justify-center overflow-auto p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0D0D0D] border border-white/10 p-6 text-[#F7F3EE]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-[10px] tracking-[.18em] text-[#B5651D] font-semibold mb-2">NOTIFICATION TEMPLATE</div>
            <h2 className="font-clash text-3xl font-semibold">{value?.id ? "Edit template" : "New template"}</h2>
          </div>
          <button className="text-white/60 text-2xl" onClick={onClose}>×</button>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-[10px] tracking-[.14em] text-white/45">TITLE</span>
            <input className="rounded-xl bg-[#0D2B45] border border-white/10 px-4 py-3 outline-none" value={draft.title} onChange={(e) => setField("title", e.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] tracking-[.14em] text-white/45">TYPE KEY</span>
            <input className="rounded-xl bg-[#0D2B45] border border-white/10 px-4 py-3 outline-none font-mono" value={draft.type} onChange={(e) => setField("type", e.target.value)} placeholder="workout_reminder" />
          </label>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1">
              <span className="text-[10px] tracking-[.14em] text-white/45">CAP HOURS</span>
              <input type="number" min="1" className="rounded-xl bg-[#0D2B45] border border-white/10 px-4 py-3 outline-none" value={draft.frequencyCapHours} onChange={(e) => setField("frequencyCapHours", e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-[10px] tracking-[.14em] text-white/45">AUDIENCE</span>
              <select className="rounded-xl bg-[#0D2B45] border border-white/10 px-4 py-3 outline-none" value={draft.audience} onChange={(e) => setField("audience", e.target.value)}>
                <option value="member">Member</option>
                <option value="system">System</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-[10px] tracking-[.14em] text-white/45">STATE</span>
              <select className="rounded-xl bg-[#0D2B45] border border-white/10 px-4 py-3 outline-none" value={draft.reviewStatus} onChange={(e) => setField("reviewStatus", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="pending_review">Pending review</option>
                <option value="approved">Approved</option>
              </select>
            </label>
          </div>

          <div>
            <div className="text-[10px] tracking-[.14em] text-white/45 mb-2">CHANNELS</div>
            <div className="flex flex-wrap gap-2">
              {["push", "whatsapp", "email"].map((channel) => (
                <button
                  key={channel}
                  onClick={() => toggleChannel(channel)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${draft.channels.includes(channel) ? "bg-[#C9943A] text-black" : "border border-white/15 text-white/70"}`}
                >
                  {channelLabel([channel])}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0D2B45] border border-white/10 p-4">
            <div className="text-[10px] tracking-[.14em] text-[#C9943A] mb-3">COPY VARIANT</div>
            {(draft.variants || []).slice(0, 1).map((variant, index) => (
              <div className="grid gap-3" key={variant.key || index}>
                <input className="rounded-xl bg-black/25 border border-white/10 px-4 py-3 outline-none" value={variant.title} onChange={(e) => updateVariant(index, "title", e.target.value)} placeholder="Push title" />
                <textarea className="min-h-[110px] rounded-xl bg-black/25 border border-white/10 px-4 py-3 outline-none resize-y" value={variant.message} onChange={(e) => updateVariant(index, "message", e.target.value)} placeholder="Message body" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="h-11 rounded-xl border border-white/15 px-5 font-bold" onClick={onClose}>Cancel</button>
          <button className="h-11 rounded-xl bg-[#C9943A] text-black px-5 font-bold" onClick={save}>Save template</button>
        </div>
      </div>
    </div>
  );
}

export default function Notifications() {
  const { showToast } = useAdminDrawer();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await listNotificationTemplates();
      setTemplates((response.items || []).map(normalizeTemplate));
    } catch (error) {
      showToast(error.message || "Failed to load notification templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const persist = async (nextTemplates, message = "Notification templates saved") => {
    const response = await saveNotificationTemplates(nextTemplates.map(toApiPayload));
    setTemplates((response.items || []).map(normalizeTemplate));
    showToast(message);
  };

  const rows = useMemo(() => templates.map((item) => ({
    id: item.id || item.type,
    a: item.title,
    b: channelLabel(item.channels),
    c: capLabel(item.frequencyCapHours),
    d: item.audience === "member" ? `${item.enabledMembers} on · ${item.disabledMembers} off · ${item.sentCount} sent` : `${item.sentCount} sent`,
    e: item.reviewStatus === "approved" ? "Approved" : item.reviewStatus === "draft" ? "Draft" : "Unapproved",
    tone: item.reviewStatus === "approved" ? "good" : "bad",
    rawData: item,
  })), [templates]);

  const stats = useMemo(() => {
    const approved = templates.filter((item) => item.reviewStatus === "approved").length;
    const member = templates.filter((item) => item.audience === "member").length;
    const mutedMembers = Math.max(...templates.filter((item) => item.audience === "member").map((item) => item.disabledMembers), 0);
    return [
      { k: "TEMPLATES", v: String(templates.length), note: `${member} member-facing, ${templates.length - member} system` },
      { k: "APPROVED", v: String(approved), note: "Sending normally" },
      { k: "UNAPPROVED", v: String(templates.length - approved), note: "Currently silent" },
      { k: "MEMBERS MUTED", v: String(mutedMembers), note: "No channel or template switched off" },
    ];
  }, [templates]);

  const unapprovedEnabled = templates.find((item) => item.audience === "member" && item.reviewStatus !== "approved" && item.enabledMembers > 0);

  const upsertTemplate = async (template) => {
    const normalized = normalizeTemplate(template);
    const exists = templates.some((item) => item.id === normalized.id || item.type === normalized.type);
    const next = exists
      ? templates.map((item) => (item.id === normalized.id || item.type === normalized.type ? { ...item, ...normalized } : item))
      : [...templates, normalized];
    await persist(next, exists ? "Template updated" : "Template created");
    setEditor(null);
  };

  return (
    <>
      <ClaudeAdminTable
        pageKicker="PUSH, WHATSAPP AND EMAIL"
        pageTitle="Notification Templates"
        pageSub="The wording, channel options, frequency cap and approval state for automatic messages. Members choose channels and template switches in the app; this page controls what can actually send."
        pagePrimary="+ New template"
        pageSecondary="Refresh"
        onPrimary={() => setEditor(EMPTY_TEMPLATE)}
        onSecondary={() => void load()}
        pageStats={stats}
        pageAdvice={unapprovedEnabled ? `${unapprovedEnabled.title} is unapproved, but ${unapprovedEnabled.enabledMembers} members have it switched on. Approve it or those members will not receive it.` : "All enabled member-facing templates are approved or safely silent."}
        pageAdviceDone={unapprovedEnabled ? "Approve pending" : "Refresh"}
        onAdvice={async () => {
          if (!unapprovedEnabled) return load();
          await persist(templates.map((item) => item.id === unapprovedEnabled.id ? { ...item, reviewStatus: "approved" } : item), "Pending member-facing template approved");
        }}
        filters={["All", "Member-facing", "Approved", "Unapproved", "Push", "WhatsApp", "Email"]}
        cols={["TEMPLATE", "CHANNELS OFFERED", "CAP CEILING", "MEMBER SWITCHES", "STATE"]}
        rows={rows}
        isLoading={loading}
        onEditRow={(row) => setEditor(row.raw?.rawData || row.rawData || row)}
        onDeleteRow={async (row) => {
          const item = row.rawData || row;
          if (!window.confirm(`Delete notification template "${item.title || item.a}"?`)) return;
          await persist(templates.filter((template) => template.id !== item.id), "Template deleted");
        }}
        onRowClick={(row) => setEditor(row.raw?.rawData || row.rawData || row)}
      />
      {editor ? <TemplateEditor value={editor} onClose={() => setEditor(null)} onSave={upsertTemplate} /> : null}
    </>
  );
}
