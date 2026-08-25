import { useEffect, useMemo, useState } from "react";
import { FiClock, FiMail, FiRefreshCw, FiSearch, FiTool, FiUserCheck } from "react-icons/fi";
import { listAdminSupportMessages, updateAdminSupportMessage } from "../../../services/admin-support.service";

const STATUS_OPTIONS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function StatusBadge({ status }) {
  const normalized = String(status || "OPEN").toUpperCase();
  const styles = {
    OPEN: "bg-amber-50 text-amber-700 border-amber-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={cx("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black tracking-wide", styles[normalized] || "bg-slate-50 text-slate-600 border-slate-200")}>
      {normalized.replace("_", " ")}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, note, tone = "blue" }) {
  const tones = {
    blue: "border-blue-100 bg-white",
    amber: "border-amber-100 bg-amber-50/40",
    emerald: "border-emerald-100 bg-emerald-50/40",
    slate: "border-slate-200 bg-slate-50/70",
  };
  return (
    <div className={cx("rounded-2xl border p-4 shadow-sm", tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
        </div>
        {Icon ? <Icon className="h-5 w-5 text-slate-400" /> : null}
      </div>
      {note ? <p className="mt-3 text-xs leading-5 text-slate-500">{note}</p> : null}
    </div>
  );
}

export default function SupportInbox() {
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState({
    totalMessages: 0,
    visibleMessages: 0,
    openMessages: 0,
    inProgressMessages: 0,
    resolvedMessages: 0,
    submittedLast7Days: 0,
  });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMessages = async ({ signal, nextQuery = query, nextStatus = statusFilter, silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await listAdminSupportMessages({
        query: nextQuery,
        status: nextStatus,
        limit: 500,
        signal,
      });
      setMessages(Array.isArray(response?.messages) ? response.messages : []);
      setSummary(response?.summary || {});
    } catch (loadError) {
      if (loadError?.name !== "AbortError") {
        setError(loadError.message || "Failed to load support messages");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadMessages({ signal: controller.signal });
    return () => controller.abort();
  }, [query, statusFilter]);

  const updateLocalMessage = (messageId, patch) => {
    setMessages((current) =>
      current.map((item) => (item.id === messageId ? { ...item, ...patch } : item)),
    );
  };

  const handleSave = async (message) => {
    setSavingId(message.id);
    setError("");
    setSuccess("");
    try {
      const response = await updateAdminSupportMessage(message.id, {
        status: message.status,
        admin_notes: message.admin_notes || "",
      });
      updateLocalMessage(message.id, response);
      setSuccess("Support message updated.");
    } catch (saveError) {
      setError(saveError.message || "Failed to update support message");
    } finally {
      setSavingId("");
    }
  };

  const filterChips = useMemo(
    () => STATUS_OPTIONS.map((status) => ({
      value: status,
      label: status === "ALL" ? "All" : status.replace("_", " "),
      count:
        status === "ALL" ? summary.totalMessages || 0 :
        status === "OPEN" ? summary.openMessages || 0 :
        status === "IN_PROGRESS" ? summary.inProgressMessages || 0 :
        summary.resolvedMessages || 0,
    })),
    [summary],
  );

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#4f46e5] px-5 py-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/75">Support Operations</p>
            <h1 className="mt-2 text-3xl font-black">Help &amp; Support Inbox</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/80">
              Review real user support messages, triage status, and keep admin follow-up notes organized in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadMessages({ silent: true })}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
          >
            <FiRefreshCw className={cx("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={FiMail} label="Total Messages" value={summary.totalMessages || 0} note="All support records returned by the backend query." />
        <SummaryCard icon={FiClock} label="Open" value={summary.openMessages || 0} note="Messages waiting for first admin action." tone="amber" />
        <SummaryCard icon={FiTool} label="In Progress" value={summary.inProgressMessages || 0} note="Messages currently being worked by the admin team." />
        <SummaryCard icon={FiUserCheck} label="Resolved" value={summary.resolvedMessages || 0} note={`${summary.submittedLast7Days || 0} submitted in the last 7 days.`} tone="emerald" />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by subject, user, email, notes, or message"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => setStatusFilter(chip.value)}
                className={cx(
                  "rounded-full px-3 py-2 text-xs font-black tracking-wide transition",
                  statusFilter === chip.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {chip.label} ({chip.count})
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading support messages...</div> : null}

        {!loading && messages.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <p className="text-lg font-bold text-slate-700">No support messages found</p>
            <p className="mt-2 text-sm text-slate-500">
              {summary.totalMessages
                ? "The current search or status filter returned no matching messages."
                : "No support messages have been submitted to the backend yet."}
            </p>
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          {messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{message.subject}</h2>
                    <StatusBadge status={message.status} />
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">{message.user_name}</p>
                    <p>{message.user_email}</p>
                    <p>Sent {message.created_at ? new Date(message.created_at).toLocaleString() : "N/A"}</p>
                  </div>
                </div>

                <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto] xl:w-[340px]">
                  <select
                    value={message.status}
                    onChange={(event) => updateLocalMessage(message.id, { status: event.target.value })}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400"
                  >
                    {STATUS_OPTIONS.filter((status) => status !== "ALL").map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSave(message)}
                    disabled={savingId === message.id}
                    className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === message.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">User Message</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.message}</p>
              </div>

              <div className="mt-4">
                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Admin Notes</label>
                <textarea
                  value={message.admin_notes || ""}
                  onChange={(event) => updateLocalMessage(message.id, { admin_notes: event.target.value })}
                  rows={4}
                  className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 outline-none focus:border-blue-400"
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
