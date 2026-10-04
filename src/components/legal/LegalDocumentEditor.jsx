
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  IoChevronBack,
  IoClose,
  IoDownloadOutline,
  IoEyeOutline,
  IoPhonePortraitOutline,
  IoDesktopOutline,
  IoOpenOutline,
  IoCheckmarkCircle,
  IoCalendarOutline,
  IoGlobeOutline,
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoNotificationsOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { Spin, message } from "antd";
import { adminApiRequest } from "../../../services/auth.service";
import { useTheme } from "../../context/ThemeContext";
import { LEGAL_DOCUMENT_ACCEPT, readLegalDocumentFile } from "../../utils/legalDocumentImport";

const MARKET_OPTIONS = [
  { value: "ALL", label: "All Markets", code: "GLOBAL" },
  { value: "EU", label: "EU Only", code: "EU" },
  { value: "DE", label: "Germany", code: "DE" },
  { value: "GH", label: "Ghana", code: "GH" },
  { value: "IN", label: "India", code: "IN" },
];

const NOTIFICATION_OPTIONS = [
  { value: "all", label: "Notify all members", desc: "Push & in-app alerts to all members" },
  { value: "eu", label: "Notify EU only", desc: "GDPR compliance broadcast to EU members" },
  { value: "silent", label: "Silent update", desc: "Publish without broadcasting alerts" },
];

