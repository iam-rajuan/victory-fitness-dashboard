import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClaudeAdminTable from "../../components/shared/ClaudeAdminTable";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { adminApiRequest } from "../../../services/auth.service";

const LEGAL_DOCS = [
  { id: "privacy", label: "Privacy policy", endpoint: "/admin/content/privacy-policy", route: "/privacy-policy" },
  { id: "terms", label: "Terms & conditions", endpoint: "/admin/content/terms-condition", route: "/terms-and-condition" },
  { id: "about", label: "About us", endpoint: "/admin/content/about-us", route: "/about-us" },
];

function formatDate(value) {
  if (!value) return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function legalRoute(row) {
  return row?.route || row?.raw?.route || row?.rawData?.route || "/settings";
}

export default function Settings() {
  const { showToast } = useAdminDrawer();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const responses = await Promise.all(
          LEGAL_DOCS.map(async (item) => ({ ...item, data: await adminApiRequest(item.endpoint) }))
        );
        if (!mounted) return;
        setRows(responses.map((item) => ({
          id: item.id,
          a: item.label,
          b: item.data.status || (item.id === "about" ? "Current" : "Published"),
          c: (item.data.applies_to || ["ALL"]).join(", "),
          d: formatDate(item.data.published_at || item.data.updated_at),
          e: item.data.version || "v1",
          tone: item.data.status === "Draft" || item.data.status === "Unpublished" ? "warn" : "good",
          route: item.route,
          rawData: item.data,
        })));
      } catch (error) {
        showToast(error?.message || "Could not load legal document settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const stats = useMemo(() => {
    const published = rows.filter((row) => /published|current/i.test(row.b)).length;
    return [
      { k: "LEGAL PAGES", v: String(rows.length || 3), note: "Privacy, terms, about" },
      { k: "PUBLISHED", v: String(published), note: "Current member-facing versions" },
      { k: "MARKETS", v: "5", note: "All, EU, Germany, Ghana, India" },
      { k: "VERSIONING", v: "On", note: "Previous versions retained" },
    ];
  }, [rows]);

  return (
    <ClaudeAdminTable
      pageKicker="ADMINISTRATION"
      pageTitle="Settings"
      pageSub="Legal documents and company content that apply across the platform."
      pagePrimary="Update privacy policy"
      pageSecondary="Update terms"
      onPrimary={() => navigate("/privacy-policy")}
      onSecondary={() => navigate("/terms-and-condition")}
      pageStats={stats}
      filters={["All", "Legal"]}
      cols={["DOCUMENT", "STATUS", "SCOPE", "PUBLISHED", "VERSION"]}
      rows={rows}
      isLoading={loading}
      hideDeleteActions
      onEditRow={(row) => navigate(legalRoute(row))}
      onRowClick={(row) => navigate(legalRoute(row))}
    />
  );
}
