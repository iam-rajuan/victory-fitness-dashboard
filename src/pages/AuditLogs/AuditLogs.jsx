import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiFilter, FiRefreshCw, FiSearch, FiShield, FiUser } from "react-icons/fi";
import { listAdminAuditLogs } from "../../../services/admin-content.service";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function SummaryCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

function ActionPill({ value }) {
  return (
    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700">
      {value || "unknown"}
    </span>
  );
}

export default function AuditLogs() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const load = async ({ signal, silent = false, nextAction = action, nextResource = resource, nextAdminEmail = adminEmail } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await listAdminAuditLogs({
        limit: 100,
        action: nextAction,
        resource: nextResource,
        adminEmail: nextAdminEmail,
        signal,
      });
      setItems(Array.isArray(response?.items) ? response.items : []);
      setTotal(Number(response?.total || 0));
    } catch (loadError) {
      if (loadError?.name !== "AbortError") {
        setError(loadError.message || "Unable to load audit logs");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal });
    return () => controller.abort();
  }, [action, resource, adminEmail]);

  const uniqueAdmins = useMemo(
    () => new Set(items.map((item) => item.adminEmail).filter(Boolean)).size,
    [items],
  );
  const uniqueResources = useMemo(
    () => new Set(items.map((item) => item.resource).filter(Boolean)).size,
    [items],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1d4ed8] px-5 py-5 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">Admin Oversight</p>
            <h1 className="mt-2 text-3xl font-black">Audit Logs</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/80">
              Review real administrative actions and moderation changes recorded by the backend audit trail.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load({ silent: true })}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
          >
            <FiRefreshCw className={cx("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={FiShield} label="Total Logs" value={total} note="Total matching audit records returned by the backend." />
        <SummaryCard icon={FiActivity} label="Visible Rows" value={items.length} note="Rows in the current filtered view." />
        <SummaryCard icon={FiUser} label="Admins In View" value={uniqueAdmins} note="Unique admin emails in the current result set." />
        <SummaryCard icon={FiFilter} label="Resources In View" value={uniqueResources} note="Distinct resources touched in the current result set." />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <label className="relative block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="Filter by action"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
          <label className="relative block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={resource}
              onChange={(event) => setResource(event.target.value)}
              placeholder="Filter by resource"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
          <label className="relative block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="Filter by admin email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading audit logs...</div> : null}

        {!loading && items.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <p className="text-lg font-bold text-slate-700">No audit activity found</p>
            <p className="mt-2 text-sm text-slate-500">
              {total
                ? "The current filter combination returned no matching audit rows."
                : "No backend audit records have been written yet."}
            </p>
          </div>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Resource ID</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{item.adminEmail || "—"}</td>
                    <td className="px-4 py-4"><ActionPill value={item.action} /></td>
                    <td className="px-4 py-4 text-sm text-slate-700">{item.resource || "—"}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{item.resourceId || "—"}</td>
                    <td className="px-4 py-4 text-xs leading-6 text-slate-500">
                      <pre className="max-w-[280px] whitespace-pre-wrap break-words font-mono text-[11px] text-slate-500">
                        {Object.keys(item.details || {}).length ? JSON.stringify(item.details, null, 2) : "—"}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