function formatDate(value) {
  if (!value) return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function toDateInputValue(date) {
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function sanitizeFilename(title, version, originalFilename) {
  if (originalFilename && originalFilename !== "Editor content" && originalFilename.includes(".")) {
    const ext = originalFilename.split(".").pop();
    const base = originalFilename.replace(/\.[^.]+$/, "");
    return `${base}-${version || "v1"}.${ext}`;
  }
  const cleanTitle = (title || "legal-document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${cleanTitle}-${version || "v1"}.html`;
}

function generateStandaloneHtmlDoc({
  title,
  htmlContent,
  version = "v1",
  publishedAt,
  effectiveAt,
  appliesTo = ["ALL"],
}) {
  const publishedLabel = formatDate(publishedAt);
  const effectiveLabel = formatDate(effectiveAt);
  const marketsLabel = appliesTo.join(", ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - Victory Fitness (${version})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0D0D0D;
      --card-bg: #081C2E;
      --navy: #0D2B45;
      --gold: #C9943A;
      --gold-light: #E0B460;
      --ivory: #F7F3EE;
      --muted: rgba(247, 243, 238, 0.65);
      --border: rgba(247, 243, 238, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--ivory);
      font-family: 'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.75;
      font-size: 16px;
      padding: 48px 24px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 840px;
      margin: 0 auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 44px 48px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 8px;
    }
    h1.doc-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--ivory);
      line-height: 1.25;
      margin-bottom: 16px;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 24px;
      padding: 16px 20px;
      background: var(--navy);
      border-radius: 10px;
      border: 1px solid var(--border);
      margin-bottom: 32px;
      font-size: 13px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .meta-val {
      color: var(--ivory);
      font-weight: 600;
    }
    .content-body {
      color: var(--ivory);
      font-size: 15.5px;
    }
    .content-body h1, .content-body h2, .content-body h3, .content-body h4 {
      color: var(--ivory);
      font-weight: 700;
      margin-top: 28px;
      margin-bottom: 12px;
      line-height: 1.35;
    }
    .content-body h1 { font-size: 24px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    .content-body h2 { font-size: 20px; color: var(--gold); }
    .content-body h3 { font-size: 17px; }
    .content-body p { margin-bottom: 16px; color: rgba(247, 243, 238, 0.88); }
    .content-body ul, .content-body ol { margin-left: 24px; margin-bottom: 16px; }
    .content-body li { margin-bottom: 8px; color: rgba(247, 243, 238, 0.88); }
    .content-body blockquote {
      border-left: 3px solid var(--gold);
      padding: 12px 18px;
      margin: 18px 0;
      background: rgba(201, 148, 58, 0.08);
      border-radius: 0 8px 8px 0;
      font-style: italic;
    }
    .content-body a { color: var(--gold); text-decoration: underline; }
    .content-body hr { border: 0; height: 1px; background: var(--border); margin: 28px 0; }
    .footer-note {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 12px;
      color: var(--muted);
    }
    @media print {
      body { background: #fff !important; color: #111 !important; padding: 0 !important; font-size: 12pt; }
      .wrapper { max-width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
      .meta-bar { background: #f4f4f4 !important; border: 1px solid #ddd !important; }
      .meta-val, h1.doc-title, .content-body, .content-body h1, .content-body h2, .content-body h3 { color: #111 !important; }
      .content-body a { color: #000 !important; text-decoration: underline; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="badge">Victory Fitness · Legal Document</div>
    <h1 class="doc-title">${title}</h1>
    <div class="meta-bar">
      <div class="meta-item">
        <span class="meta-label">Version</span>
        <span class="meta-val">${version}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Applies To</span>
        <span class="meta-val">${marketsLabel}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Published</span>
        <span class="meta-val">${publishedLabel}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Effective Date</span>
        <span class="meta-val">${effectiveLabel}</span>
      </div>
    </div>
    <div class="content-body">
      ${htmlContent || "<p>No content provided.</p>"}
    </div>
    <div class="footer-note">
      Official publication by Victory Fitness. Generated on ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.
    </div>
  </div>
</body>
</html>`;
}

function downloadDocumentFile({ filename, title, version, publishedAt, effectiveAt, appliesTo, htmlContent }) {
  const fullHtml = generateStandaloneHtmlDoc({
    title,
    htmlContent,
    version,
    publishedAt,
    effectiveAt,
    appliesTo,
  });

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const downloadName = sanitizeFilename(title, version, filename);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openInNewTabDocument({ title, version, publishedAt, effectiveAt, appliesTo, htmlContent }) {
  const fullHtml = generateStandaloneHtmlDoc({
    title,
    htmlContent,
    version,
    publishedAt,
    effectiveAt,
    appliesTo,
  });

  const win = window.open("", "_blank", "noopener,noreferrer");
  if (win) {
    win.document.open();
    win.document.write(fullHtml);
    win.document.close();
  } else {
    message.warning("Pop-up was blocked. Please allow pop-ups for this site to view in a new tab.");
  }
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export default function LegalDocumentEditor({
  pageTitle,
  defaultTitle,
  endpoint,
  enableNotifications = true,
}) {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [documentState, setDocumentState] = useState(null);
  const [title, setTitle] = useState(defaultTitle);
  const [versionName, setVersionName] = useState("");
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState("");
  const [markets, setMarkets] = useState(["ALL"]);
  const [notificationBehavior, setNotificationBehavior] = useState("silent");
  const [effectiveMode, setEffectiveMode] = useState("now");
  const [specificDate, setSpecificDate] = useState(toDateInputValue(new Date()));

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    title: "",
    html: "",
    version: "",
    filename: "",
    publishedAt: null,
    effectiveAt: null,
    appliesTo: ["ALL"],
    deviceMode: "desktop", // "desktop" | "mobile"
  });

  // Theme-sensitive styling tokens
  const themeTokens = useMemo(() => ({
    text: isDark ? "#F7F3EE" : "#0D2B45",
    subtext: isDark ? "rgba(247, 243, 238, 0.65)" : "rgba(13, 43, 69, 0.72)",
    muted: isDark ? "rgba(247, 243, 238, 0.45)" : "rgba(13, 43, 69, 0.52)",
    cardBg: isDark ? "#0D2B45" : "#FFFFFF",
    cardBorder: isDark ? "rgba(247, 243, 238, 0.1)" : "rgba(13, 43, 69, 0.08)",
    cardShadow: isDark ? "0 16px 40px rgba(0,0,0,0.22)" : "0 4px 20px rgba(13, 43, 69, 0.06)",
    editorBg: isDark ? "#081C2E" : "#FBF9F6",
    toolbarBg: isDark ? "rgba(247, 243, 238, 0.04)" : "#F2EDE4",
    borderSubtle: isDark ? "rgba(247, 243, 238, 0.08)" : "rgba(13, 43, 69, 0.08)",
  }), [isDark]);

  // Content word and character metrics
  const textStats = useMemo(() => {
    const raw = (content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return {
      words: raw ? raw.split(" ").length : 0,
      chars: raw.length,
    };
  }, [content]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await adminApiRequest(endpoint);
        if (cancelled) return;
        setDocumentState(response);
        setTitle(response.title || defaultTitle);
        setVersionName(response.version || "v1");
        setContent(response.html_content || "");
        setFilename(response.filename || "");
        setMarkets(Array.isArray(response.applies_to) && response.applies_to.length ? response.applies_to : ["ALL"]);
        setNotificationBehavior(response.notification_behavior || "silent");

        if (response.effective_at) {
          const effectiveDate = new Date(response.effective_at);
          const publishedDate = new Date(response.published_at || response.updated_at || Date.now());
          const diffDays = Math.round((effectiveDate.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays >= 8 && diffDays <= 12) {
            setEffectiveMode("ten_days");
          } else if (diffDays > 0) {
            setEffectiveMode("specific");
            setSpecificDate(toDateInputValue(effectiveDate));
          } else {
            setEffectiveMode("now");
          }
        } else {
          setEffectiveMode("now");
        }
      } catch (err) {
        console.error(`Failed to load ${pageTitle}:`, err);
        if (!cancelled) message.error(`Failed to load ${pageTitle}`);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [defaultTitle, endpoint, pageTitle]);

  const toggleMarket = (value) => {
    setMarkets((current) => {
      if (value === "ALL") return ["ALL"];
      const withoutAll = current.filter((item) => item !== "ALL");
      const next = withoutAll.includes(value)
        ? withoutAll.filter((item) => item !== value)
        : [...withoutAll, value];
      return next.length ? next : ["ALL"];
    });
  };

  const calculateEffectiveAt = () => {
    if (effectiveMode === "ten_days") {
      const date = new Date();
      date.setDate(date.getDate() + 10);
      return date.toISOString();
    }
    if (effectiveMode === "specific") {
      const parsed = new Date(`${specificDate}T00:00:00Z`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      return new Date().toISOString();
    }
    return new Date().toISOString();
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = await readLegalDocumentFile(file);
      setTitle(imported.title || defaultTitle);
      setContent(imported.html);
      setFilename(imported.filename || file.name);
      message.success(`Imported "${file.name}" into editor.`);
    } catch (err) {
      message.error(err.message || "Failed to import document");
    }
  };

  const handlePublish = async () => {
    const strippedContent = content.replace(/<[^>]+>/g, "").trim();
    if (!title.trim() || !strippedContent) {
      message.error("Please add a title and document content before publishing.");
      return;
    }
    setIsPublishing(true);
    try {
      const effectiveTimestamp = calculateEffectiveAt();
      const response = await adminApiRequest(endpoint, {
        method: "PUT",
        body: {
          title: title.trim(),
          version: versionName.trim() || undefined,
          html_content: content,
          filename: filename || "Editor content",
          applies_to: markets,
          notification_behavior: enableNotifications ? notificationBehavior : "silent",
          effective_at: effectiveTimestamp,
        },
      });
      setDocumentState(response);
      setVersionName(response.version || "");
      message.success(`${pageTitle} (${response.version || "new version"}) successfully published!`);
    } catch (err) {
      console.error(`Failed to publish ${pageTitle}:`, err);
      message.error(err.message || `Failed to publish ${pageTitle}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // View Active Document
  const handleOpenCurrentPreview = () => {
    setPreviewModal({
      isOpen: true,
      title: title || documentState?.title || defaultTitle,
      html: content || documentState?.html_content || "",
      version: versionName || documentState?.version || "v1",
      filename: filename || documentState?.filename || "Editor content",
      publishedAt: documentState?.published_at || documentState?.updated_at || new Date().toISOString(),
      effectiveAt: calculateEffectiveAt(),
      appliesTo: markets,
      deviceMode: "desktop",
    });
  };

  // Download Active Document
  const handleDownloadCurrent = () => {
    downloadDocumentFile({
      filename: documentState?.filename || filename,
      title: documentState?.title || title || defaultTitle,
      version: versionName || documentState?.version || "v1",
      publishedAt: documentState?.published_at || documentState?.updated_at,
      effectiveAt: documentState?.effective_at || calculateEffectiveAt(),
      appliesTo: documentState?.applies_to || markets,
      htmlContent: documentState?.html_content || content,
    });
  };

  const isScheduledEffective = useMemo(() => {
    if (!documentState?.effective_at) return false;
    const eff = new Date(documentState.effective_at).getTime();
    return eff > Date.now();
  }, [documentState?.effective_at]);

  // Executive Page Stats (matching ClaudeAdminTable pageStats design)
  const pageStats = useMemo(() => [
    {
      k: "DOCUMENT STATUS",
      v: documentState?.status || "Published",
      note: "Live on user mobile app",
      pill: true,
      pillColor: "#10B981",
    },
    {
      k: "ACTIVE VERSION",
      v: documentState?.version || versionName || "v1",
      note: "Custom version identifier",
      mono: true,
    },
    {
      k: "REGIONAL SCOPE",
      v: markets.includes("ALL") ? "All Markets" : `${markets.length} Selected`,
      note: markets.includes("ALL") ? "Worldwide reach" : markets.join(", "),
    },
    {
      k: "ENFORCEABLE DATE",
      v: formatDate(documentState?.effective_at || calculateEffectiveAt()),
      note: isScheduledEffective ? "Scheduled future notice" : "Currently in effect",
    },
  ], [documentState, versionName, markets, isScheduledEffective]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: themeTokens.text,
      }}
      className="animate-in fade-in duration-200 min-h-full px-4 py-6 md:px-8"
    >
      <style>{`
        .legal-editor .ql-toolbar {
          border-color: ${themeTokens.borderSubtle};
          background: ${themeTokens.toolbarBg};
          border-radius: 12px 12px 0 0;
          padding: 12px 16px;
        }
        .legal-editor .ql-container {
          min-height: 480px;
          border-color: ${themeTokens.borderSubtle};
          background: ${themeTokens.editorBg};
          color: ${themeTokens.text};
          border-radius: 0 0 12px 12px;
          font-size: 15px;
          line-height: 1.75;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .legal-editor .ql-editor {
          min-height: 480px;
          color: ${themeTokens.text};
          padding: 24px 28px;
        }
        .legal-editor .ql-editor.ql-blank::before {
          color: ${themeTokens.muted};
          font-style: normal;
        }
        .legal-editor .ql-picker,
        .legal-editor .ql-stroke {
          color: ${themeTokens.text};
          stroke: ${themeTokens.text};
        }
        .legal-editor .ql-fill {
          fill: ${themeTokens.text};
        }
        .legal-editor .ql-picker-options {
          background: ${themeTokens.cardBg};
          border-color: ${themeTokens.borderSubtle};
        }
        .legal-editor .ql-picker-item:hover {
          color: #C9943A;
        }
        .legal-preview-content h1 { font-size: 24px; font-weight: 700; margin: 24px 0 12px; border-bottom: 1px solid rgba(247,243,238,0.1); padding-bottom: 8px; }
        .legal-preview-content h2 { font-size: 19px; font-weight: 700; color: #C9943A; margin: 20px 0 10px; }
        .legal-preview-content h3 { font-size: 16.5px; font-weight: 600; margin: 16px 0 8px; }
        .legal-preview-content p { margin-bottom: 14px; line-height: 1.75; color: rgba(247,243,238,0.88); font-size: 15px; }
        .legal-preview-content ul, .legal-preview-content ol { margin-left: 24px; margin-bottom: 14px; }
        .legal-preview-content li { margin-bottom: 6px; color: rgba(247,243,238,0.88); }
        .legal-preview-content blockquote { border-left: 3px solid #C9943A; padding-left: 16px; margin: 16px 0; color: rgba(247,243,238,0.7); font-style: italic; background: rgba(201,148,58,0.06); padding: 12px 16px; border-radius: 0 8px 8px 0; }
        .legal-preview-content a { color: #C9943A; text-decoration: underline; }
      `}</style>

      {/* Page Header: Title, Subtitle, and Primary/Secondary Action Buttons */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-5 border-b border-[#F7F3EE]/8 pb-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#F7F3EE]/15 bg-[#F7F3EE]/5 text-[#F7F3EE] transition hover:border-[#C9943A]/70 hover:text-[#C9943A]"
            aria-label="Go back"
            title="Go back"
          >
            <IoChevronBack className="h-6 w-6" />
          </button>
          <div>
            <div style={{ font: "500 10px 'DM Sans', sans-serif", letterSpacing: ".18em", color: "#C9943A", marginBottom: "6px", textTransform: "uppercase" }}>
              LEGAL & COMPLIANCE CONSOLE
            </div>
            <h1 style={{ margin: "0 0 6px", font: "600 32px/1.1 'Clash Display', 'DM Sans', sans-serif", color: themeTokens.text, letterSpacing: "-.015em" }}>
              {pageTitle}
            </h1>
            <p style={{ margin: 0, maxWidth: "640px", font: "400 14px/1.6 'Inter', sans-serif", color: themeTokens.subtext }}>
              Manage legal document authoring, regional market applicability, notice periods, and user-facing publication.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadCurrent}
            className="flex h-11 items-center gap-2 rounded-xl border border-[#F7F3EE]/15 bg-[#F7F3EE]/5 px-4 text-xs font-bold text-[#F7F3EE] transition hover:border-[#C9943A]/70 hover:text-[#C9943A]"
            title="Export this document as standalone HTML"
          >
            <IoDownloadOutline className="h-4 w-4" />
            <span>Export HTML</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCurrentPreview}
            className="flex h-11 items-center gap-2 rounded-xl border border-[#F7F3EE]/15 bg-[#F7F3EE]/5 px-4 text-xs font-bold text-[#F7F3EE] transition hover:border-[#C9943A]/70 hover:text-[#C9943A]"
            title="Interactive Preview in Desktop and Mobile views"
          >
            <IoEyeOutline className="h-4 w-4" />
            <span>Preview Document</span>
          </button>
          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublish}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#C9943A] px-5 text-xs font-black text-[#0D0D0D] shadow-[0_10px_28px_rgba(201,148,58,0.18)] transition hover:bg-[#D6A64A] disabled:opacity-50"
          >
            {isPublishing ? (
              <>
                <Spin size="small" />
                <span>Publishing...</span>
              </>
            ) : (
              <span>Publish New Version</span>
            )}
          </button>
        </div>
      </div>

      {/* Executive Stat Cards Row (matching ClaudeAdminTable pageStats) */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pageStats.map((stat, idx) => (
          <div
            key={stat.k || idx}
            style={{
              background: themeTokens.cardBg,
              borderRadius: "18px",
              borderLeft: "4px solid #C9943A",
              border: `1px solid ${themeTokens.cardBorder}`,
              boxShadow: themeTokens.cardShadow,
              padding: "16px 18px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ font: "500 9.5px 'DM Sans', sans-serif", letterSpacing: ".14em", color: themeTokens.muted, marginBottom: "8px", textTransform: "uppercase" }}>
              {stat.k}
            </div>
            <div
              style={{
                font: stat.mono ? "700 24px/1 'JetBrains Mono', monospace" : "700 22px/1 'Clash Display', 'DM Sans', sans-serif",
                color: themeTokens.text,
              }}
              className="flex items-center gap-2"
            >
              {stat.pill && (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              )}
              <span>{stat.v}</span>
            </div>
            <div style={{ font: "400 12px/1.4 'Inter', sans-serif", color: themeTokens.subtext, marginTop: "7px" }}>
              {stat.note}
            </div>
          </div>
        ))}
      </div>

      {/* Main Studio Layout: Left Configuration Inspector + Right Rich Editor Studio */}
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Left Column Inspector & Configuration */}
        <aside className="space-y-4">
          {/* Active Version Overview Card */}
          <section
            style={{
              background: themeTokens.cardBg,
              border: `1px solid ${themeTokens.cardBorder}`,
              boxShadow: themeTokens.cardShadow,
            }}
            className="rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IoShieldCheckmarkOutline className="h-4 w-4 text-[#C9943A]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">
                  Active Publication
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#C9943A]/15 px-2.5 py-0.5 text-xs font-bold text-[#C9943A]">
                <IoCheckmarkCircle className="h-3.5 w-3.5" />
                {documentState?.version || versionName || "v1"}
              </span>
            </div>

            <h3 className="mt-3 text-lg font-bold" style={{ color: themeTokens.text }}>
              {documentState?.title || defaultTitle}
            </h3>

            <div className="mt-4 divide-y divide-[#F7F3EE]/6 text-xs" style={{ color: themeTokens.subtext }}>
              <div className="flex justify-between py-2.5">
                <span>Publication Status</span>
                <strong className="text-emerald-400 font-semibold">{documentState?.status || "Published"}</strong>
              </div>
              <div className="flex justify-between py-2.5">
                <span>Version Identifier</span>
                <strong style={{ color: themeTokens.text }}>{documentState?.version || versionName || "v1"}</strong>
              </div>
              <div className="flex justify-between py-2.5">
                <span>Import Source</span>
                <strong className="max-w-[170px] truncate text-right" style={{ color: themeTokens.text }} title={documentState?.filename || "Editor content"}>
                  {documentState?.filename || "Editor content"}
                </strong>
              </div>
              <div className="flex justify-between py-2.5">
                <span>Published On</span>
                <strong style={{ color: themeTokens.text }}>{formatDate(documentState?.published_at || documentState?.updated_at)}</strong>
              </div>
              <div className="flex justify-between py-2.5">
                <span>Effective Date</span>
                <span className="text-right">
                  <strong style={{ color: themeTokens.text }}>{formatDate(documentState?.effective_at)}</strong>
                  {isScheduledEffective && (
                    <span className="ml-1 text-[10px] font-bold text-[#C9943A]">(Scheduled)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span>Market Scope</span>
                <strong style={{ color: themeTokens.text }}>{(documentState?.applies_to || ["ALL"]).join(", ")}</strong>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleDownloadCurrent}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C9943A] px-3 py-2.5 text-xs font-black text-[#0D0D0D] transition hover:bg-[#D6A64A]"
              >
                <IoDownloadOutline className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCurrentPreview}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#F7F3EE]/15 bg-[#081C2E] px-3 py-2.5 text-xs font-bold text-[#F7F3EE] transition hover:border-[#C9943A]/70 hover:text-[#C9943A]"
              >
                <IoEyeOutline className="h-4 w-4" />
                <span>View</span>
              </button>
            </div>
          </section>

          {/* Regional Market Scope */}
          <section
            style={{
              background: themeTokens.cardBg,
              border: `1px solid ${themeTokens.cardBorder}`,
              boxShadow: themeTokens.cardShadow,
            }}
            className="rounded-2xl p-5"
          >
            <div className="flex items-center gap-2">
              <IoGlobeOutline className="h-4 w-4 text-[#C9943A]" />
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">
                Applies To (Market Scope)
              </div>
            </div>
            <p className="mt-1 text-xs" style={{ color: themeTokens.subtext }}>
              Select regional jurisdiction for legal applicability.
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {MARKET_OPTIONS.map((option) => {
                const isSelected = markets.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleMarket(option.value)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                      isSelected
                        ? "border-[#C9943A] bg-[#C9943A] text-[#0D0D0D] shadow-sm"
                        : "border-[#F7F3EE]/15 bg-[#081C2E]/60 text-[#F7F3EE]/75 hover:border-[#C9943A]/70 hover:text-[#F7F3EE]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Effective Date Configuration */}
          <section
            style={{
              background: themeTokens.cardBg,
              border: `1px solid ${themeTokens.cardBorder}`,
              boxShadow: themeTokens.cardShadow,
            }}
            className="rounded-2xl p-5"
          >
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="h-4 w-4 text-[#C9943A]" />
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">
                Enforceability & Effective Date
              </div>
            </div>
            <p className="mt-1 text-xs" style={{ color: themeTokens.subtext }}>
              Set when this revision becomes enforceable.
            </p>
            <div className="mt-3.5 space-y-3 text-xs font-semibold" style={{ color: themeTokens.text }}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 transition hover:bg-[#F7F3EE]/5">
                <input
                  className="accent-[#C9943A]"
                  type="radio"
                  name="effectiveMode"
                  checked={effectiveMode === "now"}
                  onChange={() => setEffectiveMode("now")}
                />
                <span>Effective immediately upon publish</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 transition hover:bg-[#F7F3EE]/5">
                <input
                  className="accent-[#C9943A]"
                  type="radio"
                  name="effectiveMode"
                  checked={effectiveMode === "ten_days"}
                  onChange={() => setEffectiveMode("ten_days")}
                />
                <span>Effective after 10-day notice period</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 transition hover:bg-[#F7F3EE]/5">
                <input
                  className="accent-[#C9943A]"
                  type="radio"
                  name="effectiveMode"
                  checked={effectiveMode === "specific"}
                  onChange={() => setEffectiveMode("specific")}
                />
                <span>Specific future date</span>
              </label>

              {effectiveMode === "specific" && (
                <div className="pt-1.5 pl-6">
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(event) => setSpecificDate(event.target.value)}
                    className="w-full rounded-xl border border-[#F7F3EE]/15 bg-[#081C2E] px-3 py-2 text-xs text-[#F7F3EE] outline-none focus:border-[#C9943A]"
                  />
                </div>
              )}
            </div>
          </section>

          {/* On Publish Notifications (if enabled) */}
          {enableNotifications && (
            <section
              style={{
                background: themeTokens.cardBg,
                border: `1px solid ${themeTokens.cardBorder}`,
                boxShadow: themeTokens.cardShadow,
              }}
              className="rounded-2xl p-5"
            >
              <div className="flex items-center gap-2">
                <IoNotificationsOutline className="h-4 w-4 text-[#C9943A]" />
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9943A]">
                  Publication Broadcast
                </div>
              </div>
              <div className="mt-3.5 space-y-2.5">
                {NOTIFICATION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent p-2 transition hover:bg-[#081C2E]/60"
                  >
                    <input
                      type="radio"
                      name="notificationBehavior"
                      checked={notificationBehavior === option.value}
                      onChange={() => setNotificationBehavior(option.value)}
                      className="mt-0.5 accent-[#C9943A]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold" style={{ color: themeTokens.text }}>
                        {option.label}
                      </div>
                      <div className="text-[11px]" style={{ color: themeTokens.muted }}>
                        {option.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Right Column: Rich Document Studio */}
        <main className="space-y-4">
          <section
            style={{
              background: themeTokens.cardBg,
              border: `1px solid ${themeTokens.cardBorder}`,
              boxShadow: themeTokens.cardShadow,
            }}
            className="rounded-2xl p-6"
          >
            {/* Studio Header: Compact Document Import Bar */}
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[#F7F3EE]/12 bg-[#F7F3EE]/4 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#C9943A]/15 text-[#C9943A]">
                  <IoCloudUploadOutline className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: themeTokens.text }}>
                    Import External File (HTML, Markdown, Plain Text)
                  </div>
                  <div className="text-[11px]" style={{ color: themeTokens.subtext }}>
                    {filename ? (
                      <span className="font-semibold text-[#C9943A]">Imported: {filename}</span>
                    ) : (
                      "Parses headings, lists, bold, italics and links automatically into editor"
                    )}
                  </div>
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#C9943A] px-3.5 py-2 text-xs font-black text-[#0D0D0D] transition hover:bg-[#D6A64A]">
                <IoDocumentTextOutline className="h-4 w-4" />
                <span>Choose File</span>
                <input
                  type="file"
                  accept={LEGAL_DOCUMENT_ACCEPT}
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Document Title & Version Name Inputs */}
            <div className="mb-5 grid gap-4 sm:grid-cols-[1fr_200px]">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: themeTokens.muted }}>
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-[#F7F3EE]/15 bg-[#081C2E] px-4 py-3 text-base font-bold outline-none placeholder:text-[#F7F3EE]/30 focus:border-[#C9943A]"
                  style={{ color: themeTokens.text }}
                  placeholder={defaultTitle}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: themeTokens.muted }}>
                  Version Identifier
                </label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(event) => setVersionName(event.target.value)}
                  className="w-full rounded-xl border border-[#F7F3EE]/15 bg-[#081C2E] px-4 py-3 text-base font-bold text-[#C9943A] outline-none placeholder:text-[#F7F3EE]/30 focus:border-[#C9943A]"
                  placeholder="e.g. v1.0.1, v2.0"
                />
              </div>
            </div>

            {/* Rich Text Editor */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: themeTokens.muted }}>
                  Document Body Content
                </label>
                <span className="text-[11px]" style={{ color: themeTokens.muted }}>
                  {textStats.words.toLocaleString()} words · {textStats.chars.toLocaleString()} characters
                </span>
              </div>
              <div className="legal-editor">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={QUILL_MODULES}
                  placeholder={`Draft or edit your ${pageTitle.toLowerCase()} here...`}
                />
              </div>
            </div>

            {/* Studio Bottom Action Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#F7F3EE]/10 pt-5">
              <div className="text-xs" style={{ color: themeTokens.muted }}>
                Last revised version: <strong style={{ color: themeTokens.text }}>{versionName || documentState?.version || "v1"}</strong>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenCurrentPreview}
                  className="flex items-center gap-1.5 rounded-xl border border-[#F7F3EE]/15 bg-[#081C2E] px-4 py-2.5 text-xs font-bold text-[#F7F3EE] transition hover:border-[#C9943A]/70 hover:text-[#C9943A]"
                >
                  <IoEyeOutline className="h-4 w-4" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublish}
                  className="flex items-center gap-2 rounded-xl bg-[#C9943A] px-5 py-2.5 text-xs font-black text-[#0D0D0D] shadow-[0_10px_28px_rgba(201,148,58,0.18)] transition hover:bg-[#D6A64A] disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Spin size="small" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish New Version</span>
                  )}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Luxury In-App Document Preview Modal (Desktop & Mobile Simulation) */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-[#F7F3EE]/15 bg-[#0D2B45] shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F7F3EE]/10 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C9943A]">Document Preview</span>
                  <span className="rounded bg-[#C9943A]/15 px-2 py-0.5 text-xs font-bold text-[#C9943A]">
                    {previewModal.version}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-[#F7F3EE]">{previewModal.title}</h3>
              </div>

              {/* View Controls & Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Device Mode Switcher */}
                <div className="flex rounded-lg border border-[#F7F3EE]/15 bg-[#081C2E] p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewModal((prev) => ({ ...prev, deviceMode: "desktop" }))}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      previewModal.deviceMode === "desktop"
                        ? "bg-[#C9943A] text-[#0D0D0D]"
                        : "text-[#F7F3EE]/70 hover:text-[#F7F3EE]"
                    }`}
                  >
                    <IoDesktopOutline className="h-3.5 w-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewModal((prev) => ({ ...prev, deviceMode: "mobile" }))}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      previewModal.deviceMode === "mobile"
                        ? "bg-[#C9943A] text-[#0D0D0D]"
                        : "text-[#F7F3EE]/70 hover:text-[#F7F3EE]"
                    }`}
                  >
                    <IoPhonePortraitOutline className="h-3.5 w-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>

                {/* Open In New Tab */}
                <button
                  type="button"
                  onClick={() => openInNewTabDocument({
                    title: previewModal.title,
                    version: previewModal.version,
                    publishedAt: previewModal.publishedAt,
                    effectiveAt: previewModal.effectiveAt,
                    appliesTo: previewModal.appliesTo,
                    htmlContent: previewModal.html,
                  })}
                  className="flex items-center gap-1 rounded-lg border border-[#F7F3EE]/15 bg-[#081C2E] px-3 py-1.5 text-xs font-semibold text-[#F7F3EE] hover:border-[#C9943A]/70 hover:text-[#C9943A]"
                  title="Open in standalone browser window"
                >
                  <IoOpenOutline className="h-3.5 w-3.5" />
                  <span>Open in Tab</span>
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() => downloadDocumentFile({
                    filename: previewModal.filename,
                    title: previewModal.title,
                    version: previewModal.version,
                    publishedAt: previewModal.publishedAt,
                    effectiveAt: previewModal.effectiveAt,
                    appliesTo: previewModal.appliesTo,
                    htmlContent: previewModal.html,
                  })}
                  className="flex items-center gap-1 rounded-lg bg-[#C9943A] px-3 py-1.5 text-xs font-bold text-[#0D0D0D] hover:bg-[#D6A64A]"
                  title="Download HTML file"
                >
                  <IoDownloadOutline className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-[#F7F3EE]/15 bg-[#081C2E] text-[#F7F3EE] transition hover:bg-[#F7F3EE]/10"
                >
                  <IoClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-6">
              {previewModal.deviceMode === "desktop" ? (
                <div className="mx-auto max-w-3xl rounded-xl border border-[#F7F3EE]/10 bg-[#081C2E] p-8 shadow-inner">
                  {/* Meta Bar */}
                  <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-[#F7F3EE]/10 bg-[#0D2B45] p-3 text-xs">
                    <div>
                      <span className="text-[#F7F3EE]/50">Version: </span>
                      <strong className="text-[#F7F3EE]">{previewModal.version}</strong>
                    </div>
                    <div>
                      <span className="text-[#F7F3EE]/50">Scope: </span>
                      <strong className="text-[#F7F3EE]">{previewModal.appliesTo.join(", ")}</strong>
                    </div>
                    <div>
                      <span className="text-[#F7F3EE]/50">Published: </span>
                      <strong className="text-[#F7F3EE]">{formatDate(previewModal.publishedAt)}</strong>
                    </div>
                    <div>
                      <span className="text-[#F7F3EE]/50">Effective: </span>
                      <strong className="text-[#F7F3EE]">{formatDate(previewModal.effectiveAt)}</strong>
                    </div>
                  </div>

                  <div
                    className="legal-preview-content"
                    dangerouslySetInnerHTML={{ __html: previewModal.html || "<p class='text-muted'>No content drafted.</p>" }}
                  />
                </div>
              ) : (
                /* Mobile Device Simulation Frame */
                <div className="mx-auto flex justify-center py-4">
                  <div className="w-[375px] rounded-[36px] border-[6px] border-[#2A374A] bg-[#0D0D0D] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                    {/* Simulated Notch / Island */}
                    <div className="mx-auto mb-4 h-4 w-28 rounded-full bg-[#1A2536]" />

                    {/* App Header */}
                    <div className="mb-4 border-b border-[#F7F3EE]/10 pb-3">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#C9943A]">VICTORY FITNESS</div>
                      <h4 className="text-base font-bold text-[#F7F3EE]">{previewModal.title}</h4>
                      <div className="mt-1 text-[11px] text-[#F7F3EE]/50">
                        {previewModal.version} · Effective: {formatDate(previewModal.effectiveAt)}
                      </div>
                    </div>

                    {/* Mobile Scrollable Content */}
                    <div
                      className="legal-preview-content max-h-[500px] overflow-y-auto text-xs pr-1"
                      dangerouslySetInnerHTML={{ __html: previewModal.html || "<p>No content drafted.</p>" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
